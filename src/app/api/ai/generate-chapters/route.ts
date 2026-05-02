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

type ChapterDraft = {
  title: string;
  content: string;
};

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
    const outlineTitle: string = body.outlineTitle || "Book Outline";
    const chapters: string[] = body.chapters || [];

    if (!Array.isArray(chapters) || chapters.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No outline chapters were provided.",
        },
        { status: 400 }
      );
    }

    const client = new OpenAI({ apiKey });

    const prompt = `
Create detailed, high-quality chapter draft content for a professional book project.

Book Type: ${bookData.bookType || "Not provided"}
Topic: ${bookData.topic || "Not provided"}
Estimated Page Count: ${bookData.pageCount || "Not provided"}
Tone / Style: ${bookData.tone || "Not provided"}
Target Audience: ${bookData.audience || "Not provided"}
Author Name: ${bookData.authorName || "Not provided"}
Images Needed: ${bookData.imagesNeeded || "Not provided"}
Extra Instructions: ${bookData.extraInstructions || "None"}
Outline Title: ${outlineTitle}

Chapters:
${chapters.map((chapter, index) => `${index + 1}. ${chapter}`).join("\n")}

Return ONLY valid JSON in this exact format:
{
  "chapters": [
    {
      "title": "Chapter title here",
      "content": "Full chapter content here"
    }
  ]
}

Rules:
- Create one chapter for each outline item.
- Each chapter must be between 800 and 1500 words.
- Expand ideas deeply with real explanations, not filler text.
- Use multiple paragraphs for readability.
- Make it feel like a real authored book, not a summary.
- Maintain consistency with the tone and target audience.
- Do NOT include markdown.
- Do NOT include commentary outside JSON.
`;

    const response = await client.responses.create({
      model: "gpt-5.4-mini",
      input: prompt,
    });

    const text = response.output_text;

    let parsed: { chapters: ChapterDraft[] };

    try {
      parsed = JSON.parse(text);
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

    if (!Array.isArray(parsed.chapters)) {
      return NextResponse.json(
        {
          success: false,
          message: "AI chapter response was missing chapters.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      chapters: parsed.chapters,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "AI chapter generation failed.",
      },
      { status: 500 }
    );
  }
}