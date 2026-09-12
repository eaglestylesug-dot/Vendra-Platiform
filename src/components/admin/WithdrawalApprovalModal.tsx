import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  Phone,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  User,
  X,
  Zap
} from 'lucide-react';
import { Withdrawal } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { formatUGX, formatDate } from '../../utils/currency.ts';

interface WithdrawalApprovalModalProps {
  onClose: () => void;
}

export const WithdrawalApprovalModal: React.FC<WithdrawalApprovalModalProps> = ({ onClose }) => {
  const { token, refreshUserData, user } = useAuth();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected item for review/action dialog
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'mark_paid' | 'reject' | 'require_verification'>('mark_paid');
  const [payoutReference, setPayoutReference] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Voucher preview dialog
  const [viewVoucher, setViewVoucher] = useState<Withdrawal | null>(null);

  const fetchWithdrawals = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/withdrawals', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWithdrawals(data);
      }
    } catch (err) {
      console.error('Failed to load withdrawals queue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWithdrawal) return;
    setIsProcessing(true);
    setStatusMessage(null);

    // Auto generate telecom reference if mark_paid and none provided
    const resolvedRef = actionType === 'mark_paid'
      ? (payoutReference.trim() || `MM-UGX-${Date.now().toString().slice(-8)}`)
      : payoutReference.trim();

    try {
      const res = await fetch(`/api/admin/withdrawals/${selectedWithdrawal.id}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: actionType,
          payout_reference: resolvedRef,
          admin_notes: adminNote.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process withdrawal action.');
      }

      setStatusMessage({
        type: 'success',
        text: `Withdrawal #${selectedWithdrawal.id.slice(0, 8)} successfully updated to '${actionType}'!`
      });

      // Reset and refresh
      setSelectedWithdrawal(null);
      setPayoutReference('');
      setAdminNote('');
      await fetchWithdrawals();
      await refreshUserData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Action failed.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick 1-click approve & disburse handler
  const handleQuickDisburse = async (w: Withdrawal) => {
    setIsProcessing(true);
    setStatusMessage(null);
    const generatedRef = `MOMO-UG-${Date.now().toString().slice(-8)}`;

    try {
      const res = await fetch(`/api/admin/withdrawals/${w.id}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'mark_paid',
          payout_reference: generatedRef,
          admin_notes: 'Approved and disbursed via VENDRA Executive Authority'
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Quick disbursement failed.');
      }

      setStatusMessage({
        type: 'success',
        text: `Disbursed ${formatUGX(w.net_amount ?? (w.amount * 0.95))} to ${w.momo_number || w.phone_number} (Ref: ${generatedRef})!`
      });

      await fetchWithdrawals();
      await refreshUserData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to disburse.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter & Search Logic
  const filteredWithdrawals = withdrawals.filter(w => {
    if (filterStatus !== 'all' && w.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const phoneMatch = (w.momo_number || w.phone_number || '').toLowerCase().includes(q) || (w.user_phone || '').toLowerCase().includes(q);
      const nameMatch = (w.user_name || '').toLowerCase().includes(q);
      const refMatch = (w.payout_reference || '').toLowerCase().includes(q) || w.id.toLowerCase().includes(q);
      return phoneMatch || nameMatch || refMatch;
    }
    return true;
  });

  // Calculate statistics
  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;
  const pendingTotal = withdrawals
    .filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + (w.net_amount ?? (w.amount * 0.95)), 0);

  const completedCount = withdrawals.filter(w => w.status === 'completed').length;
  const completedTotal = withdrawals
    .filter(w => w.status === 'completed')
    .reduce((sum, w) => sum + (w.net_amount ?? (w.amount * 0.95)), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 p-[1.5px] shadow-md shadow-orange-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Withdrawal Approval & Payout Authority
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  SOLE APPROVER CONSOLE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Authorized Approver: <strong className="text-slate-200">{user?.phone || 'Executive'}</strong> • MTN MoMo & Airtel Money Disbursal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchWithdrawals}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
              title="Refresh queue"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Executive Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-950/40 border-b border-slate-800">
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                Pending Approval
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300">
                {pendingCount}
              </span>
            </div>
            <span className="text-sm sm:text-base font-black text-white block">
              {formatUGX(pendingTotal)}
            </span>
            <span className="text-[10px] text-slate-400">Requires your authorization</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Total Disbursed
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300">
                {completedCount}
              </span>
            </div>
            <span className="text-sm sm:text-base font-black text-white block">
              {formatUGX(completedTotal)}
            </span>
            <span className="text-[10px] text-slate-400">Paid out to members</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">
              Telecom Gateways
            </span>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-yellow-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                MTN MoMo
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Airtel
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Live API & Manual Payouts</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Approval Authority
            </span>
            <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              DIRECT OWNER
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">Only you can approve payouts</span>
          </div>
        </div>

        {/* Status Toast Message */}
        {statusMessage && (
          <div
            className={`p-3 mx-4 mt-3 rounded-2xl border flex items-center justify-between text-xs animate-fade-in ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/70 border-emerald-700 text-emerald-200'
                : 'bg-rose-950/70 border-rose-700 text-rose-200'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-white ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Filter Tabs & Search Bar */}
        <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
            {[
              { id: 'pending', label: `Pending (${pendingCount})`, color: 'amber' },
              { id: 'processing', label: 'Processing', color: 'blue' },
              { id: 'completed', label: `Completed (${completedCount})`, color: 'emerald' },
              { id: 'rejected', label: 'Rejected', color: 'rose' },
              { id: 'all', label: `All (${withdrawals.length})`, color: 'slate' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  filterStatus === f.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search phone, name, ref..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-hidden focus:border-blue-500"
            />
          </div>
        </div>

        {/* Withdrawals List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
          {isLoading && withdrawals.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
              <span>Loading live withdrawal requests...</span>
            </div>
          ) : filteredWithdrawals.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs rounded-2xl bg-slate-950/40 border border-slate-800">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="font-bold text-slate-300">No withdrawals found matching this filter.</p>
              <p className="text-[11px] text-slate-500 mt-0.5">All pending user requests are up to date.</p>
            </div>
          ) : (
            filteredWithdrawals.map(w => {
              const isMtn = (w.momo_provider || '').includes('MTN') || (w.momo_number || '').startsWith('+25677') || (w.momo_number || '').startsWith('+25678');
              const isPending = w.status === 'pending';
              const isProcessing = w.status === 'processing';
              const isCompleted = w.status === 'completed';
              const isRejected = w.status === 'rejected';

              return (
                <div
                  key={w.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isPending
                      ? 'bg-slate-950/80 border-amber-500/40 shadow-sm shadow-amber-500/5'
                      : isCompleted
                      ? 'bg-slate-950/40 border-slate-800 opacity-90'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    {/* Recipient info */}
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 ${
                          isMtn
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {isMtn ? 'MTN' : 'AIR'}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">
                            {w.user_name || 'VENDRA Investor'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isPending
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                                : isProcessing
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                : isCompleted
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            }`}
                          >
                            {w.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                          <span className="font-mono text-slate-300 font-bold flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-500" />
                            {w.momo_number}
                          </span>
                          <span>•</span>
                          <span>{w.momo_provider}</span>
                          <span>•</span>
                          <span className="text-[10px]">{formatDate(w.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Amount & Net Calculation */}
                    <div className="text-left sm:text-right">
                      <div className="flex items-baseline sm:justify-end gap-1.5">
                        <span className="text-xs text-slate-400">Net Payout:</span>
                        <span className="text-base sm:text-lg font-black text-emerald-400">
                          {formatUGX(w.net_amount)}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center sm:justify-end gap-2">
                        <span>Gross: {formatUGX(w.amount)}</span>
                        <span>Fee: {formatUGX(w.fee)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Reference & Notes Display if any */}
                  {(w.payout_reference || w.admin_notes) && (
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs mb-3 flex flex-wrap items-center justify-between gap-2">
                      {w.payout_reference && (
                        <div className="flex items-center gap-1 text-[11px] font-mono text-blue-300">
                          <span className="text-slate-500">Payout Ref:</span>
                          <span className="font-bold">{w.payout_reference}</span>
                        </div>
                      )}
                      {w.admin_notes && (
                        <div className="text-[11px] text-slate-400 italic">
                          "{w.admin_notes}"
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewVoucher(w)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-400" />
                        <span>Payout Voucher</span>
                      </button>

                      <span className="text-[10px] font-mono text-slate-600">
                        ID: {w.id.slice(0, 10)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleQuickDisburse(w)}
                            disabled={isProcessing}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
                          >
                            <Zap className="w-3.5 h-3.5 text-amber-300" />
                            <span>1-Click Disburse</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedWithdrawal(w);
                              setActionType('approve');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all"
                          >
                            Review & Options...
                          </button>
                        </>
                      )}

                      {isProcessing && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedWithdrawal(w);
                            setActionType('mark_paid');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all"
                        >
                          Complete Payout
                        </button>
                      )}

                      {isCompleted && (
                        <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Disbursed to Mobile Money
                        </span>
                      )}

                      {isRejected && (
                        <span className="text-xs text-rose-400 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Refunded to Account
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detailed Action Modal */}
        {selectedWithdrawal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-black text-white">
                    Authorize Withdrawal Payout
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedWithdrawal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Recipient Details Card */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Recipient:</span>
                  <span className="font-bold text-white">{selectedWithdrawal.user_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">MoMo Number:</span>
                  <span className="font-mono font-bold text-amber-400">{selectedWithdrawal.momo_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Provider:</span>
                  <span className="font-bold text-slate-200">{selectedWithdrawal.momo_provider}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-2">
                  <span className="text-slate-400">Net Amount to Disburse:</span>
                  <span className="font-black text-sm text-emerald-400">{formatUGX(selectedWithdrawal.net_amount)}</span>
                </div>
              </div>

              <form onSubmit={handleActionSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Select Decision Action
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setActionType('mark_paid')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all text-left ${
                        actionType === 'mark_paid'
                          ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-xs'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      ✓ Disburse & Mark Paid
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionType('approve')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all text-left ${
                        actionType === 'approve'
                          ? 'bg-blue-950/80 border-blue-500 text-blue-300 shadow-xs'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      ⏳ Queue Processing
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionType('reject')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all text-left ${
                        actionType === 'reject'
                          ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-xs'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      ✕ Reject & Refund Balance
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionType('require_verification')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all text-left ${
                        actionType === 'require_verification'
                          ? 'bg-purple-950/80 border-purple-500 text-purple-300 shadow-xs'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      🛡 Require KYC First
                    </button>
                  </div>
                </div>

                {actionType === 'mark_paid' && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Telecom Transaction Reference (Optional)
                    </label>
                    <input
                      type="text"
                      value={payoutReference}
                      onChange={e => setPayoutReference(e.target.value)}
                      placeholder="Leave blank to auto-generate MOMO-UGX ref..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-hidden focus:border-emerald-500 font-mono"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Approver Note (visible to user)
                  </label>
                  <input
                    type="text"
                    value={adminNote}
                    onChange={e => setAdminNote(e.target.value)}
                    placeholder={
                      actionType === 'reject'
                        ? 'Reason for refunding...'
                        : 'e.g. Sent via MTN Corporate Payout API'
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedWithdrawal(null)}
                    className="w-1/3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all ${
                      actionType === 'reject'
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : 'bg-emerald-600 hover:bg-emerald-500'
                    }`}
                  >
                    {isProcessing ? 'Executing...' : 'Confirm & Execute'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Official Disbursement Voucher Preview Modal */}
        {viewVoucher && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm bg-white text-slate-900 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="text-center border-b border-slate-200 pb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 block">
                  VENDRA COMMERCIAL LEDGER
                </span>
                <h3 className="text-base font-black text-slate-900">
                  MOBILE MONEY PAYOUT VOUCHER
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">
                  REF: {viewVoucher.payout_reference || `VCH-${viewVoucher.id.slice(0, 8).toUpperCase()}`}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Date & Time:</span>
                  <span className="font-semibold text-slate-800">{formatDate(viewVoucher.created_at)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Recipient Name:</span>
                  <span className="font-bold text-slate-900">{viewVoucher.user_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Payout Network:</span>
                  <span className="font-semibold text-slate-800">{viewVoucher.momo_provider}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Recipient MoMo Number:</span>
                  <span className="font-mono font-bold text-slate-900">{viewVoucher.momo_number}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Gross Withdrawal:</span>
                  <span className="font-semibold text-slate-800">{formatUGX(viewVoucher.amount)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Processing Fee (5%):</span>
                  <span className="font-semibold text-slate-800">{formatUGX(viewVoucher.fee)}</span>
                </div>
                <div className="flex justify-between py-1.5 bg-slate-50 px-2 rounded-lg font-black text-sm">
                  <span className="text-slate-900">Disbursed Amount:</span>
                  <span className="text-emerald-700">{formatUGX(viewVoucher.net_amount)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold uppercase text-xs text-emerald-600">{viewVoucher.status}</span>
                </div>
              </div>

              <div className="text-center pt-2">
                <span className="text-[10px] text-slate-400 block font-mono">
                  Authorized by Platform Payout Approver • Ugandan Telecom Settlement
                </span>
                <button
                  onClick={() => setViewVoucher(null)}
                  className="mt-4 w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
                >
                  Close Voucher
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
