import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { parentEmail, invoiceNumber } = body;

    if (!parentEmail || !invoiceNumber) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing parent email or invoice number.",
        },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("esa_requests")
      .update({
        invoice_number: invoiceNumber,
        invoice_status: "Pending ESA Submission",
      })
      .eq("parent_email", parentEmail);

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
      message: "Invoice number saved successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Unable to save invoice.",
      },
      { status: 500 }
    );
  }
}