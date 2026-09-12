import React, { useState } from 'react';
import { AlertTriangle, Calendar, CheckCircle2, Info, ShieldCheck, TrendingUp, X, Zap } from 'lucide-react';
import { Product } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { formatUGX } from '../../utils/currency.ts';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onSuccess: () => void;
  onNeedRecharge: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onSuccess,
  onNeedRecharge
}) => {
  const { summary, token, refreshUserData } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!product) return null;

  const principal = product.price;
  const dailyIncome = product.daily_income || Math.round(product.price * product.return_rate);
  const totalRevenue = product.total_revenue || (product.daily_income ? product.daily_income * product.duration_days : Math.round(product.price * product.return_rate * product.duration_days));
  const ratePercentage = (product.return_rate * 100).toFixed(0);
  const vipTag = product.vip_level || (product.eligibility_tier?.startsWith('VIP') ? product.eligibility_tier : 'VIP');

  const hasActiveDeposit = (summary.total_deposits || 0) >= 10000 && summary.has_active_recharge;
  const hasSufficientBalance = summary.available_balance >= principal;

  const handlePurchase = async () => {
    if (!hasActiveDeposit) {
      setError('Active deposit required: You must make an active deposit of at least UGX 10,000 before purchasing products. The UGX 5,000 welcome bonus cannot be used without an active deposit.');
      return;
    }

    if (!hasSufficientBalance) {
      onNeedRecharge();
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/products/${product.id}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to acquire product.');
      }

      await refreshUserData();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during participation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-2xl overflow-y-auto max-h-[92vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image Header */}
        {product.image_url && (
          <div className="relative -mx-6 -mt-6 mb-4 h-44 overflow-hidden rounded-t-3xl bg-slate-900">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/20" />
            <div className="absolute bottom-3 left-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-600 text-white shadow-xs">
                <Zap className="w-3 h-3 text-amber-300" />
                {vipTag}
              </span>
              <span className="text-[11px] font-bold text-white uppercase tracking-wide bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-md">
                {product.category}
              </span>
            </div>
          </div>
        )}

        {/* Title */}
        <div className="pr-8 mb-3">
          {!product.image_url && (
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-600 text-white shadow-xs">
                <Zap className="w-3 h-3 text-amber-300" />
                {vipTag}
              </span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {product.category}
              </span>
            </div>
          )}
          <h2 className="text-xl font-black text-slate-900 dark:text-white leading-snug">
            {product.name}
          </h2>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
          {product.description}
        </p>

        {/* Active Deposit Rule Notice if user has no deposit */}
        {!hasActiveDeposit && (
          <div className="p-3.5 mb-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-black mb-0.5">Active Deposit Required</strong>
              <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                You must have an active deposit of at least UGX 10,000 to acquire equipment plans. The UGX 5,000 welcome bonus cannot be used to buy products without an active deposit.
              </p>
            </div>
          </div>
        )}

        {/* VENDRA INVESTMENT PLAN BREAKDOWN */}
        <div className="rounded-2xl bg-gradient-to-b from-blue-50/50 to-slate-50 dark:from-slate-800/80 dark:to-slate-800/40 p-4 border border-blue-200/50 dark:border-slate-700 mb-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white mb-3">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>VENDRA Investment Plan Specification</span>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* 1. Price */}
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Investment Price:</span>
              <span className="font-black text-blue-600 dark:text-blue-400 text-sm">
                {formatUGX(principal)}
              </span>
            </div>

            {/* 2. Daily Income */}
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Daily Profit:</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                {formatUGX(dailyIncome)} / day
              </span>
            </div>

            {/* 3. Duration */}
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Contract Duration:</span>
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {product.duration_days}-Day Plan
              </span>
            </div>

            {/* 4. Total Revenue */}
            <div className="flex items-center justify-between pt-1">
              <span className="font-bold text-slate-900 dark:text-white">Total Term Return:</span>
              <span className="text-base font-black text-amber-600 dark:text-amber-400">
                {formatUGX(totalRevenue)}
              </span>
            </div>
          </div>
        </div>

        {/* Balance Status */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs mb-4">
          <span className="text-slate-500 dark:text-slate-400">Your Available Balance:</span>
          <span
            className={`font-bold ${
              hasSufficientBalance ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
            }`}
          >
            {formatUGX(summary.available_balance)}
          </span>
        </div>

        {/* Trust & Guarantee */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 text-blue-900 dark:text-blue-200 text-[11px] mb-5 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Safe & Verified Operating Plan:</span>
            Your daily operating profit starts on Day 1 upon purchase and reflects instantly on your dashboard balance.
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-2">
          {!hasActiveDeposit ? (
            <button
              onClick={onNeedRecharge}
              className="w-full py-3.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Make Active Deposit to Unlock Equipment</span>
            </button>
          ) : hasSufficientBalance ? (
            <button
              onClick={handlePurchase}
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? 'Confirming Fleet Lease...' : `Invest Now • ${formatUGX(principal)}`}
            </button>
          ) : (
            <button
              onClick={onNeedRecharge}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all"
            >
              Recharge Balance via Mobile Money
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
