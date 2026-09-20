import type { NextFunction, Request, Response } from "express";
import { MongooseError } from "mongoose";
import { MulterError } from "multer";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError";
import { isProduction } from "../config/env";

interface ErrorResponseBody {
  success: false;
  message: string;
  details?: unknown;
  stack?: string;
}

// Centralized error handler — every route funnels here via asyncHandler /
// Express 5's automatic promise-rejection forwarding.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  let statusCode = 500;
  let message = "Internal server error";
  let details: unknown;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation failed";
    details = err.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
  } else if (err instanceof MulterError) {
    statusCode = 400;
    message = `File upload error: ${err.message}`;
  } else if (err && typeof err === "object" && "name" in err && err.name === "CastError") {
    statusCode = 400;
    message = "Invalid identifier format";
  } else if (
    err &&
    typeof err === "object" &&
    "code" in err &&
    (err as { code?: number }).code === 11000
  ) {
    statusCode = 409;
    message = "A record with this value already exists";
    details = (err as { keyValue?: unknown }).keyValue;
  } else if (err instanceof MongooseError) {
    statusCode = 400;
    message = err.message;
  } else if (err instanceof Error) {
    message = isProduction ? message : err.message;
  }

  if (statusCode >= 500) {
    console.error("[error]", err);
  }

  const body: ErrorResponseBody = { success: false, message };
  if (details !== undefined) body.details = details;
  if (!isProduction && err instanceof Error) body.stack = err.stack;

  res.status(statusCode).json(body);
}
