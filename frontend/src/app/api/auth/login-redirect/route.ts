import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const { user } = session;

  if (user.role.name === "ADMIN") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  return NextResponse.redirect(new URL("/dashboard", request.url));
}
