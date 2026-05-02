"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    try {
      setIsLoading(true);
      setMessage("");

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      if (data.user) {
        await supabase.from("profiles").insert({
          id: data.user.id,
          email,
          full_name: fullName,
        });
      }

      setMessage("Account created. Check your email to confirm your account, then log in.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Signup failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white px-6 py-16">
      <div className="max-w-md mx-auto border border-gray-700 rounded-2xl p-8 bg-gray-950">
        <p className="text-sm uppercase tracking-[0.25em] text-yellow-400 mb-4">
          Create Account
        </p>

        <h1 className="text-4xl font-bold mb-4">Join WriteNowBooks</h1>

        <p className="text-gray-300 mb-8">
          Create your account to save projects, manage books, and unlock your AI workspace.
        </p>

        <div className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Full Name
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full rounded-lg border border-gray-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Password
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full rounded-lg border border-gray-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
              placeholder="Create a secure password"
            />
          </div>

          <button
            onClick={handleSignup}
            disabled={isLoading}
            className="w-full bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition disabled:opacity-50"
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>

          {message && (
            <div className="rounded-lg border border-gray-700 bg-black p-3 text-sm text-gray-300">
              {message}
            </div>
          )}
        </div>

        <p className="text-sm text-gray-400 mt-8 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-yellow-400 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}