import ClassWalletGuide from "@/components/ClassWalletGuide";

export default function ESA() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">
          Arizona ESA Learning Program
        </h1>

        <p className="text-lg text-gray-300 mb-8">
          WriteNowBooks Student Author Program helps homeschool students develop
          writing, reading, literacy, creativity, and structured educational
          projects through guided book creation.
        </p>

        <ClassWalletGuide />

        <div className="space-y-6">
          <div className="border border-gray-700 rounded-xl p-6">
            <h2 className="text-2xl font-semibold mb-3">
              What Students Can Create
            </h2>

            <ul className="space-y-2 text-gray-300">
              <li>• Creative stories</li>
              <li>• Educational workbooks</li>
              <li>• Writing projects</li>
              <li>• Student books</li>
              <li>• Literacy projects</li>
            </ul>
          </div>

          <div className="border border-gray-700 rounded-xl p-6">
            <h2 className="text-2xl font-semibold mb-3">
              How ESA Payment Works
            </h2>

            <div className="space-y-3 text-gray-300">
              <p>
                Step 1: Choose whether your family wants to use ClassWallet
                DirectPay or a ClassWallet debit card.
              </p>

              <p>
                Step 2: If using DirectPay, WriteNowBooks prepares invoice
                details for submission through ClassWallet.
              </p>

              <p>
                Step 3: If using a ClassWallet debit card, families may continue
                through the normal WriteNowBooks checkout process.
              </p>

              <p>
                Step 4: Once payment is confirmed, the student dashboard unlocks
                and the book creation workflow begins.
              </p>
            </div>
          </div>

          <div className="border border-yellow-500 rounded-xl p-6 bg-yellow-500/10">
            <h2 className="text-xl font-semibold mb-3">
              Arizona ESA Payment Options
            </h2>

            <p className="text-gray-300 mb-5">
              Arizona ESA families can choose the payment path that fits their
              ClassWallet account: DirectPay invoice submission or ClassWallet
              debit card checkout.
            </p>

            <a
              href="/esa-payment"
              className="inline-block bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition"
            >
              Choose ESA Payment Method
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}