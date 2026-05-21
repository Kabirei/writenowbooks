import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { parentEmail } = body;

    if (!parentEmail) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing parent email.",
          project: null,
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("projects")
      .select("*")
      .contains("book_data", {
        esaParentEmail: parentEmail,
      })
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({
        success: true,
        project: null,
      });
    }

    return NextResponse.json({
      success: true,
      project: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to load student project.",
        project: null,
      },
      { status: 500 }
    );
  }
}