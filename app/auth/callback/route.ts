import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/vings-oauth";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  console.log("[v0] Callback received - code:", code?.slice(0, 8), "state:", state?.slice(0, 8));

  // Handle OAuth errors
  if (error) {
    console.log("[v0] OAuth error:", error, errorDescription);
    const errorUrl = new URL("/", request.url);
    errorUrl.searchParams.set("error", errorDescription || error);
    return NextResponse.redirect(errorUrl);
  }

  if (!code) {
    console.log("[v0] No authorization code received");
    const errorUrl = new URL("/", request.url);
    errorUrl.searchParams.set("error", "No authorization code received");
    return NextResponse.redirect(errorUrl);
  }

  // Verify state matches
  const cookieStore = await cookies();
  const storedState = cookieStore.get("oauth_state")?.value;
  const storedVerifier = cookieStore.get("oauth_verifier")?.value;

  console.log("[v0] Stored state:", storedState?.slice(0, 8), "Stored verifier exists:", !!storedVerifier);
  console.log("[v0] All cookies:", cookieStore.getAll().map(c => c.name));

  if (!storedState || storedState !== state) {
    console.log("[v0] State mismatch - stored:", storedState, "received:", state);
    const errorUrl = new URL("/", request.url);
    errorUrl.searchParams.set("error", "Invalid state parameter. Cookies may have been lost during redirect.");
    return NextResponse.redirect(errorUrl);
  }

  if (!storedVerifier) {
    console.log("[v0] Missing code verifier cookie");
    const errorUrl = new URL("/", request.url);
    errorUrl.searchParams.set("error", "Missing code verifier. Cookies may have been lost during redirect.");
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
    console.log("[v0] Exchanging code for tokens...");
    const tokens = await exchangeCodeForTokens(
      code,
      storedVerifier,
      clientId,
      redirectUri
    );
    console.log("[v0] Token exchange successful, expires_in:", tokens.expires_in);

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

    console.log("[v0] Redirecting to home with access token cookie set");
    return response;
  } catch (err) {
    console.error("[v0] Token exchange error:", err);
    const errorUrl = new URL("/", request.url);
    errorUrl.searchParams.set(
      "error",
      err instanceof Error ? err.message : "Token exchange failed"
    );
    return NextResponse.redirect(errorUrl);
  }
}
