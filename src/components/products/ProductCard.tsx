import React from 'react';
import { Calendar, CheckCircle, ShieldCheck, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { Product } from '../../types/index.ts';
import { formatUGX } from '../../utils/currency.ts';

interface ProductCardProps {
  product: Product & { calculations?: any };
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const dailyIncome = product.daily_income || Math.round(product.price * product.return_rate);
  const totalRevenue = product.total_revenue || (product.daily_income ? product.daily_income * product.duration_days : Math.round(product.price * product.return_rate * product.duration_days));
  const dailyRatePercent = (product.return_rate * 100).toFixed(0);

  const isLocked = product.status === 'locked' || product.status === 'sold_out';
  const vipTag = product.vip_level || (product.eligibility_tier?.startsWith('VIP') ? product.eligibility_tier : 'VIP');

  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
      {/* Top Accent Stripe */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400 z-10" />

      {/* Product Image Preview if available */}
      {product.image_url && (
        <div className="relative -mx-4 -mt-4 sm:-mx-5 sm:-mt-5 mb-3 h-36 overflow-hidden bg-slate-900">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />
        </div>
      )}

      <div>
        {/* VIP Badge & Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-600 text-white shadow-xs">
              <Zap className="w-3 h-3 text-amber-300" />
              {vipTag}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {product.category}
            </span>
          </div>

          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              product.status === 'active'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {product.status === 'active' ? 'Active Fleet' : product.status}
          </span>
        </div>

        {/* Product Title & VENDRA Tag */}
        <div className="mb-2">
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-snug">
            {product.name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Financial Metrics Grid - Matching VENDRA Plan Table */}
        <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 mb-3">
          {/* Price */}
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Price
            </span>
            <span className="text-sm font-black text-blue-600 dark:text-blue-400">
              {formatUGX(product.price)}
            </span>
          </div>

          {/* Daily Income */}
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Daily Income
            </span>
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              {formatUGX(dailyIncome)}
            </span>
          </div>

          {/* Total Revenue */}
          <div className="border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Revenue
            </span>
            <span className="text-xs font-black text-amber-600 dark:text-amber-400">
              {formatUGX(totalRevenue)}
            </span>
          </div>

          {/* Duration Days */}
          <div className="border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Days
            </span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {product.duration_days}-day
            </span>
          </div>
        </div>

        {/* Trust & Guarantee Indicator */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mb-3">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
          <span>Safe & Reliable • Automated 24h Payout</span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <span className="text-[11px] text-slate-400 font-medium">
          Daily Yield: ~{dailyRatePercent}%
        </span>

        <button
          onClick={() => onSelect(product)}
          disabled={isLocked}
          className={`py-2 px-4 rounded-xl font-bold text-xs shadow-xs transition-all active:scale-95 ${
            isLocked
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
          }`}
        >
          {isLocked ? 'Closed' : 'Participate'}
        </button>
      </div>
    </div>
  );
};
