import { NextRequest, NextResponse } from "next/server";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  buildAuthorizationUrl,
} from "@/lib/vings-oauth";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const clientId = process.env.VINGS_OAUTH_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: "VINGS_OAUTH_CLIENT_ID not configured" },
      { status: 500 }
    );
  }

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = crypto.randomUUID();

  const redirectUri = new URL("/auth/callback", request.url).toString();

  try {
    const authUrl = await buildAuthorizationUrl(
      clientId,
      redirectUri,
      codeChallenge,
      state
    );

    const response = NextResponse.redirect(authUrl);

    response.cookies.set("oauth_verifier", codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
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
    logger.error("OAuth login error:", err);
    return NextResponse.json(
      { error: "Failed to start OAuth flow" },
      { status: 500 }
    );
  }
}
