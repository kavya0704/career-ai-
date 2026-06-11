import { expect, test, describe } from "vitest";
import {
  ResumeProfileSchema,
  JobDescriptionProfileSchema,
  MatchScoreSchema,
  ResumeGapSchema,
  TailoredResumeSchema,
} from "../schemas";
import {
  mockResumeProfile,
  mockJobDescriptionProfile,
  mockInitialScore,
  mockTailoredScore,
  mockResumeGaps,
  mockTailoredResume,
} from "../mock-data";

describe("Schema Validation Tests", () => {
  test("Validate correct mock data against schemas", () => {
    // Validate Resume Profile
    const parsedResume = ResumeProfileSchema.parse(mockResumeProfile);
    expect(parsedResume.contact.name).toBe("Jane Doe");

    // Validate Job Description Profile
    const parsedJD = JobDescriptionProfileSchema.parse(mockJobDescriptionProfile);
    expect(parsedJD.jobTitle).toBe("Senior React Developer (Frontend)");

    // Validate Match Scores
    const parsedInitialScore = MatchScoreSchema.parse(mockInitialScore);
    expect(parsedInitialScore.overallScore).toBe(52);
    const parsedTailoredScore = MatchScoreSchema.parse(mockTailoredScore);
    expect(parsedTailoredScore.overallScore).toBe(81);

    // Validate Gaps
    mockResumeGaps.forEach(gap => {
      const parsedGap = ResumeGapSchema.parse(gap);
      expect(["high", "medium", "low"]).toContain(parsedGap.importance);
    });

    // Validate Tailored Resume
    const parsedTailoredResume = TailoredResumeSchema.parse(mockTailoredResume);
    expect(parsedTailoredResume.tailoredSummary).toContain("Frontend developer");
    expect(parsedTailoredResume.tailoredExperience.length).toBe(2);
  });

  test("Reject malformed resume profile due to missing fields", () => {
    const invalidResume = {
      ...mockResumeProfile,
      contact: {
        // Missing name
        email: "jane@example.com",
      },
    };

    const result = ResumeProfileSchema.safeParse(invalidResume);
    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = result.error.format();
      expect(formatted.contact?.name).toBeDefined();
    }
  });

  test("Reject out-of-range overall scores in match score", () => {
    const invalidScoreTooHigh = {
      ...mockInitialScore,
      overallScore: 101, // Max is 100
    };
    const invalidScoreTooLow = {
      ...mockInitialScore,
      overallScore: -1, // Min is 0
    };

    const resultHigh = MatchScoreSchema.safeParse(invalidScoreTooHigh);
    const resultLow = MatchScoreSchema.safeParse(invalidScoreTooLow);

    expect(resultHigh.success).toBe(false);
    expect(resultLow.success).toBe(false);
  });

  test("Reject wrong type for scores in match score", () => {
    const invalidScoreType = {
      ...mockInitialScore,
      overallScore: "85", // Should be number
    };

    const result = MatchScoreSchema.safeParse(invalidScoreType);
    expect(result.success).toBe(false);
  });

  test("Reject invalid importance enum for resume gaps", () => {
    const invalidGap = {
      name: "Test Gap",
      importance: "critical", // Must be 'high', 'medium', or 'low'
      jdEvidence: "JD quote",
      resumeEvidence: "Resume quote",
      suggestedAction: "Action",
      canSafelyAdd: true,
    };

    const result = ResumeGapSchema.safeParse(invalidGap);
    expect(result.success).toBe(false);
  });
});
