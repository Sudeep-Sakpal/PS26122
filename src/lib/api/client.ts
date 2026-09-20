// Thin fetch wrapper for the PS 26122 backend (see backend/API.md).
// Every endpoint returns { success, data, count? } on success or
// { success: false, message, details? } on error — this unwraps that
// envelope once so callers just deal with plain data or a thrown ApiError.

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  count?: number;
  message?: string;
  details?: unknown;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        // FormData bodies (file uploads) must NOT get a JSON content-type —
        // the browser sets its own multipart/form-data boundary, and
        // overriding it here would break the upload.
        ...(init?.body && !(init.body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(
      "Could not reach the backend. Is the API server running?",
      0
    );
  }

  const body = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!res.ok || !body || body.success === false) {
    throw new ApiError(
      body?.message ?? `Request failed with status ${res.status}`,
      res.status,
      body?.details
    );
  }

  return body.data as T;
}
