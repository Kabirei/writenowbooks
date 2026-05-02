import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

type CharacterInfo = {
  name?: string;
  description?: string;
};

function createFallbackImageSvg(prompt: string, chapterTitle: string) {
  const safePrompt = prompt
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .slice(0, 260);

  const safeTitle = chapterTitle
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .slice(0, 90);

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="#111827"/>
  <rect x="70" y="70" width="884" height="884" rx="40" fill="none" stroke="#facc15" stroke-width="6"/>
  <text x="512" y="190" text-anchor="middle" font-family="Georgia" font-size="38" fill="#facc15">
    CHAPTER IMAGE
  </text>
  <text x="512" y="330" text-anchor="middle" font-family="Georgia" font-size="48" font-weight="700" fill="#ffffff">
    ${safeTitle}
  </text>
  <foreignObject x="170" y="430" width="684" height="270">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial; color:#fff; font-size:28px; line-height:1.35; text-align:center;">
      ${safePrompt}
    </div>
  </foreignObject>
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

async function uploadChapterImage({
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
  }/chapters/${crypto.randomUUID()}.${extension}`;

  const buffer = Buffer.from(base64, "base64");

  const { error } = await supabase.storage
    .from("book-images")
    .upload(fileName, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    console.error("Chapter image upload error:", error);
    return null;
  }

  const { data } = supabase.storage.from("book-images").getPublicUrl(fileName);

  return data.publicUrl;
}

function buildCharacterBlock(characters: CharacterInfo[]) {
  if (!Array.isArray(characters) || characters.length === 0) {
    return `
CHARACTER CONSISTENCY:
If characters are present in the scene, keep them visually consistent across the book. Maintain the same age, skin tone, hairstyle, clothing style, body shape, facial features, and personality from image to image.
`;
  }

  return `
CHARACTER CONSISTENCY:
Use these exact character descriptions and keep them consistent in every illustration:
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
    const chapterTitle: string = body.chapterTitle || "Untitled Chapter";
    const projectId: string | undefined = body.projectId;

    const characters: CharacterInfo[] = Array.isArray(body.characters)
      ? body.characters
      : [];

    const style: string =
      typeof body.style === "string" && body.style.trim()
        ? body.style
        : "children’s book illustration, warm, polished, vibrant, highly detailed, emotionally expressive, clean composition";

    if (!prompt) {
      return NextResponse.json({
        success: false,
        message: "Invalid chapter image request.",
      });
    }

    let imageBase64: string;
    let mimeType = "image/png";
    let fallback = false;

    if (!apiKey) {
      const fallbackImage = createFallbackImageSvg(prompt, chapterTitle);
      imageBase64 = fallbackImage.image;
      mimeType = fallbackImage.mimeType;
      fallback = true;
    } else {
      try {
        const client = new OpenAI({ apiKey });

        const finalPrompt = `
Create a professional book illustration.

STYLE LOCK:
${style}

${buildCharacterBlock(characters)}

CHAPTER:
${chapterTitle}

SCENE:
${prompt}

RULES:
- No text.
- No watermark.
- No distorted hands or faces.
- Keep the same visual style across the whole book.
- Keep characters consistent with the descriptions above.
- Make the scene clear, polished, and suitable for publishing.
`;

        const image = await client.images.generate({
          model: "gpt-image-1",
          prompt: finalPrompt,
          size: "1024x1024",
        });

        imageBase64 = image.data?.[0]?.b64_json || "";

        if (!imageBase64) {
          const fallbackImage = createFallbackImageSvg(prompt, chapterTitle);
          imageBase64 = fallbackImage.image;
          mimeType = fallbackImage.mimeType;
          fallback = true;
        }
      } catch (error) {
        console.error("Chapter image provider error:", error);

        const fallbackImage = createFallbackImageSvg(prompt, chapterTitle);
        imageBase64 = fallbackImage.image;
        mimeType = fallbackImage.mimeType;
        fallback = true;
      }
    }

    const imageUrl = await uploadChapterImage({
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
        ? "Chapter image generated and saved successfully."
        : "Chapter image generated successfully, but storage upload was skipped or failed.",
    });
  } catch (error) {
    console.error("Chapter image route error:", error);

    return NextResponse.json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to generate chapter image.",
    });
  }
}