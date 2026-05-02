"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import {
  saveOutline as saveOutlineDB,
  getOutline,
  saveChapters as saveChaptersDB,
  getChapters,
  saveImagePlan as saveImagePlanDB,
  getImagePlan,
  saveCoverImage as saveCoverImageDB,
  getCoverImage,
  saveChapterImages as saveChapterImagesDB,
  getChapterImages,
} from "@/lib/projectPersistence";

type BookFormData = {
  bookType: string;
  topic: string;
  pageCount: string;
  tone: string;
  audience: string;
  authorName: string;
  imagesNeeded: string;
  extraInstructions: string;
};

type SavedOrder = {
  id: string;
  paymentId: string;
  packageName: string;
  packagePrice: string;
  packagePlan: string;
  status: string;
  createdAt: string;
  bookData: BookFormData | null;
};

type Usage = {
  outline: number;
  chapters: number;
  expand: number;
  imagePlan: number;
  cover: number;
};

type ProjectOutline = {
  projectId: string;
  generatedAt: string;
  title: string;
  chapters: string[];
};

type ProjectChapter = {
  projectId: string;
  generatedAt: string;
  chapters: {
    title: string;
    content: string;
  }[];
};

type ImagePlan = {
  projectId: string;
  generatedAt: string;
  style: string;
  coverPrompt: string;
  characters: {
    name: string;
    description: string;
  }[];
  chapterImages: {
    chapter: string;
    prompt: string;
  }[];
};

type CoverImage = {
  projectId: string;
  generatedAt: string;
  prompt: string;
  imageBase64: string;
  imageUrl?: string;
  mimeType: string;
  fallback?: boolean;
};

type ChapterImage = {
  projectId: string;
  chapter: string;
  prompt: string;
  imageBase64: string;
  imageUrl?: string;
  mimeType: string;
  generatedAt: string;
  fallback?: boolean;
};

type PageItem = {
  pageNumber: number;
  text: string;
  prompt: string;
};

type ProjectPages = {
  projectId: string;
  generatedAt: string;
  pages: PageItem[];
};

type PageImage = {
  projectId: string;
  pageNumber: number;
  text: string;
  prompt: string;
  imageBase64: string;
  imageUrl?: string;
  mimeType: string;
  generatedAt: string;
  fallback?: boolean;
};

const LIMITS: Record<string, Usage | "unlimited"> = {
  starter: { outline: 1, chapters: 1, expand: 1, imagePlan: 1, cover: 1 },
  enhanced: { outline: 3, chapters: 2, expand: 3, imagePlan: 2, cover: 3 },
  premium: "unlimited",
};

const EMPTY_USAGE: Usage = {
  outline: 0,
  chapters: 0,
  expand: 0,
  imagePlan: 0,
  cover: 0,
};

