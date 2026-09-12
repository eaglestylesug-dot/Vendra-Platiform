import React, { useState, useEffect } from 'react';
import {
  ArrowDownLeft,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Info,
  Phone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
  Zap
} from 'lucide-react';
import { MobileMoneyProvider } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { formatUGX } from '../../utils/currency.ts';

interface DepositModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({ onClose, onSuccess }) => {
  const { user, profile, token, refreshUserData } = useAuth();

  const [amount, setAmount] = useState<number>(10000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [provider, setProvider] = useState<MobileMoneyProvider>('PESAPAL');
  const [phoneNumber, setPhoneNumber] = useState<string>(user?.phone || '');
  const [email, setEmail] = useState<string>(profile?.email || '');
  const [fullName, setFullName] = useState<string>(profile?.full_name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 2: Gateway Response state
  const [initiatedDeposit, setInitiatedDeposit] = useState<{
    reference: string;
    ussdPromptInstruction: string;
  } | null>(null);

  // PesaPal Session State
  const [pesapalSession, setPesapalSession] = useState<{
    reference: string;
    orderTrackingId: string;
    redirectUrl: string;
    amount: number;
  } | null>(null);

  const [isCheckingPesaPalStatus, setIsCheckingPesaPalStatus] = useState(false);
  const [pesapalStatusMessage, setPesapalStatusMessage] = useState<string>('Awaiting payment completion...');
  const [pesapalCompleted, setPesapalCompleted] = useState(false);
  const [showEmbeddedIframe, setShowEmbeddedIframe] = useState(false);
  const [isSimulatingSuccess, setIsSimulatingSuccess] = useState(false);

  const presetAmounts = [10000, 25000, 50000, 100000, 250000, 500000];

  // Auto-poll PesaPal status while modal is waiting on PesaPal checkout
  useEffect(() => {
    let timer: any = null;
    if (pesapalSession && !pesapalCompleted) {
      const pollStatus = async () => {
        try {
          const res = await fetch(`/api/pesapal/status/${encodeURIComponent(pesapalSession.orderTrackingId)}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.isCompleted) {
              setPesapalCompleted(true);
              setPesapalStatusMessage('Payment confirmed! Account balance credited.');
              await refreshUserData();
              setTimeout(() => {
                onSuccess();
              }, 1800);
            }
          }
        } catch (_err) {
          // Silent polling failover
        }
      };

      timer = setInterval(pollStatus, 3000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [pesapalSession, pesapalCompleted, token]);

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = customAmount ? parseFloat(customAmount) : amount;

    if (isNaN(finalAmount) || finalAmount < 10000) {
      setError('Minimum recharge is UGX 10,000.');
      return;
    }

    if (!phoneNumber || phoneNumber.length < 9) {
      setError('Please provide a valid Ugandan phone number.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/deposits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: finalAmount,
          provider,
          phone_number: phoneNumber,
          email: email || undefined,
          full_name: fullName || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate deposit.');
      }

      if (provider === 'PESAPAL' && data.gateway?.redirect_url) {
        setPesapalSession({
          reference: data.deposit.reference,
          orderTrackingId: data.gateway.order_tracking_id,
          redirectUrl: data.gateway.redirect_url,
          amount: finalAmount
        });

        // Open checkout in a popup window for convenient user payment
        try {
          window.open(data.gateway.redirect_url, '_blank', 'width=580,height=720');
        } catch (_e) {
          // If popup blocked, iframe or manual button handles it
        }
      } else {
        setInitiatedDeposit({
          reference: data.deposit.reference,
          ussdPromptInstruction: data.gateway.ussdPromptInstruction
        });
      }
    } catch (err: any) {
      setError(err.message || 'Deposit initiation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkManualPesaPalStatus = async () => {
    if (!pesapalSession) return;
    setIsCheckingPesaPalStatus(true);
    setError(null);
    try {
      const res = await fetch(`/api/pesapal/status/${encodeURIComponent(pesapalSession.orderTrackingId)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify transaction.');

      if (data.isCompleted) {
        setPesapalCompleted(true);
        setPesapalStatusMessage('Payment confirmed! Account balance credited.');
        await refreshUserData();
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setPesapalStatusMessage(`Status: ${data.status || 'PENDING'}. Please complete payment on PesaPal.`);
      }
    } catch (err: any) {
      setError(err.message || 'Status check failed.');
    } finally {
      setIsCheckingPesaPalStatus(false);
    }
  };

  const handleSimulateInstantConfirm = async () => {
    const reference = pesapalSession?.reference || initiatedDeposit?.reference;
    if (!reference) return;
    setIsSimulatingSuccess(true);
    try {
      const res = await fetch(`/api/deposits/${reference}/simulate-success`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Simulation failed.');

      await refreshUserData();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Simulation failed.');
    } finally {
      setIsSimulatingSuccess(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className={`relative w-full ${showEmbeddedIframe ? 'max-w-2xl' : 'max-w-md'} bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-2xl overflow-y-auto max-h-[92vh] transition-all`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* VIEW 1: Payment Initiation Form */}
        {!initiatedDeposit && !pesapalSession && (
          <form onSubmit={handleInitiate}>
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50">
                <ArrowDownLeft className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                  Recharge Account
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Instant balance crediting via PesaPal, Cards & Mobile Money
                </p>
              </div>
            </div>

            {/* Provider Selector */}
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                Select Payment Method
              </label>
              <div className="grid grid-cols-1 gap-2.5 mb-2.5">
                {/* PesaPal Unified Gateway Option */}
                <button
                  type="button"
                  onClick={() => setProvider('PESAPAL')}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all text-left ${
                    provider === 'PESAPAL'
                      ? 'border-orange-500 bg-orange-500/10 text-slate-900 dark:text-white font-bold ring-2 ring-orange-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black">PesaPal Gateway</span>
                        <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          Live Active
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        Cards (Visa/Mastercard), MTN MoMo, Airtel Money & Bank
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Unified
                    </span>
                  </div>
                </button>
              </div>

              {/* Direct USSD Providers */}
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
                  <div className="w-3.5 h-3.5 rounded-full bg-amber-400 flex-shrink-0" />
                  <div className="text-left">
                    <span className="text-xs block font-bold">MTN MoMo Direct</span>
                    <span className="text-[10px] text-slate-400 block">*165*8# Prompt</span>
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
                  <div className="w-3.5 h-3.5 rounded-full bg-red-500 flex-shrink-0" />
                  <div className="text-left">
                    <span className="text-xs block font-bold">Airtel Direct</span>
                    <span className="text-[10px] text-slate-400 block">*185# Prompt</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Subscriber Phone */}
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Contact Phone Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 0771234567 or +25677..."
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:border-orange-500 transition-all"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {provider === 'PESAPAL'
                  ? 'Used on the PesaPal receipt and Mobile Money dispatch.'
                  : 'The USSD authorization push will be sent to this number.'}
              </span>
            </div>

            {/* Optional Email & Name for PesaPal billing address */}
            {provider === 'PESAPAL' && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    Full Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Eagle Styles"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. name@domain.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            )}

            {/* Amount Selection */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Recharge Amount
                </label>
                <span className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold">
                  Min: UGX 10,000
                </span>
              </div>

              {/* Presets */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {presetAmounts.map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setAmount(val);
                      setCustomAmount('');
                    }}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${
                      amount === val && !customAmount
                        ? 'bg-orange-600 text-white shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60'
                    }`}
                  >
                    {val.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Custom Input */}
              <div className="relative">
                <input
                  type="number"
                  min="10000"
                  step="1000"
                  value={customAmount}
                  onChange={e => {
                    setCustomAmount(e.target.value);
                    if (e.target.value) {
                      setAmount(parseFloat(e.target.value) || 0);
                    }
                  }}
                  placeholder="Or enter custom amount (Min: 10,000 UGX)"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-orange-500"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-bold">UGX</span>
              </div>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 hover:brightness-105 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-orange-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting to {provider === 'PESAPAL' ? 'PesaPal Gateway' : 'Mobile Money'}...</span>
                </>
              ) : (
                <span>
                  Proceed to Pay • {formatUGX(customAmount ? parseFloat(customAmount) || 0 : amount)}
                </span>
              )}
            </button>
          </form>
        )}

        {/* VIEW 2: PesaPal Interactive Checkout Terminal */}
        {pesapalSession && (
          <div className="py-2 text-center">
            {pesapalCompleted ? (
              <div className="py-8 animate-fade-in">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                  <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                  Payment Confirmed!
                </h3>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-4">
                  UGX {pesapalSession.amount.toLocaleString()} has been securely credited to your VENDRA balance.
                </p>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 text-left font-mono">
                  <div>Reference: {pesapalSession.reference}</div>
                  <div>Tracking ID: {pesapalSession.orderTrackingId}</div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="p-2 rounded-xl bg-orange-500/15 text-orange-500 border border-orange-500/30">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    PesaPal Live Payment
                  </h3>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/30 text-left mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Deposit Amount:</span>
                    <span className="text-base font-black text-orange-600 dark:text-orange-400">
                      {formatUGX(pesapalSession.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1 font-mono">
                    <span>Reference:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{pesapalSession.reference}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                    <span>Order Tracking ID:</span>
                    <span className="truncate max-w-[200px]">{pesapalSession.orderTrackingId}</span>
                  </div>
                </div>

                {/* Embedded Iframe Toggle & View */}
                {showEmbeddedIframe ? (
                  <div className="mb-4">
                    <div className="w-full h-[460px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner bg-slate-50 relative">
                      <iframe
                        src={pesapalSession.redirectUrl}
                        title="PesaPal Checkout"
                        className="w-full h-full border-none"
                        allow="payment"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowEmbeddedIframe(false)}
                      className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mt-2 block mx-auto underline"
                    >
                      Hide embedded screen & use external window
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 mb-5">
                    {/* Primary Button to Open Checkout in Window */}
                    <a
                      href={pesapalSession.redirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:brightness-105 active:scale-[0.99] text-white font-black text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all"
                    >
                      <span>Open Secure PesaPal Payment Window</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    <button
                      type="button"
                      onClick={() => setShowEmbeddedIframe(true)}
                      className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                      Pay Directly in Embedded Window
                    </button>
                  </div>
                )}

                {/* Polling & Verification Status */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 text-orange-500 animate-spin" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Live Gateway Listener
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 font-bold">
                      Polling Every 3s
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {pesapalStatusMessage}
                  </p>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={checkManualPesaPalStatus}
                      disabled={isCheckingPesaPalStatus}
                      className="flex-1 py-2 px-3 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isCheckingPesaPalStatus ? 'animate-spin' : ''}`} />
                      <span>Check Status Now</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSimulateInstantConfirm}
                      disabled={isSimulatingSuccess}
                      title="Instantly verify webhook crediting in test mode"
                      className="px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isSimulatingSuccess ? 'Confirming...' : 'Test Confirm'}</span>
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs font-medium text-left">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium py-1"
                >
                  Close & Check Balance Later
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: Direct USSD Prompt Screen */}
        {initiatedDeposit && !pesapalSession && (
          <div className="text-center py-2">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Phone className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
              USSD Prompt Dispatched
            </h3>

            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 text-left text-xs text-amber-900 dark:text-amber-200 mb-4 leading-relaxed">
              <span className="font-bold block mb-1">Instruction:</span>
              {initiatedDeposit.ussdPromptInstruction}
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 mb-5 text-left">
              <div className="flex justify-between py-1">
                <span>Transaction Reference:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {initiatedDeposit.reference}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span>Status:</span>
                <span className="font-bold text-amber-500">PENDING_APPROVAL</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 mb-4 text-left">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Sandbox Operator Confirmation</span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mb-2.5">
                Simulate successful PIN authorization to verify that the server-side ledger credits the account balance immediately.
              </p>
              <button
                type="button"
                onClick={handleSimulateInstantConfirm}
                disabled={isSimulatingSuccess}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                {isSimulatingSuccess ? 'Verifying Gateway Webhook...' : 'Simulate Instant Payment Confirmation'}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium py-2"
            >
              Close and Check Status Later
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
