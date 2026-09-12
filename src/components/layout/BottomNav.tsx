import React from 'react';
import { Home, Layers, Users, User } from 'lucide-react';

export type TabKey = 'home' | 'products' | 'team' | 'mine';

interface BottomNavProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const tabs = [
    { key: 'home' as TabKey, label: 'Home', icon: Home },
    { key: 'products' as TabKey, label: 'Products', icon: Layers },
    { key: 'team' as TabKey, label: 'Team', icon: Users },
    { key: 'mine' as TabKey, label: 'Mine', icon: User }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/90 pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-4 px-2 py-1.5">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = currentTab === t.key;

          return (
            <button
              key={t.key}
              onClick={() => onSelectTab(t.key)}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all ${
                isActive
                  ? 'text-orange-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`relative p-1 rounded-xl transition-all ${
                  isActive ? 'bg-orange-500/15 scale-110' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {isActive && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-orange-500 to-rose-500" />
                )}
              </div>
              <span className={`text-[11px] mt-0.5 tracking-tight ${isActive ? 'font-bold' : 'font-normal'}`}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
