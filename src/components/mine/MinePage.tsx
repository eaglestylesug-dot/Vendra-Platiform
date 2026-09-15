import React, { useState } from 'react';
import {
  ChevronRight,
  Gift,
  Headset,
  HelpCircle,
  History,
  KeyRound,
  Lock,
  LogOut,
  Phone,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  Wallet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { formatUGX, maskPhone } from '../../utils/currency.ts';

interface MinePageProps {
  onOpenHistory: () => void;
  onOpenSupport: () => void;
  onOpenAdmin: () => void;
  onOpenRecharge: () => void;
  onOpenWithdraw: () => void;
  onOpenGiftCode?: () => void;
}

export const MinePage: React.FC<MinePageProps> = ({
  onOpenHistory,
  onOpenSupport,
  onOpenAdmin,
  onOpenRecharge,
  onOpenWithdraw,
  onOpenGiftCode
}) => {
  const { user, profile, summary, isAdmin, logout, token, refreshUserData } = useAuth();

  // Security password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Remember login state
  const [isRemembered, setIsRemembered] = useState(() => localStorage.getItem('vendra_remember_me') !== 'false');

  const toggleRememberMe = () => {
    if (isRemembered) {
      localStorage.setItem('vendra_remember_me', 'false');
      localStorage.removeItem('vendra_saved_phone');
      localStorage.removeItem('vendra_saved_pass');
      localStorage.removeItem('vendra_saved_name');
      setIsRemembered(false);
    } else {
      localStorage.setItem('vendra_remember_me', 'true');
      if (user?.phone) localStorage.setItem('vendra_saved_phone', user.phone);
      if (profile?.full_name) localStorage.setItem('vendra_saved_name', profile.full_name);
      setIsRemembered(true);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPassword(true);
    setPasswordMsg(null);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password');
      }
      setPasswordMsg({ text: 'Password successfully updated!', isError: false });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordMsg(null);
      }, 1500);
    } catch (err: any) {
      setPasswordMsg({ text: err.message, isError: true });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="pb-24 pt-2 px-4 max-w-md mx-auto animate-fade-in space-y-4">
      {/* Profile Header Card */}
      <div className="rounded-3xl bg-slate-900 text-white p-5 border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 via-orange-500 to-amber-400 p-[2px]">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <User className="w-7 h-7 text-orange-400" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white truncate">
                {profile?.full_name || 'VENDRA Member'}
              </h2>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                {user?.vip_level || 'VIP 1'}
              </span>
            </div>

            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {maskPhone(user?.phone)}
            </p>

            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] text-slate-400 font-mono">
                UID: VEN-{user?.id.slice(0, 6).toUpperCase()}
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-2.5 h-2.5" />
                <span>Verified Account</span>
              </span>
            </div>
          </div>
        </div>

        {/* Small Balance Summary inside Mine */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Available</span>
            <span className="text-sm font-black text-white">{formatUGX(summary.available_balance)}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Fleet Profits</span>
            <span className="text-sm font-black text-emerald-400">{formatUGX(summary.product_operating_profits || summary.total_earnings)}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Deposits</span>
            <span className="text-sm font-black text-blue-400">{formatUGX(summary.total_deposits)}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Daily Yield</span>
            <span className="text-sm font-black text-amber-400">+{formatUGX(summary.daily_expected_yield || 0)}/d</span>
          </div>
        </div>
      </div>

      {/* Administrator Console Suite */}
      {isAdmin ? (
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/40 p-5 shadow-xl text-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black tracking-tight text-white uppercase">
                    VENDRA Admin Operations
                  </span>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Super Admin
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Full administrative authority: withdrawals, analytics, products & settings
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onOpenAdmin}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 hover:brightness-110 text-white font-black text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Shield className="w-4 h-4 text-amber-200" />
            <span>Open Master Operations Suite</span>
          </button>
        </div>
      ) : (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-4 text-white space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-black uppercase tracking-wide text-red-400">
                  Restricted Administrator Portal
                </h3>
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-900/60 text-red-300 border border-red-800">
                  Admin Only
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                Restricted area for authorized staff. Admin credentials required to manage activities, products, withdrawal limits, and financial analytics.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAdmin}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-red-400" />
            <span>Administrator Security Portal</span>
          </button>
        </div>
      )}

      {/* Action Menu List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
        {/* Transaction History */}
        <button
          onClick={onOpenHistory}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                Account Ledger History
              </span>
              <span className="text-[11px] text-slate-400 block">
                Verified double-entry credits, debits and reserves
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Redeem Gift Code */}
        {onOpenGiftCode && (
          <button
            onClick={onOpenGiftCode}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                  Redeem Gift Code
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Claim voucher codes and promotional bonuses
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        )}

        {/* Change Password */}
        <button
          onClick={() => setShowPasswordModal(true)}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                Security & Password
              </span>
              <span className="text-[11px] text-slate-400 block">
                Manage your account login credentials
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Remember Login Info Toggle */}
        <div className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                Remember Login Info
              </span>
              <span className="text-[11px] text-slate-400 block">
                {isRemembered ? 'Credentials saved for instant auto-fill' : 'Auto-fill disabled on this browser'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleRememberMe}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              isRemembered
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {isRemembered ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {/* Help & Customer Service */}
        <button
          onClick={onOpenSupport}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Headset className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                24/7 Customer Help Desk
              </span>
              <span className="text-[11px] text-slate-400 block">
                WhatsApp, Phone helpline & Ticket support
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Sign Out */}
        <button
          onClick={logout}
          className="w-full p-4 flex items-center justify-between hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block">
                Sign Out
              </span>
              <span className="text-[11px] text-slate-400 block">
                End current session on this device
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-500" />
        </button>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Update Password
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter your current password and choose a new secure password.
            </p>

            <form onSubmit={handleUpdatePassword} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  New Password (min 6 characters)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  minLength={6}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              {passwordMsg && (
                <div
                  className={`text-xs font-bold p-2 rounded-lg ${
                    passwordMsg.isError ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  {passwordMsg.text}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="flex-1 py-2.5 rounded-xl bg-orange-600 text-white font-bold text-xs shadow-sm hover:bg-orange-500"
                >
                  {isSavingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
