import mongoose from "mongoose";
import { env } from "./env";

mongoose.set("strictQuery", true);

export async function connectDB(): Promise<void> {
  mongoose.connection.on("connected", () => {
    console.log(`[db] connected -> ${mongoose.connection.name}`);
  });

  mongoose.connection.on("error", (err) => {
    console.error("[db] connection error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[db] disconnected");
  });

  await mongoose.connect(env.mongoUri);
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
