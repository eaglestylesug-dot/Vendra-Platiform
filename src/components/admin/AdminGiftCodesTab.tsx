import React, { useState, useEffect } from 'react';
import {
  Gift,
  Plus,
  RefreshCw,
  Copy,
  Check,
  Power,
  Trash2,
  Calendar,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { formatUGX, formatDate } from '../../utils/currency.ts';

interface AdminGiftCodesTabProps {
  token: string | null;
  onRefreshRequired?: () => void;
}

export const AdminGiftCodesTab: React.FC<AdminGiftCodesTabProps> = ({ token, onRefreshRequired }) => {
  const [giftCodes, setGiftCodes] = useState<any[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'codes' | 'redemptions'>('codes');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Creation Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [codeForm, setCodeForm] = useState({
    code: '',
    value: 10000,
    max_uses: 1,
    expires_at: '',
    notes: ''
  });

  const fetchGiftData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [codesRes, redemptionsRes] = await Promise.all([
        fetch('/api/admin/gift-codes', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/admin/gift-codes/redemptions', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (codesRes.ok) {
        setGiftCodes(await codesRes.json());
      }
      if (redemptionsRes.ok) {
        setRedemptions(await redemptionsRes.json());
      }
    } catch (err) {
      console.error('Failed to fetch gift code data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGiftData();
  }, [token]);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGenerateRandomCode = () => {
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const rand2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    setCodeForm(prev => ({ ...prev, code: `VEN-${rand}-${rand2}` }));
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSubmitting(true);
    setCreateError(null);

    try {
      const res = await fetch('/api/admin/gift-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(codeForm)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create gift code.');
      }

      setShowCreateModal(false);
      setCodeForm({
        code: '',
        value: 10000,
        max_uses: 1,
        expires_at: '',
        notes: ''
      });
      await fetchGiftData();
      if (onRefreshRequired) onRefreshRequired();
    } catch (err: any) {
      setCreateError(err.message || 'Creation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    if (!token) return;
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/gift-codes/${id}/toggle-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        await fetchGiftData();
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDeleteCode = async (id: string, code: string) => {
    if (!token) return;
    if (!confirm(`Are you sure you want to permanently delete gift code ${code}?`)) return;

    try {
      const res = await fetch(`/api/admin/gift-codes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchGiftData();
      }
    } catch (err) {
      console.error('Failed to delete gift code:', err);
    }
  };

  const filteredCodes = giftCodes.filter(g =>
    g.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.notes && g.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredRedemptions = redemptions.filter(r =>
    (r.user_phone && r.user_phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (r.code && r.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-5">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center flex-shrink-0">
            <Gift className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              VENDRA Gift Code Management
            </h3>
            <p className="text-xs text-slate-400">
              Generate promotional vouchers, claimable bonuses, and audit usage history
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={fetchGiftData}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-500' : ''}`} />
          </button>
          <button
            onClick={() => {
              handleGenerateRandomCode();
              setShowCreateModal(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Generate Gift Code</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('codes')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'codes'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Active Codes ({giftCodes.length})
          </button>
          <button
            onClick={() => setActiveSubTab('redemptions')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'redemptions'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Redemption History ({redemptions.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={activeSubTab === 'codes' ? 'Search codes or notes...' : 'Search phone or code...'}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* SUB-TAB 1: CODES LIST */}
      {activeSubTab === 'codes' && (
        <div className="space-y-3">
          {isLoading && giftCodes.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
              Loading gift codes...
            </div>
          ) : filteredCodes.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              No gift codes found matching criteria. Click &quot;Generate Gift Code&quot; to create one.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredCodes.map(code => {
                const isExpired = code.expires_at && new Date(code.expires_at).getTime() < Date.now();
                const isFullyClaimed = code.used_count >= code.max_uses;

                return (
                  <div
                    key={code.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col justify-between gap-3 relative overflow-hidden"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-slate-900 dark:text-white tracking-wide bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                            {code.code}
                          </span>
                          <button
                            onClick={() => handleCopy(code.code, code.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-amber-500 transition-colors"
                            title="Copy Code"
                          >
                            {copiedId === code.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            code.status !== 'ACTIVE'
                              ? 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                              : isExpired
                              ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                              : isFullyClaimed
                              ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                              : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                          }`}
                        >
                          {code.status !== 'ACTIVE'
                            ? 'INACTIVE'
                            : isExpired
                            ? 'EXPIRED'
                            : isFullyClaimed
                            ? 'MAX USED'
                            : 'ACTIVE'}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between mb-2">
                        <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                          {formatUGX(code.value)}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          Claimed: <strong className="text-slate-800 dark:text-slate-200">{code.used_count}</strong> / {code.max_uses}
                        </span>
                      </div>

                      {code.notes && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800 mb-2">
                          {code.notes}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Created: {formatDate(code.created_at)}</span>
                        {code.expires_at ? (
                          <span>Expires: {formatDate(code.expires_at)}</span>
                        ) : (
                          <span>No expiration</span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                      <button
                        onClick={() => handleToggleStatus(code.id, code.status)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
                          code.status === 'ACTIVE'
                            ? 'border-amber-200 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                            : 'border-emerald-200 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        <span>{code.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteCode(code.id, code.code)}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete code"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: REDEMPTION AUDIT LOGS */}
      {activeSubTab === 'redemptions' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
          {filteredRedemptions.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              No gift code redemptions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">User Phone</th>
                    <th className="p-3.5">Gift Code</th>
                    <th className="p-3.5">Amount Credited</th>
                    <th className="p-3.5">Redemption Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {filteredRedemptions.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                      <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                        {r.user_phone || 'User #' + r.user_id.slice(-6)}
                      </td>
                      <td className="p-3.5">
                        <span className="font-mono bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded text-amber-600 dark:text-amber-400 font-bold">
                          {r.code}
                        </span>
                      </td>
                      <td className="p-3.5 font-black text-emerald-600 dark:text-emerald-400">
                        +{formatUGX(r.amount)}
                      </td>
                      <td className="p-3.5 text-slate-500 dark:text-slate-400">
                        {formatDate(r.redeemed_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE GIFT CODE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Generate Gift Voucher
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCode} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Voucher Code
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomCode}
                    className="text-[10px] text-amber-600 dark:text-amber-400 font-bold hover:underline"
                  >
                    🎲 Generate Random
                  </button>
                </div>
                <input
                  type="text"
                  value={codeForm.code}
                  onChange={e => setCodeForm({ ...codeForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. VEN-PROMO-10K"
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold text-sm uppercase focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Reward Value (UGX)
                </label>
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {[5000, 10000, 20000, 50000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCodeForm({ ...codeForm, value: val })}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        codeForm.value === val
                          ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {(val / 1000)}K
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={codeForm.value}
                  onChange={e => setCodeForm({ ...codeForm, value: Math.max(100, Number(e.target.value)) })}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Maximum Redemptions (Total Users)
                </label>
                <input
                  type="number"
                  min="1"
                  value={codeForm.max_uses}
                  onChange={e => setCodeForm({ ...codeForm, max_uses: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Set to 1 for a single-use personal voucher, or 50+ for promotional public codes.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Expiry Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={codeForm.expires_at}
                  onChange={e => setCodeForm({ ...codeForm, expires_at: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Internal Notes / Event Tag (Optional)
                </label>
                <input
                  type="text"
                  value={codeForm.notes}
                  onChange={e => setCodeForm({ ...codeForm, notes: e.target.value })}
                  placeholder="e.g. VIP Member Bonus, Telegram Giveaway"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {createError && (
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-medium border border-rose-200">
                  {createError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Issue Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
