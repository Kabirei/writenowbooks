import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      parentName,
      parentEmail,
      studentName,
      studentGrade,
      projectIdea,
      packageChoice,
      packagePrice,
    } = body;

    const { data, error } =
      await supabaseAdmin
        .from("esa_requests")
        .insert([
          {
            parent_name: parentName,
            parent_email: parentEmail,
            student_name: studentName,
            student_grade: studentGrade,
            project_idea: projectIdea,
            package_choice: packageChoice,
            package_price: packagePrice,
            invoice_status:
              "Pending ESA Submission",
          },
        ])
        .select();

    if (error) {
      console.error(
        "SUPABASE INSERT ERROR:",
        error
      );

      return NextResponse.json(
        {
          success:false,
          message:error.message
        },
        {status:500}
      );
    }

    return NextResponse.json({
      success:true,
      data
    });

  } catch(error){

    console.error(
      "SAVE REQUEST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success:false,
        message:"Unable to save request"
      },
      {status:500}
    );
  }
}