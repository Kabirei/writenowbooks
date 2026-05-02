"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    try {
      setIsLoading(true);
      setMessage("");

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "http://localhost:3000/update-password",
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Password reset email sent. Check your inbox.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Password reset failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white px-6 py-16">
      <div className="max-w-md mx-auto border border-gray-700 rounded-2xl p-8 bg-gray-950">
        <p className="text-sm uppercase tracking-[0.25em] text-yellow-400 mb-4">
          Reset Password
        </p>

        <h1 className="text-4xl font-bold mb-4">Recover Your Account</h1>

        <p className="text-gray-300 mb-8">
          Enter your email and we’ll send a password reset link.
        </p>

        <div className="space-y-5">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="w-full rounded-lg border border-gray-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
            placeholder="you@example.com"
          />

          <button
            onClick={handleReset}
            disabled={isLoading}
            className="w-full bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition disabled:opacity-50"
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </button>

          {message && (
            <div className="rounded-lg border border-gray-700 bg-black p-3 text-sm text-gray-300">
              {message}
            </div>
          )}
        </div>

        <p className="text-sm text-gray-400 mt-8 text-center">
          Remembered your password?{" "}
          <Link href="/login" className="text-yellow-400 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}