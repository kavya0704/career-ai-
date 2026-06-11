import { NextResponse } from "next/server";
import { extractTextFromFile } from "@/lib/parser";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded", code: "MISSING_FILE" },
        { status: 400 }
      );
    }

    // Enforce 5MB limit
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size allowed is 5MB.", code: "FILE_TOO_LARGE" },
        { status: 413 }
      );
    }

    const filename = file.name;
    const extension = filename.split(".").pop()?.toLowerCase();
    if (extension !== "pdf" && extension !== "docx") {
      return NextResponse.json(
        { error: `Unsupported file format: .${extension}. Only PDF and DOCX files are allowed.`, code: "UNSUPPORTED_FORMAT" },
        { status: 415 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      const rawText = await extractTextFromFile(buffer, filename);
      return NextResponse.json({ rawText });
    } catch (parseErr: any) {
      return NextResponse.json(
        { error: "Failed to parse document content.", code: "PARSE_FAILURE", details: parseErr.message },
        { status: 422 }
      );
    }
  } catch (err: any) {
    console.error("File parsing error:", err.message);
    return NextResponse.json(
      { error: "Failed to process file upload request.", code: "INTERNAL_SERVER_ERROR", details: err.message },
      { status: 500 }
    );
  }
}

