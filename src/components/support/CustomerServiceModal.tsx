import React, { useState, useEffect } from 'react';
import { ChevronDown, Headset, MessageCircle, Phone, Send, X, HelpCircle, CheckCircle2 } from 'lucide-react';
import { SupportTicket } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { formatDate } from '../../utils/currency.ts';

interface CustomerServiceModalProps {
  onClose: () => void;
}

export const CustomerServiceModal: React.FC<CustomerServiceModalProps> = ({ onClose }) => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'contact' | 'ticket' | 'faq'>('contact');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  // Ticket form
  const [category, setCategory] = useState('deposit');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);

  // FAQ accordion state
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How do Mobile Money deposits work on VENDRA?',
      a: 'When you initiate a recharge of UGX 10,000 or more, you can pay via PesaPal (Cards/MoMo) or direct USSD prompt to your MTN or Airtel phone. Once verified, your balance is credited in the database ledger.'
    },
    {
      q: 'What is the minimum withdrawal and how can I withdraw the welcome bonus?',
      a: 'The minimum withdrawal is UGX 5,000. The UGX 5,000 welcome bonus can only be withdrawn once you have an active deposit (minimum recharge of UGX 10,000).'
    },
    {
      q: 'How are product returns calculated?',
      a: 'Returns are mathematically calculated based on the active product terms (Unit price × Daily return rate × Term duration). All figures displayed are deterministic formula projections.'
    },
    {
      q: 'How do referral commissions work?',
      a: 'Level 1 direct referrals earn 35% commission and Level 2 indirect referrals earn 6% commission. Commissions are automatically credited after the referred member completes a deposit.'
    }
  ];

  const fetchTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const res = await fetch('/api/support/tickets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ticket') {
      fetchTickets();
    }
  }, [activeTab]);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingTicket(true);
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ category, subject, message })
      });

      if (res.ok) {
        setSubject('');
        setMessage('');
        setTicketSuccess(true);
        fetchTickets();
        setTimeout(() => setTicketSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
              <Headset className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                Customer Care & Support
              </h2>
              <p className="text-xs text-slate-400">24/7 dedicated support desk</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-1 my-3">
          <button
            onClick={() => setActiveTab('contact')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'contact'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Direct Help
          </button>
          <button
            onClick={() => setActiveTab('ticket')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ticket'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Submit Ticket
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'faq'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            FAQs
          </button>
        </div>

        {/* Tab 1: Direct Contact */}
        {activeTab === 'contact' && (
          <div className="space-y-3 py-2 flex-1 overflow-y-auto">
            {/* One on One WhatsApp Support */}
            <a
              href="https://wa.me/qr/C3VMQ7Y7TXH6B1"
              target="_blank"
              rel="noreferrer"
              className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/50 flex items-center justify-between hover:scale-[1.01] active:scale-[0.99] transition-all group shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-900 dark:text-white block">
                      One on One WhatsApp Support
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-[9px] font-extrabold text-emerald-700 dark:text-emerald-300 uppercase">
                      Direct
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
                    Instant 1-on-1 Help & Inquiry Desk
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:underline">
                Chat Now →
              </span>
            </a>

            {/* Telegram Channel */}
            <a
              href="https://t.me/vendraplatiform"
              target="_blank"
              rel="noreferrer"
              className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/70 dark:border-sky-800/50 flex items-center justify-between hover:scale-[1.01] active:scale-[0.99] transition-all group shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-900 dark:text-white block">
                      Telegram Channel
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900/60 text-[9px] font-extrabold text-sky-700 dark:text-sky-300 uppercase">
                      Official
                    </span>
                  </div>
                  <span className="text-[11px] text-sky-700 dark:text-sky-400 font-mono">
                    @vendraplatiform • Community & Signals
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400 group-hover:underline">
                Join Channel →
              </span>
            </a>

            {/* Telephone Hotline */}
            <a
              href="tel:+256700000001"
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between hover:scale-[1.01] active:scale-[0.99] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Kampala Financial Hotline
                  </span>
                  <span className="text-[11px] text-orange-700 dark:text-orange-400 font-mono">
                    0700-VENDRA-UG
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400 group-hover:underline">
                Call →
              </span>
            </a>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">
                Operational Support Hours:
              </span>
              Monday – Sunday: 24/7 automated USSD gateway status monitoring with live agent responses from 8:00 AM to 10:00 PM EAT (East Africa Time).
            </div>
          </div>
        )}

        {/* Tab 2: Ticket Desk */}
        {activeTab === 'ticket' && (
          <div className="flex-1 overflow-y-auto space-y-4 py-2">
            <form onSubmit={handleSubmitTicket} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="deposit">Deposit & MoMo</option>
                    <option value="withdrawal">Withdrawal Status</option>
                    <option value="equipment">Product Participation</option>
                    <option value="account">Account & KYC</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Brief summary"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Message / Details
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Describe your issue with transaction reference if applicable..."
                  rows={3}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white resize-none"
                />
              </div>

              {ticketSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Ticket submitted! An administrator will respond shortly.</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingTicket}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmittingTicket ? 'Submitting...' : 'Submit Support Ticket'}</span>
              </button>
            </form>

            {/* Previously submitted tickets */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                Your Tickets ({tickets.length})
              </span>
              {tickets.length === 0 ? (
                <p className="text-xs text-slate-400">No support tickets submitted yet.</p>
              ) : (
                <div className="space-y-2">
                  {tickets.map(t => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">{t.subject}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            t.status === 'RESOLVED'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">{t.message}</p>
                      {t.admin_response && (
                        <div className="mt-2 p-2 rounded-lg bg-orange-50 dark:bg-orange-950/40 border border-orange-200 text-orange-900 dark:text-orange-200">
                          <span className="font-bold block">Support Response:</span>
                          {t.admin_response}
                        </div>
                      )}
                      <span className="text-[10px] text-slate-400 block pt-1">
                        {formatDate(t.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: FAQs */}
        {activeTab === 'faq' && (
          <div className="space-y-2 py-2 flex-1 overflow-y-auto">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full p-3 text-left flex items-center justify-between gap-2 text-xs font-bold text-slate-800 dark:text-slate-100"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      expandedFaq === idx ? 'rotate-180 text-orange-500' : ''
                    }`}
                  />
                </button>
                {expandedFaq === idx && (
                  <div className="px-3 pb-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-2">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
