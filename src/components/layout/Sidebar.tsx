import React from 'react';
import { 
  Users, 
  LayoutDashboard, 
  Calendar, 
  History, 
  Settings, 
  FileText,
  PlusCircle,
  TrendingUp,
  Bell
} from 'lucide-react';
import { cn, getWeekNumber } from '../../utils/helpers';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar = ({ activeTab, setActiveTab }: SidebarProps) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'history', label: 'Archive', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-bg-main border-r border-border-custom h-screen flex flex-col sticky top-0">
      <div className="p-8 pb-4 flex flex-col items-center text-center">
        <div className="flex items-center gap-2 mb-1 justify-center">
          <svg width="24" height="24" viewBox="0 0 45 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 37.9459 18.2822 C 36.5538 16.1482 34.8357 15.2887 33.0883 15.2887 C 26.2464 15.2887 14.9616 30.6712 3.79534 30.6712 C 1.60355 30.6712 0.833466 30.0785 0.833466 28.8633 C 0.833466 28.3298 0.981559 27.9148 1.27775 27.4406 L 16.5906 3.25529 C 17.3904 1.98082 18.3085 1.32877 19.3156 1.32877 C 20.4411 1.32877 21.3593 2.15865 22.0109 3.72951 L 29.3563 21.4536 C 31.4 26.344 34.5101 30.6712 38.9231 30.6712 H 42.6552 C 43.8399 30.6712 44.5212 29.7524 44.5212 28.8633 C 44.5212 28.5965 44.4618 28.3298 44.3138 28.0927 L 37.9459 18.2822 Z" fill="#FF4208" />
          </svg>
          <h1 className="font-extrabold text-[#1E293B] text-lg tracking-tight uppercase">Aumovio</h1>
        </div>
        <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest whitespace-nowrap">Digital Solutions & Governance</p>
      </div>

      <nav className="flex-1 px-6 mt-8 space-y-1.5">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-bold text-sm",
              activeTab === item.id 
                ? "bg-white text-[#FF4208] shadow-sm border border-border-custom" 
                : "text-text-muted hover:bg-white/50 hover:text-text-main"
            )}
          >
            <item.icon size={18} className={activeTab === item.id ? "text-[#FF4208]" : "text-text-muted"} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="flex-1" />
    </aside>
  );
};
