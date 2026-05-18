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
              How the ESA Request Works
            </h2>

            <div className="space-y-3 text-gray-300">
              <p>
                Step 1: Start an ESA request before making a payment.
              </p>

              <p>
                Step 2: Provide student, parent, and project details.
              </p>

              <p>
                Step 3: WriteNowBooks prepares invoice details for ESA funding
                submission.
              </p>

              <p>
                Step 4: After the ESA payment is approved or completed, the
                student book project can begin.
              </p>
            </div>
          </div>

          <div className="border border-yellow-500 rounded-xl p-6 bg-yellow-500/10">
            <h2 className="text-xl font-semibold mb-3">
              Arizona ESA Request
            </h2>

            <p className="text-gray-300 mb-5">
              Arizona homeschool families can begin an ESA funding request
              before paying out of pocket.
            </p>

            <a
              href="/esa-request"
              className="inline-block bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition"
            >
              Start ESA Request
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}