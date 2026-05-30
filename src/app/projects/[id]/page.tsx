"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

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
  bookTitle?: string;
  topic: string;
  pageCount: string;
  tone: string;
  audience: string;
  authorName: string;
  imagesNeeded: string;
  extraInstructions: string;
  accessType?: string;
  paymentStatus?: string;
  packageName?: string;
  packagePrice?: string;
  packagePlan?: string;
  esaRequest?: Record<string, any>;
  esaParentName?: string;
  esaParentEmail?: string;
  esaStudentName?: string;
  esaStudentGrade?: string;
  esaPackageChoice?: string;
  esaPackagePrice?: string;
  esaInvoiceNumber?: string;
  esaInvoiceStatus?: string;
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
    expanded?: boolean;
  }[];
};

type ImagePlan = {
  projectId: string;
  generatedAt: string;
  style: string;
  coverPrompt: string;
  titlePlacement?: string;
  authorPlacement?: string;
  textSafeArea?: string;
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

const normalizePackagePlan = (rawPlan?: string, rawName?: string) => {
  const value = `${rawPlan || ""} ${rawName || ""}`.toLowerCase();

  if (value.includes("premium") || value.includes("longform")) {
    return "premium";
  }

  if (value.includes("enhanced")) {
    return "enhanced";
  }

  return "starter";
};

const packageDisplayName = (plan: string, fallbackName?: string) => {
  if (fallbackName && !fallbackName.toLowerCase().includes("starter")) {
    return fallbackName;
  }

  if (plan === "premium") return "Premium Longform (ESA)";
  if (plan === "enhanced") return "Enhanced (ESA)";
  return fallbackName || "Starter";
};

const normalizeBookData = (bookData: any): BookFormData => {
  const esaRequest = bookData?.esaRequest || {};

  return {
    bookType: bookData?.bookType || "",
    bookTitle: bookData?.bookTitle || bookData?.title || "",
    topic: bookData?.topic || "",
    pageCount: bookData?.pageCount || "",
    tone: bookData?.tone || "",
    audience: bookData?.audience || "",
    authorName: bookData?.authorName || "",
    imagesNeeded: bookData?.imagesNeeded || "",
    extraInstructions: bookData?.extraInstructions || "",
    accessType: bookData?.accessType || "",
    paymentStatus: bookData?.paymentStatus || "",
    packageName: bookData?.packageName || "",
    packagePrice: bookData?.packagePrice || "",
    packagePlan: bookData?.packagePlan || "",
    esaRequest,
    esaParentName:
      bookData?.esaParentName ||
      esaRequest?.parentName ||
      esaRequest?.parent_name ||
      "",
    esaParentEmail:
      bookData?.esaParentEmail ||
      esaRequest?.parentEmail ||
      esaRequest?.parent_email ||
      "",
    esaStudentName:
      bookData?.esaStudentName ||
      esaRequest?.studentName ||
      esaRequest?.student_name ||
      "",
    esaStudentGrade:
      bookData?.esaStudentGrade ||
      esaRequest?.studentGrade ||
      esaRequest?.student_grade ||
      "",
    esaPackageChoice:
      bookData?.esaPackageChoice ||
      esaRequest?.packageChoice ||
      esaRequest?.package_choice ||
      "",
    esaPackagePrice:
      bookData?.esaPackagePrice ||
      esaRequest?.packagePrice ||
      esaRequest?.package_price ||
      "",
    esaInvoiceNumber:
      bookData?.esaInvoiceNumber ||
      esaRequest?.invoiceNumber ||
      esaRequest?.invoice_number ||
      "",
    esaInvoiceStatus:
      bookData?.esaInvoiceStatus ||
      esaRequest?.invoiceStatus ||
      esaRequest?.invoice_status ||
      "",
  };
};

const normalizeProject = (rawProject: any): SavedOrder | null => {
  if (!rawProject) return null;

  const rawBookData = rawProject.book_data || rawProject.bookData || {};
  const bookData = normalizeBookData(rawBookData);

  const rawPlan =
    rawProject.package_plan ||
    rawProject.packagePlan ||
    bookData.packagePlan ||
    bookData.esaPackageChoice ||
    rawProject.package_name ||
    rawProject.packageName ||
    "starter";

  const plan = normalizePackagePlan(
    rawPlan,
    rawProject.package_name || rawProject.packageName || bookData.packageName
  );

  const packageName = packageDisplayName(
    plan,
    rawProject.package_name || rawProject.packageName || bookData.packageName
  );

  const packagePrice =
    rawProject.package_price ||
    rawProject.packagePrice ||
    bookData.packagePrice ||
    bookData.esaPackagePrice ||
    (plan === "premium"
      ? "$253.98 (ESA Funded)"
      : plan === "enhanced"
      ? "$162.18 (ESA Funded)"
      : "$100.98 (ESA Funded)");

  return {
    id: rawProject.id,
    paymentId: rawProject.payment_id || rawProject.paymentId || "ESA-FUNDED",
    packageName,
    packagePrice,
    packagePlan: plan,
    status: rawProject.status || "ACTIVE",
    createdAt: rawProject.created_at || rawProject.createdAt || "",
    bookData: {
      ...bookData,
      packageName,
      packagePrice,
      packagePlan: plan,
    },
  };
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

      let foundProject: SavedOrder | null = null;

      // Supabase is the source of truth. LocalStorage is only a backup.
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("id", id)
          .single();

        if (!error && data) {
          foundProject = normalizeProject(data);
        }
      } catch (error) {
        console.log("Supabase project lookup failed:", error);
      }

      if (!foundProject) {
        const orders: SavedOrder[] = JSON.parse(
          localStorage.getItem("writeNowOrders") || "[]"
        );

        foundProject =
          normalizeProject(orders.find((order) => order.id === id)) || null;
      }

      setProject(foundProject);

      if (!foundProject) {
        setLoading(false);
        return;
      }

      // Refresh the local backup with the normalized Supabase project.
      const existingOrders: SavedOrder[] = JSON.parse(
        localStorage.getItem("writeNowOrders") || "[]"
      );
      const filteredOrders = existingOrders.filter((order) => order.id !== id);
      localStorage.setItem(
        "writeNowOrders",
        JSON.stringify([foundProject, ...filteredOrders])
      );

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

    const plan = normalizePackagePlan(project.packagePlan, project.packageName);
    return LIMITS[plan] || LIMITS.starter;
  };

  const usageLabel = (type: keyof Usage) => {
    const limits = currentLimits();
    if (limits === "unlimited") return `${usage[type]} / Unlimited`;
    return `${usage[type]} / ${limits[type]}`;
  };

  const planAllowsChapterImages = () => {
    if (!project) return false;

    const plan = normalizePackagePlan(project.packagePlan, project.packageName);

    return plan === "enhanced" || plan === "premium";
  };

