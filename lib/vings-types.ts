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
  description: string;
  amount: number;
  currency: string;
  category?: string;
  merchant?: string;
  account_name?: string;
  pending?: boolean;
}

export interface VingsTransactionsResponse {
  transactions: VingsTransaction[];
  total?: number;
  page?: number;
  per_page?: number;
}

export interface VingsApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}
