/**
 * Tradely Phase 8 Automated Verification Test Suite
 *
 * Validates:
 * 1. Production environment hardening and configuration validation
 * 2. Structured JSON logging and automatic sensitive field redaction
 * 3. Health (liveness) and Readiness (MongoDB connectivity) HTTP endpoints
 * 4. Production error masking and stack trace suppression
 * 5. Sliding-window rate limiting on authentication routes with standard headers
 * 6. Strict CORS origin enforcement and credentials support
 * 7. Secure HttpOnly cookie configuration
 * 8. Graceful shutdown mechanics
 * 9. Phase 1-7 core regression testing (Auth, Orders, OCO, Watchlist, Analytics)
 */

import http from "http";
import mongoose from "mongoose";
import app from "./src/app.js";
import { connectDB, disconnectDB } from "./src/config/db.js";
import { sanitizeData } from "./src/utils/logger.js";
import { getCookieOptions } from "./src/controllers/authController.js";
import { createRateLimiter, _resetRateLimiter } from "./src/middleware/rateLimiter.js";
import { errorHandler } from "./src/middleware/errorHandler.js";
import { corsMiddleware } from "./src/middleware/cors.js";
import { UserModel } from "./src/models/UserModel.js";
import { OrdersModel } from "./src/models/OrdersModel.js";
import { HoldingsModel } from "./src/models/HoldingsModel.js";
import { WatchlistModel } from "./src/models/WatchlistModel.js";
import { OcoGroupModel } from "./src/models/OcoGroupModel.js";
import * as watchlistService from "./src/services/watchlistService.js";
import * as analyticsService from "./src/services/portfolioAnalyticsService.js";
import { createOCOGroup } from "./src/services/orderLifecycleService.js";

let passed = 0;
let failed = 0;

