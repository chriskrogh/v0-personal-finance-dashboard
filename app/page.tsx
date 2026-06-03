import { cookies } from "next/headers";
import { LoginCard } from "@/components/login-card";
import { Dashboard } from "@/components/dashboard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("vings_access_token")?.value;
  const { error } = await searchParams;

  // Not authenticated - show login
  if (!accessToken) {
    return (
      <div>
        {error && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}
        <LoginCard />
      </div>
    );
  }

  // Authenticated - show dashboard
  return <Dashboard />;
}
