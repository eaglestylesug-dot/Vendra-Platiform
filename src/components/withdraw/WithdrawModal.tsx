import React, { useState } from 'react';
import { ArrowUpRight, CheckCircle2, Info, Lock, Phone, ShieldCheck, X } from 'lucide-react';
import { MobileMoneyProvider } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { formatUGX } from '../../utils/currency.ts';

interface WithdrawModalProps {
  onClose: () => void;
  onSuccess: () => void;
  onOpenDeposit?: () => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({ onClose, onSuccess, onOpenDeposit }) => {
  const { user, profile, summary, token, refreshUserData } = useAuth();

  const [amount, setAmount] = useState<string>('10000');
  const [provider, setProvider] = useState<MobileMoneyProvider>(
    profile?.momo_provider || 'MTN_MOMO'
  );
  const [phoneNumber, setPhoneNumber] = useState<string>(
    profile?.momo_number || user?.phone || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    reference: string;
    amount: number;
  } | null>(null);

  const numAmount = parseFloat(amount) || 0;
  
  // Uganda Time (EAT, UTC+3) Working Hours Calculation: 8:00 AM to 6:00 PM
  const now = new Date();
  const eatHours = (now.getUTCHours() + 3) % 24;
  const eatMinutes = eatHours * 60 + now.getUTCMinutes();
  const isWithinWorkingHours = eatMinutes >= 480 && eatMinutes <= 1080; // 480 = 8:00 AM, 1080 = 6:00 PM

  const hasConfirmedDeposit = summary.has_confirmed_deposit ?? (summary.total_deposits >= 15000);
  const hasPurchasedProduct = summary.has_purchased_product ?? ((summary.active_product_count || 0) > 0 || (summary.total_product_purchases || 0) > 0);
  const isEligibleToWithdraw = hasConfirmedDeposit && hasPurchasedProduct;
  const isBalanceSufficient = summary.available_balance >= numAmount;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isWithinWorkingHours) {
      setError('Withdrawals are available from 8:00 AM to 6:00 PM.');
      return;
    }

    if (!hasConfirmedDeposit) {
      setError('Deposit required: You must have at least one confirmed deposit of at least UGX 15,000 before withdrawing.');
      return;
    }

    if (!hasPurchasedProduct) {
      setError('Product purchase required: You must purchase at least one commercial product before you can withdraw.');
      return;
    }

    if (numAmount < 5000) {
      setError('Minimum withdrawal is UGX 5,000.');
      return;
    }

    if (numAmount > summary.available_balance) {
      setError(
        `Insufficient available balance. You requested UGX ${numAmount.toLocaleString()}, but available balance is UGX ${summary.available_balance.toLocaleString()}.`
      );
      return;
    }

