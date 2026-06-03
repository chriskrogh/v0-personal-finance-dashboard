import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/vings-oauth";
import { AUTH_ERROR_CODES } from "@/lib/auth-errors";
import { logger } from "@/lib/logger";
import { cookies } from "next/headers";

function redirectWithError(request: NextRequest, code: string) {
  const errorUrl = new URL("/", request.url);
  errorUrl.searchParams.set("error", code);
  return NextResponse.redirect(errorUrl);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  logger.debug(
    "[auth] Callback received",
    code ? "code present" : "no code",
    state ? "state present" : "no state"
  );

  if (error) {
    logger.error("[auth] OAuth error:", error, errorDescription);
    return redirectWithError(request, AUTH_ERROR_CODES.OAUTH_DENIED);
  }

  if (!code) {
    logger.debug("[auth] No authorization code received");
    return redirectWithError(request, AUTH_ERROR_CODES.NO_CODE);
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("oauth_state")?.value;
  const storedVerifier = cookieStore.get("oauth_verifier")?.value;

  if (!storedState || storedState !== state) {
    logger.error("[auth] State mismatch");
    return redirectWithError(request, AUTH_ERROR_CODES.INVALID_STATE);
  }

  if (!storedVerifier) {
    logger.debug("[auth] Missing code verifier cookie");
    return redirectWithError(request, AUTH_ERROR_CODES.MISSING_VERIFIER);
  }

  const clientId = process.env.VINGS_OAUTH_CLIENT_ID;
  if (!clientId) {
    logger.error("[auth] VINGS_OAUTH_CLIENT_ID not configured");
    return redirectWithError(request, AUTH_ERROR_CODES.NOT_CONFIGURED);
  }

  const redirectUri = new URL("/auth/callback", request.url).toString();

  try {
    const tokens = await exchangeCodeForTokens(
      code,
      storedVerifier,
      clientId,
      redirectUri
    );

    const response = NextResponse.redirect(new URL("/", request.url));

    response.cookies.set("vings_access_token", tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokens.expires_in,
      path: "/",
    });

    response.cookies.delete("oauth_state");
    response.cookies.delete("oauth_verifier");

    return response;
  } catch (err) {
    logger.error("[auth] Token exchange error:", err);
    return redirectWithError(request, AUTH_ERROR_CODES.OAUTH_FAILED);
  }
}
