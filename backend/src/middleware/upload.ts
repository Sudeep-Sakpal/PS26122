import multer from "multer";
import { ApiError } from "../utils/ApiError";

const ALLOWED_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls (some browsers/tools mislabel .xlsx this way)
  "application/octet-stream", // generic fallback some clients send
]);

export const uploadSchedule = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB, matches the frontend's stated limit
  fileFilter: (_req, file, cb) => {
    const isXlsxExtension = file.originalname.toLowerCase().endsWith(".xlsx");
    if (!isXlsxExtension && !ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(ApiError.badRequest("Only .xlsx schedule files are accepted"));
      return;
    }
    cb(null, true);
  },
}).single("file");
