import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, RefreshCw, X, ShieldAlert, Sparkles, TrendingUp, Wallet } from 'lucide-react';
import { Notification } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { formatDate } from '../../utils/currency.ts';

interface NotificationModalProps {
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ onClose }) => {
  const { token, refreshUserData } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      await refreshUserData();
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT_CONFIRMED':
        return <Wallet className="w-4 h-4 text-emerald-500" />;
      case 'WITHDRAWAL_APPROVED':
      case 'WITHDRAWAL_PAID':
        return <CheckCheck className="w-4 h-4 text-blue-500" />;
      case 'PRODUCT_YIELD':
      case 'REFERRAL_EARNED':
        return <TrendingUp className="w-4 h-4 text-orange-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                Notifications
              </h2>
              <p className="text-xs text-slate-400">Account alerts and updates</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline px-2 py-1"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto space-y-2 py-3">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-orange-500" />
              <span>Loading notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              You have no notifications right now.
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  n.is_read
                    ? 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    : 'bg-orange-50/40 dark:bg-orange-950/20 border-orange-200/50 dark:border-orange-800/40 text-slate-900 dark:text-slate-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-xs flex-shrink-0">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold truncate">{n.title}</span>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {formatDate(n.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
