import http from "http";
import crypto from "crypto";

process.env.PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || "mock";

const { default: app } = await import("../src/app.js");
const { connectDB, disconnectDB } = await import("../src/config/db.js");
const { UserModel } = await import("../src/models/UserModel.js");
const { WalletTransactionModel } =
  await import("../src/models/WalletTransactionModel.js");
const withdrawalService = await import("../src/services/withdrawalService.js");
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

const runManualFlows = async () => {
  console.log("==================================================");
  console.log("TRADELY CONCURRENCY & EDGE-CASE FLOWS VERIFICATION");
  console.log("==================================================");

  let server;
  let baseUrl;

  try {
    await connectDB();

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;

    await UserModel.deleteMany({ email: "flow_user@tradely.test" });

    const resAuth = await fetch(`${baseUrl}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "FlowTrader",
        email: "flow_user@tradely.test",
        password: "TestPassword123!",
      }),
    });
    const cookie = resAuth.headers.get("set-cookie");
    const userData = (await resAuth.json()).data;
    const userId = userData.user?.id || userData.user?._id;

    console.log(
      "\n--- Scenario 1: PROCESSING withdrawals cannot be cancelled ---",
    );
    {
      const resCreate = await fetch(`${baseUrl}/withdrawals`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({
          amount: 5000,
          method: "UPI_SIMULATED",
          destination: "flow@okhdfcbank",
        }),
      });
      assert(
        resCreate.status === 201,
        "Created withdrawal for processing test",
      );
      const tx = (await resCreate.json()).data.transaction;

      await WalletTransactionModel.findByIdAndUpdate(tx._id, {
        status: "PROCESSING",
      });

      const resCancel = await fetch(`${baseUrl}/withdrawals/${tx._id}/cancel`, {
        method: "POST",
        headers: { Cookie: cookie },
      });
      assert(
        resCancel.status === 400,
        "Attempt to cancel PROCESSING withdrawal returns 400",
      );
      const cancelBody = await resCancel.json();
      assert(
        cancelBody.code === "CANNOT_CANCEL_WITHDRAWAL",
        "Returns CANNOT_CANCEL_WITHDRAWAL error code",
      );

      await WalletTransactionModel.findByIdAndUpdate(tx._id, {
        status: "SUCCESS",
      });
      await UserModel.findByIdAndUpdate(userId, {
        $inc: { pendingWithdrawalAmount: -5000, balance: -5000 },
      });
    }

    console.log(
      "\n--- Scenario 2: FAILED withdrawals release pending reservation ---",
    );
    {
      const userBefore = await UserModel.findById(userId);
      const balanceBefore = userBefore.balance;

      const resCreate = await fetch(`${baseUrl}/withdrawals`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({
          amount: 12000,
          method: "BANK_SIMULATED",
          destination: "123456789012",
        }),
      });
      assert(resCreate.status === 201, "Created withdrawal of ₹12,000");
      const tx = (await resCreate.json()).data.transaction;

      const userMid = await UserModel.findById(userId);
      assert(
        userMid.pendingWithdrawalAmount === 12000,
        "pendingWithdrawalAmount reserved to 12,000",
      );

      const failResult = await withdrawalService.processSimulatedWithdrawal(
        tx._id,
        "FAILED",
      );
      assert(failResult.success === true, "Processing to FAILED completed");
      assert(failResult.transaction.status === "FAILED", "Status is FAILED");

      const userAfter = await UserModel.findById(userId);
      assert(
        userAfter.pendingWithdrawalAmount === 0,
        "pendingWithdrawalAmount released back to 0",
      );
      assert(
        userAfter.balance === balanceBefore,
        "balance remains unchanged after FAILED withdrawal",
      );
    }

    console.log(
      "\n--- Scenario 3: Cancel-vs-processing race is reflected correctly ---",
    );
    {
      const resCreate = await fetch(`${baseUrl}/withdrawals`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({
          amount: 7500,
          method: "UPI_SIMULATED",
          destination: "race@upi",
        }),
      });
      const tx = (await resCreate.json()).data.transaction;

      await WalletTransactionModel.findByIdAndUpdate(tx._id, {
        status: "PROCESSING",
      });

      const resCancel = await fetch(`${baseUrl}/withdrawals/${tx._id}/cancel`, {
        method: "POST",
        headers: { Cookie: cookie },
      });
      assert(
        resCancel.status === 400,
        "Race condition: Cancel loses to PROCESSING cleanly with 400",
      );
      const errBody = await resCancel.json();
      assert(
        errBody.message.includes("PROCESSING"),
        `Error message accurately explains current state (${errBody.message})`,
      );

      await withdrawalService.processSimulatedWithdrawal(tx._id, "SUCCESS");
    }

    console.log(
      "\n--- Scenario 4: Failed payment verification does not increase balance ---",
    );
    {
      const userBefore = await UserModel.findById(userId);
      const balanceBefore = userBefore.balance;

      const resOrder = await fetch(`${baseUrl}/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ amount: 15000 }),
      });
      const order = (await resOrder.json()).data;

      const resBadSig = await fetch(`${baseUrl}/payments/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({
          razorpay_order_id: order.orderId,
          razorpay_payment_id: "pay_bad_sig_123",
          razorpay_signature: "forged_cryptographic_signature_value",
        }),
      });
      assert(
        resBadSig.status === 400,
        "Verification with invalid signature fails with 400",
      );

      const userAfter = await UserModel.findById(userId);
      assert(
        userAfter.balance === balanceBefore,
        "Balance did NOT increase after failed verification",
      );

      const pendingTx = await WalletTransactionModel.findOne({
        providerOrderId: order.orderId,
      });
      assert(
        pendingTx?.status === "PAYMENT_PENDING",
        "Transaction remains in PAYMENT_PENDING (not marked FAILED)",
      );
    }

    console.log(
      "\n--- Scenario 5: No false balance increase occurs after reload ---",
    );
    {
      const resOrder = await fetch(`${baseUrl}/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ amount: 10000 }),
      });
      const order = (await resOrder.json()).data;
      const paymentId = `pay_succ_${Date.now()}`;
      const mockSecret = RAZORPAY_KEY_SECRET || "mock_secret_key_1234567890";
      const sig = crypto
        .createHmac("sha256", mockSecret)
        .update(`${order.orderId}|${paymentId}`)
        .digest("hex");

      const resVerify = await fetch(`${baseUrl}/payments/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({
          razorpay_order_id: order.orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: sig,
        }),
      });
      assert(resVerify.status === 200, "Genuine deposit verified with 200");

      const userAfterDeposit = await UserModel.findById(userId);
      const verifiedBalance = userAfterDeposit.balance;

      for (let i = 1; i <= 5; i++) {
        const resReload = await fetch(`${baseUrl}/funds`, {
          headers: { Cookie: cookie },
        });
        const fundsData = (await resReload.json()).data;
        assert(
          fundsData.balance === verifiedBalance,
          `Page reload ${i}: Authoritative balance remains stable (₹${fundsData.balance})`,
        );
      }

      const resReplay = await fetch(`${baseUrl}/payments/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({
          razorpay_order_id: order.orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: sig,
        }),
      });
      assert(resReplay.status === 200, "Idempotent replay returns 200 OK");
      const replayData = await resReplay.json();
      assert(
        replayData.data.idempotent === true,
        "Indicates idempotent replay",
      );

      const userAfterReplay = await UserModel.findById(userId);
      assert(
        userAfterReplay.balance === verifiedBalance,
        "No false balance increase on duplicate verification replay",
      );
    }

    console.log("\n==================================================");
    console.log(`MANUAL FLOWS SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================");
  } catch (err) {
    console.error("Manual flows encountered error:", err);
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

runManualFlows();
