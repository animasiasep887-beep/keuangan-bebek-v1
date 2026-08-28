import type {
  Kandang,
  PopulasiBebek,
  PakanItem,
  PencatatanHarian,
  KodeAkun,
  TransaksiKeuangan,
  AsetTetap,
  HutangPiutang,
  FarmMetricsSummary,
} from '../types';

import {
  INITIAL_KANDANG,
  INITIAL_POPULASI,
  INITIAL_PAKAN,
  INITIAL_KODE_AKUN,
  INITIAL_ASET,
  INITIAL_HUTANG_PIUTANG,
  generateInitialPencatatanHarian,
  generateInitialFinancialTransactions,
} from './mockData';

export type AppMode = 'REAL' | 'DEMO';

const MODE_KEY = 'quack_active_mode';
const API_BASE = 'http://localhost:3001/api';

function getPrefix(mode?: AppMode): string {
  const currentMode = mode || StorageService.getMode();
  return currentMode === 'REAL' ? 'quack_real_' : 'quack_demo_';
}

function getStoredData<T>(key: string, fallback: T, mode?: AppMode): T {
  try {
    const fullKey = getPrefix(mode) + key;
    const item = localStorage.getItem(fullKey);
    return item !== null ? JSON.parse(item) : fallback;
  } catch (error) {
    console.error(`Error reading ${key} from LocalStorage:`, error);
    return fallback;
  }
}

function setStoredData<T>(key: string, data: T, mode?: AppMode): void {
  try {
    const fullKey = getPrefix(mode) + key;
    localStorage.setItem(fullKey, JSON.stringify(data));
    // Trigger backend sync asynchronously
    StorageService.syncToBackendDebounced();
  } catch (error) {
    console.error(`Error writing ${key} to LocalStorage:`, error);
  }
}

let syncTimeout: any = null;

