import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { parentEmail } = body;

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
      .select("student_access, invoice_status")
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
      invoiceStatus: data.invoice_status,
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