import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing RESEND_API_KEY.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const { id } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing ESA request ID.",
        },
        { status: 400 }
      );
    }

    const { data: esaRequest, error } = await supabaseAdmin
      .from("esa_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !esaRequest) {
      return NextResponse.json(
        {
          success: false,
          message: error?.message || "ESA request not found.",
        },
        { status: 404 }
      );
    }

    if (!esaRequest.parent_email) {
      return NextResponse.json(
        {
          success: false,
          message: "Parent email missing.",
        },
        { status: 400 }
      );
    }

    const resend = new Resend(apiKey);

    await resend.emails.send({
      from: "WriteNowBooks ESA <esa@writenowbooks.com>",
      to: esaRequest.parent_email,
      replyTo: "WriteNowBooks1@gmail.com",
      subject: `WriteNowBooks ESA Invoice ${esaRequest.invoice_number || ""}`,
      html: `
<div style="
  max-width:700px;
  margin:auto;
  font-family:Arial,sans-serif;
  background:#ffffff;
  color:#111111;
  padding:40px;
  border-radius:18px;
  border:1px solid #e5e7eb;
  box-shadow:0 4px 18px rgba(0,0,0,.08);
">

  <div style="text-align:center;margin-bottom:30px;">
    <img
      src="https://writenowbooks.com/images/writenowbooks-logo.png"
      alt="WriteNowBooks Logo"
      style="
        width:260px;
        max-width:100%;
        height:auto;
        display:block;
        margin:auto;
      "
    />

    <h1 style="color:#d97706;margin-top:25px;">
      Arizona ESA Funding Request
    </h1>

    <p style="color:#374151;font-size:15px;">
      WriteNowBooks Student Author Program
    </p>
  </div>

  <p>Hello ${esaRequest.parent_name || "Parent/Guardian"},</p>

  <p>
    This is a resent copy of your student's WriteNowBooks ESA invoice details.
    Please use this information with your Arizona ESA/ClassWallet process.
  </p>

  <div style="
    background:#f9fafb;
    padding:25px;
    border-radius:12px;
    margin-top:25px;
    border:1px solid #e5e7eb;
  ">
    <h2 style="color:#d97706;margin-top:0;">
      Student Information
    </h2>

    <p><strong>Student:</strong> ${esaRequest.student_name || "Not provided"}</p>
    <p><strong>Grade:</strong> ${esaRequest.student_grade || "Not provided"}</p>
  </div>

  <div style="
    background:#f9fafb;
    padding:25px;
    border-radius:12px;
    margin-top:20px;
    border:1px solid #e5e7eb;
  ">
    <h2 style="color:#d97706;margin-top:0;">
      Project Information
    </h2>

    <p><strong>Book Project:</strong> ${esaRequest.project_idea || "Not provided"}</p>
    <p><strong>Package:</strong> ${esaRequest.package_choice || "Not provided"}</p>
    <p><strong>Amount:</strong> ${esaRequest.package_price || "Not provided"}</p>
  </div>

  <div style="
    background:#f9fafb;
    padding:25px;
    border-radius:12px;
    margin-top:20px;
    border:1px solid #e5e7eb;
  ">
    <h2 style="color:#d97706;margin-top:0;">
      Invoice Information
    </h2>

    <p><strong>Invoice #:</strong> ${esaRequest.invoice_number || "Not assigned"}</p>
    <p><strong>Status:</strong> ${esaRequest.invoice_status || "Pending ESA Submission"}</p>
  </div>

  <div style="
    background:#ecfdf5;
    padding:25px;
    border-radius:12px;
    margin-top:20px;
    border:1px solid #10b981;
  ">
    <h2 style="color:#047857;margin-top:0;">
      Next Step
    </h2>

    <p>
      Log into your Arizona ESA/ClassWallet account and submit this invoice
      request for approval.
    </p>
  </div>

  <div style="
    text-align:center;
    margin-top:40px;
    font-size:13px;
    color:#6b7280;
  ">
    WriteNowBooks Student Author Program
    <br />
    Student writing • literacy • authorship • creativity
    <br />
    WriteNowBooks.com
  </div>

</div>
      `,
    });

    await supabaseAdmin
      .from("esa_requests")
      .update({
        email_sent: true,
      })
      .eq("id", id);

    return NextResponse.json({
      success: true,
      message: "Invoice email resent successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to resend invoice email.",
      },
      { status: 500 }
    );
  }
}