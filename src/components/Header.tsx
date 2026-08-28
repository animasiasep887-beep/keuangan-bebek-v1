import React from 'react';
import { Egg, Wallet, TrendingUp, Layers, ShieldCheck, Feather, CheckCircle2, TestTube2, Settings, Sparkles } from 'lucide-react';
import type { FarmMetricsSummary } from '../types';
import type { AppMode } from '../services/storage';
import { formatIDR } from '../utils/exportUtils';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  metrics: FarmMetricsSummary;
  appMode: AppMode;
  onToggleMode: (mode: AppMode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  metrics,
  appMode,
  onToggleMode,
}) => {
  const isReal = appMode === 'REAL';

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand & Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Egg className="w-6 h-6 sm:w-7 sm:h-7 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                  BebekJaya <span className="gradient-text-gold">PRO</span>
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Feather className="w-3 h-3" /> PETELUR SIM
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                Sistem Informasi Manajemen & Akuntansi Peternakan Bebek
              </p>
            </div>
          </div>

          {/* Mode Switcher Pill (Akun Real vs Mode Demo) */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => onToggleMode('REAL')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                isReal
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Akun Real</span>
            </button>

            <button
              onClick={() => onToggleMode('DEMO')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                !isReal
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TestTube2 className="w-3.5 h-3.5" />
              <span>Mode Demo</span>
            </button>
          </div>

          {/* Quick Metrics Badges & Bot Link */}
          <div className="hidden md:flex items-center gap-3">
            {/* AI / Bot Quick Action */}
            <button
              onClick={() => setActiveTab('ai')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-950/80 to-sky-950/80 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 text-xs font-bold transition-all shadow-md"
            >
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span>Asisten AI & Bot</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>

            {/* Saldo Kas Badge */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Saldo Kas</p>
                <p className="text-xs sm:text-sm font-extrabold text-emerald-400">{formatIDR(metrics.saldoKas)}</p>
              </div>
            </div>

            {/* HDP Hari Ini Badge */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">HDP Hari Ini</p>
                <p className="text-xs sm:text-sm font-extrabold text-amber-400">{metrics.hdpHariIni}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Navigation Tabs */}
      <div className="hidden lg:block border-t border-slate-800/60 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-1 py-1.5">
            {[
              { id: 'dashboard', label: 'Dashboard Utama', icon: Layers },
              { id: 'operasional', label: 'Pencatatan Operasional', icon: Egg },
              { id: 'keuangan', label: 'Keuangan & Kas', icon: Wallet },
              { id: 'aset', label: 'Aset & Kewajiban', icon: ShieldCheck },
              { id: 'laporan', label: 'Laporan Keuangan', icon: TrendingUp },
              { id: 'ai', label: '🤖 Asisten AI & Bot Telegram', icon: Sparkles },
              { id: 'pengaturan', label: 'Pengaturan & Database', icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};

