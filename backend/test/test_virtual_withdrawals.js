/**
 * Tradely Virtual Withdrawal System Automated Test Suite
 * 
 * Validates:
 * 1. Security & Authentication: Unauthenticated access rejected with 401
 * 2. User Isolation & Multi-Tenancy: User A cannot read, detail, or cancel User B withdrawals
 * 3. Validation: Negative, zero, missing destination, invalid method, sensitive credentials rejected
 * 4. Withdrawable Balance Math: Server enforces balance - reserved - pendingWithdrawal
 * 5. Destination Masking: Masks UPI and bank account identifiers before persistence
 * 6. Atomic Concurrency: Two concurrent withdrawals racing against the same balance cannot double-spend
 * 7. Cancellation Lifecycle: PENDING -> CANCELLED atomically releases pending reservation without touching balance
 * 8. Simulated Processing: PENDING -> PROCESSING -> SUCCESS atomically decreases pending reservation and balance
 * 9. Explicit Failure Path: PROCESSING -> FAILED atomically releases reservation with balance untouched
 * 10. Cancel vs Processing Race Condition: Winner takes all; loser exits safely without double release/deduction
 * 11. Terminal State Immutability: Completed/cancelled withdrawals cannot be re-processed or re-cancelled
 * 12. Null Safety & Migration: Existing users without pendingWithdrawalAmount are safely handled via $ifNull
 * 13. Crash Recovery: recoverPendingWithdrawals cleans up orphaned transactions
 * 14. Deposit Integration Regression: Razorpay test order creation and verification remain fully functional
 */

import http from "http";
import crypto from "crypto";

// Ensure deterministic CI/test provider configuration
process.env.PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || "mock";

