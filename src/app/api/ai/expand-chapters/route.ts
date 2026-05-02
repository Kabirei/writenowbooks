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
    const chapters: ChapterDraft[] = body.chapters || [];

    if (!Array.isArray(chapters) || chapters.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No chapters were provided to expand.",
        },
        { status: 400 }
      );
    }

    const client = new OpenAI({ apiKey });

    const prompt = `
Expand the following book chapters into deeper, fuller, more complete manuscript-style chapter drafts.

Book Type: ${bookData.bookType || "Not provided"}
Topic: ${bookData.topic || "Not provided"}
Estimated Page Count: ${bookData.pageCount || "Not provided"}
Tone / Style: ${bookData.tone || "Not provided"}
Target Audience: ${bookData.audience || "Not provided"}
Author Name: ${bookData.authorName || "Not provided"}
Images Needed: ${bookData.imagesNeeded || "Not provided"}
Extra Instructions: ${bookData.extraInstructions || "None"}

Existing Chapters:
${chapters
  .map(
    (chapter, index) =>
      `${index + 1}. ${chapter.title}\n${chapter.content}`
  )
  .join("\n\n")}

Return ONLY valid JSON in this exact format:
{
  "chapters": [
    {
      "title": "Chapter title here",
      "content": "Expanded chapter content here"
    }
  ]
}

Rules:
- Keep the same chapter titles unless improvement is clearly needed.
- Expand each chapter substantially.
- Add more explanation, examples, transitions, and depth.
- Make the writing feel more like a polished book manuscript.
- Use multiple paragraphs.
- Do not include markdown.
- Do not include commentary outside JSON.
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
          message: "AI expansion response was missing chapters.",
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
            : "AI chapter expansion failed.",
      },
      { status: 500 }
    );
  }
}