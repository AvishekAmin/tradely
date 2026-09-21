import http from "http";
import crypto from "crypto";

process.env.PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || "mock";

const { default: app } = await import("../src/app.js");
const { connectDB, disconnectDB } = await import("../src/config/db.js");
const { UserModel } = await import("../src/models/UserModel.js");
const { WalletTransactionModel } =
  await import("../src/models/WalletTransactionModel.js");
const razorpayService = await import("../src/services/razorpayService.js");
const paymentService = await import("../src/services/paymentService.js");
const {
  PAYMENT_PROVIDER,
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET,
} = await import("../src/config/env.js");

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
  console.log("TRADELY DEPOSIT PAYMENTS & RAZORPAY VERIFICATION");
  console.log("==================================================\n");

  let server;
  let baseUrl;

  try {
    await connectDB();

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;

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
      `userA_${Date.now()}`,
      `usera_${Date.now()}@tradely.test`,
      "Password@12345",
    );
    const userBData = await createUser(
      `userB_${Date.now()}`,
      `userb_${Date.now()}@tradely.test`,
      "Password@12345",
    );

    const userACookie = userAData.cookie;
    const userBCookie = userBData.cookie;
    const userAId = userAData.user.id;
    const userBId = userBData.user.id;

    console.log("--- 1. Authentication & Route Protection ---");
    {
      const resCreate = await fetch(`${baseUrl}/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 1000 }),
      });
      assert(
        resCreate.status === 401,
        "Unauthenticated POST /payments/create-order returns 401",
      );

      const resVerify = await fetch(`${baseUrl}/payments/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: "order_123",
          razorpay_payment_id: "pay_123",
          razorpay_signature: "sig_123",
        }),
      });
      assert(
        resVerify.status === 401,
        "Unauthenticated POST /payments/verify returns 401",
      );

      const resHistory = await fetch(`${baseUrl}/payments/history`);
      assert(
        resHistory.status === 401,
        "Unauthenticated GET /payments/history returns 401",
      );
    }

    console.log("\n--- 2. Amount & Currency Validation ---");
    {
      const resNeg = await fetch(`${baseUrl}/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie },
        body: JSON.stringify({ amount: -500 }),
      });
      assert(resNeg.status === 400, "Rejects negative deposit amount with 400");

      const resZero = await fetch(`${baseUrl}/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie },
        body: JSON.stringify({ amount: 0 }),
      });
      assert(resZero.status === 400, "Rejects zero deposit amount with 400");

      const resBelowMin = await fetch(`${baseUrl}/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie },
        body: JSON.stringify({ amount: 50 }),
      });
      assert(
        resBelowMin.status === 400,
        "Rejects amount below minimum (₹100) with 400",
      );

      const resExcess = await fetch(`${baseUrl}/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie },
        body: JSON.stringify({ amount: 600000 }),
      });
      assert(
        resExcess.status === 400,
        "Rejects amount above maximum (₹5,00,000) with 400",
      );

      const resNaN = await fetch(`${baseUrl}/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie },
        body: JSON.stringify({ amount: "invalid_num" }),
      });
      assert(
        resNaN.status === 400,
        "Rejects non-numeric deposit amount with 400",
      );

      const resUSD = await fetch(`${baseUrl}/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie },
        body: JSON.stringify({ amount: 5000, currency: "USD" }),
      });
      assert(resUSD.status === 400, "Rejects non-INR currency with 400");
    }

    console.log("\n--- 3. Secure Order Creation & Local Ledger State ---");
    let testOrder = null;
    {
      const resCreate = await fetch(`${baseUrl}/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie },
        body: JSON.stringify({ amount: 10000 }),
      });
      assert(
        resCreate.status === 201,
        "POST /payments/create-order returns 201 Created",
      );

      const createBody = await resCreate.json();
      testOrder = createBody.data;

      assert(
        Boolean(testOrder?.orderId),
        "Response includes server-generated orderId",
      );
      assert(Boolean(testOrder?.keyId), "Response includes public keyId");
      assert(
        testOrder?.amount === 1000000,
        "Amount converted to paise (10000 * 100 = 1000000)",
      );
      assert(
        testOrder?.currency === "INR",
        "Server-authoritative currency is INR",
      );
      assert(
        testOrder?.displayAmount === 10000,
        "Display amount matches ₹10,000",
      );

      assert(
        !("keySecret" in testOrder),
        "Never exposes keySecret in response",
      );
      assert(!("secret" in testOrder), "Never exposes secret in response");

      const localTx = await WalletTransactionModel.findOne({
        providerOrderId: testOrder.orderId,
      });
      assert(
        Boolean(localTx),
        "Creates local WalletTransaction document in DB",
      );
      assert(
        localTx?.status === "PAYMENT_PENDING",
        "Initial status is PAYMENT_PENDING",
      );
      assert(localTx?.type === "DEPOSIT", "Transaction type is DEPOSIT");
      assert(localTx?.amount === 10000, "Transaction amount is 10000");
      assert(localTx?.provider === "RAZORPAY", "Provider is RAZORPAY");
      assert(
        localTx?.userId.toString() === userAId.toString(),
        "Transaction belongs to User A",
      );
    }

    console.log("\n--- 4. Verification & Single Confirmation Path ---");
    const testPaymentId = `pay_mock_${Date.now()}`;
    const mockSecret = RAZORPAY_KEY_SECRET || "mock_secret_key_1234567890";
    const validSignature = crypto
      .createHmac("sha256", mockSecret)
      .update(`${testOrder.orderId}|${testPaymentId}`)
      .digest("hex");

    {
      const crossRes = await fetch(`${baseUrl}/payments/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userBCookie },
        body: JSON.stringify({
          razorpay_order_id: testOrder.orderId,
          razorpay_payment_id: testPaymentId,
          razorpay_signature: validSignature,
        }),
      });
      assert(
        crossRes.status === 403,
        "User B cannot verify User A's order (returns 403 Forbidden)",
      );

      const nonExistentRes = await fetch(`${baseUrl}/payments/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie },
        body: JSON.stringify({
          razorpay_order_id: "order_non_existent_9999",
          razorpay_payment_id: testPaymentId,
          razorpay_signature: validSignature,
        }),
      });
      assert(
        nonExistentRes.status === 404,
        "Verification of non-existent order returns 404",
      );

      const badSigRes = await fetch(`${baseUrl}/payments/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie },
        body: JSON.stringify({
          razorpay_order_id: testOrder.orderId,
          razorpay_payment_id: testPaymentId,
          razorpay_signature: "invalid_forged_signature_hex",
        }),
      });
      assert(
        badSigRes.status === 400,
        "Invalid cryptographic signature returns 400 Bad Request",
      );

      const pendingTx = await WalletTransactionModel.findOne({
        providerOrderId: testOrder.orderId,
      });
      assert(
        pendingTx?.status === "PAYMENT_PENDING",
        "Leaves transaction in PAYMENT_PENDING on invalid signature",
      );

      const beforeUserA = await UserModel.findById(userAId);
      const initialBal = beforeUserA.balance;

      const validRes = await fetch(`${baseUrl}/payments/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie },
        body: JSON.stringify({
          razorpay_order_id: testOrder.orderId,
          razorpay_payment_id: testPaymentId,
          razorpay_signature: validSignature,
        }),
      });

      assert(
        validRes.status === 200,
        "Valid signature verification returns 200 OK",
      );
      const validBody = await validRes.json();
      assert(
        validBody.success === true,
        "Verification payload returns success: true",
      );

      const afterUserA = await UserModel.findById(userAId);
      assert(
        afterUserA.balance === initialBal + 10000,
        `User balance incremented by exactly ₹10,000 (${initialBal} -> ${afterUserA.balance})`,
      );

      const confirmedTx = await WalletTransactionModel.findOne({
        providerOrderId: testOrder.orderId,
      });
      assert(
        confirmedTx.status === "SUCCESS",
        "WalletTransaction status transitioned to SUCCESS",
      );
      assert(
        confirmedTx.providerPaymentId === testPaymentId,
        "Records providerPaymentId in transaction",
      );
    }

    console.log("\n--- 5. Idempotency & Duplicate Prevention ---");
    {
      const userABeforeSecond = await UserModel.findById(userAId);
      const balanceBeforeSecond = userABeforeSecond.balance;

      const repeatRes = await fetch(`${baseUrl}/payments/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie },
        body: JSON.stringify({
          razorpay_order_id: testOrder.orderId,
          razorpay_payment_id: testPaymentId,
          razorpay_signature: validSignature,
        }),
      });

      assert(repeatRes.status === 200, "Repeat verification returns 200 OK");
      const repeatBody = await repeatRes.json();
      assert(
        repeatBody.data?.idempotent === true,
        "Indicates idempotent replay",
      );

      const userAAfterSecond = await UserModel.findById(userAId);
      assert(
        userAAfterSecond.balance === balanceBeforeSecond,
        "Repeated verification does NOT increment balance again (strict idempotency)",
      );

      const fundsRes = await fetch(`${baseUrl}/funds`, {
        headers: { Cookie: userACookie },
      });
      const fundsData = await fundsRes.json();
      assert(
        fundsData.data.balance === userAAfterSecond.balance,
        "Funds endpoint reflects verified balance",
      );

      const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userAData.user.email,
          password: "Password@12345",
        }),
      });
      assert(loginRes.status === 200, "Re-login succeeds");
      const newCookie = loginRes.headers.get("set-cookie") || "";

      const reVerifyRes = await fetch(`${baseUrl}/payments/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: newCookie },
        body: JSON.stringify({
          razorpay_order_id: testOrder.orderId,
          razorpay_payment_id: testPaymentId,
          razorpay_signature: validSignature,
        }),
      });
      assert(
        reVerifyRes.status === 200,
        "Verification works seamlessly across login sessions",
      );
      const userAAfterReLogin = await UserModel.findById(userAId);
      assert(
        userAAfterReLogin.balance === balanceBeforeSecond,
        "Balance remains strictly idempotent across sessions",
      );
    }

    console.log("\n--- 6. Webhook Processing & Raw Body Preservation ---");
    {
      const order2Res = await fetch(`${baseUrl}/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userBCookie },
        body: JSON.stringify({ amount: 5000 }),
      });
      const order2 = (await order2Res.json()).data;
      const payment2Id = `pay_hook_${Date.now()}`;
      const eventId = `evt_test_${Date.now()}`;

      const webhookPayload = JSON.stringify({
        id: eventId,
        event: "payment.captured",
        payload: {
          payment: {
            entity: {
              id: payment2Id,
              order_id: order2.orderId,
              amount: 500000,
              currency: "INR",
              status: "captured",
            },
          },
        },
      });

      const webhookSecret = RAZORPAY_WEBHOOK_SECRET || "mock_webhook_secret";
      const validWebhookSig = crypto
        .createHmac("sha256", webhookSecret)
        .update(Buffer.from(webhookPayload, "utf8"))
        .digest("hex");

      const badHookRes = await fetch(`${baseUrl}/webhooks/razorpay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-razorpay-signature": "forged_webhook_signature",
        },
        body: webhookPayload,
      });
      assert(
        badHookRes.status === 400,
        "Webhook rejects invalid signature with 400",
      );

      const userBBefore = await UserModel.findById(userBId);
      const userBBalBefore = userBBefore.balance;

      const goodHookRes = await fetch(`${baseUrl}/webhooks/razorpay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-razorpay-signature": validWebhookSig,
        },
        body: webhookPayload,
      });
      assert(
        goodHookRes.status === 200,
        "Webhook accepts valid signature and returns 200",
      );

      const userBAfter = await UserModel.findById(userBId);
      assert(
        userBAfter.balance === userBBalBefore + 5000,
        `Webhook incremented User B balance by ₹5,000 (${userBBalBefore} -> ${userBAfter.balance})`,
      );

      const dupHookRes = await fetch(`${baseUrl}/webhooks/razorpay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-razorpay-signature": validWebhookSig,
        },
        body: webhookPayload,
      });
      assert(
        dupHookRes.status === 200,
        "Duplicate webhook acknowledges with 200",
      );

      const userBAfterDup = await UserModel.findById(userBId);
      assert(
        userBAfterDup.balance === userBAfter.balance,
        "Duplicate webhook does NOT double-credit balance",
      );
    }

    console.log("\n--- 7. Payment History & Multi-Tenant Isolation ---");
    {
      const resHistA = await fetch(`${baseUrl}/payments/history`, {
        headers: { Cookie: userACookie },
      });
      const dataHistA = (await resHistA.json()).data;
      assert(Array.isArray(dataHistA), "User A history is an array");
      assert(dataHistA.length > 0, "User A has recorded transactions");
      assert(
        dataHistA.every((tx) => tx.userId.toString() === userAId.toString()),
        "All transactions in User A's history belong strictly to User A",
      );

      const resHistB = await fetch(`${baseUrl}/payments/history`, {
        headers: { Cookie: userBCookie },
      });
      const dataHistB = (await resHistB.json()).data;
      assert(
        dataHistB.every((tx) => tx.userId.toString() === userBId.toString()),
        "User B cannot see User A's transactions (strict user boundary)",
      );
    }

    console.log("\n--- 8. Configuration & Mock-Mode Safeguards ---");
    {
      assert(
        PAYMENT_PROVIDER === "razorpay" || PAYMENT_PROVIDER === "mock",
        `PAYMENT_PROVIDER is explicitly '${PAYMENT_PROVIDER}'`,
      );

      const sigMismatch = razorpayService.verifyPaymentSignature({
        order_id: "order_123",
        payment_id: "pay_123",
        signature: "short",
      });
      assert(
        sigMismatch === false,
        "Payment signature check safely handles length mismatch",
      );

      const hookEmpty = razorpayService.verifyWebhookSignature("", "sig");
      assert(
        hookEmpty === false,
        "Webhook signature check safely rejects empty body",
      );
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