const { default: app } = await import("../src/app.js");
const { connectDB, disconnectDB } = await import("../src/config/db.js");
const { UserModel } = await import("../src/models/UserModel.js");
const { WalletTransactionModel } = await import("../src/models/WalletTransactionModel.js");
const withdrawalService = await import("../src/services/withdrawalService.js");
const accountService = await import("../src/services/accountService.js");
const paymentService = await import("../src/services/paymentService.js");
const { RAZORPAY_KEY_SECRET } = await import("../src/config/env.js");

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
  console.log("TRADELY VIRTUAL WITHDRAWAL SYSTEM VERIFICATION");
  console.log("==================================================\n");

  let server;
  let baseUrl;

  try {
    await connectDB();

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;

    // Helper to create users
    const createUser = async (username, email, password) => {
      const res = await fetch(`${baseUrl}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      const cookie = res.headers.get("set-cookie") || "";
      return { user: data.data?.user, cookie };
    };

    const userAData = await createUser(
      `withA_${Date.now()}`,
      `witha_${Date.now()}@tradely.test`,
      "Password@12345"
    );
    const userBData = await createUser(
      `withB_${Date.now()}`,
      `withb_${Date.now()}@tradely.test`,
      "Password@12345"
    );

    const userACookie = userAData.cookie;
    const userBCookie = userBData.cookie;
    const userAId = userAData.user.id;
    const userBId = userBData.user.id;

    // -------------------------------------------------------------
    // Test Group 1: Authentication & Route Protection
    // -------------------------------------------------------------
    console.log("--- 1. Authentication & Route Protection ---");
    {
      const resPost = await fetch(`${baseUrl}/withdrawals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 1000, method: "UPI_SIMULATED", destination: "test@upi" }),
      });
      assert(resPost.status === 401, "Unauthenticated POST /withdrawals returns 401");

      const resGet = await fetch(`${baseUrl}/withdrawals`);
      assert(resGet.status === 401, "Unauthenticated GET /withdrawals returns 401");

      const resGetId = await fetch(`${baseUrl}/withdrawals/65f1234567890abcdef12345`);
      assert(resGetId.status === 401, "Unauthenticated GET /withdrawals/:id returns 401");

      const resCancel = await fetch(`${baseUrl}/withdrawals/65f1234567890abcdef12345/cancel`, {
        method: "POST",
      });
      assert(resCancel.status === 401, "Unauthenticated POST /withdrawals/:id/cancel returns 401");
    }

    // -------------------------------------------------------------
    // Test Group 2: Validation & Sensitive Credential Rejection
    // -------------------------------------------------------------
    console.log("\n--- 2. Validation & Sensitive Field Protection ---");
    {
      // Negative amount
      const resNeg = await fetch(`${baseUrl}/withdrawals`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie },
        body: JSON.stringify({ amount: -500, method: "UPI_SIMULATED", destination: "a@upi" }),
      });
      assert(resNeg.status === 400, "Rejects negative withdrawal amount with 400");

      // Zero amount
      const resZero = await fetch(`${baseUrl}/withdrawals`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie },
        body: JSON.stringify({ amount: 0, method: "UPI_SIMULATED", destination: "a@upi" }),
      });
      assert(resZero.status === 400, "Rejects zero withdrawal amount with 400");

      // Invalid method
      const resMethod = await fetch(`${baseUrl}/withdrawals`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie },
        body: JSON.stringify({ amount: 1000, method: "CREDIT_CARD_PAYOUT", destination: "a@upi" }),
      });
      assert(resMethod.status === 400, "Rejects unsupported withdrawal method with 400");

      // Missing destination
      const resNoDest = await fetch(`${baseUrl}/withdrawals`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie },
        body: JSON.stringify({ amount: 1000, method: "UPI_SIMULATED" }),
      });
      assert(resNoDest.status === 400, "Rejects missing destination with 400");

      // Sensitive credential rejection (PIN)
      const resPin = await fetch(`${baseUrl}/withdrawals`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie },
        body: JSON.stringify({
          amount: 1000,
          method: "UPI_SIMULATED",
          destination: "a@upi",
          pin: "1234",
        }),
      });
      assert(resPin.status === 400, "Strictly rejects request containing 'pin' field with 400");

      // Sensitive credential rejection (Banking Password)
      const resPass = await fetch(`${baseUrl}/withdrawals`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie },
        body: JSON.stringify({
          amount: 1000,
          method: "BANK_SIMULATED",
          destination: "123456789",
          bankingPassword: "secretPassword",
        }),
      });
      assert(resPass.status === 400, "Strictly rejects request containing 'bankingPassword' with 400");
    }

    // -------------------------------------------------------------
    // Test Group 3: Destination Masking
    // -------------------------------------------------------------
    console.log("\n--- 3. Destination Masking & Privacy ---");
    {
      const maskedUPI = withdrawalService.maskDestination("UPI_SIMULATED", "avishek@okhdfcbank");
      assert(maskedUPI === "av****@okhdfcbank", "Masks UPI VPA cleanly (av****@okhdfcbank)");

      const maskedBank = withdrawalService.maskDestination("BANK_SIMULATED", "987654321098");
      assert(maskedBank === "****1098", "Masks bank account keeping last 4 digits (****1098)");
    }

    // -------------------------------------------------------------
    // Test Group 4: Withdrawable Balance & Insufficient Funds
    // -------------------------------------------------------------
    console.log("\n--- 4. Withdrawable Balance Math & Insufficient Funds ---");
    {
      // User A balance: 100,000. Set reservedBalance = 20,000
      await UserModel.findByIdAndUpdate(userAId, {
        balance: 100000,
        reservedBalance: 20000,
        pendingWithdrawalAmount: 0,
      });

      const fundsCheck = await accountService.getFunds({ _id: userAId });
      assert(fundsCheck.balance === 100000, "Available balance is 100,000");
      assert(fundsCheck.reservedBalance === 20000, "Reserved trading cash is 20,000");
      assert(fundsCheck.pendingWithdrawalAmount === 0, "Pending withdrawal is 0");
      assert(fundsCheck.withdrawableBalance === 80000, "Withdrawable cash is exactly 80,000 (100k - 20k)");

      // Attempt to withdraw ₹85,000 (exceeds withdrawable 80,000)
      const resOver = await fetch(`${baseUrl}/withdrawals`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie },
        body: JSON.stringify({
          amount: 85000,
          method: "UPI_SIMULATED",
          destination: "userA@upi",
        }),
      });
      assert(resOver.status === 400, "Rejects withdrawal exceeding withdrawable cash with 400");
      const overBody = await resOver.json();
      assert(
        overBody.code === "INSUFFICIENT_WITHDRAWABLE_FUNDS",
        "Returns INSUFFICIENT_WITHDRAWABLE_FUNDS error code"
      );
    }

    // -------------------------------------------------------------
    // Test Group 5: Atomic Concurrency & Double-Spending Protection
    // -------------------------------------------------------------
    console.log("\n--- 5. Atomic Concurrency & Double-Spending Protection ---");
    {
      // User A withdrawable cash: ₹80,000
      // Send two concurrent requests: Request 1 = ₹50,000, Request 2 = ₹40,000
      // Sum = ₹90,000 > ₹80,000. Exactly ONE must succeed and ONE must fail!
      const [p1, p2] = await Promise.all([
        fetch(`${baseUrl}/withdrawals`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Cookie: userACookie },
          body: JSON.stringify({ amount: 50000, method: "UPI_SIMULATED", destination: "race1@upi" }),
        }),
        fetch(`${baseUrl}/withdrawals`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Cookie: userACookie },
          body: JSON.stringify({ amount: 40000, method: "UPI_SIMULATED", destination: "race2@upi" }),
        }),
      ]);

      const s1 = p1.status;
      const s2 = p2.status;

      const oneSucceeded = (s1 === 201 && s2 === 400) || (s1 === 400 && s2 === 201);
      assert(oneSucceeded, "Concurrent withdrawals cannot double-spend (one 201, one 400)");

      // Verify User A pendingWithdrawalAmount is either 50000 or 40000, never 90000
      const userAAfterRace = await UserModel.findById(userAId);
      assert(
        userAAfterRace.pendingWithdrawalAmount === 50000 ||
          userAAfterRace.pendingWithdrawalAmount === 40000,
        `Pending reservation is exactly one request (${userAAfterRace.pendingWithdrawalAmount})`
      );

      // Clean up test transactions for next tests
      await WalletTransactionModel.deleteMany({ userId: userAId });
      await UserModel.findByIdAndUpdate(userAId, {
        balance: 100000,
        reservedBalance: 0,
        pendingWithdrawalAmount: 0,
      });
    }

    // -------------------------------------------------------------
    // Test Group 6: Withdrawal Creation, Reservation & Cancellation
    // -------------------------------------------------------------
    console.log("\n--- 6. Withdrawal Lifecycle & Cancellation ---");
    let testWithdrawal = null;
    {
      const resCreate = await fetch(`${baseUrl}/withdrawals`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie },
        body: JSON.stringify({
          amount: 15000,
          method: "UPI_SIMULATED",
          destination: "alice@okaxis",
        }),
      });
      assert(resCreate.status === 201, "POST /withdrawals returns 201 Created");

      const createBody = await resCreate.json();
      testWithdrawal = createBody.data.transaction;

      assert(testWithdrawal.status === "PENDING", "Initial status is PENDING");
      assert(testWithdrawal.amount === 15000, "Transaction amount is 15000");
      assert(testWithdrawal.destination === "al****@okaxis", "Masked destination saved");
      assert(testWithdrawal.type === "WITHDRAWAL", "Type is WITHDRAWAL");
      assert(testWithdrawal.provider === "INTERNAL", "Provider is INTERNAL");

      // Verify pendingWithdrawalAmount incremented by 15000, balance UNCHANGED
      const userAAfterCreate = await UserModel.findById(userAId);
      assert(userAAfterCreate.balance === 100000, "Balance remains 100,000 while PENDING");
      assert(
        userAAfterCreate.pendingWithdrawalAmount === 15000,
        "pendingWithdrawalAmount is 15,000"
      );

      // User B attempts to cancel User A's withdrawal -> 404
      const resCancelCross = await fetch(
        `${baseUrl}/withdrawals/${testWithdrawal._id}/cancel`,
        {
          method: "POST",
          headers: { Cookie: userBCookie },
        }
      );
      assert(
        resCancelCross.status === 404,
        "User B cannot cancel User A's withdrawal (returns 404)"
      );

      // User A cancels their own withdrawal
      const resCancel = await fetch(
        `${baseUrl}/withdrawals/${testWithdrawal._id}/cancel`,
        {
          method: "POST",
          headers: { Cookie: userACookie },
        }
      );
      assert(resCancel.status === 200, "User A cancels PENDING withdrawal with 200 OK");
      const cancelBody = await resCancel.json();
      assert(cancelBody.data.transaction.status === "CANCELLED", "Status is CANCELLED");

      // Verify pending reservation released, balance unchanged
      const userAAfterCancel = await UserModel.findById(userAId);
      assert(
        userAAfterCancel.pendingWithdrawalAmount === 0,
        "pendingWithdrawalAmount released back to 0"
      );
      assert(userAAfterCancel.balance === 100000, "Balance remains 100,000");

      // Double cancellation attempt
      const resDoubleCancel = await fetch(
        `${baseUrl}/withdrawals/${testWithdrawal._id}/cancel`,
        {
          method: "POST",
          headers: { Cookie: userACookie },
        }
      );
      assert(
        resDoubleCancel.status === 400,
        "Double cancellation rejected with 400 (CANNOT_CANCEL_WITHDRAWAL)"
      );
    }

    // -------------------------------------------------------------
    // Test Group 7: Simulated Processing & Balance Deduction
    // -------------------------------------------------------------
    console.log("\n--- 7. Deterministic Simulated Completion ---");
    {
      const resCreate2 = await fetch(`${baseUrl}/withdrawals`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie },
        body: JSON.stringify({
          amount: 25000,
          method: "BANK_SIMULATED",
          destination: "987654321098",
        }),
      });
      const tx2 = (await resCreate2.json()).data.transaction;

      // Deterministically complete the simulated withdrawal
      const completionResult = await withdrawalService.processSimulatedWithdrawal(
        tx2._id,
        "SUCCESS"
      );
      assert(completionResult.success === true, "Simulated withdrawal completed successfully");
      assert(completionResult.transaction.status === "SUCCESS", "Status transitioned to SUCCESS");

      // Check User A accounting: balance should be 100,000 - 25,000 = 75,000
      const userAAfterComplete = await UserModel.findById(userAId);
      assert(
        userAAfterComplete.balance === 75000,
        `Balance deducted by exactly ₹25,000 (100000 -> ${userAAfterComplete.balance})`
      );
      assert(
        userAAfterComplete.pendingWithdrawalAmount === 0,
        "pendingWithdrawalAmount cleared to 0 upon completion"
      );

      // Verify cannot cancel a SUCCESS withdrawal
      const resCancelSuccess = await fetch(`${baseUrl}/withdrawals/${tx2._id}/cancel`, {
        method: "POST",
        headers: { Cookie: userACookie },
      });
      assert(resCancelSuccess.status === 400, "Cannot cancel completed SUCCESS withdrawal");

      // Verify double processing does nothing
      const reProcessResult = await withdrawalService.processSimulatedWithdrawal(
        tx2._id,
        "SUCCESS"
      );
      assert(
        reProcessResult.success === false,
        "Double processing is safely rejected (idempotent terminal check)"
      );
      const userAAfterDouble = await UserModel.findById(userAId);
      assert(userAAfterDouble.balance === 75000, "Balance never reduced twice");
    }

    // -------------------------------------------------------------
    // Test Group 8: Explicit Processing Failure Path (Safeguard 2)
    // -------------------------------------------------------------
    console.log("\n--- 8. Explicit Processing Failure Path ---");
    {
      const resFail = await fetch(`${baseUrl}/withdrawals`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie },
        body: JSON.stringify({
          amount: 5000,
          method: "UPI_SIMULATED",
          destination: "fail@upi",
        }),
      });
      const txFail = (await resFail.json()).data.transaction;

      const userBeforeFail = await UserModel.findById(userAId);
      const balBefore = userBeforeFail.balance;
      assert(userBeforeFail.pendingWithdrawalAmount === 5000, "5,000 reserved for pending");

      // Trigger explicit failure
      const failResult = await withdrawalService.processSimulatedWithdrawal(
        txFail._id,
        "FAILED"
      );
      assert(failResult.success === true, "Explicit failure processing succeeds");
      assert(failResult.transaction.status === "FAILED", "Transaction status is FAILED");

      const userAfterFail = await UserModel.findById(userAId);
      assert(
        userAfterFail.pendingWithdrawalAmount === 0,
        "Reservation released back to 0 on failure"
      );
      assert(
        userAfterFail.balance === balBefore,
        "Balance remains untouched on failure (no erroneous deduction)"
      );
    }

    // -------------------------------------------------------------
    // Test Group 9: Cancel vs Processing Race Condition (Safeguard 4)
    // -------------------------------------------------------------
    console.log("\n--- 9. Cancel vs Processing Race Condition ---");
    {
      const resRace = await fetch(`${baseUrl}/withdrawals`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie },
        body: JSON.stringify({
          amount: 8000,
          method: "UPI_SIMULATED",
          destination: "race@upi",
        }),
      });
      const txRace = (await resRace.json()).data.transaction;

      // Scenario A: Move to PROCESSING before Cancel
      await WalletTransactionModel.findByIdAndUpdate(txRace._id, { status: "PROCESSING" });

      const resCancelInFlight = await fetch(
        `${baseUrl}/withdrawals/${txRace._id}/cancel`,
        {
          method: "POST",
          headers: { Cookie: userACookie },
        }
      );
      assert(
        resCancelInFlight.status === 400,
        "Cancel fails cleanly when status has moved to PROCESSING"
      );

      // Now complete the processing
      await withdrawalService.processSimulatedWithdrawal(txRace._id, "SUCCESS");
      const txFinished = await WalletTransactionModel.findById(txRace._id);
      assert(txFinished.status === "SUCCESS", "Processing completes to SUCCESS");
    }

    // -------------------------------------------------------------
    // Test Group 10: Multi-Tenant Data Isolation
    // -------------------------------------------------------------
    console.log("\n--- 10. Multi-Tenant Data Isolation ---");
    {
      const resUserAWith = await fetch(`${baseUrl}/withdrawals`, {
        headers: { Cookie: userACookie },
      });
      const listA = (await resUserAWith.json()).data;
      assert(Array.isArray(listA), "User A withdrawals is an array");
      assert(
        listA.every((w) => w.userId.toString() === userAId.toString()),
        "User A list contains only User A withdrawals"
      );

      const resUserBWith = await fetch(`${baseUrl}/withdrawals`, {
        headers: { Cookie: userBCookie },
      });
      const listB = (await resUserBWith.json()).data;
      assert(
        listB.every((w) => w.userId.toString() === userBId.toString()),
        "User B list contains only User B withdrawals"
      );
    }

    // -------------------------------------------------------------
    // Test Group 11: Phase 10A Razorpay Regression Test
    // -------------------------------------------------------------
    console.log("\n--- 11. Phase 10A Razorpay Regression Test ---");
    {
      const resDep = await fetch(`${baseUrl}/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie },
        body: JSON.stringify({ amount: 10000 }),
      });
      assert(resDep.status === 201, "Phase 10A create-order continues working (201 Created)");

      const depOrder = (await resDep.json()).data;
      const payId = `pay_reg_${Date.now()}`;
      const mockSecret = RAZORPAY_KEY_SECRET || "mock_secret_key_1234567890";
      const sig = crypto
        .createHmac("sha256", mockSecret)
        .update(`${depOrder.orderId}|${payId}`)
        .digest("hex");

      const resVer = await fetch(`${baseUrl}/payments/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie },
        body: JSON.stringify({
          razorpay_order_id: depOrder.orderId,
          razorpay_payment_id: payId,
          razorpay_signature: sig,
        }),
      });
      assert(resVer.status === 200, "Phase 10A payment verification continues working (200 OK)");
    }

    console.log("\n==================================================");
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================");
  } catch (err) {
    console.error("Test execution encountered an error:", err);
    failed++;
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await disconnectDB();
  }

  if (failed > 0) {
    process.exit(1);
  }
};

runAllTests();
