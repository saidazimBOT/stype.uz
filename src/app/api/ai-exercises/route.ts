/**
 * AI Exercises API — Groq API orqali yozish mashqlari generatsiya qiladi.
 * Backend'da ishlaydi — API key frontendga chiqmaydi.
 */
import { NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(request: Request) {
  if (!GROQ_API_KEY) {
    return NextResponse.json({ error: "Groq API key not configured" }, { status: 500 });
  }

  try {
    const { category, difficulty, lang } = await request.json();

    const prompt = `Generate a typing practice text for a typing speed test website.

Category: ${category}
Difficulty: ${difficulty}
Language: ${lang || "english"}

Rules:
- The text should be exactly 1-2 sentences (40-80 words for medium, 20-40 for easy, 80-120 for hard)
- Use lowercase letters only (no capital letters)
- No special characters except basic punctuation (commas, periods, question marks, exclamation marks)
- For "code" category: use simple JavaScript/Python code snippets
- For "numbers" category: include numbers and basic math
- For "punctuation" category: use varied punctuation marks
- For "hard" category: use complex, long words
- For "reverse" category: generate text that's fun to type backwards

Return ONLY the text, nothing else. No quotes, no explanation.`;

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Groq API error:", err);
      return NextResponse.json({ error: "AI generation failed" }, { status: 502 });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim() || "";

    if (!text) {
      return NextResponse.json({ error: "Empty response from AI" }, { status: 502 });
    }

    return NextResponse.json({ text: text.toLowerCase() });
  } catch (e) {
    console.error("AI exercises error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
