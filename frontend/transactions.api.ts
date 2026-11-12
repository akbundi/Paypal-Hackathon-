/**
 * Transactions & Payments API Module.
 * 
 * BACKEND STATUS: [TODO: Pending backend implementation]
 * Aligns with reference tests for /api/payments.
 */

import { http } from './http';
import { API_ENDPOINTS } from './endpoints';
import {
  TransactionFilterParams,
  CreateTransactionRequest,
  PaginatedResponse,
} from '../../types/api.types';
import { Transaction } from '../../types';

export const transactionsApi = {
  /**
   * Fetch paginated list of transactions with filtering.
   */
  async getTransactions(
    params?: TransactionFilterParams
  ): Promise<PaginatedResponse<Transaction> | Transaction[]> {
    return http.get<PaginatedResponse<Transaction> | Transaction[]>(
      API_ENDPOINTS.TRANSACTIONS.LIST,
      { params: params as Record<string, string | number | boolean | null | undefined> }
    );
  },

  /**
   * Fetch single transaction by unique identifier.
   */
  async getTransactionById(id: string): Promise<Transaction> {
    return http.get<Transaction>(API_ENDPOINTS.TRANSACTIONS.DETAIL(id));
  },

  /**
   * Submit a payment / transaction request through the policy gate.
   */
  async createTransaction(data: CreateTransactionRequest): Promise<Transaction> {
    const headers: Record<string, string> = {};
    if (data.idempotencyKey) {
      headers['Idempotency-Key'] = data.idempotencyKey;
    }
    return http.post<Transaction>(
      API_ENDPOINTS.TRANSACTIONS.CREATE,
      data,
      { headers }
    );
  },
};
