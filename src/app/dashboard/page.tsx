"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getUser";

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

type SavedOrder = {
  id: string;
  paymentId: string;
  packageName: string;
  packagePrice: string;
  packagePlan: string;
  status: string;
  createdAt: string;
  bookData: BookFormData | null;
};

type ProjectRow = {
  id: string;
  payment_id: string | null;
  package_name: string;
  package_price: string;
  package_plan: string;
  status: string | null;
  created_at: string;
  book_data: BookFormData | null;
};

export default function DashboardPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoading(true);
        setMessage("");

        const user = await getCurrentUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          setMessage(error.message);
          return;
        }

        const supabaseOrders: SavedOrder[] = ((data || []) as ProjectRow[]).map(
          (project) => ({
            id: project.id,
            paymentId: project.payment_id || "unknown",
            packageName: project.package_name,
            packagePrice: project.package_price,
            packagePlan: project.package_plan,
            status: project.status || "ACTIVE",
            createdAt: project.created_at,
            bookData: project.book_data,
          })
        );

        setOrders(supabaseOrders);
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Dashboard failed to load."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, [router]);

  const activeProjects = orders.length;
  const completedBooks = orders.filter(
    (order) => order.status === "COMPLETED" || order.status === "completed"
  ).length;
  const downloadsReady = completedBooks;

  if (isLoading) {
    return (
      <main className="min-h-screen bg-black text-white px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <p className="text-gray-300">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <p className="text-sm uppercase tracking-[0.25em] text-gray-400 mb-3">
            User Workspace
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Dashboard</h1>
          <p className="text-lg text-gray-300 max-w-3xl">
            This is where users manage paid book projects, review progress,
            and track completed orders.
          </p>
        </div>

        {message && (
          <div className="mb-8 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            {message}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3 mb-10">
          <div className="border border-gray-700 rounded-2xl p-6 bg-gray-950">
            <p className="text-sm text-gray-400 mb-2">Active Projects</p>
            <h2 className="text-4xl font-bold">{activeProjects}</h2>
          </div>

          <div className="border border-gray-700 rounded-2xl p-6 bg-gray-950">
            <p className="text-sm text-gray-400 mb-2">Completed Books</p>
            <h2 className="text-4xl font-bold">{completedBooks}</h2>
          </div>

          <div className="border border-gray-700 rounded-2xl p-6 bg-gray-950">
            <p className="text-sm text-gray-400 mb-2">Downloads Ready</p>
            <h2 className="text-4xl font-bold">{downloadsReady}</h2>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[1.3fr_0.9fr]">
          <section className="border border-gray-700 rounded-2xl p-8 bg-gray-950">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">My Projects</h2>
              <Link
                href="/create-book"
                className="bg-white text-black px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                New Book
              </Link>
            </div>

            {orders.length === 0 ? (
              <div className="border border-dashed border-gray-700 rounded-xl p-10 text-center">
                <p className="text-gray-300 mb-3">No book projects yet.</p>
                <p className="text-sm text-gray-500 mb-6">
                  Once a payment is completed, the project will appear here.
                </p>
                <Link
                  href="/create-book"
                  className="inline-block border border-gray-600 px-5 py-3 rounded-lg font-semibold hover:bg-white hover:text-black transition"
                >
                  Start Your First Book
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/projects/${order.id}`}
                    className="block border border-gray-800 rounded-xl p-5 bg-black/30 hover:border-yellow-400/50 hover:bg-black/50 transition"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-xl font-semibold">
                          {order.bookData?.bookType || "Untitled Project"}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {order.packageName} • {order.packagePrice}
                        </p>
                      </div>

                      <div className="text-sm text-gray-300">
                        Status: <span className="font-semibold">{order.status}</span>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 text-sm">
                      <div>
                        <p className="text-gray-400 mb-1">Topic</p>
                        <p>{order.bookData?.topic || "Not provided"}</p>
                      </div>

                      <div>
                        <p className="text-gray-400 mb-1">Page Count</p>
                        <p>{order.bookData?.pageCount || "Not provided"}</p>
                      </div>

                      <div>
                        <p className="text-gray-400 mb-1">Author</p>
                        <p>{order.bookData?.authorName || "Not provided"}</p>
                      </div>

                      <div>
                        <p className="text-gray-400 mb-1">Images Needed</p>
                        <p>{order.bookData?.imagesNeeded || "Not provided"}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-800 text-xs text-gray-500">
                      Payment ID: {order.paymentId} <br />
                      Created: {new Date(order.createdAt).toLocaleString()}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <div className="border border-gray-700 rounded-2xl p-8 bg-gray-950">
              <h3 className="text-xl font-semibold mb-4">Project Status Flow</h3>
              <ul className="space-y-3 text-gray-300">
                <li>• Payment completed</li>
                <li>• Project saved to database</li>
                <li>• Outline generation</li>
                <li>• Manuscript drafting</li>
                <li>• Deliverables assembled</li>
                <li>• Ready for download</li>
              </ul>
            </div>

            <div className="border border-gray-700 rounded-2xl p-8 bg-gray-950">
              <h3 className="text-xl font-semibold mb-4">Downloads</h3>
              <p className="text-gray-300 mb-4">
                Final files like PDF, DOCX, and cover assets will appear here when
                your fulfillment system is connected.
              </p>
              <button className="w-full border border-gray-600 px-5 py-3 rounded-lg font-semibold text-gray-400 cursor-not-allowed">
                Downloads Coming Next
              </button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}