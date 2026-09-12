import React from 'react';
import { Bell, Headset, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenCustomerService: () => void;
  onOpenAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  onOpenCustomerService,
  onOpenAdmin
}) => {
  const { user, profile, unreadCount, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 text-white">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {/* VENDRA Original Brand & Logo */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 via-orange-500 to-amber-400 p-[1.5px] shadow-lg shadow-orange-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              {/* Custom SVG Geometric VENDRA Emblem */}
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-orange-400">
                <path
                  d="M4 4L12 20L20 4H15.5L12 13L8.5 4H4Z"
                  fill="url(#vendra-grad)"
                />
                <circle cx="12" cy="7" r="2" fill="#FDBA74" />
                <defs>
                  <linearGradient id="vendra-grad" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#F59E0B" />
                    <stop offset="0.5" stopColor="#F97316" />
                    <stop offset="1" stopColor="#E11D48" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-white via-orange-100 to-orange-400 bg-clip-text text-transparent">
                VENDRA
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
                UG
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Financial Platform</p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5">
          {isAdmin && onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-sm shadow-red-900/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              title="VENDRA Admin Suite"
            >
              <Shield className="w-3.5 h-3.5 text-amber-200" />
              <span>Admin Suite</span>
            </button>
          )}

          <button
            onClick={onOpenCustomerService}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 active:scale-95 transition-all"
            title="Customer Help Desk"
          >
            <Headset className="w-5 h-5 text-orange-400" />
          </button>

          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 active:scale-95 transition-all"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
