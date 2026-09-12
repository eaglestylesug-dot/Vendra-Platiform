import React from 'react';
import { Calendar, CheckCircle2, DollarSign, ShieldCheck, TrendingUp, X, Zap } from 'lucide-react';
import { formatUGX } from '../../utils/currency.ts';

export interface VendraPlanTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan?: (vipLevel: string) => void;
}

export const VENDRA_PLANS_DATA = [
  {
    vip: 'VIP1',
    product: 'VENDRA MINI 01',
    price: 10000,
    dailyIncome: 3000,
    totalRevenue: 540000,
    days: 180,
    highlight: false
  },
  {
    vip: 'VIP2',
    product: 'VENDRA MINI 02',
    price: 50000,
    dailyIncome: 15000,
    totalRevenue: 2700000,
    days: 180,
    highlight: false
  },
  {
    vip: 'VIP3',
    product: 'VENDRA 4K 01',
    price: 120000,
    dailyIncome: 37200,
    totalRevenue: 6696000,
    days: 180,
    highlight: true
  },
  {
    vip: 'VIP4',
    product: 'VENDRA 4K 02',
    price: 250000,
    dailyIncome: 77500,
    totalRevenue: 13950000,
    days: 180,
    highlight: false
  },
  {
    vip: 'VIP5',
    product: 'VENDRA MOUNTAIN PEAK 01',
    price: 500000,
    dailyIncome: 160000,
    totalRevenue: 28800000,
    days: 180,
    highlight: true
  },
  {
    vip: 'VIP6',
    product: 'VENDRA MOUNTAIN PEAK 02',
    price: 1000000,
    dailyIncome: 320000,
    totalRevenue: 57600000,
    days: 180,
    highlight: false
  },
  {
    vip: 'VIP7',
    product: 'VENDRA CITY 01',
    price: 2500000,
    dailyIncome: 825000,
    totalRevenue: 148500000,
    days: 180,
    highlight: false
  },
  {
    vip: 'VIP8',
    product: 'VENDRA CITY 02',
    price: 5000000,
    dailyIncome: 2000000,
    totalRevenue: 360000000,
    days: 180,
    highlight: true
  }
];

export const VendraPlanTableModal: React.FC<VendraPlanTableModalProps> = ({
  isOpen,
  onClose,
  onSelectPlan
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto max-h-[92vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5 pr-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/40 text-blue-700 dark:text-blue-300 text-xs font-black uppercase tracking-wider mb-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Official VENDRA Commercial Asset Lease
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            VENDRA INVESTMENT PLAN
          </h2>
          <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5">
            Invest Today, Earn Every Day!
          </p>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs mb-5">
          <table className="w-full text-left text-xs border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-3">Product</th>
                <th className="py-3 px-3">Price</th>
                <th className="py-3 px-3">Daily Income</th>
                <th className="py-3 px-3">Total Revenue</th>
                <th className="py-3 px-3 text-center">Days</th>
                {onSelectPlan && <th className="py-3 px-3 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {VENDRA_PLANS_DATA.map((row, idx) => (
                <tr
                  key={row.vip}
                  className={`transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-950/20 ${
                    idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/60 dark:bg-slate-800/40'
                  }`}
                >
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md font-black text-[10px] bg-blue-600 text-white shadow-2xs">
                        {row.vip}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {row.product}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-blue-600 dark:text-blue-400">
                    {formatUGX(row.price)}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                    {formatUGX(row.dailyIncome)}
                  </td>
                  <td className="py-2.5 px-3 font-black text-amber-600 dark:text-amber-400">
                    {formatUGX(row.totalRevenue)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-600 dark:text-slate-300">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {row.days}-day
                    </span>
                  </td>
                  {onSelectPlan && (
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => {
                          onSelectPlan(row.vip);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs"
                      >
                        Select
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4 Feature Pillars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center mb-4">
          <div className="p-2">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
            <h4 className="font-bold text-[11px] text-slate-900 dark:text-white">Safe & Reliable</h4>
            <p className="text-[10px] text-slate-400">Your investment is secure with us.</p>
          </div>
          <div className="p-2">
            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
            <h4 className="font-bold text-[11px] text-slate-900 dark:text-white">Daily Income</h4>
            <p className="text-[10px] text-slate-400">Earn stable income every day.</p>
          </div>
          <div className="p-2">
            <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
            <h4 className="font-bold text-[11px] text-slate-900 dark:text-white">High Returns</h4>
            <p className="text-[10px] text-slate-400">Get up to 360x total revenue.</p>
          </div>
          <div className="p-2">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
            <h4 className="font-bold text-[11px] text-slate-900 dark:text-white">180-Day Plan</h4>
            <p className="text-[10px] text-slate-400">Long-term plan for maximum profit.</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          Close Plan Overview
        </button>
      </div>
    </div>
  );
};
