# Vings Personal Dashboards Documentation Feedback

This feedback is based on hands-on experience building a personal finance dashboard with v0, encountering real issues, and iterating to a working solution.

---

## Summary

The documentation is comprehensive but has gaps that caused real debugging sessions. The main issues were:

1. **OAuth endpoint paths were initially unclear** - we first used `/auth/v1/authorize` and `/auth/v1/token` before realizing it must be `/auth/v1/oauth/authorize` and `/auth/v1/oauth/token`
2. **Missing guidance on API route structure for Next.js** - catch-all routes `[...path]` can fail silently in some deployments
3. **No working code examples** - the docs describe *what* to do but not *how* to implement it
4. **OpenAPI field names not explicitly documented** - had to discover `amount_cents`, `pageSize`, `merchant_name` vs guessed names like `amount`, `limit`, `merchant`

---

## Detailed Feedback

### 1. OAuth Endpoint Clarity (Critical)

**Current docs say:**
> "Use `authorization_endpoint` and `token_endpoint` from that JSON. They must be `/auth/v1/oauth/authorize` and `/auth/v1/oauth/token`, not `/auth/v1/authorize` (social sign-in only)."

**Problem:** This is mentioned but easy to miss. The troubleshooting table helps, but developers will likely hit this error first.

**Recommendation:** Add a prominent warning box at the top of the OAuth section:

```markdown
> ⚠️ **Common Mistake**: The OAuth endpoints are `/auth/v1/oauth/authorize` and `/auth/v1/oauth/token`. 
> Do NOT use `/auth/v1/authorize` or `/auth/v1/token` — those are for social sign-in only and will return "Unsupported provider" errors.
```

Also consider adding the full URLs explicitly in a code block:

```
Authorization: https://{issuer}/auth/v1/oauth/authorize
Token:         https://{issuer}/auth/v1/oauth/token
```

---

### 2. v0 Agent Prompt Issues

**Current v0 agent prompt says:**
> "3. Discover OAuth endpoints... (paths must be /auth/v1/oauth/authorize and /auth/v1/oauth/token)"

**Problem:** The prompt mentions discovering endpoints but doesn't show how to derive the full URL from the discovery response. Our implementation initially constructed URLs incorrectly as `{issuer}/authorize` instead of `{issuer}/oauth/authorize`.

**Recommendation:** Update the agent prompt to be more explicit:

```markdown
3. Discover OAuth endpoints:
   - GET https://external.vin.gs/api/.well-known/oauth-protected-resource → get authorization_servers[0] as issuer
   - GET {issuer}/.well-known/openid-configuration → get authorization_endpoint and token_endpoint
   - These will be full URLs like: https://{issuer}/auth/v1/oauth/authorize
   - If you construct URLs manually from the issuer, append /oauth/authorize and /oauth/token (not just /authorize and /token)
```

---

### 3. Missing: API Proxy Pattern for CORS

**Current docs say:**
> "CORS errors from the browser: Prefer a small server route or edge function to call `external.vin.gs`"

**Problem:** This is mentioned only in troubleshooting, but it's a **requirement** for any browser-based dashboard. The docs should lead with this pattern.

**Recommendation:** Add a dedicated section with example code:

```markdown
## Server-Side API Proxy (Required for Browser Apps)

The External API does not allow direct browser requests due to CORS. Create a server route to proxy requests:

### Next.js Example (App Router)

Create `app/api/vings/me/route.ts`:

\`\`\`typescript
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("vings_access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = await fetch("https://external.vin.gs/api/v1/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
\`\`\`

> **Tip:** Create separate route files for each endpoint (`/api/vings/me`, `/api/vings/transactions`) rather than a catch-all route, as catch-all routes can have deployment issues.
```

---

### 4. Missing: Complete OAuth Implementation Example

**Problem:** The docs explain the OAuth flow conceptually but provide no working code. Developers must piece together PKCE, discovery, token exchange, and cookie management themselves.

**Recommendation:** Add a complete, copy-paste-ready example:

```markdown
## Complete OAuth Implementation (Next.js)

### 1. OAuth Utilities (`lib/vings-oauth.ts`)

\`\`\`typescript
// Generate PKCE code verifier and challenge
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(hash));
}

function base64UrlEncode(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Discover OAuth endpoints
export async function discoverOAuthEndpoints() {
  const resourceRes = await fetch(
    "https://external.vin.gs/api/.well-known/oauth-protected-resource"
  );
  const resource = await resourceRes.json();
  const issuer = resource.authorization_servers[0];

  // IMPORTANT: Append /oauth/authorize and /oauth/token, not just /authorize
  return {
    authorizationEndpoint: `${issuer}/oauth/authorize`,
    tokenEndpoint: `${issuer}/oauth/token`,
  };
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
  clientId: string,
  redirectUri: string
) {
  const { tokenEndpoint } = await discoverOAuthEndpoints();

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || "Token exchange failed");
  }

  return response.json();
}
\`\`\`

### 2. Login Route (`app/auth/login/route.ts`)
### 3. Callback Route (`app/auth/callback/route.ts`)

[Include full implementations]
```

