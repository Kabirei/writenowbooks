import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { id, invoiceStatus } = body;

    if (!id || !invoiceStatus) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing request ID or invoice status.",
        },
        { status: 400 }
      );
    }

    const shouldUnlock = invoiceStatus === "Funded";

    const { error } = await supabaseAdmin
      .from("esa_requests")
      .update({
        student_access: shouldUnlock,
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      studentAccess: shouldUnlock,
      message: shouldUnlock
        ? "Student access unlocked."
        : "Student access locked.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to update student access.",
      },
      { status: 500 }
    );
  }
}