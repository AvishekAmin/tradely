import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { ALLOWED_ORIGINS, NODE_ENV, JWT_SECRET } from "./config/env.js";
import {
  marketEventEmitter,
  getAllQuotes,
} from "./services/marketDataService.js";
import { orderEventEmitter } from "./services/orderLifecycleService.js";

let io = null;

const parseCookies = (cookieHeader) => {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    if (parts.length >= 2) {
      cookies[parts[0].trim()] = decodeURIComponent(
        parts.slice(1).join("=").trim(),
      );
    }
  });
  return cookies;
};

export const initSocket = (httpServer) => {
  if (io) {
    return io;
  }

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        if (ALLOWED_ORIGINS.includes(origin)) {
          return callback(null, true);
        }

        if (NODE_ENV !== "production") {
          if (
            /^http:\/\/localhost:\d+$/.test(origin) ||
            /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
          ) {
            return callback(null, true);
          }
        }

        return callback(new Error(`CORS origin not allowed: ${origin}`));
      },
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    try {
      const cookies = parseCookies(socket.request?.headers?.cookie);
      const token = cookies.token || socket.handshake?.auth?.token;
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded && decoded.id) {
          socket.userId = decoded.id.toString();
          socket.join(`user:${decoded.id}`);
        }
      }
    } catch {}

    socket.emit("market:initial", getAllQuotes());

    socket.on("disconnect", () => {});
  });

  marketEventEmitter.on("quote:update", (quote) => {
    if (io) {
      io.emit("price:update", quote);
    }
  });

  orderEventEmitter.on("order:update", ({ userId, order }) => {
    if (io && userId) {
      io.to(`user:${userId}`).emit("order:update", order);
    }
  });

  console.log(
    "Socket.IO initialized: transport layer active with private user rooms",
  );
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO has not been initialized yet.");
  }
  return io;
};

export const closeSocket = async () => {
  if (!io) return;

  return new Promise((resolve) => {
    io.close(() => {
      io = null;
      resolve();
    });
  });
};
