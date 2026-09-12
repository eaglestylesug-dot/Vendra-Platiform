import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Lock,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface AdminLoginPageProps {
  onBackToApp: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onBackToApp, onLoginSuccess }) => {
  const { adminLogin } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUser = username.trim();
    if (!cleanUser || !password) {
      setErrorMessage('Please provide both administrator username and security passphrase.');
      return;
    }

    setIsLoading(true);
    try {
      await adminLogin(cleanUser, password);
      onLoginSuccess();
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Access Denied: Invalid administrator credentials. Security event logged.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-red-500/30 selection:text-red-200">
      {/* Top Header */}
      <header className="w-full border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-red-900/40">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm tracking-wider uppercase text-white">
                VENDRA
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800/60 font-bold">
                Admin Console
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Enterprise Operations & Financial Governance
            </p>
          </div>
        </div>

        <button
          onClick={onBackToApp}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/60 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Client App</span>
        </button>
      </header>

      {/* Main Form Center */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Security Card */}
          <div className="bg-slate-900/90 rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-8 backdrop-blur-xl space-y-6 relative overflow-hidden">
            {/* Subtle glow effect */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header & Lock Shield */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-red-500/30 flex items-center justify-center mx-auto text-red-400 shadow-inner">
                <Lock className="w-7 h-7" />
              </div>
              <h1 className="text-lg font-black tracking-tight text-white uppercase">
                Restricted Admin Portal
              </h1>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Authorized administrators only. Manage withdrawal clearing, system parameters, products, and platform members.
              </p>
            </div>

            {/* Alert banner if error */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-700/80 text-red-200 text-xs flex items-start gap-2.5 animate-shake">
                <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{errorMessage}</span>
              </div>
            )}

            {/* Credentials Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Administrator Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Enter admin username"
                    required
                    autoFocus
                    autoCapitalize="none"
                    autoCorrect="off"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/70 border border-slate-700/80 text-white placeholder:text-slate-500 text-xs font-mono focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Security Passphrase
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter security passphrase"
                    required
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-950/70 border border-slate-700/80 text-white placeholder:text-slate-500 text-xs font-mono focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-red-600 to-orange-600 hover:brightness-110 active:scale-[0.99] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Security Token...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Authenticate & Access Suite</span>
                  </>
                )}
              </button>
            </form>

            {/* Audit & Compliance Disclaimer */}
            <div className="pt-2 border-t border-slate-800/80 text-center space-y-1.5">
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-mono">
                <Fingerprint className="w-3.5 h-3.5 text-slate-400" />
                <span>HMAC Signed • All Access Attempts Recorded</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                Standard credentials: <code className="text-slate-400 font-bold">VendraAdmin</code> • Protected by multi-factor cryptographic rules.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-3 px-4 text-center text-[11px] text-slate-500 border-t border-slate-900">
        VENDRA Financial Ledger Systems • Unauthorized intrusion is subject to regulatory reporting
      </footer>
    </div>
  );
};
