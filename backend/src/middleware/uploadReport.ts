import multer from "multer";
import { ApiError } from "../utils/ApiError";

const ALLOWED_EXTENSIONS = new Set(["txt", "pdf", "xlsx"]);
const ALLOWED_MIME_TYPES = new Set([
  "text/plain",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/octet-stream", // generic fallback some clients send
]);

export const uploadReport = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB, matches the schedule upload convention
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.toLowerCase().split(".").pop();
    if ((!ext || !ALLOWED_EXTENSIONS.has(ext)) && !ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(ApiError.badRequest("Only .txt, .pdf, or .xlsx report files are accepted"));
      return;
    }
    cb(null, true);
  },
}).single("file");
