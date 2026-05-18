"use client";

import { useState } from "react";

export default function ESARequestPage() {
  const [formData, setFormData] = useState({
    parentName: "",
    parentEmail: "",
    studentName: "",
    studentGrade: "",
    projectIdea: "",
    packageChoice: "Starter",
  });

  const [step, setStep] =
    useState<"start" | "details" | "summary">("start");

  const [message, setMessage] = useState("");
  const [invoicePrepared, setInvoicePrepared] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);
  const [invoicePdfReady, setInvoicePdfReady] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const packagePrices: Record<string, string> = {
    Starter: "$99",
    Enhanced: "$159",
    "Premium Longform": "$249",
  };

  const getPackagePrice = () => {
    return packagePrices[formData.packageChoice] || "$99";
  };

  const generateInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `ESA-${year}-${random}`;
  };

  const ensureInvoiceNumber = () => {
    if (invoiceNumber) return invoiceNumber;

    const generatedInvoiceNumber = generateInvoiceNumber();
    setInvoiceNumber(generatedInvoiceNumber);

    return generatedInvoiceNumber;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleStart = () => {
    setStep("details");
    setMessage("");
  };

  const handleSubmit = async () => {
  try {
    localStorage.setItem(
      "esaRequest",
      JSON.stringify(formData)
    );

    const response = await fetch(
      "/api/esa/save-request",
      {
        method: "POST",
        headers: {
          "Content-Type":"application/json",
        },
        body: JSON.stringify({
          parentName: formData.parentName,
          parentEmail: formData.parentEmail,
          studentName: formData.studentName,
          studentGrade: formData.studentGrade,
          projectIdea: formData.projectIdea,
          packageChoice: formData.packageChoice,
          packagePrice: getPackagePrice(),
        }),
      }
    );

    const data =
      await response.json();

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data.message ||
        "Unable to save ESA request."
      );
    }

    setMessage(
      "ESA request saved successfully."
    );

    setStep("summary");

  } catch(error){

    console.error(
      "SAVE REQUEST ERROR:",
      error
    );

    setMessage(
      error instanceof Error
      ? error.message
      : "Unable to save ESA request."
    );
  }
};

  const handlePrepareInvoice = () => {
    const activeInvoiceNumber = ensureInvoiceNumber();

    const updatedRequest = {
      ...formData,
      invoicePrepared: true,
      invoiceNumber: activeInvoiceNumber,
      invoiceStatus: "Pending ESA Submission",
      packagePrice: getPackagePrice(),
      status: "Invoice details prepared for ESA funding submission",
    };

    localStorage.setItem("esaRequest", JSON.stringify(updatedRequest));

    setInvoicePrepared(true);
    setMessage("Invoice details prepared successfully.");
  };

  const loadLogo = () => {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const logo = new Image();
      logo.src = "/images/writenowbooks-logo.png";
      logo.onload = () => resolve(logo);
      logo.onerror = reject;
    });
  };

  const handleGeneratePDF = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    try {
      const logo = await loadLogo();
      doc.addImage(logo, "PNG", 55, 10, 100, 32);
    } catch {
      // Continue without logo if image fails.
    }

    doc.setFontSize(18);
    doc.text("WriteNowBooks ESA Funding Request", 27, 58);

    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 72);

    doc.setFontSize(13);
    doc.text("Request Details", 20, 90);

    doc.setFontSize(11);
    doc.text(`Parent / Guardian: ${formData.parentName}`, 20, 103);
    doc.text(`Parent Email: ${formData.parentEmail || "Not provided"}`, 20, 114);
    doc.text(`Student: ${formData.studentName}`, 20, 125);
    doc.text(`Grade: ${formData.studentGrade}`, 20, 136);
    doc.text(`Selected Package: ${formData.packageChoice}`, 20, 147);
    doc.text(`Package Price: ${getPackagePrice()}`, 20, 158);

    doc.text("Book Project Idea:", 20, 174);
    doc.text(formData.projectIdea || "Not provided", 20, 183, {
      maxWidth: 165,
    });

    doc.setFontSize(13);
    doc.text("Program Information", 20, 216);

    doc.setFontSize(11);
    doc.text("Program: WriteNowBooks Student Author Program", 20, 229);
    doc.text("Educational Purpose:", 20, 242);
    doc.text(
      "Student writing, literacy, creative expression, book development, structured educational projects, and guided student authorship.",
      20,
      251,
      { maxWidth: 165 }
    );

    doc.setFontSize(9);
    doc.text(
      "WriteNowBooks.com | Student Writing & Book Creation Curriculum Tool",
      20,
      285
    );

    doc.save("ESA-Funding-Request.pdf");

    setPdfReady(true);
    setMessage("ESA funding request PDF generated successfully.");
  };

  const handleGenerateInvoicePDF = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    const activeInvoiceNumber = ensureInvoiceNumber();

    try {
      const logo = await loadLogo();
      doc.addImage(logo, "PNG", 55, 10, 100, 32);
    } catch {
      // Continue without logo if image fails.
    }

    doc.setFontSize(20);
    doc.text("ESA Invoice", 20, 58);

    doc.setFontSize(11);
    doc.text(`Invoice #: ${activeInvoiceNumber}`, 20, 74);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 85);
    doc.text("Status: Pending ESA Submission", 20, 96);

    doc.setFontSize(13);
    doc.text("Bill To", 20, 116);

    doc.setFontSize(11);
    doc.text(`Parent / Guardian: ${formData.parentName}`, 20, 129);
    doc.text(`Parent Email: ${formData.parentEmail || "Not provided"}`, 20, 140);
    doc.text(`Student: ${formData.studentName}`, 20, 151);
    doc.text(`Grade: ${formData.studentGrade}`, 20, 162);

    doc.setFontSize(13);
    doc.text("Service Details", 20, 184);

    doc.setFontSize(11);
    doc.text("Program: WriteNowBooks Student Author Program", 20, 197);
    doc.text(`Package: ${formData.packageChoice}`, 20, 208);
    doc.text(`Amount: ${getPackagePrice()}`, 20, 219);

    doc.text("Educational Purpose:", 20, 236);
    doc.text(
      "Student writing, literacy, creative expression, book development, structured educational projects, and guided student authorship.",
      20,
      245,
      { maxWidth: 165 }
    );

    doc.setFontSize(14);
    doc.text(`Total Due: ${getPackagePrice()}`, 20, 270);

    doc.setFontSize(9);
    doc.text(
      "WriteNowBooks.com | Student Writing & Book Creation Curriculum Tool",
      20,
      285
    );

    doc.save(`${activeInvoiceNumber}-WriteNowBooks-ESA-Invoice.pdf`);

    setInvoicePdfReady(true);
    setInvoicePrepared(true);
    setMessage("ESA invoice PDF generated successfully.");
  };

  const handleEmailParent = async () => {
    if (!formData.parentEmail) {
      setMessage("Please enter a parent email before sending the email.");
      return;
    }

    const activeInvoiceNumber = ensureInvoiceNumber();

    setIsSendingEmail(true);
    setMessage("Sending ESA email to parent...");

    try {
      const response = await fetch("/api/esa/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parentName: formData.parentName,
          parentEmail: formData.parentEmail,
          studentName: formData.studentName,
          studentGrade: formData.studentGrade,
          projectIdea: formData.projectIdea,
          packageChoice: formData.packageChoice,
          packagePrice: getPackagePrice(),
          invoiceNumber: activeInvoiceNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to send ESA email.");
      }

      const updatedRequest = {
        ...formData,
        invoicePrepared: true,
        invoiceNumber: activeInvoiceNumber,
        invoiceStatus: "Pending ESA Submission",
        emailSent: true,
        emailedAt: new Date().toISOString(),
        packagePrice: getPackagePrice(),
        status: "ESA invoice email sent to parent",
      };

      localStorage.setItem("esaRequest", JSON.stringify(updatedRequest));

      setInvoicePrepared(true);
      setEmailSent(true);
      setMessage("ESA invoice email sent successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to send ESA email."
      );
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Arizona ESA Request</h1>

        <p className="text-gray-300 mb-10">
          Begin your ESA funding request before making a payment.
        </p>

        <div className="mb-8 border border-gray-700 rounded-xl p-6 bg-gray-950">
          <h2 className="text-xl font-semibold mb-4">ESA Request Workflow</h2>

          <div className="space-y-3 text-gray-300">
            <p>{step === "start" ? "⏳" : "✓"} Step 1: Start ESA Request</p>

            <p>
              {step === "details"
                ? "⏳"
                : step === "summary"
                ? "✓"
                : "□"}{" "}
              Step 2: Provide parent, student, and project details
            </p>

            <p>
              {invoicePrepared ? "✓" : "□"} Step 3: Prepare invoice details for
              ESA funding submission
            </p>

            <p>{emailSent ? "✓" : "□"} Step 4: ESA invoice email sent</p>

            <p>□ Step 5: ESA payment approved or completed</p>

            <p>□ Step 6: Student book project begins</p>
          </div>
        </div>

        {step === "start" && (
          <div className="border border-yellow-500 rounded-xl p-8 bg-yellow-500/10">
            <h2 className="text-2xl font-semibold mb-4">Start ESA Request</h2>

            <p className="text-gray-300 mb-6">
              Start here if you are an Arizona homeschool family seeking to use
              ESA funding.
            </p>

            <button
              onClick={handleStart}
              className="bg-yellow-400 text-black px-8 py-4 rounded-xl font-bold"
            >
              Start ESA Request
            </button>
          </div>
        )}

        {step === "details" && (
          <div className="space-y-6">
            <div>
              <label className="block mb-2">Parent / Guardian Name</label>

              <input
                name="parentName"
                value={formData.parentName}
                onChange={handleChange}
                className="w-full p-4 rounded-lg bg-gray-900 border border-gray-700"
              />
            </div>

            <div>
              <label className="block mb-2">Parent Email</label>

              <input
                name="parentEmail"
                type="email"
                value={formData.parentEmail}
                onChange={handleChange}
                className="w-full p-4 rounded-lg bg-gray-900 border border-gray-700"
              />
            </div>

            <div>
              <label className="block mb-2">Student Name</label>

              <input
                name="studentName"
                value={formData.studentName}
                onChange={handleChange}
                className="w-full p-4 rounded-lg bg-gray-900 border border-gray-700"
              />
            </div>

            <div>
              <label className="block mb-2">Student Grade</label>

              <input
                name="studentGrade"
                value={formData.studentGrade}
                onChange={handleChange}
                className="w-full p-4 rounded-lg bg-gray-900 border border-gray-700"
              />
            </div>

            <div>
              <label className="block mb-2">Book Project Idea</label>

              <textarea
                rows={5}
                name="projectIdea"
                value={formData.projectIdea}
                onChange={handleChange}
                className="w-full p-4 rounded-lg bg-gray-900 border border-gray-700"
              />
            </div>

            <div>
              <label className="block mb-2">Select Package</label>

              <select
                name="packageChoice"
                value={formData.packageChoice}
                onChange={handleChange}
                className="w-full p-4 rounded-lg bg-gray-900 text-white border border-gray-700"
              >
                <option className="text-black" value="Starter">
                  Starter — $99
                </option>

                <option className="text-black" value="Enhanced">
                  Enhanced — $159
                </option>

                <option className="text-black" value="Premium Longform">
                  Premium Longform — $249
                </option>
              </select>
            </div>

            <button
              onClick={handleSubmit}
              className="bg-yellow-400 text-black px-8 py-4 rounded-xl font-bold"
            >
              Continue to ESA Funding Summary
            </button>
          </div>
        )}

        {message && (
          <div className="mt-6 border border-green-600 rounded-lg p-4 text-green-300">
            {message}
          </div>
        )}

        {step === "summary" && (
          <div className="mt-8 space-y-6">
            <div className="border border-blue-700 rounded-xl p-6 bg-gray-950">
              <h2 className="text-2xl font-semibold mb-5">
                ESA Funding Summary
              </h2>

              <div className="space-y-3 text-gray-300">
                <p>
                  <strong>Parent:</strong> {formData.parentName}
                </p>

                <p>
                  <strong>Parent Email:</strong>{" "}
                  {formData.parentEmail || "Not provided"}
                </p>

                <p>
                  <strong>Student:</strong> {formData.studentName}
                </p>

                <p>
                  <strong>Grade:</strong> {formData.studentGrade}
                </p>

                <p>
                  <strong>Book Project:</strong> {formData.projectIdea}
                </p>

                <p>
                  <strong>Package:</strong> {formData.packageChoice}
                </p>

                <p>
                  <strong>Amount:</strong> {getPackagePrice()}
                </p>

                <p>
                  <strong>Program:</strong> WriteNowBooks Student Author Program
                </p>

                {invoiceNumber && (
                  <p>
                    <strong>Invoice #:</strong> {invoiceNumber}
                  </p>
                )}

                <p>
                  <strong>Educational Purpose:</strong> Student writing,
                  literacy, creative expression, book development, and structured
                  educational projects.
                </p>

                <p className="text-green-300">
                  Status:
                  {emailSent
                    ? " ESA invoice email sent to parent"
                    : invoicePrepared
                    ? " Invoice prepared / Pending ESA Submission"
                    : " Ready for invoice preparation"}
                </p>

                <div
                  style={{
                    paddingTop: "20px",
                    display: "flex",
                    gap: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={handlePrepareInvoice}
                    type="button"
                    style={{
                      background: "#2563eb",
                      color: "#fff",
                      padding: "18px 30px",
                      borderRadius: "14px",
                      border: "2px solid #60a5fa",
                      fontWeight: "bold",
                      minWidth: "280px",
                      cursor: "pointer",
                    }}
                  >
                    📄 Prepare ESA Invoice Details
                  </button>

                  <button
                    onClick={handleGeneratePDF}
                    type="button"
                    style={{
                      background: "#9333ea",
                      color: "#fff",
                      padding: "18px 30px",
                      borderRadius: "14px",
                      border: "2px solid #c084fc",
                      fontWeight: "bold",
                      minWidth: "240px",
                      cursor: "pointer",
                    }}
                  >
                    ⬇ Generate ESA Funding PDF
                  </button>

                  <button
                    onClick={handleGenerateInvoicePDF}
                    type="button"
                    style={{
                      background: "#16a34a",
                      color: "#fff",
                      padding: "18px 30px",
                      borderRadius: "14px",
                      border: "2px solid #86efac",
                      fontWeight: "bold",
                      minWidth: "260px",
                      cursor: "pointer",
                    }}
                  >
                    🧾 Generate Invoice PDF
                  </button>

                  <button
  onClick={handleEmailParent}
  type="button"
  disabled={isSendingEmail}
  style={{
    background: isSendingEmail ? "#854d0e" : "#ca8a04",
    color:"#fff",
    padding:"18px 30px",
    borderRadius:"14px",
    border:"2px solid #fde047",
    fontWeight:"bold",
    minWidth:"260px",
    cursor:isSendingEmail ? "not-allowed" : "pointer",
    opacity:isSendingEmail ? .75 : 1,
  }}
>
  {isSendingEmail
    ? "Sending Email..."
    : "✉ Send ESA Invoice to Parent"}
</button>
                </div>

                {pdfReady && (
                  <p className="text-purple-300">
                    ESA funding PDF successfully generated
                  </p>
                )}

                {invoicePdfReady && (
                  <p className="text-green-300">
                    ESA invoice PDF successfully generated
                  </p>
                )}

                {emailSent && (
                  <p className="text-yellow-300">
                    Email sent to {formData.parentEmail}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}