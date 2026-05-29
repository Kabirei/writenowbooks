import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parentEmail = String(body.parentEmail || "").trim().toLowerCase();

    if (!parentEmail) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing parent email.",
          studentAccess: false,
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("esa_requests")
      .select("*")
      .eq("parent_email", parentEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({
        success: false,
        message: "No ESA request found.",
        studentAccess: false,
      });
    }

    return NextResponse.json({
      success: true,
      studentAccess: Boolean(data.student_access),
      invoiceStatus: data.invoice_status || "",

      id: data.id || "",

      parentName: data.parent_name || "",
      parentEmail: data.parent_email || "",

      studentName: data.student_name || "",
      studentGrade: data.student_grade || "",

      packageChoice: data.package_choice || "Starter",
      packagePrice: data.package_price || "",

      invoiceNumber: data.invoice_number || "",

      bookTitle: data.project_idea || "",
      topic: data.project_idea || "",
      projectIdea: data.project_idea || "",

      bookDescription: data.project_idea || "",
      educationalPurpose:
        "Student writing, literacy, creative expression, book development, and structured educational projects.",

      bookType: "Children's Book",
      audience: "Children (5–8)",
      tone: "Fun, Educational, Inspirational",
      imagesNeeded: "AI Illustrations on Every Page",

      pageCount: "",
      createdAt: data.created_at || "",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to verify student access.",
        studentAccess: false,
      },
      { status: 500 }
    );
  }
}