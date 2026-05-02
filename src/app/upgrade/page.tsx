"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function UpgradePageContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  const enhancedHref = projectId
    ? `/checkout?plan=enhanced&upgradeProjectId=${projectId}`
    : "/checkout?plan=enhanced";

  const premiumHref = projectId
    ? `/checkout?plan=premium&upgradeProjectId=${projectId}`
    : "/checkout?plan=premium";

  return (
    <main className="min-h-screen bg-black text-white px-6 py-16">
      <div className="max-w-5xl mx-auto">
        <p className="text-sm uppercase tracking-[0.25em] text-yellow-400 mb-4">
          Upgrade Access
        </p>

        <h1 className="text-5xl font-bold mb-6">Unlock More AI Book Power</h1>

        <p className="text-gray-300 text-lg mb-12 max-w-3xl">
          Upgrade your package to unlock more AI generations, expanded chapters,
          image planning, cover creation, and publishing tools.
        </p>

        {!projectId && (
          <div className="mb-8 rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-yellow-200">
            No project was connected to this upgrade page. Start from your
            project page to unlock an existing project after payment.
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <div className="border border-gray-700 rounded-2xl p-6 bg-gray-950">
            <h2 className="text-2xl font-semibold mb-3">Starter</h2>
            <p className="text-3xl font-bold mb-4">$99</p>

            <ul className="space-y-3 text-gray-300 mb-6">
              <li>• 1 AI outline</li>
              <li>• 1 AI chapter generation</li>
              <li>• 1 chapter expansion</li>
              <li>• 1 image plan</li>
              <li>• 1 cover generation</li>
            </ul>

            <Link
              href="/package-selection"
              className="block text-center border border-gray-600 px-5 py-3 rounded-lg font-semibold hover:bg-white hover:text-black transition"
            >
              Current Base Plan
            </Link>
          </div>

          <div className="border border-yellow-400 rounded-2xl p-6 bg-yellow-400/10">
            <h2 className="text-2xl font-semibold mb-3">Enhanced</h2>
            <p className="text-3xl font-bold mb-4">$159</p>

            <ul className="space-y-3 text-gray-300 mb-6">
              <li>• 3 AI outlines</li>
              <li>• 2 AI chapter generations</li>
              <li>• 3 chapter expansions</li>
              <li>• 2 image plans</li>
              <li>• 3 cover generations</li>
            </ul>

            <Link
              href={enhancedHref}
              className="block text-center bg-yellow-400 text-black px-5 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition"
            >
              Upgrade to Enhanced
            </Link>
          </div>

          <div className="border border-gray-700 rounded-2xl p-6 bg-gray-950">
            <h2 className="text-2xl font-semibold mb-3">Premium Longform</h2>
            <p className="text-3xl font-bold mb-4">$249</p>

            <ul className="space-y-3 text-gray-300 mb-6">
              <li>• Expanded AI usage</li>
              <li>• Longform manuscript support</li>
              <li>• More image planning</li>
              <li>• More cover attempts</li>
              <li>• Best for full books</li>
            </ul>

            <Link
              href={premiumHref}
              className="block text-center bg-white text-black px-5 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Upgrade to Premium
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function UpgradePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-white px-6 py-16">
          <div className="max-w-5xl mx-auto">
            <p className="text-gray-300">Loading upgrade options...</p>
          </div>
        </main>
      }
    >
      <UpgradePageContent />
    </Suspense>
  );
}