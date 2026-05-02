"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import jsPDF from "jspdf";
import JSZip from "jszip";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  TableOfContents,
} from "docx";
import { saveAs } from "file-saver";
import { supabase } from "@/lib/supabaseClient";

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

type ChapterItem = {
  title: string;
  content: string;
};

type ProjectChapter = {
  projectId: string;
  generatedAt: string;
  chapters: ChapterItem[];
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

type ExportBookStyle =
  | "auto"
  | "children"
  | "workbook"
  | "illustrated"
  | "standard";

type ResolvedExportBookStyle =
  | "children"
  | "workbook"
  | "illustrated"
  | "standard";

type PrintFormat = "digital" | "kdp";

type TrimSize = "6x9" | "8.5x11";

type FrontMatter = {
  subtitle: string;
  isbn: string;
  copyrightYear: string;
  publisherName: string;
  copyrightText: string;
  dedication: string;
  includeCopyrightPage: boolean;
  includeDedicationPage: boolean;
  includeTableOfContents: boolean;
};

type PublishingSettings = {
  printFormat: PrintFormat;
  trimSize: TrimSize;
  spineText: string;
  backCoverBlurb: string;
  backCoverAuthorBio: string;
  includeCoverWrapInZip: boolean;
};

type TocEntry = {
  label: string;
  title: string;
  page: number;
};

type KDPAutomation = {
  bookDescription: string;
  keywords: string[];
  categories: string[];
  targetAgeRange: string;
  marketplace: string;
  language: string;
  interiorType: "black-white" | "color";
  paperType: "white" | "cream";
  bleed: "no-bleed" | "bleed";
  checklist: {
    manuscriptPdf: boolean;
    coverWrapPdf: boolean;
    titleSubtitle: boolean;
    authorName: boolean;
    description: boolean;
    keywords: boolean;
    categories: boolean;
    isbn: boolean;
    trimSize: boolean;
    previewer: boolean;
    pricing: boolean;
  };
};

const DEFAULT_FRONT_MATTER: FrontMatter = {
  subtitle: "",
  isbn: "",
  copyrightYear: new Date().getFullYear().toString(),
  publisherName: "",
  copyrightText: "",
  dedication: "",
  includeCopyrightPage: true,
  includeDedicationPage: false,
  includeTableOfContents: true,
};

const DEFAULT_PUBLISHING_SETTINGS: PublishingSettings = {
  printFormat: "digital",
  trimSize: "6x9",
  spineText: "",
  backCoverBlurb:
    "Add a powerful back-cover description here. This should tell readers what the book is about, who it is for, and why they should read it.",
  backCoverAuthorBio: "",
  includeCoverWrapInZip: true,
};

const DEFAULT_KDP_AUTOMATION: KDPAutomation = {
  bookDescription: "",
  keywords: [],
  categories: [],
  targetAgeRange: "",
  marketplace: "Amazon.com",
  language: "English",
  interiorType: "black-white",
  paperType: "white",
  bleed: "no-bleed",
  checklist: {
    manuscriptPdf: false,
    coverWrapPdf: false,
    titleSubtitle: false,
    authorName: false,
    description: false,
    keywords: false,
    categories: false,
    isbn: false,
    trimSize: false,
    previewer: false,
    pricing: false,
  },
};

export default function ManuscriptPage() {
  const params = useParams();

  const [project, setProject] = useState<SavedOrder | null>(null);
  const [chapters, setChapters] = useState<ProjectChapter | null>(null);
  const [coverImage, setCoverImage] = useState<CoverImage | null>(null);
  const [chapterImages, setChapterImages] = useState<ChapterImage[]>([]);
  const [pages, setPages] = useState<ProjectPages | null>(null);
  const [pageImages, setPageImages] = useState<PageImage[]>([]);
  const [saveMessage, setSaveMessage] = useState("");
  const [zipUrl, setZipUrl] = useState("");
  const [zipLoading, setZipLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [coverWrapLoading, setCoverWrapLoading] = useState(false);
  const [showKDPGuide, setShowKDPGuide] = useState(false);
  const [selectedExportStyle, setSelectedExportStyle] =
    useState<ExportBookStyle>("auto");
  const [frontMatter, setFrontMatter] =
    useState<FrontMatter>(DEFAULT_FRONT_MATTER);
  const [publishingSettings, setPublishingSettings] =
    useState<PublishingSettings>(DEFAULT_PUBLISHING_SETTINGS);
  const [kdpAutomation, setKdpAutomation] =
    useState<KDPAutomation>(DEFAULT_KDP_AUTOMATION);

  useEffect(() => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    if (!id) return;

    const orders: SavedOrder[] = JSON.parse(
      localStorage.getItem("writeNowOrders") || "[]"
    );

    const foundProject = orders.find((order) => order.id === id);
    setProject(foundProject || null);

    const savedChapters: ProjectChapter[] = JSON.parse(
      localStorage.getItem("writeNowChapters") || "[]"
    );

    const foundChapters = savedChapters.find(
      (chapterSet) => chapterSet.projectId === id
    );

    setChapters(foundChapters || null);

    const savedCovers: CoverImage[] = JSON.parse(
      localStorage.getItem("writeNowCoverImages") || "[]"
    );

    const foundCover = savedCovers.find((cover) => cover.projectId === id);
    setCoverImage(foundCover || null);

    const savedChapterImages: ChapterImage[] = JSON.parse(
      localStorage.getItem("writeNowChapterImages") || "[]"
    );

    setChapterImages(
      savedChapterImages.filter((image) => image.projectId === id)
    );

    const savedPages: ProjectPages | null = JSON.parse(
      localStorage.getItem(`writeNowPages_${id}`) || "null"
    );

    setPages(savedPages);

    const savedPageImages: PageImage[] = JSON.parse(
      localStorage.getItem(`writeNowPageImages_${id}`) || "[]"
    );

    setPageImages(savedPageImages);

    const savedZipUrl = localStorage.getItem(`zip_${id}`) || "";
    setZipUrl(savedZipUrl);

    const savedExportStyle = localStorage.getItem(
      `writeNowExportStyle_${id}`
    ) as ExportBookStyle | null;

    if (
      savedExportStyle === "auto" ||
      savedExportStyle === "children" ||
      savedExportStyle === "workbook" ||
      savedExportStyle === "illustrated" ||
      savedExportStyle === "standard"
    ) {
      setSelectedExportStyle(savedExportStyle);
    }

    const savedFrontMatter: FrontMatter | null = JSON.parse(
      localStorage.getItem(`writeNowFrontMatter_${id}`) || "null"
    );

    if (savedFrontMatter) {
      setFrontMatter({
        ...DEFAULT_FRONT_MATTER,
        ...savedFrontMatter,
      });
    }

    const savedPublishingSettings: PublishingSettings | null = JSON.parse(
      localStorage.getItem(`writeNowPublishingSettings_${id}`) || "null"
    );

    if (savedPublishingSettings) {
      setPublishingSettings({
        ...DEFAULT_PUBLISHING_SETTINGS,
        ...savedPublishingSettings,
      });
    }

    const savedKdpAutomation: KDPAutomation | null = JSON.parse(
      localStorage.getItem(`writeNowKdpAutomation_${id}`) || "null"
    );

    if (savedKdpAutomation) {
      setKdpAutomation({
        ...DEFAULT_KDP_AUTOMATION,
        ...savedKdpAutomation,
        checklist: {
          ...DEFAULT_KDP_AUTOMATION.checklist,
          ...savedKdpAutomation.checklist,
        },
      });
    }
  }, [params]);

  const persistFrontMatter = (updated: FrontMatter) => {
    setFrontMatter(updated);

    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    if (id) {
      localStorage.setItem(
        `writeNowFrontMatter_${id}`,
        JSON.stringify(updated)
      );
    }
  };

  const updateFrontMatter = <K extends keyof FrontMatter>(
    key: K,
    value: FrontMatter[K]
  ) => {
    persistFrontMatter({
      ...frontMatter,
      [key]: value,
    });
  };

  const persistPublishingSettings = (updated: PublishingSettings) => {
    setPublishingSettings(updated);

    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    if (id) {
      localStorage.setItem(
        `writeNowPublishingSettings_${id}`,
        JSON.stringify(updated)
      );
    }
  };

  const updatePublishingSettings = <K extends keyof PublishingSettings>(
    key: K,
    value: PublishingSettings[K]
  ) => {
    persistPublishingSettings({
      ...publishingSettings,
      [key]: value,
    });
  };

  const persistKdpAutomation = (updated: KDPAutomation) => {
    setKdpAutomation(updated);

    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    if (id) {
      localStorage.setItem(
        `writeNowKdpAutomation_${id}`,
        JSON.stringify(updated)
      );
    }
  };

  const updateKdpAutomation = <K extends keyof KDPAutomation>(
    key: K,
    value: KDPAutomation[K]
  ) => {
    persistKdpAutomation({
      ...kdpAutomation,
      [key]: value,
    });
  };

  const updateKdpChecklist = (
    key: keyof KDPAutomation["checklist"],
    value: boolean
  ) => {
    persistKdpAutomation({
      ...kdpAutomation,
      checklist: {
        ...kdpAutomation.checklist,
        [key]: value,
      },
    });
  };

  const planAllowsChapterImages = () => {
    if (!project) return false;

    const plan = project.packagePlan.toLowerCase();

    return plan === "enhanced" || plan === "premium";
  };

  const getTitle = () => {
    return (
      project?.bookData?.topic ||
      project?.bookData?.bookType ||
      "Untitled Book"
    );
  };

  const detectExportBookStyle = (): ResolvedExportBookStyle => {
    const bookType = project?.bookData?.bookType?.toLowerCase() || "";
    const audience = project?.bookData?.audience?.toLowerCase() || "";
    const imagesNeeded = project?.bookData?.imagesNeeded?.toLowerCase() || "";

    if (
      bookType.includes("children") ||
      bookType.includes("kids") ||
      bookType.includes("picture book") ||
      audience.includes("children") ||
      audience.includes("kids") ||
      imagesNeeded.includes("each page") ||
      imagesNeeded.includes("every page")
    ) {
      return "children";
    }

    if (
      bookType.includes("workbook") ||
      bookType.includes("course") ||
      bookType.includes("handbook") ||
      bookType.includes("lesson") ||
      bookType.includes("study guide")
    ) {
      return "workbook";
    }

    if (
      imagesNeeded.includes("yes") ||
      imagesNeeded.includes("chapter") ||
      imagesNeeded.includes("illustration") ||
      imagesNeeded.includes("images")
    ) {
      return "illustrated";
    }

    return "standard";
  };

  const getExportBookStyle = (): ResolvedExportBookStyle => {
    if (selectedExportStyle === "auto") return detectExportBookStyle();
    return selectedExportStyle;
  };

  const isChildrenBook = () => getExportBookStyle() === "children";

  const getExportModeLabel = () => {
    const style = getExportBookStyle();

    if (style === "children") return "Children’s page-by-page layout";
    if (style === "workbook") return "Workbook / handbook layout";
    if (style === "illustrated") return "Illustrated chapter layout";
    return "Standard chapter layout";
  };

  const handleExportStyleChange = (style: ExportBookStyle) => {
    setSelectedExportStyle(style);

    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    if (id) {
      localStorage.setItem(`writeNowExportStyle_${id}`, style);
    }
  };

  const sanitizeFilename = (name: string) => {
    return name
      .replace(/[<>:"/\\|?*]+/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase()
      .slice(0, 80);
  };

const getTrimSizeMM = () => {
    if (publishingSettings.trimSize === "8.5x11") {
      return {
        width: 215.9,
        height: 279.4,
      };
    }

    return {
      width: 152.4,
      height: 228.6,
    };
  };

  const getPdfConfig = () => {
    const trim = getTrimSizeMM();

    if (publishingSettings.printFormat === "kdp") {
      return {
        unit: "mm" as const,
        format: [trim.width, trim.height] as [number, number],
        marginTop: 22,
        marginBottom: 22,
        marginLeft: 24,
        marginRight: 18,
        gutter: 6,
      };
    }

    return {
      unit: "mm" as const,
      format: "a4" as const,
      marginTop: 20,
      marginBottom: 20,
      marginLeft: 20,
      marginRight: 20,
      gutter: 0,
    };
  };

  const createPdfDocument = () => {
    const config = getPdfConfig();

    return new jsPDF({
      unit: config.unit,
      format: config.format,
    });
  };

  const getPageMeasurements = (doc: jsPDF) => {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const config = getPdfConfig();

    const marginLeft = config.marginLeft + config.gutter;
    const marginRight = config.marginRight;
    const usableWidth = pageWidth - marginLeft - marginRight;
    const bottomLimit = pageHeight - config.marginBottom;

    return {
      pageWidth,
      pageHeight,
      marginTop: config.marginTop,
      marginBottom: config.marginBottom,
      marginLeft,
      marginRight,
      usableWidth,
      bottomLimit,
    };
  };

  const getKDPReadyIssues = () => {
    const issues: string[] = [];

    if (!chapters || chapters.chapters.length === 0) {
      issues.push("Generate or save manuscript chapters.");
    }

    if (!coverImage) {
      issues.push("Generate a cover image.");
    }

    if (getExportBookStyle() === "children" && (!pages || pages.pages.length === 0)) {
      issues.push("Generate children’s book pages.");
    }

    if (!frontMatter.isbn.trim()) {
      issues.push("Add an ISBN or use the KDP-provided ISBN option.");
    }

    if (!kdpAutomation.bookDescription.trim()) {
      issues.push("Generate or enter a KDP book description.");
    }

    if (kdpAutomation.keywords.filter(Boolean).length < 3) {
      issues.push("Add at least 3 KDP keywords.");
    }

    if (kdpAutomation.categories.filter(Boolean).length < 1) {
      issues.push("Select at least 1 KDP category.");
    }

    if (!publishingSettings.backCoverBlurb.trim()) {
      issues.push("Add a back-cover blurb.");
    }

    return issues;
  };

  const isKDPReady = () => {
    return getKDPReadyIssues().length === 0;
  };

  const generateKDPDescription = () => {
    const title = getTitle();
    const author = project?.bookData?.authorName || "the author";
    const topic = project?.bookData?.topic || title;
    const audience = project?.bookData?.audience || "readers";
    const tone = project?.bookData?.tone || "clear and engaging";

    const description = `${title} is a ${tone.toLowerCase()} book created for ${audience}. This book explores ${topic} in a way that helps readers understand the subject, connect with the message, and walk away with something useful.

Inside this book, readers will find structured content, practical insight, and a clear flow from beginning to end. Whether the reader is learning, reflecting, being entertained, or preparing to take action, this book is designed to provide a meaningful reading experience.

Perfect for readers looking for a focused, accessible, and well-organized book on ${topic}.

Written by ${author}.`;

    persistKdpAutomation({
      ...kdpAutomation,
      bookDescription: description,
      checklist: {
        ...kdpAutomation.checklist,
        description: true,
      },
    });
  };

  const generateKDPKeywords = () => {
    const title = getTitle().toLowerCase();
    const bookType = project?.bookData?.bookType?.toLowerCase() || "";
    const topic = project?.bookData?.topic?.toLowerCase() || "";
    const audience = project?.bookData?.audience?.toLowerCase() || "";
    const style = getExportBookStyle();

    const rawKeywords = [
      topic,
      title,
      `${topic} book`,
      `${topic} guide`,
      `${audience} book`,
      `${bookType} book`,
      style === "children" ? "children's picture book" : "",
      style === "workbook" ? "workbook for beginners" : "",
      style === "workbook" ? `${topic} workbook` : "",
      style === "illustrated" ? "illustrated book" : "",
      "self help book",
      "educational book",
    ];

    const cleaned = Array.from(
      new Set(
        rawKeywords
          .map((item) => item.trim())
          .filter((item) => item.length > 2)
      )
    ).slice(0, 7);

    persistKdpAutomation({
      ...kdpAutomation,
      keywords: cleaned,
      checklist: {
        ...kdpAutomation.checklist,
        keywords: cleaned.length > 0,
      },
    });
  };

  const generateKDPCategories = () => {
    const style = getExportBookStyle();
    const bookType = project?.bookData?.bookType?.toLowerCase() || "";
    const topic = project?.bookData?.topic?.toLowerCase() || "";

    let categories: string[] = [];

    if (style === "children") {
      categories = [
        "Children's Books > Literature & Fiction",
        "Children's Books > Growing Up & Facts of Life",
        "Children's Books > Education & Reference",
      ];
    } else if (style === "workbook") {
      categories = [
        "Education & Teaching > Studying & Workbooks",
        "Reference > Education",
        "Self-Help > Personal Transformation",
      ];
    } else if (
      bookType.includes("business") ||
      topic.includes("business") ||
      topic.includes("money") ||
      topic.includes("finance")
    ) {
      categories = [
        "Business & Money > Personal Finance",
        "Business & Money > Entrepreneurship",
        "Self-Help > Success",
      ];
    } else if (
      topic.includes("faith") ||
      topic.includes("scripture") ||
      topic.includes("bible") ||
      topic.includes("spiritual")
    ) {
      categories = [
        "Religion & Spirituality > Inspirational",
        "Religion & Spirituality > Bible Study",
        "Christian Books & Bibles > Christian Living",
      ];
    } else {
      categories = [
        "Self-Help > Personal Transformation",
        "Education & Teaching > Education",
        "Reference > Writing, Research & Publishing Guides",
      ];
    }

    persistKdpAutomation({
      ...kdpAutomation,
      categories,
      checklist: {
        ...kdpAutomation.checklist,
        categories: categories.length > 0,
      },
    });
  };

  const autoCompleteKDPBasics = () => {
    const titleReady = !!getTitle();
    const authorReady = !!project?.bookData?.authorName;
    const isbnReady = !!frontMatter.isbn.trim();
    const trimReady = !!publishingSettings.trimSize;

    persistKdpAutomation({
      ...kdpAutomation,
      language: kdpAutomation.language || "English",
      marketplace: kdpAutomation.marketplace || "Amazon.com",
      checklist: {
        ...kdpAutomation.checklist,
        titleSubtitle: titleReady,
        authorName: authorReady,
        isbn: isbnReady,
        trimSize: trimReady,
      },
    });

    setSaveMessage("KDP basics checked and updated.");
  };

  const markExportChecklistReady = (type: "pdf" | "cover") => {
    persistKdpAutomation({
      ...kdpAutomation,
      checklist: {
        ...kdpAutomation.checklist,
        manuscriptPdf:
          type === "pdf" ? true : kdpAutomation.checklist.manuscriptPdf,
        coverWrapPdf:
          type === "cover" ? true : kdpAutomation.checklist.coverWrapPdf,
      },
    });
  };

  const openKDPGuide = () => {
    const issues = getKDPReadyIssues();

    autoCompleteKDPBasics();

    if (issues.length > 0) {
      setSaveMessage(
        `KDP guide opened. Remaining items: ${issues.join(" ")}`
      );
    }

    setShowKDPGuide(true);
  };

  const base64ToBlob = (base64: string, mimeType: string) => {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);

      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      byteArrays.push(new Uint8Array(byteNumbers));
    }

    return new Blob(byteArrays, { type: mimeType });
  };

  const blobToDataUrl = (blob: Blob) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        if (typeof reader.result === "string") resolve(reader.result);
        else reject(new Error("Unable to convert image blob."));
      };

      reader.onerror = () => reject(new Error("Unable to read image blob."));
      reader.readAsDataURL(blob);
    });
  };

  const imageToDataUrl = async (image: {
    mimeType: string;
    imageBase64: string;
    imageUrl?: string;
  }) => {
    if (image.imageBase64) {
      return `data:${image.mimeType};base64,${image.imageBase64}`;
    }

    if (image.imageUrl) {
      const response = await fetch(image.imageUrl);
      const blob = await response.blob();
      return await blobToDataUrl(blob);
    }

    return "";
  };

  const getImageExtension = (mimeType: string) => {
    if (mimeType.includes("svg")) return "svg";
    if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg";
    return "png";
  };

  const getImageFormat = (mimeType: string) => {
    if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "JPEG";
    return "PNG";
  };

  const getImageSource = (image: {
    mimeType: string;
    imageBase64: string;
    imageUrl?: string;
  }) => {
    if (image.imageUrl) return image.imageUrl;
    return `data:${image.mimeType};base64,${image.imageBase64}`;
  };

  const updateChapterTitle = (index: number, value: string) => {
    if (!chapters) return;

    const updated = {
      ...chapters,
      chapters: chapters.chapters.map((chapter, i) =>
        i === index ? { ...chapter, title: value } : chapter
      ),
    };

    setChapters(updated);
  };

  const updateChapterContent = (index: number, value: string) => {
    if (!chapters) return;

    const updated = {
      ...chapters,
      chapters: chapters.chapters.map((chapter, i) =>
        i === index ? { ...chapter, content: value } : chapter
      ),
    };

    setChapters(updated);
  };

  const saveEditedManuscript = () => {
    if (!project || !chapters) return;

    const savedChapters: ProjectChapter[] = JSON.parse(
      localStorage.getItem("writeNowChapters") || "[]"
    );

    const filtered = savedChapters.filter(
      (chapterSet) => chapterSet.projectId !== project.id
    );

    const updatedChapterSet = {
      ...chapters,
      generatedAt: new Date().toISOString(),
    };

    localStorage.setItem(
      "writeNowChapters",
      JSON.stringify([updatedChapterSet, ...filtered])
    );

    setChapters(updatedChapterSet);
    setSaveMessage("Manuscript edits saved successfully.");
  };

  const addPageNumbers = (doc: jsPDF) => {
    const pageCount = doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      const { pageWidth, pageHeight } = getPageMeasurements(doc);

      doc.setFontSize(9);
      doc.setFont("Times", "normal");
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 8, {
        align: "center",
      });
    }
  };

  const addWrappedText = (
    doc: jsPDF,
    text: string,
    options: {
      x: number;
      y: number;
      maxWidth: number;
      lineHeight: number;
      bottomLimit: number;
      fontSize?: number;
      bold?: boolean;
      italic?: boolean;
      align?: "left" | "center";
      paragraphGap?: number;
    }
  ) => {
    let y = options.y;
    const paragraphGap = options.paragraphGap ?? 1.5;

    doc.setFontSize(options.fontSize || 12);

    if (options.bold && options.italic) {
      doc.setFont("Times", "bolditalic");
    } else if (options.bold) {
      doc.setFont("Times", "bold");
    } else if (options.italic) {
      doc.setFont("Times", "italic");
    } else {
      doc.setFont("Times", "normal");
    }

    const paragraphs = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const blocks = paragraphs.length > 0 ? paragraphs : [text];

    blocks.forEach((paragraph) => {
      const lines = doc.splitTextToSize(paragraph, options.maxWidth);

      lines.forEach((line: string) => {
        if (y + options.lineHeight > options.bottomLimit) {
          doc.addPage();
          y = getPageMeasurements(doc).marginTop;
        }

        if (options.align === "center") {
          doc.text(line, doc.internal.pageSize.width / 2, y, {
            align: "center",
          });
        } else {
          doc.text(line, options.x, y);
        }

        y += options.lineHeight;
      });

      y += paragraphGap;
    });

    return y;
  };

  const addImageToPDF = async (
    doc: jsPDF,
    image: { mimeType: string; imageBase64: string; imageUrl?: string },
    yStart: number,
    layout: "cover" | "chapter" | "childPage" = "chapter"
  ) => {
    let y = yStart;

    const measurements = getPageMeasurements(doc);
    const { pageWidth, bottomLimit } = measurements;

    const imageWidth =
      layout === "cover"
        ? Math.min(120, measurements.usableWidth)
        : layout === "childPage"
        ? Math.min(178, measurements.usableWidth)
        : Math.min(150, measurements.usableWidth);

    const imageHeight =
      layout === "cover"
        ? imageWidth * 1.5
        : layout === "childPage"
        ? imageWidth * 1.1
        : imageWidth;

    const x = (pageWidth - imageWidth) / 2;

    if (y + imageHeight > bottomLimit) {
      doc.addPage();
      y = measurements.marginTop;
    }

    try {
      const imageSource = await imageToDataUrl(image);

      if (!imageSource) throw new Error("Missing image source.");

      doc.addImage(
        imageSource,
        getImageFormat(image.mimeType),
        x,
        y,
        imageWidth,
        imageHeight
      );

      y += imageHeight + 12;
    } catch {
      doc.setFontSize(10);
      doc.setFont("Times", "italic");
      doc.text(
        "[Image could not be embedded in PDF]",
        measurements.marginLeft,
        y
      );
      y += 10;
    }

    return y;
  };

  const findChapterImage = (chapter: ChapterItem) => {
    return chapterImages.find((image) => {
      const imageChapter = image.chapter.toLowerCase();
      const chapterTitle = chapter.title.toLowerCase();

      return (
        imageChapter.includes(chapterTitle) ||
        chapterTitle.includes(imageChapter)
      );
    });
  };

  const findPageImage = (pageNumber: number) => {
    return pageImages.find((image) => image.pageNumber === pageNumber);
  };

  const getTocPageCount = () => {
    if (!chapters || chapters.chapters.length === 0) return 0;

    const entriesPerPage = publishingSettings.trimSize === "6x9" ? 18 : 24;
    return Math.max(1, Math.ceil(chapters.chapters.length / entriesPerPage));
  };

  const reserveTocPages = (doc: jsPDF) => {
    const tocPageCount = getTocPageCount();
    const tocStartPage = doc.getNumberOfPages() + 1;

    for (let i = 0; i < tocPageCount; i++) {
      doc.addPage();
    }

    return {
      tocStartPage,
      tocPageCount,
    };
  };

  const fillProfessionalTocPDF = (
    doc: jsPDF,
    tocStartPage: number,
    tocEntries: TocEntry[]
  ) => {
    if (!chapters || tocEntries.length === 0) return;

    const entriesPerPage = publishingSettings.trimSize === "6x9" ? 18 : 24;
    const measurements = getPageMeasurements(doc);

    for (let pageIndex = 0; pageIndex < getTocPageCount(); pageIndex++) {
      doc.setPage(tocStartPage + pageIndex);

      let y = measurements.marginTop + 8;

      doc.setFont("Times", "bold");
      doc.setFontSize(19);
      doc.text("Table of Contents", measurements.pageWidth / 2, y, {
        align: "center",
      });

      y += 16;

      doc.setFontSize(10.5);
      doc.setFont("Times", "normal");

      const start = pageIndex * entriesPerPage;
      const end = start + entriesPerPage;
      const pageEntries = tocEntries.slice(start, end);

      pageEntries.forEach((entry) => {
        const leftText = `${entry.label}: ${entry.title}`;
        const pageText = `${entry.page}`;
        const maxChars = publishingSettings.trimSize === "6x9" ? 52 : 78;

        const trimmedLeft =
          leftText.length > maxChars
            ? `${leftText.slice(0, maxChars - 3)}...`
            : leftText;

        doc.text(trimmedLeft, measurements.marginLeft, y);
        doc.text(
          pageText,
          measurements.pageWidth - measurements.marginRight,
          y,
          {
            align: "right",
          }
        );

        const dotsStart =
          measurements.marginLeft + doc.getTextWidth(trimmedLeft) + 2;
        const dotsEnd = measurements.pageWidth - measurements.marginRight - 10;
        let dotX = dotsStart;

        doc.setFontSize(8);
        while (dotX < dotsEnd) {
          doc.text(".", dotX, y);
          dotX += 3;
        }
        doc.setFontSize(10.5);

        y += 8.5;
      });
    }
  };

  const addCopyrightPagePDF = (doc: jsPDF) => {
    if (!frontMatter.includeCopyrightPage) return;

    doc.addPage();

    const measurements = getPageMeasurements(doc);
    const title = getTitle();
    const author = project?.bookData?.authorName || "Anonymous";
    const year = frontMatter.copyrightYear || new Date().getFullYear();
    const publisher =
      frontMatter.publisherName.trim() || "Independent Publisher";
    const isbnText = frontMatter.isbn.trim()
      ? `ISBN: ${frontMatter.isbn}`
      : "ISBN: [Add ISBN Here]";

    let y = measurements.marginTop + 35;

    doc.setFont("Times", "bold");
    doc.setFontSize(15);
    doc.text(title, measurements.pageWidth / 2, y, { align: "center" });

    y += 16;

    doc.setFont("Times", "normal");
    doc.setFontSize(10.5);
    doc.text(`Copyright © ${year} ${author}`, measurements.pageWidth / 2, y, {
      align: "center",
    });
    y += 8;
    doc.text(`Published by ${publisher}`, measurements.pageWidth / 2, y, {
      align: "center",
    });
    y += 8;
    doc.text(isbnText, measurements.pageWidth / 2, y, { align: "center" });

    y += 18;

    const copyrightBody =
      frontMatter.copyrightText.trim() ||
      "All rights reserved. No part of this publication may be reproduced, distributed, or transmitted in any form without prior written permission from the author or publisher, except as permitted by law.";

    addWrappedText(doc, copyrightBody, {
      x: measurements.marginLeft,
      y,
      maxWidth: measurements.usableWidth,
      lineHeight: 6.5,
      bottomLimit: measurements.bottomLimit,
      fontSize: 10,
      align: "center",
      paragraphGap: 2,
    });
  };

