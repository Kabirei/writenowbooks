import { NextResponse } from "next/server";
import OpenAI from "openai";

type BookFormData = {
  bookType?: string;
  topic?: string;
  pageCount?: string;
  tone?: string;
  audience?: string;
  authorName?: string;
  imagesNeeded?: string;
  extraInstructions?: string;
};

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "Missing OPENAI_API_KEY." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const bookData: BookFormData = body.bookData || {};
    const chapters: string[] = body.chapters || [];

    const client = new OpenAI({ apiKey });

    const prompt = `
Create a professional image plan for a book project.

Book Type: ${bookData.bookType || "Not provided"}
Topic: ${bookData.topic || "Not provided"}
Target Audience: ${bookData.audience || "Not provided"}
Tone: ${bookData.tone || "Not provided"}
Images Needed: ${bookData.imagesNeeded || "Not specified"}

Chapters:
${chapters.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Return ONLY JSON:

{
  "style": "overall art style description",
  "coverPrompt": "high-quality cover image prompt",
  "characters": [
    {
      "name": "character name",
      "description": "appearance and traits"
    }
  ],
  "chapterImages": [
    {
      "chapter": "chapter title",
      "prompt": "image generation prompt"
    }
  ]
}

Rules:
- If it's a children's book, include detailed character descriptions.
- Keep style consistent across all prompts.
- Prompts must be ready for AI image generation.
- Do not include commentary outside JSON.
`;

    const response = await client.responses.create({
      model: "gpt-5.4-mini",
      input: prompt,
    });

    const text = response.output_text;

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON from AI", raw: text },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      plan: parsed,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Image plan generation failed",
      },
      { status: 500 }
    );
  }
}