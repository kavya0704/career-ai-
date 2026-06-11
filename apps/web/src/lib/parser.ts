// Resume & Document Parser Utilities
// Handles PDF and DOCX text extraction

import "pdf-parse/worker";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

/**
 * Extract raw text from a PDF buffer.
 * Uses the modern `pdf-parse` library with its class interface.
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const uint8Array = new Uint8Array(buffer);
    const parser = new PDFParse({ data: uint8Array });
    const textResult = await parser.getText();
    await parser.destroy();
    return textResult.text || "";
  } catch (err: any) {
    throw new Error(`Failed to parse PDF document: ${err.message}`);
  }
}

/**
 * Extract raw text from a DOCX buffer.
 * Uses the `mammoth` library.
 */
export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch (err: any) {
    throw new Error(`Failed to parse DOCX document: ${err.message}`);
  }
}

/**
 * Detect file type from extension and extract text accordingly.
 */
export async function extractTextFromFile(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const extension = filename.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "pdf":
      return extractTextFromPDF(buffer);
    case "docx":
      return extractTextFromDOCX(buffer);
    default:
      throw new Error(`Unsupported file format: .${extension}`);
  }
}
