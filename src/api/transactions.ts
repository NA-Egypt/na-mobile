import { apiClient } from './client';
import {
  Transaction,
  CreateTransactionPayload,
  ApiResponse,
} from './types';

export const transactionsApi = {
  /**
   * Retrieves financial transactions (7th tradition donations and expenses).
   */
  async getTransactions(): Promise<Transaction[]> {
    const response = await apiClient.get<ApiResponse<Transaction[]> | Transaction[]>('/transactions');
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray((response.data as ApiResponse<Transaction[]>).data)) {
      return (response.data as ApiResponse<Transaction[]>).data;
    }
    return [];
  },

  /**
   * Records a new transaction (requires authentication).
   */
  async createTransaction(payload: CreateTransactionPayload): Promise<Transaction> {
    const response = await apiClient.post<ApiResponse<Transaction> | Transaction>(
      '/transactions',
      payload
    );
    return (response.data as ApiResponse<Transaction>).data || (response.data as Transaction);
  },

  /**
   * Retrieves a single transaction by ID.
   */
  async getTransaction(id: number | string): Promise<Transaction> {
    const response = await apiClient.get<ApiResponse<Transaction> | Transaction>(
      `/transactions/${id}`
    );
    return (response.data as ApiResponse<Transaction>).data || (response.data as Transaction);
  },

  /**
   * Updates a transaction (requires authentication).
   */
  async updateTransaction(
    id: number | string,
    payload: Partial<CreateTransactionPayload>
  ): Promise<Transaction> {
    const response = await apiClient.put<ApiResponse<Transaction> | Transaction>(
      `/transactions/${id}`,
      payload
    );
    return (response.data as ApiResponse<Transaction>).data || (response.data as Transaction);
  },

  /**
   * Deletes a transaction (requires authentication).
   */
  async deleteTransaction(id: number | string): Promise<void> {
    await apiClient.delete(`/transactions/${id}`);
  },
};
