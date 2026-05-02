import Link from "next/link";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-16 flex items-center justify-center">
      <div className="w-full max-w-5xl grid gap-8 md:grid-cols-[1fr_1fr]">
        <section className="border border-gray-700 rounded-2xl p-10 bg-gray-950">
          <p className="text-sm uppercase tracking-[0.25em] text-gray-400 mb-3">
            Account Access
          </p>
          <h1 className="text-4xl font-bold mb-4">Sign In</h1>
          <p className="text-gray-300 mb-8">
            Access your dashboard, review your book projects, track progress, and
            download your deliverables.
          </p>

          <div className="space-y-5">
            <div>
              <label className="block mb-2 font-medium">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full rounded-lg bg-black border border-gray-700 px-4 py-3 text-white"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full rounded-lg bg-black border border-gray-700 px-4 py-3 text-white"
              />
            </div>

            <button className="w-full bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition">
              Sign In
            </button>
          </div>

          <div className="mt-6 text-sm text-gray-400 flex items-center justify-between">
            <span>Forgot password?</span>
            <span>Need account setup after checkout</span>
          </div>
        </section>

        <aside className="border border-gray-700 rounded-2xl p-10 bg-gray-950">
          <h2 className="text-2xl font-semibold mb-5">What Your Account Gives You</h2>

          <ul className="space-y-4 text-gray-300 mb-10">
            <li>• View active and completed book projects</li>
            <li>• Track progress through the creation workflow</li>
            <li>• Access PDF, DOCX, and related deliverables</li>
            <li>• Start new projects from your dashboard</li>
            <li>• Manage future upgrades and package selections</li>
          </ul>

          <div className="border border-dashed border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-3">New here?</h3>
            <p className="text-gray-300 mb-5">
              Accounts will tie directly into project creation and checkout so users
              can manage every book in one place.
            </p>

            <Link
              href="/create-book"
              className="inline-block border border-gray-600 px-5 py-3 rounded-lg font-semibold hover:bg-white hover:text-black transition"
            >
              Start a Book Project
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}