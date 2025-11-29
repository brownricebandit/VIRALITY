import React from 'react';
import { Sparkles, MonitorPlay } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-brand-600 rounded-lg shadow-lg shadow-brand-500/20">
          <MonitorPlay className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Brownricebandit Virality</h1>
          <p className="text-xs text-slate-400">Video Content Optimizer</p>
        </div>
      </div>
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-full border border-slate-700/50">
        <Sparkles className="w-4 h-4 text-brand-400" />
        <span className="text-xs font-medium text-slate-300">Powered by Gemini 2.5</span>
      </div>
    </header>
  );
};