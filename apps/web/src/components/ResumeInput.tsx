"use client";

import React, { useState, useRef } from "react";
import { useTailoring } from "@/lib/context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function ResumeInput() {
  const { resumeText, setResumeText, fileName, setFileName, setError, showToast } = useTailoring();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Paste mode vs Upload mode
  const [activeTab, setActiveTab] = useState<"upload" | "paste">(fileName ? "upload" : "paste");

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setResumeText(e.target.value);
    if (e.target.value && fileName) {
      setFileName(""); // Clear file upload status if editing text manually
    }
  };

  const parseFile = async (file: File) => {
    setIsParsing(true);
    setError(null);
    setFileName(file.name);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/parse-file", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to parse file");
      }

      const data = await response.json();
      setResumeText(data.rawText);
      setActiveTab("upload");
    } catch (err: any) {
      const errMsg = err.message || "An error occurred while parsing the file.";
      setError(errMsg);
      showToast(errMsg, "error");
      setFileName("");
      setResumeText("");
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (extension === "pdf" || extension === "docx") {
        parseFile(file);
      } else {
        const errMsg = "Unsupported file format. Please upload a PDF or DOCX file.";
        setError(errMsg);
        showToast(errMsg, "warning");
      }
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const clearFile = () => {
    setFileName("");
    setResumeText("");
    setActiveTab("paste");
  };

  return (
    <div className="glass-card p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold font-display text-foreground">
          1. Your Resume
        </h3>
        <div className="flex bg-muted/50 rounded-lg p-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("paste")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === "paste"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Paste Text
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === "upload"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Upload File
          </button>
        </div>
      </div>

      {activeTab === "paste" ? (
        <div className="flex-1 flex flex-col">
          <Textarea
            value={resumeText}
            onChange={handleTextChange}
            placeholder="Paste your full resume text here (e.g. Contact, Summary, Experience, Skills, Education)..."
            className="flex-1 min-h-[350px] font-mono text-xs leading-relaxed bg-background/50 border-border/60 focus-ring resize-none p-4"
          />
          <div className="mt-2 flex justify-between items-center text-xs">
            <div>
              {resumeText.length > 0 && resumeText.length < 100 && (
                <span className="text-destructive font-medium">Resume must be at least 100 characters (min. 100)</span>
              )}
              {resumeText.length > 20000 && (
                <span className="text-destructive font-medium">Resume must not exceed 20,000 characters (max. 20,000)</span>
              )}
            </div>
            <div className="text-muted-foreground ml-auto">
              {resumeText.length} / 20,000 characters
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition-all min-h-[320px] ${
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-border/60 bg-background/30"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.docx"
              className="hidden"
            />

            {isParsing ? (
              <div className="text-center">
                <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm font-medium text-foreground">Parsing resume contents...</p>
                <p className="text-xs text-muted-foreground mt-1">Extracting sections, experience, and skills</p>
              </div>
            ) : fileName ? (
              <div className="text-center p-4">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-foreground mb-1 max-w-[250px] truncate mx-auto">
                  {fileName}
                </h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Text extracted successfully ({resumeText.length} chars)
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={triggerFileSelect}>
                    Change File
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearFile} className="text-destructive hover:bg-destructive/10">
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center cursor-pointer" onClick={triggerFileSelect}>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  Drag and drop your resume file here
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Supports PDF and DOCX formats up to 5MB
                </p>
                <Button variant="link" size="sm" className="mt-3 text-primary">
                  Or select file from device
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
