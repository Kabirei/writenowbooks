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

    const { error } = await supabaseAdmin
      .from("esa_requests")
      .update({
        invoice_status: invoiceStatus,
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
      message: "Status updated successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to update ESA status.",
      },
      { status: 500 }
    );
  }
}