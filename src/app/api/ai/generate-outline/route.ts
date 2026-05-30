import { NextResponse } from "next/server";
import OpenAI from "openai";

type BookFormData = {
  bookType?: string;
  bookTitle?: string;
  topic?: string;
  pageCount?: string;
  tone?: string;
  audience?: string;
  authorName?: string;
  imagesNeeded?: string;
  extraInstructions?: string;
};

function getChapterCountRange(pageCount?: string) {
  const value = String(pageCount || "").toLowerCase();

  if (value.includes("10") && value.includes("20")) {
    return { min: 5, max: 8, target: 6 };
  }

  if (value.includes("20") && value.includes("40")) {
    return { min: 8, max: 12, target: 10 };
  }

  if (value.includes("40") && value.includes("75")) {
    return { min: 12, max: 18, target: 15 };
  }

  if (value.includes("75") && value.includes("150")) {
    return { min: 18, max: 28, target: 22 };
  }

  if (value.includes("150") && value.includes("300")) {
    return { min: 28, max: 45, target: 36 };
  }

  if (value.includes("300")) {
    return { min: 45, max: 70, target: 55 };
  }

  return { min: 8, max: 12, target: 10 };
}

function extractJson(raw: string) {
  const cleaned = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("No JSON object found.");
  }

  return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing OPENAI_API_KEY in environment variables.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const bookData: BookFormData = body.bookData || {};

    const chapterRange = getChapterCountRange(bookData.pageCount);

    const client = new OpenAI({
      apiKey,
    });

    const prompt = `
Create a strong professional book outline based on the following project details.

Book Title: ${bookData.bookTitle || bookData.topic || "Not provided"}
Book Topic / Main Idea: ${bookData.topic || "Not provided"}
Book Type: ${bookData.bookType || "Not provided"}
Estimated Page Count: ${bookData.pageCount || "Not provided"}
Tone / Style: ${bookData.tone || "Not provided"}
Target Audience: ${bookData.audience || "Not provided"}
Author Name: ${bookData.authorName || "Not provided"}
Images Needed: ${bookData.imagesNeeded || "Not provided"}
Extra Instructions:
${bookData.extraInstructions || "None"}

CHAPTER COUNT REQUIREMENT:
- Create exactly ${chapterRange.target} chapters.
- The number of chapters must fit the selected page count.
- Do not default to 7 chapters.
- Do not create fewer than ${chapterRange.min} chapters.
- Do not create more than ${chapterRange.max} chapters.

Return ONLY valid JSON in this exact format:

{
  "title": "Book outline title here",
  "chapters": [
    "Chapter title here"
  ]
}

Rules:
- Make the outline fit the requested book type.
- Make the chapters specific to the topic.
- Make the chapter sequence logical from beginning to end.
- Each chapter should have a clear purpose.
- Avoid vague chapter names.
- Do not include markdown.
- Do not include commentary outside JSON.
`;

    const response = await client.responses.create({
      model: "gpt-5.4-mini",
      input: prompt,
    });

    const text = response.output_text || "{}";

    let parsed: { title: string; chapters: string[] };

    try {
      parsed = extractJson(text);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "AI returned invalid JSON.",
          raw: text,
        },
        { status: 500 }
      );
    }

    if (!parsed.title || !Array.isArray(parsed.chapters)) {
      return NextResponse.json(
        {
          success: false,
          message: "AI outline response was missing title or chapters.",
        },
        { status: 500 }
      );
    }

    const cleanedChapters = parsed.chapters
      .filter((chapter) => typeof chapter === "string")
      .map((chapter) => chapter.trim())
      .filter(Boolean);

    if (cleanedChapters.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "AI returned no usable chapter titles.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      outline: {
        title: parsed.title,
        chapters: cleanedChapters,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "AI outline generation failed.",
      },
      { status: 500 }
    );
  }
}