import Groq from "groq-sdk";
import { z } from "zod";

const apiKey = process.env.GROQ_API_KEY;
const defaultModel = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

if (!apiKey) {
  console.warn("WARNING: GROQ_API_KEY is not defined in environment variables.");
}

export const groqClient = new Groq({
  apiKey: apiKey || "",
});

/**
 * Call Groq chat completion API with structured JSON output and validation against a Zod schema.
 */
export async function callLLM<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: z.ZodType<T>,
  model: string = defaultModel
): Promise<T> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing. Please configure it in your environment.");
  }

  let attempt = 0;
  const maxAttempts = 2;

  while (attempt < maxAttempts) {
    try {
      const systemContent = attempt > 0
        ? `${systemPrompt}\n\nCRITICAL: Your previous response failed validation. Make sure your output matches the JSON schema EXACTLY. Ensure no fields are missing, and all Zod structural rules are obeyed.`
        : systemPrompt;

      const response = await groqClient.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      });

      const rawContent = response.choices[0]?.message?.content || "";
      if (!rawContent) {
        throw new Error("Empty response from Groq API.");
      }

      // Parse JSON
      let parsedData: any;
      try {
        parsedData = JSON.parse(rawContent);
      } catch {
        throw new Error(`Failed to parse Groq response as JSON. Content: ${rawContent.substring(0, 100)}...`);
      }

      // Validate schema
      const validationResult = schema.safeParse(parsedData);
      if (!validationResult.success) {
        console.error("Zod validation errors:", validationResult.error.format());
        throw new Error("Response JSON does not match the required schema structure.");
      }

      return validationResult.data;
    } catch (err: any) {
      attempt++;
      console.warn(`Groq API call attempt ${attempt} failed: ${err.message}`);
      if (attempt >= maxAttempts) {
        throw err;
      }
    }
  }

  throw new Error("Failed to call Groq API.");
}
