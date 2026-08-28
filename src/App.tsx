import { useState, useEffect } from 'react';
import {
  Layers,
  Egg,
  Wallet,
  ShieldCheck,
  TrendingUp,
  Settings,
  Bot,
} from 'lucide-react';
import { StorageService } from './services/storage';
import type { AppMode } from './services/storage';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { OperasionalView } from './components/OperasionalView';
import { KeuanganView } from './components/KeuanganView';
import { AsetKewajibanView } from './components/AsetKewajibanView';
import { LaporanView } from './components/LaporanView';
import { PengaturanView } from './components/PengaturanView';
import { AIAssistantView } from './components/AIAssistantView';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [appMode, setAppMode] = useState<AppMode>(StorageService.getMode());

  // Application Data States
  const [metrics, setMetrics] = useState(StorageService.calculateMetrics());
  const [logs, setLogs] = useState(StorageService.getPencatatanHarian());
  const [transactions, setTransactions] = useState(StorageService.getTransaksi());
  const [kandangList, setKandangList] = useState(StorageService.getKandang());
  const [populasiList, setPopulasiList] = useState(StorageService.getPopulasi());
  const [pakanList, setPakanList] = useState(StorageService.getPakan());
  const [kodeAkunList, setKodeAkunList] = useState(StorageService.getKodeAkun());
  const [asetList, setAsetList] = useState(StorageService.getAset());
  const [hpList, setHpList] = useState(StorageService.getHutangPiutang());

  const refreshAllData = () => {
    setMetrics(StorageService.calculateMetrics());
    setLogs(StorageService.getPencatatanHarian());
    setTransactions(StorageService.getTransaksi());
    setKandangList(StorageService.getKandang());
    setPopulasiList(StorageService.getPopulasi());
    setPakanList(StorageService.getPakan());
    setKodeAkunList(StorageService.getKodeAkun());
    setAsetList(StorageService.getAset());
    setHpList(StorageService.getHutangPiutang());
  };

  const handleResetZero = () => {
    if (confirm('Apakah Anda yakin ingin mengosongkan seluruh data menjadi 0? Data saat ini di Akun Real akan di-reset.')) {
      StorageService.clearRealData();
      refreshAllData();
    }
  };

  const handleResetDemo = () => {
    if (confirm('Apakah Anda yakin ingin memuat ulang Data Demo simulasi 30 hari?')) {
      StorageService.resetDemoData();
      refreshAllData();
    }
  };

  // Initialize storage once on load & periodically fetch latest updates from Telegram/Backend
  useEffect(() => {
    StorageService.initStorage();
    StorageService.fetchFromBackend().then(() => {
      refreshAllData();
    });

    // Background sync every 4 seconds to receive updates made via Telegram Bot
    const interval = setInterval(async () => {
      const updated = await StorageService.fetchFromBackend();
      if (updated) {
        refreshAllData();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleToggleMode = (newMode: AppMode) => {
    if (newMode === appMode) return;
    StorageService.setMode(newMode);
    setAppMode(newMode);
    refreshAllData();
  };

  // Scroll to top when changing tab
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        metrics={metrics}
        appMode={appMode}
        onToggleMode={handleToggleMode}
      />

      {/* Mode Banner Indicator */}
      <div
        className={`w-full py-1.5 px-4 text-center text-xs font-bold transition-all ${
          appMode === 'REAL'
            ? 'bg-emerald-950/70 border-b border-emerald-500/30 text-emerald-300'
            : 'bg-amber-950/70 border-b border-amber-500/30 text-amber-300'
        }`}
      >
        {appMode === 'REAL' ? (
          <span>🟢 <strong>AKUN REAL (PETERNAKAN SAYA)</strong> — Data tersimpan aman & permanen di Hard Disk + Terhubung ke Bot Telegram.</span>
        ) : (
          <span>🧪 <strong>MODE DEMO (SIMULASI 30 HARI)</strong> — Menggunakan data contoh untuk simulasi & uji coba fitur.</span>
        )}
      </div>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-12">
        {activeTab === 'dashboard' && (
          <DashboardView
            metrics={metrics}
            logs={logs}
            transactions={transactions}
            pakanList={pakanList}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'operasional' && (
          <OperasionalView
            logs={logs}
            kandangList={kandangList}
            populasiList={populasiList}
            pakanList={pakanList}
            onRefreshData={refreshAllData}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'keuangan' && (
          <KeuanganView
            transactions={transactions}
            kodeAkunList={kodeAkunList}
            onRefreshData={refreshAllData}
          />
        )}

        {activeTab === 'aset' && (
          <AsetKewajibanView
            asetList={asetList}
            hpList={hpList}
            onRefreshData={refreshAllData}
          />
        )}

        {activeTab === 'laporan' && (
          <LaporanView
            transactions={transactions}
            asetList={asetList}
            hpList={hpList}
          />
        )}

        {activeTab === 'ai' && (
          <AIAssistantView
            metrics={metrics}
          />
        )}

        {activeTab === 'pengaturan' && (
          <PengaturanView
            kandangList={kandangList}
            populasiList={populasiList}
            kodeAkunList={kodeAkunList}
            onRefreshData={refreshAllData}
            onResetZero={handleResetZero}
            onResetDemo={handleResetDemo}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="hidden lg:block border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 BebekJaya PRO — Sistem Informasi Manajemen Peternakan Bebek Petelur Terpadu.</p>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-slate-800 px-2 py-1.5 backdrop-blur-xl bg-slate-950/90">
        <div className="flex items-center justify-around">
          {[
            { id: 'dashboard', label: 'Home', icon: Layers },
            { id: 'operasional', label: 'Panen', icon: Egg },
            { id: 'keuangan', label: 'Kas', icon: Wallet },
            { id: 'aset', label: 'Aset', icon: ShieldCheck },
            { id: 'ai', label: 'AI & Bot', icon: Bot },
            { id: 'laporan', label: 'Laporan', icon: TrendingUp },
            { id: 'pengaturan', label: 'Database', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all ${
                  isActive
                    ? 'text-amber-400 font-extrabold scale-105'
                    : 'text-slate-400 font-medium hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-amber-400 stroke-[2.5]' : 'text-slate-400'}`} />
                <span className="text-[10px] tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;

