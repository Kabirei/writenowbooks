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

function extractJson(raw: string) {
  const cleaned = raw
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
}

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

    const isChildrenBook =
      String(bookData.bookType || "").toLowerCase().includes("children") ||
      String(bookData.audience || "").toLowerCase().includes("children") ||
      String(bookData.imagesNeeded || "").toLowerCase().includes("every page");

    const client = new OpenAI({ apiKey });

    const prompt = `
Create a professional ${
      isChildrenBook ? "children's book character sheet and illustration plan" : "book illustration plan"
    }.

BOOK INFORMATION:
Book Type: ${bookData.bookType || "Not provided"}
Topic / Book Idea: ${bookData.topic || "Not provided"}
Target Audience: ${bookData.audience || "Not provided"}
Tone: ${bookData.tone || "Not provided"}
Images Needed: ${bookData.imagesNeeded || "Not specified"}
Extra Instructions:
${bookData.extraInstructions || "None provided"}

CHAPTERS OR STORY SECTIONS:
${chapters.length ? chapters.map((c, i) => `${i + 1}. ${c}`).join("\n") : "No chapters provided."}

CRITICAL CHARACTER LOCK RULES:
- Create locked character profiles.
- Each character description must be specific enough to reuse on every image.
- Include: name, age, skin tone, hair style, hair color, clothing, shoes, facial features, body type, personality, recurring object/accessory if helpful.
- Do not give vague descriptions like "a happy child."
- Do not change clothing from scene to scene unless the story specifically requires it.
- Character descriptions must be reusable inside every image prompt.

STYLE LOCK RULES:
- Create one consistent art style for the full book.
- Keep the same color palette, lighting, mood, and illustration style.
- The style must be child-friendly, polished, and suitable for publishing.

PROMPT RULES:
- Every image prompt must include the locked character description when that character appears.
- Every image prompt must include the style lock.
- No text inside images.
- No watermarks.
- No logos.
- Keep hands, faces, and proportions clean.

RETURN ONLY VALID JSON.
Do not include markdown.
Do not include commentary.

Return this exact JSON shape:

{
  "style": "Locked overall art style, color palette, mood, and illustration style.",
  "coverPrompt": "Full cover image prompt using the locked style and locked character descriptions.",
  "characters": [
    {
      "name": "Character name",
      "description": "LOCKED CHARACTER PROFILE: age, skin tone, hair, clothing, shoes, facial features, body type, personality, recurring object/accessory, and any consistent visual traits."
    }
  ],
  "chapterImages": [
    {
      "chapter": "chapter or page title",
      "prompt": "Full image prompt using locked style and locked character profiles."
    }
  ]
}
`;

    const response = await client.responses.create({
      model: "gpt-5.4-mini",
      input: prompt,
    });

    const text = response.output_text || "{}";
    const parsed = extractJson(text);

    const safePlan = {
      style:
        parsed.style ||
        "Bright, polished children's book illustration style with consistent characters, warm lighting, expressive faces, clean backgrounds, and a friendly color palette.",
      coverPrompt: parsed.coverPrompt || "",
      characters: Array.isArray(parsed.characters) ? parsed.characters : [],
      chapterImages: Array.isArray(parsed.chapterImages)
        ? parsed.chapterImages
        : [],
    };

    return NextResponse.json({
      success: true,
      plan: safePlan,
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