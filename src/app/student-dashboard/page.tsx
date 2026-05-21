"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type StudentProject = {
  id: string;
  package_name: string;
  status: string;
  created_at: string;
  book_data?: {
    topic?: string;
  };
};

export default function Page() {
  const router = useRouter();

  const [studentAccess, setStudentAccess] = useState<boolean | null>(null);
  const [project, setProject] = useState<StudentProject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const request = localStorage.getItem("esaRequest");

    if (!request) {
      setStudentAccess(false);
      setLoading(false);
      return;
    }

    const parsed = JSON.parse(request);

    Promise.all([
      fetch("/api/student/access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parentEmail: parsed.parentEmail,
        }),
      }),

      fetch("/api/student/project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parentEmail: parsed.parentEmail,
        }),
      }),
    ])
      .then(async ([accessRes, projectRes]) => {
        const access = await accessRes.json();
        const projectData = await projectRes.json();

        setStudentAccess(Boolean(access.success && access.studentAccess));

        if (projectData.success) {
          setProject(projectData.project);
        }
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
            Your ESA request has not yet been funded.
          </p>
        </div>
      </main>
    );
  }

  const getProgressWidth = (status: string) => {
    if (status === "ACTIVE") return "25%";
    if (status === "OUTLINE COMPLETE") return "45%";
    if (status === "WRITING") return "70%";
    if (status === "ILLUSTRATIONS") return "85%";
    if (status === "COMPLETED") return "100%";
    return "10%";
  };

  const getProgressText = (status: string) => {
    if (status === "ACTIVE") return "Project started";
    if (status === "OUTLINE COMPLETE") return "Outline complete";
    if (status === "WRITING") return "Writing in progress";
    if (status === "ILLUSTRATIONS") return "Illustrations in progress";
    if (status === "COMPLETED") return "Book complete";
    return "Preparing project";
  };

  return (
    <main className="min-h-screen bg-black text-white px-6 py-16">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Student Dashboard</h1>

        <p className="text-gray-400 mb-10">
          Welcome to WriteNowBooks Student Author Program
        </p>

        <div className="space-y-6">
          <div className="bg-gray-950 border border-gray-700 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">My Book Project</h2>

            {project ? (
              <>
                <p className="text-gray-300 mb-2">
                  Title: {project.book_data?.topic || "Untitled Project"}
                </p>

                <p className="text-gray-300 mb-2">
                  Package: {project.package_name}
                </p>

                <div className="mb-6">
                  <p className="text-green-300 mb-3">
                    Status: {project.status}
                  </p>

                  <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-yellow-400 h-4 rounded-full transition-all duration-700"
                      style={{
                        width: getProgressWidth(project.status),
                      }}
                    />
                  </div>

                  <p className="text-sm text-gray-400 mt-3">
                    {getProgressText(project.status)}
                  </p>
                </div>

                <button
                  onClick={() => {
                    router.push(`/projects/${project.id}`);
                  }}
                  className="bg-yellow-400 text-black font-bold px-6 py-3 rounded-xl"
                >
                  Continue Project
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-400 mb-6">No project found.</p>

                <button
                  onClick={() => {
                    router.push("/create-book?esa=true");
                  }}
                  className="bg-yellow-400 text-black font-bold px-6 py-3 rounded-xl"
                >
                  Begin Project
                </button>
              </>
            )}
          </div>

          <div className="bg-gray-950 border border-gray-700 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>

            <div className="flex gap-4 flex-wrap">
              <button
                onClick={() => {
                  router.push("/dashboard");
                }}
                className="bg-blue-600 px-5 py-3 rounded-xl font-bold"
              >
                Dashboard
              </button>

              <button
                onClick={() => {
                  router.push("/account");
                }}
                className="bg-purple-600 px-5 py-3 rounded-xl font-bold"
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