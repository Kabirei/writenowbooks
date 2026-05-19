import { NextResponse } from "next/server";

export async function POST(
  request: Request
) {
  try {

    const body =
      await request.json();

    const password =
      body.password;

    const adminPassword =
      process.env
      .ADMIN_PASSWORD;

    if(
      !adminPassword
    ){

      return NextResponse.json(
      {
        success:false,
        message:
        "ADMIN_PASSWORD missing."
      },
      {
        status:500
      }
      );

    }

    if(
      password !==
      adminPassword
    ){

      return NextResponse.json(
      {
        success:false,
        message:
        "Incorrect password."
      },
      {
        status:401
      }
      );

    }

    const response =
      NextResponse.json({
        success:true
      });

    response.cookies.set(
      "admin_access",
      "granted",
      {
        httpOnly:true,
        secure:true,
        sameSite:"strict",
        path:"/"
      }
    );

    return response;

  } catch(error){

    return NextResponse.json(
    {
      success:false,
      message:
      "Login failed."
    },
    {
      status:500
    }
    );

  }

}