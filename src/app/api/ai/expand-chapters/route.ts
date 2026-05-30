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

function removeRepeatedTitle(content: string, title: string, index: number) {
  let cleaned = normalizeChapterContent(content);

  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  cleaned = cleaned
    .replace(new RegExp(`^\\s*${escapedTitle}\\s*`, "i"), "")
    .replace(new RegExp(`^\\s*chapter\\s*${index + 1}\\s*[:\\-.]?\\s*`, "i"), "")
    .replace(/^chapter\s+\d+\s*[:\-.]?\s*/i, "")
    .trim();

  return normalizeChapterContent(cleaned);
}

function extractJsonObject(text: string) {
  const cleaned = normalizeChapterContent(text);

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("No JSON object found in AI response.");
  }

  return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
}

function validateExpandedChapter(
  value: unknown,
  originalChapter: ChapterDraft,
  index: number
): ChapterDraft {
  const data = value as Partial<ChapterDraft>;

  const rawContent =
    typeof data.content === "string" ? data.content : originalChapter.content;

  return {
    title: originalChapter.title,
    content: removeRepeatedTitle(rawContent, originalChapter.title, index),
    expanded: true,
  };
}

function getExpansionTarget(pageCount?: string) {
  const normalized = String(pageCount || "").toLowerCase();

  if (normalized.includes("300")) return 5000;
  if (normalized.includes("150")) return 4200;
  if (normalized.includes("75")) return 3200;
  if (normalized.includes("40")) return 2500;
  if (normalized.includes("20")) return 1800;
  if (normalized.includes("10")) return 1400;

  return 2200;
}

async function expandSingleChapter({
  client,
  bookData,
  chapter,
  chapterIndex,
  totalChapters,
  previousChapters,
  followingChapters,
}: {
  client: OpenAI;
  bookData: BookFormData;
  chapter: ChapterDraft;
  chapterIndex: number;
  totalChapters: number;
  previousChapters: ChapterDraft[];
  followingChapters: ChapterDraft[];
}) {
  const targetWords = getExpansionTarget(bookData.pageCount);

  const prompt = `
You are expanding one existing book chapter into a deeper, fuller, polished manuscript chapter.

IMPORTANT OUTPUT RULES:
- Return ONLY valid JSON.
- Do NOT include markdown.
- Do NOT include commentary.
- Do NOT include code fences.
- Do NOT repeat the chapter title inside the content.
- Do NOT write "Chapter ${chapterIndex + 1}" inside the content.
- The title field must remain exactly this: ${chapter.title}

Return this exact JSON structure:

{
  "title": "${chapter.title.replace(/"/g, '\\"')}",
  "content": "Expanded chapter content only. No title. No chapter label."
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

CHAPTER POSITION:
Chapter ${chapterIndex + 1} of ${totalChapters}

PREVIOUS CHAPTER CONTEXT:
${
  previousChapters.length
    ? previousChapters
        .map(
          (item, index) =>
            `${index + 1}. ${item.title}\nBrief context: ${item.content.slice(0, 600)}`
        )
        .join("\n\n")
    : "None. This is the first chapter."
}

FOLLOWING CHAPTER CONTEXT:
${
  followingChapters.length
    ? followingChapters
        .map(
          (item, index) =>
            `${chapterIndex + 2 + index}. ${item.title}`
        )
        .join("\n")
    : "None. This is currently the last generated chapter."
}

CHAPTER TITLE:
${chapter.title}

CURRENT CHAPTER CONTENT:
${chapter.content}

EXPANSION RULES:
- Expand this chapter substantially into a fuller manuscript section.
- Aim for about ${targetWords} words unless the chapter naturally requires slightly more or less.
- Add more explanation, examples, details, transitions, and depth.
- Make sure the content still makes sense in the full book sequence.
- Keep the same voice, subject, and audience.
- Preserve the original point of the chapter, but make it richer and more complete.
- Use multiple clean paragraphs.
- Avoid shallow filler and generic repetition.
- Do not begin with the title.
- Do not begin with "Chapter ${chapterIndex + 1}".
`;

  const response = await client.responses.create({
    model: "gpt-5.4-mini",
    input: prompt,
    max_output_tokens: 8000,
  });

  const text = response.output_text || "";

  try {
    const parsed = extractJsonObject(text);
    return validateExpandedChapter(parsed, chapter, chapterIndex);
  } catch {
    const fallbackContent = removeRepeatedTitle(text, chapter.title, chapterIndex);

    return {
      title: chapter.title,
      content: fallbackContent || chapter.content,
      expanded: true,
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
    const singleChapter: ChapterDraft | undefined = body.chapter;
    const chapterIndex: number =
      typeof body.chapterIndex === "number" ? body.chapterIndex : 0;
    const totalChapters: number =
      typeof body.totalChapters === "number"
        ? body.totalChapters
        : Array.isArray(body.chapters)
        ? body.chapters.length
        : 1;
    const previousChapters: ChapterDraft[] = Array.isArray(body.previousChapters)
      ? body.previousChapters
      : [];
    const followingChapters: ChapterDraft[] = Array.isArray(body.followingChapters)
      ? body.followingChapters
      : [];

    const client = new OpenAI({ apiKey });

    if (singleChapter?.title && singleChapter?.content) {
      const expandedChapter = await expandSingleChapter({
        client,
        bookData,
        chapter: singleChapter,
        chapterIndex,
        totalChapters,
        previousChapters,
        followingChapters,
      });

      return NextResponse.json({
        success: true,
        chapter: expandedChapter,
        chapters: [expandedChapter],
      });
    }

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

    const expandedChapters: ChapterDraft[] = [];

    for (const [index, chapter] of chapters.entries()) {
      const expanded = await expandSingleChapter({
        client,
        bookData,
        chapter,
        chapterIndex: index,
        totalChapters: chapters.length,
        previousChapters: chapters.slice(0, index),
        followingChapters: chapters.slice(index + 1),
      });

      expandedChapters.push(expanded);
    }

    return NextResponse.json({
      success: true,
      chapters: expandedChapters,
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