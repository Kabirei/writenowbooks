"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  const [parentEmail, setParentEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/student/access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parentEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to verify access.");
      }

      localStorage.setItem(
        "esaRequest",
        JSON.stringify({
          parentEmail,
          packageChoice: data.packageChoice || "",
          packagePrice: data.packagePrice || "",
          studentName: data.studentName || "",
        })
      );

      router.push("/student-dashboard");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to verify access."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-gray-950 border border-gray-700 rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-center mb-4">
          Student Access
        </h1>

        <p className="text-gray-400 text-center mb-6">
          Enter the parent email used for your ESA request.
        </p>

        <input
          type="email"
          value={parentEmail}
          onChange={(e) => setParentEmail(e.target.value)}
          placeholder="Parent email"
          className="w-full p-4 rounded-lg bg-gray-900 border border-gray-700 mb-5"
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-yellow-400 text-black font-bold p-4 rounded-lg disabled:opacity-60"
        >
          {loading ? "Checking..." : "Enter Student Dashboard"}
        </button>

        {message && (
          <p className="mt-5 text-red-400 text-center">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}