const isChildrenBookProject = () => {
  const bookType = project?.bookData?.bookType?.toLowerCase() || "";
  const audience = project?.bookData?.audience?.toLowerCase() || "";
  const imagesNeeded = project?.bookData?.imagesNeeded?.toLowerCase() || "";

  return (
    bookType.includes("children") ||
    bookType.includes("kids") ||
    bookType.includes("picture") ||
    audience.includes("children") ||
    audience.includes("toddlers") ||
    imagesNeeded.includes("every page")
  );
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

    const existingChapters = generatedChapters?.chapters || [];

    if (existingChapters.length >= outline.chapters.length) {
      setChapterMessage("All outline chapters have already been generated.");
      return;
    }

    if (existingChapters.length === 0 && blockIfLimitReached("chapters")) {
      return;
    }

    const nextChapterIndex = existingChapters.length;
    const nextChapterTitle = outline.chapters[nextChapterIndex];

    try {
      setChapterLoading(true);
      setChapterMessage(
        `Generating Chapter ${nextChapterIndex + 1}: ${nextChapterTitle}...`
      );
      setExpandMessage("");

      const response = await fetch("/api/ai/generate-chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookData: project.bookData,
          outlineTitle: outline.title,
          chapterTitle: nextChapterTitle,
          chapterIndex: nextChapterIndex,
          totalChapters: outline.chapters.length,
          existingChapters,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setChapterMessage(data.message || "AI chapter generation failed.");
        return;
      }

      const generatedChapter = Array.isArray(data.chapters)
        ? data.chapters[0]
        : data.chapter;

      if (!generatedChapter?.title || !generatedChapter?.content) {
        setChapterMessage("AI chapter generation returned no usable chapter.");
        return;
      }

      const updatedChapters = [
        ...existingChapters,
        {
          title: generatedChapter.title,
          content: generatedChapter.content,
          expanded: false,
        },
      ];

      await saveChapters({
        projectId: project.id,
        generatedAt: new Date().toISOString(),
        chapters: updatedChapters,
      });

      if (existingChapters.length === 0) {
        incrementUsage("chapters");
      }

      const remainingCount = outline.chapters.length - updatedChapters.length;

      setChapterMessage(
        remainingCount > 0
          ? `Chapter ${nextChapterIndex + 1} generated successfully. ${remainingCount} chapter${
              remainingCount === 1 ? "" : "s"
            } remaining.`
          : "All chapters have been generated successfully."
      );
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

    const currentChapters = generatedChapters.chapters || [];
    const nextChapterIndex = currentChapters.findIndex(
      (chapter) => !chapter.expanded
    );

    if (nextChapterIndex === -1) {
      setExpandMessage("All generated chapters have already been expanded.");
      return;
    }

    if (
      !currentChapters.some((chapter) => chapter.expanded) &&
      blockIfLimitReached("expand")
    ) {
      return;
    }

    const chapterToExpand = currentChapters[nextChapterIndex];

    try {
      setExpandLoading(true);
      setExpandMessage(
        `Expanding Chapter ${nextChapterIndex + 1}: ${chapterToExpand.title}...`
      );

      const response = await fetch("/api/ai/expand-chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookData: project.bookData,
          chapter: chapterToExpand,
          chapterIndex: nextChapterIndex,
          totalChapters: currentChapters.length,
          previousChapters: currentChapters.slice(0, nextChapterIndex),
          followingChapters: currentChapters.slice(nextChapterIndex + 1),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setExpandMessage(data.message || "AI chapter expansion failed.");
        return;
      }

      const expandedChapter = Array.isArray(data.chapters)
        ? data.chapters[0]
        : data.chapter;

      if (!expandedChapter?.content) {
        setExpandMessage("AI chapter expansion returned no usable content.");
        return;
      }

      const updatedChapters = currentChapters.map((chapter, index) =>
        index === nextChapterIndex
          ? {
              title: expandedChapter.title || chapter.title,
              content: expandedChapter.content,
              expanded: true,
            }
          : chapter
      );

      await saveChapters({
        projectId: project.id,
        generatedAt: new Date().toISOString(),
        chapters: updatedChapters,
      });

      if (!currentChapters.some((chapter) => chapter.expanded)) {
        incrementUsage("expand");
      }

      const remainingCount = updatedChapters.filter(
        (chapter) => !chapter.expanded
      ).length;

      setExpandMessage(
        remainingCount > 0
          ? `Chapter ${nextChapterIndex + 1} expanded successfully. ${remainingCount} chapter${
              remainingCount === 1 ? "" : "s"
            } still need expansion.`
          : "All generated chapters have been expanded successfully."
      );
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
      setChapterMessage("Generating story pages...");

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
        setChapterMessage(data.message || "Story page generation failed.");
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
      setChapterMessage("Story pages generated successfully.");
    } catch (error) {
      setChapterMessage(
        error instanceof Error
          ? error.message
          : "Unexpected children’s page generation error."
      );
    }
  };

  const handleGeneratePageImages = async () => {
    if (!project || !pages || !imagePlan) return;

    if (!planAllowsChapterImages()) {
      setPageImageMessage(
        "Page illustration generation requires the Enhanced or Premium plan."
      );
      return;
    }

    const nextPage = pages.pages.find(
      (page) => !pageImages.some((img) => img.pageNumber === page.pageNumber)
    );

    if (!nextPage) {
      setPageImageMessage("All page illustrations have already been generated.");
      return;
    }

    try {
      setPageImageLoading(true);
      setPageImageMessage(
        `Generating illustration for page ${nextPage.pageNumber}...`
      );

      const response = await fetch("/api/ai/generate-chapter-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: nextPage.prompt,
          chapterTitle: `Page ${nextPage.pageNumber}`,
          projectId: project.id,
          characters: imagePlan.characters || [],
          style: imagePlan.style || "",
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setPageImageMessage(
          data.message ||
            `Page ${nextPage.pageNumber} illustration could not be generated.`
        );
        return;
      }

      const newImage: PageImage = {
        projectId: project.id,
        pageNumber: nextPage.pageNumber,
        text: nextPage.text,
        prompt: nextPage.prompt,
        imageBase64: data.image,
        imageUrl: data.imageUrl || "",
        mimeType: data.mimeType || "image/png",
        generatedAt: new Date().toISOString(),
        fallback: data.fallback || false,
      };

      const updatedImages = [
        ...pageImages.filter((img) => img.pageNumber !== nextPage.pageNumber),
        newImage,
      ].sort((a, b) => a.pageNumber - b.pageNumber);

      savePageImages(updatedImages);

      const remainingCount = pages.pages.length - updatedImages.length;

      setPageImageMessage(
        remainingCount > 0
          ? `Page ${nextPage.pageNumber} illustration generated. ${remainingCount} page illustration${
              remainingCount === 1 ? "" : "s"
            } remaining.`
          : "All page illustrations have been generated successfully."
      );
    } catch (error) {
      setPageImageMessage(
        error instanceof Error
          ? error.message
          : `Page ${nextPage.pageNumber} illustration generation failed.`
      );
    } finally {
      setPageImageLoading(false);
    }
  };

  const handleRegeneratePageImage = async (page: PageItem) => {
    if (!project || !imagePlan) return;

    if (!planAllowsChapterImages()) {
      setPageImageMessage(
        "Page illustration generation requires the Enhanced or Premium plan."
      );
      return;
    }

    try {
      setPageImageLoading(true);
      setPageImageMessage(`Regenerating illustration for page ${page.pageNumber}...`);

      const response = await fetch("/api/ai/generate-chapter-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: page.prompt,
          chapterTitle: `Page ${page.pageNumber}`,
          projectId: project.id,
          characters: imagePlan.characters || [],
          style: imagePlan.style || "",
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setPageImageMessage(
          data.message ||
            `Page ${page.pageNumber} illustration could not be regenerated.`
        );
        return;
      }

      const regeneratedImage: PageImage = {
        projectId: project.id,
        pageNumber: page.pageNumber,
        text: page.text,
        prompt: page.prompt,
        imageBase64: data.image,
        imageUrl: data.imageUrl || "",
        mimeType: data.mimeType || "image/png",
        generatedAt: new Date().toISOString(),
        fallback: data.fallback || false,
      };

      const updatedImages = [
        ...pageImages.filter((img) => img.pageNumber !== page.pageNumber),
        regeneratedImage,
      ].sort((a, b) => a.pageNumber - b.pageNumber);

      savePageImages(updatedImages);

      setPageImageMessage(`Page ${page.pageNumber} illustration regenerated successfully.`);
    } catch (error) {
      setPageImageMessage(
        error instanceof Error
          ? error.message
          : `Page ${page.pageNumber} illustration regeneration failed.`
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
    setImagePlanMessage(
      childrenBookMode
        ? "Creating character sheet and illustration style..."
        : "Creating illustration plan with AI..."
    );

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
      titlePlacement: data.plan.titlePlacement || "top center",
      authorPlacement: data.plan.authorPlacement || "bottom center",
      textSafeArea:
        data.plan.textSafeArea ||
        "Leave open space at the top for the title and near the bottom for the author name without covering faces or important artwork.",
      characters: Array.isArray(data.plan.characters) ? data.plan.characters : [],
      chapterImages: Array.isArray(data.plan.chapterImages)
        ? data.plan.chapterImages
        : [],
    };

    await saveImagePlan(plan);
    incrementUsage("imagePlan");
    setImagePlanMessage(
      childrenBookMode
        ? "Character sheet created and saved successfully."
        : "Illustration plan created and saved successfully."
    );
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
        title:
          project.bookData?.bookTitle ||
          project.bookData?.topic ||
          "Book Title",
        authorName: project.bookData?.authorName || "Author",
        titlePlacement: imagePlan.titlePlacement || "top center",
        authorPlacement: imagePlan.authorPlacement || "bottom center",
        textSafeArea:
          imagePlan.textSafeArea ||
          "Leave clean open space for the title and author name without covering faces or important artwork.",
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

  const childrenBookMode = isChildrenBookProject();

const manuscriptReady = childrenBookMode
  ? !!pages && pages.pages.length > 0
  : !!generatedChapters && generatedChapters.chapters.length > 0;

  const generatedRegularChapterCount = generatedChapters?.chapters.length || 0;
  const totalRegularChapterCount = outline?.chapters.length || 0;
  const nextChapterTitle =
    outline && generatedRegularChapterCount < outline.chapters.length
      ? outline.chapters[generatedRegularChapterCount]
      : "";

  const nextChapterToExpandIndex = generatedChapters?.chapters.findIndex(
    (chapter) => !chapter.expanded
  );
  const nextChapterToExpand =
    generatedChapters &&
    typeof nextChapterToExpandIndex === "number" &&
    nextChapterToExpandIndex >= 0
      ? generatedChapters.chapters[nextChapterToExpandIndex]
      : null;

  const nextPageToIllustrate = pages?.pages.find(
    (page) => !pageImages.some((img) => img.pageNumber === page.pageNumber)
  );

  const generatedPageIllustrationCount = pages
    ? pages.pages.filter((page) =>
        pageImages.some((img) => img.pageNumber === page.pageNumber)
      ).length
    : 0;

  const totalPageIllustrationCount = pages?.pages.length || 0;

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
              <p className="text-gray-400">
                {childrenBookMode ? "Character Sheets" : "Image Plans"}
              </p>
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
              {childrenBookMode
                ? "Build story pages, create a character sheet, generate page illustrations, and prepare the book."
                : "Build the outline, expand chapters, plan visuals, generate cover art, and prepare the manuscript."}
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

              {project.bookData?.bookTitle && (
                <div className="mt-6">
                  <p className="text-sm text-gray-400 mb-2">Book Title</p>
                  <div className="rounded-xl border border-gray-800 bg-black/40 p-4 text-gray-200">
                    {project.bookData.bookTitle}
                  </div>
                </div>
              )}

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
                <div className="rounded-xl border border-gray-800 bg-black/40 p-4 text-gray-200 whitespace-pre-line">
                  {project.bookData?.extraInstructions ||
                    "No extra instructions provided"}
                </div>
              </div>
            </div>

            {childrenBookMode ? (
              <div className="border border-yellow-500/30 rounded-2xl p-8 bg-yellow-500/10">
                <div className="mb-6">
                  <p className="text-sm uppercase tracking-[0.25em] text-yellow-300 mb-3">
                    Children&apos;s Book Workflow
                  </p>
                  <h2 className="text-2xl font-semibold">
                    Step 1: Generate Story Pages
                  </h2>
                  <p className="text-gray-300 text-sm mt-2">
                    Create the page-by-page story text first. Character planning
                    and illustrations come after the story pages are created.
                  </p>
                </div>

                <button
                  onClick={handleGeneratePages}
                  disabled={chapterLoading}
                  className="border border-yellow-400 text-yellow-300 px-5 py-3 rounded-lg font-semibold hover:bg-yellow-400 hover:text-black transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {chapterLoading ? "Generating..." : "Generate Story Pages"}
                </button>

                {chapterMessage && (
                  <div className="mt-6 rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-200">
                    {chapterMessage}
                  </div>
                )}

                {!pages ? (
                  <div className="mt-6 border border-dashed border-yellow-500/30 rounded-xl p-8 text-center">
                    <p className="text-gray-300 mb-3">
                      No story pages have been generated yet.
                    </p>
                    <p className="text-sm text-gray-500">
                      Click “Generate Story Pages” to create the children&apos;s
                      book pages.
                    </p>
                  </div>
                ) : (
                  <div className="mt-8 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">
                          Generated / Last Updated
                        </p>
                        <p>{new Date(pages.generatedAt).toLocaleString()}</p>
                      </div>

                      <Link
                        href={`/projects/${project.id}/manuscript`}
                        className="inline-block bg-yellow-400 text-black px-5 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition text-center"
                      >
                        View Full Book
                      </Link>
                    </div>

                    {pages.pages.map((page) => (
                      <div
                        key={page.pageNumber}
                        className="rounded-2xl border border-gray-800 bg-black/40 p-5"
                      >
                        <p className="text-yellow-400 font-semibold mb-2">
                          Page {page.pageNumber}
                        </p>
                        <p className="text-gray-200 leading-7">{page.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="border border-gray-700 rounded-2xl p-8 bg-gray-950">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <h2 className="text-2xl font-semibold">
                      AI Outline Workspace
                    </h2>

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
                        Click “Generate AI Outline” to create a real
                        AI-generated structure.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-5">
                        <p className="text-sm text-gray-400 mb-1">
                          Outline Title
                        </p>
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
                        Generate long-form chapters and expand them into a
                        fuller manuscript.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleGenerateChapters}
                        disabled={
                          !outline ||
                          chapterLoading ||
                          generatedRegularChapterCount >= totalRegularChapterCount
                        }
                        className="bg-white text-black px-5 py-3 rounded-lg font-semibold hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {chapterLoading
                          ? "Generating..."
                          : !outline
                          ? "Generate Outline First"
                          : generatedRegularChapterCount >= totalRegularChapterCount
                          ? "All Chapters Generated"
                          : `Generate Chapter ${
                              generatedRegularChapterCount + 1
                            }`}
                      </button>

                      <button
                        onClick={handleExpandChapters}
                        disabled={
                          !generatedChapters ||
                          expandLoading ||
                          !nextChapterToExpand
                        }
                        className="bg-yellow-400 text-black px-5 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {expandLoading
                          ? "Expanding..."
                          : !generatedChapters
                          ? "Generate Chapters First"
                          : nextChapterToExpand
                          ? `Expand Chapter ${
                              (nextChapterToExpandIndex || 0) + 1
                            }`
                          : "All Chapters Expanded"}
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
                        Once generated, chapter content will be saved here for
                        this project.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">
                            Generated / Last Updated
                          </p>
                          <p>
                            {new Date(
                              generatedChapters.generatedAt
                            ).toLocaleString()}
                          </p>
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
                </div>
              </>
            )}

            <div className="border border-yellow-500/30 rounded-2xl p-8 bg-yellow-500/10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-yellow-300 mb-3">
                    {childrenBookMode ? "Step 2" : "Visual Planning"}
                  </p>
                  <h2 className="text-2xl font-semibold">
                    {childrenBookMode
                      ? "Character & Illustration Planning"
                      : "Illustration Planning"}
                  </h2>
                  <p className="text-gray-300 mt-2">
                    {childrenBookMode
                      ? "Create consistent characters, art style, and illustration instructions before generating page artwork."
                      : "Create cover prompts, character notes, and image prompts before creating actual images."}
                  </p>
                </div>

                <button
                  onClick={handleGenerateImagePlan}
                  disabled={imagePlanLoading}
                  className="bg-yellow-400 text-black px-5 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {imagePlanLoading
                    ? childrenBookMode
                      ? "Building Character Sheet..."
                      : "Creating Plan..."
                    : childrenBookMode
                    ? "Create Character Sheet"
                    : "Create Illustration Plan"}
                </button>
              </div>

              {imagePlanMessage && (
                <div className="mb-6 rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-200">
                  {imagePlanMessage}
                </div>
              )}

              {!imagePlan ? (
                <div className="border border-dashed border-yellow-500/30 rounded-xl p-8 text-center">
                  <p className="text-gray-300 mb-3">
                    {childrenBookMode
                      ? "No character sheet has been created yet."
                      : "No illustration plan has been generated yet."}
                  </p>
                  <p className="text-sm text-gray-500">
                    {childrenBookMode
                      ? "Create the character sheet before generating page illustrations."
                      : "Create the illustration plan before generating cover or chapter images."}
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-3">
                      Overall Style
                    </h3>
                    <div className="rounded-xl border border-yellow-500/20 bg-black/30 p-4 text-gray-200">
                      {imagePlan.style}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3">
                      Cover Prompt
                    </h3>
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
                            <p className="text-gray-200">
                              {character.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {childrenBookMode && pages && (
                    <div className="border-t border-yellow-500/20 pt-8">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                        <div>
                          <p className="text-sm uppercase tracking-[0.25em] text-yellow-300 mb-3">
                            Step 3
                          </p>
                          <h3 className="text-xl font-semibold">
                            Page Illustrations
                          </h3>
                          <p className="text-gray-300 mt-2">
                            Generate one page illustration at a time. This
                            prevents long waits, failed requests, and makes it
                            easier to review each page before moving forward.
                          </p>
                          <p className="text-sm text-yellow-200 mt-3">
                            {generatedPageIllustrationCount} of{" "}
                            {totalPageIllustrationCount} page illustrations
                            generated.
                          </p>
                        </div>

                        <button
                          onClick={handleGeneratePageImages}
                          disabled={
                            pageImageLoading ||
                            !pages ||
                            !imagePlan ||
                            !nextPageToIllustrate
                          }
                          className="bg-yellow-400 text-black px-5 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {pageImageLoading
                            ? "Generating..."
                            : nextPageToIllustrate
                            ? `Generate Page ${nextPageToIllustrate.pageNumber} Illustration`
                            : "All Page Illustrations Generated"}
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
                              className="rounded-2xl border border-yellow-500/20 bg-black/40 p-5"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                                <p className="text-yellow-400 font-semibold">
                                  Page {page.pageNumber}
                                </p>

                                {matchingImage ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRegeneratePageImage(page)
                                    }
                                    disabled={pageImageLoading}
                                    className="border border-yellow-400 text-yellow-300 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-400 hover:text-black transition disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {pageImageLoading
                                      ? "Please wait..."
                                      : `Regenerate Page ${page.pageNumber}`}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRegeneratePageImage(page)
                                    }
                                    disabled={pageImageLoading}
                                    className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {pageImageLoading
                                      ? "Please wait..."
                                      : `Generate Page ${page.pageNumber}`}
                                  </button>
                                )}
                              </div>

                              {matchingImage ? (
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
                              ) : (
                                <div className="w-full aspect-[4/5] rounded-xl border border-dashed border-yellow-500/20 bg-black/40 mb-4 flex items-center justify-center p-6 text-center text-gray-400">
                                  No illustration generated for this page yet.
                                </div>
                              )}

                              <p className="text-gray-200 leading-7">
                                {page.text}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-yellow-500/20 pt-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                      <div>
                        <p className="text-sm uppercase tracking-[0.25em] text-yellow-300 mb-3">
                          {childrenBookMode ? "Step 4" : "Cover"}
                        </p>
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
                        {coverImageLoading
                          ? "Generating..."
                          : "Generate Cover Image"}
                      </button>
                    </div>

                    {coverImageMessage && (
                      <div className="mb-6 rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-200">
                        {coverImageMessage}
                      </div>
                    )}

                    {!coverImage ? (
                      <div className="border border-dashed border-yellow-500/30 rounded-xl p-8 text-center">
                        <p className="text-gray-300 mb-3">
                          No cover image generated yet.
                        </p>
                        <p className="text-sm text-gray-500">
                          Generate the cover after reviewing the prompt above.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-gray-400">
                          Generated:{" "}
                          {new Date(coverImage.generatedAt).toLocaleString()}
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
                            Fallback cover preview generated. Final AI cover can
                            be regenerated when image generation is available.
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

                  {!childrenBookMode && (
                    <>
                      <div>
                        <h3 className="text-xl font-semibold mb-3">
                          Chapter Image Prompts
                        </h3>
                        {imagePlan.chapterImages.length === 0 ? (
                          <p className="text-gray-400">
                            No chapter prompts provided.
                          </p>
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
                            <h3 className="text-xl font-semibold">
                              Chapter Images
                            </h3>
                            <p className="text-gray-300 mt-2">
                              {planAllowsChapterImages()
                                ? "Generate illustrations for each chapter."
                                : "Chapter image generation is available on Enhanced and Premium plans."}
                            </p>
                          </div>

                          <button
                            onClick={handleGenerateChapterImages}
                            disabled={
                              chapterImageLoading ||
                              !planAllowsChapterImages()
                            }
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
                            Starter includes cover image generation only.
                            Upgrade to Enhanced or Premium to generate and
                            export chapter illustrations.
                          </div>
                        )}

                        {chapterImages.length === 0 ? (
                          <div className="border border-dashed border-yellow-500/30 rounded-xl p-8 text-center">
                            <p className="text-gray-300 mb-3">
                              No chapter images generated yet.
                            </p>
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
                                    img.mimeType === "image/svg+xml"
                                      ? "svg"
                                      : "png"
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
                    </>
                  )}
                </div>
              )}
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
                {childrenBookMode ? "Book Status" : "Manuscript Status"}
              </h2>
              <p className="text-gray-300 mb-5">
                {manuscriptReady
                  ? childrenBookMode
                    ? "Your book view is ready."
                    : "Your manuscript view is ready."
                  : childrenBookMode
                  ? "Generate story pages to unlock the book view."
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
                {childrenBookMode ? "View Full Book" : "View Full Manuscript"}
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}