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

function normalizeChapterContent(content: string) {
  return content
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/([.!?])\s+(?=[A-Z])/g, "$1\n\n")
    .replace(/\n\s+/g, "\n")
    .trim();
}

function extractJsonObject(text: string) {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("No JSON object found in AI response.");
  }

  return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
}

function cleanAiText(text: string) {
  return text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

function validateChapter(value: unknown): ChapterDraft {
  const data = value as Partial<ChapterDraft>;

  const title = typeof data.title === "string" ? data.title.trim() : "";
  const content = typeof data.content === "string" ? data.content.trim() : "";

  if (!title || !content) {
    throw new Error("AI chapter response was missing title or content.");
  }

  return { title, content: normalizeChapterContent(content) };
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
    const generatedChapters: ChapterDraft[] = [];

    for (const [index, chapterTitle] of chapters.entries()) {
      const prompt = `
You are a professional long-form book writer.

Return a complete chapter draft.

Preferred output format:
{
  "title": "Chapter title here",
  "content": "Full chapter content here"
}

Book Type: ${bookData.bookType || "Not provided"}
Topic: ${bookData.topic || "Not provided"}
Estimated Page Count: ${bookData.pageCount || "Not provided"}
Tone / Style: ${bookData.tone || "Not provided"}
Target Audience: ${bookData.audience || "Not provided"}
Author Name: ${bookData.authorName || "Not provided"}
Images Needed: ${bookData.imagesNeeded || "Not provided"}
Extra Instructions: ${bookData.extraInstructions || "None"}
Outline Title: ${outlineTitle}

Write Chapter ${index + 1}: ${chapterTitle}

Rules:
- Write only this one chapter.
- Keep the title aligned with the outline.
- Make the chapter detailed, useful, and readable.
- Use multiple paragraphs.
- Do not use markdown.
- Do not use bullet-heavy filler.
- If returning JSON, escape quotation marks properly.
- If JSON is not possible, return the chapter text plainly.
`;

      const response = await client.responses.create({
        model: "gpt-5.4-mini",
        input: prompt,
        max_output_tokens: 4000,
      });

      const text = response.output_text || "";

      let validChapter: ChapterDraft;

      try {
        const parsed = extractJsonObject(text);
        validChapter = validateChapter(parsed);
      } catch {
        const fallbackContent = cleanAiText(text);

        if (!fallbackContent) {
          return NextResponse.json(
            {
              success: false,
              message: `AI returned no usable content for chapter ${
                index + 1
              }.`,
            },
            { status: 500 }
          );
        }

        validChapter = {
          title: chapterTitle,
          content: normalizeChapterContent(fallbackContent),
        };
      }

      generatedChapters.push(validChapter);
    }

    return NextResponse.json({
      success: true,
      chapters: generatedChapters,
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