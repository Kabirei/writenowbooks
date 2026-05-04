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
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\n\s+/g, "\n")
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

function validateExpandedChapters(value: unknown, originalChapters: ChapterDraft[]) {
  const data = value as { chapters?: unknown };

  if (!Array.isArray(data.chapters)) {
    throw new Error("AI expansion response was missing chapters.");
  }

  return originalChapters.map((originalChapter, index) => {
    const expanded = data.chapters?.[index] as Partial<ChapterDraft> | undefined;

    const rawContent =
      typeof expanded?.content === "string"
        ? expanded.content
        : originalChapter.content;

    return {
      title: originalChapter.title,
      content: removeRepeatedTitle(rawContent, originalChapter.title, index),
    };
  });
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

    const expandedChapters: ChapterDraft[] = [];

    for (const [index, chapter] of chapters.entries()) {
      const prompt = `
You are expanding one existing book chapter into a deeper, fuller, polished manuscript chapter.

IMPORTANT OUTPUT RULES:
- Return ONLY valid JSON.
- Do NOT include markdown.
- Do NOT include commentary.
- Do NOT include code fences.
- Do NOT repeat the chapter title inside the content.
- Do NOT write "Chapter ${index + 1}" inside the content.
- The title field must remain exactly this: ${chapter.title}

Return this exact JSON structure:

{
  "title": "${chapter.title.replace(/"/g, '\\"')}",
  "content": "Expanded chapter content only. No title. No chapter label."
}

Book Type: ${bookData.bookType || "Not provided"}
Topic: ${bookData.topic || "Not provided"}
Estimated Page Count: ${bookData.pageCount || "Not provided"}
Tone / Style: ${bookData.tone || "Not provided"}
Target Audience: ${bookData.audience || "Not provided"}
Author Name: ${bookData.authorName || "Not provided"}
Images Needed: ${bookData.imagesNeeded || "Not provided"}
Extra Instructions: ${bookData.extraInstructions || "None"}

Chapter Title:
${chapter.title}

Original Chapter Content:
${chapter.content}

Expansion Rules:
- Expand this chapter substantially.
- Add more explanation, examples, transitions, and depth.
- Use multiple clean paragraphs.
- Make the writing feel like a polished book manuscript.
- Keep the same voice and audience.
- Do not begin with the title.
- Do not begin with "Chapter ${index + 1}".
`;

      const response = await client.responses.create({
        model: "gpt-5.4-mini",
        input: prompt,
        max_output_tokens: 5000,
      });

      const text = response.output_text || "";

      try {
        const parsed = extractJsonObject(text);
        const validated = validateExpandedChapters(
          { chapters: [parsed] },
          [chapter]
        )[0];

        expandedChapters.push(validated);
      } catch {
        const fallbackContent = removeRepeatedTitle(text, chapter.title, index);

        expandedChapters.push({
          title: chapter.title,
          content: fallbackContent || chapter.content,
        });
      }
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