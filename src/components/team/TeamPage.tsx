import React, { useState, useEffect } from 'react';
import { CheckCircle, Copy, Gift, HelpCircle, QrCode, RefreshCw, Share2, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { formatUGX, formatDate, maskPhone } from '../../utils/currency.ts';

export const TeamPage: React.FC = () => {
  const { user, token } = useAuth();
  const [teamStats, setTeamStats] = useState<{
    direct_referrals_count: number;
    team_members_count: number;
    qualified_referrals_count: number;
    total_referral_rewards: number;
    rules: {
      l1_percentage: number;
      l2_percentage: number;
      min_deposit_qualification: number;
    };
    recent_members: any[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const fetchTeam = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/team', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTeamStats(data);
      }
    } catch (err) {
      console.error('Failed to load team data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const referralCode = user?.referral_code || 'VEN100';
  const inviteLink = `${window.location.origin}?ref=${referralCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="pb-24 pt-2 px-4 max-w-md mx-auto animate-fade-in space-y-4">
      {/* Top Banner Card */}
      <div className="rounded-3xl bg-gradient-to-br from-red-600 via-orange-600 to-amber-500 p-5 text-white shadow-xl shadow-orange-500/15 relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-orange-100">
            Team Network & Referral Rewards
          </span>
          <div className="flex items-center gap-1 text-[11px] bg-black/20 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/10">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
            <span>2-Tier Ledger</span>
          </div>
        </div>

        {/* Total Referral Rewards Earned */}
        <div className="mb-4">
          <span className="text-[10px] text-orange-200 uppercase font-bold block">
            Accrued Referral Earnings
          </span>
          <div className="text-3xl font-black tracking-tight">
            {formatUGX(teamStats?.total_referral_rewards || 0)}
          </div>
        </div>

        {/* 3 Metrics: Direct, Total, Qualified */}
        <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 text-center">
          <div>
            <span className="text-[10px] text-orange-200 block uppercase">Direct (L1)</span>
            <span className="text-base font-black text-white block">
              {teamStats?.direct_referrals_count ?? 0}
            </span>
          </div>
          <div className="border-x border-white/10">
            <span className="text-[10px] text-orange-200 block uppercase">Total Team</span>
            <span className="text-base font-black text-white block">
              {teamStats?.team_members_count ?? 0}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-orange-200 block uppercase">Qualified</span>
            <span className="text-base font-black text-amber-300 block">
              {teamStats?.qualified_referrals_count ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Invite Code & Link Box */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Your Exclusive Referral Code
            </h3>
            <p className="text-[11px] text-slate-400">Share with partners to earn commissions</p>
          </div>
          <button
            onClick={() => setShowQr(!showQr)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-orange-500 transition-all"
            title="Show QR Code"
          >
            <QrCode className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code expansion */}
        {showQr && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center animate-fade-in">
            {/* Geometric SVG QR representation */}
            <div className="w-36 h-36 bg-white p-2.5 rounded-xl mx-auto shadow-inner border border-slate-200 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full fill-slate-950">
                <rect x="10" y="10" width="25" height="25" fill="#000" />
                <rect x="15" y="15" width="15" height="15" fill="#fff" />
                <rect x="18" y="18" width="9" height="9" fill="#000" />
                <rect x="65" y="10" width="25" height="25" fill="#000" />
                <rect x="70" y="15" width="15" height="15" fill="#fff" />
                <rect x="73" y="18" width="9" height="9" fill="#000" />
                <rect x="10" y="65" width="25" height="25" fill="#000" />
                <rect x="15" y="70" width="15" height="15" fill="#fff" />
                <rect x="18" y="73" width="9" height="9" fill="#000" />
                <rect x="42" y="15" width="6" height="6" />
                <rect x="52" y="25" width="6" height="6" />
                <rect x="42" y="45" width="16" height="16" fill="#F97316" />
                <rect x="65" y="45" width="6" height="6" />
                <rect x="75" y="55" width="6" height="6" />
                <rect x="42" y="75" width="6" height="6" />
                <rect x="55" y="65" width="6" height="6" />
                <rect x="75" y="75" width="15" height="15" />
              </svg>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 block font-medium">
              Scan to Register under {referralCode}
            </span>
          </div>
        )}

        {/* Code Bar */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Code</span>
            <span className="text-lg font-black tracking-widest text-slate-900 dark:text-white font-mono">
              {referralCode}
            </span>
          </div>
          <button
            onClick={handleCopyCode}
            className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl font-bold text-xs transition-all ${
              copiedCode
                ? 'bg-emerald-600 text-white'
                : 'bg-orange-600 hover:bg-orange-500 text-white shadow-sm'
            }`}
          >
            {copiedCode ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Shareable Link Bar */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Invitation Link</span>
            <span className="text-xs text-slate-600 dark:text-slate-300 truncate block font-mono">
              {inviteLink}
            </span>
          </div>
          <button
            onClick={handleCopyLink}
            className={`flex items-center gap-1.5 py-2 px-3 rounded-xl font-bold text-xs transition-all flex-shrink-0 ${
              copiedLink
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
          </button>
        </div>
      </div>

      {/* Commission Rules Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
          <Gift className="w-4 h-4 text-orange-500" />
          <span>Legitimate Commission Tiers</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-800/40">
            <span className="text-[10px] uppercase font-bold text-orange-600 dark:text-orange-400 block mb-1">
              Tier 1 (Direct)
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white block mb-0.5">
              {teamStats?.rules?.l1_percentage ?? 35.0}%
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block leading-tight">
              Earned whenever a direct invite member makes a deposit.
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/40">
            <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block mb-1">
              Tier 2 (Indirect)
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white block mb-0.5">
              {teamStats?.rules?.l2_percentage ?? 6.0}%
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block leading-tight">
              Earned whenever a Level 2 team partner completes a deposit.
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 pt-1">
          * Commission Rule: Level 1 direct referrals yield 35% and Level 2 indirect referrals yield 6%. Commissions are only paid out after the referrals complete a verified deposit.
        </p>
      </div>

      {/* Team Members List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Referred Members ({teamStats?.recent_members?.length || 0})
          </h3>
          <button
            onClick={fetchTeam}
            className="text-xs text-orange-500 hover:text-orange-600 font-semibold"
          >
            Refresh
          </button>
        </div>

        {teamStats?.recent_members && teamStats.recent_members.length > 0 ? (
          <div className="space-y-2">
            {teamStats.recent_members.map(member => (
              <div
                key={member.id}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-white font-mono">
                      {maskPhone(member.phone)}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        member.is_qualified
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {member.is_qualified ? 'Qualified' : 'Pending Min Deposit'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Joined: {formatDate(member.joined_at)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                    {formatUGX(member.total_deposited)}
                  </span>
                  <span className="text-[10px] text-slate-400">Deposited</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            You have not referred any members yet. Share your code above to start building your team!
          </div>
        )}
      </div>
    </div>
  );
};
