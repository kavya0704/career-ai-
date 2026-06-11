"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ResumeProfile, JobDescriptionProfile, MatchScore, ResumeGap, TailoredResume } from "./schemas";
import {
  mockResumeProfile,
  mockJobDescriptionProfile,
  mockInitialScore,
  mockTailoredScore,
  mockResumeGaps,
  mockTailoredResume,
} from "./mock-data";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

interface TailoringContextType {
  // Raw Input Data
  resumeText: string;
  jdText: string;
  fileName: string;
  setResumeText: (text: string) => void;
  setJdText: (text: string) => void;
  setFileName: (name: string) => void;

  // Parsed Profiles
  resumeProfile: ResumeProfile | null;
  jobDescriptionProfile: JobDescriptionProfile | null;
  setResumeProfile: (profile: ResumeProfile | null) => void;
  setJobDescriptionProfile: (profile: JobDescriptionProfile | null) => void;

  // Gaps & Scores
  initialScore: MatchScore | null;
  tailoredScore: MatchScore | null;
  gaps: ResumeGap[];
  setInitialScore: (score: MatchScore | null) => void;
  setTailoredScore: (score: MatchScore | null) => void;
  setGaps: (gaps: ResumeGap[]) => void;

  // Tailored Resume
  tailoredResume: TailoredResume | null;
  setTailoredResume: (resume: TailoredResume | null) => void;

  // Loading & Action States
  isAnalyzing: boolean;
  setIsAnalyzing: (loading: boolean) => void;
  isTailoring: boolean;
  setIsTailoring: (loading: boolean) => void;
  error: string | null;
  setError: (err: string | null) => void;

  // Toast States
  toasts: Toast[];
  showToast: (message: string, type?: "success" | "error" | "info" | "warning") => void;
  dismissToast: (id: string) => void;

  // Action methods
  loadDemoData: () => void;
  clearAll: () => void;
}

const TailoringContext = createContext<TailoringContextType | undefined>(undefined);

let toastIdCounter = 0;
function generateToastId(): string {
  toastIdCounter++;
  return `toast-${toastIdCounter}`;
}

