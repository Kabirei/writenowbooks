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
        {
          success: false,
          message: "Missing OPENAI_API_KEY in environment variables.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const bookData: BookFormData = body.bookData || {};

    const client = new OpenAI({
      apiKey,
    });

    const prompt = `
Create a strong professional book outline based on the following project details.

Book Type: ${bookData.bookType || "Not provided"}
Topic: ${bookData.topic || "Not provided"}
Estimated Page Count: ${bookData.pageCount || "Not provided"}
Tone / Style: ${bookData.tone || "Not provided"}
Target Audience: ${bookData.audience || "Not provided"}
Author Name: ${bookData.authorName || "Not provided"}
Images Needed: ${bookData.imagesNeeded || "Not provided"}
Extra Instructions: ${bookData.extraInstructions || "None"}

Return ONLY valid JSON in this exact format:
{
  "title": "Book outline title here",
  "chapters": [
    "Chapter title 1",
    "Chapter title 2",
    "Chapter title 3",
    "Chapter title 4",
    "Chapter title 5",
    "Chapter title 6",
    "Chapter title 7"
  ]
}

Rules:
- Make the outline fit the requested book type.
- Make the chapters specific to the topic.
- Do not include markdown.
- Do not include commentary outside JSON.
`;

    const response = await client.responses.create({
      model: "gpt-5.4-mini",
      input: prompt,
    });

    const text = response.output_text;

    let parsed: { title: string; chapters: string[] };

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

    if (!parsed.title || !Array.isArray(parsed.chapters)) {
      return NextResponse.json(
        {
          success: false,
          message: "AI outline response was missing title or chapters.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      outline: {
        title: parsed.title,
        chapters: parsed.chapters,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "AI outline generation failed.",
      },
      { status: 500 }
    );
  }
}