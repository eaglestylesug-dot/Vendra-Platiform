import React, { useState, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, Clock, CheckCircle2, Filter, History, RefreshCw, X, AlertCircle } from 'lucide-react';
import { Transaction, TransactionType } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { formatUGX, formatDate } from '../../utils/currency.ts';

interface HistoryModalProps {
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ onClose }) => {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const filterTabs = [
    { key: 'ALL', label: 'All' },
    { key: 'DEPOSIT', label: 'Deposits' },
    { key: 'WITHDRAWAL', label: 'Withdrawals' },
    { key: 'PRODUCT_PURCHASE', label: 'Purchases' },
    { key: 'PRODUCT_REWARD', label: 'Yields' },
    { key: 'REFERRAL_REWARD', label: 'Referrals' },
    { key: 'ADJUSTMENT', label: 'Adjustments' }
  ];

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/transactions', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filtered = transactions.filter(tx => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'WITHDRAWAL') {
      return (
        tx.transaction_type === 'WITHDRAWAL_RESERVE' ||
        tx.transaction_type === 'WITHDRAWAL_COMPLETED' ||
        tx.transaction_type === 'WITHDRAWAL_REFUND'
      );
    }
    if (activeFilter === 'ADJUSTMENT') {
      return (
        tx.transaction_type === 'ADJUSTMENT_CREDIT' ||
        tx.transaction_type === 'ADJUSTMENT_DEBIT'
      );
    }
    return tx.transaction_type === activeFilter;
  });

  const getTxStyle = (type: TransactionType) => {
    switch (type) {
      case 'DEPOSIT':
      case 'PRODUCT_REWARD':
      case 'REFERRAL_REWARD':
      case 'ADJUSTMENT_CREDIT':
      case 'WITHDRAWAL_REFUND':
        return {
          sign: '+',
          color: 'text-emerald-600 dark:text-emerald-400',
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
          icon: ArrowDownLeft
        };
      case 'PRODUCT_PURCHASE':
      case 'WITHDRAWAL_RESERVE':
      case 'WITHDRAWAL_COMPLETED':
      case 'ADJUSTMENT_DEBIT':
        return {
          sign: '-',
          color: 'text-rose-600 dark:text-rose-400',
          bgColor: 'bg-rose-50 dark:bg-rose-950/40',
          icon: ArrowUpRight
        };
      default:
        return {
          sign: '',
          color: 'text-slate-700 dark:text-slate-300',
          bgColor: 'bg-slate-100 dark:bg-slate-800',
          icon: History
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                Account History
              </h2>
              <p className="text-xs text-slate-400">Verified double-entry financial ledger</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={fetchHistory}
              className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-orange-500' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 py-3 overflow-x-auto no-scrollbar">
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeFilter === tab.key
                  ? 'bg-slate-900 text-white dark:bg-orange-500 dark:text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Transactions List */}
        <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
              <span>Querying verified database records...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              No transactions found in this category.
            </div>
          ) : (
            filtered.map(tx => {
              const style = getTxStyle(tx.transaction_type);
              const Icon = style.icon;

              return (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800/80 cursor-pointer transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl ${style.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${style.color}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {tx.transaction_type.replace(/_/g, ' ')}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                            tx.status === 'SUCCESSFUL'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : tx.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {tx.description}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(tx.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className={`text-sm font-black ${style.color}`}>
                      {style.sign}
                      {formatUGX(tx.amount)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      Ref: {tx.reference.slice(-8)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Tx Detail Modal */}
        {selectedTx && (
          <div className="absolute inset-0 z-20 bg-white dark:bg-slate-900 rounded-3xl p-6 flex flex-col justify-between animate-fade-in">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Audit Record Details
                </h3>
                <button
                  onClick={() => setSelectedTx(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-800 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Transaction ID:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{selectedTx.id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Reference:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedTx.reference}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Amount:</span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{formatUGX(selectedTx.amount)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Type:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedTx.transaction_type}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Status:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedTx.status}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Timestamp:</span>
                  <span className="text-slate-800 dark:text-slate-200">{formatDate(selectedTx.created_at)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Subsystem Source:</span>
                  <span className="font-mono text-slate-600 dark:text-slate-300">{selectedTx.source}</span>
                </div>
                <div className="py-1">
                  <span className="text-slate-400 block mb-1">Description:</span>
                  <p className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 leading-relaxed">
                    {selectedTx.description}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedTx(null)}
              className="w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs"
            >
              Back to List
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
