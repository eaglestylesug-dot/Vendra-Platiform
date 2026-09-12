import React from 'react';
import { ArrowDownLeft, ArrowUpRight, History, Headset, Share2, ShieldCheck, HelpCircle } from 'lucide-react';

interface QuickActionsProps {
  onRecharge: () => void;
  onWithdraw: () => void;
  onHistory: () => void;
  onCustomerService: () => void;
  onShareTeam: () => void;
  onFaq: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onRecharge,
  onWithdraw,
  onHistory,
  onCustomerService,
  onShareTeam,
  onFaq
}) => {
  const actions = [
    {
      label: 'Recharge',
      sublabel: 'Deposit MoMo',
      icon: ArrowDownLeft,
      color: 'from-emerald-500 to-teal-600',
      textColor: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
      onClick: onRecharge
    },
    {
      label: 'Withdraw',
      sublabel: 'Payout MoMo',
      icon: ArrowUpRight,
      color: 'from-orange-500 to-rose-600',
      textColor: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-950/40',
      onClick: onWithdraw
    },
    {
      label: 'History',
      sublabel: 'Audit Ledger',
      icon: History,
      color: 'from-blue-500 to-indigo-600',
      textColor: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/40',
      onClick: onHistory
    },
    {
      label: 'Support',
      sublabel: '24/7 Desk',
      icon: Headset,
      color: 'from-amber-500 to-orange-500',
      textColor: 'text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-950/40',
      onClick: onCustomerService
    }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
      <div className="grid grid-cols-4 gap-2">
        {actions.map((act, idx) => {
          const Icon = act.icon;
          return (
            <button
              key={idx}
              onClick={act.onClick}
              className="flex flex-col items-center text-center p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-95 transition-all group"
            >
              <div
                className={`w-12 h-12 rounded-2xl ${act.bgColor} flex items-center justify-center mb-1.5 shadow-sm transition-transform group-hover:scale-105`}
              >
                <Icon className={`w-6 h-6 ${act.textColor} stroke-[2.2]`} />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                {act.label}
              </span>
              <span className="text-[10px] text-slate-400 font-medium hidden xs:block">
                {act.sublabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
