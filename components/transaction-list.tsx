"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { VingsTransaction } from "@/lib/vings-types";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  ShoppingBag,
  Utensils,
  Home,
  Car,
  Plane,
  Gamepad2,
  Heart,
  MoreHorizontal,
} from "lucide-react";

interface TransactionListProps {
  transactions: VingsTransaction[];
  isLoading: boolean;
}

const categoryIcons: Record<string, React.ElementType> = {
  // Food & Drink
  GROCERIES: Utensils,
  RESTAURANT: Utensils,
  FAST_FOOD: Utensils,
  COFFEE: Utensils,
  DRINKS: Utensils,
  DELIVERY: Utensils,
  VENDING_MACHINE: Utensils,
  // Shopping
  SHOPPING: ShoppingBag,
  CLOTHING: ShoppingBag,
  ELECTRONICS: ShoppingBag,
  // Housing
  RENT: Home,
  MORTGAGE: Home,
  ELECTRICITY: Home,
  INTERNET: Home,
  PHONE: Home,
  FURNITURE: Home,
  HYDRO: Home,
  // Transport
  GAS: Car,
  PARKING: Car,
  REPAIR: Car,
  TAXI: Car,
  BUS: Car,
  TRAIN: Car,
  BIKESHARE: Car,
  FLIGHT: Plane,
  // Entertainment
  SUBSCRIPTIONS: Gamepad2,
  VIDEO_GAMES: Gamepad2,
  CINEMA: Gamepad2,
  CONCERT: Gamepad2,
  MUSIC: Gamepad2,
  HOBBY: Gamepad2,
  NIGHTLIFE: Gamepad2,
  SPORTS: Gamepad2,
  VACATION: Plane,
  // Health
  DOCTOR: Heart,
  DENTIST: Heart,
  MEDICINE: Heart,
  PHARMACY: Heart,
  THERAPY: Heart,
  VISION: Heart,
  GYM: Heart,
  // Income
  SALARY: ArrowDownLeft,
  DIVIDEND: ArrowDownLeft,
  INTEREST: ArrowDownLeft,
  REFUND: ArrowDownLeft,
  TRANSFER_IN: ArrowDownLeft,
  default: CreditCard,
};

function getCategoryIcon(category?: string) {
  if (!category) return CreditCard;
  return categoryIcons[category] || CreditCard;
}

function formatCurrency(amountCents: number, currency: string | null = "USD") {
  const amount = Math.abs(amountCents) / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(amount);
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function TransactionSkeleton() {
  return (
    <div className="flex items-center gap-4 py-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-3 w-[100px]" />
      </div>
      <Skeleton className="h-4 w-[80px]" />
    </div>
  );
}

export function TransactionList({
  transactions,
  isLoading,
}: TransactionListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {[...Array(5)].map((_, i) => (
              <TransactionSkeleton key={i} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MoreHorizontal className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No transactions found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your recent activity will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Recent Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border">
          {transactions.map((transaction) => {
            const Icon = getCategoryIcon(transaction.category);
            const isIncome = transaction.type === "INCOME";

            return (
              <div
                key={transaction.id}
                className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {transaction.merchant_name || transaction.title}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{formatDate(transaction.date)}</span>
                    {transaction.category && (
                      <>
                        <span>·</span>
                        <span className="capitalize">{transaction.category.toLowerCase().replace(/_/g, " ")}</span>
                      </>
                    )}
                    {transaction.pending && (
                      <>
                        <span>·</span>
                        <span className="text-amber-600">Pending</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isIncome ? (
                    <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span
                    className={`font-semibold tabular-nums ${
                      isIncome ? "text-emerald-600" : "text-foreground"
                    }`}
                  >
                    {isIncome ? "+" : "-"}
                    {formatCurrency(transaction.amount_cents, transaction.currency)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
