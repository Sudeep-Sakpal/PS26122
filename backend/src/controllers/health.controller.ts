import type { Request, Response } from "express";
import { isDbConnected } from "../config/db";

export function getHealth(_req: Request, res: Response) {
  res.status(200).json({
    status: "ok",
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    db: isDbConnected() ? "connected" : "disconnected",
  });
}
