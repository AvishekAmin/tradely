import mongoose from "mongoose";

/**
 * Execute a unit of work within a MongoDB transaction with transient retry handling.
 * 
 * If the active MongoDB cluster does not support transactions (e.g. standalone instance),
 * it safely falls back to executing the callback without a session.
 * 
 * @param {Function} workFn - Async function (session) => Promise<T>
 * @param {number} maxRetries - Maximum retries on transient transaction errors
 * @returns {Promise<T>} Result of workFn
 */
export const runInTransaction = async (workFn, maxRetries = 3) => {
  let session;
  try {
    session = await mongoose.startSession();
  } catch (err) {
    // If sessions cannot be created, execute directly without transaction
    console.warn("MongoDB sessions unavailable, executing without session:", err.message);
    return workFn(null);
  }

  try {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        let result;
        await session.withTransaction(
          async () => {
            result = await workFn(session);
          },
          {
            readPreference: "primary",
            readConcern: { level: "local" },
            writeConcern: { w: "majority" },
          }
        );
        return result;
      } catch (err) {
        // If transactions are not supported on this MongoDB topology, fallback
        const combinedErrorStr = [
          err?.message,
          err?.errmsg,
          err?.errorResponse?.message,
          err?.errorResponse?.errmsg,
          err?.originalError?.message,
          err?.originalError?.errmsg,
        ]
          .filter(Boolean)
          .join(" ");

        if (
          combinedErrorStr.includes("replica set member") ||
          combinedErrorStr.includes("standalone") ||
          combinedErrorStr.includes("Transaction numbers are only allowed") ||
          combinedErrorStr.includes("does not support retryable writes") ||
          combinedErrorStr.includes("retryWrites=false")
        ) {
          console.warn("MongoDB transactions not supported on this topology, executing without session.");
          return workFn(null);
        }

        const isTransient =
          (err.hasErrorLabel &&
            (err.hasErrorLabel("TransientTransactionError") ||
              err.hasErrorLabel("UnknownTransactionCommitResult"))) ||
          (err.message && err.message.includes("WriteConflict"));

        if (isTransient && attempt < maxRetries) {
          console.warn(`Transient transaction conflict (attempt ${attempt}/${maxRetries}), retrying...`);
          await new Promise((res) => setTimeout(res, 50 * attempt));
          continue;
        }

        throw err;
      }
    }
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};
