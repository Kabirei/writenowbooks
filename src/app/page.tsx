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
            structured writing, cover support, back cover copy, author bio,
            and downloadable deliverables.
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
          <h2 className="text-4xl font-bold mb-12 text-center">How It Works</h2>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="border border-gray-700 rounded-2xl p-8 bg-gray-950">
              <div className="text-3xl font-bold mb-4">01</div>
              <h3 className="text-2xl font-semibold mb-3">Describe Your Book</h3>
              <p className="text-gray-300">
                Tell us your topic, audience, page count, tone, and any specific
                ideas or requirements you want included.
              </p>
            </div>

            <div className="border border-gray-700 rounded-2xl p-8 bg-gray-950">
              <div className="text-3xl font-bold mb-4">02</div>
              <h3 className="text-2xl font-semibold mb-3">Choose Your Package</h3>
              <p className="text-gray-300">
                Select the plan that fits your project, including long-form and
                image-supported options where needed.
              </p>
            </div>

            <div className="border border-gray-700 rounded-2xl p-8 bg-gray-950">
              <div className="text-3xl font-bold mb-4">03</div>
              <h3 className="text-2xl font-semibold mb-3">Receive Your Book</h3>
              <p className="text-gray-300">
                Move into the guided creation flow and receive a structured,
                downloadable book package built around your input.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 border-b border-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">What You Can Create</h2>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              "Children’s Books",
              "Self-Help Books",
              "Nonfiction Guides",
              "Workbooks",
              "Fiction & Storytelling",
              "Authority / Brand Books",
              "Devotionals",
              "Long-Form Projects",
              "Image-Supported Books",
            ].map((item) => (
              <div
                key={item}
                className="border border-gray-700 rounded-xl p-5 bg-gray-950 text-center font-medium"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 border-b border-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Packages</h2>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="border border-gray-700 rounded-2xl p-8 bg-gray-950">
              <h3 className="text-2xl font-semibold mb-3">Starter</h3>
              <p className="text-4xl font-bold mb-4">$99</p>
              <p className="text-gray-300 mb-6">
                50 pages or less. Includes the core book package without image generation.
              </p>
              <Link
                href="/package-selection"
                className="block text-center bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                Choose Starter
              </Link>
            </div>

            <div className="border border-gray-700 rounded-2xl p-8 bg-gray-950">
              <h3 className="text-2xl font-semibold mb-3">Enhanced</h3>
              <p className="text-4xl font-bold mb-4">$159</p>
              <p className="text-gray-300 mb-6">
                50 pages or less. Includes image generation and added visual support.
              </p>
              <Link
                href="/package-selection"
                className="block text-center bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                Choose Enhanced
              </Link>
            </div>

            <div className="border border-gray-700 rounded-2xl p-8 bg-gray-950">
              <h3 className="text-2xl font-semibold mb-3">Premium Longform</h3>
              <p className="text-4xl font-bold mb-4">$249</p>
              <p className="text-gray-300 mb-6">
                50+ pages with long-form support and image generation where needed.
              </p>
              <Link
                href="/package-selection"
                className="block text-center bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                Choose Premium
              </Link>
            </div>
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