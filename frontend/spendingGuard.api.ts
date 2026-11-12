/**
 * Spending Guard API Module.
 * 
 * BACKEND STATUS: [TODO: Pending backend implementation]
 * Controls agent purchasing limits, weekly budgets, and merchant categories.
 */

import { http } from './http';
import { API_ENDPOINTS } from './endpoints';
import {
  SpendingRulesResponse,
  UpdateSpendingRulesRequest,
  SpendingSummaryResponse,
} from '../../types/api.types';
import { SpendingRule } from '../../types';

export const spendingGuardApi = {
  /**
   * Fetch all user-defined spending rules and weekly budget status.
   */
  async getSpendingRules(): Promise<SpendingRulesResponse> {
    return http.get<SpendingRulesResponse>(API_ENDPOINTS.SPENDING_GUARD.RULES);
  },

  /**
   * Bulk update spending rules and budget settings.
   */
  async updateSpendingRules(
    payload: UpdateSpendingRulesRequest
  ): Promise<SpendingRulesResponse> {
    return http.put<SpendingRulesResponse>(
      API_ENDPOINTS.SPENDING_GUARD.RULES,
      payload
    );
  },

  /**
   * Fetch high-level spending summary for widgets.
   */
  async getSpendingSummary(): Promise<SpendingSummaryResponse> {
    return http.get<SpendingSummaryResponse>(API_ENDPOINTS.SPENDING_GUARD.SUMMARY);
  },

  /**
   * Create a new spending rule.
   */
  async createRule(rule: Omit<SpendingRule, 'id' | 'createdAt'>): Promise<SpendingRule> {
    return http.post<SpendingRule>(API_ENDPOINTS.SPENDING_GUARD.RULES, rule);
  },

  /**
   * Update an existing rule by ID.
   */
  async updateRule(id: string, updates: Partial<SpendingRule>): Promise<SpendingRule> {
    return http.patch<SpendingRule>(API_ENDPOINTS.SPENDING_GUARD.RULE_BY_ID(id), updates);
  },

  /**
   * Delete a rule by ID.
   */
  async deleteRule(id: string): Promise<void> {
    return http.delete(API_ENDPOINTS.SPENDING_GUARD.RULE_BY_ID(id));
  },
};
