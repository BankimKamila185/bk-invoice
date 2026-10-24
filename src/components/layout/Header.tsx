import React from 'react';
import { useApp } from '../../context/AppContext';
import { Menu, Plus, Building2, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { businessProfile, setActiveTab, activeTab } = useApp();

  return (
    <header className="h-16 px-4 sm:px-6 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          title="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <Building2 className="w-4 h-4 text-amber-400 hidden sm:inline" />
          <span className="font-bold text-white tracking-wide truncate max-w-[200px] sm:max-w-xs">
            {businessProfile.businessName || 'My Business'}
          </span>
          {businessProfile.gstin && (
            <span className="hidden md:inline-block text-[10px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-400 font-mono">
              {businessProfile.gstin}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {activeTab !== 'create-invoice' && (
          <button
            onClick={() => setActiveTab('create-invoice')}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Invoice</span>
          </button>
        )}

        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Local & Secure</span>
        </div>
      </div>
    </header>
  );
};