export default function ProjectDetailPage() {
  const params = useParams();

  const [project, setProject] = useState<SavedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<Usage>(EMPTY_USAGE);

  const [outline, setOutline] = useState<ProjectOutline | null>(null);
  const [generatedChapters, setGeneratedChapters] =
    useState<ProjectChapter | null>(null);

  const [imagePlan, setImagePlan] = useState<ImagePlan | null>(null);
  const [coverImage, setCoverImage] = useState<CoverImage | null>(null);
  const [chapterImages, setChapterImages] = useState<ChapterImage[]>([]);

  const [pages, setPages] = useState<ProjectPages | null>(null);
  const [pageImages, setPageImages] = useState<PageImage[]>([]);

  const [globalMessage, setGlobalMessage] = useState("");

  const [outlineMessage, setOutlineMessage] = useState("");
  const [chapterMessage, setChapterMessage] = useState("");
  const [expandMessage, setExpandMessage] = useState("");
  const [imagePlanMessage, setImagePlanMessage] = useState("");
  const [coverImageMessage, setCoverImageMessage] = useState("");
  const [chapterImageMessage, setChapterImageMessage] = useState("");
  const [pageImageMessage, setPageImageMessage] = useState("");

  const [outlineLoading, setOutlineLoading] = useState(false);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [expandLoading, setExpandLoading] = useState(false);
  const [imagePlanLoading, setImagePlanLoading] = useState(false);
  const [coverImageLoading, setCoverImageLoading] = useState(false);
  const [chapterImageLoading, setChapterImageLoading] = useState(false);
  const [pageImageLoading, setPageImageLoading] = useState(false);

  useEffect(() => {
    const loadProjectData = async () => {
      const id = Array.isArray(params.id) ? params.id[0] : params.id;

      if (!id) {
        setLoading(false);
        return;
      }

      const orders: SavedOrder[] = JSON.parse(
        localStorage.getItem("writeNowOrders") || "[]"
      );

      const foundProject = orders.find((order) => order.id === id) || null;
      setProject(foundProject);

      if (!foundProject) {
        setLoading(false);
        return;
      }

      try {
        const dbOutline = await getOutline(id);

        if (dbOutline) {
          setOutline({
            projectId: id,
            generatedAt: dbOutline.created_at,
            title: dbOutline.title,
            chapters: dbOutline.chapters,
          });
        } else {
          const outlines: ProjectOutline[] = JSON.parse(
            localStorage.getItem("writeNowOutlines") || "[]"
          );
          setOutline(outlines.find((item) => item.projectId === id) || null);
        }

        const dbChapters = await getChapters(id);

        if (dbChapters) {
          setGeneratedChapters({
            projectId: id,
            generatedAt: dbChapters.created_at,
            chapters: dbChapters.chapters,
          });
        } else {
          const chapterSets: ProjectChapter[] = JSON.parse(
            localStorage.getItem("writeNowChapters") || "[]"
          );
          setGeneratedChapters(
            chapterSets.find((item) => item.projectId === id) || null
          );
        }

        const dbImagePlan = await getImagePlan(id);

        if (dbImagePlan) {
          setImagePlan(dbImagePlan);
        } else {
          const imagePlans: ImagePlan[] = JSON.parse(
            localStorage.getItem("writeNowImagePlans") || "[]"
          );
          setImagePlan(imagePlans.find((item) => item.projectId === id) || null);
        }

        const dbCoverImage = await getCoverImage(id);

        if (dbCoverImage) {
          setCoverImage(dbCoverImage);
        } else {
          const coverImages: CoverImage[] = JSON.parse(
            localStorage.getItem("writeNowCoverImages") || "[]"
          );
          setCoverImage(
            coverImages.find((item) => item.projectId === id) || null
          );
        }

        const dbChapterImages = await getChapterImages(id);

        if (Array.isArray(dbChapterImages) && dbChapterImages.length > 0) {
          setChapterImages(dbChapterImages);
        } else {
          const savedChapterImages: ChapterImage[] = JSON.parse(
            localStorage.getItem("writeNowChapterImages") || "[]"
          );
          setChapterImages(
            savedChapterImages.filter((img) => img.projectId === id)
          );
        }

        const savedPages: ProjectPages | null = JSON.parse(
          localStorage.getItem(`writeNowPages_${id}`) || "null"
        );
        setPages(savedPages);

        const savedPageImages: PageImage[] = JSON.parse(
          localStorage.getItem(`writeNowPageImages_${id}`) || "[]"
        );
        setPageImages(savedPageImages);

        const savedUsage = JSON.parse(
          localStorage.getItem("writeNowUsage") || "{}"
        );
        setUsage(savedUsage[id] || EMPTY_USAGE);
      } catch (error) {
        console.error("Project persistence load error:", error);

        const outlines: ProjectOutline[] = JSON.parse(
          localStorage.getItem("writeNowOutlines") || "[]"
        );
        setOutline(outlines.find((item) => item.projectId === id) || null);

        const chapterSets: ProjectChapter[] = JSON.parse(
          localStorage.getItem("writeNowChapters") || "[]"
        );
        setGeneratedChapters(
          chapterSets.find((item) => item.projectId === id) || null
        );

        const imagePlans: ImagePlan[] = JSON.parse(
          localStorage.getItem("writeNowImagePlans") || "[]"
        );
        setImagePlan(imagePlans.find((item) => item.projectId === id) || null);

        const coverImages: CoverImage[] = JSON.parse(
          localStorage.getItem("writeNowCoverImages") || "[]"
        );
        setCoverImage(coverImages.find((item) => item.projectId === id) || null);

        const savedChapterImages: ChapterImage[] = JSON.parse(
          localStorage.getItem("writeNowChapterImages") || "[]"
        );
        setChapterImages(savedChapterImages.filter((img) => img.projectId === id));

        const savedPages: ProjectPages | null = JSON.parse(
          localStorage.getItem(`writeNowPages_${id}`) || "null"
        );
        setPages(savedPages);

        const savedPageImages: PageImage[] = JSON.parse(
          localStorage.getItem(`writeNowPageImages_${id}`) || "[]"
        );
        setPageImages(savedPageImages);

        const savedUsage = JSON.parse(
          localStorage.getItem("writeNowUsage") || "{}"
        );
        setUsage(savedUsage[id] || EMPTY_USAGE);
      } finally {
        setLoading(false);
      }
    };

    loadProjectData();
  }, [params]);

  const currentLimits = () => {
    if (!project) return LIMITS.starter;
    return LIMITS[project.packagePlan.toLowerCase()] || LIMITS.starter;
  };

  const usageLabel = (type: keyof Usage) => {
    const limits = currentLimits();
    if (limits === "unlimited") return `${usage[type]} / Unlimited`;
    return `${usage[type]} / ${limits[type]}`;
  };

  const planAllowsChapterImages = () => {
    if (!project) return false;

    const plan = project.packagePlan.toLowerCase();

    return plan === "enhanced" || plan === "premium";
  };

  const saveUsage = (newUsage: Usage) => {
    if (!project) return;

    const allUsage = JSON.parse(localStorage.getItem("writeNowUsage") || "{}");
    allUsage[project.id] = newUsage;
    localStorage.setItem("writeNowUsage", JSON.stringify(allUsage));
    setUsage(newUsage);
  };

  const canUse = (type: keyof Usage) => {
    if (!project) return false;

    const limits = currentLimits();
    if (limits === "unlimited") return true;

    return usage[type] < limits[type];
  };

  const incrementUsage = (type: keyof Usage) => {
    const updatedUsage: Usage = {
      ...usage,
      [type]: usage[type] + 1,
    };

    saveUsage(updatedUsage);
  };

  const blockIfLimitReached = (type: keyof Usage) => {
    if (!canUse(type)) {
      setGlobalMessage(
        "You’ve reached your plan limit for this feature. Upgrade to unlock more AI usage."
      );
      return true;
    }

    setGlobalMessage("");
    return false;
  };

  const saveChapters = async (chapterSet: ProjectChapter) => {
    if (project) {
      try {
        await saveChaptersDB(project.id, chapterSet.chapters);
      } catch (error) {
        console.error("Supabase chapter save failed:", error);
      }
    }

    const chapterSets: ProjectChapter[] = JSON.parse(
      localStorage.getItem("writeNowChapters") || "[]"
    );
    const filtered = chapterSets.filter(
      (item) => item.projectId !== chapterSet.projectId
    );
    localStorage.setItem(
      "writeNowChapters",
      JSON.stringify([chapterSet, ...filtered])
    );
    setGeneratedChapters(chapterSet);
  };

  const saveImagePlan = async (plan: ImagePlan) => {
    if (project) {
      try {
        await saveImagePlanDB(project.id, plan);
      } catch (error) {
        console.error("Supabase image plan save failed:", error);
      }
    }

    const plans: ImagePlan[] = JSON.parse(
      localStorage.getItem("writeNowImagePlans") || "[]"
    );
    const filtered = plans.filter((item) => item.projectId !== plan.projectId);
    localStorage.setItem(
      "writeNowImagePlans",
      JSON.stringify([plan, ...filtered])
    );
    setImagePlan(plan);
  };

  const saveCoverImage = async (cover: CoverImage) => {
    if (project) {
      try {
        await saveCoverImageDB(project.id, cover);
      } catch (error) {
        console.error("Supabase cover image save failed:", error);
      }
    }

    const lightweightCover = {
      ...cover,
      imageBase64: cover.imageUrl ? "" : cover.imageBase64,
    };

    const covers: CoverImage[] = JSON.parse(
      localStorage.getItem("writeNowCoverImages") || "[]"
    );

    const filtered = covers.filter((item) => item.projectId !== cover.projectId);

    localStorage.setItem(
      "writeNowCoverImages",
      JSON.stringify([lightweightCover, ...filtered])
    );

    setCoverImage(cover);
  };

  const saveChapterImages = async (images: ChapterImage[]) => {
    if (project) {
      try {
        await saveChapterImagesDB(project.id, images);
      } catch (error) {
        console.error("Supabase chapter image save failed:", error);
      }
    }

    const lightweightImages = images.map((img) => ({
      ...img,
      imageBase64: img.imageUrl ? "" : img.imageBase64,
    }));

    const existing: ChapterImage[] = JSON.parse(
      localStorage.getItem("writeNowChapterImages") || "[]"
    );

    const filtered = existing.filter((img) => img.projectId !== project?.id);
    const updated = [...lightweightImages, ...filtered];

    localStorage.setItem("writeNowChapterImages", JSON.stringify(updated));
    setChapterImages(images);
  };

  const savePageImages = (images: PageImage[]) => {
    if (!project) return;

    const lightweightImages = images.map((img) => ({
      ...img,
      imageBase64: img.imageUrl ? "" : img.imageBase64,
    }));

    localStorage.setItem(
      `writeNowPageImages_${project.id}`,
      JSON.stringify(lightweightImages)
    );

    setPageImages(images);
  };

  const handleGenerateOutline = async () => {
    if (!project) return;
    if (blockIfLimitReached("outline")) return;

    try {
      setOutlineLoading(true);
      setOutlineMessage("Generating outline with AI...");
      setChapterMessage("");
      setExpandMessage("");

      const response = await fetch("/api/ai/generate-outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookData: project.bookData }),
      });

      const data = await response.json();

      if (!data.success) {
        setOutlineMessage(data.message || "AI outline generation failed.");
        return;
      }

      const generatedOutline: ProjectOutline = {
        projectId: project.id,
        generatedAt: new Date().toISOString(),
        title: data.outline.title,
        chapters: data.outline.chapters,
      };

      try {
        await saveOutlineDB(project.id, generatedOutline);
      } catch (error) {
        console.error("Supabase outline save failed:", error);
      }

      const outlines: ProjectOutline[] = JSON.parse(
        localStorage.getItem("writeNowOutlines") || "[]"
      );
      const filteredOutlines = outlines.filter(
        (item) => item.projectId !== project.id
      );
      localStorage.setItem(
        "writeNowOutlines",
        JSON.stringify([generatedOutline, ...filteredOutlines])
      );

      const chapterSets: ProjectChapter[] = JSON.parse(
        localStorage.getItem("writeNowChapters") || "[]"
      );
      const filteredChapters = chapterSets.filter(
        (item) => item.projectId !== project.id
      );
      localStorage.setItem("writeNowChapters", JSON.stringify(filteredChapters));

      incrementUsage("outline");
      setOutline(generatedOutline);
      setGeneratedChapters(null);
      setOutlineMessage("AI outline generated and saved successfully.");
    } catch (error) {
      setOutlineMessage(
        error instanceof Error ? error.message : "Unexpected AI outline error."
      );
    } finally {
      setOutlineLoading(false);
    }
  };

  const handleGenerateChapters = async () => {
    if (!project || !outline) return;
    if (blockIfLimitReached("chapters")) return;

    try {
      setChapterLoading(true);
      setChapterMessage("Generating chapters with AI...");
      setExpandMessage("");

      const response = await fetch("/api/ai/generate-chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookData: project.bookData,
          outlineTitle: outline.title,
          chapters: outline.chapters,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setChapterMessage(data.message || "AI chapter generation failed.");
        return;
      }

      await saveChapters({
        projectId: project.id,
        generatedAt: new Date().toISOString(),
        chapters: data.chapters,
      });

      incrementUsage("chapters");
      setChapterMessage("AI chapters generated and saved successfully.");
    } catch (error) {
      setChapterMessage(
        error instanceof Error ? error.message : "Unexpected AI chapter error."
      );
    } finally {
      setChapterLoading(false);
    }
  };

  const handleExpandChapters = async () => {
    if (!project || !generatedChapters) return;
    if (blockIfLimitReached("expand")) return;

    try {
      setExpandLoading(true);
      setExpandMessage("Expanding chapters with AI...");

      const response = await fetch("/api/ai/expand-chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookData: project.bookData,
          chapters: generatedChapters.chapters,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setExpandMessage(data.message || "AI chapter expansion failed.");
        return;
      }

      await saveChapters({
        projectId: project.id,
        generatedAt: new Date().toISOString(),
        chapters: data.chapters,
      });

      incrementUsage("expand");
      setExpandMessage("AI chapters expanded and saved successfully.");
    } catch (error) {
      setExpandMessage(
        error instanceof Error ? error.message : "Unexpected AI expansion error."
      );
    } finally {
      setExpandLoading(false);
    }
  };

  const handleGeneratePages = async () => {
    if (!project) return;

    try {
      setChapterMessage("Generating children’s book pages...");

      const response = await fetch("/api/ai/generate-pages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookData: project.bookData,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setChapterMessage(data.message || "Children’s page generation failed.");
        return;
      }

      const newPages: ProjectPages = {
        projectId: project.id,
        generatedAt: new Date().toISOString(),
        pages: data.pages,
      };

      localStorage.setItem(
        `writeNowPages_${project.id}`,
        JSON.stringify(newPages)
      );

      setPages(newPages);
      setChapterMessage("Children’s book pages generated successfully.");
    } catch (error) {
      setChapterMessage(
        error instanceof Error
          ? error.message
          : "Unexpected children’s page generation error."
      );
    }
  };

  const handleGeneratePageImages = async () => {
    if (!project || !pages) return;

    if (!planAllowsChapterImages()) {
      setPageImageMessage(
        "Page image generation requires the Enhanced or Premium plan."
      );
      return;
    }

    try {
      setPageImageLoading(true);
      setPageImageMessage("Generating page images...");

      const results: PageImage[] = [];

      for (const page of pages.pages) {
        const response = await fetch("/api/ai/generate-chapter-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: page.prompt,
            chapterTitle: `Page ${page.pageNumber}`,
            projectId: project.id,
            characters: imagePlan?.characters || [],
            style: imagePlan?.style || "",
          }),
        });

        const data = await response.json();

        if (!data.success) continue;

        results.push({
          projectId: project.id,
          pageNumber: page.pageNumber,
          text: page.text,
          prompt: page.prompt,
          imageBase64: data.image,
          imageUrl: data.imageUrl || "",
          mimeType: data.mimeType || "image/png",
          generatedAt: new Date().toISOString(),
          fallback: data.fallback || false,
        });
      }

      savePageImages(results);

      setPageImageMessage(
        results.length > 0
          ? "Page images generated successfully."
          : "No page images were generated."
      );
    } catch (error) {
      setPageImageMessage(
        error instanceof Error
          ? error.message
          : "Page image generation failed."
      );
    } finally {
      setPageImageLoading(false);
    }
  };

  const handleGenerateImagePlan = async () => {
  if (!project) return;
  if (blockIfLimitReached("imagePlan")) return;

  try {
    setImagePlanLoading(true);
    setImagePlanMessage("Generating image plan with AI...");

    const chaptersForPlan =
      outline?.chapters ||
      generatedChapters?.chapters.map((chapter) => chapter.title) ||
      [];

    const response = await fetch("/api/ai/generate-image-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookData: project.bookData,
        chapters: chaptersForPlan,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      setImagePlanMessage(data.message || "AI image plan generation failed.");
      return;
    }

    const plan: ImagePlan = {
      projectId: project.id,
      generatedAt: new Date().toISOString(),
      style: data.plan.style || "Not provided",
      coverPrompt: data.plan.coverPrompt || "Not provided",
      characters: Array.isArray(data.plan.characters) ? data.plan.characters : [],
      chapterImages: Array.isArray(data.plan.chapterImages)
        ? data.plan.chapterImages
        : [],
    };

    await saveImagePlan(plan);
    incrementUsage("imagePlan");
    setImagePlanMessage("AI image plan generated and saved successfully.");
  } catch (error) {
    setImagePlanMessage(
      error instanceof Error ? error.message : "Unexpected AI image plan error."
    );
  } finally {
    setImagePlanLoading(false);
  }
};