    if (!phoneNumber || phoneNumber.length < 9) {
      setError('Please provide a valid Mobile Money recipient phone number.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: numAmount,
          provider,
          phone_number: phoneNumber
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Withdrawal failed.');
      }

      await refreshUserData();
      setSuccessResult({
        reference: data.withdrawal.reference,
        amount: data.withdrawal.amount
      });
    } catch (err: any) {
      setError(err.message || 'Failed to submit withdrawal.');
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
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {!successResult ? (
          <form onSubmit={handleWithdraw}>
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-2.5 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200/50">
                <ArrowUpRight className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                  Withdraw to Mobile Money
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Secure disbursement queue with double-spend protection
                </p>
              </div>
            </div>

            {/* Current Balance Bar */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 mb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Available Funds</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {formatUGX(summary.available_balance)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAmount(String(summary.available_balance))}
                className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline px-2 py-1 rounded bg-orange-50 dark:bg-orange-950/40 border border-orange-200/40"
              >
                Max All
              </button>
            </div>

            {/* Amount input */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Withdrawal Amount (UGX)
                </label>
                <span className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold">
                  Min: UGX 5,000
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="5000"
                  step="500"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="Enter amount (min 5,000)"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-base font-bold focus:outline-none focus:border-orange-500"
                />
                <span className="absolute right-4 top-3.5 text-xs text-slate-400 font-bold">UGX</span>
              </div>
            </div>

            {/* Provider Selector */}
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                Payout Network
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setProvider('MTN_MOMO')}
                  className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all ${
                    provider === 'MTN_MOMO'
                      ? 'border-amber-500 bg-amber-500/10 text-slate-900 dark:text-white font-bold ring-2 ring-amber-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-amber-400 flex-shrink-0" />
                  <div className="text-left">
                    <span className="text-xs block font-bold">MTN MoMo</span>
                    <span className="text-[10px] text-slate-400 block">Payout Rail</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider('AIRTEL_MONEY')}
                  className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all ${
                    provider === 'AIRTEL_MONEY'
                      ? 'border-red-500 bg-red-500/10 text-slate-900 dark:text-white font-bold ring-2 ring-red-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-red-500 flex-shrink-0" />
                  <div className="text-left">
                    <span className="text-xs block font-bold">Airtel Money</span>
                    <span className="text-[10px] text-slate-400 block">Payout Rail</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Recipient Phone */}
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Destination Mobile Money Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 0771234567"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:border-orange-500"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Working Hours Indicator */}
            {!isWithinWorkingHours && (
              <div className="p-3.5 mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs">
                <div className="flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-600 dark:text-amber-400 block font-bold">
                      Outside Working Hours
                    </strong>
                    <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      Withdrawals are available from <strong>8:00 AM to 6:00 PM</strong> (Uganda Time). Please submit your request during working hours.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Dual Eligibility Policy Card */}
            {!isEligibleToWithdraw && (
              <div className="p-3.5 mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs">
                <div className="flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="w-full">
                    <strong className="text-amber-600 dark:text-amber-400 block font-bold">
                      Withdrawal Eligibility Requirements
                    </strong>
                    <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      To safeguard our platform community, accounts must meet two simple requirements to activate withdrawals:
                    </p>

                    <div className="mt-2.5 space-y-1.5">
                      <div className="flex items-center gap-2">
                        {hasConfirmedDeposit ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-amber-400 flex items-center justify-center text-[9px] font-bold text-amber-600">!</div>
                        )}
                        <span className={`text-[11px] ${hasConfirmedDeposit ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-600 dark:text-slate-300'}`}>
                          1. Confirmed deposit of at least UGX 15,000 {hasConfirmedDeposit ? '✓ (Completed)' : '(Required)'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {hasPurchasedProduct ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-amber-400 flex items-center justify-center text-[9px] font-bold text-amber-600">!</div>
                        )}
                        <span className={`text-[11px] ${hasPurchasedProduct ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-600 dark:text-slate-300'}`}>
                          2. Purchased at least one product {hasPurchasedProduct ? '✓ (Completed)' : '(Required)'}
                        </span>
                      </div>
                    </div>

                    {!hasConfirmedDeposit && onOpenDeposit && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenDeposit();
                        }}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 text-white font-bold text-[11px] shadow-sm hover:brightness-105"
                      >
                        Make a Deposit (Min UGX 15,000)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Double-Spend & Reserve Security notice */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 mb-5 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-slate-800 dark:text-slate-100">
                  Administrator Review & Double-Spend Protection:
                </span>
                Upon submission, {formatUGX(numAmount)} is locked in escrow. The platform administrator will verify and confirm your Mobile Money transfer to {phoneNumber || 'your registered number'}.
              </div>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !isBalanceSufficient || numAmount < 5000 || !isEligibleToWithdraw || !isWithinWorkingHours}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 hover:brightness-105 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-orange-500/20 disabled:opacity-50 transition-all"
            >
              {isSubmitting
                ? 'Reserving Funds in Ledger...'
                : !isWithinWorkingHours
                ? 'Withdrawals Open 8:00 AM – 6:00 PM'
                : !isEligibleToWithdraw
                ? 'Requirements Not Met'
                : !isBalanceSufficient
                ? 'Insufficient Balance'
                : `Submit Withdrawal • ${formatUGX(numAmount)}`}
            </button>
          </form>
        ) : (
          /* Success Screen */
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
              Withdrawal Queued for Admin Confirmation
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Funds reserved in escrow. Administrator will verify and confirm payout to your {provider} number.
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-left mb-6 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Reserved Amount:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatUGX(successResult.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Audit Reference:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {successResult.reference}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="font-bold text-amber-500">AWAITING_ADMIN_CONFIRMATION</span>
              </div>
            </div>

            <button
              onClick={() => {
                onSuccess();
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
