// PDF Generation Utilities
// Uses headless Chromium (Playwright) for HTML-to-PDF rendering

import { chromium } from "playwright";

/**
 * Render an HTML string to a PDF buffer using headless Chromium.
 */
export async function renderPDF(html: string): Promise<Buffer> {
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Set content and wait for network assets (CDN scripts, fonts) to finish loading
    await page.setContent(html, { waitUntil: "networkidle" });

    // Print to PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "0.4in",
        bottom: "0.4in",
        left: "0.4in",
        right: "0.4in",
      },
    });

    return pdfBuffer;
  } catch (err: any) {
    console.error("Playwright PDF generation error:", err.message);
    throw new Error(`Failed to generate PDF document: ${err.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
