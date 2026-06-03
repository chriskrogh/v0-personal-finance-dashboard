import { cookies } from "next/headers";
import { LoginCard } from "@/components/login-card";
import { Dashboard } from "@/components/dashboard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  AUTH_ERROR_MESSAGES,
  isAuthErrorCode,
} from "@/lib/auth-errors";

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("vings_access_token")?.value;
  const { error: errorCode } = await searchParams;

  const errorMessage =
    errorCode && isAuthErrorCode(errorCode)
      ? AUTH_ERROR_MESSAGES[errorCode]
      : null;

  if (!accessToken) {
    return (
      <div>
        {errorMessage && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          </div>
        )}
        <LoginCard />
      </div>
    );
  }

  return <Dashboard />;
}
