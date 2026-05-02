"use client";

import { useEffect, useState } from "react";

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

export default function PackageSelectionPage() {
  const [bookData, setBookData] = useState<BookFormData | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("writeNowBookForm");
    if (saved) {
      setBookData(JSON.parse(saved));
    }
  }, []);

  return (
    <main className="min-h-screen bg-black text-white px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <p className="text-sm uppercase tracking-[0.25em] text-gray-400 mb-3">
            Package Selection
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose the Right Package for Your Book
          </h1>
          <p className="text-lg text-gray-300 max-w-3xl">
            Review your project summary below, then choose the package that best
            fits your book length and image needs.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          <aside className="border border-gray-700 rounded-2xl p-8 bg-gray-950 h-fit">
            <h2 className="text-2xl font-semibold mb-6">Your Project Summary</h2>

            <div className="space-y-5">
              <div>
                <p className="text-sm text-gray-400 mb-1">Book Type</p>
                <p className="font-medium">{bookData?.bookType || "Not provided"}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-1">Estimated Page Count</p>
                <p className="font-medium">{bookData?.pageCount || "Not provided"}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-1">Tone / Style</p>
                <p className="font-medium">{bookData?.tone || "Not provided"}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-1">Target Audience</p>
                <p className="font-medium">{bookData?.audience || "Not provided"}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-1">Author Name</p>
                <p className="font-medium">{bookData?.authorName || "Not provided"}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-1">Images Needed</p>
                <p className="font-medium">{bookData?.imagesNeeded || "Not provided"}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">Topic / Main Idea</p>
                <div className="rounded-xl border border-gray-800 bg-black/40 p-4 text-gray-200">
                  {bookData?.topic || "Not provided"}
                </div>
              </div>
            </div>
          </aside>

          <section>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="border border-gray-700 rounded-2xl p-6 bg-gray-950">
                <h2 className="text-2xl font-semibold mb-3">Starter</h2>
                <p className="text-3xl font-bold mb-4">$99</p>
                <p className="text-gray-300 mb-6">
                  50 pages or less. Includes full manuscript and core text deliverables. No image generation.
                </p>
                <a
                  href="/checkout?plan=starter"
                  className="block w-full text-center bg-white text-black px-4 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  Select Starter
                </a>
              </div>

              <div className="border border-gray-700 rounded-2xl p-6 bg-gray-950">
                <h2 className="text-2xl font-semibold mb-3">Enhanced</h2>
                <p className="text-3xl font-bold mb-4">$159</p>
                <p className="text-gray-300 mb-6">
                  50 pages or less. Includes everything in Starter plus image generation and visual assets.
                </p>
                <a
                  href="/checkout?plan=enhanced"
                  className="block w-full text-center bg-white text-black px-4 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  Select Enhanced
                </a>
              </div>

              <div className="border border-gray-700 rounded-2xl p-6 bg-gray-950">
                <h2 className="text-2xl font-semibold mb-3">Premium Longform</h2>
                <p className="text-3xl font-bold mb-4">$249</p>
                <p className="text-gray-300 mb-6">
                  50+ pages. Full package with image generation where needed and long-form support.
                </p>
                <a
                  href="/checkout?plan=premium"
                  className="block w-full text-center bg-white text-black px-4 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  Select Premium
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}