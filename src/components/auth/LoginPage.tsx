import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  DollarSign,
  Eye,
  EyeOff,
  Headset,
  HelpCircle,
  KeyRound,
  Lock,
  Phone,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
  UserPlus,
  Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { VendraPlanTableModal, VENDRA_PLANS_DATA } from '../products/VendraPlanTableModal.tsx';
import { formatUGX } from '../../utils/currency.ts';

interface LoginPageProps {
  onOpenSupport?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onOpenSupport }) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [phone, setPhone] = useState(() => localStorage.getItem('vendra_saved_phone') || '');
  const [fullName, setFullName] = useState(() => localStorage.getItem('vendra_saved_name') || '');
  const [password, setPassword] = useState(() => localStorage.getItem('vendra_saved_pass') || '');
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('vendra_remember_me') !== 'false');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPlanTable, setShowPlanTable] = useState(false);

  // Check URL query for ?ref= or ?mode=
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      const urlMode = params.get('mode');
      if (ref) {
        setReferralCode(ref);
        setMode('register');
      } else if (urlMode === 'register') {
        setMode('register');
      }
    } catch (_e) {
      // URL parsing fallback
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login(phone, password);
      } else {
        if (!fullName.trim()) {
          throw new Error('Please provide your full legal name for your verified wallet.');
        }
        await register(phone, fullName, password, referralCode.trim() || undefined);
      }

      // Persist credentials if rememberMe is enabled
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
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your phone number and password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Professional App Bar */}
      <header className="w-full max-w-md mx-auto px-4 py-3.5 flex items-center justify-between border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 p-[1.5px] shadow-sm shadow-blue-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Zap className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm tracking-tight text-white uppercase">
                VENDRA
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                OFFICIAL
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium block leading-none">
              Commercial Asset Platform
            </span>
          </div>
        </div>

        <button
          onClick={onOpenSupport}
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all"
        >
          <Headset className="w-3.5 h-3.5 text-blue-400" />
          <span>Support</span>
        </button>
      </header>

      {/* Main Form & Content Container */}
      <main className="w-full max-w-md mx-auto p-4 sm:p-5 flex-1 flex flex-col justify-center">
        {/* Hero Branding Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 text-blue-300 text-xs font-bold mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Invest Today, Earn Every Day!
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            VENDRA INVESTMENT PLAN
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
            Participate in certified commercial operating leaseholds. Receive automated daily Mobile Money returns over 180 days.
          </p>
        </div>

        {/* Welcome Bonus Callout */}
        <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-blue-500/15 border border-amber-500/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-amber-300 uppercase tracking-wide">
                Welcome Bonus Active
              </span>
              <span className="text-[9px] bg-amber-400/20 text-amber-200 px-1 rounded font-bold">
                UGX 5,000
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
              Sign up today and get <strong className="text-white">UGX 5,000</strong> instant welcome reward credited immediately to your balance!
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/90 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-2xl backdrop-blur-sm mb-5">
          {/* Tabs: Sign In / Create Account */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl mb-5 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'login'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'register'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name for Registration */}
            {mode === 'register' && (
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                  Full Name (as registered with Mobile Money)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Okello John"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Phone Number Field */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                Ugandan Mobile Money Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+256 7XX XXX XXX"
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Supports MTN MoMo (077/078/076) and Airtel Money (070/075/074).
              </p>
            </div>

            {/* Password Field */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secret password"
                  className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Referral Code for Registration */}
            {mode === 'register' && (
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                  Referral / Invitation Code (Optional)
                </label>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  placeholder="e.g. VEN1234"
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 uppercase tracking-wider"
                />
              </div>
            )}

            {/* Remember Me & Options */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
                />
                <span>Remember login session</span>
              </label>

              {mode === 'login' && (
                <button
                  type="button"
                  onClick={onOpenSupport}
                  className="text-[11px] text-blue-400 hover:underline"
                >
                  Forgot Password?
                </button>
              )}
            </div>

            {/* Error Message Display */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Authenticating with Ledger...</span>
              ) : mode === 'login' ? (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Sign In to Your Account</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Claim UGX 5,000 & Register</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* VENDRA Investment Plans Preview Widget */}
        <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                VENDRA Investment Tiers (VIP 1 - VIP 8)
              </h3>
              <p className="text-[11px] text-slate-400">
                180-Day daily automated returns
              </p>
            </div>

            <button
              onClick={() => setShowPlanTable(true)}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 underline"
            >
              View Full Table
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {VENDRA_PLANS_DATA.slice(0, 4).map((plan) => (
              <div
                key={plan.vip}
                onClick={() => setShowPlanTable(true)}
                className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 cursor-pointer hover:border-blue-500/40 transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-blue-600 text-white">
                    {plan.vip}
                  </span>
                  <span className="text-[10px] font-bold text-slate-300 truncate">
                    {plan.product}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Price:</span>
                  <span className="font-bold text-white">{formatUGX(plan.price)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-emerald-400">Daily:</span>
                  <span className="font-bold text-emerald-400">+{formatUGX(plan.dailyIncome)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4 Trust Pillars */}
        <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-900/40 border border-slate-900 text-center mb-4">
          <div className="p-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <span className="text-[11px] font-bold text-white block">Safe & Reliable</span>
            <span className="text-[9px] text-slate-400 block">Secured commercial fleet</span>
          </div>
          <div className="p-1.5">
            <DollarSign className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <span className="text-[11px] font-bold text-white block">Daily Income</span>
            <span className="text-[9px] text-slate-400 block">Automated daily yield</span>
          </div>
          <div className="p-1.5">
            <TrendingUp className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <span className="text-[11px] font-bold text-white block">High Returns</span>
            <span className="text-[9px] text-slate-400 block">Up to 360x revenue</span>
          </div>
          <div className="p-1.5">
            <Calendar className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <span className="text-[11px] font-bold text-white block">180-Day Plan</span>
            <span className="text-[9px] text-slate-400 block">Fixed-term contracts</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md mx-auto p-4 border-t border-slate-900 text-center text-[11px] text-slate-400">
        <p>© 2026 VENDRA Commercial Leasehold Platform • Official Mobile Money Gateway</p>
        <p className="text-[10px] mt-1 text-slate-500">
          Licensed under Ugandan telecommunication & commercial leasing frameworks.
        </p>
      </footer>

      {/* Full Plan Table Modal */}
      <VendraPlanTableModal
        isOpen={showPlanTable}
        onClose={() => setShowPlanTable(false)}
      />
    </div>
  );
};
