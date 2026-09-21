import http from "http";
import app from "./app.js";
import { PORT, NODE_ENV } from "./config/env.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { HoldingsModel } from "./models/HoldingsModel.js";
import { OrdersModel } from "./models/OrdersModel.js";
import { PositionsModel } from "./models/PositionsModel.js";
import { AccountModel } from "./models/AccountModel.js";
import { initSocket, closeSocket } from "./socket.js";
import {
  startMarketSimulation,
  stopMarketSimulation,
} from "./services/marketDataService.js";
import { ensurePendingWithdrawalMigration } from "./services/accountService.js";
import { recoverPendingWithdrawals } from "./services/withdrawalService.js";
import { logger } from "./utils/logger.js";

let server = null;
let isShuttingDown = false;

/**
 * Clean up legacy unassigned Phase 1/2 demo data that lacks userId
 */
const cleanupLegacyOrphanData = async () => {
  try {
    const orphanHoldings = await HoldingsModel.deleteMany({ userId: { $exists: false } });
    const orphanOrders = await OrdersModel.deleteMany({ userId: { $exists: false } });
    const orphanPositions = await PositionsModel.deleteMany({ userId: { $exists: false } });
    await AccountModel.deleteMany({});

    if (orphanHoldings.deletedCount || orphanOrders.deletedCount || orphanPositions.deletedCount) {
      logger.info(
        `Phase 3 Data Reset: Cleaned up legacy data (${orphanHoldings.deletedCount} holdings, ${orphanOrders.deletedCount} orders, ${orphanPositions.deletedCount} positions).`
      );
    }
  } catch (err) {
    logger.warn("Legacy data cleanup notice:", { error: err.message });
  }
};

/**
 * Starts the application:
 * 1. Connects to MongoDB
 * 2. Purges legacy orphan records
 * 3. Initializes Socket.IO on HTTP server
 * 4. Starts Market Data Simulation loop
 * 5. Starts listening for HTTP requests
 */
export const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Perform Phase 3 legacy data reset & Phase 10B migration/recovery
    await cleanupLegacyOrphanData();
    await ensurePendingWithdrawalMigration();
    await recoverPendingWithdrawals();

    // 3. Create HTTP Server & initialize Socket.IO
    server = http.createServer(app);
    initSocket(server);

    // 4. Start Market Data Simulation
    startMarketSimulation(1500);

    // 5. Start listening
    await new Promise((resolve) => {
      server.listen(PORT, () => {
        logger.info(`Tradely Backend server listening on PORT ${PORT}`, {
          port: PORT,
          environment: NODE_ENV,
        });
        resolve();
      });
    });

    return server;
  } catch (err) {
    logger.error("Server startup failed:", { error: err.message, stack: err.stack });
    process.exit(1);
  }
};

/**
 * Handles graceful, idempotent shutdown on SIGINT and SIGTERM
 * Sequence:
 * 1. Stop market simulation loop
 * 2. Close Socket.IO connections
 * 3. Await HTTP server closure (stop accepting new requests)
 * 4. Disconnect MongoDB
 * 5. Flush logs and exit process
 */
export const gracefulShutdown = async (signal = "SIGTERM") => {
  if (isShuttingDown) {
    logger.warn(`Shutdown already in progress. Ignoring duplicate signal ${signal}.`);
    return;
  }
  isShuttingDown = true;

  logger.info(`Received ${signal}. Initiating graceful shutdown sequence...`);

  // Bounded timeout: force exit if graceful termination hangs past 10 seconds
  const forceExitTimeout = setTimeout(() => {
    logger.error("Graceful shutdown timed out after 10s. Forcing exit.");
    process.exit(1);
  }, 10000);

  if (forceExitTimeout.unref) {
    forceExitTimeout.unref();
  }

  try {
    // 1. Stop market simulation loop to prevent background ticks
    stopMarketSimulation();
    logger.info("1/4 Market data simulation stopped.");

    // 2. Close all active Socket.IO connections
    await closeSocket();
    logger.info("2/4 Socket.IO transport server closed.");

    // 3. Await HTTP server closure
    if (server && server.listening) {
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) return reject(err);
          resolve();
        });
      });
      logger.info("3/4 HTTP server closed (no longer accepting connections).");
    }

    // 4. Close MongoDB connection
    await disconnectDB();
    logger.info("4/4 Database disconnected successfully.");

    logger.info("Graceful shutdown completed successfully. Exiting.");
    clearTimeout(forceExitTimeout);

    if (process.env.NODE_ENV !== "test") {
      process.exit(0);
    }
  } catch (err) {
    logger.error("Error during graceful shutdown:", { error: err.message, stack: err.stack });
    clearTimeout(forceExitTimeout);
    if (process.env.NODE_ENV !== "test") {
      process.exit(1);
    }
  }
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Auto-start server when executed directly as main script
if (process.env.NODE_ENV !== "test") {
  startServer();
}
