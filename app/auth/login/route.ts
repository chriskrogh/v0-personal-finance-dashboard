import { NextRequest, NextResponse } from "next/server";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  buildAuthorizationUrl,
} from "@/lib/vings-oauth";

export async function GET(request: NextRequest) {
  const clientId = process.env.VINGS_OAUTH_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: "VINGS_OAUTH_CLIENT_ID not configured" },
      { status: 500 }
    );
  }

  // Generate PKCE values
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = crypto.randomUUID();

  // Build redirect URI
  const redirectUri = new URL("/auth/callback", request.url).toString();

  try {
    // Build authorization URL
    const authUrl = await buildAuthorizationUrl(
      clientId,
      redirectUri,
      codeChallenge,
      state
    );

    // Create response with redirect
    const response = NextResponse.redirect(authUrl);

    // Store PKCE verifier and state in cookies
    response.cookies.set("oauth_verifier", codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    response.cookies.set("oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("OAuth login error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to start OAuth flow" },
      { status: 500 }
    );
  }
}
