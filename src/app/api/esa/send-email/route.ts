import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "Missing RESEND_API_KEY." },
        { status: 500 }
      );
    }

    const body = await request.json();

    const {
      parentName,
      parentEmail,
      studentName,
      studentGrade,
      projectIdea,
      packageChoice,
      packagePrice,
      invoiceNumber,
    } = body;

    if (!parentEmail) {
      return NextResponse.json(
        { success: false, message: "Missing parent email." },
        { status: 400 }
      );
    }

    const resend = new Resend(apiKey);

    await resend.emails.send({
      from: "WriteNowBooks ESA <esa@writenowbooks.com>",
      to: parentEmail,
      replyTo: "WriteNowBooks1@gmail.com",
      subject: `WriteNowBooks ESA Invoice ${invoiceNumber || ""}`,
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

  <p>Hello ${parentName || "Parent/Guardian"},</p>

  <p>
    Your student's WriteNowBooks ESA invoice details have been prepared.
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

    <p><strong>Student:</strong> ${studentName || "Not provided"}</p>
    <p><strong>Grade:</strong> ${studentGrade || "Not provided"}</p>
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

    <p><strong>Book Project:</strong> ${projectIdea || "Not provided"}</p>
    <p><strong>Package:</strong> ${packageChoice || "Not provided"}</p>
    <p><strong>Amount:</strong> ${packagePrice || "Not provided"}</p>
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

    <p><strong>Invoice #:</strong> ${invoiceNumber || "Pending"}</p>
    <p><strong>Status:</strong> Pending ESA Submission</p>
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
    margin-top:25px;
    padding:20px;
    border-radius:12px;
    background:#fffbeb;
    border:1px solid #facc15;
  ">
    <h3 style="color:#b45309;margin-top:0;">
      ESA Progress
    </h3>

    <p>✓ ESA request received</p>
    <p>✓ Invoice details prepared</p>
    <p>⏳ Pending ESA submission</p>
    <p>□ ESA review</p>
    <p>□ Funding approval</p>
    <p>□ Student project begins</p>
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

    return NextResponse.json({
      success: true,
      message: "ESA email sent successfully.",
    });
  } catch (error) {
    console.error("ESA email error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Unable to send ESA email.",
      },
      { status: 500 }
    );
  }
}