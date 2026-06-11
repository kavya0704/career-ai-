import { ResumeProfile, TailoredResume } from "./schemas";

/**
 * Validates the tailored resume against the original profile to catch LLM hallucinations,
 * exaggeration of metrics, or fabricated experience details.
 */
export function validateTruthfulness(
  original: ResumeProfile,
  tailored: TailoredResume
): TailoredResume {
  const validated = { ...tailored };

  // 1. Gather original employers, dates, and metrics
  const originalExperiences = original.experience || [];
  const originalCompanies = new Set(originalExperiences.map(e => e.company.toLowerCase()));

  // 2. Validate experiences
  if (validated.tailoredExperience) {
    validated.tailoredExperience = validated.tailoredExperience.map(exp => {
      // Flag if the company name was changed or fabricated
      const companyExists = originalCompanies.has(exp.company.toLowerCase());

      const validatedBullets = exp.bullets.map(bullet => {
        const riskFlags: string[] = [];

        // Catch company names that don't belong to the candidate
        if (!companyExists) {
          riskFlags.push("Company name does not match any entry in your original resume.");
        }

        // Catch metric injection (hallucinated numbers/percentages)
        const originalNumbers = extractNumbers(bullet.original);
        const tailoredNumbers = extractNumbers(bullet.tailored);

        const injectedNumbers = tailoredNumbers.filter(
          n => !originalNumbers.includes(n)
        );

        if (injectedNumbers.length > 0) {
          riskFlags.push(
            `Bullet introduces new metrics/numbers not present in your original bullet: ${injectedNumbers.join(", ")}.`
          );
        }

        // Catch credential/degree claims in bullets
        const containsDegreeKeywords = /\b(bachelor|master|degree|phd|certified|certification)\b/i.test(bullet.tailored);
        const originalContainsDegree = /\b(bachelor|master|degree|phd|certified|certification)\b/i.test(bullet.original);
        if (containsDegreeKeywords && !originalContainsDegree) {
          riskFlags.push("Bullet refers to a degree or certification not mentioned in the original statement.");
        }

        // Catch date/timeframe injection (e.g. 2023, 2024, Oct, December)
        const dateRegex = /\b(?:19|20)\d{2}\b|\b(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/gi;
        const originalDates = bullet.original.match(dateRegex) || [];
        const tailoredDates = bullet.tailored.match(dateRegex) || [];
        
        const injectedDates = tailoredDates.filter(
          d => !originalDates.map(od => od.toLowerCase()).includes(d.toLowerCase())
        );

        if (injectedDates.length > 0) {
          riskFlags.push(
            `Bullet introduces new dates or timeframes not present in the original bullet: ${injectedDates.join(", ")}.`
          );
        }

        return {
          ...bullet,
          riskFlag: riskFlags.length > 0
            ? (bullet.riskFlag ? `${bullet.riskFlag} | ` : "") + riskFlags.join(" ")
            : bullet.riskFlag,
          confidence: riskFlags.length > 0 ? "low" as const : bullet.confidence,
        };
      });

      return {
        ...exp,
        bullets: validatedBullets,
      };
    });
  }

  return validated;
}

/**
 * Utility to extract all numeric sequences (integers or percentages) from a string.
 */
function extractNumbers(text: string): string[] {
  // Matches percentages (e.g. 50%) or standalone digits
  const matches = text.match(/\b\d+(?:%\b|\b)/g);
  return matches ? matches.map(m => m.trim()) : [];
}
