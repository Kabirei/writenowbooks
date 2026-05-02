"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setMessage("");

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Login successful. Redirecting...");
      router.push("/dashboard");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white px-6 py-16">
      <div className="max-w-md mx-auto border border-gray-700 rounded-2xl p-8 bg-gray-950">
        <p className="text-sm uppercase tracking-[0.25em] text-yellow-400 mb-4">
          Login
        </p>

        <h1 className="text-4xl font-bold mb-4">Welcome Back</h1>

        <p className="text-gray-300 mb-8">
          Log in to access your saved WriteNowBooks projects.
        </p>

        <div className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full rounded-lg border border-gray-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm text-gray-400">Password</label>

              <Link
                href="/reset-password"
                className="text-sm text-yellow-400 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full rounded-lg border border-gray-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
              placeholder="Your password"
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition disabled:opacity-50"
          >
            {isLoading ? "Logging In..." : "Log In"}
          </button>

          {message && (
            <div className="rounded-lg border border-gray-700 bg-black p-3 text-sm text-gray-300">
              {message}
            </div>
          )}
        </div>

        <p className="text-sm text-gray-400 mt-8 text-center">
          Need an account?{" "}
          <Link href="/signup" className="text-yellow-400 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}