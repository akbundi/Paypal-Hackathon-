import React, { useState } from 'react';
import { usePayGuard } from '../context/PayGuardContext';
import { TrustedContact } from '../types';
import { AddContactModal } from '../components/circle/AddContactModal';
import { PendingApprovalCard } from '../components/circle/PendingApprovalCard';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { Button } from '../components/common/Button';
import {
  Users2,
  UserPlus,
  Mail,
  Phone,
  CheckCircle2,
  Trash2,
  Clock,
  Send,
} from 'lucide-react';

export const TrustedCircle: React.FC = () => {
  const {
    t,
    trustedContacts,
    pendingApprovals,
    addContact,
    deleteContact,
    addToast,
  } = usePayGuard();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<TrustedContact | null>(null);

  const handleTestPing = (contact: TrustedContact) => {
    addToast(
      'Test Alert Dispatched',
      `Simulated SMS & Push notification sent to ${contact.name} (${contact.phone}). Verification payload OK.`,
      'info'
    );
  };

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-trust-50 dark:bg-trust-950/70 text-trust-700 dark:text-trust-300 text-[11px] font-mono font-medium uppercase tracking-wider mb-2 border border-trust-200/80 dark:border-trust-800">
            <Users2 className="w-3.5 h-3.5 text-trust-600 dark:text-trust-400" />
            <span>Dual-Key Authorization & Family Safeguards</span>
          </div>
          <h1 className="text-[26px] sm:text-[28px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            {t.trustedCircle.title}
          </h1>
          <p className="text-[14px] font-normal text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-normal">
            {t.trustedCircle.subtitle}
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<UserPlus className="w-4 h-4" />}
          className="font-semibold self-start sm:self-auto"
        >
          {t.trustedCircle.addContact}
        </Button>
      </div>

      {/* Pending Approvals Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-amber-500" />
            <h3 className="text-[18px] sm:text-[19px] font-bold text-slate-900 dark:text-white tracking-tight">
              {t.trustedCircle.pendingApprovals} ({pendingApprovals.length})
            </h3>
          </div>
          <span className="text-[12px] font-normal text-slate-500 dark:text-slate-400">
            Requires authorization from a designated co-signer
          </span>
        </div>

        {pendingApprovals.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-[#0B132B] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-soft-sm">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-[14px] font-bold text-slate-800 dark:text-slate-200">
              Zero Pending Payment Approvals
            </p>
            <p className="text-[12px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
              All transactions have either been verified, released, or permanently blocked.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingApprovals.map((appr) => (
              <PendingApprovalCard key={appr.id} approval={appr} />
            ))}
          </div>
        )}
      </div>

      {/* Active Trusted Contacts Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[18px] sm:text-[19px] font-bold text-slate-900 dark:text-white tracking-tight">
            {t.trustedCircle.activeContacts} ({trustedContacts.length})
          </h3>
          <span className="text-[12px] font-normal text-slate-500 dark:text-slate-400">
            Contacts authorized to review escrow-held payments
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trustedContacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-white dark:bg-[#0B132B] rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-soft-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-semibold text-slate-700 dark:text-slate-200 text-[13px]">
                      {contact.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-[13px] font-medium text-slate-900 dark:text-white">{contact.name}</h4>
                      <p className="text-[12px] text-emerald-600 dark:text-emerald-400 font-normal">
                        {contact.relationship}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-mono uppercase px-2 py-0.5 rounded font-medium ${
                      contact.status === 'verified'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                    }`}
                  >
                    {contact.status}
                  </span>
                </div>

                <div className="space-y-1.5 py-3 border-t border-slate-100 dark:border-slate-800 text-[13px] text-slate-600 dark:text-slate-400 font-normal">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate font-mono text-[12px] flex-1 min-w-0">{contact.email}</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="font-mono text-[12px] truncate flex-1 min-w-0">{contact.phone}</span>
                  </div>
                </div>

                <div className="mt-2 p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200/60 dark:border-slate-800 text-[12px]">
                  <span className="text-[11px] uppercase font-medium text-slate-400 dark:text-slate-500 block mb-0.5">
                    Authority Scope:
                  </span>
                  <span className="font-normal text-slate-800 dark:text-slate-200">{contact.permissions}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[12px]">
                <button
                  onClick={() => handleTestPing(contact)}
                  className="font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors"
                >
                  <Send className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Send Test Ping</span>
                </button>

                <button
                  onClick={() => setContactToDelete(contact)}
                  className="text-slate-400 hover:text-coral-600 dark:hover:text-coral-400 p-1 rounded transition-colors"
                  title="Remove Contact"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <AddContactModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addContact}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(contactToDelete)}
        onClose={() => setContactToDelete(null)}
        onConfirm={() => {
          if (contactToDelete) {
            deleteContact(contactToDelete.id);
            addToast('Contact Removed', `${contactToDelete.name} was removed from your Trusted Circle.`, 'info');
          }
        }}
        title="Remove Trusted Contact"
        message={`Are you sure you want to remove ${contactToDelete?.name || 'this contact'} from your Trusted Circle? They will no longer receive dual-key approval alerts for held transactions.`}
        confirmLabel="Remove Contact"
        variant="danger"
      />
    </div>
  );
};
