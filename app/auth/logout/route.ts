import { NextRequest, NextResponse } from "next/server";

function logoutResponse(request: NextRequest) {
  const base = request.nextUrl.origin;
  const response = NextResponse.redirect(new URL("/", base));

  response.cookies.delete("vings_access_token");

  return response;
}

/** POST is preferred to avoid CSRF logout via embedded resources. */
export async function POST(request: NextRequest) {
  return logoutResponse(request);
}

/** GET kept for simple redirects; prefer POST from the dashboard. */
export async function GET(request: NextRequest) {
  return logoutResponse(request);
}
