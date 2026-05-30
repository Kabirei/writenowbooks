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

type ChapterDraft = {
  title: string;
  content: string;
  expanded?: boolean;
};

function normalizeChapterContent(content: string) {
  return content
    .replace(/\r\n/g, "\n")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
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
  return normalizeChapterContent(text);
}

function validateChapter(value: unknown, fallbackTitle: string): ChapterDraft {
  const data = value as Partial<ChapterDraft>;

  const title =
    typeof data.title === "string" && data.title.trim()
      ? data.title.trim()
      : fallbackTitle;

  const content = typeof data.content === "string" ? data.content.trim() : "";

  if (!title || !content) {
    throw new Error("AI chapter response was missing title or content.");
  }

  return {
    title,
    content: normalizeChapterContent(content),
    expanded: false,
  };
}

function getTargetWordCount(pageCount?: string, totalChapters?: number) {
  const normalized = String(pageCount || "").toLowerCase();

  if (normalized.includes("300")) return totalChapters && totalChapters > 0 ? 3500 : 3000;
  if (normalized.includes("150")) return totalChapters && totalChapters > 0 ? 2800 : 2400;
  if (normalized.includes("75")) return totalChapters && totalChapters > 0 ? 2200 : 1800;
  if (normalized.includes("40")) return totalChapters && totalChapters > 0 ? 1700 : 1400;
  if (normalized.includes("20")) return totalChapters && totalChapters > 0 ? 1200 : 1000;
  if (normalized.includes("10")) return totalChapters && totalChapters > 0 ? 900 : 800;

  return 1200;
}

async function generateSingleChapter({
  client,
  bookData,
  outlineTitle,
  chapterTitle,
  chapterIndex,
  totalChapters,
  existingChapters,
}: {
  client: OpenAI;
  bookData: BookFormData;
  outlineTitle: string;
  chapterTitle: string;
  chapterIndex: number;
  totalChapters: number;
  existingChapters: ChapterDraft[];
}) {
  const targetWords = getTargetWordCount(bookData.pageCount, totalChapters);

  const prompt = `
You are a professional long-form book writer.

Write ONE complete chapter for a book manuscript.

Return ONLY valid JSON.
Do not include markdown.
Do not include commentary.
Do not include code fences.

Return this exact JSON structure:

{
  "title": "Chapter title here",
  "content": "Full chapter content here"
}

BOOK INFORMATION:
Book Title: ${bookData.bookTitle || bookData.topic || "Not provided"}
Book Type: ${bookData.bookType || "Not provided"}
Book Topic / Main Idea: ${bookData.topic || "Not provided"}
Estimated Page Count: ${bookData.pageCount || "Not provided"}
Tone / Style: ${bookData.tone || "Not provided"}
Target Audience: ${bookData.audience || "Not provided"}
Author Name: ${bookData.authorName || "Not provided"}
Images Needed: ${bookData.imagesNeeded || "Not provided"}
Extra Instructions:
${bookData.extraInstructions || "None"}

OUTLINE TITLE:
${outlineTitle}

CHAPTER TO WRITE:
Chapter ${chapterIndex + 1} of ${totalChapters}: ${chapterTitle}

ALREADY WRITTEN CHAPTERS FOR CONTINUITY:
${
  existingChapters.length
    ? existingChapters
        .map(
          (chapter, index) =>
            `${index + 1}. ${chapter.title}\nBrief content context: ${chapter.content.slice(
              0,
              700
            )}`
        )
        .join("\n\n")
    : "None yet. This is the first chapter."
}

WRITING RULES:
- Write only Chapter ${chapterIndex + 1}.
- Do not write other chapters.
- Do not summarize the chapter; write the actual chapter.
- Aim for about ${targetWords} words unless the subject requires slightly more or less.
- Make the chapter detailed, useful, polished, and readable.
- Use multiple developed paragraphs with smooth transitions.
- Keep the chapter connected to the book topic and overall outline.
- Avoid shallow filler and generic repetition.
- Do not use bullet-heavy filler unless the book type clearly requires structured teaching.
- Do not begin the content by repeating the title.
- Do not include "Chapter ${chapterIndex + 1}" inside the content.
- Keep the tone and audience aligned with the intake details.
`;

  const response = await client.responses.create({
    model: "gpt-5.4-mini",
    input: prompt,
    max_output_tokens: 7000,
  });

  const text = response.output_text || "";

  try {
    const parsed = extractJsonObject(text);
    return validateChapter(parsed, chapterTitle);
  } catch {
    const fallbackContent = cleanAiText(text);

    if (!fallbackContent) {
      throw new Error(`AI returned no usable content for chapter ${chapterIndex + 1}.`);
    }

    return {
      title: chapterTitle,
      content: fallbackContent,
      expanded: false,
    };
  }
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

    const singleChapterTitle: string | undefined = body.chapterTitle;
    const chapterIndex: number =
      typeof body.chapterIndex === "number" ? body.chapterIndex : 0;
    const totalChapters: number =
      typeof body.totalChapters === "number"
        ? body.totalChapters
        : Array.isArray(body.chapters)
        ? body.chapters.length
        : 1;
    const existingChapters: ChapterDraft[] = Array.isArray(body.existingChapters)
      ? body.existingChapters
      : [];

    const client = new OpenAI({ apiKey });

    if (singleChapterTitle) {
      const chapter = await generateSingleChapter({
        client,
        bookData,
        outlineTitle,
        chapterTitle: singleChapterTitle,
        chapterIndex,
        totalChapters,
        existingChapters,
      });

      return NextResponse.json({
        success: true,
        chapter,
        chapters: [chapter],
      });
    }

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

    const generatedChapters: ChapterDraft[] = [];

    for (const [index, chapterTitle] of chapters.entries()) {
      const chapter = await generateSingleChapter({
        client,
        bookData,
        outlineTitle,
        chapterTitle,
        chapterIndex: index,
        totalChapters: chapters.length,
        existingChapters: generatedChapters,
      });

      generatedChapters.push(chapter);
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
