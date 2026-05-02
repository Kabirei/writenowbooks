import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "WriteNowBooks",
  description: "AI-assisted book creation platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white min-h-screen flex flex-col">
        <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-black !bg-black">
          <nav className="max-w-7xl mx-auto w-full px-6 py-4 flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold tracking-tight text-white">
              Write<span className="text-yellow-400">Now</span>Books
            </Link>

            <div className="hidden md:flex items-center gap-6 text-sm md:text-base">
              <Link href="/" className="text-gray-300 hover:text-white transition">
                Home
              </Link>
              <Link href="/pricing" className="text-gray-300 hover:text-white transition">
                Pricing
              </Link>
              <Link href="/create-book" className="text-gray-300 hover:text-white transition">
                Create Book
              </Link>
              <Link href="/dashboard" className="text-gray-300 hover:text-white transition">
                Dashboard
              </Link>
              <Link href="/signup" className="text-gray-300 hover:text-white transition">
                Sign Up
              </Link>
              <Link href="/login" className="text-gray-300 hover:text-white transition">
                Login
              </Link>
              <Link href="/account" className="text-gray-300 hover:text-white transition">
                Account
              </Link>
              <Link href="/logout" className="text-gray-300 hover:text-white transition">
                Logout
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden sm:inline-block border border-yellow-400 text-yellow-400 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-400 hover:text-black transition"
              >
                Login
              </Link>

              <Link
                href="/create-book"
                className="bg-yellow-400 text-black px-5 py-2.5 rounded-lg font-semibold hover:bg-yellow-300 transition"
              >
                Start Now
              </Link>
            </div>
          </nav>
        </header>

        <div className="flex-1">{children}</div>

        <footer className="border-t border-gray-800 px-6 py-10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            <p>
              © 2026 Write<span className="text-yellow-400">Now</span>Books. All rights reserved.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6">
              <Link href="/" className="hover:text-white transition">
                Home
              </Link>
              <Link href="/pricing" className="hover:text-white transition">
                Pricing
              </Link>
              <Link href="/create-book" className="hover:text-white transition">
                Create Book
              </Link>
              <Link href="/signup" className="hover:text-white transition">
                Sign Up
              </Link>
              <Link href="/login" className="hover:text-white transition">
                Login
              </Link>
              <Link href="/account" className="hover:text-white transition">
                Account
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}