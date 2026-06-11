import { expect, test, describe } from "vitest";
import { validateTruthfulness } from "../validators";
import { mockResumeProfile } from "../mock-data";
import { TailoredResume } from "../schemas";

describe("Truthfulness Validator Tests", () => {
  // A helper to create a base tailored resume structure
  const createBaseTailoredResume = (tailoredBulletText: string, originalBulletText: string): TailoredResume => ({
    tailoredSummary: "Frontend developer with 4 years of experience.",
    tailoredSkills: ["React", "JavaScript", "HTML5", "CSS3"],
    tailoredExperience: [
      {
        company: "Web Solutions Inc.",
        title: "Software Engineer (Frontend)",
        bullets: [
          {
            original: originalBulletText,
            tailored: tailoredBulletText,
            changeReason: "Aligned with job description.",
            keywordsAddressed: ["React"],
            confidence: "high",
          },
        ],
      },
    ],
  });

  test("Accept truthful bullet updates without adding risk flags", () => {
    const originalText = "Developed and maintained responsive web applications using React, improving mobile user engagement by 15%.";
    const tailoredText = "Developed and maintained responsive React applications, improving mobile user engagement by 15%.";
    const tailored = createBaseTailoredResume(tailoredText, originalText);

    const validated = validateTruthfulness(mockResumeProfile, tailored);
    const validatedBullet = validated.tailoredExperience[0].bullets[0];

    expect(validatedBullet.riskFlag).toBeUndefined();
    expect(validatedBullet.confidence).toBe("high");
  });

  test("Flag fabricated company name mismatches", () => {
    const originalText = "Developed web apps.";
    const tailoredText = "Developed web apps.";
    const tailored = createBaseTailoredResume(tailoredText, originalText);
    // Change company name to a fabricated one
    tailored.tailoredExperience[0].company = "FakeTech Industries";

    const validated = validateTruthfulness(mockResumeProfile, tailored);
    const validatedBullet = validated.tailoredExperience[0].bullets[0];

    expect(validatedBullet.riskFlag).toContain("Company name does not match any entry in your original resume.");
    expect(validatedBullet.confidence).toBe("low");
  });

  test("Flag metric injection (new numbers/percentages)", () => {
    const originalText = "Refactored legacy CSS code bases to modern modular patterns.";
    const tailoredText = "Refactored legacy CSS code bases to modern modular patterns, leading to 45% bundle size reduction and 3 projects completed.";
    const tailored = createBaseTailoredResume(tailoredText, originalText);

    const validated = validateTruthfulness(mockResumeProfile, tailored);
    const validatedBullet = validated.tailoredExperience[0].bullets[0];

    expect(validatedBullet.riskFlag).toContain("Bullet introduces new metrics/numbers not present in your original bullet");
    expect(validatedBullet.riskFlag).toContain("45");
    expect(validatedBullet.riskFlag).toContain("3");
    expect(validatedBullet.confidence).toBe("low");
  });

  test("Do not flag metric changes if numbers are preserved", () => {
    const originalText = "Refactored legacy CSS reducing bundle size by 20% across 2 apps.";
    const tailoredText = "Optimized CSS structure reducing bundle sizes by 20% on 2 main applications.";
    const tailored = createBaseTailoredResume(tailoredText, originalText);

    const validated = validateTruthfulness(mockResumeProfile, tailored);
    const validatedBullet = validated.tailoredExperience[0].bullets[0];

    expect(validatedBullet.riskFlag).toBeUndefined();
    expect(validatedBullet.confidence).toBe("high");
  });

  test("Flag credential or degree injection", () => {
    const originalText = "Developed React components.";
    const tailoredText = "Developed React components as a Certified Frontend Engineer.";
    const tailored = createBaseTailoredResume(tailoredText, originalText);

    const validated = validateTruthfulness(mockResumeProfile, tailored);
    const validatedBullet = validated.tailoredExperience[0].bullets[0];

    expect(validatedBullet.riskFlag).toContain("degree or certification");
    expect(validatedBullet.confidence).toBe("low");
  });

  test("Flag date or timeframe injection", () => {
    const originalText = "Maintained responsive single page applications.";
    const tailoredText = "Maintained responsive single page applications in December 2024.";
    const tailored = createBaseTailoredResume(tailoredText, originalText);

    const validated = validateTruthfulness(mockResumeProfile, tailored);
    const validatedBullet = validated.tailoredExperience[0].bullets[0];

    expect(validatedBullet.riskFlag).toContain("Bullet introduces new dates or timeframes");
    expect(validatedBullet.riskFlag).toContain("December");
    expect(validatedBullet.riskFlag).toContain("2024");
    expect(validatedBullet.confidence).toBe("low");
  });

  test("Do not flag date changes if original dates are preserved", () => {
    const originalText = "Worked on project from Jan 2023 to Nov 2023.";
    const tailoredText = "Managed project deliverables from Jan 2023 to Nov 2023.";
    const tailored = createBaseTailoredResume(tailoredText, originalText);

    const validated = validateTruthfulness(mockResumeProfile, tailored);
    const validatedBullet = validated.tailoredExperience[0].bullets[0];

    expect(validatedBullet.riskFlag).toBeUndefined();
    expect(validatedBullet.confidence).toBe("high");
  });
});
