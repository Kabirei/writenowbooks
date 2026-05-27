"use client";

import { Suspense, useState } from "react";
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

  const toggleTone = (selectedTone: string) => {
    const currentTones = tone
      ? tone.split(", ").filter(Boolean)
      : [];

    const updatedTones = currentTones.includes(selectedTone)
      ? currentTones.filter((item) => item !== selectedTone)
      : [...currentTones, selectedTone];

    setTone(updatedTones.join(", "));
  };

  const handleContinue = async () => {
    const formData = {
      bookType,
      topic,
      pageCount,
      tone,
      audience,
      authorName,
      imagesNeeded,
      extraInstructions,
      accessType: isESA ? "ESA Funded" : "Standard",
      paymentStatus: isESA ? "ESA Funded" : "Pending Checkout",
    };

    localStorage.setItem("writeNowBookForm", JSON.stringify(formData));

    if (isESA) {
      try {
        setIsCreatingProject(true);
        setMessage("Creating ESA-funded project...");

        const user = await getCurrentUser();

        if (!user) {
          setMessage("Please log in before starting your ESA project.");
          router.push("/login");
          return;
        }

        const esaRequest = JSON.parse(
          localStorage.getItem("esaRequest") || "{}"
        );

        const packageChoice = String(
          esaRequest.packageChoice || "Starter"
        ).toLowerCase();

        const packagePlan = packageChoice.includes("starter")
          ? "starter"
          : packageChoice.includes("enhanced")
          ? "enhanced"
          : "premium";

        const packageName =
          packagePlan === "starter"
            ? "Starter"
            : packagePlan === "enhanced"
            ? "Enhanced"
            : "Premium Longform";

        const { data, error } = await supabase
          .from("projects")
          .insert({
            user_id: user.id,
            payment_id: "ESA-FUNDED",
            package_name: `${packageName} (ESA)`,
            package_price: `${esaRequest.packagePrice || "$0"} (ESA Funded)`,
            package_plan: packagePlan,
            status: "ACTIVE",
            book_data: {
              ...formData,
              accessType: "ESA",
              paymentStatus: "ESA Funded",
              esaParentEmail: esaRequest.parentEmail || "",
              esaPackageChoice: esaRequest.packageChoice || packageName,
            },
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
          packagePrice: `${esaRequest.packagePrice || "$0"} (ESA Funded)`,
          packagePlan,
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
          bookData: formData,
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
                  This is the only main creative field you need to type. The rest
                  can be selected quickly.
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

                <textarea
                  value={extraInstructions}
                  onChange={(e) => setExtraInstructions(e.target.value)}
                  placeholder="Add characters, themes, chapter ideas, visual directions, references, or anything else important"
                  className="w-full rounded-lg bg-black border border-gray-700 px-4 py-4 text-white min-h-[150px]"
                />
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