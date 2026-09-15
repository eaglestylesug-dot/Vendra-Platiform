import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  Info,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  X,
  Zap
} from 'lucide-react';
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
  const { summary, token, refreshUserData, profile, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Direct PesaPal Checkout State
  const [isInitiatingPesaPal, setIsInitiatingPesaPal] = useState(false);
  const [pesapalOrder, setPesapalOrder] = useState<{
    orderTrackingId: string;
    redirectUrl: string;
    merchantRef: string;
  } | null>(null);
  const [isCheckingPesaPal, setIsCheckingPesaPal] = useState(false);
  const [pesapalStatusText, setPesapalStatusText] = useState('Waiting for payment confirmation on PesaPal...');
  const [isPurchasedSuccess, setIsPurchasedSuccess] = useState(false);

  // Auto-poll PesaPal status for product activation
  useEffect(() => {
    let timer: any = null;
    if (pesapalOrder && !isPurchasedSuccess) {
      const pollStatus = async () => {
        try {
          const res = await fetch(`/api/pesapal/status/${encodeURIComponent(pesapalOrder.orderTrackingId)}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.isCompleted || data.activatedPurchase) {
              setIsPurchasedSuccess(true);
              setPesapalStatusText('Payment confirmed by PesaPal! Product activated and 24-hour profit cycle started.');
              await refreshUserData();
              setTimeout(() => {
                onSuccess();
              }, 2000);
            }
          }
        } catch (_e) {
          // Polling failover
        }
      };
      timer = setInterval(pollStatus, 3000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [pesapalOrder, isPurchasedSuccess, token]);

  if (!product) return null;

  const principal = product.price;
  const dailyIncome = product.daily_income || Math.round(product.price * product.return_rate);
  const totalRevenue = product.total_revenue || (product.daily_income ? product.daily_income * product.duration_days : Math.round(product.price * product.return_rate * product.duration_days));
  const vipTag = product.vip_level || (product.eligibility_tier?.startsWith('VIP') ? product.eligibility_tier : 'VIP');

  const hasActiveDeposit = (summary.total_deposits || 0) >= 10000 && summary.has_active_recharge;
  const hasSufficientBalance = summary.available_balance >= principal;

  // 1. Purchase from Account Balance
  const handlePurchaseFromBalance = async () => {
    if (!hasActiveDeposit) {
      setError('Active deposit required: You must have an active deposit of at least UGX 10,000 before activating investment equipment.');
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
      setError(err.message || 'An unexpected error occurred during purchase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Direct Instant Purchase via PesaPal Gateway
  const handleDirectPesaPalPurchase = async () => {
    setIsInitiatingPesaPal(true);
    setError(null);

    try {
      const res = await fetch(`/api/products/${product.id}/pesapal-initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          phone_number: user?.phone,
          email: profile?.email,
          full_name: profile?.full_name
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate PesaPal checkout.');
      }

      setPesapalOrder({
        orderTrackingId: data.order_tracking_id,
        redirectUrl: data.redirect_url,
        merchantRef: data.merchant_reference
      });

      // Open PesaPal payment window
      try {
        window.open(data.redirect_url, '_blank', 'width=600,height=750');
      } catch (_e) {
        // Fallback handled by link
      }
    } catch (err: any) {
      setError(err.message || 'PesaPal initiation failed.');
    } finally {
      setIsInitiatingPesaPal(false);
    }
  };

  const handleManualCheckStatus = async () => {
    if (!pesapalOrder) return;
    setIsCheckingPesaPal(true);
    try {
      const res = await fetch(`/api/pesapal/status/${encodeURIComponent(pesapalOrder.orderTrackingId)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.isCompleted || data.activatedPurchase) {
        setIsPurchasedSuccess(true);
        setPesapalStatusText('Payment confirmed by PesaPal! Product activated and 24-hour cycle started.');
        await refreshUserData();
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setPesapalStatusText(`Status: ${data.status || 'PENDING'}. Please complete checkout on the PesaPal screen.`);
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setIsCheckingPesaPal(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
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
          <h2 className="text-xl font-black text-slate-900 dark:text-white leading-snug">
            {product.name}
          </h2>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
          {product.description}
        </p>

        {/* PesaPal Active Direct Order Terminal */}
        {pesapalOrder ? (
          <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 mb-4 text-center">
            {isPurchasedSuccess ? (
              <div className="py-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  Payment Verified!
                </h4>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                  Product activated. Your 24-hour profit cycle has begun.
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-center gap-2 mb-2 text-orange-600 dark:text-orange-400 font-bold text-sm">
                  <CreditCard className="w-4 h-4" />
                  <span>PesaPal Checkout Opened</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                  Please complete the payment of <strong>{formatUGX(principal)}</strong> on the PesaPal payment gateway.
                </p>

                <a
                  href={pesapalOrder.redirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-2 mb-2 hover:bg-orange-700"
                >
                  <span>Reopen PesaPal Checkout</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={handleManualCheckStatus}
                  disabled={isCheckingPesaPal}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingPesaPal ? 'animate-spin' : ''}`} />
                  <span>{isCheckingPesaPal ? 'Verifying with PesaPal...' : 'Check Payment Status'}</span>
                </button>

                <p className="text-[10px] text-slate-400 mt-2">{pesapalStatusText}</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* VENDRA INVESTMENT PLAN BREAKDOWN */}
            <div className="rounded-2xl bg-gradient-to-b from-blue-50/50 to-slate-50 dark:from-slate-800/80 dark:to-slate-800/40 p-4 border border-blue-200/50 dark:border-slate-700 mb-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white mb-3">
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>VENDRA Investment Specification</span>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* 1. Price */}
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Plan Price:</span>
                  <span className="font-black text-blue-600 dark:text-blue-400 text-sm">
                    {formatUGX(principal)}
                  </span>
                </div>

                {/* 2. Daily Income */}
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Daily 24-Hour Profit:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    +{formatUGX(dailyIncome)} / day
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
                  <span className="font-bold text-slate-900 dark:text-white">Total Projected Return:</span>
                  <span className="text-base font-black text-amber-600 dark:text-amber-400">
                    {formatUGX(totalRevenue)}
                  </span>
                </div>
              </div>
            </div>

            {/* 24-Hour Server Profit Generation Guarantee */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-800/40 text-orange-900 dark:text-orange-200 text-[11px] mb-4 leading-relaxed">
              <Clock className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-black block">Strict 24-Hour Server-Side Profit Cycle:</span>
                Your profit cycle starts from the confirmed payment timestamp. Profits mature and become available exactly 24 hours later, measured solely by the secure server clock.
              </div>
            </div>

            {/* Balance Status */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs mb-4">
              <span className="text-slate-500 dark:text-slate-400">Your Current Available Balance:</span>
              <span
                className={`font-bold ${
                  hasSufficientBalance ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                }`}
              >
                {formatUGX(summary.available_balance)}
              </span>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2.5">
              {hasSufficientBalance && hasActiveDeposit ? (
                <button
                  type="button"
                  onClick={handlePurchaseFromBalance}
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Activating Equipment...' : `Invest via Account Balance • ${formatUGX(principal)}`}
                </button>
              ) : null}

              {/* Direct Instant PesaPal Purchase Button */}
              <button
                type="button"
                onClick={handleDirectPesaPalPurchase}
                disabled={isInitiatingPesaPal}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:brightness-105 active:scale-[0.99] text-white font-black text-sm shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>
                  {isInitiatingPesaPal ? 'Connecting to PesaPal...' : `Instant Buy with PesaPal (${formatUGX(principal)})`}
                </span>
              </button>

              {!hasSufficientBalance && (
                <button
                  type="button"
                  onClick={onNeedRecharge}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Or Recharge Balance First via PesaPal
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-medium"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