export function TailoringProvider({ children }: { children: React.ReactNode }) {
  const [resumeText, setResumeTextState] = useState<string>("");
  const [jdText, setJdTextState] = useState<string>("");
  const [fileName, setFileNameState] = useState<string>("");

  const [resumeProfile, setResumeProfileState] = useState<ResumeProfile | null>(null);
  const [jobDescriptionProfile, setJobDescriptionProfileState] = useState<JobDescriptionProfile | null>(null);

  const [initialScore, setInitialScoreState] = useState<MatchScore | null>(null);
  const [tailoredScore, setTailoredScoreState] = useState<MatchScore | null>(null);
  const [gaps, setGapsState] = useState<ResumeGap[]>([]);

  const [tailoredResume, setTailoredResumeState] = useState<TailoredResume | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isTailoring, setIsTailoring] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: "success" | "error" | "info" | "warning" = "info") => {
    const id = generateToastId();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      dismissToast(id);
    }, 5000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load from sessionStorage on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const storedResumeText = sessionStorage.getItem("rs_resumeText");
        const storedJdText = sessionStorage.getItem("rs_jdText");
        const storedFileName = sessionStorage.getItem("rs_fileName");

        const storedResumeProfile = sessionStorage.getItem("rs_resumeProfile");
        const storedJdProfile = sessionStorage.getItem("rs_jdProfile");
        const storedInitialScore = sessionStorage.getItem("rs_initialScore");
        const storedTailoredScore = sessionStorage.getItem("rs_tailoredScore");
        const storedGaps = sessionStorage.getItem("rs_gaps");
        const storedTailoredResume = sessionStorage.getItem("rs_tailoredResume");

        if (storedResumeText) setResumeTextState(storedResumeText);
        if (storedJdText) setJdTextState(storedJdText);
        if (storedFileName) setFileNameState(storedFileName);

        if (storedResumeProfile) setResumeProfileState(JSON.parse(storedResumeProfile));
        if (storedJdProfile) setJobDescriptionProfileState(JSON.parse(storedJdProfile));
        if (storedInitialScore) setInitialScoreState(JSON.parse(storedInitialScore));
        if (storedTailoredScore) setTailoredScoreState(JSON.parse(storedTailoredScore));
        if (storedGaps) setGapsState(JSON.parse(storedGaps));
        if (storedTailoredResume) setTailoredResumeState(JSON.parse(storedTailoredResume));
      } catch (e) {
        console.error("Failed to load tailoring context from sessionStorage", e);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Helper wrappers that sync with sessionStorage
  const setResumeText = (text: string) => {
    setResumeTextState(text);
    sessionStorage.setItem("rs_resumeText", text);
  };

  const setJdText = (text: string) => {
    setJdTextState(text);
    sessionStorage.setItem("rs_jdText", text);
  };

  const setFileName = (name: string) => {
    setFileNameState(name);
    sessionStorage.setItem("rs_fileName", name);
  };

  const setResumeProfile = (profile: ResumeProfile | null) => {
    setResumeProfileState(profile);
    if (profile) {
      sessionStorage.setItem("rs_resumeProfile", JSON.stringify(profile));
    } else {
      sessionStorage.removeItem("rs_resumeProfile");
    }
  };

  const setJobDescriptionProfile = (profile: JobDescriptionProfile | null) => {
    setJobDescriptionProfileState(profile);
    if (profile) {
      sessionStorage.setItem("rs_jdProfile", JSON.stringify(profile));
    } else {
      sessionStorage.removeItem("rs_jdProfile");
    }
  };

  const setInitialScore = (score: MatchScore | null) => {
    setInitialScoreState(score);
    if (score) {
      sessionStorage.setItem("rs_initialScore", JSON.stringify(score));
    } else {
      sessionStorage.removeItem("rs_initialScore");
    }
  };

  const setTailoredScore = (score: MatchScore | null) => {
    setTailoredScoreState(score);
    if (score) {
      sessionStorage.setItem("rs_tailoredScore", JSON.stringify(score));
    } else {
      sessionStorage.removeItem("rs_tailoredScore");
    }
  };

  const setGaps = (gapsArray: ResumeGap[]) => {
    setGapsState(gapsArray);
    sessionStorage.setItem("rs_gaps", JSON.stringify(gapsArray));
  };

  const setTailoredResume = (resume: TailoredResume | null) => {
    setTailoredResumeState(resume);
    if (resume) {
      sessionStorage.setItem("rs_tailoredResume", JSON.stringify(resume));
    } else {
      sessionStorage.removeItem("rs_tailoredResume");
    }
  };

  const loadDemoData = () => {
    setResumeText("Jane Doe Resume Text: Software Engineer (Frontend) at Web Solutions Inc., Junior Frontend Developer at App Studio LLC...");
    setJdText("Senior React Developer (Frontend) at TechCorp. Must have React, TypeScript, Next.js, Redux, Tailwind CSS...");
    setFileName("jane_doe_resume.pdf");

    setResumeProfile(mockResumeProfile);
    setJobDescriptionProfile(mockJobDescriptionProfile);
    setInitialScore(mockInitialScore);
    setTailoredScore(mockTailoredScore);
    setGaps(mockResumeGaps);
    setTailoredResume(mockTailoredResume);
    setError(null);
  };

  const clearAll = () => {
    setResumeText("");
    setJdText("");
    setFileName("");
    setResumeProfile(null);
    setJobDescriptionProfile(null);
    setInitialScore(null);
    setTailoredScore(null);
    setGaps([]);
    setTailoredResume(null);
    setError(null);

    // Clear session storage
    sessionStorage.removeItem("rs_resumeText");
    sessionStorage.removeItem("rs_jdText");
    sessionStorage.removeItem("rs_fileName");
    sessionStorage.removeItem("rs_resumeProfile");
    sessionStorage.removeItem("rs_jdProfile");
    sessionStorage.removeItem("rs_initialScore");
    sessionStorage.removeItem("rs_tailoredScore");
    sessionStorage.removeItem("rs_gaps");
    sessionStorage.removeItem("rs_tailoredResume");
  };

  return (
    <TailoringContext.Provider
      value={{
        resumeText,
        jdText,
        fileName,
        setResumeText,
        setJdText,
        setFileName,
        resumeProfile,
        jobDescriptionProfile,
        setResumeProfile,
        setJobDescriptionProfile,
        initialScore,
        tailoredScore,
        gaps,
        setInitialScore,
        setTailoredScore,
        setGaps,
        tailoredResume,
        setTailoredResume,
        isAnalyzing,
        setIsAnalyzing,
        isTailoring,
        setIsTailoring,
        error,
        setError,
        toasts,
        showToast,
        dismissToast,
        loadDemoData,
        clearAll,
      }}
    >
      {children}
    </TailoringContext.Provider>
  );
}

export function useTailoring() {
  const context = useContext(TailoringContext);
  if (context === undefined) {
    throw new Error("useTailoring must be used within a TailoringProvider");
  }
  return context;
}
