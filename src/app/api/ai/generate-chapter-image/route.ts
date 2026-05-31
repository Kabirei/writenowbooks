import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

type CharacterInfo = {
  name?: string;
  description?: string;
};

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
If characters are present, keep them visually consistent across the whole book.
Maintain the same age, skin tone, hairstyle, clothing, body shape, facial features, and personality from image to image.
Do not redesign the main character.
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

function timeoutPromise(ms: number) {
  return new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(
        new Error(
          "The illustration took too long to generate. Please click Generate Page Illustration again."
        )
      );
    }, ms);
  });
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const body = await request.json();

    const prompt: string = body.prompt;
    const chapterTitle: string = body.chapterTitle || "Untitled Image";
    const projectId: string | undefined = body.projectId;

    const characters: CharacterInfo[] = Array.isArray(body.characters)
      ? body.characters
      : [];

    const style: string =
      typeof body.style === "string" && body.style.trim()
        ? body.style
        : "children’s book illustration, warm, polished, vibrant, emotionally expressive, clean composition, consistent character design";

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        message: "Missing OPENAI_API_KEY. Unable to generate illustration.",
      });
    }

    if (!prompt) {
      return NextResponse.json({
        success: false,
        message: "Invalid image request.",
      });
    }

    const client = new OpenAI({ apiKey });

    const finalPrompt = `
Create a professional children's book page illustration for an 8.5 x 11 portrait interior page.

STYLE LOCK:
${style}

${buildCharacterBlock(characters)}

IMAGE TITLE:
${chapterTitle}

SCENE:
${prompt}

8.5 x 11 PAGE LAYOUT RULES:
- Create a vertical portrait illustration suitable for an 8.5 x 11 children's book interior page.
- Use a full-page composition with generous visual coverage.
- Leave natural breathing room around the edges so the image does not look cropped in print.
- Keep the main subject large, clear, and centered enough for children to understand immediately.
- Make the image feel like it belongs on a printed storybook page, not a small square thumbnail.
- Avoid tiny details that will disappear when printed.
- Leave the lower 20% visually calm and uncluttered so story text can sit below the image in the final PDF layout.

STRICT RULES:
- No text inside the image.
- No watermark.
- No logos.
- No distorted hands or faces.
- Keep the same art style across the entire book.
- Keep characters consistent with the descriptions above.
- Make the scene clear, polished, child-friendly, and suitable for publishing.
`;

    const image = await Promise.race([
      client.images.generate({
        model: "gpt-image-1",
        prompt: finalPrompt,
        size: "1024x1536",
      }),
      timeoutPromise(55000),
    ]);

    const imageBase64 = image.data?.[0]?.b64_json || "";

    if (!imageBase64) {
      return NextResponse.json({
        success: false,
        message:
          "The illustration could not be generated. Please click Generate Page Illustration again.",
      });
    }

    const mimeType = "image/png";

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
      fallback: false,
      message: imageUrl
        ? "Illustration generated and saved successfully."
        : "Illustration generated successfully, but storage upload was skipped or failed.",
    });
  } catch (error) {
    console.error("Image route error:", error);

    return NextResponse.json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to generate illustration. Please try again.",
    });
  }
}