import Link from "next/link";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm uppercase tracking-[0.25em] text-gray-400 mb-3">
            Pricing
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose the Package That Fits Your Book
          </h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Every package is built to help you move from idea to a structured,
            downloadable book package. Choose based on length and whether your
            project needs image generation.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="border border-gray-700 rounded-2xl p-8 bg-gray-950">
            <h2 className="text-2xl font-semibold mb-3">Starter</h2>
            <p className="text-4xl font-bold mb-4">$99</p>
            <p className="text-gray-300 mb-6">
              Best for books of 50 pages or less that do not require image generation.
            </p>

            <ul className="space-y-3 text-gray-300 mb-8">
              <li>• Up to 50 pages</li>
              <li>• Title and subtitle support</li>
              <li>• Table of contents / outline</li>
              <li>• Full manuscript draft</li>
              <li>• Author bio</li>
              <li>• Back cover copy</li>
              <li>• PDF and DOCX deliverables</li>
              <li>• No image generation</li>
            </ul>

            <Link
              href="/package-selection"
              className="block text-center bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Choose Starter
            </Link>
          </div>

          <div className="border border-gray-700 rounded-2xl p-8 bg-gray-950">
            <h2 className="text-2xl font-semibold mb-3">Enhanced</h2>
            <p className="text-4xl font-bold mb-4">$159</p>
            <p className="text-gray-300 mb-6">
              Best for books of 50 pages or less that need image generation or visual assets.
            </p>

            <ul className="space-y-3 text-gray-300 mb-8">
              <li>• Up to 50 pages</li>
              <li>• Title and subtitle support</li>
              <li>• Table of contents / outline</li>
              <li>• Full manuscript draft</li>
              <li>• Author bio</li>
              <li>• Back cover copy</li>
              <li>• PDF and DOCX deliverables</li>
              <li>• Image generation included</li>
            </ul>

            <Link
              href="/package-selection"
              className="block text-center bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Choose Enhanced
            </Link>
          </div>

          <div className="border border-gray-700 rounded-2xl p-8 bg-gray-950">
            <h2 className="text-2xl font-semibold mb-3">Premium Longform</h2>
            <p className="text-4xl font-bold mb-4">$249</p>
            <p className="text-gray-300 mb-6">
              Best for books over 50 pages, including long-form projects and books that need image support.
            </p>

            <ul className="space-y-3 text-gray-300 mb-8">
              <li>• 50+ pages</li>
              <li>• Long-form project support</li>
              <li>• Title and subtitle support</li>
              <li>• Table of contents / outline</li>
              <li>• Full manuscript draft</li>
              <li>• Author bio</li>
              <li>• Back cover copy</li>
              <li>• PDF and DOCX deliverables</li>
              <li>• Image generation where needed</li>
            </ul>

            <Link
              href="/package-selection"
              className="block text-center bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Choose Premium
            </Link>
          </div>
        </div>

        <div className="mt-14 border border-gray-700 rounded-2xl p-8 bg-gray-950">
          <h3 className="text-2xl font-semibold mb-4">What Every Package Is Designed to Do</h3>
          <p className="text-gray-300 leading-7">
            WriteNowBooks is built to help users move from concept to structured
            draft faster. Each package is designed to support title development,
            outline generation, manuscript drafting, supporting author material,
            and downloadable deliverables. The main differences are project length
            and whether image generation is included.
          </p>
        </div>
      </div>
    </main>
  );
}