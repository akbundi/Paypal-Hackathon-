/**
 * Settings API Module.
 * 
 * BACKEND STATUS: [TODO: Pending backend implementation]
 * Configures fraud risk thresholds, escrow timers, LLM models, and sandbox testing.
 */

import { http } from './http';
import { API_ENDPOINTS } from './endpoints';
import {
  UserSettings,
  UpdateSettingsRequest,
} from '../../types/api.types';

export const settingsApi = {
  /**
   * Fetch current user and security parameters.
   */
  async getSettings(): Promise<UserSettings> {
    return http.get<UserSettings>(API_ENDPOINTS.SETTINGS.GET);
  },

  /**
   * Update security parameters, notification alerts, or language.
   */
  async updateSettings(settings: UpdateSettingsRequest): Promise<UserSettings> {
    return http.patch<UserSettings>(API_ENDPOINTS.SETTINGS.UPDATE, settings);
  },

  /**
   * Ping simulated PayPal REST v2 webhook endpoint to test latency.
   */
  async pingPayPalSandbox(): Promise<{ connected: boolean; latencyMs: number }> {
    return http.post<{ connected: boolean; latencyMs: number }>(
      API_ENDPOINTS.SETTINGS.PAYPAL_PING
    );
  },
};
