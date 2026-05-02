"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function UpdatePasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdatePassword = async () => {
    try {
      setIsLoading(true);
      setMessage("");

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Password updated successfully. Redirecting to login...");

      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Password update failed."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white px-6 py-16">
      <div className="max-w-md mx-auto border border-gray-700 rounded-2xl p-8 bg-gray-950">
        <p className="text-sm uppercase tracking-[0.25em] text-yellow-400 mb-4">
          Update Password
        </p>

        <h1 className="text-4xl font-bold mb-4">Create a New Password</h1>

        <p className="text-gray-300 mb-8">
          Enter a new secure password for your WriteNowBooks account.
        </p>

        <div className="space-y-5">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="w-full rounded-lg border border-gray-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
            placeholder="New password"
          />

          <button
            onClick={handleUpdatePassword}
            disabled={isLoading || password.length < 6}
            className="w-full bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition disabled:opacity-50"
          >
            {isLoading ? "Updating..." : "Update Password"}
          </button>

          {message && (
            <div className="rounded-lg border border-gray-700 bg-black p-3 text-sm text-gray-300">
              {message}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}