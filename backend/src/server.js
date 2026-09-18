import http from "http";
import app from "./app.js";
import { PORT } from "./config/env.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { HoldingsModel } from "./models/HoldingsModel.js";
import { OrdersModel } from "./models/OrdersModel.js";
import { PositionsModel } from "./models/PositionsModel.js";
import { AccountModel } from "./models/AccountModel.js";
import { initSocket } from "./socket.js";
import {
  startMarketSimulation,
  stopMarketSimulation,
} from "./services/marketDataService.js";

let server;

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
      console.log(
        `Phase 3 Data Reset: Cleaned up legacy data (${orphanHoldings.deletedCount} holdings, ${orphanOrders.deletedCount} orders, ${orphanPositions.deletedCount} positions).`
      );
    }
  } catch (err) {
    console.warn("Legacy data cleanup notice:", err.message);
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
const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Perform Phase 3 legacy data reset
    await cleanupLegacyOrphanData();

    // 3. Create HTTP Server & initialize Socket.IO
    server = http.createServer(app);
    initSocket(server);

    // 4. Start Market Data Simulation
    startMarketSimulation(1500);

    // 5. Start listening
    server.listen(PORT, () => {
      console.log(`Tradely Backend server listening on PORT ${PORT}`);
    });
  } catch (err) {
    console.error("Server startup failed:", err.message);
    process.exit(1);
  }
};

/**
 * Handles graceful shutdown on SIGINT and SIGTERM
 */
const gracefulShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Initiating graceful shutdown...`);

  // Stop simulation loop
  stopMarketSimulation();

  if (server) {
    server.close(async () => {
      console.log("HTTP server closed.");
      try {
        await disconnectDB();
        console.log("Graceful shutdown completed successfully.");
        process.exit(0);
      } catch (err) {
        console.error("Error during DB disconnect on shutdown:", err.message);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

startServer();

