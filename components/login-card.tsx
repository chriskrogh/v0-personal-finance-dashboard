"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Wallet, Shield, ArrowRight } from "lucide-react";

export function LoginCard() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">Connect to Vings</CardTitle>
          <CardDescription className="text-base">
            Sign in with your Vings account to view your recent transactions and
            financial data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <Shield className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
              <span>
                <strong className="text-foreground">Read-only access</strong> - We
                can only view your data, never modify it
              </span>
            </div>
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <Shield className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
              <span>
                <strong className="text-foreground">Secure OAuth 2.1</strong> -
                Your credentials are never shared with this app
              </span>
            </div>
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <Shield className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
              <span>
                <strong className="text-foreground">Revoke anytime</strong> -
                Disconnect this app from Vings settings
              </span>
            </div>
          </div>

          <Button asChild className="w-full" size="lg">
            <a href="/auth/login">
              Connect with Vings
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            By connecting, you agree to share your financial data with this
            dashboard application.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