const handleGenerateCoverImage = async () => {
  if (!project || !imagePlan) return;
  if (blockIfLimitReached("cover")) return;

  try {
    setCoverImageLoading(true);
    setCoverImageMessage("Generating cover image...");

    const response = await fetch("/api/ai/generate-cover-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: imagePlan.coverPrompt,
        projectId: project.id,
        style: imagePlan.style,
        characters: imagePlan.characters,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      setCoverImageMessage(data.message || "Cover image generation failed.");
      return;
    }

    const cover: CoverImage = {
      projectId: project.id,
      generatedAt: new Date().toISOString(),
      prompt: imagePlan.coverPrompt,
      imageBase64: data.image,
      imageUrl: data.imageUrl || "",
      mimeType: data.mimeType || "image/png",
      fallback: data.fallback || false,
    };

    await saveCoverImage(cover);
    incrementUsage("cover");

    setCoverImageMessage(
      data.fallback
        ? "Fallback cover created successfully."
        : "Cover image generated and saved successfully."
    );
  } catch (error) {
    setCoverImageMessage(
      error instanceof Error ? error.message : "Unexpected cover image error."
    );
  } finally {
    setCoverImageLoading(false);
  }
};

const handleGenerateChapterImages = async () => {
  if (!project || !imagePlan) return;

  if (!planAllowsChapterImages()) {
    setChapterImageMessage(
      "Chapter image generation requires the Enhanced or Premium plan."
    );
    return;
  }

  try {
    setChapterImageLoading(true);
    setChapterImageMessage("Generating chapter images...");

    const results: ChapterImage[] = [];

    for (const item of imagePlan.chapterImages) {
      const response = await fetch("/api/ai/generate-chapter-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: item.prompt,
          chapterTitle: item.chapter,
          projectId: project.id,
          characters: imagePlan.characters,
          style: imagePlan.style,
        }),
      });

      const data = await response.json();

      if (!data.success) continue;

      results.push({
        projectId: project.id,
        chapter: item.chapter,
        prompt: item.prompt,
        imageBase64: data.image,
        imageUrl: data.imageUrl || "",
        mimeType: data.mimeType || "image/png",
        generatedAt: new Date().toISOString(),
        fallback: data.fallback || false,
      });
    }

    await saveChapterImages(results);

    setChapterImageMessage(
      results.length > 0
        ? "Chapter images generated successfully."
        : "No images were generated."
    );
  } catch (error) {
    setChapterImageMessage(
      error instanceof Error ? error.message : "Chapter image generation failed."
    );
  } finally {
    setChapterImageLoading(false);
  }
};