const addDedicationPagePDF = (doc: jsPDF) => {
    if (!frontMatter.includeDedicationPage) return;
    if (!frontMatter.dedication.trim()) return;

    doc.addPage();

    const measurements = getPageMeasurements(doc);

    doc.setFont("Times", "bold");
    doc.setFontSize(18);
    doc.text(
      "Dedication",
      measurements.pageWidth / 2,
      measurements.marginTop + 42,
      { align: "center" }
    );

    doc.setFont("Times", "italic");
    doc.setFontSize(12.5);

    addWrappedText(doc, frontMatter.dedication, {
      x: measurements.marginLeft,
      y: measurements.marginTop + 62,
      maxWidth: measurements.usableWidth,
      lineHeight: 7.5,
      bottomLimit: measurements.bottomLimit,
      fontSize: 12.5,
      italic: true,
      align: "center",
      paragraphGap: 2,
    });
  };

  const addTitlePagePDF = async (doc: jsPDF) => {
    const title = getTitle();
    const subtitle = frontMatter.subtitle.trim();
    const author = project?.bookData?.authorName || "Anonymous";
    const measurements = getPageMeasurements(doc);

    let y = measurements.marginTop + 10;

    doc.setFont("Times", "bold");
    doc.setFontSize(publishingSettings.trimSize === "6x9" ? 22 : 27);
    doc.text(title, measurements.pageWidth / 2, y, { align: "center" });
    y += 13;

    if (subtitle) {
      doc.setFont("Times", "italic");
      doc.setFontSize(publishingSettings.trimSize === "6x9" ? 12 : 15);
      doc.text(subtitle, measurements.pageWidth / 2, y, {
        align: "center",
      });
      y += 12;
    }

    doc.setFont("Times", "normal");
    doc.setFontSize(publishingSettings.trimSize === "6x9" ? 11.5 : 14);
    doc.text(`By ${author}`, measurements.pageWidth / 2, y, {
      align: "center",
    });
    y += 16;

    if (coverImage) {
      await addImageToPDF(doc, coverImage, y, "cover");
    }
  };

  const createStandardPDFBlob = async () => {
    if (!project || !chapters) return null;

    const doc = createPdfDocument();
    const measurements = getPageMeasurements(doc);

    const margin = measurements.marginLeft;
    const bottomLimit = measurements.bottomLimit;
    const lineHeight =
      publishingSettings.trimSize === "6x9" ? 7.2 : 8.5;
    const usableWidth = measurements.usableWidth;

    let y = measurements.marginTop;
    const tocEntries: TocEntry[] = [];

    const includeToc =
      frontMatter.includeTableOfContents &&
      getExportBookStyle() !== "children";

    const includeChapterImages =
      planAllowsChapterImages() &&
      (getExportBookStyle() === "illustrated" ||
        getExportBookStyle() === "standard");

    await addTitlePagePDF(doc);
    addCopyrightPagePDF(doc);
    addDedicationPagePDF(doc);

    const tocInfo = includeToc ? reserveTocPages(doc) : null;

    for (const [index, chapter] of chapters.chapters.entries()) {
      doc.addPage();
      y = getPageMeasurements(doc).marginTop;

      const pageNumber = doc.getNumberOfPages();

      tocEntries.push({
        label: `Chapter ${index + 1}`,
        title: chapter.title,
        page: pageNumber,
      });

      doc.setFont("Times", "bold");
      doc.setFontSize(
        publishingSettings.trimSize === "6x9" ? 15 : 18
      );
      doc.text(
        `Chapter ${index + 1}`,
        measurements.pageWidth / 2,
        y,
        { align: "center" }
      );
      y += 11;

      y = addWrappedText(doc, chapter.title, {
        x: margin,
        y,
        maxWidth: usableWidth,
        lineHeight,
        bottomLimit,
        fontSize:
          publishingSettings.trimSize === "6x9" ? 12.5 : 15,
        bold: true,
        align: "center",
        paragraphGap: 3,
      });

      y += 6;

      const matchingImage = includeChapterImages
        ? findChapterImage(chapter)
        : null;

      if (matchingImage) {
        y = await addImageToPDF(doc, matchingImage, y, "chapter");
      }

      if (y > bottomLimit - 40) {
        doc.addPage();
        y = getPageMeasurements(doc).marginTop;
      }

      y = addWrappedText(doc, chapter.content, {
        x: margin,
        y,
        maxWidth: usableWidth,
        lineHeight,
        bottomLimit,
        fontSize:
          publishingSettings.trimSize === "6x9" ? 10.8 : 12,
        paragraphGap: 2.5,
      });
    }

    if (tocInfo) {
      fillProfessionalTocPDF(
        doc,
        tocInfo.tocStartPage,
        tocEntries
      );
    }

    addPageNumbers(doc);

    // ✅ Mark KDP checklist complete
    markExportChecklistReady("pdf");

    return doc.output("blob");
  };

  const createWorkbookPDFBlob = async () => {
    if (!project || !chapters) return null;

    const doc = createPdfDocument();
    const measurements = getPageMeasurements(doc);

    const margin = measurements.marginLeft;
    const bottomLimit = measurements.bottomLimit;
    const usableWidth = measurements.usableWidth;

    const tocEntries: TocEntry[] = [];
    const includeToc = frontMatter.includeTableOfContents;

    let y = measurements.marginTop;

    await addTitlePagePDF(doc);
    addCopyrightPagePDF(doc);
    addDedicationPagePDF(doc);

    const tocInfo = includeToc ? reserveTocPages(doc) : null;

    for (const [index, chapter] of chapters.chapters.entries()) {
      doc.addPage();
      y = getPageMeasurements(doc).marginTop;

      tocEntries.push({
        label: `Section ${index + 1}`,
        title: chapter.title,
        page: doc.getNumberOfPages(),
      });

      doc.setFillColor(245, 245, 245);
      doc.roundedRect(
        margin,
        y,
        usableWidth,
        publishingSettings.trimSize === "6x9" ? 14 : 16,
        3,
        3,
        "F"
      );

      doc.setFont("Times", "bold");
      doc.setFontSize(
        publishingSettings.trimSize === "6x9" ? 12 : 16
      );
      doc.text(
        `Section ${index + 1}: ${chapter.title}`,
        margin + 4,
        y + 9
      );

      y += publishingSettings.trimSize === "6x9" ? 20 : 24;

      y = addWrappedText(doc, chapter.content, {
        x: margin,
        y,
        maxWidth: usableWidth,
        lineHeight:
          publishingSettings.trimSize === "6x9" ? 7.2 : 8.5,
        bottomLimit,
        fontSize:
          publishingSettings.trimSize === "6x9" ? 10.8 : 12,
        paragraphGap: 3,
      });

      y += 6;

      doc.setFont("Times", "bold");
      doc.setFontSize(
        publishingSettings.trimSize === "6x9" ? 11 : 13
      );
      doc.text("Reflection / Notes", margin, y);

      y += 8;

      doc.setDrawColor(180);
      for (let i = 0; i < 5; i++) {
        doc.line(margin, y, margin + usableWidth, y);
        y += publishingSettings.trimSize === "6x9" ? 8 : 10;
      }
    }

    if (tocInfo) {
      fillProfessionalTocPDF(
        doc,
        tocInfo.tocStartPage,
        tocEntries
      );
    }

    addPageNumbers(doc);

    // ✅ Mark KDP checklist complete
    markExportChecklistReady("pdf");

    return doc.output("blob");
  };

  const createChildrenBookPDFBlob = async () => {
    if (!project || !pages || pages.pages.length === 0) {
      return createStandardPDFBlob();
    }

    const doc = createPdfDocument();
    const measurements = getPageMeasurements(doc);

    await addTitlePagePDF(doc);
    addCopyrightPagePDF(doc);
    addDedicationPagePDF(doc);

    for (const page of pages.pages) {
      doc.addPage();

      const pageImage = findPageImage(page.pageNumber);
      let y = measurements.marginTop;

      if (pageImage) {
        y = await addImageToPDF(doc, pageImage, y, "childPage");
      }

      doc.setFont("Times", "bold");
      doc.setFontSize(
        publishingSettings.trimSize === "6x9" ? 13 : 18
      );

      addWrappedText(doc, page.text, {
        x: measurements.marginLeft,
        y,
        maxWidth: measurements.usableWidth,
        lineHeight:
          publishingSettings.trimSize === "6x9" ? 7.2 : 9.5,
        bottomLimit: measurements.bottomLimit,
        bold: true,
        align: "center",
      });
    }

    addPageNumbers(doc);

    markExportChecklistReady("pdf");

    return doc.output("blob");
  };

  const createCoverWrapPDFBlob = async () => {
    const trim = getTrimSizeMM();
    const spineWidth =
      publishingSettings.trimSize === "6x9" ? 12 : 14;

    const bleed = 3.175;
    const fullWidth = trim.width * 2 + spineWidth + bleed * 2;
    const fullHeight = trim.height + bleed * 2;

    const doc = new jsPDF({
      unit: "mm",
      format: [fullWidth, fullHeight],
      orientation: "landscape",
    });

    const title = getTitle();
    const author = project?.bookData?.authorName || "Anonymous";

    const backX = bleed;
    const spineX = bleed + trim.width;
    const frontX = bleed + trim.width + spineWidth;

    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, fullWidth, fullHeight, "F");

    if (coverImage) {
      const imageSource = await imageToDataUrl(coverImage);

      if (imageSource) {
        doc.addImage(
          imageSource,
          getImageFormat(coverImage.mimeType),
          frontX,
          bleed,
          trim.width,
          trim.height
        );
      }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont("Times", "bold");
    doc.setFontSize(18);

    doc.text(
      title,
      frontX + trim.width / 2,
      bleed + 20,
      { align: "center" }
    );

    doc.text(
      publishingSettings.spineText || title,
      spineX + spineWidth / 2,
      bleed + trim.height / 2,
      {
        angle: 90,
        align: "center",
      }
    );

    // ✅ Mark checklist
    markExportChecklistReady("cover");

    return doc.output("blob");
  }
  
