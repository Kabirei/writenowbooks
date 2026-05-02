import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { SquareClient, SquareEnvironment } from "square";

const PACKAGE_PRICES = {
  starter: {
    name: "Starter Package",
    amount: 9900,
  },
  enhanced: {
    name: "Enhanced Package",
    amount: 15900,
  },
  premium: {
    name: "Premium Long Form Package",
    amount: 24900,
  },
} as const;

type PackageKey = keyof typeof PACKAGE_PRICES;

function extractSquareError(error: unknown) {
  if (typeof error === "object" && error !== null) {
    const maybeError = error as {
      message?: string;
      errors?: Array<{ code?: string; detail?: string; category?: string }>;
      body?: unknown;
      statusCode?: number;
    };

    return {
      message: maybeError.message || "Unknown Square error",
      statusCode: maybeError.statusCode || 500,
      errors: maybeError.errors || null,
      body: maybeError.body || null,
    };
  }

  return {
    message: "Unknown error",
    statusCode: 500,
    errors: null,
    body: null,
  };
}

function getSquareEnvironment() {
  const env = process.env.SQUARE_ENVIRONMENT;

  if (env === "production") {
    return SquareEnvironment.Production;
  }

  return SquareEnvironment.Sandbox;
}

function isPackageKey(value: unknown): value is PackageKey {
  return (
    value === "starter" ||
    value === "enhanced" ||
    value === "premium"
  );
}

export async function POST(request: Request) {
  try {
    const accessToken = process.env.SQUARE_ACCESS_TOKEN;
    const locationId = process.env.SQUARE_LOCATION_ID;

    if (!accessToken || !locationId) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing Square credentials in environment variables.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { sourceId, packagePlan } = body;

    if (!sourceId) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing sourceId.",
        },
        { status: 400 }
      );
    }

    if (!isPackageKey(packagePlan)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid package plan.",
        },
        { status: 400 }
      );
    }

    const selectedPackage = PACKAGE_PRICES[packagePlan];

    const client = new SquareClient({
      token: accessToken,
      environment: getSquareEnvironment(),
    });

    const response = await client.payments.create({
      sourceId,
      idempotencyKey: randomUUID(),
      amountMoney: {
        amount: BigInt(selectedPackage.amount),
        currency: "USD",
      },
      locationId,
      note: selectedPackage.name,
    });

    return NextResponse.json({
      success: true,
      paymentId: response.payment?.id || "unknown",
      status: response.payment?.status || "unknown",
      packagePlan,
      packageName: selectedPackage.name,
      amount: selectedPackage.amount,
    });
  } catch (error) {
    const parsed = extractSquareError(error);

    console.error("Square payment error:", parsed);

    return NextResponse.json(
      {
        success: false,
        message: parsed.message,
        squareErrors: parsed.errors,
      },
      { status: parsed.statusCode || 500 }
    );
  }
}