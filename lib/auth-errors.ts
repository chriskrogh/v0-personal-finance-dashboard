/** Safe error codes for OAuth redirects (no upstream details in URLs). */
export const AUTH_ERROR_CODES = {
  OAUTH_DENIED: "oauth_denied",
  OAUTH_FAILED: "oauth_failed",
  INVALID_STATE: "invalid_state",
  MISSING_VERIFIER: "missing_verifier",
  NOT_CONFIGURED: "not_configured",
  NO_CODE: "no_code",
} as const;

export type AuthErrorCode =
  (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  [AUTH_ERROR_CODES.OAUTH_DENIED]:
    "Authorization was denied. Please try again if you want to connect.",
  [AUTH_ERROR_CODES.OAUTH_FAILED]:
    "Sign-in failed. Please try again.",
  [AUTH_ERROR_CODES.INVALID_STATE]:
    "Your sign-in session expired or was invalid. Please try again.",
  [AUTH_ERROR_CODES.MISSING_VERIFIER]:
    "Your sign-in session expired. Please try again.",
  [AUTH_ERROR_CODES.NOT_CONFIGURED]:
    "This application is not configured for sign-in.",
  [AUTH_ERROR_CODES.NO_CODE]:
    "No authorization code was received. Please try again.",
};

export function isAuthErrorCode(value: string): value is AuthErrorCode {
  return value in AUTH_ERROR_MESSAGES;
}
