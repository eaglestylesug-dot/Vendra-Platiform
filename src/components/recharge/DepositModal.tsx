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
  X,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { formatUGX } from '../../utils/currency.ts';

interface DepositModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({ onClose, onSuccess }) => {
  const { user, profile, token, refreshUserData } = useAuth();

  const [amount, setAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>(user?.phone || '');
  const [email, setEmail] = useState<string>(profile?.email || '');
  const [fullName, setFullName] = useState<string>(profile?.full_name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PesaPal Session State
  const [pesapalSession, setPesapalSession] = useState<{
    reference: string;
    orderTrackingId: string;
    redirectUrl: string;
    amount: number;
  } | null>(null);

  const [isCheckingPesaPalStatus, setIsCheckingPesaPalStatus] = useState(false);
  const [pesapalStatus, setPesapalStatus] = useState<string>('PENDING');
  const [pesapalStatusMessage, setPesapalStatusMessage] = useState<string>('Awaiting payment completion on PesaPal...');
  const [pesapalCompleted, setPesapalCompleted] = useState(false);
  const [showEmbeddedIframe, setShowEmbeddedIframe] = useState(false);

  const presetAmounts = [500, 2000, 5000, 10000, 25000, 50000];

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
            const status = (data.status || '').toUpperCase();
            setPesapalStatus(status);

            if (data.isCompleted || status === 'COMPLETED') {
              setPesapalCompleted(true);
              setPesapalStatusMessage('Payment confirmed by PesaPal! Account balance credited.');
              await refreshUserData();
              setTimeout(() => {
                onSuccess();
              }, 2000);
            } else if (status === 'FAILED') {
              setPesapalStatusMessage('Payment marked as failed by PesaPal. Please try again.');
            } else if (status === 'CANCELLED') {
              setPesapalStatusMessage('Payment was cancelled on PesaPal.');
            } else if (status === 'EXPIRED') {
              setPesapalStatusMessage('Payment order has expired. Please initiate a new recharge.');
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

    if (isNaN(finalAmount) || finalAmount < 500) {
      setError('Minimum recharge is UGX 500.');
      return;
    }

    if (!phoneNumber || phoneNumber.length < 9) {
      setError('Please provide a valid phone number.');
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
          provider: 'PESAPAL',
          phone_number: phoneNumber,
          email: email || undefined,
          full_name: fullName || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate PesaPal payment.');
      }

      if (data.gateway?.redirect_url) {
        setPesapalSession({
          reference: data.deposit.reference,
          orderTrackingId: data.gateway.order_tracking_id,
          redirectUrl: data.gateway.redirect_url,
          amount: finalAmount
        });

        // Open checkout in a popup window for convenient payment
        try {
          window.open(data.gateway.redirect_url, '_blank', 'width=600,height=750');
        } catch (_e) {
          // If popup blocked, direct button handles it
        }
      } else {
        throw new Error('PesaPal gateway did not return a valid checkout URL.');
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

      const status = (data.status || '').toUpperCase();
      setPesapalStatus(status);

      if (data.isCompleted || status === 'COMPLETED') {
        setPesapalCompleted(true);
        setPesapalStatusMessage('Payment confirmed by PesaPal! Account balance credited.');
        await refreshUserData();
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else if (status === 'FAILED') {
        setPesapalStatusMessage('Payment marked as failed by PesaPal. Please try again.');
      } else if (status === 'CANCELLED') {
        setPesapalStatusMessage('Payment was cancelled on PesaPal.');
      } else if (status === 'EXPIRED') {
        setPesapalStatusMessage('Payment order has expired. Please initiate a new recharge.');
      } else {
        setPesapalStatusMessage(`Status: ${data.status || 'PENDING'}. Complete authorization on the PesaPal checkout screen.`);
      }
    } catch (err: any) {
      setError(err.message || 'Status check failed.');
    } finally {
      setIsCheckingPesaPalStatus(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div
        className={`relative w-full ${
          showEmbeddedIframe ? 'max-w-2xl' : 'max-w-md'
        } bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-2xl overflow-y-auto max-h-[92vh] transition-all`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* VIEW 1: Payment Initiation Form */}
        {!pesapalSession && (
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
                  Instant balance crediting via Official PesaPal Gateway
                </p>
              </div>
            </div>

            {/* Exclusive PesaPal Gateway Indicator */}
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                Payment Gateway
              </label>
              <div className="p-3.5 rounded-2xl border border-orange-500 bg-orange-500/10 text-slate-900 dark:text-white font-bold ring-2 ring-orange-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black">PesaPal Gateway</span>
                        <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          Official Gateway
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-600 dark:text-slate-300 block mt-0.5">
                        Accepts MTN Mobile Money, Airtel Money, Visa & Mastercard
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscriber Phone */}
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Mobile / Contact Phone Number
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
                Pre-filled on the PesaPal receipt and Mobile Money authorization screen.
              </span>
            </div>

            {/* Billing Name & Email */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Email Address
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

            {/* Amount Selection */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Recharge Amount
                </label>
                <span className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold">
                  Min: UGX 500
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
                  min="500"
                  step="100"
                  value={customAmount}
                  onChange={e => {
                    setCustomAmount(e.target.value);
                    if (e.target.value) {
                      setAmount(parseFloat(e.target.value) || 0);
                    }
                  }}
                  placeholder="Or enter custom amount (Min: 500 UGX)"
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
                  <span>Connecting to PesaPal Gateway...</span>
                </>
              ) : (
                <span>
                  Proceed to PesaPal • {formatUGX(customAmount ? parseFloat(customAmount) || 0 : amount)}
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
                  UGX {pesapalSession.amount.toLocaleString()} has been verified by PesaPal and credited to your VENDRA balance.
                </p>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 text-left font-mono">
                  <div>Reference: {pesapalSession.reference}</div>
                  <div>PesaPal Tracking ID: {pesapalSession.orderTrackingId}</div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="p-2 rounded-xl bg-orange-500/15 text-orange-500 border border-orange-500/30">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    PesaPal Payment Terminal
                  </h3>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/30 text-left mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Recharge Amount:</span>
                    <span className="text-base font-black text-orange-600 dark:text-orange-400">
                      {formatUGX(pesapalSession.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1 font-mono">
                    <span>Merchant Reference:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{pesapalSession.reference}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                    <span>PesaPal Tracking ID:</span>
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
                      Pay in Embedded Window
                    </button>
                  </div>
                )}

                {/* Polling & Verification Status */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 text-orange-500 animate-spin" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Live PesaPal Listener
                      </span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        pesapalStatus === 'COMPLETED'
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : pesapalStatus === 'FAILED' || pesapalStatus === 'CANCELLED'
                          ? 'bg-rose-500/15 text-rose-600'
                          : 'bg-orange-500/15 text-orange-600 dark:text-orange-400'
                      }`}
                    >
                      {pesapalStatus}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {pesapalStatusMessage}
                  </p>

                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={checkManualPesaPalStatus}
                      disabled={isCheckingPesaPalStatus}
                      className="w-full py-2 px-3 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isCheckingPesaPalStatus ? 'animate-spin' : ''}`} />
                      <span>{isCheckingPesaPalStatus ? 'Verifying with PesaPal API...' : 'Check Status Now'}</span>
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
      </div>
    </div>
  );
};
