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
  const [imagesNeeded, setImagesNeeded] = useState("No");
  const [extraInstructions, setExtraInstructions] = useState("");
  const [message, setMessage] = useState("");
  const [isCreatingProject, setIsCreatingProject] = useState(false);

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
            Enter the details for your project below. This information will
            guide your outline, manuscript structure, package selection, and
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
            <div className="space-y-7">
              <div>
                <label className="block mb-2 font-medium">Book Type</label>
                <input
                  type="text"
                  value={bookType}
                  onChange={(e) => setBookType(e.target.value)}
                  placeholder="Example: children's book, nonfiction, self-help, fiction"
                  className="w-full rounded-lg bg-black border border-gray-700 px-4 py-3 text-white"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  Book Title or Main Idea
                </label>

                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter your book title or describe the book you want created"
                  className="w-full rounded-lg bg-black border border-gray-700 px-4 py-3 text-white min-h-[150px]"
                />

                <p className="text-sm text-gray-400 mt-2">
                  If you already have a title, enter it here. If not, describe
                  your idea.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block mb-2 font-medium">
                    Estimated Page Count
                  </label>

                  <input
                    type="text"
                    value={pageCount}
                    onChange={(e) => setPageCount(e.target.value)}
                    placeholder="Example: 30 pages, 75 pages, 150 pages"
                    className="w-full rounded-lg bg-black border border-gray-700 px-4 py-3 text-white"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">
                    Tone / Style
                  </label>

                  <input
                    type="text"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    placeholder="Example: professional, playful, inspiring"
                    className="w-full rounded-lg bg-black border border-gray-700 px-4 py-3 text-white"
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block mb-2 font-medium">
                    Target Audience
                  </label>

                  <input
                    type="text"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="Example: parents, entrepreneurs, children ages 4–8"
                    className="w-full rounded-lg bg-black border border-gray-700 px-4 py-3 text-white"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">Author Name</label>

                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Name to appear on the book"
                    className="w-full rounded-lg bg-black border border-gray-700 px-4 py-3 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  Do you need images?
                </label>

                <select
                  value={imagesNeeded}
                  onChange={(e) => setImagesNeeded(e.target.value)}
                  className="w-full rounded-lg bg-black border border-gray-700 px-4 py-3 text-white"
                >
                  <option>No</option>
                  <option>Yes</option>
                  <option>Only if needed</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  Extra Instructions
                </label>

                <textarea
                  value={extraInstructions}
                  onChange={(e) => setExtraInstructions(e.target.value)}
                  placeholder="Add themes, chapter ideas, visual directions, character notes, citation needs, or anything else important"
                  className="w-full rounded-lg bg-black border border-gray-700 px-4 py-3 text-white min-h-[170px]"
                />
              </div>

              <button
                type="button"
                onClick={handleContinue}
                disabled={isCreatingProject}
                className="inline-block bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition disabled:opacity-60"
              >
                {isCreatingProject
                  ? "Creating Project..."
                  : isESA
                  ? "Continue to Book Builder"
                  : "Continue to Package Selection"}
              </button>
            </div>
          </section>

          <aside className="border border-gray-700 rounded-2xl p-8 bg-gray-950 h-fit">
            <h2 className="text-2xl font-semibold mb-5">
              What You’ll Provide
            </h2>

            <ul className="space-y-4 text-gray-300 mb-8">
              <li>• Your book title, main idea, and book type</li>
              <li>• Your target page count</li>
              <li>• Tone, audience, and author name</li>
              <li>• Whether image generation is needed</li>
              <li>• Any special guidance or instructions</li>
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