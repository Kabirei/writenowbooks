"use client";

import ClassWalletGuide from "@/components/ClassWalletGuide";

export default function ESAPaymentPage() {
  const chooseDirectPay = () => {
    window.location.href = "/esa-request";
  };

  const chooseDebitCard = () => {
    localStorage.setItem(
      "esaPaymentMethod",
      "ClassWallet Debit Card"
    );

    window.location.href = "/package-selection";
  };

  return (
    <main className="min-h-screen bg-black text-white px-6 py-16">
      <div className="max-w-5xl mx-auto">
        <p className="text-sm uppercase tracking-[0.25em] text-gray-400 mb-3">
          Arizona ESA Payment Options
        </p>

        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Choose Your ESA Payment Method
        </h1>

        <p className="text-gray-300 text-lg mb-10 max-w-3xl">
          Arizona ESA families may use ClassWallet DirectPay or a ClassWallet
          prepaid debit card depending on how they prefer to complete payment.
        </p>

        {/* NEW GUIDE SECTION */}

        <div className="mb-12">
          <div className="border border-yellow-500 rounded-2xl bg-yellow-500/10 p-6">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">
              Need Help Using ClassWallet?
            </h2>

            <p className="text-gray-300 mb-4">
              Some parents have difficulty locating WriteNowBooks.com in the
              Arizona ClassWallet DirectPay Vendor Portal. Use the guide below
              for step-by-step instructions.
            </p>

            <p className="text-yellow-300 font-semibold">
              Search:
              <span className="text-white">
                {" "}
                "WriteNowBooks.com"
              </span>
            </p>
          </div>

          <ClassWalletGuide />
        </div>

        {/* EXISTING PAYMENT CARDS */}

        <div className="grid md:grid-cols-2 gap-8">
          <section className="bg-gray-950 border border-gray-700 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">
              ClassWallet DirectPay
            </h2>

            <p className="text-gray-300 mb-6">
              Use this option if you want to submit an invoice through the
              ClassWallet portal for ESA approval and payment.
            </p>

            <ul className="text-gray-400 space-y-3 mb-8">
              <li>• WriteNowBooks prepares ESA invoice details.</li>
              <li>• Parent submits the invoice through ClassWallet.</li>
              <li>• Admin confirms funding once payment is received.</li>
              <li>• Student dashboard unlocks after funding is confirmed.</li>
            </ul>

            <button
              onClick={chooseDirectPay}
              className="bg-yellow-400 text-black font-bold px-6 py-3 rounded-xl"
            >
              Use DirectPay Invoice
            </button>
          </section>

          <section className="bg-gray-950 border border-gray-700 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">
              ClassWallet Debit Card
            </h2>

            <p className="text-gray-300 mb-6">
              Use this option if you already have a ClassWallet prepaid debit
              card and want to pay through the normal WriteNowBooks checkout.
            </p>

            <ul className="text-gray-400 space-y-3 mb-8">
              <li>• Choose your WriteNowBooks package.</li>
              <li>• Pay using your ClassWallet debit card at checkout.</li>
              <li>• Keep your receipt for ClassWallet upload.</li>
              <li>• Student access can begin after payment completion.</li>
            </ul>

            <button
              onClick={chooseDebitCard}
              className="bg-green-500 text-black font-bold px-6 py-3 rounded-xl"
            >
              Use ESA Debit Card
            </button>
          </section>
        </div>

        <div className="mt-10 border border-blue-700 bg-blue-950/40 rounded-2xl p-6 text-blue-200">
          <p>
            Note: Debit card purchases may require parents to upload receipts
            in ClassWallet. DirectPay is the invoice-based path.
          </p>
        </div>
      </div>
    </main>
  );
}