export const StorageService = {
  // Mode Management ('REAL' vs 'DEMO')
  getMode: (): AppMode => {
    const stored = localStorage.getItem(MODE_KEY);
    return (stored as AppMode) || 'REAL';
  },

  setMode: (newMode: AppMode) => {
    localStorage.setItem(MODE_KEY, newMode);
    StorageService.initStorage(newMode);
  },

  // Sync to Backend Debounced
  syncToBackendDebounced: () => {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      StorageService.syncToBackend();
    }, 400);
  },

  syncToBackend: async () => {
    const mode = StorageService.getMode();
    if (mode !== 'REAL') return; // Only sync REAL data to permanent disk

    const payload = {
      kandang: StorageService.getKandang(),
      populasi: StorageService.getPopulasi(),
      pakan: StorageService.getPakan(),
      pencatatan_harian: StorageService.getPencatatanHarian(),
      transaksi_keuangan: StorageService.getTransaksi(),
      aset_tetap: StorageService.getAset(),
      hutang_piutang: StorageService.getHutangPiutang(),
      kode_akun: StorageService.getKodeAkun(),
    };

    try {
      await fetch(`${API_BASE}/sync?mode=REAL`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      // Backend might be offline or starting up, LocalStorage keeps cache safe
    }
  },

  // Pull latest data from Backend Server
  fetchFromBackend: async (): Promise<boolean> => {
    try {
      const mode = StorageService.getMode();
      const res = await fetch(`${API_BASE}/data?mode=${mode}`);
      if (!res.ok) return false;
      const data = await res.json();

      if (data && mode === 'REAL') {
        const prefix = getPrefix('REAL');
        if (data.kandang && data.kandang.length > 0) localStorage.setItem(`${prefix}kandang`, JSON.stringify(data.kandang));
        if (data.populasi && data.populasi.length > 0) localStorage.setItem(`${prefix}populasi`, JSON.stringify(data.populasi));
        if (data.pakan && data.pakan.length > 0) localStorage.setItem(`${prefix}pakan`, JSON.stringify(data.pakan));
        if (data.pencatatan_harian) localStorage.setItem(`${prefix}pencatatan_harian`, JSON.stringify(data.pencatatan_harian));
        if (data.transaksi_keuangan) localStorage.setItem(`${prefix}transaksi_keuangan`, JSON.stringify(data.transaksi_keuangan));
        if (data.aset_tetap) localStorage.setItem(`${prefix}aset_tetap`, JSON.stringify(data.aset_tetap));
        if (data.hutang_piutang) localStorage.setItem(`${prefix}hutang_piutang`, JSON.stringify(data.hutang_piutang));
        if (data.kode_akun) localStorage.setItem(`${prefix}kode_akun`, JSON.stringify(data.kode_akun));
        localStorage.setItem(`${prefix}initialized`, 'true');
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  // Server & Bot Status
  getServerStatus: async () => {
    try {
      const res = await fetch(`${API_BASE}/status`);
      if (!res.ok) return { online: false };
      const data = await res.json();
      return { online: true, ...data };
    } catch {
      return { online: false };
    }
  },

  // AI Chat & Consultation
  askAI: async (question: string): Promise<string> => {
    try {
      const mode = StorageService.getMode();
      const res = await fetch(`${API_BASE}/ai/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, mode }),
      });
      const data = await res.json();
      if (data.success && data.answer) {
        return data.answer;
      }
      return data.error || 'Maaf, terjadi kendala komunikasi dengan AI.';
    } catch (e: any) {
      return `Koneksi ke backend server gagal: ${e.message}. Pastikan backend server aktif di port 3001.`;
    }
  },

  // Automated AI Performance Analysis
  getAIAnalysis: async (): Promise<string> => {
    try {
      const mode = StorageService.getMode();
      const res = await fetch(`${API_BASE}/ai/analysis?mode=${mode}`);
      const data = await res.json();
      if (data.success && data.analysis) {
        return data.analysis;
      }
      return 'Gagal memuat analisis performa peternakan.';
    } catch (e: any) {
      return `Koneksi backend error: ${e.message}`;
    }
  },

  // Initialize both Real & Demo storage spaces safely if empty
  initStorage: (modeOverride?: AppMode) => {
    const mode = modeOverride || StorageService.getMode();
    const prefix = getPrefix(mode);
    const isInit = localStorage.getItem(`${prefix}initialized`);

    if (!isInit) {
      if (mode === 'REAL') {
        const defaultKandang: Kandang[] = [
          { id: 'k-1', namaKandang: 'Kandang 1 (Utama)', kapasitas: 1000, status: 'AKTIF', catatan: 'Unit kandang utama' },
        ];
        const defaultPopulasi: PopulasiBebek[] = [
          {
            id: 'pop-1',
            kandangId: 'k-1',
            kodeBatch: 'BATCH-01',
            tglMasuk: new Date().toISOString().split('T')[0],
            jumlahAwal: 500,
            jumlahSaatIni: 500,
            hargaBeliPerEkor: 75000,
            umurMinggu: 24,
            status: 'PRODUKTIF',
          },
        ];
        const defaultPakan: PakanItem[] = [
          { id: 'pak-1', namaPakan: 'Konsentrat Bebek Petelur K-99', merk: 'Standard', stokKg: 500, hargaPerKg: 8000, minStokKg: 100 },
        ];

        setStoredData('kandang', defaultKandang, 'REAL');
        setStoredData('populasi', defaultPopulasi, 'REAL');
        setStoredData('pakan', defaultPakan, 'REAL');
        setStoredData('kode_akun', INITIAL_KODE_AKUN, 'REAL');
        setStoredData('pencatatan_harian', [], 'REAL');
        setStoredData('transaksi_keuangan', [], 'REAL');
        setStoredData('aset_tetap', [], 'REAL');
        setStoredData('hutang_piutang', [], 'REAL');
        localStorage.setItem(`${prefix}initialized`, 'true');
      } else {
        setStoredData('kandang', INITIAL_KANDANG, 'DEMO');
        setStoredData('populasi', INITIAL_POPULASI, 'DEMO');
        setStoredData('pakan', INITIAL_PAKAN, 'DEMO');
        setStoredData('kode_akun', INITIAL_KODE_AKUN, 'DEMO');
        setStoredData('pencatatan_harian', generateInitialPencatatanHarian(), 'DEMO');
        setStoredData('transaksi_keuangan', generateInitialFinancialTransactions(), 'DEMO');
        setStoredData('aset_tetap', INITIAL_ASET, 'DEMO');
        setStoredData('hutang_piutang', INITIAL_HUTANG_PIUTANG, 'DEMO');
        localStorage.setItem(`${prefix}initialized`, 'true');
      }
    }
    // Pull server data in background
    StorageService.fetchFromBackend();
  },

  // Clear REAL Data only
  clearRealData: () => {
    const prefix = getPrefix('REAL');
    localStorage.removeItem(`${prefix}initialized`);
    localStorage.removeItem(`${prefix}kandang`);
    localStorage.removeItem(`${prefix}populasi`);
    localStorage.removeItem(`${prefix}pakan`);
    localStorage.removeItem(`${prefix}pencatatan_harian`);
    localStorage.removeItem(`${prefix}transaksi_keuangan`);
    localStorage.removeItem(`${prefix}aset_tetap`);
    localStorage.removeItem(`${prefix}hutang_piutang`);
    StorageService.initStorage('REAL');
    try {
      fetch(`${API_BASE}/reset-real`, { method: 'POST' });
    } catch {}
  },

  // Reset DEMO Data
  resetDemoData: () => {
    const prefix = getPrefix('DEMO');
    localStorage.removeItem(`${prefix}initialized`);
    StorageService.initStorage('DEMO');
  },

  // Getters
  getKandang: (): Kandang[] => getStoredData('kandang', []),
  getPopulasi: (): PopulasiBebek[] => getStoredData('populasi', []),
  getPakan: (): PakanItem[] => getStoredData('pakan', []),
  getPencatatanHarian: (): PencatatanHarian[] => getStoredData('pencatatan_harian', []),
  getKodeAkun: (): KodeAkun[] => getStoredData('kode_akun', INITIAL_KODE_AKUN),
  getTransaksi: (): TransaksiKeuangan[] => getStoredData('transaksi_keuangan', []),
  getAset: (): AsetTetap[] => getStoredData('aset_tetap', []),
  getHutangPiutang: (): HutangPiutang[] => getStoredData('hutang_piutang', []),

  // Setters
  saveKandang: (data: Kandang[]) => setStoredData('kandang', data),
  savePopulasi: (data: PopulasiBebek[]) => setStoredData('populasi', data),
  savePakan: (data: PakanItem[]) => setStoredData('pakan', data),
  savePencatatanHarian: (data: PencatatanHarian[]) => setStoredData('pencatatan_harian', data),
  saveTransaksi: (data: TransaksiKeuangan[]) => setStoredData('transaksi_keuangan', data),
  saveAset: (data: AsetTetap[]) => setStoredData('aset_tetap', data),
  saveHutangPiutang: (data: HutangPiutang[]) => setStoredData('hutang_piutang', data),

  // DELETE METHODS
  deletePencatatanHarian: (id: string) => {
    const logs = StorageService.getPencatatanHarian();
    const updated = logs.filter((l) => l.id !== id);
    StorageService.savePencatatanHarian(updated);
  },

  deleteTransaksiKeuangan: (id: string) => {
    const trxs = StorageService.getTransaksi();
    const updated = trxs.filter((t) => t.id !== id);
    StorageService.saveTransaksi(updated);
  },

  deleteKandang: (id: string) => {
    const list = StorageService.getKandang();
    const updated = list.filter((k) => k.id !== id);
    StorageService.saveKandang(updated);
  },

  deletePopulasi: (id: string) => {
    const list = StorageService.getPopulasi();
    const updated = list.filter((p) => p.id !== id);
    StorageService.savePopulasi(updated);
  },

  deletePakan: (id: string) => {
    const list = StorageService.getPakan();
    const updated = list.filter((p) => p.id !== id);
    StorageService.savePakan(updated);
  },

  deleteAset: (id: string) => {
    const list = StorageService.getAset();
    const updated = list.filter((a) => a.id !== id);
    StorageService.saveAset(updated);
  },

  deleteHutangPiutang: (id: string) => {
    const list = StorageService.getHutangPiutang();
    const updated = list.filter((h) => h.id !== id);
    StorageService.saveHutangPiutang(updated);
  },

  // Add Daily Harvest
  addPencatatanHarian: (newLog: Omit<PencatatanHarian, 'id'>): PencatatanHarian => {
    const logs = StorageService.getPencatatanHarian();
    const created: PencatatanHarian = {
      ...newLog,
      id: `log-${Date.now()}`,
    };

    const updatedLogs = [created, ...logs];
    StorageService.savePencatatanHarian(updatedLogs);

    if (newLog.pakanId && newLog.pakanKg > 0) {
      const pakanList = StorageService.getPakan();
      const updatedPakan = pakanList.map((p) =>
        p.id === newLog.pakanId
          ? { ...p, stokKg: Math.max(0, p.stokKg - newLog.pakanKg) }
          : p
      );
      StorageService.savePakan(updatedPakan);
    }

    const deadOrCulled = (newLog.bebekMati || 0) + (newLog.bebekAfkir || 0);
    if (deadOrCulled > 0 && newLog.populasiId) {
      const populasiList = StorageService.getPopulasi();
      const updatedPop = populasiList.map((pop) =>
        pop.id === newLog.populasiId
          ? { ...pop, jumlahSaatIni: Math.max(0, pop.jumlahSaatIni - deadOrCulled) }
          : pop
      );
      StorageService.savePopulasi(updatedPop);
    }

    return created;
  },

  // Add Financial Transaction
  addTransaksiKeuangan: (newTrx: Omit<TransaksiKeuangan, 'id' | 'noRef'>): TransaksiKeuangan => {
    const trxs = StorageService.getTransaksi();
    const noRef = `TRX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
      100 + Math.random() * 900
    )}`;

    const created: TransaksiKeuangan = {
      ...newTrx,
      id: `trx-${Date.now()}`,
      noRef,
    };

    const updated = [created, ...trxs];
    StorageService.saveTransaksi(updated);
    return created;
  },

  // Add Aset Tetap
  addAset: (newAset: Omit<AsetTetap, 'id' | 'penyusutanBulanan' | 'akumulasiPenyusutan' | 'nilaiBuku'> & { penyusutanBulanan?: number }): AsetTetap => {
    const asetList = StorageService.getAset();
    const masaManfaat = newAset.masaManfaatBulan || 1;
    const penyusutanBulanan = newAset.penyusutanBulanan !== undefined && newAset.penyusutanBulanan > 0
      ? newAset.penyusutanBulanan
      : Math.round(newAset.nilaiPerolehan / masaManfaat);

    const created: AsetTetap = {
      ...newAset,
      id: `ast-${Date.now()}`,
      akumulasiPenyusutan: 0,
      nilaiBuku: newAset.nilaiPerolehan,
      penyusutanBulanan,
    };

    const updated = [created, ...asetList];
    StorageService.saveAset(updated);
    return created;
  },

  // Add Hutang / Piutang
  addHutangPiutang: (newHp: Omit<HutangPiutang, 'id' | 'sisaNominal' | 'status'>): HutangPiutang => {
    const hpList = StorageService.getHutangPiutang();
    const created: HutangPiutang = {
      ...newHp,
      id: `hp-${Date.now()}`,
      sisaNominal: newHp.nominalTotal,
      status: 'BELUM_LUNAS',
    };

    const updated = [created, ...hpList];
    StorageService.saveHutangPiutang(updated);
    return created;
  },

  // Add Pakan
  addPakan: (newPakan: Omit<PakanItem, 'id'>): PakanItem => {
    const list = StorageService.getPakan();
    const created: PakanItem = {
      ...newPakan,
      id: `pak-${Date.now()}`,
    };
    const updated = [...list, created];
    StorageService.savePakan(updated);
    return created;
  },

  // Restock pakan
  restockPakan: (pakanId: string, tambahKg: number) => {
    const list = StorageService.getPakan();
    const updated = list.map((p) => (p.id === pakanId ? { ...p, stokKg: p.stokKg + tambahKg } : p));
    StorageService.savePakan(updated);
  },

  // Add Batch Populasi
  addPopulasi: (newPop: Omit<PopulasiBebek, 'id'>): PopulasiBebek => {
    const list = StorageService.getPopulasi();
    const created: PopulasiBebek = {
      ...newPop,
      id: `pop-${Date.now()}`,
    };
    const updated = [...list, created];
    StorageService.savePopulasi(updated);
    return created;
  },

  // Add Kode Akun
  addKodeAkun: (newAkun: Omit<KodeAkun, 'id'>): KodeAkun => {
    const list = StorageService.getKodeAkun();
    const created: KodeAkun = {
      ...newAkun,
      id: newAkun.kode,
    };
    const updated = [...list, created];
    setStoredData('kode_akun', updated);
    return created;
  },

  // Calculate High-level Dashboard Metrics
  calculateMetrics: (): FarmMetricsSummary => {
    const trxs = StorageService.getTransaksi();
    const logs = StorageService.getPencatatanHarian();
    const populasi = StorageService.getPopulasi();
    const hpList = StorageService.getHutangPiutang();

    let revenueSum = 0;
    let expenseSum = 0;

    trxs.forEach((t) => {
      if (t.tipeTransaksi === 'PENDAPATAN') {
        revenueSum += t.totalNominal;
      } else if (t.tipeTransaksi === 'PENGELUARAN') {
        expenseSum += t.totalNominal;
      }
    });

    const saldoKas = revenueSum - expenseSum;
    const labaRugiMtd = revenueSum - expenseSum;

    const totalPopulasiHidup = populasi.reduce((acc, p) => acc + p.jumlahSaatIni, 0);

    const latestLog = logs[0];
    const hdpHariIni = latestLog ? latestLog.hdpPercentage : 0;
    const totalTelurHariIni = latestLog
      ? latestLog.telurUtuh + latestLog.telurRetak + latestLog.telurRusak
      : 0;
    const totalPakanKgHariIni = latestLog ? latestLog.pakanKg : 0;

    const fcrAverage = logs.length > 0
      ? Number((logs.reduce((acc, l) => acc + l.fcr, 0) / logs.length).toFixed(2))
      : 0;

    const totalPiutang = hpList
      .filter((hp) => hp.jenis === 'PIUTANG' && hp.status === 'BELUM_LUNAS')
      .reduce((acc, hp) => acc + hp.sisaNominal, 0);

    const totalHutang = hpList
      .filter((hp) => hp.jenis === 'HUTANG' && hp.status === 'BELUM_LUNAS')
      .reduce((acc, hp) => acc + hp.sisaNominal, 0);

    return {
      saldoKas,
      labaRugiMtd,
      hdpHariIni,
      totalPopulasiHidup,
      totalTelurHariIni,
      totalPakanKgHariIni,
      fcrAverage,
      totalPiutang,
      totalHutang,
    };
  },
};

