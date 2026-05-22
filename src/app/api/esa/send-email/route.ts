import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success:false,message:"Missing RESEND_API_KEY." },
        { status:500 }
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
      invoiceNumber,
      subtotal,
      processingFee,
      packagePrice
    } = body;

    if (!parentEmail) {
      return NextResponse.json(
        { success:false,message:"Missing parent email." },
        { status:400 }
      );
    }

    const resend = new Resend(apiKey);

    const today = new Date();

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth()+1);

    await resend.emails.send({

      from:
      "WriteNowBooks ESA <esa@writenowbooks.com>",

      to:
      parentEmail,

      replyTo:
      "WriteNowBooks1@gmail.com",

      subject:
      `WriteNowBooks ESA Invoice ${invoiceNumber||""}`,

html:`

<div style="
max-width:800px;
margin:auto;
font-family:Arial,sans-serif;
background:#fff;
padding:40px;
border-radius:18px;
border:1px solid #e5e7eb;
">

<div style="text-align:center">

<img
src="https://writenowbooks.com/images/writenowbooks-logo.png"
style="
width:260px;
margin:auto;
display:block;
"
/>

<h1 style="
color:#d97706;
margin-top:25px;
">
ESA / ClassWallet Invoice
</h1>

</div>

<p>

Hello ${parentName||"Parent/Guardian"},

</p>

<p>

Your WriteNowBooks ESA/ClassWallet invoice has been prepared.

Please use the information below when submitting through Arizona ESA.

</p>


<div style="
background:#f9fafb;
padding:25px;
border-radius:12px;
margin-top:20px;
">

<h2 style="color:#d97706">

Vendor Information

</h2>

<p><strong>Vendor:</strong> WriteNowBooks.com</p>

<p><strong>Address:</strong>
51 E Monroe Ave Suite 114
Buckeye AZ 85326
</p>

<p><strong>Phone:</strong>
602-374-0228
</p>

<p><strong>Email:</strong>
WriteNowBooks1@gmail.com
</p>

<p><strong>Website:</strong>
www.WriteNowBooks.com
</p>

</div>


<div style="
background:#f9fafb;
padding:25px;
border-radius:12px;
margin-top:20px;
">

<h2 style="color:#d97706">

Student Information

</h2>

<p><strong>Student:</strong>
${studentName}
</p>

<p><strong>Grade:</strong>
${studentGrade}
</p>

<p><strong>Project:</strong>
${projectIdea}
</p>

</div>


<div style="
background:#f9fafb;
padding:25px;
border-radius:12px;
margin-top:20px;
">

<h2 style="color:#d97706">

Invoice Information

</h2>

<p>
<strong>Invoice #:</strong>
${invoiceNumber}
</p>

<p>
<strong>Invoice Date:</strong>
${today.toLocaleDateString()}
</p>

<p>
<strong>Service Start:</strong>
${today.toLocaleDateString()}
</p>

<p>
<strong>Service End:</strong>
${endDate.toLocaleDateString()}
</p>

<p>
<strong>Status:</strong>
Pending ESA Submission
</p>

</div>


<div style="
background:#f9fafb;
padding:25px;
border-radius:12px;
margin-top:20px;
">

<h2 style="color:#d97706">

Itemized Charges

</h2>

<p>

1. ${packageChoice}
WriteNowBooks Student Author Program

</p>

<p>

Program Fee:
${subtotal}

</p>

<p>

ClassWallet Processing Fee (2%):
${processingFee}

</p>

<hr>

<p style="
font-size:22px;
font-weight:bold;
color:#047857;
">

Total:
${packagePrice}

</p>

</div>


<div style="
background:#ecfdf5;
padding:25px;
border-radius:12px;
margin-top:20px;
border:1px solid #10b981;
">

<h2 style="color:#047857">

Next Step

</h2>

<p>

Log into Arizona ESA/ClassWallet and submit this invoice.

</p>

</div>

<div style="
margin-top:30px;
font-size:13px;
text-align:center;
color:#6b7280;
">

WriteNowBooks Student Author Program

<br>

Student writing • literacy • authorship • creativity

<br>

www.WriteNowBooks.com

</div>

</div>
`
    });

    return NextResponse.json({
      success:true
    });

  } catch(error){

    console.error(
      "ESA email error:",
      error
    );

    return NextResponse.json(
      {
        success:false,
        message:
        error instanceof Error
        ? error.message
        :"Unable to send ESA email."
      },
      {status:500}
    );
  }
}