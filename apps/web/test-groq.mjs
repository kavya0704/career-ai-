import Groq from 'groq-sdk';

const apiKey = process.env.GROQ_API_KEY;
console.log("Checking API key:", apiKey ? `Present (ends with ...${apiKey.slice(-6)})` : "Missing");

const groq = new Groq({ apiKey });

async function run() {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'Say "Groq API is working!" in 5 words or less.' }],
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    });
    console.log("API Response:", chatCompletion.choices[0]?.message?.content);
  } catch (error) {
    console.error("API Error:", error);
  }
}

run();
