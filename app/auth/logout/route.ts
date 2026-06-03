import { NextResponse } from "next/server";

export async function GET() {
  const response = NextResponse.redirect(new URL("/", process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"));
  
  // Clear the access token cookie
  response.cookies.delete("vings_access_token");
  
  return response;
}

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Clear the access token cookie
  response.cookies.delete("vings_access_token");
  
  return response;
}
