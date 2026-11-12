/**
 * Trusted Circle API Module.
 * 
 * BACKEND STATUS: [TODO: Pending backend implementation]
 * Manages trusted family / security contacts and pending escrow approvals.
 */

import { http } from './http';
import { API_ENDPOINTS } from './endpoints';
import {
  TrustedContactsResponse,
  AddTrustedContactRequest,
  UpdateTrustedContactRequest,
} from '../../types/api.types';
import { TrustedContact, PendingApproval } from '../../types';

export const trustedCircleApi = {
  /**
   * Fetch all registered trusted contacts and their active status.
   */
  async getTrustedContacts(): Promise<TrustedContact[]> {
    const res = await http.get<TrustedContactsResponse | TrustedContact[]>(
      API_ENDPOINTS.TRUSTED_CIRCLE.CONTACTS
    );
    return Array.isArray(res) ? res : res.contacts;
  },

  /**
   * Add a new trusted contact to the user's family / safeguard circle.
   */
  async addTrustedContact(contact: AddTrustedContactRequest): Promise<TrustedContact> {
    return http.post<TrustedContact>(API_ENDPOINTS.TRUSTED_CIRCLE.CONTACTS, contact);
  },

  /**
   * Update an existing trusted contact.
   */
  async updateTrustedContact(
    id: string,
    updates: UpdateTrustedContactRequest
  ): Promise<TrustedContact> {
    return http.patch<TrustedContact>(
      API_ENDPOINTS.TRUSTED_CIRCLE.CONTACT_BY_ID(id),
      updates
    );
  },

  /**
   * Remove a trusted contact from the circle.
   */
  async deleteTrustedContact(id: string): Promise<void> {
    return http.delete(API_ENDPOINTS.TRUSTED_CIRCLE.CONTACT_BY_ID(id));
  },

  /**
   * Fetch all transactions currently held in escrow awaiting dual-key review.
   */
  async getPendingApprovals(): Promise<PendingApproval[]> {
    return http.get<PendingApproval[]>(API_ENDPOINTS.TRUSTED_CIRCLE.APPROVALS);
  },

  /**
   * Approve an escrow-held transaction.
   */
  async approvePendingApproval(approvalId: string, notes?: string): Promise<void> {
    return http.post(API_ENDPOINTS.TRUSTED_CIRCLE.APPROVE(approvalId), { notes });
  },

  /**
   * Reject and permanently cancel an escrow-held transaction.
   */
  async rejectPendingApproval(approvalId: string, reason?: string): Promise<void> {
    return http.post(API_ENDPOINTS.TRUSTED_CIRCLE.REJECT(approvalId), { reason });
  },

  /**
   * Dispatch a test SMS & verification alert to a trusted contact.
   */
  async pingContact(contactId: string): Promise<{ success: boolean; latencyMs?: number }> {
    return http.post(API_ENDPOINTS.TRUSTED_CIRCLE.PING_CONTACT(contactId));
  },
};
