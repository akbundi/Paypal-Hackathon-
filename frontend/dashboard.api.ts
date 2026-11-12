/**
 * Dashboard API Module.
 * 
 * BACKEND STATUS: [TODO: Pending backend implementation]
 * Aggregates security metrics, weekly trends, and recent security events.
 */

import { http } from './http';
import { API_ENDPOINTS } from './endpoints';
import {
  DashboardSummaryResponse,
  RecentActivityItem,
} from '../../types/api.types';
import { SecurityStats } from '../../types';

export const dashboardApi = {
  /**
   * Fetch aggregated dashboard summary including spending charts and fraud breakdown.
   */
  async getDashboardSummary(): Promise<DashboardSummaryResponse> {
    return http.get<DashboardSummaryResponse>(API_ENDPOINTS.DASHBOARD.SUMMARY);
  },

  /**
   * Fetch recent security activity and audit trail.
   */
  async getRecentActivity(limit = 10): Promise<RecentActivityItem[]> {
    return http.get<RecentActivityItem[]>(API_ENDPOINTS.DASHBOARD.RECENT_ACTIVITY, {
      params: { limit },
    });
  },

  /**
   * Fetch live security KPI statistics (money saved, protected volume, fraud counts).
   */
  async getDashboardStats(): Promise<SecurityStats> {
    return http.get<SecurityStats>(API_ENDPOINTS.DASHBOARD.STATS);
  },
};
