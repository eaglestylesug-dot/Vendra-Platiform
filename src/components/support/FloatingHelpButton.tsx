import React, { useState } from 'react';
import { Headset, MessageCircle, Send, X, LifeBuoy, ExternalLink } from 'lucide-react';

interface FloatingHelpButtonProps {
  onOpenSupportModal: () => void;
}

export const FloatingHelpButton: React.FC<FloatingHelpButtonProps> = ({ onOpenSupportModal }) => {
  const [isOpen, setIsOpen] = useState(false);

  const whatsappUrl = 'https://wa.me/qr/C3VMQ7Y7TXH6B1';
  const telegramUrl = 'https://t.me/vendraplatiform';

  return (
    <aside aria-label="Support and Help Center" className="fixed bottom-20 right-3.5 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end pointer-events-auto">
      {/* Expanded Quick Support Menu */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Quick Support"
          className="mb-3 w-72 bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-2xl border border-slate-200/80 dark:border-slate-800 animate-fade-in text-slate-900 dark:text-white"
        >
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <LifeBuoy className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black tracking-tight">Need Assistance?</h3>
                <p className="text-[10px] text-slate-400 font-medium">VENDRA Support Desk</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close Quick Support"
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {/* 1. One-on-One WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => setIsOpen(false)}
              className="w-full p-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-[11px] font-black text-slate-900 dark:text-white block leading-tight">
                    One-on-One WhatsApp
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                    24/7 Priority Chat
                  </span>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
            </a>

            {/* 2. Official Telegram Channel */}
            <a
              href={telegramUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => setIsOpen(false)}
              className="w-full p-2.5 rounded-2xl bg-sky-50 hover:bg-sky-100/80 dark:bg-sky-950/40 dark:hover:bg-sky-950/70 border border-sky-200 dark:border-sky-800/50 flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Send className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-[11px] font-black text-slate-900 dark:text-white block leading-tight">
                    Telegram Channel
                  </span>
                  <span className="text-[10px] text-sky-700 dark:text-sky-400 font-medium">
                    @vendraplatiform
                  </span>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 group-hover:translate-x-0.5 transition-transform" />
            </a>

            {/* 3. In-App Help & Tickets */}
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenSupportModal();
              }}
              className="w-full p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/70 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between transition-all text-left group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Headset className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-black text-slate-900 dark:text-white block leading-tight">
                    Support Desk & FAQs
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Submit ticket or view guide
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 group-hover:translate-x-0.5 transition-transform">
                Open →
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Trigger Pill */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Customer Support and Help"
        className="group relative flex items-center gap-2 px-3.5 py-3 rounded-full bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-500 text-white font-bold text-xs shadow-xl shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
        </span>
        <Headset className="w-4 h-4 stroke-[2.5]" />
        <span className="hidden sm:inline font-extrabold tracking-tight">Help & Support</span>
        <span className="sm:hidden font-extrabold tracking-tight">Help</span>
      </button>
    </aside>
  );
};
