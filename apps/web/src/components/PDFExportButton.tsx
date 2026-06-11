"use client";

import React, { useState } from "react";
import { useTailoring } from "@/lib/context";
import { Button } from "@/components/ui/button";
import { generateComparisonPDFHTML, generateCleanResumePDFHTML } from "@/lib/pdf-template";

interface PDFExportButtonProps {
  disabled?: boolean;
}

export default function PDFExportButton({ disabled = false }: PDFExportButtonProps) {
  const {
    resumeProfile,
    tailoredResume,
    jobDescriptionProfile,
    initialScore,
    tailoredScore,
    gaps,
    showToast,
  } = useTailoring();

  const [exportType, setExportType] = useState<"comparison" | "clean" | null>(null);

  const triggerClientPrint = (type: "comparison" | "clean") => {
    if (!resumeProfile || !tailoredResume || !jobDescriptionProfile) return;

    try {
      let html = "";
      if (type === "comparison") {
        html = generateComparisonPDFHTML({
          resumeProfile,
          tailoredResume,
          jobDescriptionProfile,
          initialScore,
          tailoredScore,
          gaps,
        });
      } else {
        html = generateCleanResumePDFHTML({
          resumeProfile,
          tailoredResume,
        });
      }

      // Create temporary iframe for printing
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();

        // Focus and trigger print
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            showToast("Print dialog opened. Select 'Save as PDF' to export.", "success");
          } catch (printErr) {
            console.error("Print execution failed:", printErr);
            showToast("Failed to open print dialog.", "error");
          } finally {
            // Clean up iframe after print dialog completes
            setTimeout(() => {
              document.body.removeChild(iframe);
            }, 1000);
          }
        }, 1000); // 1s delay to let Tailwind CDN load inside the iframe
      } else {
        throw new Error("Could not access iframe document.");
      }
    } catch (err: any) {
      showToast("Failed to generate fallback PDF view.", "error");
      console.error(err);
    }
  };

  const handleExport = async (type: "comparison" | "clean") => {
    if (!resumeProfile || !tailoredResume || !jobDescriptionProfile) return;

    setExportType(type);

    // If running on Vercel, bypass server-side Playwright to avoid function limits/timeouts
    const isVercel =
      typeof window !== "undefined" &&
      (window.location.hostname.includes("vercel.app") ||
        window.location.hostname.includes("vercel"));

    if (isVercel) {
      console.log("Detected Vercel environment. Using client-side browser print for PDF export.");
      triggerClientPrint(type);
      setExportType(null);
      return;
    }

    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          resumeProfile,
          tailoredResume,
          jobDescriptionProfile,
          initialScore,
          tailoredScore,
          gaps,
        }),
      });

      if (!response.ok) {
        throw new Error("Server PDF generation failed.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        type === "comparison"
          ? "resume-comparison-proof.pdf"
          : "tailored-resume.pdf"
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
      showToast("PDF exported successfully!", "success");
    } catch (err: any) {
      console.warn("Server PDF generation failed, falling back to client-side print rendering:", err.message);
      triggerClientPrint(type);
    } finally {
      setExportType(null);
    }
  };

  const isGenerating = exportType !== null;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center w-full">
      <Button
        onClick={() => handleExport("comparison")}
        disabled={disabled || isGenerating}
        size="lg"
        className="w-full sm:w-auto h-12 shadow-md shadow-primary/20 bg-primary hover:bg-primary/95 text-xs font-bold font-display"
      >
        {exportType === "comparison" ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
            Generating Proof...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export Comparison Proof PDF
          </span>
        )}
      </Button>

      <Button
        onClick={() => handleExport("clean")}
        disabled={disabled || isGenerating}
        variant="outline"
        size="lg"
        className="w-full sm:w-auto h-12 text-xs font-bold border-border hover:bg-muted font-display"
      >
        {exportType === "clean" ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Generating Resume...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            Export Tailored Resume Only
          </span>
        )}
      </Button>
    </div>
  );
}
