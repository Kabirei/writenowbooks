import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const statusMessages: Record<string, { subject: string; headline: string; body: string }> = {
  Approved: {
    subject: "Your WriteNowBooks ESA Request Was Approved",
    headline: "Great news — your ESA request was approved.",
    body: "Your student's WriteNowBooks ESA request has been marked as approved. The next step is funding confirmation and project scheduling.",
  },
  Funded: {
  subject:
    "Your WriteNowBooks ESA Funding Was Received",

  headline:
    "Funding received.",

  body:
    "Your student's WriteNowBooks ESA funding has been received. Student access has been unlocked. Visit https://writenowbooks.com/student-login and enter the parent email used during registration to access the Student Dashboard and begin the project.",
},
  "Project Started": {
    subject: "Your WriteNowBooks Student Book Project Has Started",
    headline: "Your student's book project has begun.",
    body: "The WriteNowBooks Student Author Program has started your student's book creation project. We are excited to help bring the idea to life.",
  },
  Completed: {
    subject: "Your WriteNowBooks Student Book Project Is Complete",
    headline: "Your student's book project is complete.",
    body: "Your student's WriteNowBooks project has been marked complete. Thank you for allowing us to support this educational writing and authorship experience.",
  },
};

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

    const statusContent = statusMessages[invoiceStatus];

    if (!statusContent) {
      return NextResponse.json({
        success: true,
        message: "No parent email needed for this status.",
      });
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
      subject: statusContent.subject,
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
      ${statusContent.headline}
    </h1>

    <p style="color:#374151;font-size:15px;">
      WriteNowBooks Student Author Program
    </p>
  </div>

  <p>Hello ${esaRequest.parent_name || "Parent/Guardian"},</p>

  <p>
    ${statusContent.body}
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
    <p><strong>Project:</strong> ${esaRequest.project_idea || "Not provided"}</p>
  </div>

  <div style="
    background:#ecfdf5;
    padding:25px;
    border-radius:12px;
    margin-top:20px;
    border:1px solid #10b981;
  ">
    <h2 style="color:#047857;margin-top:0;">
      Current Status
    </h2>

    <p><strong>${invoiceStatus}</strong></p>
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
      message: "Status email sent successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to send status email.",
      },
      { status: 500 }
    );
  }
}