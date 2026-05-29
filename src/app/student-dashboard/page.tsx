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

type ESARequest = {
  parentEmail?: string;
  parentName?: string;
  studentName?: string;
  studentGrade?: string;
  packageChoice?: string;
  packagePrice?: string;
  invoiceNumber?: string;
  invoiceStatus?: string;
  projectIdea?: string;
  topic?: string;
  bookTitle?: string;
  pageCount?: string;
  bookType?: string;
  audience?: string;
  tone?: string;
  imagesNeeded?: string;
  bookDescription?: string;
  educationalPurpose?: string;
};

export default function Page() {
  const router = useRouter();

  const [studentAccess, setStudentAccess] = useState<boolean | null>(null);
  const [project, setProject] = useState<StudentProject | null>(null);
  const [esaRequest, setEsaRequest] = useState<ESARequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const request = localStorage.getItem("esaRequest");

    if (!request) {
      setStudentAccess(false);
      setLoading(false);
      return;
    }

    const parsed = JSON.parse(request);
    setEsaRequest(parsed);

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

        const realProjectIdea =
          access.projectIdea ||
          access.topic ||
          access.bookTitle ||
          parsed.projectIdea ||
          parsed.topic ||
          parsed.bookTitle ||
          "";

        const updatedESARequest: ESARequest = {
          ...parsed,

          parentName: access.parentName || parsed.parentName || "",
          parentEmail: access.parentEmail || parsed.parentEmail || "",

          studentName: access.studentName || parsed.studentName || "",
          studentGrade: access.studentGrade || parsed.studentGrade || "",

          packageChoice:
            access.packageChoice || parsed.packageChoice || "Starter",
          packagePrice: access.packagePrice || parsed.packagePrice || "",

          invoiceNumber: access.invoiceNumber || parsed.invoiceNumber || "",
          invoiceStatus: access.invoiceStatus || parsed.invoiceStatus || "",

          projectIdea: realProjectIdea,
          topic: realProjectIdea,
          bookTitle: realProjectIdea,

          pageCount: access.pageCount || parsed.pageCount || "",
          bookType:
            access.bookType || parsed.bookType || "Children's Book",
          audience:
            access.audience || parsed.audience || "Children (5–8)",
          tone:
            access.tone || parsed.tone || "Fun, Educational, Inspirational",
          imagesNeeded:
            access.imagesNeeded ||
            parsed.imagesNeeded ||
            "AI Illustrations on Every Page",

          bookDescription:
            access.bookDescription ||
            parsed.bookDescription ||
            realProjectIdea ||
            "",

          educationalPurpose:
            access.educationalPurpose ||
            parsed.educationalPurpose ||
            "Student writing, literacy, creative expression, book development, and structured educational projects.",
        };

        localStorage.setItem("esaRequest", JSON.stringify(updatedESARequest));
        setEsaRequest(updatedESARequest);

        if (projectData.success && projectData.project) {
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

  const beginProject = () => {
    if (esaRequest) {
      const starterForm = {
        bookType: esaRequest.bookType || "Children's Book",
        topic:
          esaRequest.projectIdea ||
          esaRequest.topic ||
          esaRequest.bookTitle ||
          "",
        pageCount: esaRequest.pageCount || "",
        tone: esaRequest.tone || "Fun, Educational, Inspirational",
        audience: esaRequest.audience || "Children (5–8)",
        authorName: esaRequest.studentName || "",
        imagesNeeded:
          esaRequest.imagesNeeded || "AI Illustrations on Every Page",
        extraInstructions:
          esaRequest.bookDescription ||
          esaRequest.projectIdea ||
          esaRequest.topic ||
          esaRequest.educationalPurpose ||
          "",
        accessType: "ESA Funded",
        paymentStatus: "ESA Funded",
      };

      localStorage.setItem("writeNowBookForm", JSON.stringify(starterForm));
    }

    router.push("/create-book?esa=true");
  };

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
                      style={{ width: getProgressWidth(project.status) }}
                    />
                  </div>

                  <p className="text-sm text-gray-400 mt-3">
                    {getProgressText(project.status)}
                  </p>
                </div>

                <button
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="bg-yellow-400 text-black font-bold px-6 py-3 rounded-xl"
                >
                  Continue Project
                </button>
              </>
            ) : (
              <>
                <p className="text-green-300 mb-3">
                  Funded ESA request found.
                </p>

                <p className="text-gray-300 mb-2">
                  Student: {esaRequest?.studentName || "Not provided"}
                </p>

                <p className="text-gray-300 mb-2">
                  Package: {esaRequest?.packageChoice || "Starter"}
                </p>

                <p className="text-gray-300 mb-6">
                  Book Idea:{" "}
                  {esaRequest?.projectIdea ||
                    esaRequest?.topic ||
                    esaRequest?.bookTitle ||
                    "Not provided"}
                </p>

                <button
                  onClick={beginProject}
                  className="bg-yellow-400 text-black font-bold px-6 py-3 rounded-xl"
                >
                  Begin Project
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}