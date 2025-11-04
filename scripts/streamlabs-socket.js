#!/usr/bin/env node
// Small script to connect to Streamlabs sockets and log donation events.
// Usage: node scripts/streamlabs-socket.js
import dotenv from "dotenv";
// Prefer loading .env.local for Next.js local environment, fall back to .env
dotenv.config({ path: ".env.local" });
// also load default .env to pick any missing values
dotenv.config();
import { io } from "socket.io-client";
import fs from "fs";
import path from "path";
import tokenStore from "../lib/tokenStore.js";

async function main() {
  const clientId = process.env.STREAMLABS_CLIENT_ID;
  if (!clientId) {
    console.error("STREAMLABS_CLIENT_ID not set");
    process.exit(1);
  }
  const tokenEntry = await tokenStore.get("streamlabs", clientId);
  if (!tokenEntry || !tokenEntry.access_token) {
    console.error("No streamlabs token stored. Run OAuth flow first.");
    process.exit(1);
  }
  const token = tokenEntry.access_token;

  console.log("Connecting to Streamlabs sockets...");
  // Do not force 'websocket' transport — allow polling handshake first which Streamlabs expects
  const socket = io("https://sockets.streamlabs.com", {
    query: { token },
    auth: { token },
    reconnection: true,
    // Some servers expect Origin/Referer headers or require them during the polling handshake.
    // Provide extra headers for polling and websocket transports.
    transportOptions: {
      polling: {
        extraHeaders: {
          Origin: "https://streamlabs.com",
          Referer: "https://streamlabs.com",
        },
      },
      websocket: {
        extraHeaders: {
          Origin: "https://streamlabs.com",
          Referer: "https://streamlabs.com",
        },
      },
    },
  });

  socket.on("connect", () => console.log("Connected to Streamlabs socket"));
  socket.on("disconnect", (reason) => console.log("Disconnected: ", reason));
  socket.on("event", (payload) => {
    // payload contains details; donation events usually have type 'donation'
    console.log("Event:", JSON.stringify(payload, null, 2));
    // persist to a small log file
    const logDir = path.resolve(process.cwd(), "data");
    try {
      if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
      const logFile = path.join(logDir, "streamlabs-events.log");
      fs.appendFileSync(
        logFile,
        JSON.stringify({ ts: new Date().toISOString(), payload }) + "\n"
      );
    } catch (e) {
      console.error("Failed to write event log:", e);
    }
  });

  socket.on("connect_error", (err) => console.error("connect_error", err));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
