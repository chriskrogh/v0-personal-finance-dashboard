// OAuth 2.1 PKCE utilities for Vings External API

const VINGS_API_BASE = "https://external.vin.gs/api";

// Generate cryptographically secure random string
function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

// Generate code verifier for PKCE
export function generateCodeVerifier(): string {
  return generateRandomString(32);
}

// Generate code challenge from verifier using SHA-256
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Discover OAuth endpoints from protected resource metadata
export async function discoverOAuthEndpoints(): Promise<{
  authorizationEndpoint: string;
  tokenEndpoint: string;
}> {
  const response = await fetch(
    `${VINGS_API_BASE}/.well-known/oauth-protected-resource`
  );
  if (!response.ok) {
    throw new Error("Failed to discover OAuth endpoints");
  }
  const metadata = await response.json();
  const issuer = metadata.authorization_servers[0];

  return {
    authorizationEndpoint: `${issuer}/oauth/authorize`,
    tokenEndpoint: `${issuer}/oauth/token`,
  };
}

// Build authorization URL
export async function buildAuthorizationUrl(
  clientId: string,
  redirectUri: string,
  codeChallenge: string,
  state: string
): Promise<string> {
  const { authorizationEndpoint } = await discoverOAuthEndpoints();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
    scope: "openid email profile",
  });

  return `${authorizationEndpoint}?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
  clientId: string,
  redirectUri: string
): Promise<{ access_token: string; refresh_token?: string; expires_in: number }> {
  const { tokenEndpoint } = await discoverOAuthEndpoints();

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      code_verifier: codeVerifier,
      client_id: clientId,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

// Vings API client
export async function vingsApiCall<T>(
  endpoint: string,
  accessToken: string
): Promise<T> {
  const response = await fetch(`${VINGS_API_BASE}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(error.error?.message || `API call failed: ${response.status}`);
  }

  return response.json();
}
