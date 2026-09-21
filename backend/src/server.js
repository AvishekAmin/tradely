import http from "http";
import app from "./app.js";
import { PORT, NODE_ENV } from "./config/env.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { HoldingsModel } from "./models/HoldingsModel.js";
import { OrdersModel } from "./models/OrdersModel.js";
import { PositionsModel } from "./models/PositionsModel.js";
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

const cleanupLegacyOrphanData = async () => {
  try {
    const orphanHoldings = await HoldingsModel.deleteMany({
      userId: { $exists: false },
    });
    const orphanOrders = await OrdersModel.deleteMany({
      userId: { $exists: false },
    });
    const orphanPositions = await PositionsModel.deleteMany({
      userId: { $exists: false },
    });

    if (
      orphanHoldings.deletedCount ||
      orphanOrders.deletedCount ||
      orphanPositions.deletedCount
    ) {
      logger.info(
        `Data Reset: Cleaned up legacy data (${orphanHoldings.deletedCount} holdings, ${orphanOrders.deletedCount} orders, ${orphanPositions.deletedCount} positions).`,
      );
    }
  } catch (err) {
    logger.warn("Legacy data cleanup notice:", { error: err.message });
  }
};

export const startServer = async () => {
  try {
    await connectDB();

    await cleanupLegacyOrphanData();
    await ensurePendingWithdrawalMigration();
    await recoverPendingWithdrawals();

    server = http.createServer(app);
    initSocket(server);

    startMarketSimulation(1500);

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
    logger.error("Server startup failed:", {
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
};

export const gracefulShutdown = async (signal = "SIGTERM") => {
  if (isShuttingDown) {
    logger.warn(
      `Shutdown already in progress. Ignoring duplicate signal ${signal}.`,
    );
    return;
  }
  isShuttingDown = true;

  logger.info(`Received ${signal}. Initiating graceful shutdown sequence...`);

  const forceExitTimeout = setTimeout(() => {
    logger.error("Graceful shutdown timed out after 10s. Forcing exit.");
    process.exit(1);
  }, 10000);

  if (forceExitTimeout.unref) {
    forceExitTimeout.unref();
  }

  try {
    stopMarketSimulation();
    logger.info("1/4 Market data simulation stopped.");

    await closeSocket();
    logger.info("2/4 Socket.IO transport server closed.");

    if (server && server.listening) {
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) return reject(err);
          resolve();
        });
      });
      logger.info("3/4 HTTP server closed (no longer accepting connections).");
    }

    await disconnectDB();
    logger.info("4/4 Database disconnected successfully.");

    logger.info("Graceful shutdown completed successfully. Exiting.");
    clearTimeout(forceExitTimeout);

    if (process.env.NODE_ENV !== "test") {
      process.exit(0);
    }
  } catch (err) {
    logger.error("Error during graceful shutdown:", {
      error: err.message,
      stack: err.stack,
    });
    clearTimeout(forceExitTimeout);
    if (process.env.NODE_ENV !== "test") {
      process.exit(1);
    }
  }
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

if (process.env.NODE_ENV !== "test") {
  startServer();
}
