import React, { useState } from 'react';
import { TrustedContact } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { UserCheck } from 'lucide-react';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (contact: Omit<TrustedContact, 'id'>) => void;
}

export const AddContactModal: React.FC<AddContactModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('Parent / Guardian');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [permissions, setPermissions] = useState('Purchases > $100 & High-Risk Alerts');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const relationships = [
    'Parent / Guardian',
    'Spouse / Partner',
    'Adult Child',
    'Sibling',
    'Financial Advisor / CPA',
    'Caregiver',
  ];

  const permissionOptions = [
    'Purchases > $100 & High-Risk Alerts',
    'All AI Agent Purchases & Escalated Invoices',
    'Critical Risk Interceptions Only (>85 Score)',
    'Full Co-Signer Authority (Any transaction over $250)',
  ];

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) {
      errs.name = 'Full name is required.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!emailRegex.test(email.trim())) {
      errs.email = 'Please provide a valid email address (e.g. name@example.com).';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onAdd({
      name: name.trim(),
      relationship,
      email: email.trim(),
      phone: phone.trim() || '+1 (555) 000-0000',
      permissions,
      status: 'active',
      notificationsEnabled,
    });

    // Reset and close
    setName('');
    setEmail('');
    setPhone('');
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Trusted Approver"
      subtitle="Nominate a family member or co-signer to review suspicious payments."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Full Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
            }}
            placeholder="e.g. Sarah Miller"
            className="w-full px-3.5 py-2 text-[13px] font-normal bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-electric-500/20 focus:border-electric-500 text-slate-900 dark:text-white"
          />
          {errors.name && <p className="text-[12px] text-coral-600 dark:text-coral-400 mt-1">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Relationship
            </label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="w-full px-3.5 py-2 text-[13px] font-normal bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-electric-500/20 text-slate-900 dark:text-white"
            >
              {relationships.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="w-full px-3.5 py-2 text-[13px] font-normal bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-electric-500/20 font-mono text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
            }}
            placeholder="sarah.miller@example.com"
            className="w-full px-3.5 py-2 text-[13px] font-normal bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-electric-500/20 focus:border-electric-500 text-slate-900 dark:text-white"
          />
          {errors.email && <p className="text-[12px] text-coral-600 dark:text-coral-400 mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Approval Permissions
          </label>
          <select
            value={permissions}
            onChange={(e) => setPermissions(e.target.value)}
            className="w-full px-3.5 py-2 text-[13px] font-normal bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-electric-500/20 text-slate-900 dark:text-white"
          >
            {permissionOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="notifToggle"
            checked={notificationsEnabled}
            onChange={(e) => setNotificationsEnabled(e.target.checked)}
            className="w-4 h-4 text-emerald-600 rounded border-slate-300 dark:border-slate-700 focus:ring-emerald-500"
          />
          <label htmlFor="notifToggle" className="text-[13px] text-slate-700 dark:text-slate-300 font-normal">
            Send real-time SMS & Email push alerts for held payments
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            leftIcon={<UserCheck className="w-4 h-4" />}
          >
            Add to Circle
          </Button>
        </div>
      </form>
    </Modal>
  );
};
