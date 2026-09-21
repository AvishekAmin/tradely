import http from "http";
import crypto from "crypto";

process.env.PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || "mock";

const { default: app } = await import("../src/app.js");
const { connectDB, disconnectDB } = await import("../src/config/db.js");
const { UserModel } = await import("../src/models/UserModel.js");
const { WalletTransactionModel } =
  await import("../src/models/WalletTransactionModel.js");
const { RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET } =
  await import("../src/config/env.js");

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
  console.log("TRADELY CASH LEDGER FILTERING & SEMANTICS SUITE");
  console.log("==================================================");

  let server;
  let baseUrl;

  try {
    await connectDB();

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;

    await UserModel.deleteMany({
      email: { $in: ["phase10c_a@tradely.test", "phase10c_b@tradely.test"] },
    });

    const resA = await fetch(`${baseUrl}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "UserTenC_A",
        email: "phase10c_a@tradely.test",
        password: "TestPassword123!",
      }),
    });
    const userACookie = resA.headers.get("set-cookie");
    const userAData = (await resA.json()).data;
    const userAId = userAData.user?.id || userAData.user?._id;

    const resB = await fetch(`${baseUrl}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "UserTenC_B",
        email: "phase10c_b@tradely.test",
        password: "TestPassword123!",
      }),
    });
    const userBCookie = resB.headers.get("set-cookie");
    const userBData = (await resB.json()).data;
    const userBId = userBData.user?.id || userBData.user?._id;

    await WalletTransactionModel.deleteMany({
      userId: { $in: [userAId, userBId] },
    });

    await WalletTransactionModel.create({
      userId: userAId,
      type: "DEPOSIT",
      amount: 10000,
      currency: "INR",
      provider: "RAZORPAY",
      status: "SUCCESS",
      providerOrderId: `order_10c_dep_succ_${Date.now()}`,
    });

    await WalletTransactionModel.create({
      userId: userAId,
      type: "DEPOSIT",
      amount: 5000,
      currency: "INR",
      provider: "RAZORPAY",
      status: "PAYMENT_PENDING",
      providerOrderId: `order_10c_dep_pend_${Date.now()}`,
    });

    await WalletTransactionModel.create({
      userId: userAId,
      type: "DEPOSIT",
      amount: 2000,
      currency: "INR",
      provider: "RAZORPAY",
      status: "FAILED",
      providerOrderId: `order_10c_dep_fail_${Date.now()}`,
    });

    await WalletTransactionModel.create({
      userId: userAId,
      type: "WITHDRAWAL",
      amount: 4000,
      currency: "INR",
      provider: "INTERNAL",
      status: "PENDING",
      method: "UPI_SIMULATED",
      destination: "usera@okhdfcbank",
    });

    await WalletTransactionModel.create({
      userId: userAId,
      type: "WITHDRAWAL",
      amount: 3000,
      currency: "INR",
      provider: "INTERNAL",
      status: "PROCESSING",
      method: "BANK_SIMULATED",
      destination: "****9901",
    });

    await WalletTransactionModel.create({
      userId: userAId,
      type: "WITHDRAWAL",
      amount: 1500,
      currency: "INR",
      provider: "INTERNAL",
      status: "CANCELLED",
      method: "UPI_SIMULATED",
      destination: "usera@okhdfcbank",
    });

    await WalletTransactionModel.create({
      userId: userAId,
      type: "WITHDRAWAL",
      amount: 2500,
      currency: "INR",
      provider: "INTERNAL",
      status: "SUCCESS",
      method: "BANK_SIMULATED",
      destination: "****9901",
    });

    await WalletTransactionModel.create({
      userId: userBId,
      type: "WITHDRAWAL",
      amount: 9999,
      currency: "INR",
      provider: "INTERNAL",
      status: "PENDING",
      method: "UPI_SIMULATED",
      destination: "userb@okaxis",
    });

    console.log("\n--- 1. Authentication & Route Protection ---");
    {
      const resUnauth = await fetch(`${baseUrl}/payments/history`);
      assert(
        resUnauth.status === 401,
        "Unauthenticated GET /payments/history returns 401",
      );
    }

    console.log("\n--- 2. Unfiltered History ---");
    {
      const resAll = await fetch(`${baseUrl}/payments/history`, {
        headers: { Cookie: userACookie },
      });
      assert(
        resAll.status === 200,
        "Authenticated GET /payments/history returns 200",
      );
      const data = (await resAll.json()).data;
      assert(Array.isArray(data), "History is returned as an array");
      assert(
        data.length === 7,
        `User A has exactly 7 transactions (got ${data.length})`,
      );
    }

    console.log("\n--- 3. Type Filtering (type=DEPOSIT / type=WITHDRAWAL) ---");
    {
      const resDep = await fetch(`${baseUrl}/payments/history?type=DEPOSIT`, {
        headers: { Cookie: userACookie },
      });
      assert(resDep.status === 200, "type=DEPOSIT query returns 200");
      const deps = (await resDep.json()).data;
      assert(
        deps.length === 3,
        `Returns exactly 3 deposits (got ${deps.length})`,
      );
      assert(
        deps.every((tx) => tx.type === "DEPOSIT"),
        "Every transaction in type=DEPOSIT is a DEPOSIT",
      );

      const resWd = await fetch(`${baseUrl}/payments/history?type=withdrawal`, {
        headers: { Cookie: userACookie },
      });
      assert(
        resWd.status === 200,
        "type=withdrawal (lowercase) query returns 200",
      );
      const wds = (await resWd.json()).data;
      assert(
        wds.length === 4,
        `Returns exactly 4 withdrawals (got ${wds.length})`,
      );
      assert(
        wds.every((tx) => tx.type === "WITHDRAWAL"),
        "Every transaction in type=withdrawal is a WITHDRAWAL",
      );
    }

    console.log("\n--- 4. Semantic Status Filtering ---");
    {
      const resSucc = await fetch(
        `${baseUrl}/payments/history?status=SUCCESS`,
        {
          headers: { Cookie: userACookie },
        },
      );
      const succList = (await resSucc.json()).data;
      assert(
        succList.length === 2,
        `status=SUCCESS returns exactly 2 records (got ${succList.length})`,
      );
      assert(
        succList.every((tx) => tx.status === "SUCCESS"),
        "All transactions have status SUCCESS",
      );

      const resPend = await fetch(
        `${baseUrl}/payments/history?status=PENDING`,
        {
          headers: { Cookie: userACookie },
        },
      );
      const pendList = (await resPend.json()).data;
      assert(
        pendList.length === 2,
        `status=PENDING grouped filter returns 2 records (1 DEPOSIT payment_pending + 1 WITHDRAWAL pending)`,
      );
      assert(
        pendList.some((tx) => tx.status === "PAYMENT_PENDING") &&
          pendList.some((tx) => tx.status === "PENDING"),
        "Grouped pending filter matches both PAYMENT_PENDING and PENDING statuses",
      );

      const resProc = await fetch(
        `${baseUrl}/payments/history?status=PROCESSING`,
        {
          headers: { Cookie: userACookie },
        },
      );
      const procList = (await resProc.json()).data;
      assert(
        procList.length === 1,
        "status=PROCESSING returns exactly 1 record",
      );
      assert(
        procList[0].status === "PROCESSING",
        "Transaction has status PROCESSING",
      );

      const resFail = await fetch(`${baseUrl}/payments/history?status=FAILED`, {
        headers: { Cookie: userACookie },
      });
      const failList = (await resFail.json()).data;
      assert(failList.length === 1, "status=FAILED returns exactly 1 record");
      assert(failList[0].status === "FAILED", "Transaction has status FAILED");

      const resCanc = await fetch(
        `${baseUrl}/payments/history?status=CANCELLED`,
        {
          headers: { Cookie: userACookie },
        },
      );
      const cancList = (await resCanc.json()).data;
      assert(
        cancList.length === 1,
        "status=CANCELLED returns exactly 1 record",
      );
      assert(
        cancList[0].status === "CANCELLED",
        "Transaction has status CANCELLED",
      );
    }

    console.log("\n--- 5. Combined Type & Status Filtering ---");
    {
      const resComb = await fetch(
        `${baseUrl}/payments/history?type=WITHDRAWAL&status=CANCELLED`,
        {
          headers: { Cookie: userACookie },
        },
      );
      const combList = (await resComb.json()).data;
      assert(
        combList.length === 1,
        "type=WITHDRAWAL&status=CANCELLED returns exactly 1 record",
      );
      assert(
        combList[0].type === "WITHDRAWAL" && combList[0].status === "CANCELLED",
        "Record matches both WITHDRAWAL and CANCELLED",
      );

      const resDepSucc = await fetch(
        `${baseUrl}/payments/history?type=DEPOSIT&status=SUCCESS`,
        {
          headers: { Cookie: userACookie },
        },
      );
      const depSuccList = (await resDepSucc.json()).data;
      assert(
        depSuccList.length === 1,
        "type=DEPOSIT&status=SUCCESS returns exactly 1 record",
      );
      assert(
        depSuccList[0].type === "DEPOSIT" &&
          depSuccList[0].status === "SUCCESS",
        "Record matches both DEPOSIT and SUCCESS",
      );
    }

    console.log("\n--- 6. Invalid Filter Handling ---");
    {
      const resInv = await fetch(
        `${baseUrl}/payments/history?type=CRYPTO&status=UNSUPPORTED`,
        {
          headers: { Cookie: userACookie },
        },
      );
      assert(
        resInv.status === 200,
        "Invalid filters do not crash or 400; returns 200 OK",
      );
      const invList = (await resInv.json()).data;
      assert(
        invList.length === 7,
        "Invalid filter keys safely ignored; returns all 7 user transactions",
      );
    }

    console.log("\n--- 7. Multi-Tenant User Isolation under Filtering ---");
    {
      const resA = await fetch(
        `${baseUrl}/payments/history?type=WITHDRAWAL&status=PENDING`,
        {
          headers: { Cookie: userACookie },
        },
      );
      const listA = (await resA.json()).data;
      assert(listA.length === 1, "User A sees only their 1 pending withdrawal");
      assert(
        listA[0].amount === 4000,
        "User A sees their ₹4,000 withdrawal, NOT User B's ₹9,999",
      );

      const resB = await fetch(
        `${baseUrl}/payments/history?type=WITHDRAWAL&status=PENDING`,
        {
          headers: { Cookie: userBCookie },
        },
      );
      const listB = (await resB.json()).data;
      assert(listB.length === 1, "User B sees only their 1 pending withdrawal");
      assert(
        listB[0].amount === 9999,
        "User B sees their ₹9,999 withdrawal, NOT User A's ₹4,000",
      );

      const resBDep = await fetch(`${baseUrl}/payments/history?type=DEPOSIT`, {
        headers: { Cookie: userBCookie },
      });
      const listBDep = (await resBDep.json()).data;
      assert(
        listBDep.length === 0,
        "User B sees 0 deposits (User A's deposits strictly shielded)",
      );
    }

    console.log(
      "\n--- 8. Payment Semantics & Signature Verification Regression ---",
    );
    {
      const initialUserA = await UserModel.findById(userAId);
      const initialBal = initialUserA.balance;

      const resOrder = await fetch(`${baseUrl}/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie },
        body: JSON.stringify({ amount: 1500 }),
      });
      assert(
        resOrder.status === 201,
        "Created test order for semantics verification (201 Created)",
      );
      const orderData = (await resOrder.json()).data;
      const paymentId = `pay_reg_${Date.now()}`;

      const resBadSig = await fetch(`${baseUrl}/payments/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie },
        body: JSON.stringify({
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: "forged_invalid_signature_hex_12345",
        }),
      });

      assert(
        resBadSig.status === 400,
        "Invalid signature returns 400 Bad Request",
      );
      const badSigBody = await resBadSig.json();
      assert(
        badSigBody.code === "INVALID_PAYMENT_SIGNATURE",
        "Returns code INVALID_PAYMENT_SIGNATURE",
      );

      const userAfterBadSig = await UserModel.findById(userAId);
      assert(
        userAfterBadSig.balance === initialBal,
        "PROVE 1: Invalid signature does not credit balance",
      );

      const txAfterBadSig = await WalletTransactionModel.findOne({
        providerOrderId: orderData.orderId,
      });
      assert(
        txAfterBadSig?.status === "PAYMENT_PENDING",
        "PROVE 2: Invalid signature does not prematurely transition PAYMENT_PENDING to FAILED",
      );

      const secret = RAZORPAY_KEY_SECRET || "mock_secret_key_1234567890";
      const validSig = crypto
        .createHmac("sha256", secret)
        .update(`${orderData.orderId}|${paymentId}`)
        .digest("hex");

      const resValidSig = await fetch(`${baseUrl}/payments/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie },
        body: JSON.stringify({
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: validSig,
        }),
      });

      assert(resValidSig.status === 200, "Valid verification returns 200 OK");
      const txAfterValid = await WalletTransactionModel.findOne({
        providerOrderId: orderData.orderId,
      });
      assert(
        txAfterValid?.status === "SUCCESS",
        "Transaction transitioned to SUCCESS",
      );

      const userAfterValid = await UserModel.findById(userAId);
      assert(
        userAfterValid.balance === initialBal + 1500,
        "PROVE 3: A later valid verification can still complete the same transaction",
      );

      const resRepeat = await fetch(`${baseUrl}/payments/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie },
        body: JSON.stringify({
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: validSig,
        }),
      });

      assert(resRepeat.status === 200, "Repeated verification returns 200 OK");
      const repeatBody = await resRepeat.json();
      assert(
        repeatBody.data?.idempotent === true,
        "Repeated verification reports idempotent: true",
      );

      const userAfterRepeat = await UserModel.findById(userAId);
      assert(
        userAfterRepeat.balance === initialBal + 1500,
        "PROVE 4: Repeated valid verification remains idempotent (no double credit)",
      );

      const resOrderFail = await fetch(`${baseUrl}/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie },
        body: JSON.stringify({ amount: 2000 }),
      });
      const orderFailData = (await resOrderFail.json()).data;
      const failPaymentId = `pay_fail_${Date.now()}`;

      const failWebhookPayload = JSON.stringify({
        entity: "event",
        account_id: "acc_tradely_test",
        event: "payment.failed",
        contains: ["payment"],
        payload: {
          payment: {
            entity: {
              id: failPaymentId,
              order_id: orderFailData.orderId,
              amount: 200000,
              currency: "INR",
              status: "failed",
              error_code: "BAD_REQUEST_ERROR",
              error_description: "Payment failed at issuing bank",
            },
          },
        },
      });

      const hookSecret = RAZORPAY_WEBHOOK_SECRET || "mock_webhook_secret_12345";
      const hookSig = crypto
        .createHmac("sha256", hookSecret)
        .update(Buffer.from(failWebhookPayload, "utf8"))
        .digest("hex");

      const resHookFail = await fetch(`${baseUrl}/webhooks/razorpay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-razorpay-signature": hookSig,
        },
        body: failWebhookPayload,
      });

      assert(
        resHookFail.status === 200,
        "Webhook payment.failed processed with 200 OK",
      );

      const txAfterFail = await WalletTransactionModel.findOne({
        providerOrderId: orderFailData.orderId,
      });
      assert(
        txAfterFail?.status === "FAILED",
        "PROVE 5: Provider-confirmed failure still transitions to FAILED correctly",
      );
      assert(
        txAfterFail?.metadata?.failureReason ===
          "Payment failed at issuing bank",
        "Records authoritative failureReason from provider",
      );

      const resVerifyFailed = await fetch(`${baseUrl}/payments/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie },
        body: JSON.stringify({
          razorpay_order_id: orderFailData.orderId,
          razorpay_payment_id: failPaymentId,
          razorpay_signature: validSig,
        }),
      });
      assert(
        resVerifyFailed.status === 400,
        "Cannot verify already FAILED transaction (400)",
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