if (loading) {
    return (
      <main className="min-h-screen bg-black text-white px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <p className="text-gray-300">Loading project...</p>
        </div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-black text-white px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Project Not Found</h1>
          <p className="text-gray-300 mb-8">
            We could not find a saved project with that ID.
          </p>

          <Link
            href="/dashboard"
            className="inline-block bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const manuscriptReady =
    !!generatedChapters && generatedChapters.chapters.length > 0;
  const limits = currentLimits();
  const limitLabel =
    limits === "unlimited" ? "Unlimited AI usage" : "Limited AI usage";

  return (
    <main className="min-h-screen bg-black text-white px-6 py-16">
      <div className="max-w-6xl mx-auto">
        {globalMessage && (
          <div className="mb-6 rounded-xl border border-yellow-500 bg-yellow-500/10 p-4 text-yellow-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p>{globalMessage}</p>

            <Link
              href={`/upgrade?projectId=${project.id}`}
              className="bg-yellow-400 text-black px-5 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition text-center"
            >
              Upgrade / Unlock More
            </Link>
          </div>
        )}

        <div className="mb-8 border border-gray-700 rounded-2xl p-6 bg-gray-950">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl font-semibold">AI Usage Controls</h2>
              <p className="text-gray-400 text-sm">
                Current plan: {project.packageName} — {limitLabel}
              </p>
            </div>

            <Link
              href={`/upgrade?projectId=${project.id}`}
              className="border border-yellow-400 text-yellow-300 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-400 hover:text-black transition text-center"
            >
              Upgrade / Unlock More
            </Link>
          </div>

          <div className="grid gap-3 md:grid-cols-5 text-sm">
            <div className="rounded-lg border border-gray-800 bg-black/40 p-3">
              <p className="text-gray-400">Outlines</p>
              <p className="font-semibold">{usageLabel("outline")}</p>
            </div>

            <div className="rounded-lg border border-gray-800 bg-black/40 p-3">
              <p className="text-gray-400">Chapters</p>
              <p className="font-semibold">{usageLabel("chapters")}</p>
            </div>

            <div className="rounded-lg border border-gray-800 bg-black/40 p-3">
              <p className="text-gray-400">Expansions</p>
              <p className="font-semibold">{usageLabel("expand")}</p>
            </div>

            <div className="rounded-lg border border-gray-800 bg-black/40 p-3">
              <p className="text-gray-400">Image Plans</p>
              <p className="font-semibold">{usageLabel("imagePlan")}</p>
            </div>

            <div className="rounded-lg border border-gray-800 bg-black/40 p-3">
              <p className="text-gray-400">Covers</p>
              <p className="font-semibold">{usageLabel("cover")}</p>
            </div>
          </div>
        </div>

        <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-gray-400 mb-3">
              Project Detail
            </p>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              {project.bookData?.bookType || "Untitled Project"}
            </h1>
            <p className="text-lg text-gray-300">
              Build the book, expand chapters, plan visuals, generate cover art,
              and prepare the manuscript.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/dashboard"
              className="inline-block border border-gray-600 px-5 py-3 rounded-lg font-semibold hover:bg-white hover:text-black transition text-center"
            >
              Back to Dashboard
            </Link>

            <Link
              href={`/projects/${project.id}/manuscript`}
              className={`inline-block px-5 py-3 rounded-lg font-semibold text-center transition ${
                manuscriptReady
                  ? "bg-yellow-400 text-black hover:bg-yellow-300"
                  : "border border-gray-700 text-gray-500 cursor-not-allowed pointer-events-none"
              }`}
            >
              View Full Manuscript
            </Link>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.9fr]">
          <section className="space-y-8">
            <div className="border border-gray-700 rounded-2xl p-8 bg-gray-950">
              <h2 className="text-2xl font-semibold mb-6">Book Information</h2>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Book Type</p>
                  <p className="font-medium">
                    {project.bookData?.bookType || "Not provided"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-1">
                    Estimated Page Count
                  </p>
                  <p className="font-medium">
                    {project.bookData?.pageCount || "Not provided"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-1">Tone / Style</p>
                  <p className="font-medium">
                    {project.bookData?.tone || "Not provided"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-1">Target Audience</p>
                  <p className="font-medium">
                    {project.bookData?.audience || "Not provided"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-1">Author Name</p>
                  <p className="font-medium">
                    {project.bookData?.authorName || "Not provided"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-1">Images Needed</p>
                  <p className="font-medium">
                    {project.bookData?.imagesNeeded || "Not provided"}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm text-gray-400 mb-2">
                  Book Topic / Main Idea
                </p>
                <div className="rounded-xl border border-gray-800 bg-black/40 p-4 text-gray-200">
                  {project.bookData?.topic || "Not provided"}
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm text-gray-400 mb-2">
                  Extra Instructions
                </p>
                <div className="rounded-xl border border-gray-800 bg-black/40 p-4 text-gray-200">
                  {project.bookData?.extraInstructions ||
                    "No extra instructions provided"}
                </div>
              </div>
            </div>

            <div className="border border-gray-700 rounded-2xl p-8 bg-gray-950">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <h2 className="text-2xl font-semibold">AI Outline Workspace</h2>

                <button
                  onClick={handleGenerateOutline}
                  disabled={outlineLoading}
                  className="bg-yellow-400 text-black px-5 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {outlineLoading ? "Generating..." : "Generate AI Outline"}
                </button>
              </div>

                            {outlineMessage && (
                <div className="mb-6 rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-200">
                  {outlineMessage}
                </div>
              )}

              {!outline ? (
                <div className="border border-dashed border-gray-700 rounded-xl p-8 text-center">
                  <p className="text-gray-300 mb-3">
                    No AI outline has been generated yet.
                  </p>
                  <p className="text-sm text-gray-500">
                    Click “Generate AI Outline” to create a real AI-generated
                    structure.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="mb-5">
                    <p className="text-sm text-gray-400 mb-1">Outline Title</p>
                    <p className="font-semibold">{outline.title}</p>
                  </div>

                  <div className="mb-5">
                    <p className="text-sm text-gray-400 mb-1">Generated</p>
                    <p>{new Date(outline.generatedAt).toLocaleString()}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400 mb-3">Chapters</p>
                    <ul className="space-y-3">
                      {outline.chapters.map((chapter, index) => (
                        <li
                          key={index}
                          className="rounded-xl border border-gray-800 bg-black/40 p-4"
                        >
                          <span className="text-yellow-400 font-semibold mr-2">
                            {index + 1}.
                          </span>
                          {chapter}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

           <div className="border border-gray-700 rounded-2xl p-8 bg-gray-950">
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
    <div>
      <h2 className="text-2xl font-semibold">
        AI Chapter Draft Workspace
      </h2>
      <p className="text-gray-400 text-sm mt-2">
        Generate long-form chapters, expand them, or create page-by-page children&apos;s book content.
      </p>
    </div>

    <div className="flex flex-col sm:flex-row gap-3">
      <button
        onClick={handleGenerateChapters}
        disabled={!outline || chapterLoading}
        className="bg-white text-black px-5 py-3 rounded-lg font-semibold hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {chapterLoading ? "Generating..." : "Generate AI Chapters"}
      </button>

      <button
        onClick={handleExpandChapters}
        disabled={!generatedChapters || expandLoading}
        className="bg-yellow-400 text-black px-5 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {expandLoading ? "Expanding..." : "Expand AI Chapters"}
      </button>

      <button
        onClick={handleGeneratePages}
        disabled={chapterLoading}
        className="border border-yellow-400 text-yellow-300 px-5 py-3 rounded-lg font-semibold hover:bg-yellow-400 hover:text-black transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Generate Children&apos;s Pages
      </button>
    </div>
  </div>

  {chapterMessage && (
    <div className="mb-6 rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-200">
      {chapterMessage}
    </div>
  )}

  {expandMessage && (
    <div className="mb-6 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm text-yellow-200">
      {expandMessage}
    </div>
  )}

  {!outline && (
    <div className="mb-6 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm text-yellow-200">
      Generate the outline first before creating chapters.
    </div>
  )}

  {!generatedChapters ? (
    <div className="border border-dashed border-gray-700 rounded-xl p-8 text-center">
      <p className="text-gray-300 mb-3">
        No AI chapter drafts have been generated yet.
      </p>
      <p className="text-sm text-gray-500">
        Once generated, chapter content will be saved here for this project.
      </p>
    </div>
  ) : (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm text-gray-400 mb-1">
            Generated / Last Updated
          </p>
          <p>{new Date(generatedChapters.generatedAt).toLocaleString()}</p>
        </div>

        <Link
          href={`/projects/${project.id}/manuscript`}
          className="inline-block bg-yellow-400 text-black px-5 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition text-center"
        >
          View Full Manuscript
        </Link>
      </div>

      {generatedChapters.chapters.map((chapter, index) => (
        <div
          key={index}
          className="rounded-2xl border border-gray-800 bg-black/40 p-5"
        >
          <h3 className="text-xl font-semibold mb-3">
            Chapter {index + 1}: {chapter.title}
          </h3>
          <p className="whitespace-pre-line text-gray-200 leading-7">
            {chapter.content}
          </p>
        </div>
      ))}
    </div>
  )}

  {pages && (
  <div className="mt-10 border-t border-gray-700 pt-8">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h3 className="text-xl font-semibold">Children's Book Pages</h3>
        <p className="text-gray-400 text-sm mt-2">
          These are page-by-page children's book scenes.
        </p>
      </div>

      <button
        onClick={handleGeneratePageImages}
        disabled={pageImageLoading || !pages}
        className="bg-yellow-400 text-black px-5 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition"
      >
        {pageImageLoading ? "Generating..." : "Generate Page Images"}
      </button>
    </div>

    {pageImageMessage && (
      <div className="mb-6 rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-200">
        {pageImageMessage}
      </div>
    )}

    <div className="space-y-5">
      {pages.pages.map((page) => {
        const matchingImage = pageImages.find(
          (img) => img.pageNumber === page.pageNumber
        );

        return (
          <div
            key={page.pageNumber}
            className="rounded-2xl border border-gray-800 bg-black/40 p-5"
          >
            <p className="text-yellow-400 font-semibold mb-2">
              Page {page.pageNumber}
            </p>

            {matchingImage && (
              <div className="w-full aspect-[4/5] overflow-hidden rounded-xl border border-yellow-500/20 bg-black mb-4">
                <img
                  src={
                    matchingImage.imageUrl
                      ? matchingImage.imageUrl
                      : `data:${matchingImage.mimeType};base64,${matchingImage.imageBase64}`
                  }
                  alt={`Page ${page.pageNumber}`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <p className="text-gray-200 leading-7">{page.text}</p>
          </div>
        );
      })}
    </div>
  </div>
)}

{/* IMAGE PLAN SECTION */}
<div className="border border-yellow-500/30 rounded-2xl p-8 bg-yellow-500/10">
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
    <div>
      <h2 className="text-2xl font-semibold">AI Image Planning Workspace</h2>
      <p className="text-gray-300 mt-2">
        Generate cover prompts, character notes, and image prompts before creating actual images.
      </p>
    </div>

    <button
      onClick={handleGenerateImagePlan}
      disabled={imagePlanLoading}
      className="bg-yellow-400 text-black px-5 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {imagePlanLoading ? "Generating..." : "Generate Image Plan"}
    </button>
  </div>

  {imagePlanMessage && (
    <div className="mb-6 rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-200">
      {imagePlanMessage}
    </div>
  )}

  {!imagePlan ? (
    <div className="border border-dashed border-yellow-500/30 rounded-xl p-8 text-center">
      <p className="text-gray-300 mb-3">No image plan has been generated yet.</p>
      <p className="text-sm text-gray-500">
        Generate an image plan before creating cover or chapter images.
      </p>
    </div>
  ) : (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold mb-3">Overall Style</h3>
        <div className="rounded-xl border border-yellow-500/20 bg-black/30 p-4 text-gray-200">
          {imagePlan.style}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-3">Cover Prompt</h3>
        <div className="rounded-xl border border-yellow-500/20 bg-black/30 p-4 text-gray-200 whitespace-pre-line">
          {imagePlan.coverPrompt}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-3">Characters</h3>
        {imagePlan.characters.length === 0 ? (
          <p className="text-gray-400">No characters provided.</p>
        ) : (
          <div className="space-y-4">
            {imagePlan.characters.map((character, index) => (
              <div
                key={index}
                className="rounded-xl border border-yellow-500/20 bg-black/30 p-4"
              >
                <p className="font-semibold text-yellow-300 mb-2">
                  {character.name}
                </p>
                <p className="text-gray-200">{character.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-yellow-500/20 pt-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-semibold">Cover Image</h3>
            <p className="text-gray-300 mt-2">
              Generate a cover image from the saved cover prompt.
            </p>
          </div>

          <button
            onClick={handleGenerateCoverImage}
            disabled={coverImageLoading}
            className="bg-white text-black px-5 py-3 rounded-lg font-semibold hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {coverImageLoading ? "Generating..." : "Generate Cover Image"}
          </button>
        </div>

        {coverImageMessage && (
          <div className="mb-6 rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-200">
            {coverImageMessage}
          </div>
        )}

        {!coverImage ? (
          <div className="border border-dashed border-yellow-500/30 rounded-xl p-8 text-center">
            <p className="text-gray-300 mb-3">No cover image generated yet.</p>
            <p className="text-sm text-gray-500">
              Generate the cover after reviewing the prompt above.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Generated: {new Date(coverImage.generatedAt).toLocaleString()}
            </p>

            <div className="w-full max-w-md aspect-[2/3] overflow-hidden rounded-2xl border border-yellow-500/30 bg-black">
              <img
                src={
                  coverImage.imageUrl
                    ? coverImage.imageUrl
                    : `data:${coverImage.mimeType};base64,${coverImage.imageBase64}`
                }
                alt="Generated book cover"
                className="w-full h-full object-cover"
              />
            </div>

            {coverImage.fallback && (
              <p className="text-sm text-yellow-200">
                Fallback cover preview generated. Final AI cover can be regenerated when image generation is available.
              </p>
            )}

            <a
              href={
                coverImage.imageUrl
                  ? coverImage.imageUrl
                  : `data:${coverImage.mimeType};base64,${coverImage.imageBase64}`
              }
              download={
                coverImage.mimeType === "image/svg+xml"
                  ? "writenowbooks-cover.svg"
                  : "writenowbooks-cover.png"
              }
              className="inline-block bg-yellow-400 text-black px-5 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition"
            >
              Download Cover Image
            </a>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-3">Chapter Image Prompts</h3>
        {imagePlan.chapterImages.length === 0 ? (
          <p className="text-gray-400">No chapter prompts provided.</p>
        ) : (
          <div className="space-y-4">
            {imagePlan.chapterImages.map((item, index) => (
              <div
                key={index}
                className="rounded-xl border border-yellow-500/20 bg-black/30 p-4"
              >
                <p className="font-semibold text-yellow-300 mb-2">
                  {index + 1}. {item.chapter}
                </p>
                <p className="text-gray-200 whitespace-pre-line">
                  {item.prompt}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-yellow-500/20 pt-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-semibold">Chapter Images</h3>
            <p className="text-gray-300 mt-2">
              {planAllowsChapterImages()
                ? "Generate illustrations for each chapter, especially for children's books."
                : "Chapter image generation is available on Enhanced and Premium plans."}
            </p>
          </div>

          <button
            onClick={handleGenerateChapterImages}
            disabled={chapterImageLoading || !planAllowsChapterImages()}
            className="bg-yellow-400 text-black px-5 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {chapterImageLoading
              ? "Generating..."
              : planAllowsChapterImages()
              ? "Generate Chapter Images"
              : "Upgrade for Chapter Images"}
          </button>
        </div>

        {chapterImageMessage && (
          <div className="mb-6 rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-200">
            {chapterImageMessage}
          </div>
        )}

        {!planAllowsChapterImages() && (
          <div className="mb-6 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-100">
            Starter includes cover image generation only. Upgrade to Enhanced or Premium to generate and export chapter illustrations.
          </div>
        )}

        {chapterImages.length === 0 ? (
          <div className="border border-dashed border-yellow-500/30 rounded-xl p-8 text-center">
            <p className="text-gray-300 mb-3">No chapter images generated yet.</p>
            <p className="text-sm text-gray-500">
              {planAllowsChapterImages()
                ? "Generate images from your image plan."
                : "Upgrade to unlock chapter images."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {chapterImages.map((img, index) => (
              <div
                key={index}
                className="rounded-2xl border border-yellow-500/20 bg-black/40 p-4"
              >
                <p className="text-yellow-300 font-semibold mb-2">
                  {img.chapter}
                </p>

                <div className="w-full aspect-square overflow-hidden rounded-xl border border-yellow-500/20 bg-black mb-4">
                  <img
                    src={
                      img.imageUrl
                        ? img.imageUrl
                        : `data:${img.mimeType};base64,${img.imageBase64}`
                    }
                    alt={img.chapter}
                    className="w-full h-full object-cover"
                  />
                </div>

                {img.fallback && (
                  <p className="text-xs text-yellow-200 mb-3">
                    Fallback preview image
                  </p>
                )}

                <a
                  href={
                    img.imageUrl
                      ? img.imageUrl
                      : `data:${img.mimeType};base64,${img.imageBase64}`
                  }
                  download={`chapter-${index + 1}.${
                    img.mimeType === "image/svg+xml" ? "svg" : "png"
                  }`}
                  className="inline-block bg-yellow-400 text-black px-4 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition"
                >
                  Download
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )}
</div>
</div>
          </section>

          <aside className="space-y-6">
            <div className="border border-gray-700 rounded-2xl p-8 bg-gray-950">
              <h2 className="text-2xl font-semibold mb-6">Order Summary</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Package</span>
                  <span className="font-semibold">{project.packageName}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Price</span>
                  <span className="font-semibold">{project.packagePrice}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Plan Key</span>
                  <span className="font-semibold">{project.packagePlan}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Status</span>
                  <span className="font-semibold">{project.status}</span>
                </div>
              </div>
            </div>

            <div className="border border-gray-700 rounded-2xl p-8 bg-gray-950">
              <h2 className="text-2xl font-semibold mb-6">Payment Info</h2>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-gray-400 mb-1">Payment ID</p>
                  <p className="break-words">{project.paymentId}</p>
                </div>

                <div>
                  <p className="text-gray-400 mb-1">Created</p>
                  <p>{new Date(project.createdAt).toLocaleString()}</p>
                </div>

                <div>
                  <p className="text-gray-400 mb-1">Project ID</p>
                  <p className="break-words">{project.id}</p>
                </div>
              </div>
            </div>

            <div className="border border-yellow-500/30 rounded-2xl p-8 bg-yellow-500/10">
              <h2 className="text-2xl font-semibold mb-4">
                Manuscript Status
              </h2>
              <p className="text-gray-300 mb-5">
                {manuscriptReady
                  ? "Your manuscript view is ready."
                  : "Generate AI chapters to unlock the manuscript view."}
              </p>

              <Link
                href={`/projects/${project.id}/manuscript`}
                className={`block text-center px-5 py-3 rounded-lg font-semibold transition ${
                  manuscriptReady
                    ? "bg-yellow-400 text-black hover:bg-yellow-300"
                    : "border border-gray-700 text-gray-500 pointer-events-none"
                }`}
              >
                View Full Manuscript
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}