"use client";

import { useEffect, useState } from "react";

export default function Page() {
  const [studentAccess, setStudentAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const request = localStorage.getItem("esaRequest");

    if (!request) {
      setStudentAccess(false);
      setLoading(false);
      return;
    }

    const parsed = JSON.parse(request);

    fetch("/api/student/access", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parentEmail: parsed.parentEmail,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        setStudentAccess(Boolean(data.success && data.studentAccess));
      })
      .catch((error) => {
        console.error(error);
        setStudentAccess(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex justify-center items-center">
        Loading dashboard...
      </main>
    );
  }

  if (!studentAccess) {
    return (
      <main className="min-h-screen bg-black text-white px-6 py-16">
        <div className="max-w-3xl mx-auto bg-gray-950 border border-gray-700 rounded-2xl p-10 text-center">
          <h1 className="text-4xl font-bold mb-6">Funding Pending</h1>

          <p className="text-gray-300 text-lg">
            Your ESA request has not yet been funded. Once funding is confirmed,
            your student workspace will unlock automatically.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-16">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Student Dashboard</h1>

        <p className="text-gray-400 mb-10">
          Welcome to the WriteNowBooks Student Author Program.
        </p>

        <div className="space-y-6">
          <div className="bg-gray-950 border border-gray-700 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-3">My Book Project</h2>

            <p className="text-gray-400 mb-6">
              Your student project is active and ready. Continue into the
              existing WriteNowBooks creation workflow.
            </p>

            <button
              onClick={() => {
                window.location.href = "/create-book?esa=true";
              }}
              className="bg-yellow-400 text-black font-bold px-6 py-3 rounded-xl"
            >
              Begin Project
            </button>
          </div>

          <div className="bg-gray-950 border border-gray-700 rounded-2xl p-8">
  <h2 className="text-2xl font-bold mb-6">
    Quick Actions
  </h2>

  <div className="flex gap-4 flex-wrap">

    <button
      onClick={()=>{
        window.location.href="/dashboard";
      }}
      className="
      bg-blue-600
      px-5
      py-3
      rounded-xl
      font-bold
      "
    >
      Dashboard
    </button>

    <button
      onClick={()=>{
        window.location.href="/account";
      }}
      className="
      bg-purple-600
      px-5
      py-3
      rounded-xl
      font-bold
      "
    >
      Account
    </button>

  </div>
</div>
        </div>
      </div>
    </main>
  );
}