export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="px-6 py-24 border-b border-gray-800">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-gray-400 mb-4">
            AI-Assisted Book Creation Platform
          </p>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            Create Your Book in Hours,
            <br />
            Not Months.
          </h1>

          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-10">
            Turn your idea into a complete book package with guided prompts,
            structured writing, cover support, back cover copy, author bio, and
            downloadable deliverables.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/create-book"
              className="bg-white text-black px-8 py-4 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Start Your Book
            </Link>

            <Link
              href="/pricing"
              className="border border-gray-600 px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-black transition"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 border-b border-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">
            Packages
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              ["Starter", "$99", "50 pages or less. Core book package without image generation."],
              ["Enhanced", "$159", "50 pages or less. Includes image generation and visual support."],
              ["Premium Longform", "$249", "50+ pages with long-form support and image generation where needed."],
            ].map(([name, price, description]) => (
              <div
                key={name}
                className="border border-gray-700 rounded-2xl p-8 bg-gray-950"
              >
                <h3 className="text-2xl font-semibold mb-3">{name}</h3>
                <p className="text-4xl font-bold mb-4">{price}</p>
                <p className="text-gray-300 mb-6">{description}</p>

                <Link
                  href="/package-selection"
                  className="block text-center bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  Choose {name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Start Your Book?
          </h2>

          <p className="text-lg text-gray-300 mb-10">
            Build your project, select your package, and move into a guided
            book-creation workflow designed to help you publish faster.
          </p>

          <Link
            href="/create-book"
            className="inline-block bg-white text-black px-8 py-4 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            Start Your Book Now
          </Link>
        </div>
      </section>
    </main>
  );
}