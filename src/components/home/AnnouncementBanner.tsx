import React from 'react';
import { Megaphone, ShieldAlert, Zap } from 'lucide-react';

export const AnnouncementBanner: React.FC = () => {
  return (
    <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200">
      <div className="p-1 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex-shrink-0">
        <Megaphone className="w-4 h-4" />
      </div>
      <div className="overflow-hidden whitespace-nowrap text-xs font-medium flex-1">
        <span className="inline-block animate-marquee">
          📢 VENDRA Verified Ledger: Instant MTN & Airtel Uganda Mobile Money processing active. Minimum deposit UGX 500. Term yields are distributed daily based on audited equipment operation.
        </span>
      </div>
    </div>
  );
};
