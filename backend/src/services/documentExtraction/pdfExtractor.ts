import { PDFParse } from "pdf-parse";
import { ApiError } from "../../utils/ApiError";

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text ?? "";
  } catch {
    throw ApiError.badRequest("Could not read the uploaded file as a .pdf document");
  } finally {
    await parser.destroy();
  }
}
