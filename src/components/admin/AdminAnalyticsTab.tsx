import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  TrendingUp,
  Users,
  Share2,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  RefreshCw,
  CheckCircle2,
  Percent
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { formatUGX } from '../../utils/currency.ts';

interface AnalyticsData {
  userRegistrationTrend: Array<{
    date: string;
    rawDate: string;
    newUsers: number;
    cumulativeUsers: number;
  }>;
  referralGrowthTrend: Array<{
    date: string;
    rawDate: string;
    level1Referrals: number;
    level2Referrals: number;
    totalCumulativeReferrals: number;
  }>;
  financialVolumeTrend: Array<{
    date: string;
    rawDate: string;
    commissionsPaidUGX: number;
    depositsVolumeUGX: number;
    withdrawalsVolumeUGX: number;
  }>;
  summary: {
    totalUsers: number;
    totalReferrals: number;
    totalCommissionsUGX: number;
    l1Rate: number;
    l2Rate: number;
    minWithdrawalUGX: number;
    maxWithdrawalUGX: number;
    minDepositUGX: number;
  };
}

export const AdminAnalyticsTab: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshingSilent, setIsRefreshingSilent] = useState<boolean>(false);
  const [timeRange, setTimeRange] = useState<'14d' | '30d'>('14d');
  const [countdown, setCountdown] = useState<number>(30);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

  const fetchAnalytics = async (showInitialSpinner = true) => {
    if (showInitialSpinner) {
      setIsLoading(true);
    } else {
      setIsRefreshingSilent(true);
    }
    try {
      const res = await fetch('/api/admin/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshingSilent(false);
    }
  };

  // Initial fetch on mount or token change
  useEffect(() => {
    fetchAnalytics(true);
  }, [token]);

  // 30-Second Polling Mechanism with 1-second interval ticker for countdown
  useEffect(() => {
    const ticker = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Trigger polling refresh every 30 seconds
          fetchAnalytics(false);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(ticker);
  }, [token]);

  const handleManualRefresh = () => {
    setCountdown(30);
    fetchAnalytics(false);
  };

  const regData = (data?.userRegistrationTrend && data.userRegistrationTrend.length > 0)
    ? data.userRegistrationTrend
    : [
        { date: 'Today', newUsers: data?.summary?.totalUsers || 0, cumulativeUsers: data?.summary?.totalUsers || 0 }
      ];

  const refData = (data?.referralGrowthTrend && data.referralGrowthTrend.length > 0)
    ? data.referralGrowthTrend
    : [
        { date: 'Today', level1Referrals: data?.summary?.totalReferrals || 0, level2Referrals: 0, totalCumulativeReferrals: data?.summary?.totalReferrals || 0 }
      ];

  const finData = (data?.financialVolumeTrend && data.financialVolumeTrend.length > 0)
    ? data.financialVolumeTrend
    : [
        { date: 'Today', commissionsPaidUGX: data?.summary?.totalCommissionsUGX || 0, depositsVolumeUGX: 0, withdrawalsVolumeUGX: 0 }
      ];

  const totalCommissions = data?.summary?.totalCommissionsUGX ?? 0;
  const totalUsers = data?.summary?.totalUsers ?? 0;
  const totalReferrals = data?.summary?.totalReferrals ?? 0;

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Top Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Executive Analytics & Growth Intelligence
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold border border-emerald-300 dark:border-emerald-800">
              Live Recharts Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time visualization of network referral acceleration, total commission disbursements, and user onboarding trajectories.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Real-time 30s Polling Status Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px]">
              {isRefreshingSilent ? 'Updating...' : `Auto-sync in ${countdown}s`}
            </span>
            <span className="text-[10px] text-slate-400">({lastUpdated})</span>
          </div>

          <button
            onClick={handleManualRefresh}
            title="Force immediate refresh and reset 30s timer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-200/50 dark:border-orange-800/40 text-xs font-bold transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(isLoading || isRefreshingSilent) ? 'animate-spin text-orange-500' : ''}`} />
            <span>Sync Now</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Members</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {totalUsers.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
            <TrendingUp className="w-3 h-3" />
            <span>Active growth trend</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Referral Network</span>
            <Share2 className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {totalReferrals.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            L1 (35%) & L2 (6%) members
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Commissions Paid</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            {formatUGX(totalCommissions)}
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            Directly credited on deposits
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Deposit Clearance</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            100% Auto
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            <span>Instant Gateway Webhooks</span>
          </div>
        </div>
      </div>

      {/* CHART 1: Referral Network Growth (Recharts BarChart) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Share2 className="w-4 h-4 text-purple-600" />
              <span>Referral Network Growth by Tier (Level 1: 35% vs Level 2: 6%)</span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Daily acquisition of sponsored Level 1 members and secondary Level 2 team members.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="flex items-center gap-1 font-semibold text-purple-600">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
              Level 1 (35%)
            </span>
            <span className="flex items-center gap-1 font-semibold text-amber-500">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              Level 2 (6%)
            </span>
          </div>
        </div>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={refData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="level1Referrals" name="Level 1 Direct (35%)" fill="#9333ea" radius={[4, 4, 0, 0]} />
              <Bar dataKey="level2Referrals" name="Level 2 Indirect (6%)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CHART 2: Total Commission Payouts vs Transaction Volume (Recharts Area & Line Chart) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Total Commission Disbursements & Gateway Volume (UGX)</span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Commissions paid to sponsors compared with confirmed gateway deposits and paid withdrawals.
            </p>
          </div>
        </div>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={finData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="commColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="depColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(val: any) => formatUGX(Number(val))}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Area
                type="monotone"
                dataKey="depositsVolumeUGX"
                name="Gateway Deposits"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#depColor)"
              />
              <Area
                type="monotone"
                dataKey="commissionsPaidUGX"
                name="Referral Commissions Paid"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#commColor)"
              />
              <Line
                type="monotone"
                dataKey="withdrawalsVolumeUGX"
                name="Withdrawals Paid"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CHART 3: User Registration Trends (Recharts Line & Area Chart) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>User Registration Trajectory & Daily Signups</span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Daily new member signups and cumulative network user base over the observation window.
            </p>
          </div>
        </div>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={regData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Line
                type="monotone"
                dataKey="newUsers"
                name="Daily New Registrations"
                stroke="#f97316"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#f97316' }}
              />
              <Line
                type="monotone"
                dataKey="cumulativeUsers"
                name="Cumulative Registered Members"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Financial Governance & Policy Summary Box */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 text-xs space-y-3">
        <div className="flex items-center gap-2 text-orange-400 font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>Automated Deposit & Referral Payout Operational Safeguards</span>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 text-slate-300">
          <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60">
            <span className="text-slate-400 text-[10px] block font-semibold uppercase">Deposit Automation</span>
            <p className="text-xs font-bold text-white mt-0.5">Instant Reflection</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Gateway webhooks (MTN, Airtel, PesaPal) automatically credit accounts with zero manual admin delay.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60">
            <span className="text-slate-400 text-[10px] block font-semibold uppercase">Referral Payouts</span>
            <p className="text-xs font-bold text-white mt-0.5">35% L1 & 6% L2</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Commissions are automatically distributed upon referral deposit (min deposit UGX 500).
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60">
            <span className="text-slate-400 text-[10px] block font-semibold uppercase">Withdrawal Authority</span>
            <p className="text-xs font-bold text-white mt-0.5">Admin-Gated Clearing</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Withdrawals undergo administrative approval and limit checks (Min: 5k UGX, Max: 5M UGX) to protect reserves.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
