import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, KeyRound, Lock, Phone, Shield, Sparkles, User, UserPlus, X, CheckCircle2 } from 'lucide-react';
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
  const { login, register, adminLogin, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [isAdminMode, setIsAdminMode] = useState(false);

  const [phone, setPhone] = useState(() => localStorage.getItem('vendra_saved_phone') || '');
  const [fullName, setFullName] = useState(() => localStorage.getItem('vendra_saved_name') || '');
  const [password, setPassword] = useState(() => localStorage.getItem('vendra_saved_pass') || '');
  const [referralCode, setReferralCode] = useState('');
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('vendra_remember_me') !== 'false');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
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

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message || 'Google authentication failed.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isAdminMode) {
        await adminLogin(phone, password);
      } else if (mode === 'login') {
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
            {isAdminMode ? 'Administrator Security Access' : 'VENDRA Financial Platform'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isAdminMode
              ? 'Authorized management and compliance personnel login'
              : mode === 'login'
              ? 'Sign in to access your portfolio, yields, and withdrawals'
              : 'Create an investor account to start earning daily returns'}
          </p>
        </div>

        {/* Mode Switcher */}
        {!isAdminMode ? (
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
        ) : (
          <div className="mb-4 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-center flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-red-500" />
            <span className="text-xs font-bold text-red-600 dark:text-red-400">
              Admin & Super Admin Portal
            </span>
          </div>
        )}

        {/* Google Authentication */}
        {!isAdminMode && (
          <div className="mb-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center justify-center gap-2.5 shadow-sm transition-all active:scale-[0.99] disabled:opacity-50"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{isGoogleLoading ? 'Connecting...' : 'Continue with Google'}</span>
            </button>

            <div className="relative flex items-center justify-center mt-3">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
              <span className="bg-white dark:bg-slate-900 px-3 text-[10px] uppercase font-bold text-slate-400 absolute">
                or with credentials
              </span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && !isAdminMode && (
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
              {isAdminMode ? 'Administrator Username / Phone' : 'Phone Number (Uganda)'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder={isAdminMode ? 'e.g. VendraAdmin' : 'e.g. +256771234567 or 0771234567'}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
              {isAdminMode ? (
                <Shield className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              ) : (
                <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-orange-600 hover:text-orange-700 dark:text-orange-400 font-semibold flex items-center gap-1"
              >
                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white pr-10"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {mode === 'register' && !isAdminMode && (
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
          {mode === 'register' && !isAdminMode && (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-orange-300/50 dark:border-orange-700/50 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-200">
                <strong className="text-orange-600 dark:text-orange-400 block">Instant UGX 5,000 Welcome Bonus</strong>
                Bonus is added immediately to your ledger balance upon registration.
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
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Keep credentials remembered on this device
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
              : isAdminMode
              ? 'Authorize Administrator Access'
              : mode === 'login'
              ? 'Sign In'
              : 'Create Account & Claim UGX 5,000'}
          </button>

          {/* Switch between Investor and Staff mode */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setIsAdminMode(!isAdminMode);
                setError(null);
              }}
              className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              {isAdminMode ? '← Return to Investor Sign In' : 'Administrator Security Portal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
