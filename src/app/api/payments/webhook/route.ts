import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const eventType = body?.type;
    const payment = body?.data?.object?.payment;

    console.log("Webhook received:", eventType);

    if (eventType === "payment.updated") {
      const paymentId = payment?.id;
      const status = payment?.status;

      console.log("Payment Update:", paymentId, status);

      // 🔥 IMPORTANT: Only act on COMPLETED payments
      if (status === "COMPLETED") {
        // TODO: match paymentId to project + update if needed

        console.log("Payment confirmed as completed.");
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);

    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}