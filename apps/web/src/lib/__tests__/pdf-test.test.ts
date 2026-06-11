import { expect, test } from "vitest";
import { generateComparisonPDFHTML } from "../pdf-template";
import { renderPDF } from "../pdf";
import {
  mockResumeProfile,
  mockJobDescriptionProfile,
  mockInitialScore,
  mockTailoredScore,
  mockResumeGaps,
  mockTailoredResume,
} from "../mock-data";
import fs from "fs";
import path from "path";

test("Generate and render PDF", async () => {
  const payload = {
    type: "comparison",
    resumeProfile: mockResumeProfile,
    jobDescriptionProfile: mockJobDescriptionProfile,
    initialScore: mockInitialScore,
    tailoredScore: mockTailoredScore,
    gaps: mockResumeGaps,
    tailoredResume: mockTailoredResume,
  };

  const html = generateComparisonPDFHTML(payload);
  expect(html).toContain("Resume Tailoring Comparison Proof");

  console.log("HTML generated successfully. Rendering PDF...");
  const pdfBuffer = await renderPDF(html);
  console.log("PDF generated successfully. Size:", pdfBuffer.length);
  expect(pdfBuffer.length).toBeGreaterThan(1000);

  const outPath = path.join(__dirname, "../../../test-out.pdf");
  fs.writeFileSync(outPath, pdfBuffer);
  console.log("PDF written to:", outPath);
});
