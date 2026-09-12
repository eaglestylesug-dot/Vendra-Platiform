import React, { useState, useEffect } from 'react';
import { KeyRound, Lock, Phone, Shield, Sparkles, User, UserPlus, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

export interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login'
}) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  const [phone, setPhone] = useState(() => localStorage.getItem('vendra_saved_phone') || '');
  const [fullName, setFullName] = useState(() => localStorage.getItem('vendra_saved_name') || '');
  const [password, setPassword] = useState(() => localStorage.getItem('vendra_saved_pass') || '');
  const [referralCode, setReferralCode] = useState('');
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('vendra_remember_me') !== 'false');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check URL query for ?ref=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralCode(ref);
      setMode('register');
    }
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login(phone, password);
      } else {
        await register(phone, fullName, password, referralCode || undefined);
      }

      // Persist login information if Remember Me is checked
      if (rememberMe) {
        localStorage.setItem('vendra_remember_me', 'true');
        localStorage.setItem('vendra_saved_phone', phone);
        localStorage.setItem('vendra_saved_pass', password);
        if (fullName) localStorage.setItem('vendra_saved_name', fullName);
      } else {
        localStorage.setItem('vendra_remember_me', 'false');
        localStorage.removeItem('vendra_saved_phone');
        localStorage.removeItem('vendra_saved_pass');
        localStorage.removeItem('vendra_saved_name');
      }

      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Demo accounts helper
  const fillDemoUser = () => {
    setMode('login');
    setPhone('+256771234567');
    setPassword('UserPassword123!');
  };

  const fillDemoAdmin = () => {
    setMode('login');
    setPhone('+256700000001');
    setPassword('AdminPassword123!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-100 dark:border-slate-800 shadow-2xl">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Brand Emblem */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 via-orange-500 to-amber-400 p-[2px] shadow-lg shadow-orange-500/20 mb-2.5">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-orange-400">
                <path d="M4 4L12 20L20 4H15.5L12 13L8.5 4H4Z" fill="url(#v-grad-auth)" />
                <circle cx="12" cy="7" r="2" fill="#FDBA74" />
                <defs>
                  <linearGradient id="v-grad-auth" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#F59E0B" />
                    <stop offset="0.5" stopColor="#F97316" />
                    <stop offset="1" stopColor="#E11D48" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            VENDRA Financial
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {mode === 'login' ? 'Sign in to access your ledger' : 'Create an account to begin participating'}
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-1 mb-5">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'login'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'register'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Fast Fill Demo Pill Buttons */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Quick Demo:</span>
          <button
            type="button"
            onClick={fillDemoUser}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-300 border border-orange-200/60 hover:bg-orange-100"
          >
            User Account
          </button>
          <button
            type="button"
            onClick={fillDemoAdmin}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 border border-red-200/60 hover:bg-red-100 flex items-center gap-1"
          >
            <Shield className="w-3 h-3" />
            Admin Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                Full Legal Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Ronald Mukasa"
                  required={mode === 'register'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
                <User className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
              Phone Number (Uganda)
            </label>
            <div className="relative">
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. +256771234567 or 0771234567"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                Referral Code (Optional)
              </label>
              <input
                type="text"
                value={referralCode}
                onChange={e => setReferralCode(e.target.value.toUpperCase())}
                placeholder="e.g. VEN100"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono uppercase"
              />
            </div>
          )}

          {/* Welcome Bonus Callout for New Accounts */}
          {mode === 'register' && (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-orange-300/50 dark:border-orange-700/50 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-200">
                <strong className="text-orange-600 dark:text-orange-400 block">Instant UGX 5,000 Welcome Bonus</strong>
                Bonus is added immediately to your ledger balance upon registration. Unlocked for withdrawal after your first active recharge.
              </div>
            </div>
          )}

          {/* Remember Credentials Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Remember login info
              </span>
            </label>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 hover:brightness-105 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-orange-500/20 disabled:opacity-50 transition-all mt-2"
          >
            {isSubmitting
              ? 'Securing Session...'
              : mode === 'login'
              ? 'Sign In'
              : 'Create Account & Claim UGX 5,000'}
          </button>
        </form>
      </div>
    </div>
  );
};