---

### 5. OpenAPI Field Names Should Be Documented

**Problem:** We guessed field names like `amount`, `limit`, `merchant`, `description` but the actual API uses `amount_cents`, `pageSize`, `merchant_name`, `title`.

**Recommendation:** Add a quick reference table:

```markdown
## Common Field Names

| What you might expect | Actual field name |
|----------------------|-------------------|
| `amount`             | `amount_cents` (integer, divide by 100) |
| `limit`              | `pageSize` |
| `merchant`           | `merchant_name` |
| `description`        | `title` |
| `category`           | `category` (uppercase enum like `GROCERIES`, `RENT`) |
| `is_income`          | `type` (enum: `"INCOME"` or `"EXPENSE"`) |
```

---

### 6. Cookie Configuration for OAuth State

**Problem:** OAuth state and PKCE verifier cookies can be lost during cross-site redirects if not configured correctly.

**Recommendation:** Add explicit cookie configuration guidance:

```markdown
## Cookie Configuration

When storing OAuth state (`state`, `code_verifier`) in cookies before redirect:

\`\`\`typescript
response.cookies.set("oauth_state", state, {
  httpOnly: true,
  secure: true,           // Required for production
  sameSite: "lax",        // "lax" allows the cookie to be sent on redirect back
  maxAge: 60 * 10,        // 10 minutes
  path: "/",
});
\`\`\`

> **Important:** Use `sameSite: "lax"` (not `"strict"`) so the cookie is available when the OAuth provider redirects back to your callback URL.
```

---

### 7. Troubleshooting Additions

Add these common issues to the troubleshooting table:

| Symptom | What to check |
|---------|---------------|
| Callback route returns 404 | In Next.js, avoid catch-all routes `[...path]` for API proxies. Create explicit route files like `app/api/vings/me/route.ts` instead. |
| State mismatch error | Cookies may be lost during OAuth redirect. Ensure `sameSite: "lax"` and `secure: true` in production. |
| `amount` is undefined | Field is `amount_cents` (integer). Divide by 100 for display. |
| No transactions returned | Use `pageSize` parameter, not `limit`. Example: `GET /v1/transactions?pageSize=5` |

---

## v0 Agent Prompt - Suggested Revision

The current prompt is good but could be more precise. Here's a revised version:

```markdown
Official guide: https://docs.vin.gs/external/docs/personal-dashboards

Requirements:
1. OAuth 2.1 public client with PKCE (no client secret). Use env VINGS_OAUTH_CLIENT_ID.

2. Register the redirect URI in Vings BEFORE testing. It must match EXACTLY (scheme, host, path, trailing slash).

3. Discover OAuth endpoints:
   - GET https://external.vin.gs/api/.well-known/oauth-protected-resource → extract authorization_servers[0]
   - Construct endpoints by appending to the issuer:
     - Authorization: {issuer}/oauth/authorize
     - Token: {issuer}/oauth/token
   - ⚠️ Do NOT use /authorize or /token (those are for social sign-in)

4. PKCE flow:
   - Generate code_verifier (32 random bytes, base64url)
   - Generate code_challenge = base64url(sha256(code_verifier))
   - Scopes: openid email profile
   - Store state and code_verifier in httpOnly cookies (sameSite: "lax")

5. Token exchange: POST to token endpoint with code, code_verifier, client_id, redirect_uri (no client_secret)

6. API calls: Authorization: Bearer <access_token> to https://external.vin.gs/api
   - Verify with GET /v1/me
   - Transactions: GET /v1/transactions?pageSize=5 (note: pageSize, not limit)
   - Amounts are in cents (amount_cents field)

7. CORS: Browser cannot call external.vin.gs directly. Create server-side API routes to proxy requests.

8. Use REST only — do NOT use the MCP server (/api/mcp) for dashboard apps.

OpenAPI: https://external.vin.gs/api/openapi.json
```

---

## Summary of Recommendations

1. **Add warning boxes** for the OAuth endpoint mistake (most common error)
2. **Provide complete code examples** - not just descriptions
3. **Document the API proxy pattern** as a requirement, not just troubleshooting
4. **Add field name reference table** for common gotchas
5. **Expand troubleshooting** with deployment-specific issues (Next.js catch-all routes, cookie configuration)
6. **Update the v0 agent prompt** to be more explicit about URL construction

These changes would have saved approximately 45 minutes of debugging during our implementation.
