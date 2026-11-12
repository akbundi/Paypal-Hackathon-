import React, { useState, useMemo } from 'react';
import { usePayGuard } from '../context/PayGuardContext';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { TransactionDetailModal } from '../components/transactions/TransactionDetailModal';
import {
  History,
  Search,
  Download,
  ChevronRight,
  ShieldCheck,
  Bot,
  CreditCard,
  RotateCcw,
  X,
} from 'lucide-react';

export const Transactions: React.FC = () => {
  const {
    t,
    transactions,
    searchQuery,
    setSearchQuery,
    selectedTransaction,
    setSelectedTransaction,
    addToast,
  } = usePayGuard();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search
      const matchesSearch =
        !searchQuery ||
        tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.senderEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.category.toLowerCase().includes(searchQuery.toLowerCase());

      // Status
      const matchesStatus =
        statusFilter === 'all' || tx.status.toLowerCase() === statusFilter.toLowerCase();

      // Risk
      const matchesRisk =
        riskFilter === 'all' || tx.riskLevel.toLowerCase() === riskFilter.toLowerCase();

      // Source
      const matchesSource =
        sourceFilter === 'all' || tx.source.toLowerCase() === sourceFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesRisk && matchesSource;
    });
  }, [transactions, searchQuery, statusFilter, riskFilter, sourceFilter]);

  const handleExportCsv = () => {
    const headers = 'ID,Sender,Email,Amount,Date,RiskLevel,RiskScore,Status,Category,Source\n';
    const rows = filteredTransactions
      .map(
        (t) =>
          `"${t.id}","${t.sender}","${t.senderEmail}",${t.amount},"${t.date}","${t.riskLevel}",${t.riskScore},"${t.status}","${t.category}","${t.source}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `payguard_transactions_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('CSV Exported', `Exported ${filteredTransactions.length} records.`, 'success');
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'agent':
        return (
          <span title="AI Agent">
            <Bot className="w-3.5 h-3.5 text-electric-500" />
          </span>
        );
      case 'paypal':
        return (
          <span title="PayPal Sandbox">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
          </span>
        );
      default:
        return (
          <span title="Card Payment">
            <CreditCard className="w-3.5 h-3.5 text-slate-400" />
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-trust-50 dark:bg-trust-950/70 text-trust-700 dark:text-trust-300 text-[11px] font-mono font-medium uppercase tracking-wider mb-2 border border-trust-200/80 dark:border-trust-800">
            <History className="w-3.5 h-3.5 text-trust-600 dark:text-trust-400" />
            <span>Audited Security Ledger</span>
          </div>
          <h1 className="text-[26px] sm:text-[28px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            {t.transactions.title}
          </h1>
          <p className="text-[14px] font-normal text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-normal">
            {t.transactions.subtitle}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCsv}
          leftIcon={<Download className="w-4 h-4 text-slate-500" />}
          className="font-semibold self-start sm:self-auto"
        >
          {t.transactions.exportCsv}
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#0B132B] rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-soft-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.transactions.searchPlaceholder}
              className="w-full pl-10 pr-9 py-2 text-[13px] font-normal bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-electric-500/20 focus:border-electric-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-[13px] font-normal bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-electric-500/20 text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Statuses</option>
              <option value="protected">Protected</option>
              <option value="blocked">Blocked</option>
              <option value="held">Held</option>
            </select>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-3 py-2 text-[13px] font-normal bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-electric-500/20 text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
              <option value="critical">Critical Risk</option>
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-2 text-[13px] font-normal bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-electric-500/20 text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Sources</option>
              <option value="paypal">PayPal</option>
              <option value="agent">AI Agent</option>
            </select>

            {(statusFilter !== 'all' || riskFilter !== 'all' || sourceFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setRiskFilter('all');
                  setSourceFilter('all');
                  setSearchQuery('');
                }}
                className="text-[12px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-2 py-1 font-medium flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-[12px] font-normal text-slate-500 dark:text-slate-400 pt-1">
          <span>
            Showing <strong className="text-slate-800 dark:text-slate-200 font-medium">{filteredTransactions.length}</strong> of{' '}
            <strong className="text-slate-800 dark:text-slate-200 font-medium">{transactions.length}</strong> total records
          </span>
          <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">
            Click any row to view full AI risk breakdown & PayPal payload
          </span>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-[#0B132B] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-soft-sm overflow-hidden w-full min-w-0">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[680px] text-left">
            <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] sm:text-[12px] font-semibold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">{t.transactions.tableId}</th>
                <th className="py-3 px-4">{t.transactions.tableSender}</th>
                <th className="py-3 px-4">{t.transactions.tableAmount}</th>
                <th className="py-3 px-4">{t.transactions.tableDate}</th>
                <th className="py-3 px-4">{t.transactions.tableRisk}</th>
                <th className="py-3 px-4">{t.transactions.tableStatus}</th>
                <th className="py-3 px-4 text-right">{t.transactions.tableAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-[13px] font-normal">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No transactions match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTransaction(tx)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-1.5">
                        {getSourceIcon(tx.source)}
                        <span>{tx.id}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white text-[13.5px]">{tx.sender}</div>
                      <div className="text-[12px] text-slate-400 dark:text-slate-500 font-mono truncate max-w-xs font-normal">
                        {tx.senderEmail}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-[14px] text-slate-900 dark:text-white">
                      ${tx.amount.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap text-[12px] font-normal">
                      {tx.date}
                    </td>

                    <td className="py-3.5 px-4">
                      <RiskBadge level={tx.riskLevel} score={tx.riskScore} size="sm" />
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={tx.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span className="text-electric-600 dark:text-electric-400 font-medium group-hover:underline inline-flex items-center gap-0.5 text-[13px]">
                        <span>Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </div>
  );
};