const createPDFBlob = async () => {
    const style = getExportBookStyle();

    if (style === "children" && pages && pages.pages.length > 0) {
      return await createChildrenBookPDFBlob();
    }

    if (style === "workbook") {
      return await createWorkbookPDFBlob();
    }

    return await createStandardPDFBlob();
  };

  const createDOCXBlob = async () => {
    if (!project || !chapters) return null;

    const title = getTitle();
    const author = project.bookData?.authorName || "Anonymous";
    const style = getExportBookStyle();

    const frontMatterParagraphs: Paragraph[] = [];

    if (frontMatter.subtitle.trim()) {
      frontMatterParagraphs.push(
        new Paragraph({
          text: frontMatter.subtitle,
        })
      );
    }

    if (frontMatter.includeCopyrightPage) {
      frontMatterParagraphs.push(
        new Paragraph({
          text: "Copyright",
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          text: `Copyright © ${
            frontMatter.copyrightYear || new Date().getFullYear()
          } ${author}`,
        }),
        new Paragraph({
          text: `Publisher: ${
            frontMatter.publisherName.trim() || "Independent Publisher"
          }`,
        }),
        new Paragraph({
          text: frontMatter.isbn.trim()
            ? `ISBN: ${frontMatter.isbn}`
            : "ISBN: [Add ISBN Here]",
        }),
        new Paragraph({
          text:
            frontMatter.copyrightText.trim() ||
            "All rights reserved. No part of this publication may be reproduced, distributed, or transmitted in any form without prior written permission from the author or publisher, except as permitted by law.",
        })
      );
    }

    if (frontMatter.includeDedicationPage && frontMatter.dedication.trim()) {
      frontMatterParagraphs.push(
        new Paragraph({
          text: "Dedication",
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          text: frontMatter.dedication,
        })
      );
    }

    const tocBlock =
      style === "children" || !frontMatter.includeTableOfContents
        ? []
        : [
            new Paragraph({
              text: "Table of Contents",
              heading: HeadingLevel.HEADING_1,
            }),
            new TableOfContents("Contents", {
              hyperlink: true,
              headingStyleRange: "1-3",
            }),
          ];

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: title,
              heading: HeadingLevel.TITLE,
            }),
            new Paragraph({
              text: `By ${author}`,
            }),
            ...frontMatterParagraphs,
            ...tocBlock,
            new Paragraph({
              text:
                style === "children" && pages
                  ? "Children’s book export note: PDF export uses page-by-page layout with illustrations above the page text."
                  : style === "workbook"
                  ? "Workbook export note: PDF export uses section formatting with reflection/note areas."
                  : planAllowsChapterImages()
                  ? "Illustrated export note: chapter images are available in the PDF export."
                  : "Starter export note: cover image is available in the PDF export. Chapter/page images require Enhanced or Premium.",
            }),
            ...(style === "children" && pages
              ? pages.pages.flatMap((page) => [
                  new Paragraph({
                    text: `Page ${page.pageNumber}`,
                    heading: HeadingLevel.HEADING_1,
                  }),
                  new Paragraph({
                    children: [new TextRun(page.text)],
                  }),
                  new Paragraph({
                    children: [new TextRun(`Image Prompt: ${page.prompt}`)],
                  }),
                ])
              : chapters.chapters.flatMap((chapter, index) => [
                  new Paragraph({
                    text:
                      style === "workbook"
                        ? `Section ${index + 1}: ${chapter.title}`
                        : `Chapter ${index + 1}: ${chapter.title}`,
                    heading: HeadingLevel.HEADING_1,
                  }),
                  ...chapter.content
                    .split("\n")
                    .filter((line) => line.trim() !== "")
                    .map(
                      (line) =>
                        new Paragraph({
                          children: [new TextRun(line)],
                        })
                    ),
                ])),
          ],
        },
      ],
    });

    return await Packer.toBlob(doc);
  };

  const handleExportPDF = async () => {
    if (!project || !chapters) return;

    try {
      setExportLoading(true);

      const blob = await createPDFBlob();
      if (!blob) return;

      markExportChecklistReady("pdf");
      saveAs(blob, `${sanitizeFilename(getTitle())}.pdf`);
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportDOCX = async () => {
    if (!project || !chapters) return;

    try {
      setExportLoading(true);

      const blob = await createDOCXBlob();
      if (!blob) return;

      saveAs(blob, `${sanitizeFilename(getTitle())}.docx`);
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportCoverWrap = async () => {
    if (!project) return;

    try {
      setCoverWrapLoading(true);

      const blob = await createCoverWrapPDFBlob();
      if (!blob) return;

      markExportChecklistReady("cover");
      saveAs(blob, `${sanitizeFilename(getTitle())}-full-cover-wrap.pdf`);
    } finally {
      setCoverWrapLoading(false);
    }
  };

  const handleExportZIP = async () => {
    if (!project || !chapters) return;

    try {
      setZipLoading(true);

      const title = getTitle();
      const safeTitle = sanitizeFilename(title);
      const zip = new JSZip();

      const manuscriptFolder = zip.folder("manuscript");
      const imagesFolder = zip.folder("images");
      const assetsFolder = zip.folder("assets");
      const publishingFolder = zip.folder("publishing");
      const kdpFolder = zip.folder("kdp-upload-guide");

      const pdfBlob = await createPDFBlob();
      if (pdfBlob) {
        manuscriptFolder?.file(`${safeTitle}.pdf`, pdfBlob);
      }

      const docxBlob = await createDOCXBlob();
      if (docxBlob) {
        manuscriptFolder?.file(`${safeTitle}.docx`, docxBlob);
      }

      if (publishingSettings.includeCoverWrapInZip) {
        const coverWrapBlob = await createCoverWrapPDFBlob();
        if (coverWrapBlob) {
          publishingFolder?.file(
            `${safeTitle}-full-cover-wrap.pdf`,
            coverWrapBlob
          );
        }
      }

      if (coverImage?.imageBase64) {
        imagesFolder?.file(
          `cover.${getImageExtension(coverImage.mimeType)}`,
          base64ToBlob(coverImage.imageBase64, coverImage.mimeType)
        );
      }

      if (planAllowsChapterImages()) {
        chapterImages.forEach((image, index) => {
          if (!image.imageBase64) return;

          imagesFolder?.file(
            `chapter-${index + 1}.${getImageExtension(image.mimeType)}`,
            base64ToBlob(image.imageBase64, image.mimeType)
          );
        });
      }

      if (isChildrenBook()) {
        pageImages.forEach((image) => {
          if (!image.imageBase64) return;

          imagesFolder?.file(
            `page-${image.pageNumber}.${getImageExtension(image.mimeType)}`,
            base64ToBlob(image.imageBase64, image.mimeType)
          );
        });
      }

      assetsFolder?.file(
        "front-matter.json",
        JSON.stringify(frontMatter, null, 2)
      );

      assetsFolder?.file(
        "publishing-settings.json",
        JSON.stringify(publishingSettings, null, 2)
      );

      assetsFolder?.file(
        "kdp-automation.json",
        JSON.stringify(kdpAutomation, null, 2)
      );

      kdpFolder?.file(
        "kdp-upload-checklist.txt",
        `KDP UPLOAD CHECKLIST

TITLE:
${title}

SUBTITLE:
${frontMatter.subtitle || "No subtitle provided."}

AUTHOR:
${project.bookData?.authorName || "Anonymous"}

DESCRIPTION:
${kdpAutomation.bookDescription || "No description generated yet."}

KEYWORDS:
${
  kdpAutomation.keywords.length > 0
    ? kdpAutomation.keywords.map((keyword, i) => `${i + 1}. ${keyword}`).join("\n")
    : "No keywords generated yet."
}

CATEGORIES:
${
  kdpAutomation.categories.length > 0
    ? kdpAutomation.categories
        .map((category, i) => `${i + 1}. ${category}`)
        .join("\n")
    : "No categories selected yet."
}

PRINT SETTINGS:
Trim Size: ${publishingSettings.trimSize}
Interior: ${kdpAutomation.interiorType}
Paper: ${kdpAutomation.paperType}
Bleed: ${kdpAutomation.bleed}

UPLOAD FILES:
Interior PDF: manuscript/${safeTitle}.pdf
Cover Wrap PDF: publishing/${safeTitle}-full-cover-wrap.pdf

KDP STEPS:
1. Go to https://kdp.amazon.com
2. Create Paperback
3. Enter book details
4. Paste description
5. Add keywords
6. Choose categories
7. Select matching trim size
8. Upload interior PDF
9. Upload cover wrap PDF
10. Launch Previewer
11. Set pricing
12. Publish
`
      );

      assetsFolder?.file(
        "prompts.txt",
        `TITLE:
${title}

SUBTITLE:
${frontMatter.subtitle || "No subtitle provided."}

AUTHOR:
${project.bookData?.authorName || "Anonymous"}

EXPORT STYLE:
${getExportModeLabel()}

PRINT FORMAT:
${publishingSettings.printFormat}

TRIM SIZE:
${publishingSettings.trimSize}

ISBN:
${frontMatter.isbn || "[Add ISBN Here]"}

COPYRIGHT YEAR:
${frontMatter.copyrightYear}

PUBLISHER:
${frontMatter.publisherName || "Independent Publisher"}

DEDICATION:
${frontMatter.dedication || "No dedication provided."}

KDP DESCRIPTION:
${kdpAutomation.bookDescription || "No KDP description generated yet."}

KDP KEYWORDS:
${kdpAutomation.keywords.join(", ") || "No KDP keywords generated yet."}

KDP CATEGORIES:
${kdpAutomation.categories.join(", ") || "No KDP categories selected yet."}

BACK COVER BLURB:
${publishingSettings.backCoverBlurb}

BACK COVER AUTHOR BIO:
${publishingSettings.backCoverAuthorBio || "No author bio provided."}

COVER PROMPT:
${coverImage?.prompt || "No cover prompt available."}

CHAPTER IMAGE PROMPTS:
${
  chapterImages.length > 0
    ? chapterImages
        .map(
          (img, index) => `${index + 1}. ${img.chapter}

${img.prompt}`
        )
        .join("\n\n")
    : "No chapter image prompts available."
}

CHILDREN'S PAGE PROMPTS:
${
  pages && pages.pages.length > 0
    ? pages.pages
        .map(
          (page) => `Page ${page.pageNumber}

Text:
${page.text}

Prompt:
${page.prompt}`
        )
        .join("\n\n")
    : "No children's page prompts available."
}
`
      );

      const summary = {
        projectId: project.id,
        title,
        author: project.bookData?.authorName || "Anonymous",
        packageName: project.packageName,
        packagePlan: project.packagePlan,
        packagePrice: project.packagePrice,
        status: project.status,
        createdAt: project.createdAt,
        exportedAt: new Date().toISOString(),
        selectedExportStyle,
        resolvedExportMode: getExportBookStyle(),
        exportModeLabel: getExportModeLabel(),
        frontMatter,
        publishingSettings,
        kdpAutomation,
        kdpReady: isKDPReady(),
        kdpIssues: getKDPReadyIssues(),
        bookData: project.bookData,
        chapters: chapters.chapters.map((chapter, index) => ({
          number: index + 1,
          title: chapter.title,
          hasChapterImage: !!findChapterImage(chapter),
        })),
        pages:
          pages?.pages.map((page) => ({
            pageNumber: page.pageNumber,
            text: page.text,
            hasPageImage: !!findPageImage(page.pageNumber),
          })) || [],
        includedFolders: {
          manuscript: ["PDF", "DOCX"],
          publishing: publishingSettings.includeCoverWrapInZip
            ? ["full-cover-wrap.pdf"]
            : [],
          kdpUploadGuide: ["kdp-upload-checklist.txt"],
          images: {
            coverImage: !!coverImage,
            chapterImages: planAllowsChapterImages() ? chapterImages.length : 0,
            pageImages: isChildrenBook() ? pageImages.length : 0,
          },
          assets: [
            "prompts.txt",
            "front-matter.json",
            "publishing-settings.json",
            "kdp-automation.json",
          ],
        },
      };

      zip.file("project-summary.json", JSON.stringify(summary, null, 2));

      markExportChecklistReady("pdf");

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const filePath = `${project.id}/${safeTitle}-publisher-ready-package.zip`;

      const { error } = await supabase.storage
        .from("book-exports")
        .upload(filePath, zipBlob, {
          contentType: "application/zip",
          upsert: true,
        });

      if (error) {
        console.error("ZIP upload failed:", error);
        setSaveMessage(
          "ZIP created, but cloud upload failed. Local download started."
        );
      } else {
        const { data } = supabase.storage
          .from("book-exports")
          .getPublicUrl(filePath);

        const publicUrl = data.publicUrl;
        localStorage.setItem(`zip_${project.id}`, publicUrl);
        setZipUrl(publicUrl);
        setSaveMessage(
          "Publisher-ready ZIP package created, uploaded, and downloaded."
        );
      }

      saveAs(zipBlob, `${safeTitle}-publisher-ready-package.zip`);
    } catch (error) {
      console.error("ZIP export error:", error);
      setSaveMessage(
        error instanceof Error ? error.message : "Unable to create ZIP package."
      );
    } finally {
      setZipLoading(false);
    }
  };

  if (!project) {
    return (
      <main className="min-h-screen bg-black text-white px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <p>Project not found.</p>
        </div>
      </main>
    );
  }

  const title = getTitle();
  const canExportChapterImages = planAllowsChapterImages();
  const childrenBookMode = isChildrenBook() && !!pages;
  const kdpIssues = getKDPReadyIssues();

  return (
    <main className="min-h-screen bg-black text-white px-6 py-16">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Link
            href={`/projects/${project.id}`}
            className="border border-gray-600 px-5 py-3 rounded-lg font-semibold hover:bg-white hover:text-black transition text-center"
          >
            Back to Project
          </Link>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={saveEditedManuscript}
              disabled={!chapters || childrenBookMode}
              className="bg-yellow-400 text-black px-5 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition disabled:opacity-50"
            >
              Save Edits
            </button>

            <button
              onClick={handleExportPDF}
              disabled={!chapters || exportLoading}
              className="bg-white text-black px-5 py-3 rounded-lg font-semibold hover:bg-gray-200 transition disabled:opacity-50"
            >
              {exportLoading ? "Preparing..." : "Download PDF"}
            </button>

            <button
              onClick={handleExportDOCX}
              disabled={!chapters || exportLoading}
              className="border border-gray-500 px-5 py-3 rounded-lg font-semibold hover:bg-white hover:text-black transition disabled:opacity-50"
            >
              Download DOCX
            </button>

            <button
              onClick={handleExportCoverWrap}
              disabled={coverWrapLoading}
              className="border border-blue-400 text-blue-300 px-5 py-3 rounded-lg font-semibold hover:bg-blue-400 hover:text-black transition disabled:opacity-50"
            >
              {coverWrapLoading ? "Preparing Cover..." : "Download Cover Wrap"}
            </button>

            <button
              onClick={handleExportZIP}
              disabled={!chapters || zipLoading}
              className="border border-yellow-400 text-yellow-300 px-5 py-3 rounded-lg font-semibold hover:bg-yellow-400 hover:text-black transition disabled:opacity-50"
            >
              {zipLoading
                ? "Preparing Package..."
                : "Download Publisher-Ready Package"}
            </button>

            <button
              onClick={openKDPGuide}
              className="bg-green-500 text-white px-5 py-3 rounded-lg font-semibold hover:bg-green-400 transition"
            >
              Publish to Amazon KDP
            </button>

            {zipUrl && (
              <a
                href={zipUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-yellow-400 text-black px-5 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition text-center"
              >
                Download Saved Package
              </a>
            )}
          </div>
        </div>

        {saveMessage && (
          <div className="mb-8 rounded-lg border border-green-500/40 bg-green-500/10 p-4 text-sm text-green-200">
            {saveMessage}
          </div>
        )}

        <div className="mb-8 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5 text-sm text-yellow-100">
          <p className="font-semibold mb-2">Export Settings</p>

          <label className="block text-sm font-semibold mb-2">
            Book Style Selector
          </label>

          <select
            value={selectedExportStyle}
            onChange={(event) =>
              handleExportStyleChange(event.target.value as ExportBookStyle)
            }
            className="w-full md:w-auto bg-black text-white border border-yellow-500/40 rounded-lg px-4 py-3 mb-4"
          >
            <option value="auto">Auto Detect</option>
            <option value="children">Children’s Book</option>
            <option value="standard">Standard Book</option>
            <option value="illustrated">Illustrated Book</option>
            <option value="workbook">Workbook / Handbook</option>
          </select>

          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <select
              value={publishingSettings.printFormat}
              onChange={(e) =>
                updatePublishingSettings(
                  "printFormat",
                  e.target.value as PrintFormat
                )
              }
              className="bg-black text-white border border-blue-500/40 rounded-lg px-4 py-3"
            >
              <option value="digital">Digital PDF</option>
              <option value="kdp">KDP / Paperback Print</option>
            </select>

            <select
              value={publishingSettings.trimSize}
              onChange={(e) =>
                updatePublishingSettings("trimSize", e.target.value as TrimSize)
              }
              className="bg-black text-white border border-blue-500/40 rounded-lg px-4 py-3"
            >
              <option value="6x9">6 x 9 Paperback</option>
              <option value="8.5x11">8.5 x 11 Workbook / Large Format</option>
            </select>

            <input
              value={frontMatter.subtitle}
              onChange={(e) => updateFrontMatter("subtitle", e.target.value)}
              placeholder="Subtitle"
              className="bg-black text-white border border-yellow-500/30 rounded-lg px-4 py-3"
            />

            <input
              value={frontMatter.isbn}
              onChange={(e) => updateFrontMatter("isbn", e.target.value)}
              placeholder="ISBN placeholder"
              className="bg-black text-white border border-yellow-500/30 rounded-lg px-4 py-3"
            />

            <input
              value={frontMatter.copyrightYear}
              onChange={(e) =>
                updateFrontMatter("copyrightYear", e.target.value)
              }
              placeholder="Copyright year"
              className="bg-black text-white border border-yellow-500/30 rounded-lg px-4 py-3"
            />

            <input
              value={frontMatter.publisherName}
              onChange={(e) =>
                updateFrontMatter("publisherName", e.target.value)
              }
              placeholder="Publisher name"
              className="bg-black text-white border border-yellow-500/30 rounded-lg px-4 py-3"
            />

            <input
              value={publishingSettings.spineText}
              onChange={(e) =>
                updatePublishingSettings("spineText", e.target.value)
              }
              placeholder="Spine text"
              className="bg-black text-white border border-blue-500/40 rounded-lg px-4 py-3"
            />
          </div>

          <textarea
            value={frontMatter.dedication}
            onChange={(e) => updateFrontMatter("dedication", e.target.value)}
            placeholder="Dedication page text"
            className="w-full mt-4 bg-black text-white border border-yellow-500/30 rounded-lg px-4 py-3 min-h-[90px]"
          />

          <textarea
            value={frontMatter.copyrightText}
            onChange={(e) =>
              updateFrontMatter("copyrightText", e.target.value)
            }
            placeholder="Custom copyright notice"
            className="w-full mt-4 bg-black text-white border border-yellow-500/30 rounded-lg px-4 py-3 min-h-[90px]"
          />

          <textarea
            value={publishingSettings.backCoverBlurb}
            onChange={(e) =>
              updatePublishingSettings("backCoverBlurb", e.target.value)
            }
            placeholder="Back cover blurb"
            className="w-full mt-4 bg-black text-white border border-blue-500/40 rounded-lg px-4 py-3 min-h-[120px]"
          />

          <textarea
            value={publishingSettings.backCoverAuthorBio}
            onChange={(e) =>
              updatePublishingSettings("backCoverAuthorBio", e.target.value)
            }
            placeholder="Back cover author bio"
            className="w-full mt-4 bg-black text-white border border-blue-500/40 rounded-lg px-4 py-3 min-h-[90px]"
          />

          <div className="grid gap-3 md:grid-cols-4 mt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={frontMatter.includeCopyrightPage}
                onChange={(e) =>
                  updateFrontMatter("includeCopyrightPage", e.target.checked)
                }
              />
              Copyright Page
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={frontMatter.includeDedicationPage}
                onChange={(e) =>
                  updateFrontMatter("includeDedicationPage", e.target.checked)
                }
              />
              Dedication Page
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={frontMatter.includeTableOfContents}
                onChange={(e) =>
                  updateFrontMatter("includeTableOfContents", e.target.checked)
                }
              />
              Table of Contents
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={publishingSettings.includeCoverWrapInZip}
                onChange={(e) =>
                  updatePublishingSettings(
                    "includeCoverWrapInZip",
                    e.target.checked
                  )
                }
              />
              Cover Wrap in ZIP
            </label>
          </div>

          <div className="mt-6 rounded-xl border border-green-500/40 bg-green-500/10 p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div>
                <p className="font-semibold text-green-200">
                  KDP Automation Tools
                </p>
                <p className="text-green-100 text-xs">
                  Generate book description, keywords, categories, and track
                  publishing readiness.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={generateKDPDescription}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-400 transition"
                >
                  Generate Description
                </button>

                <button
                  onClick={generateKDPKeywords}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-400 transition"
                >
                  Generate Keywords
                </button>

                <button
                  onClick={generateKDPCategories}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-400 transition"
                >
                  Suggest Categories
                </button>
              </div>
            </div>

            <textarea
              value={kdpAutomation.bookDescription}
              onChange={(e) =>
                updateKdpAutomation("bookDescription", e.target.value)
              }
              placeholder="KDP book description"
              className="w-full bg-black text-white border border-green-500/40 rounded-lg px-4 py-3 min-h-[140px]"
            />

            <div className="grid gap-4 md:grid-cols-2 mt-4">
              <textarea
                value={kdpAutomation.keywords.join("\n")}
                onChange={(e) =>
                  updateKdpAutomation(
                    "keywords",
                    e.target.value
                      .split("\n")
                      .map((item) => item.trim())
                      .filter(Boolean)
                  )
                }
                placeholder="KDP keywords, one per line"
                className="w-full bg-black text-white border border-green-500/40 rounded-lg px-4 py-3 min-h-[110px]"
              />

              <textarea
                value={kdpAutomation.categories.join("\n")}
                onChange={(e) =>
                  updateKdpAutomation(
                    "categories",
                    e.target.value
                      .split("\n")
                      .map((item) => item.trim())
                      .filter(Boolean)
                  )
                }
                placeholder="KDP categories, one per line"
                className="w-full bg-black text-white border border-green-500/40 rounded-lg px-4 py-3 min-h-[110px]"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-4 mt-4">
              <select
                value={kdpAutomation.interiorType}
                onChange={(e) =>
                  updateKdpAutomation(
                    "interiorType",
                    e.target.value as KDPAutomation["interiorType"]
                  )
                }
                className="bg-black text-white border border-green-500/40 rounded-lg px-4 py-3"
              >
                <option value="black-white">Black & White Interior</option>
                <option value="color">Color Interior</option>
              </select>

              <select
                value={kdpAutomation.paperType}
                onChange={(e) =>
                  updateKdpAutomation(
                    "paperType",
                    e.target.value as KDPAutomation["paperType"]
                  )
                }
                className="bg-black text-white border border-green-500/40 rounded-lg px-4 py-3"
              >
                <option value="white">White Paper</option>
                <option value="cream">Cream Paper</option>
              </select>

              <select
                value={kdpAutomation.bleed}
                onChange={(e) =>
                  updateKdpAutomation(
                    "bleed",
                    e.target.value as KDPAutomation["bleed"]
                  )
                }
                className="bg-black text-white border border-green-500/40 rounded-lg px-4 py-3"
              >
                <option value="no-bleed">No Bleed</option>
                <option value="bleed">Bleed</option>
              </select>

              <input
                value={kdpAutomation.targetAgeRange}
                onChange={(e) =>
                  updateKdpAutomation("targetAgeRange", e.target.value)
                }
                placeholder="Age range, optional"
                className="bg-black text-white border border-green-500/40 rounded-lg px-4 py-3"
              />
            </div>

            <div className="mt-4">
              <p className="font-semibold mb-2">
                KDP Readiness:{" "}
                <span className={isKDPReady() ? "text-green-300" : "text-yellow-300"}>
                  {isKDPReady() ? "Ready" : "Needs Review"}
                </span>
              </p>

              {kdpIssues.length > 0 && (
                <ul className="list-disc ml-5 text-yellow-100 text-xs space-y-1">
                  {kdpIssues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-1">
            <p>
              Current plan:{" "}
              <span className="font-semibold">{project.packageName}</span>
            </p>

            <p>
              PDF mode:{" "}
              <span className="font-semibold">{getExportModeLabel()}</span>
            </p>

            <p>
              Print format:{" "}
              <span className="font-semibold">
                {publishingSettings.printFormat === "kdp"
                  ? `KDP / ${publishingSettings.trimSize}`
                  : "Digital PDF"}
              </span>
            </p>

            <p>
              Table of Contents:{" "}
              <span className="font-semibold">
                {getExportBookStyle() === "children"
                  ? "Skipped for children’s page layout"
                  : frontMatter.includeTableOfContents
                  ? "Included automatically with tracked page numbers"
                  : "Disabled"}
              </span>
            </p>
          </div>
        </div>

        <section className="bg-white text-black rounded-2xl p-8 md:p-12">
          <div className="text-center border-b border-gray-300 pb-10 mb-10">
            <p className="text-sm uppercase tracking-[0.3em] text-gray-500 mb-4">
              Editable Manuscript
            </p>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">{title}</h1>

            {frontMatter.subtitle && (
              <p className="text-xl text-gray-600 mb-4">
                {frontMatter.subtitle}
              </p>
            )}

            <p className="text-gray-700">
              By {project.bookData?.authorName || "Anonymous"}
            </p>
          </div>

          {childrenBookMode && pages ? (
            <div className="space-y-8">
              {pages.pages.map((page) => {
                const matchingImage = findPageImage(page.pageNumber);

                return (
                  <div
                    key={page.pageNumber}
                    className="border border-gray-300 rounded-xl p-6"
                  >
                    <p className="text-sm font-semibold text-gray-600 mb-2">
                      Page {page.pageNumber}
                    </p>

                    {matchingImage && (
                      <div className="w-full aspect-[4/5] overflow-hidden rounded-xl border border-gray-300 bg-black mb-5">
                        <img
                          src={getImageSource(matchingImage)}
                          alt={`Page ${page.pageNumber}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <p className="text-xl leading-8 text-center font-semibold">
                      {page.text}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : !chapters ? (
            <p className="text-center text-gray-600">
              No chapters available. Return to the project page and generate AI
              chapters first.
            </p>
          ) : (
            <div className="space-y-12">
              {chapters.chapters.map((chapter, index) => (
                <div
                  key={index}
                  className="border border-gray-300 rounded-xl p-6"
                >
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    Chapter {index + 1} Title
                  </label>

                  <input
                    value={chapter.title}
                    onChange={(e) => updateChapterTitle(index, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-xl font-bold mb-5"
                  />

                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    Chapter {index + 1} Content
                  </label>

                  <textarea
                    value={chapter.content}
                    onChange={(e) =>
                      updateChapterContent(index, e.target.value)
                    }
                    className="w-full min-h-[420px] border border-gray-300 rounded-lg px-4 py-4 leading-7"
                  />

                  {canExportChapterImages &&
                    chapterImages.find((image) => {
                      const imageChapter = image.chapter.toLowerCase();
                      const chapterTitle = chapter.title.toLowerCase();
                      return (
                        imageChapter.includes(chapterTitle) ||
                        chapterTitle.includes(imageChapter)
                      );
                    }) && (
                      <div className="mt-5 rounded-lg border border-yellow-400/40 bg-yellow-100 p-3 text-sm text-yellow-900">
                        Chapter image available for PDF and publisher package
                        export.
                      </div>
                    )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {showKDPGuide && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 p-6">
          <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 text-black">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-bold">
                  Publish Your Book to Amazon KDP
                </h2>
                <p className="text-gray-700 mt-2">
                  Follow this guided checklist after downloading your PDF,
                  cover wrap, and publisher-ready package.
                </p>
              </div>

              <button
                onClick={() => setShowKDPGuide(false)}
                className="rounded-lg bg-black px-4 py-2 text-white"
              >
                Close
              </button>
            </div>

            <div className="mb-6 rounded-xl border border-yellow-400 bg-yellow-100 p-4">
              <p className="font-semibold">KDP Readiness</p>
              <p className="text-sm">
                {isKDPReady()
                  ? "Your book appears ready for KDP upload."
                  : "Some items still need review before upload."}
              </p>

              {kdpIssues.length > 0 && (
                <ul className="list-disc ml-5 mt-2 text-sm">
                  {kdpIssues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 mb-8">
              <div className="rounded-xl border border-gray-300 p-4">
                <p className="font-semibold mb-2">Book Details</p>
                <p>Title: {getTitle()}</p>
                <p>Subtitle: {frontMatter.subtitle || "None"}</p>
                <p>Author: {project.bookData?.authorName || "Anonymous"}</p>
                <p>Language: {kdpAutomation.language}</p>
              </div>

              <div className="rounded-xl border border-gray-300 p-4">
                <p className="font-semibold mb-2">Print Settings</p>
                <p>Trim Size: {publishingSettings.trimSize}</p>
                <p>Interior: {kdpAutomation.interiorType}</p>
                <p>Paper: {kdpAutomation.paperType}</p>
                <p>Bleed: {kdpAutomation.bleed}</p>
              </div>
            </div>

            <div className="space-y-5 text-sm">
              {[
                ["manuscriptPdf", "Download and upload the interior PDF."],
                ["coverWrapPdf", "Download and upload the full cover wrap PDF."],
                ["titleSubtitle", "Enter title and subtitle exactly as shown."],
                ["authorName", "Enter author name."],
                ["description", "Paste your generated book description."],
                ["keywords", "Paste your 7 KDP keywords."],
                ["categories", "Select your suggested KDP categories."],
                ["isbn", "Enter your ISBN or choose KDP free ISBN."],
                ["trimSize", "Choose the matching trim size."],
                ["previewer", "Launch KDP Previewer and approve files."],
                ["pricing", "Set paperback price and royalty options."],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={
                      kdpAutomation.checklist[
                        key as keyof KDPAutomation["checklist"]
                      ]
                    }
                    onChange={(e) =>
                      updateKdpChecklist(
                        key as keyof KDPAutomation["checklist"],
                        e.target.checked
                      )
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            <div className="mt-8 rounded-xl border border-gray-300 p-4">
              <p className="font-semibold mb-2">KDP Upload Steps</p>
              <ol className="list-decimal ml-5 space-y-2 text-sm">
                <li>Go to https://kdp.amazon.com.</li>
                <li>Click Create, then choose Paperback.</li>
                <li>Enter title, subtitle, author, and description.</li>
                <li>Add keywords and categories.</li>
                <li>Select trim size: {publishingSettings.trimSize}.</li>
                <li>Upload interior PDF.</li>
                <li>Upload full cover wrap PDF.</li>
                <li>Launch Previewer and check every page.</li>
                <li>Set pricing.</li>
                <li>Click Publish Your Paperback Book.</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}  