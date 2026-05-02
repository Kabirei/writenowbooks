"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
};

export default function AccountPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAccount = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/login");
          return;
        }

        setEmail(user.email || "");

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) {
          setMessage(profileError.message);
        } else {
          setProfile(profileData);
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Account failed to load.");
      } finally {
        setIsLoading(false);
      }
    };

    loadAccount();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-black text-white px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-300">Loading account...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-yellow-400 mb-4">
              Account
            </p>

            <h1 className="text-5xl font-bold mb-4">Your WriteNowBooks Account</h1>

            <p className="text-gray-300">
              Manage your account and continue building your books.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="border border-gray-600 px-5 py-3 rounded-lg font-semibold hover:bg-white hover:text-black transition"
          >
            Log Out
          </button>
        </div>

        {message && (
          <div className="mb-8 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            {message}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <div className="border border-gray-700 rounded-2xl p-8 bg-gray-950">
            <h2 className="text-2xl font-semibold mb-6">Profile</h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Full Name</p>
                <p className="font-medium">
                  {profile?.full_name || "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-1">Email</p>
                <p className="font-medium">{email || "Not provided"}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-1">Account ID</p>
                <p className="font-medium break-words">
                  {profile?.id || "Not available"}
                </p>
              </div>
            </div>
          </div>

          <div className="border border-yellow-500/30 rounded-2xl p-8 bg-yellow-500/10">
            <h2 className="text-2xl font-semibold mb-6">Workspace</h2>

            <p className="text-gray-300 mb-6">
              Continue to your dashboard to view saved projects and manage your manuscripts.
            </p>

            <Link
              href="/dashboard"
              className="inline-block bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}