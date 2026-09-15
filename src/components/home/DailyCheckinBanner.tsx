import React, { useState } from 'react';
import { CalendarCheck, Gift, Sparkles, CheckCircle2, ChevronRight, Lock, Unlock, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { formatUGX } from '../../utils/currency.ts';

interface DailyCheckinBannerProps {
  onOpenDeposit: () => void;
}

export const DailyCheckinBanner: React.FC<DailyCheckinBannerProps> = ({ onOpenDeposit }) => {
  const { summary, token, refreshUserData, user } = useAuth();
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  const claimedToday = summary.daily_checkin_claimed_today ?? false;
  const streak = summary.daily_checkin_streak ?? 1;
  const hasActiveRecharge = summary.has_active_recharge ?? (summary.total_deposits >= 10000);

  const handleClaim = async () => {
    if (!token || claimedToday || isClaiming) return;
    setIsClaiming(true);
    setClaimError(null);

    try {
      const res = await fetch('/api/user/daily-checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to claim check-in bonus.');
      }

      setClaimSuccess('+UGX 300 Added to Balance!');
      await refreshUserData();
      setTimeout(() => setClaimSuccess(null), 4000);
    } catch (err: any) {
      setClaimError(err.message || 'Check-in failed');
      setTimeout(() => setClaimError(null), 3500);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="space-y-3 mb-5">
      {/* 1. Daily Check-in Loyalty Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-rose-500/15 border border-amber-300/40 dark:border-amber-600/30 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 flex-shrink-0">
              <CalendarCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Daily Check-In
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
                  Day {streak}/7
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                Get <span className="font-bold text-orange-600 dark:text-orange-400">UGX 300 free bonus</span> every 24 hours
              </p>
            </div>
          </div>

          <button
            onClick={handleClaim}
            disabled={claimedToday || isClaiming}
            className={`px-4 py-2 rounded-2xl text-xs font-black shadow-md transition-all flex items-center gap-1.5 flex-shrink-0 ${
              claimedToday
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 cursor-default'
                : 'bg-gradient-to-r from-orange-600 to-amber-500 hover:brightness-105 text-white active:scale-95 shadow-orange-500/25'
            }`}
          >
            {claimedToday ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Claimed</span>
              </>
            ) : isClaiming ? (
              <span>Crediting...</span>
            ) : (
              <>
                <Gift className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>+UGX 300</span>
              </>
            )}
          </button>
        </div>

        {claimSuccess && (
          <div className="mt-2.5 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>{claimSuccess}</span>
          </div>
        )}

        {claimError && (
          <div className="mt-2.5 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 text-rose-600 dark:text-rose-300 text-xs font-semibold animate-fade-in">
            {claimError}
          </div>
        )}
      </div>

      {/* 2. 5k Welcome Bonus & Active Recharge Indicator */}
      <div
        onClick={!hasActiveRecharge ? onOpenDeposit : undefined}
        className={`rounded-2xl p-3.5 border transition-all flex items-center justify-between gap-3 ${
          hasActiveRecharge
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-100'
            : 'bg-slate-900 text-white border-slate-800 shadow-md cursor-pointer hover:bg-slate-850'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
              hasActiveRecharge
                ? 'bg-emerald-500 text-white'
                : 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md'
            }`}
          >
            {hasActiveRecharge ? (
              <Unlock className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <Lock className="w-4 h-4 stroke-[2.5]" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-tight">
                {hasActiveRecharge ? 'UGX 5,000 Bonus Unlocked' : 'UGX 5,000 Welcome Bonus'}
              </span>
              <span
                className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                  hasActiveRecharge
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                    : 'bg-amber-400/20 text-amber-300'
                }`}
              >
                {hasActiveRecharge ? 'Withdrawable' : 'Pending Recharge'}
              </span>
            </div>
            <p className="text-[10px] text-slate-300 dark:text-slate-400 truncate mt-0.5">
              {hasActiveRecharge
                ? 'Active recharge verified: All earnings & bonuses are fully withdrawable.'
                : 'Deposit min UGX 500 to unlock withdrawal of your UGX 5,000 welcome bonus & earnings.'}
            </p>
          </div>
        </div>

        {!hasActiveRecharge && (
          <div className="flex items-center gap-1 text-[11px] font-black text-amber-400 flex-shrink-0">
            <span>Recharge</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
    </div>
  );
};
