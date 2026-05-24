"use client";

import { useState } from "react";

export default function ClassWalletGuide() {
  const [open, setOpen] = useState(false);

  const imagePath = "/images/classwallet-directpay-guide.png";

  return (
    <section className="border border-yellow-500 rounded-2xl bg-yellow-500/10 p-6 my-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
        <div>
          <h2 className="text-2xl font-bold text-yellow-400">
            ClassWallet DirectPay Instructions
          </h2>

          <p className="text-gray-300 mt-2">
            Use this step-by-step guide to find WriteNowBooks.com in the
            ClassWallet DirectPay portal and complete the invoice process.
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setOpen(true)}
            className="bg-yellow-400 text-black font-bold px-5 py-3 rounded-xl"
          >
            Expand Guide
          </button>

          <a
            href={imagePath}
            download="WriteNowBooks-ClassWallet-DirectPay-Guide.png"
            className="bg-white text-black font-bold px-5 py-3 rounded-xl"
          >
            Download Guide
          </a>
        </div>
      </div>

      <button
        onClick={() => setOpen(true)}
        className="block w-full overflow-hidden rounded-xl border border-gray-700 bg-black"
      >
        <img
          src={imagePath}
          alt="WriteNowBooks ClassWallet DirectPay invoice instructions"
          className="w-full max-h-[520px] object-contain bg-white"
        />
      </button>

      {open && (
        <div className="fixed inset-0 z-[9999] bg-black/90 p-4 overflow-auto">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-end gap-3 mb-4">
              <a
                href={imagePath}
                download="WriteNowBooks-ClassWallet-DirectPay-Guide.png"
                className="bg-yellow-400 text-black font-bold px-5 py-3 rounded-xl"
              >
                Download
              </a>

              <button
                onClick={() => setOpen(false)}
                className="bg-white text-black font-bold px-5 py-3 rounded-xl"
              >
                Close
              </button>
            </div>

            <img
              src={imagePath}
              alt="Expanded WriteNowBooks ClassWallet DirectPay guide"
              className="w-full h-auto rounded-xl bg-white"
            />
          </div>
        </div>
      )}
    </section>
  );
}