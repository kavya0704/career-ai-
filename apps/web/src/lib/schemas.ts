import { z } from "zod";

// =============================================================================
// §3.1 — Base Resume Schema (ResumeProfile)
// =============================================================================

export const ContactInfoSchema = z.object({
  name: z.string(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
});

export const ExperienceBulletSchema = z.object({
  text: z.string(),
});

export const WorkExperienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  location: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(), // "Present" or date string
  bullets: z.array(z.string()),
});

export const ProjectSchema = z.object({
  name: z.string(),
  description: z.string().optional().nullable(),
  bullets: z.array(z.string()),
  technologies: z.array(z.string()).optional().nullable(),
});

export const EducationSchema = z.object({
  institution: z.string(),
  degree: z.string(),
  fieldOfStudy: z.string().optional().nullable(),
  graduationDate: z.string().optional().nullable(),
  gpa: z.string().optional().nullable(),
});

export const CertificationSchema = z.object({
  name: z.string(),
  issuer: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
});

export const ResumeProfileSchema = z.object({
  contact: ContactInfoSchema,
  summary: z.string().optional().nullable(),
  skills: z.array(z.string()),
  experience: z.array(WorkExperienceSchema),
  projects: z.array(ProjectSchema).optional().nullable(),
  education: z.array(EducationSchema),
  certifications: z.array(CertificationSchema).optional().nullable(),
});

// =============================================================================
// §3.2 — Job Description Schema (JobDescriptionProfile)
// =============================================================================

export const JobDescriptionProfileSchema = z.object({
  jobTitle: z.string(),
  company: z.string().optional().nullable(),
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  responsibilities: z.array(z.string()),
  qualifications: z.array(z.string()),
  tools: z.array(z.string()),
  keywords: z.array(z.string()),
  seniorityLevel: z.string(), // e.g. "Junior", "Mid", "Senior", "Lead"
  domainSignals: z.array(z.string()),
});

// =============================================================================
// §3.3 — Scoring & Gap Analysis Schemas (MatchScore & ResumeGap)
// =============================================================================

export const MatchScoreSchema = z.object({
  overallScore: z.number().min(0).max(100),
  skillCoverageScore: z.number().min(0).max(100),
  responsibilityAlignmentScore: z.number().min(0).max(100),
  keywordScore: z.number().min(0).max(100),
  seniorityScore: z.number().min(0).max(100),
  criticalMissingRequirements: z.array(z.string()),
  explanation: z.string(), // In-depth textual evaluation
});

export const ResumeGapSchema = z.object({
  name: z.string(),
  importance: z.enum(["high", "medium", "low"]),
  jdEvidence: z.string(), // Quote from the JD
  resumeEvidence: z.string(), // Explanation of current resume coverage or lack thereof
  suggestedAction: z.string(), // Recommended action
  canSafelyAdd: z.boolean(), // Flag whether LLM believes it is a quick skill listing vs full experience gap
});

// =============================================================================
// §3.4 — Tailored Resume Schema (TailoredResume)
// =============================================================================

export const RewrittenBulletSchema = z.object({
  original: z.string(),
  tailored: z.string(),
  changeReason: z.string(), // Explanation of why the adjustment was made
  keywordsAddressed: z.array(z.string()),
  confidence: z.enum(["high", "medium", "low"]),
  riskFlag: z.string().optional().nullable(), // Warnings if the rewrite might exaggerate experience
});

export const TailoredWorkExperienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  bullets: z.array(RewrittenBulletSchema),
});

export const TailoredResumeSchema = z.object({
  tailoredSummary: z.string().optional().nullable(),
  tailoredSkills: z.array(z.string()),
  tailoredExperience: z.array(TailoredWorkExperienceSchema),
  // Projects, Education, etc. remain unchanged or slightly reordered (not rewritten)
});

// =============================================================================
// Inferred TypeScript Types
// =============================================================================

export type ContactInfo = z.infer<typeof ContactInfoSchema>;
export type ExperienceBullet = z.infer<typeof ExperienceBulletSchema>;
export type WorkExperience = z.infer<typeof WorkExperienceSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type Certification = z.infer<typeof CertificationSchema>;
export type ResumeProfile = z.infer<typeof ResumeProfileSchema>;
export type JobDescriptionProfile = z.infer<typeof JobDescriptionProfileSchema>;
export type MatchScore = z.infer<typeof MatchScoreSchema>;
export type ResumeGap = z.infer<typeof ResumeGapSchema>;
export type RewrittenBullet = z.infer<typeof RewrittenBulletSchema>;
export type TailoredWorkExperience = z.infer<typeof TailoredWorkExperienceSchema>;
export type TailoredResume = z.infer<typeof TailoredResumeSchema>;
