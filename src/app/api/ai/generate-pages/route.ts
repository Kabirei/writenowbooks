import { NextResponse } from "next/server";
import OpenAI from "openai";

function getTargetPageCount(pageCount?: string) {
  const value = String(pageCount || "").toLowerCase();

  if (value.includes("10") && value.includes("20")) return 20;
  if (value.includes("20") && value.includes("40")) return 25;
  if (value.includes("40") && value.includes("75")) return 45;
  if (value.includes("75") && value.includes("150")) return 75;
  if (value.includes("150") && value.includes("300")) return 150;
  if (value.includes("300")) return 300;

  return 20;
}

function extractJson(raw: string) {
  const cleaned = raw
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const bookData = body.bookData || {};

    const targetPageCount = getTargetPageCount(bookData?.pageCount);

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `
Create a children's book broken into EXACTLY ${targetPageCount} pages.

CRITICAL PAGE COUNT RULE:
- Return exactly ${targetPageCount} pages.
- Do not return fewer than ${targetPageCount} pages.
- Do not stop at 12 pages.
- Every page must have a pageNumber from 1 through ${targetPageCount}.

STYLE RULES:
- Each page should have 1–2 short, child-friendly sentences.
- Keep the tone simple, warm, emotional, and easy for children to understand.
- Keep the story flowing naturally from page to page.
- Make each page feel like a real children's picture book page.

CHARACTER CONSISTENCY RULES:
- If characters are mentioned, create a clear consistent character profile.
- Keep the same character names, ages, skin tone, hair, clothing, personality, and visual style across every page.
- Do not change the main character's appearance from page to page.
- Each image prompt must repeat the consistent character description.

BOOK INFORMATION:
Book type: ${bookData?.bookType || "Children's Book"}
Book idea/title: ${bookData?.topic || ""}
Selected page range: ${bookData?.pageCount || ""}
Tone/style: ${bookData?.tone || ""}
Audience: ${bookData?.audience || ""}
Author/student name: ${bookData?.authorName || ""}
Images needed: ${bookData?.imagesNeeded || ""}
Extra instructions from family/student:
${bookData?.extraInstructions || ""}

RETURN ONLY VALID JSON.
Do not include markdown.
Do not include comments.

Return this exact JSON shape:
{
  "characterProfile": "Consistent character description used for all pages.",
  "pages": [
    {
      "pageNumber": 1,
      "text": "Page text here.",
      "prompt": "Full image prompt here, including the consistent character description."
    }
  ]
}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = completion.choices[0].message.content || "{}";
    const parsed = extractJson(raw);

    let pages = Array.isArray(parsed.pages) ? parsed.pages : [];

    pages = pages
      .slice(0, targetPageCount)
      .map((page: any, index: number) => ({
        pageNumber: index + 1,
        text: String(page?.text || "").trim(),
        prompt: String(page?.prompt || "").trim(),
      }));

    if (pages.length < targetPageCount) {
      const missingCount = targetPageCount - pages.length;

      for (let i = 0; i < missingCount; i++) {
        const pageNumber = pages.length + 1;

        pages.push({
          pageNumber,
          text: `Page ${pageNumber} continues the story with a gentle, meaningful moment.`,
          prompt: `${
            parsed.characterProfile || "Consistent children's book character"
          }. Children's book illustration for page ${pageNumber}, warm and friendly style, based on the book idea: ${
            bookData?.topic || ""
          }.`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      targetPageCount,
      characterProfile: parsed.characterProfile || "",
      pages,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({
      success: false,
      message: "Failed to generate pages",
    });
  }
}