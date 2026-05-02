import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

type CharacterInfo = {
  name?: string;
  description?: string;
};

function createFallbackCoverSvg(prompt: string) {
  const safePrompt = prompt
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .slice(0, 220);

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="#050505"/>
  <rect x="80" y="80" width="864" height="864" rx="38" fill="none" stroke="#facc15" stroke-width="6"/>
  <text x="512" y="220" text-anchor="middle" font-family="Georgia" font-size="42" fill="#facc15">WRITENOWBOOKS</text>
  <text x="512" y="430" text-anchor="middle" font-family="Georgia" font-size="64" font-weight="700" fill="#ffffff">Book Cover</text>
  <foreignObject x="180" y="590" width="664" height="210">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial; color:#fff; font-size:28px; text-align:center;">
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
If characters appear on the cover, keep them visually consistent with the chapter illustrations. Maintain the same age, skin tone, hairstyle, clothing style, body shape, facial features, and personality.
`;
  }

  return `
CHARACTER CONSISTENCY:
Use these exact character descriptions and keep them consistent with the chapter illustrations:
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

    const characters: CharacterInfo[] = Array.isArray(body.characters)
      ? body.characters
      : [];

    const style: string =
      typeof body.style === "string" && body.style.trim()
        ? body.style
        : "professional children’s book cover illustration, warm, polished, vibrant, highly detailed, clean bookstore-ready composition";

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
      const fallbackImage = createFallbackCoverSvg(prompt);
      imageBase64 = fallbackImage.image;
      mimeType = fallbackImage.mimeType;
      fallback = true;
    } else {
      try {
        const client = new OpenAI({ apiKey });

        const finalPrompt = `
Create a professional publisher-ready book cover illustration.

STYLE LOCK:
${style}

${buildCharacterBlock(characters)}

COVER CONCEPT:
${prompt}

COVER RULES:
- No readable text.
- No typography.
- No watermark.
- Strong centered composition.
- Bookstore-ready cover design.
- Cinematic lighting.
- High detail.
- Keep the cover visually consistent with the chapter illustration style.
- If characters appear, they must match the character descriptions exactly.
`;

        const image = await client.images.generate({
  model: "gpt-image-1",
  prompt: `
Professional book cover, cinematic lighting, highly detailed, publishing quality.

STYLE:
${style}

CHARACTERS:
${characters.map(c => `${c.name}: ${c.description}`).join("\n")}

SCENE:
${prompt}

Clean composition, centered subject, no text, no watermark.
`,
  size: "1024x1024",
});

        imageBase64 = image.data?.[0]?.b64_json || "";

        if (!imageBase64) {
          const fallbackImage = createFallbackCoverSvg(prompt);
          imageBase64 = fallbackImage.image;
          mimeType = fallbackImage.mimeType;
          fallback = true;
        }
      } catch (error) {
        console.error("Cover image provider error:", error);

        const fallbackImage = createFallbackCoverSvg(prompt);
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