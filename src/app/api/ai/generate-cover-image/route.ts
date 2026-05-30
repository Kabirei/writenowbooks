import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

type CharacterInfo = {
  name?: string;
  description?: string;
};

function escapeSvgText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function createFallbackCoverSvg(
  prompt: string,
  title = "Book Title",
  authorName = "Author Name"
) {
  const safePrompt = escapeSvgText(prompt).slice(0, 180);
  const safeTitle = escapeSvgText(title).slice(0, 80);
  const safeAuthor = escapeSvgText(authorName).slice(0, 80);

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536" viewBox="0 0 1024 1536">
  <rect width="1024" height="1536" fill="#050505"/>
  <rect x="70" y="70" width="884" height="1396" rx="38" fill="none" stroke="#facc15" stroke-width="6"/>
  <foreignObject x="110" y="120" width="804" height="210">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Georgia, serif; color:#fff; font-size:58px; font-weight:700; line-height:1.1; text-align:center;">
      ${safeTitle}
    </div>
  </foreignObject>
  <foreignObject x="150" y="560" width="724" height="330">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, sans-serif; color:#fff; font-size:30px; text-align:center; line-height:1.35;">
      ${safePrompt}
    </div>
  </foreignObject>
  <text x="512" y="1340" text-anchor="middle" font-family="Georgia" font-size="38" fill="#facc15">By ${safeAuthor}</text>
</svg>`;

  return {
    image: Buffer.from(svg).toString("base64"),
    mimeType: "image/svg+xml",
    fallback: true,
  };
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return null;

  return createClient(url, serviceKey);
}

async function uploadCoverImage({
  base64,
  mimeType,
  projectId,
}: {
  base64: string;
  mimeType: string;
  projectId?: string;
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase) return null;

  const extension = mimeType === "image/svg+xml" ? "svg" : "png";
  const fileName = `${
    projectId || "general"
  }/covers/${crypto.randomUUID()}.${extension}`;

  const buffer = Buffer.from(base64, "base64");

  const { error } = await supabase.storage
    .from("book-images")
    .upload(fileName, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    console.error("Cover upload error:", error);
    return null;
  }

  const { data } = supabase.storage.from("book-images").getPublicUrl(fileName);

  return data.publicUrl;
}

function buildCharacterBlock(characters: CharacterInfo[]) {
  if (!Array.isArray(characters) || characters.length === 0) {
    return `
CHARACTER CONSISTENCY:
If characters appear on the cover, keep them visually consistent with the interior illustrations. Maintain the same age, skin tone, hairstyle, clothing style, body shape, facial features, and personality.
`;
  }

  return `
CHARACTER CONSISTENCY:
Use these exact character descriptions and keep them consistent with the interior illustrations:
${characters
  .map((character, index) => {
    const name = character.name || `Character ${index + 1}`;
    const description = character.description || "No description provided.";
    return `${index + 1}. ${name}: ${description}`;
  })
  .join("\n")}
`;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const body = await request.json();

    const prompt: string = body.prompt;
    const projectId: string | undefined = body.projectId;
    const title: string = body.title || body.bookTitle || "Book Title";
    const authorName: string = body.authorName || body.author || "Author Name";
    const titlePlacement: string = body.titlePlacement || "top center";
    const authorPlacement: string = body.authorPlacement || "bottom center";
    const textSafeArea: string =
      body.textSafeArea ||
      "Leave open space at the top for title text and near the bottom for author name. Do not cover faces or important artwork.";

    const characters: CharacterInfo[] = Array.isArray(body.characters)
      ? body.characters
      : [];

    const style: string =
      typeof body.style === "string" && body.style.trim()
        ? body.style
        : "professional children’s book cover illustration, warm, polished, vibrant, clean bookstore-ready composition";

    if (!prompt) {
      return NextResponse.json({
        success: false,
        message: "Invalid cover request.",
      });
    }

    let imageBase64: string;
    let mimeType = "image/png";
    let fallback = false;

    if (!apiKey) {
      const fallbackImage = createFallbackCoverSvg(prompt, title, authorName);
      imageBase64 = fallbackImage.image;
      mimeType = fallbackImage.mimeType;
      fallback = true;
    } else {
      try {
        const client = new OpenAI({ apiKey });

        const finalPrompt = `
Create a professional publisher-ready FRONT BOOK COVER with readable typography.

BOOK TITLE TO PLACE ON COVER:
${title}

AUTHOR NAME TO PLACE ON COVER:
${authorName}

TITLE PLACEMENT:
${titlePlacement}

AUTHOR PLACEMENT:
${authorPlacement}

TEXT SAFE AREA:
${textSafeArea}

STYLE:
${style}

${buildCharacterBlock(characters)}

COVER CONCEPT:
${prompt}

TEXT RULES:
- The exact book title must appear on the front cover: "${title}".
- The exact author name must appear on the front cover: "${authorName}".
- Use clean, attractive, readable typography.
- The title must be visible, balanced, and professionally placed.
- The title must not be too small.
- The title must not be so large that it overpowers the artwork.
- Do not place text over faces, characters, or important artwork.
- The author name should be smaller than the title and placed near the bottom.
- Reserve clean open space for all text.
- Make the cover look like a real Amazon KDP published book cover.

IMAGE RULES:
- Vertical front cover layout.
- No watermark.
- No logos.
- Strong bookstore-ready composition.
- Keep characters consistent with the descriptions above.
`;

        const image = await client.images.generate({
          model: "gpt-image-1",
          prompt: finalPrompt,
          size: "1024x1536",
        });

        imageBase64 = image.data?.[0]?.b64_json || "";

        if (!imageBase64) {
          const fallbackImage = createFallbackCoverSvg(prompt, title, authorName);
          imageBase64 = fallbackImage.image;
          mimeType = fallbackImage.mimeType;
          fallback = true;
        }
      } catch (error) {
        console.error("Cover image provider error:", error);

        const fallbackImage = createFallbackCoverSvg(prompt, title, authorName);
        imageBase64 = fallbackImage.image;
        mimeType = fallbackImage.mimeType;
        fallback = true;
      }
    }

    const imageUrl = await uploadCoverImage({
      base64: imageBase64,
      mimeType,
      projectId,
    });

    return NextResponse.json({
      success: true,
      image: imageBase64,
      imageUrl,
      mimeType,
      fallback,
      message: imageUrl
        ? "Cover image generated and saved successfully."
        : "Cover image generated successfully, but storage upload was skipped or failed.",
    });
  } catch (error) {
    console.error("Cover route error:", error);

    return NextResponse.json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to generate cover image.",
    });
  }
}