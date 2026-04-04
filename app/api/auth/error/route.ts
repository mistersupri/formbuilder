import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  return NextResponse.json(
    {
      error: "Unauthorized",
      detail: request.nextUrl.searchParams.get("error"),
    },
    { status: 401 },
  );
}