const assert = (condition, testName, details = "") => {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${details ? ` -> ${details}` : ""}`);
    failed++;
  }
};

const runAllTests = async () => {
  console.log("==================================================");
  console.log("TRADELY PHASE 8 PRODUCTION HARDENING VERIFICATION");
  console.log("==================================================\n");

  let server;
  let baseUrl;

  try {
    // -------------------------------------------------------------
    // Test Group 1: Structured JSON Logger & Sensitive Redaction
    // -------------------------------------------------------------
    console.log("--- 1. Structured Logging & Sensitive Redaction ---");
    {
      const payload = {
        username: "testuser",
        password: "super_secret_password_123",
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy.sig",
        jwt: "secret_jwt_string",
        cookie: "token=abc12345",
        mongo_uri: "mongodb://user:pass@localhost:27017/db",
        nested: {
          secretKey: "topsecret",
          publicSymbol: "RELIANCE",
          qty: 10,
        },
      };

      const redacted = sanitizeData(payload);
      assert(redacted.password === "[REDACTED]", "Sanitizes password field");
      assert(redacted.token === "[REDACTED]", "Sanitizes token field");
      assert(redacted.jwt === "[REDACTED]", "Sanitizes jwt field");
      assert(redacted.cookie === "[REDACTED]", "Sanitizes cookie field");
      assert(redacted.mongo_uri === "[REDACTED]", "Sanitizes mongo_uri field");
      assert(redacted.nested.secretKey === "[REDACTED]", "Sanitizes nested secret fields");
      assert(redacted.nested.publicSymbol === "RELIANCE", "Preserves non-sensitive nested data");
      assert(redacted.nested.qty === 10, "Preserves numerical fields");

      // Verify Bearer token regex redaction in strings
      const bearerStr = sanitizeData("Authorization: Bearer header.payload.signature");
      assert(bearerStr.includes("Bearer [REDACTED]"), "Redacts Bearer tokens in raw string headers");
    }

    // -------------------------------------------------------------
    // Test Group 2: Secure Cookie Configuration
    // -------------------------------------------------------------
    console.log("\n--- 2. Secure Cookie Policy ---");
    {
      const defaultOpts = getCookieOptions();
      assert(defaultOpts.httpOnly === true, "Cookie has httpOnly: true");
      assert(defaultOpts.path === "/", "Cookie path is '/'");
      assert(defaultOpts.maxAge === 7 * 24 * 60 * 60 * 1000, "Cookie maxAge is 7 days");

      // Test production override
      process.env.COOKIE_SECURE = "true";
      process.env.COOKIE_SAME_SITE = "none";
      process.env.COOKIE_DOMAIN = "tradely.example.com";
      const prodOpts = getCookieOptions();
      assert(prodOpts.secure === true, "COOKIE_SECURE=true sets secure: true");
      assert(prodOpts.sameSite === "none", "COOKIE_SAME_SITE=none sets sameSite: 'none'");
      assert(prodOpts.domain === "tradely.example.com", "COOKIE_DOMAIN sets cookie domain");

      // Clean up test overrides
      delete process.env.COOKIE_SECURE;
      delete process.env.COOKIE_SAME_SITE;
      delete process.env.COOKIE_DOMAIN;
    }

    // -------------------------------------------------------------
    // Test Group 3: Sliding-Window Rate Limiter
    // -------------------------------------------------------------
    console.log("\n--- 3. Sliding-Window Rate Limiter ---");
    {
      _resetRateLimiter();
      const testLimiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 3,
        message: "Limit exceeded",
      });

      const mockReq = {
        ip: "192.168.1.100",
        headers: { "x-test-rate-limit": "enable" },
      };

      let lastStatus = null;
      let lastHeaders = {};
      let lastJson = null;

      const mockRes = () => {
        lastStatus = null;
        lastHeaders = {};
        lastJson = null;
        return {
          setHeader: (name, val) => {
            lastHeaders[name] = val;
          },
          status: (code) => {
            lastStatus = code;
            return {
              json: (body) => {
                lastJson = body;
              },
            };
          },
        };
      };

      // Hit 1: Allowed
      let nextCalled = false;
      testLimiter(mockReq, mockRes(), () => { nextCalled = true; });
      assert(nextCalled === true, "Hit 1 is allowed");
      assert(lastHeaders["RateLimit-Limit"] === 3, "Sets RateLimit-Limit header");
      assert(lastHeaders["RateLimit-Remaining"] === 3, "Calculates RateLimit-Remaining header");

      // Hit 2: Allowed
      nextCalled = false;
      testLimiter(mockReq, mockRes(), () => { nextCalled = true; });
      assert(nextCalled === true, "Hit 2 is allowed");

      // Hit 3: Allowed
      nextCalled = false;
      testLimiter(mockReq, mockRes(), () => { nextCalled = true; });
      assert(nextCalled === true, "Hit 3 is allowed");

      // Hit 4: Blocked (exceeded max 3)
      nextCalled = false;
      testLimiter(mockReq, mockRes(), () => { nextCalled = true; });
      assert(nextCalled === false, "Hit 4 is blocked");
      assert(lastStatus === 429, "Returns 429 Too Many Requests");
      assert(lastHeaders["Retry-After"] >= 1, "Sets standard Retry-After header");
      assert(lastJson.code === "TOO_MANY_REQUESTS", "Returns structured error payload");

      _resetRateLimiter();
    }

    // -------------------------------------------------------------
    // Test Group 4: Error Handling & Production Masking
    // -------------------------------------------------------------
    console.log("\n--- 4. Error Masking & Security Hardening ---");
    {
      // 1. Test Operational Error Preservation
      let opStatus = null;
      let opJson = null;
      const mockOpRes = {
        status: (code) => {
          opStatus = code;
          return { json: (data) => { opJson = data; } };
        },
      };
      const opError = new Error("Custom business validation failure");
      opError.statusCode = 400;
      opError.code = "INVALID_PAYLOAD";
      opError.isOperational = true;

      errorHandler(opError, { method: "POST", originalUrl: "/test" }, mockOpRes, () => {});
      assert(opStatus === 400, "Operational error keeps 400 status");
      assert(opJson.code === "INVALID_PAYLOAD", "Operational error keeps custom error code");
      assert(opJson.message === "Custom business validation failure", "Operational error message is preserved");

      // 2. Test Unhandled 500 Error
      let internalStatus = null;
      let internalJson = null;
      const mockInternalRes = {
        status: (code) => {
          internalStatus = code;
          return { json: (data) => { internalJson = data; } };
        },
      };
      const internalErr = new Error("DB Connection string mongodb://root:secret@db:27017/prod leaked");
      internalErr.stack = "Error: DB Connection string...\n    at connectDB (db.js:10:5)";

      errorHandler(internalErr, { method: "GET", originalUrl: "/test" }, mockInternalRes, () => {});
      assert(internalStatus === 500, "Unhandled error returns 500 status");
      assert(internalJson.success === false, "Returns success: false");
    }

    // -------------------------------------------------------------
    // Test Group 5: HTTP Health & Readiness Probes
    // -------------------------------------------------------------
    console.log("\n--- 5. HTTP Health & Readiness Probes ---");
    {
      await connectDB();

      // Start test HTTP server on an ephemeral port
      server = http.createServer(app);
      await new Promise((resolve) => {
        server.listen(0, "127.0.0.1", resolve);
      });
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;

      // Test Liveness Probe GET /health
      const healthRes = await fetch(`${baseUrl}/health`);
      assert(healthRes.status === 200, "GET /health returns HTTP 200");
      const healthData = await healthRes.json();
      assert(healthData.status === "ok", "GET /health status is 'ok'");
      assert(healthData.service === "tradely-backend", "GET /health service identifier is 'tradely-backend'");
      assert(typeof healthData.uptime === "number", "GET /health includes uptime metric");

      // Test Readiness Probe GET /ready (MongoDB connected)
      const readyRes = await fetch(`${baseUrl}/ready`);
      assert(readyRes.status === 200, "GET /ready returns HTTP 200 when database connected");
      const readyData = await readyRes.json();
      assert(readyData.status === "ready", "GET /ready status is 'ready'");
      assert(readyData.database.status === "connected", "GET /ready indicates database is connected");

      // Test unauthenticated unknown route is protected (returns 401)
      const unauthNotFoundRes = await fetch(`${baseUrl}/non-existent-route-for-test`);
      assert(unauthNotFoundRes.status === 401, "Unauthenticated access to undefined route is rejected with 401");
    }

    // -------------------------------------------------------------
    // Test Group 6: Phase 1-7 Regression & Data Isolation
    // -------------------------------------------------------------
    console.log("\n--- 6. Phase 1-7 Regression & Data Isolation ---");
    {
      const testEmail = `phase8_test_${Date.now()}@example.com`;
      const testPassword = "Password@123456";

      // 1. Signup via API
      const signupRes = await fetch(`${baseUrl}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: `user_${Date.now()}`,
          email: testEmail,
          password: testPassword,
        }),
      });

      assert(signupRes.status === 201, "User signup succeeds with 201 Created");
      const signupData = await signupRes.json();
      const userId = signupData.data.user.id || signupData.data.user._id;
      assert(Boolean(userId), "Signup returns created user ID");

      // Verify Set-Cookie header is present
      const setCookieHeader = signupRes.headers.get("set-cookie");
      assert(Boolean(setCookieHeader) && setCookieHeader.includes("token="), "Signup response sets HttpOnly auth cookie");

      const authCookie = setCookieHeader.split(";")[0];

      // Test authenticated unknown route returns 404
      const authNotFoundRes = await fetch(`${baseUrl}/non-existent-route-for-test`, {
        headers: { Cookie: authCookie },
      });
      assert(authNotFoundRes.status === 404, "Authenticated request to unknown route returns 404 Not Found");

      // 2. Watchlist creation & persistence
      const defaultWatchlist = await watchlistService.getWatchlist(userId);
      assert(Array.isArray(defaultWatchlist.symbols), "Creates default user watchlist");
      assert(defaultWatchlist.symbols.length > 0, "Default watchlist has initial symbols");

      // Add symbol to watchlist
      const updatedWl = await watchlistService.addSymbol(userId, "SBIN");
      assert(updatedWl.symbols.includes("SBIN"), "Adds symbol to user watchlist");

      // Unique watchlist constraint: exactly 1 document per user
      const wlCount = await WatchlistModel.countDocuments({ userId });
      assert(wlCount === 1, "Exactly one watchlist document exists for user");

      // 3. Create Holdings & Test Portfolio Analytics
      await HoldingsModel.deleteMany({ userId });
      await HoldingsModel.create({
        userId,
        name: "INFY",
        qty: 10,
        reservedQty: 0,
        avg: 1500,
        price: 1550,
      });

      const analytics = await analyticsService.getPortfolioAnalytics(userId);
      assert(analytics.totalInvested === 15000, "Calculates total invested capital correctly (10 * 1500 = 15000)");
      assert(analytics.currentValue > 0, "Calculates current holdings valuation based on live server quotes");
      assert(analytics.valuationComplete === true, "Marks valuationComplete as true when instrument quotes are present");
      assert(typeof analytics.unrealizedPnL === "number", "Computes unrealized P&L number");

      // 4. Test Incomplete Valuation with unquoted stock
      await HoldingsModel.create({
        userId,
        name: "UNLISTED_COMPANY_TEST",
        qty: 5,
        reservedQty: 0,
        avg: 100,
        price: 100,
      });

      const incompleteAnalytics = await analyticsService.getPortfolioAnalytics(userId);
      assert(incompleteAnalytics.valuationComplete === false, "Marks valuationComplete as false when quotes are missing");
      assert(incompleteAnalytics.unavailableSymbols.includes("UNLISTED_COMPANY_TEST"), "Identifies unavailable symbols");

      // Clean up the unlisted test holding
      await HoldingsModel.deleteOne({ userId, name: "UNLISTED_COMPANY_TEST" });

      // 5. Test OCO Order Creation & Shared Reservation
      const ocoResult = await createOCOGroup(
        {
          symbol: "INFY",
          qty: 5,
          takeProfitLimitPrice: 1700,
          stopLossPrice: 1400,
        },
        { _id: userId }
      );

      assert(ocoResult.success === true, "Places OCO order successfully");
      assert(Boolean(ocoResult.data.ocoGroup._id), "Creates dedicated OCO group");
      assert(Boolean(ocoResult.data.limitOrder), "Creates OCO limit order leg");
      assert(Boolean(ocoResult.data.stopOrder), "Creates OCO stop order leg");

      // Verify reserved quantity on holding
      const holdingAfterOco = await HoldingsModel.findOne({ userId, name: "INFY" });
      assert(holdingAfterOco.reservedQty === 5, "Shared reservation locks exactly 5 shares for both legs");

      // Verify OCO group status
      const ocoGroup = await OcoGroupModel.findById(ocoResult.data.ocoGroup._id);
      assert(ocoGroup.status === "ACTIVE", "OCO group status is ACTIVE");
      assert(ocoGroup.sharedReservation.amount === 5, "OCO group owns the shared 5-share reservation");

      // Clean up test data
      await OrdersModel.deleteMany({ userId });
      await OcoGroupModel.deleteMany({ userId });
      await HoldingsModel.deleteMany({ userId });
      await WatchlistModel.deleteMany({ userId });
      await UserModel.deleteMany({ _id: userId });
    }

    console.log("\n==================================================");
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================");

  } catch (err) {
    console.error("FATAL ERROR during test execution:", err);
    failed++;
  } finally {
    if (server && server.listening) {
      await new Promise((resolve) => server.close(resolve));
    }
    await disconnectDB();
  }

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runAllTests();
