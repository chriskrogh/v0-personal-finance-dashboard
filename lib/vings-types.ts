export interface VingsUser {
  id: string;
  email?: string;
  capabilities: {
    readonly: boolean;
    rest: boolean;
    mcp: boolean;
  };
}

export interface VingsTransaction {
  id: string;
  date: string;
  title: string;
  amount_cents: number;
  currency: string | null;
  type: "INCOME" | "EXPENSE" | "INTERNAL_TRANSFER";
  category: string;
  pending: boolean;
  merchant_name?: string | null;
  account_name?: string | null;
  bank_name?: string | null;
  plaid_category?: string | null;
  linked_transaction_id?: string | null;
}

export interface VingsTransactionsResponse {
  transactions: VingsTransaction[];
  pagination: {
    nextCursor: { date: string; id: string } | null;
    hasMore: boolean;
  };
}

export interface VingsApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}
