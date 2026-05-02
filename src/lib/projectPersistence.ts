import { supabase } from "@/lib/supabaseClient";

/* =========================
   OUTLINE
========================= */

export async function saveOutline(projectId: string, outline: any) {
  const { error } = await supabase.from("project_outlines").insert({
    project_id: projectId,
    title: outline.title,
    chapters: outline.chapters,
  });

  if (error) throw new Error(`Save outline error: ${error.message}`);
}

export async function getOutline(projectId: string) {
  const { data, error } = await supabase
    .from("project_outlines")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data;
}

/* =========================
   CHAPTERS
========================= */

export async function saveChapters(projectId: string, chapters: any[]) {
  const { error } = await supabase.from("project_chapters").insert({
    project_id: projectId,
    chapters,
  });

  if (error) throw new Error(`Save chapters error: ${error.message}`);
}

export async function getChapters(projectId: string) {
  const { data, error } = await supabase
    .from("project_chapters")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data;
}

/* =========================
   IMAGE PLAN
========================= */

export async function saveImagePlan(projectId: string, plan: any) {
  const { error } = await supabase.from("project_image_plans").insert({
    project_id: projectId,
    data: plan,
    created_at: new Date().toISOString(),
  });

  if (error) throw new Error(`Save image plan error: ${error.message}`);
}

export async function getImagePlan(projectId: string) {
  const { data, error } = await supabase
    .from("project_image_plans")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data?.data || null;
}

/* =========================
   COVER IMAGE
========================= */

export async function saveCoverImage(projectId: string, image: any) {
  const { error } = await supabase.from("project_cover_images").insert({
    project_id: projectId,
    image,
    created_at: new Date().toISOString(),
  });

  if (error) throw new Error(`Save cover image error: ${error.message}`);
}

export async function getCoverImage(projectId: string) {
  const { data, error } = await supabase
    .from("project_cover_images")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data?.image || null;
}

/* =========================
   CHAPTER IMAGES
========================= */

export async function saveChapterImages(projectId: string, images: any[]) {
  const { error } = await supabase.from("project_chapter_images").insert({
    project_id: projectId,
    images,
    created_at: new Date().toISOString(),
  });

  if (error) throw new Error(`Save chapter images error: ${error.message}`);
}

export async function getChapterImages(projectId: string) {
  const { data, error } = await supabase
    .from("project_chapter_images")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return [];
  return data?.images || [];
}