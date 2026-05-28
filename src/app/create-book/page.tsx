"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getUser";

function CreateBookContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const isESA = searchParams.get("esa") === "true";

  const [bookType, setBookType] = useState("");
  const [topic, setTopic] = useState("");
  const [pageCount, setPageCount] = useState("");
  const [tone, setTone] = useState("");
  const [audience, setAudience] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [imagesNeeded, setImagesNeeded] = useState("");
  const [extraInstructions, setExtraInstructions] = useState("");
  const [extraInstructionSelections, setExtraInstructionSelections] = useState<
    string[]
  >([]);
  const [customExtraInstructions, setCustomExtraInstructions] = useState("");
  const [message, setMessage] = useState("");
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const bookTypes = [
    "Children's Book",
    "Educational Workbook",
    "Story / Fiction",
    "Nonfiction",
    "Activity Book",
    "Coloring Book",
    "Self Help",
    "Devotional",
    "Business Book",
    "Poetry",
    "Comic / Graphic Story",
    "Course / Training Book",
    "Custom",
  ];

  const toneOptions = [
    "Educational",
    "Fun",
    "Inspirational",
    "Professional",
    "Faith Based",
    "Playful",
    "Adventure",
    "Humorous",
    "Urban",
    "Motivational",
    "Serious",
    "Storytelling",
  ];

  const guidedInstructionGroups = [
    {
      title: "Main Character Ideas",
      options: [
        "Use one main character throughout the whole book.",
        "Keep all characters visually consistent from page to page.",
        "Make the main character brave, kind, and curious.",
        "Make the main character learn an important lesson.",
        "Include a best friend or helper character.",
        "Include a parent, teacher, grandparent, or mentor.",
        "Include an animal companion.",
      ],
    },
    {
      title: "Character Appearance",
      options: [
        "Describe the main character clearly before generating images.",
        "Keep the same hairstyle, clothing, skin tone, and facial features in every image.",
        "Use bright, friendly children’s book character designs.",
        "Use expressive faces that show emotion clearly.",
        "Make the characters look age-appropriate for children.",
      ],
    },
    {
      title: "Story Themes",
      options: [
        "Teach kindness and respect.",
        "Teach confidence and self-belief.",
        "Teach patience and listening.",
        "Teach family love and togetherness.",
        "Teach courage and overcoming fear.",
        "Teach responsibility and making good choices.",
        "Teach friendship and teamwork.",
        "Teach gratitude and thankfulness.",
      ],
    },
    {
      title: "Story Setting",
      options: [
        "Set the story at home.",
        "Set the story at school.",
        "Set the story at a park or playground.",
        "Set the story in nature.",
        "Set the story in a neighborhood.",
        "Set the story in a magical or imaginative world.",
        "Use peaceful, colorful backgrounds.",
      ],
    },
    {
      title: "Book Style",
      options: [
        "Make the story simple enough for young children.",
        "Use short sentences on each page.",
        "Make every page easy to understand.",
        "Make the story warm, emotional, and inspiring.",
        "Make the book fun and playful.",
        "Make the ending positive and memorable.",
        "Add gentle humor where appropriate.",
      ],
    },
    {
      title: "Illustration Direction",
      options: [
        "Create illustrations for every page.",
        "Use a consistent art style across the whole book.",
        "Make images colorful, polished, and child-friendly.",
        "Avoid scary, dark, or confusing images.",
        "Make each image match the words on that page.",
        "Do not include text inside the images.",
      ],
    },
  ];

  useEffect(() => {
    const savedForm = localStorage.getItem("writeNowBookForm");

    if (!savedForm) return;

    try {
      const parsed = JSON.parse(savedForm);

      setBookType(parsed.bookType || "");
      setTopic(parsed.topic || "");
      setPageCount(parsed.pageCount || "");
      setTone(parsed.tone || "");
      setAudience(parsed.audience || "");
      setAuthorName(parsed.authorName || "");
      setImagesNeeded(parsed.imagesNeeded || "");
      setExtraInstructions(parsed.extraInstructions || "");
      setExtraInstructionSelections(parsed.extraInstructionSelections || []);
      setCustomExtraInstructions(parsed.customExtraInstructions || "");
    } catch (error) {
      console.error("Unable to restore saved form:", error);
    }
  }, []);

  const toggleTone = (selectedTone: string) => {
    const currentTones = tone ? tone.split(", ").filter(Boolean) : [];

    const updatedTones = currentTones.includes(selectedTone)
      ? currentTones.filter((item) => item !== selectedTone)
      : [...currentTones, selectedTone];

    setTone(updatedTones.join(", "));
  };

  const toggleExtraInstruction = (option: string) => {
    setExtraInstructionSelections((current) =>
      current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option]
    );
  };

  const buildFinalExtraInstructions = () => {
    const sections: string[] = [];

    if (extraInstructionSelections.length > 0) {
      sections.push(
        `Guided selections:\n${extraInstructionSelections
          .map((item) => `- ${item}`)
          .join("\n")}`
      );
    }

    if (customExtraInstructions.trim()) {
      sections.push(`Custom instructions:\n${customExtraInstructions.trim()}`);
    }

    if (!sections.length && extraInstructions.trim()) {
      sections.push(extraInstructions.trim());
    }

    return sections.join("\n\n").trim();
  };

  const normalizePackagePlan = (packageChoice: string) => {
    const cleanChoice = String(packageChoice || "").toLowerCase();

    if (cleanChoice.includes("starter")) return "starter";
    if (cleanChoice.includes("enhanced")) return "enhanced";
    if (
      cleanChoice.includes("premium") ||
      cleanChoice.includes("longform") ||
      cleanChoice.includes("long form")
    ) {
      return "premium";
    }

    return "premium";
  };

  const getPackageName = (packagePlan: string) => {
    if (packagePlan === "starter") return "Starter";
    if (packagePlan === "enhanced") return "Enhanced";
    return "Premium Longform";
  };

  const getPackagePrice = (packagePlan: string, savedPrice?: string) => {
    if (savedPrice && savedPrice !== "$0") return savedPrice;

    if (packagePlan === "starter") return "$100.98";
    if (packagePlan === "enhanced") return "$162.18";
    return "$253.98";
  };

  const getESARequestForProject = async () => {
    const localESARequest = JSON.parse(
      localStorage.getItem("esaRequest") || "{}"
    );

    let esaRequest = localESARequest;

    const parentEmail =
      localESARequest.parentEmail ||
      localESARequest.parent_email ||
      localESARequest.email ||
      "";

    if (parentEmail) {
      const { data: savedESARequest, error } = await supabase
        .from("esa_requests")
        .select("*")
        .eq("parent_email", parentEmail)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!error && savedESARequest) {
        esaRequest = {
          ...localESARequest,
          id: savedESARequest.id || localESARequest.id || "",
          parentName:
            savedESARequest.parent_name ||
            localESARequest.parentName ||
            localESARequest.parent_name ||
            "",
          parentEmail:
            savedESARequest.parent_email ||
            localESARequest.parentEmail ||
            localESARequest.parent_email ||
            "",
          parentPhone:
            savedESARequest.parent_phone ||
            localESARequest.parentPhone ||
            localESARequest.parent_phone ||
            "",
          studentName:
            savedESARequest.student_name ||
            localESARequest.studentName ||
            localESARequest.student_name ||
            "",
          studentEmail:
            savedESARequest.student_email ||
            localESARequest.studentEmail ||
            localESARequest.student_email ||
            "",
          studentGrade:
            savedESARequest.student_grade ||
            localESARequest.studentGrade ||
            localESARequest.student_grade ||
            "",
          packageChoice:
            savedESARequest.package_choice ||
            localESARequest.packageChoice ||
            localESARequest.package_choice ||
            "Premium Longform",
          packagePrice:
            savedESARequest.package_price ||
            localESARequest.packagePrice ||
            localESARequest.package_price ||
            "",
          invoiceNumber:
            savedESARequest.invoice_number ||
            localESARequest.invoiceNumber ||
            localESARequest.invoice_number ||
            "",
          invoiceStatus:
            savedESARequest.invoice_status ||
            localESARequest.invoiceStatus ||
            localESARequest.invoice_status ||
            "",
          educationalPurpose:
            savedESARequest.educational_purpose ||
            localESARequest.educationalPurpose ||
            localESARequest.educational_purpose ||
            "",
          serviceDates:
            savedESARequest.service_dates ||
            localESARequest.serviceDates ||
            localESARequest.service_dates ||
            "",
          createdAt:
            savedESARequest.created_at ||
            localESARequest.createdAt ||
            localESARequest.created_at ||
            "",
        };

        localStorage.setItem("esaRequest", JSON.stringify(esaRequest));
      }
    }

    return esaRequest;
  };

  const handleContinue = async () => {
    const finalExtraInstructions = buildFinalExtraInstructions();

    const formData = {
      bookType,
      topic,
      pageCount,
      tone,
      audience,
      authorName,
      imagesNeeded,
      extraInstructions: finalExtraInstructions,
      extraInstructionSelections,
      customExtraInstructions,
      accessType: isESA ? "ESA Funded" : "Standard",
      paymentStatus: isESA ? "ESA Funded" : "Pending Checkout",
    };

    setExtraInstructions(finalExtraInstructions);
    localStorage.setItem("writeNowBookForm", JSON.stringify(formData));

    if (isESA) {
      try {
        setIsCreatingProject(true);
        setMessage("Creating ESA-funded project...");

        const user = await getCurrentUser();

        if (!user) {
          setMessage("Please create or log into your account to continue.");
          router.push("/login?redirect=/create-book?esa=true");
          return;
        }

        const esaRequest = await getESARequestForProject();

        const packagePlan = normalizePackagePlan(
          esaRequest.packageChoice || esaRequest.package_choice || ""
        );

        const packageName = getPackageName(packagePlan);

        const packagePrice = getPackagePrice(
          packagePlan,
          esaRequest.packagePrice || esaRequest.package_price
        );

        const completeBookData = {
          ...formData,

          accessType: "ESA",
          paymentStatus: "ESA Funded",

          packageName: `${packageName} (ESA)`,
          packagePrice: `${packagePrice} (ESA Funded)`,
          packagePlan,

          esaRequest,

          esaRequestId: esaRequest.id || "",
          esaParentName:
            esaRequest.parentName || esaRequest.parent_name || "",
          esaParentEmail:
            esaRequest.parentEmail || esaRequest.parent_email || "",
          esaParentPhone:
            esaRequest.parentPhone || esaRequest.parent_phone || "",
          esaStudentName:
            esaRequest.studentName || esaRequest.student_name || "",
          esaStudentEmail:
            esaRequest.studentEmail || esaRequest.student_email || "",
          esaStudentGrade:
            esaRequest.studentGrade || esaRequest.student_grade || "",
          esaPackageChoice:
            esaRequest.packageChoice ||
            esaRequest.package_choice ||
            packageName,
          esaPackagePrice: packagePrice,
          esaPackagePlan: packagePlan,
          esaInvoiceNumber:
            esaRequest.invoiceNumber || esaRequest.invoice_number || "",
          esaInvoiceStatus:
            esaRequest.invoiceStatus || esaRequest.invoice_status || "",
          esaEducationalPurpose:
            esaRequest.educationalPurpose ||
            esaRequest.educational_purpose ||
            "",
          esaServiceDates:
            esaRequest.serviceDates || esaRequest.service_dates || "",
        };

        const { data, error } = await supabase
          .from("projects")
          .insert({
            user_id: user.id,
            payment_id: "ESA-FUNDED",
            package_name: `${packageName} (ESA)`,
            package_price: `${packagePrice} (ESA Funded)`,
            package_plan: packagePlan,
            status: "ACTIVE",
            book_data: completeBookData,
          })
          .select()
          .single();

        if (error || !data) {
          throw error || new Error("Unable to create ESA project.");
        }

        const existingOrders = JSON.parse(
          localStorage.getItem("writeNowOrders") || "[]"
        );

        const esaOrder = {
          id: data.id,
          paymentId: "ESA-FUNDED",
          packageName: `${packageName} (ESA)`,
          packagePrice: `${packagePrice} (ESA Funded)`,
          packagePlan,
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
          bookData: completeBookData,
        };

        localStorage.setItem(
          "writeNowOrders",
          JSON.stringify([esaOrder, ...existingOrders])
        );

        localStorage.removeItem("writeNowBookForm");

        router.push(`/projects/${data.id}`);
        return;
      } catch (error) {
        console.error(error);

        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to create ESA project."
        );

        return;
      } finally {
        setIsCreatingProject(false);
      }
    }

    router.push("/package-selection");
  };

  return (
    <main className="min-h-screen bg-black text-white px-6 py-16">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <p className="text-sm uppercase tracking-[0.25em] text-gray-400 mb-3">
            Book Creation Intake
          </p>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Tell Us About Your Book
          </h1>

          <p className="text-lg text-gray-300 max-w-3xl">
            Choose the options that best describe your book project. This helps
            WriteNowBooks guide your outline, manuscript structure, images, and
            final deliverables.
          </p>

          {isESA && (
            <div className="mt-6 border border-green-600 bg-green-950/40 text-green-200 rounded-xl p-4">
              ESA-funded access detected. Package selection and card checkout
              will be skipped because funding has already been confirmed.
            </div>
          )}

          {message && (
            <div className="mt-6 border border-blue-600 bg-blue-950/40 text-blue-200 rounded-xl p-4">
              {message}
            </div>
          )}
        </div>

        <div className="grid gap-8 md:grid-cols-[1.5fr_0.8fr]">
          <section className="border border-gray-700 rounded-2xl p-8 bg-gray-950">
            <div className="space-y-8">
              <div>
                <label className="block mb-4 font-medium text-xl">
                  Book Type
                </label>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {bookTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setBookType(type)}
                      className={`p-3 rounded-xl border transition font-medium ${
                        bookType === type
                          ? "bg-yellow-400 text-black border-yellow-400"
                          : "bg-black border-gray-700 hover:border-yellow-400"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-2 font-medium text-xl">
                  Book Title or Main Idea
                </label>

                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter your book title or briefly describe your book idea"
                  className="w-full rounded-lg bg-black border border-gray-700 px-4 py-4 text-white min-h-[130px]"
                />

                <p className="text-sm text-gray-400 mt-2">
                  This is the main creative field. The guided options below help
                  the AI understand the rest.
                </p>
              </div>

              <div>
                <label className="block mb-2 font-medium text-xl">
                  Estimated Page Count
                </label>

                <select
                  value={pageCount}
                  onChange={(e) => setPageCount(e.target.value)}
                  className="w-full rounded-lg bg-black border border-gray-700 px-4 py-4 text-white"
                >
                  <option value="">Select page range</option>
                  <option value="10–20 pages">10–20 pages</option>
                  <option value="20–40 pages">20–40 pages</option>
                  <option value="40–75 pages">40–75 pages</option>
                  <option value="75–150 pages">75–150 pages</option>
                  <option value="150–300 pages">150–300 pages</option>
                  <option value="300+ pages">300+ pages</option>
                  <option value="Not Sure">Not Sure</option>
                </select>
              </div>

              <div>
                <label className="block mb-4 font-medium text-xl">
                  Tone / Style
                </label>

                <p className="text-gray-400 text-sm mb-4">
                  You may choose more than one.
                </p>

                <div className="flex flex-wrap gap-3">
                  {toneOptions.map((style) => {
                    const selected = tone
                      .split(", ")
                      .filter(Boolean)
                      .includes(style);

                    return (
                      <button
                        key={style}
                        type="button"
                        onClick={() => toggleTone(style)}
                        className={`px-4 py-3 rounded-full border font-medium ${
                          selected
                            ? "bg-purple-600 border-purple-500 text-white"
                            : "bg-black border-gray-700 hover:border-purple-500"
                        }`}
                      >
                        {style}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block mb-2 font-medium text-xl">
                  Target Audience
                </label>

                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full rounded-lg bg-black border border-gray-700 px-4 py-4 text-white"
                >
                  <option value="">Select audience</option>
                  <option value="Toddlers (1–4)">Toddlers (1–4)</option>
                  <option value="Children (5–8)">Children (5–8)</option>
                  <option value="Pre-Teen">Pre-Teen</option>
                  <option value="Teen">Teen</option>
                  <option value="Young Adult">Young Adult</option>
                  <option value="Adults">Adults</option>
                  <option value="Families">Families</option>
                  <option value="Homeschool Students">
                    Homeschool Students
                  </option>
                  <option value="Entrepreneurs">Entrepreneurs</option>
                  <option value="Faith Community">Faith Community</option>
                  <option value="General Audience">General Audience</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium text-xl">
                  Author Name
                </label>

                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Name to appear on the book"
                  className="w-full rounded-lg bg-black border border-gray-700 px-4 py-4 text-white"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-xl">
                  AI Illustration Options
                </label>

                <select
                  value={imagesNeeded}
                  onChange={(e) => setImagesNeeded(e.target.value)}
                  className="w-full rounded-lg bg-black border border-gray-700 px-4 py-4 text-white"
                >
                  <option value="">Select image option</option>
                  <option value="AI Illustrations on Every Page">
                    AI Illustrations on Every Page
                  </option>
                  <option value="AI Images for Key Pages">
                    AI Images for Key Pages
                  </option>
                  <option value="Cover Image Only">Cover Image Only</option>
                  <option value="No Images">No Images</option>
                  <option value="Not Sure">Not Sure</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium text-xl">
                  Extra Instructions
                </label>

                <p className="text-gray-400 text-sm mb-4">
                  Choose any options that fit your book. These selections are
                  saved and sent to the AI when it builds the outline, pages,
                  chapters, and image prompts.
                </p>

                <div className="space-y-6">
                  {guidedInstructionGroups.map((group) => (
                    <div
                      key={group.title}
                      className="rounded-2xl border border-gray-800 bg-black/40 p-5"
                    >
                      <h3 className="text-lg font-semibold mb-4">
                        {group.title}
                      </h3>

                      <div className="flex flex-wrap gap-3">
                        {group.options.map((option) => {
                          const selected =
                            extraInstructionSelections.includes(option);

                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => toggleExtraInstruction(option)}
                              className={`px-4 py-3 rounded-full border text-sm font-medium transition ${
                                selected
                                  ? "bg-yellow-400 text-black border-yellow-400"
                                  : "bg-black border-gray-700 hover:border-yellow-400 text-white"
                              }`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <label className="block mb-2 font-medium">
                    Add Your Own Details
                  </label>

                  <textarea
                    value={customExtraInstructions}
                    onChange={(e) => setCustomExtraInstructions(e.target.value)}
                    placeholder="Example: My main character is a 7-year-old girl named Amara with brown skin, curly hair, purple glasses, and a yellow backpack. She learns to be brave on her first day of school."
                    className="w-full rounded-lg bg-black border border-gray-700 px-4 py-4 text-white min-h-[150px]"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleContinue}
                disabled={isCreatingProject}
                className="w-full bg-yellow-400 text-black py-4 rounded-xl font-bold text-lg hover:bg-yellow-300 transition disabled:opacity-60"
              >
                {isCreatingProject
                  ? "Creating Project..."
                  : isESA
                  ? "Continue To Book Builder"
                  : "Continue To Package Selection"}
              </button>
            </div>
          </section>

          <aside className="border border-gray-700 rounded-2xl p-8 bg-gray-950 h-fit">
            <h2 className="text-2xl font-semibold mb-5">
              Your Project Snapshot
            </h2>

            <ul className="space-y-4 text-gray-300 mb-8">
              <li>• Book type: {bookType || "Not selected yet"}</li>
              <li>• Page range: {pageCount || "Not selected yet"}</li>
              <li>• Tone: {tone || "Not selected yet"}</li>
              <li>• Audience: {audience || "Not selected yet"}</li>
              <li>• Images: {imagesNeeded || "Not selected yet"}</li>
              <li>
                • Guided choices:{" "}
                {extraInstructionSelections.length > 0
                  ? `${extraInstructionSelections.length} selected`
                  : "None yet"}
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-4">What Happens Next</h3>

            {isESA ? (
              <ul className="space-y-4 text-gray-300">
                <li>• ESA funding has already been confirmed.</li>
                <li>• Package selection and checkout are skipped.</li>
                <li>• A project record is created in your workspace.</li>
                <li>
                  • Your student continues directly into the existing book
                  workflow.
                </li>
              </ul>
            ) : (
              <ul className="space-y-4 text-gray-300">
                <li>• You choose the package that fits your project.</li>
                <li>• You review your checkout details.</li>
                <li>• Payment is completed securely.</li>
                <li>• Your book workflow begins.</li>
              </ul>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function CreateBookPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-white flex items-center justify-center">
          Loading book creation form...
        </main>
      }
    >
      <CreateBookContent />
    </Suspense>
  );
}