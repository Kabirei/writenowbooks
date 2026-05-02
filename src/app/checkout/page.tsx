"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

type SquareResponse = {
  success: boolean;
  message?: string;
  paymentId?: string;
  status?: string;
  packagePlan?: string;
  packageName?: string;
  amount?: number;
};

declare global {
  interface Window {
    Square?: any;
  }
}

const packageData = {
  starter: {
    name: "Starter",
    price: "$99",
    length: "50 pages or less",
    images: "Not included",
    deliverables:
      "Manuscript, outline, author bio, back cover copy, PDF, DOCX",
  },
  enhanced: {
    name: "Enhanced",
    price: "$159",
    length: "50 pages or less",
    images: "Included",
    deliverables:
      "Manuscript, outline, author bio, back cover copy, PDF, DOCX, image generation",
  },
  premium: {
    name: "Premium Longform",
    price: "$249",
    length: "50+ pages",
    images: "Included where needed",
    deliverables:
      "Manuscript, outline, author bio, back cover copy, PDF, DOCX, long-form support, image generation",
  },
} as const;

type PackagePlan = keyof typeof packageData;

function isPackagePlan(value: string): value is PackagePlan {
  return value === "starter" || value === "enhanced" || value === "premium";
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawPlan = searchParams.get("plan") || "starter";
  const plan: PackagePlan = isPackagePlan(rawPlan) ? rawPlan : "starter";
  const upgradeProjectId = searchParams.get("upgradeProjectId");

  const [bookData, setBookData] = useState<BookFormData | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [squareReady, setSquareReady] = useState(false);

  const cardRef = useRef<any>(null);
  const initializedRef = useRef(false);

  const selectedPackage = packageData[plan];

  const squareAppId = process.env.NEXT_PUBLIC_SQUARE_APP_ID || "";
  const squareLocationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || "";
  const squareEnvironment =
    process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT || "sandbox";

  const squareScriptUrl =
    squareEnvironment === "production"
      ? "https://web.squarecdn.com/v1/square.js"
      : "https://sandbox.web.squarecdn.com/v1/square.js";

  useEffect(() => {
    const loadBookData = async () => {
      if (upgradeProjectId) {
        const orders: SavedOrder[] = JSON.parse(
          localStorage.getItem("writeNowOrders") || "[]"
        );

        const existingProject = orders.find(
          (order) => order.id === upgradeProjectId
        );

        setBookData(existingProject?.bookData || null);
        return;
      }

      const saved = localStorage.getItem("writeNowBookForm");

      if (saved) {
        setBookData(JSON.parse(saved));
      }
    };

    loadBookData();
  }, [upgradeProjectId]);

  useEffect(() => {
    let cancelled = false;

    const clearCardContainer = () => {
      const container = document.getElementById("card-container");
      if (container) container.innerHTML = "";
    };

    const initSquare = async () => {
      try {
        if (cancelled || initializedRef.current) return;

        if (!squareAppId || !squareLocationId) {
          setMessage("Missing Square Application ID or Location ID.");
          return;
        }

        if (!window.Square) {
          setMessage("Square SDK did not load.");
          return;
        }

        initializedRef.current = true;
        setSquareReady(false);
        clearCardContainer();

        const payments = await window.Square.payments(
          squareAppId,
          squareLocationId
        );

        const card = await payments.card();

        if (cancelled) return;

        await card.attach("#card-container");

        cardRef.current = card;
        setSquareReady(true);
      } catch (error) {
        initializedRef.current = false;
        setMessage(
          error instanceof Error
            ? error.message
            : "Failed to initialize Square payment form."
        );
      }
    };

    const existing = document.querySelector(
      `script[src="${squareScriptUrl}"]`
    );

    if (existing) {
      initSquare();
    } else {
      const script = document.createElement("script");
      script.src = squareScriptUrl;
      script.async = true;
      script.onload = () => initSquare();
      script.onerror = () => setMessage("Failed to load Square payment script.");
      document.body.appendChild(script);
    }

    return () => {
      cancelled = true;
      cardRef.current?.destroy?.().catch(() => {});
      cardRef.current = null;
      initializedRef.current = false;
      clearCardContainer();
    };
  }, [squareAppId, squareLocationId, squareScriptUrl, plan]);

  const saveProjectToSupabase = async (
    paymentId: string,
    status: string
  ): Promise<string> => {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("You must be logged in before payment can save a project.");
    }

    if (!bookData) {
      throw new Error(
        "Book form data was not found. Go back to Create Book and submit the form again."
      );
    }

    const { data, error } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        payment_id: paymentId,
        package_name: selectedPackage.name,
        package_price: selectedPackage.price,
        package_plan: plan,
        status,
        book_data: bookData,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase project save failed: ${error.message}`);
    }

    return data.id;
  };

  const saveLocalBackup = (
    projectId: string,
    paymentId: string,
    status: string
  ) => {
    const existingOrders: SavedOrder[] = JSON.parse(
      localStorage.getItem("writeNowOrders") || "[]"
    );

    const newOrder: SavedOrder = {
      id: projectId,
      paymentId,
      packageName: selectedPackage.name,
      packagePrice: selectedPackage.price,
      packagePlan: plan,
      status,
      createdAt: new Date().toISOString(),
      bookData,
    };

    localStorage.setItem(
      "writeNowOrders",
      JSON.stringify([newOrder, ...existingOrders])
    );

    localStorage.removeItem("writeNowBookForm");
  };

  const upgradeExistingProject = async (paymentId: string, status: string) => {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("You must be logged in before upgrading a project.");
    }

    if (!upgradeProjectId) {
      throw new Error("Missing upgrade project ID.");
    }

    const { error } = await supabase
      .from("projects")
      .update({
        payment_id: paymentId,
        package_name: selectedPackage.name,
        package_price: selectedPackage.price,
        package_plan: plan,
        status,
      })
      .eq("id", upgradeProjectId)
      .eq("user_id", user.id);

    if (error) {
      throw new Error(`Supabase upgrade failed: ${error.message}`);
    }

    const existingOrders: SavedOrder[] = JSON.parse(
      localStorage.getItem("writeNowOrders") || "[]"
    );

    const updatedOrders = existingOrders.map((order) => {
      if (order.id !== upgradeProjectId) return order;

      return {
        ...order,
        paymentId,
        packageName: selectedPackage.name,
        packagePrice: selectedPackage.price,
        packagePlan: plan,
        status,
      };
    });

    localStorage.setItem("writeNowOrders", JSON.stringify(updatedOrders));
  };

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      setMessage("");

      if (!cardRef.current) {
        setMessage("Card form is not ready yet.");
        return;
      }

      const user = await getCurrentUser();

      if (!user) {
        setMessage("Please log in before completing payment.");
        return;
      }

      if (!upgradeProjectId && !bookData) {
        setMessage(
          "Book details were not found. Please return to Create Book and submit the form again."
        );
        return;
      }

      const result = await cardRef.current.tokenize();

      if (result.status !== "OK" || !result.token) {
        setMessage(
          result.errors?.[0]?.message || "Failed to tokenize card details."
        );
        return;
      }

      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: result.token,
          packagePlan: plan,
        }),
      });

      const data: SquareResponse = await response.json();

      if (!data.success) {
        setMessage(data.message || "Payment failed.");
        return;
      }

      const paymentId = data.paymentId || "unknown";
      const status = data.status || "COMPLETED";

      if (upgradeProjectId) {
        await upgradeExistingProject(paymentId, status);
        setMessage("Upgrade completed. Redirecting to your project...");

        setTimeout(() => {
          router.push(`/projects/${upgradeProjectId}`);
        }, 1200);

        return;
      }

      const projectId = await saveProjectToSupabase(paymentId, status);
      saveLocalBackup(projectId, paymentId, status);

      setMessage("Payment completed and project saved. Redirecting to dashboard...");

      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unexpected payment error."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-3">
          {upgradeProjectId ? "Complete Your Upgrade" : "Complete Your Order"}
        </h1>

        <p className="text-gray-300 mb-10">
          Review your package and complete payment securely.
        </p>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <section className="space-y-8">
            <div className="border border-gray-700 rounded-2xl p-8 bg-gray-950">
              <h2 className="text-2xl font-semibold mb-6">
                Book Project Details
              </h2>

              {!bookData && !upgradeProjectId ? (
                <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-yellow-200">
                  Book details were not found. Please return to Create Book and
                  submit the form again before checkout.
                </div>
              ) : (
                <>
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Book Type</p>
                      <p className="font-medium">
                        {bookData?.bookType || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-400 mb-1">
                        Estimated Page Count
                      </p>
                      <p className="font-medium">
                        {bookData?.pageCount || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-400 mb-1">Tone / Style</p>
                      <p className="font-medium">
                        {bookData?.tone || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-400 mb-1">
                        Target Audience
                      </p>
                      <p className="font-medium">
                        {bookData?.audience || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-400 mb-1">Author Name</p>
                      <p className="font-medium">
                        {bookData?.authorName || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-400 mb-1">
                        Images Needed
                      </p>
                      <p className="font-medium">
                        {bookData?.imagesNeeded || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="text-sm text-gray-400 mb-2">
                      Book Topic / Main Idea
                    </p>
                    <div className="rounded-xl border border-gray-800 bg-black/40 p-4 text-gray-200">
                      {bookData?.topic || "Not provided"}
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="text-sm text-gray-400 mb-2">
                      Extra Instructions
                    </p>
                    <div className="rounded-xl border border-gray-800 bg-black/40 p-4 text-gray-200">
                      {bookData?.extraInstructions ||
                        "No extra instructions provided"}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="border border-gray-700 rounded-2xl p-8 bg-gray-950">
              <h2 className="text-2xl font-semibold mb-6">Package Summary</h2>

              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                  <span className="text-gray-300">Selected Package</span>
                  <span className="font-semibold">{selectedPackage.name}</span>
                </div>

                <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                  <span className="text-gray-300">Package Price</span>
                  <span className="font-semibold">{selectedPackage.price}</span>
                </div>

                <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                  <span className="text-gray-300">Book Length</span>
                  <span className="font-semibold">{selectedPackage.length}</span>
                </div>

                <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                  <span className="text-gray-300">Image Generation</span>
                  <span className="font-semibold">{selectedPackage.images}</span>
                </div>

                <div className="flex items-start justify-between gap-6">
                  <span className="text-gray-300">Included Deliverables</span>
                  <span className="font-semibold text-right max-w-sm">
                    {selectedPackage.deliverables}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <aside className="border border-gray-700 rounded-2xl p-8 bg-gray-950 h-fit">
            <h2 className="text-2xl font-semibold mb-6">Secure Payment</h2>

            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Package</span>
                <span className="font-semibold">{selectedPackage.name}</span>
              </div>

              <div className="border-t border-gray-800 pt-4 flex items-center justify-between text-lg">
                <span className="font-semibold">Total</span>
                <span className="font-bold">{selectedPackage.price}</span>
              </div>

              <div className="rounded-lg border border-gray-800 bg-black/40 p-3 text-xs text-gray-400">
                Payment mode:{" "}
                <span className="font-semibold uppercase">
                  {squareEnvironment}
                </span>
              </div>
            </div>

            <div
              id="card-container"
              className="mb-6 rounded-xl border border-gray-700 bg-black p-4 min-h-[90px]"
            />

            {!squareReady && (
              <p className="text-sm text-gray-400 mb-4">
                Loading secure card form...
              </p>
            )}

            <button
              onClick={handlePayment}
              disabled={isLoading || !squareReady}
              className="w-full bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition mb-4 disabled:opacity-50"
            >
              {isLoading ? "Processing..." : "Complete Payment"}
            </button>

            {message && (
              <div className="mt-4 rounded-lg border border-gray-700 bg-black p-3 text-sm text-gray-300 text-center">
                {message}
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}