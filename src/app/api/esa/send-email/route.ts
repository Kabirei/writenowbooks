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
background:#111827;
color:white;
padding:40px;
border-radius:18px;
">

<div style="text-align:center;margin-bottom:30px">

<img
src="https://writenowbooks.com/images/writenowbooks-logo.png"
width="260"
/>

<h1 style="
color:#facc15;
margin-top:20px;
">
Arizona ESA Funding Request
</h1>

</div>

<p>
Hello ${parentName},
</p>

<p>
Your student's WriteNowBooks ESA request has been prepared successfully.
</p>

<div style="
background:#1f2937;
padding:25px;
border-radius:12px;
margin-top:25px;
">

<h2 style="color:#facc15">
Student Information
</h2>

<p><strong>Student:</strong> ${studentName}</p>

<p><strong>Grade:</strong> ${studentGrade}</p>

</div>


<div style="
background:#1f2937;
padding:25px;
border-radius:12px;
margin-top:20px;
">

<h2 style="color:#facc15">
Project Information
</h2>

<p>
<strong>Book Project:</strong>
${projectIdea || "Not provided"}
</p>

<p>
<strong>Package:</strong>
${packageChoice}
</p>

<p>
<strong>Amount:</strong>
${packagePrice}
</p>

</div>


<div style="
background:#1f2937;
padding:25px;
border-radius:12px;
margin-top:20px;
">

<h2 style="color:#facc15">
Invoice Information
</h2>

<p>
<strong>Invoice #:</strong>
${invoiceNumber}
</p>

<p>
<strong>Status:</strong>
Pending ESA Submission
</p>

</div>

<div style="
background:#0f766e;
padding:25px;
border-radius:12px;
margin-top:20px;
">

<h2>
Next Step
</h2>

<p>
Please log into your Arizona ESA/ClassWallet account and submit this invoice request for approval.
</p>

</div>

<div
style="
text-align:center;
margin-top:40px;
font-size:13px;
color:#9ca3af;
"
>

WriteNowBooks Student Author Program

<br/>

Student writing • literacy • authorship • creativity

</div>

</div>
`
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