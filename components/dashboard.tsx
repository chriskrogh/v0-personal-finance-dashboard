"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { TransactionList } from "@/components/transaction-list";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { VingsUser, VingsTransactionsResponse } from "@/lib/vings-types";
import { LogOut, RefreshCw, AlertCircle, Wallet } from "lucide-react";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: { message: "Request failed" } }));
    throw new Error(error.error?.message || `Error: ${res.status}`);
  }
  return res.json();
};

export function Dashboard() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const {
    data: user,
    error: userError,
    isLoading: userLoading,
  } = useSWR<VingsUser>("/api/vings/v1/me", fetcher);

  const {
    data: transactionsData,
    error: transactionsError,
    isLoading: transactionsLoading,
    mutate: refreshTransactions,
  } = useSWR<VingsTransactionsResponse>(
    "/api/vings/v1/transactions?pageSize=5",
    fetcher
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshTransactions();
    setIsRefreshing(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    window.location.href = "/auth/logout";
  };

  // Handle auth errors - redirect to login
  useEffect(() => {
    if (userError?.message?.includes("UNAUTHORIZED") || userError?.message?.includes("Not authenticated")) {
      window.location.href = "/";
    }
  }, [userError]);

  const error = userError || transactionsError;
  const isAuthError = error?.message?.includes("UNAUTHORIZED") || error?.message?.includes("Not authenticated");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Finance Dashboard</h1>
                {user?.email && (
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing || transactionsLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Error Alert */}
          {error && !isAuthError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          {/* Transactions */}
          <TransactionList
            transactions={transactionsData?.transactions || []}
            isLoading={userLoading || transactionsLoading}
          />
        </div>
      </main>
    </div>
  );
}
