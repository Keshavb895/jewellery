import mongoose from "mongoose";

let isConnected = false;
let lastConnectionError = null;
let retryTimer = null;

// Attach connection lifecycle events
mongoose.connection.on("connected", () => {
  isConnected = true;
  lastConnectionError = null;
  console.log(`[MongoDB] Successfully connected to host: ${mongoose.connection.host}`);
});

mongoose.connection.on("disconnected", () => {
  isConnected = false;
  console.warn("[MongoDB] Connection disconnected.");
});

mongoose.connection.on("error", (err) => {
  isConnected = false;
  lastConnectionError = err.message;
  console.error(`[MongoDB] Connection error: ${err.message}`);
});

export async function connectDB() {
  const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/jewels";

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    lastConnectionError = null;
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);

    if (retryTimer) {
      clearInterval(retryTimer);
      retryTimer = null;
    }
  } catch (error) {
    isConnected = false;
    lastConnectionError = error.message;

    const isAtlas = mongoURI.includes("mongodb.net");
    const isSslAlert =
      error.message.includes("alert number 80") ||
      error.message.includes("tlsv1 alert internal error") ||
      error.message.includes("SSL routines");

    console.warn("\n" + "=".repeat(65));
    console.warn("[MongoDB Connection Notice] Could NOT connect to MongoDB Atlas!");
    console.warn(`Error Details: ${error.message}`);
    if (isAtlas && (isSslAlert || error.name === "MongooseServerSelectionError")) {
      console.warn("-> CAUSE: Your current IP address is not whitelisted in MongoDB Atlas.");
      console.warn("-> FIX: Go to MongoDB Atlas (cloud.mongodb.com) -> Network Access");
      console.warn("        Click 'Add IP Address' -> Add Current IP Address (or 0.0.0.0/0)");
    }
    console.warn("Demo / Fallback mode is active (credentials saved only in-memory).");
    console.warn("=".repeat(65) + "\n");

    // Automatically retry connecting every 15 seconds so Atlas IP changes take effect immediately
    if (!retryTimer) {
      retryTimer = setInterval(async () => {
        if (!isDbConnected()) {
          try {
            await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 5000 });
            console.log(`[MongoDB] Reconnection successful to ${mongoose.connection.host}!`);
            isConnected = true;
            lastConnectionError = null;
            clearInterval(retryTimer);
            retryTimer = null;
          } catch (e) {
            // Quietly wait for next retry cycle
          }
        } else {
          clearInterval(retryTimer);
          retryTimer = null;
        }
      }, 15000);
    }
  }
}

export function isDbConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

export function getDbError() {
  return lastConnectionError;
}
