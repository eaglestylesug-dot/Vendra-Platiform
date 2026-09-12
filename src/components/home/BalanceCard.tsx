import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Clock, ShieldCheck, TrendingUp, Wallet } from 'lucide-react';
import { UserFinancialSummary } from '../../types/index.ts';
import { formatUGX } from '../../utils/currency.ts';

interface BalanceCardProps {
  summary: UserFinancialSummary;
  onRecharge: () => void;
  onWithdraw: () => void;
  onHistory: () => void;
  onSupport: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  summary,
  onRecharge,
  onWithdraw,
  onHistory,
  onSupport
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-600 via-orange-600 to-amber-500 p-5 text-white shadow-xl shadow-orange-500/15">
      {/* Decorative vector watermarks */}
      <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute -left-12 -bottom-12 w-40 h-40 rounded-full bg-black/15 blur-xl pointer-events-none" />
      
      {/* Top Bar: Label & Security badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-md">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-semibold tracking-wide text-orange-100 uppercase">
            Available Balance
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-medium bg-black/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-orange-100 border border-white/10">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
          <span>Verified Ledger</span>
        </div>
      </div>

      {/* Main Big Number */}
      <div className="mb-3">
        <div className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-sm">
          {formatUGX(summary.available_balance)}
        </div>
        {summary.pending_withdrawals > 0 && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-100 font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-200" />
            <span>Reserved in pending withdrawals: {formatUGX(summary.pending_withdrawals)}</span>
          </div>
        )}
      </div>

      {/* Equipment Daily Yield Highlight if user has active fleet */}
      {(summary.active_product_count || 0) > 0 && (
        <div className="mb-3.5 p-2.5 rounded-2xl bg-emerald-950/40 border border-emerald-400/30 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <span className="text-[10px] text-emerald-200 uppercase font-black tracking-wider block">
                Active Fleet Profit ({summary.active_product_count} Units)
              </span>
              <span className="text-xs text-white font-medium">
                Generating daily commercial returns
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-black text-emerald-300">
              +{formatUGX(summary.daily_expected_yield || 0)}
            </span>
            <span className="text-[9px] text-emerald-200/80 block uppercase font-bold">Daily Yield</span>
          </div>
        </div>
      )}

      {/* 3 Secondary Financial Figures */}
      <div className="grid grid-cols-3 gap-2 py-3 px-3.5 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 mb-5">
        <div>
          <span className="text-[10px] text-orange-200 uppercase font-medium block">Fleet Profits</span>
          <span className="text-xs sm:text-sm font-bold tracking-tight text-white block mt-0.5 truncate">
            {formatUGX(summary.product_operating_profits || summary.total_earnings)}
          </span>
        </div>
        <div className="border-x border-white/10 px-2">
          <span className="text-[10px] text-orange-200 uppercase font-medium block">Total Deposits</span>
          <span className="text-xs sm:text-sm font-bold tracking-tight text-white block mt-0.5 truncate">
            {formatUGX(summary.total_deposits)}
          </span>
        </div>
        <div className="pl-1">
          <span className="text-[10px] text-orange-200 uppercase font-medium block">Total Payouts</span>
          <span className="text-xs sm:text-sm font-bold tracking-tight text-white block mt-0.5 truncate">
            {formatUGX(summary.total_withdrawals)}
          </span>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={onRecharge}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white text-orange-600 font-bold text-sm shadow-md hover:bg-orange-50 active:scale-[0.98] transition-all"
        >
          <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
          <span>Recharge</span>
        </button>

        <button
          onClick={onWithdraw}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-950/80 hover:bg-slate-950 text-white font-bold text-sm border border-white/15 active:scale-[0.98] transition-all"
        >
          <ArrowUpRight className="w-4 h-4 stroke-[2.5] text-amber-400" />
          <span>Withdraw</span>
        </button>
      </div>
    </div>
  );
};
