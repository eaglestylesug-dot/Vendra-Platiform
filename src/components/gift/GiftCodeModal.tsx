import React, { useState } from 'react';
import { Gift, CheckCircle2, X, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { formatUGX } from '../../utils/currency.ts';

interface GiftCodeModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const GiftCodeModal: React.FC<GiftCodeModalProps> = ({ onClose, onSuccess }) => {
  const { token, refreshUserData } = useAuth();
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redeemedData, setRedeemedData] = useState<{
    amount: number;
    message: string;
  } | null>(null);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError('Please enter a valid gift code.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/gift-codes/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ code: cleanCode })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to redeem gift code.');
      }

      setRedeemedData({
        amount: data.amount,
        message: data.message || `UGX ${data.amount.toLocaleString()} credited successfully!`
      });
      await refreshUserData();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to redeem gift code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {!redeemedData ? (
          <form onSubmit={handleRedeem}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50">
                <Gift className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                  Redeem Gift Code
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Instant balance rewards issued by VENDRA Administration
                </p>
              </div>
            </div>

            {/* Instruction Banner */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 mb-5 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>
                Enter the promotional or reward gift code received from official VENDRA events, channels, or telegram promotions.
              </span>
            </div>

            {/* Code Input */}
            <div className="mb-5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Gift Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. VEN-XXXX-XXXX"
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-base font-mono font-bold tracking-wider uppercase focus:outline-none focus:border-amber-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Codes are case-insensitive and can be used according to their specific terms.
              </span>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !code.trim()}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:brightness-105 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-orange-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                'Verifying Code...'
              ) : (
                <>
                  <span>Claim Gift Reward</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Success Screen */
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
              Gift Code Redeemed!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              {redeemedData.message}
            </p>

            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center mb-6">
              <span className="text-xs text-emerald-700 dark:text-emerald-300 font-bold block mb-1">
                Credited Amount
              </span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                +{formatUGX(redeemedData.amount)}
              </span>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-6">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Funds added directly to your available balance</span>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
