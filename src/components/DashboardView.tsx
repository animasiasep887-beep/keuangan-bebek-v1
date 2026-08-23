import React from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Egg,
  Users,
  PlusCircle,
  FileSpreadsheet,
  AlertTriangle,
  Scale,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';
import type { FarmMetricsSummary, PencatatanHarian, TransaksiKeuangan, PakanItem } from '../types';
import { formatIDR } from '../utils/exportUtils';
import { GrafikProduksiTelur } from './GrafikProduksiTelur';

interface DashboardViewProps {
  metrics: FarmMetricsSummary;
  logs: PencatatanHarian[];
  transactions: TransaksiKeuangan[];
  pakanList: PakanItem[];
  setActiveTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  logs,
  transactions,
  pakanList,
  setActiveTab,
}) => {
  const isProfit = metrics.labaRugiMtd >= 0;

  // Low feed warning check
  const lowFeedItems = pakanList.filter((p) => p.stokKg <= p.minStokKg);

  return (
    <div className="space-y-6">
      {/* Banner / Welcome Bar */}
      <div className="glass-panel rounded-2xl p-6 relative overflow-hidden border border-slate-800">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> METRIK PETERNAKAN HARI INI
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
              Ringkasan Operasional & Keuangan Bebek Petelur
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Pantau arus kas, produktivitas telur harian, estimasi Laba/Rugi bulan ini, dan kesehatan populasi ternak secara real-time.
            </p>
          </div>

          {/* Quick Action Group */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab('operasional')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              Catat Panen
            </button>
            <button
              onClick={() => setActiveTab('keuangan')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 transition-all active:scale-95"
            >
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Catat Transaksi
            </button>
            <button
              onClick={() => setActiveTab('laporan')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 transition-all active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-sky-400" />
              Laporan
            </button>
          </div>
        </div>
      </div>

      {/* Low Feed Warning Banner if any */}
      {lowFeedItems.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-200">Peringatan Stok Pakan Menipis!</p>
              <p className="text-xs text-amber-300/80">
                {lowFeedItems.map((p) => `${p.namaPakan} (Sisa: ${p.stokKg} kg)`).join(', ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('operasional')}
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-all shrink-0"
          >
            Restock Pakan
          </button>
        </div>
      )}

      {/* 4 Main High-Level Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo Kas */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saldo Kas Saat Ini</p>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatIDR(metrics.saldoKas)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Arus kas operasional aktif</span>
            </div>
          </div>
        </div>

        {/* Card 2: Laba / Rugi MTD */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Laba / Rugi Bulan Ini</p>
            <div className={`p-2.5 rounded-xl ${isProfit ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
              {isProfit ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
          </div>
          <div className="mt-3">
            <h3 className={`text-2xl sm:text-3xl font-black tracking-tight ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatIDR(metrics.labaRugiMtd)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-slate-400">
              <span>{isProfit ? 'Est. Keuntungan Bersih' : 'Est. Kerugian Bersih'}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Productivity % (HDP) */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hen-Day Production (HDP)</p>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Egg className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
              {metrics.hdpHariIni}%
            </h3>
            <div className="flex items-center justify-between mt-2 text-xs font-semibold text-slate-400">
              <span>Hasil Panen: {metrics.totalTelurHariIni.toLocaleString('id-ID')} butir</span>
            </div>
          </div>
        </div>

        {/* Card 4: Duck Population & Health */}
        <div
          onClick={() => setActiveTab('pengaturan')}
          className="glass-panel rounded-2xl p-5 border border-slate-800 relative overflow-hidden group hover:border-amber-500/50 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Populasi Bebek Hidup</p>
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 group-hover:bg-amber-500/20 group-hover:text-amber-400 transition-colors">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {metrics.totalPopulasiHidup.toLocaleString('id-ID')} <span className="text-sm font-normal text-slate-400">ekor</span>
            </h3>
            <div className="flex items-center justify-between mt-2 text-xs font-semibold text-amber-400 group-hover:underline">
              <span>Rata-rata FCR: <strong className="text-sky-400">{metrics.fcrAverage}</strong></span>
              <span>+ Kelola / Tambah →</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Egg Production & HDP Interactive Chart */}
      <GrafikProduksiTelur logs={logs} />

      {/* Secondary Row: Recent Financial Transactions & Feed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions List */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Transaksi Keuangan Terbaru
            </h3>
            <button
              onClick={() => setActiveTab('keuangan')}
              className="text-xs text-amber-400 hover:underline font-semibold"
            >
              Lihat Semua
            </button>
          </div>

          <div className="divide-y divide-slate-800/80">
            {transactions.slice(0, 5).map((trx) => {
              const isIncome = trx.tipeTransaksi === 'PENDAPATAN';
              return (
                <div key={trx.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isIncome ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white line-clamp-1">{trx.deskripsi}</p>
                      <p className="text-[11px] text-slate-400">{trx.tanggal} • {trx.noRef}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-black shrink-0 ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isIncome ? '+' : '-'}{formatIDR(trx.totalNominal)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feed & Operational Quick Overview */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-400" />
            Stok Pakan & Nutrisi
          </h3>

          <div className="space-y-3">
            {pakanList.map((pakan) => {
              const percentage = Math.min(100, Math.round((pakan.stokKg / 2000) * 100));
              const isLow = pakan.stokKg <= pakan.minStokKg;
              return (
                <div key={pakan.id} className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-white">{pakan.namaPakan}</span>
                    <span className={`font-extrabold ${isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {pakan.stokKg} kg
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isLow ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
