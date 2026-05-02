"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      await supabase.auth.signOut();
      router.push("/login");
    };

    logout();
  }, [router]);

  return (
    <main className="min-h-screen bg-black text-white px-6 py-16">
      <div className="max-w-xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">Logging out...</h1>
        <p className="text-gray-300">Please wait while we sign you out.</p>
      </div>
    </main>
  );
}