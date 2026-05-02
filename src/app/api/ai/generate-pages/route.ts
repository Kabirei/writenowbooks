import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const bookData = body.bookData;

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `
Create a children's book broken into pages.

Rules:
- Each page has 1–2 short sentences
- Each page includes a matching image prompt
- Keep tone simple, warm, emotional
- Keep story flowing naturally

Book idea:
${bookData?.topic}

Return JSON:
{
  "pages": [
    { "pageNumber": 1, "text": "...", "prompt": "..." }
  ]
}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const raw = completion.choices[0].message.content || "{}";
    const parsed = JSON.parse(raw);

    return NextResponse.json({
      success: true,
      pages: parsed.pages || [],
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({
      success: false,
      message: "Failed to generate pages",
    });
  }
}