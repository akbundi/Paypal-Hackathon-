/**
 * Scam Detection API Module.
 * 
 * BACKEND STATUS: [ACTIVE - Connected to FastAPI AI Scam Detection Engine]
 * Endpoints:
 * - POST /api/v1/analyze
 * - POST /api/v1/analyze/batch
 * - GET  /api/v1/health
 * - GET  /api/v1/languages
 */

import { http } from './http';
import { API_ENDPOINTS } from './endpoints';
import {
  AnalyzeInvoiceRequest,
  BackendFraudAnalysisResponse,
  BackendHealthResponse,
  SupportedLanguagesResponse,
  DetectionHistoryItem,
} from '../../types/api.types';

export const scamDetectionApi = {
  /**
   * Run multi-stage AI fraud & scam analysis on an invoice.
   * Leverages GPT-OSS-120B invoice understanding and GPT-OSS-Safeguard-120B.
   */
  async analyzeInvoice(
    payload: AnalyzeInvoiceRequest
  ): Promise<BackendFraudAnalysisResponse> {
    return http.post<BackendFraudAnalysisResponse>(
      API_ENDPOINTS.SCAM_DETECTION.ANALYZE,
      payload
    );
  },

  /**
   * Batch analyze multiple invoices in a single request.
   */
  async batchAnalyzeInvoices(
    invoices: AnalyzeInvoiceRequest[]
  ): Promise<{ results: BackendFraudAnalysisResponse[]; total_processed: number; high_risk_count: number }> {
    return http.post(API_ENDPOINTS.SCAM_DETECTION.BATCH_ANALYZE, { invoices });
  },

  /**
   * Retrieve scan history.
   * [TODO: Confirm with backend teammate when historical scans endpoint is ready]
   */
  async getDetectionHistory(): Promise<DetectionHistoryItem[]> {
    return http.get<DetectionHistoryItem[]>(API_ENDPOINTS.SCAM_DETECTION.HISTORY);
  },

  /**
   * Check backend engine health and model availability.
   */
  async checkHealth(): Promise<BackendHealthResponse> {
    return http.get<BackendHealthResponse>(API_ENDPOINTS.SCAM_DETECTION.HEALTH);
  },

  /**
   * Get supported multilingual explanation languages (en, hi, mr).
   */
  async getSupportedLanguages(): Promise<SupportedLanguagesResponse> {
    return http.get<SupportedLanguagesResponse>(API_ENDPOINTS.SCAM_DETECTION.LANGUAGES);
  },
};
