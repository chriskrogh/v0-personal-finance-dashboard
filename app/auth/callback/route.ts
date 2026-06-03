import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/vings-oauth";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle OAuth errors
  if (error) {
    const errorUrl = new URL("/", request.url);
    errorUrl.searchParams.set("error", errorDescription || error);
    return NextResponse.redirect(errorUrl);
  }

  if (!code) {
    const errorUrl = new URL("/", request.url);
    errorUrl.searchParams.set("error", "No authorization code received");
    return NextResponse.redirect(errorUrl);
  }

  // Verify state matches
  const cookieStore = await cookies();
  const storedState = cookieStore.get("oauth_state")?.value;
  const storedVerifier = cookieStore.get("oauth_verifier")?.value;

  if (!storedState || storedState !== state) {
    const errorUrl = new URL("/", request.url);
    errorUrl.searchParams.set("error", "Invalid state parameter");
    return NextResponse.redirect(errorUrl);
  }

  if (!storedVerifier) {
    const errorUrl = new URL("/", request.url);
    errorUrl.searchParams.set("error", "Missing code verifier");
    return NextResponse.redirect(errorUrl);
  }

  const clientId = process.env.VINGS_OAUTH_CLIENT_ID;
  if (!clientId) {
    const errorUrl = new URL("/", request.url);
    errorUrl.searchParams.set("error", "OAuth client not configured");
    return NextResponse.redirect(errorUrl);
  }

  // Build redirect URI (must match exactly what was registered)
  const redirectUri = new URL("/auth/callback", request.url).toString();

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(
      code,
      storedVerifier,
      clientId,
      redirectUri
    );

    // Create response with redirect
    const response = NextResponse.redirect(new URL("/", request.url));

    // Store access token in httpOnly cookie
    response.cookies.set("vings_access_token", tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokens.expires_in,
      path: "/",
    });

    // Clear OAuth state cookies
    response.cookies.delete("oauth_state");
    response.cookies.delete("oauth_verifier");

    return response;
  } catch (err) {
    console.error("Token exchange error:", err);
    const errorUrl = new URL("/", request.url);
    errorUrl.searchParams.set(
      "error",
      err instanceof Error ? err.message : "Token exchange failed"
    );
    return NextResponse.redirect(errorUrl);
  }
}
