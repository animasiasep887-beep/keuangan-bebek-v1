import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const DB_FILE = path.join(DATA_DIR, 'farm_database.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

const DEFAULT_KODE_AKUN = [
  { id: '101', kode: '101', nama: 'Kas Peternakan', tipe: 'ASSET', saldoNormal: 'DEBIT' },
  { id: '102', kode: '102', nama: 'Bank / Rekening Operasional', tipe: 'ASSET', saldoNormal: 'DEBIT' },
  { id: '103', kode: '103', nama: 'Piutang Penjualan Telur', tipe: 'ASSET', saldoNormal: 'DEBIT' },
  { id: '104', kode: '104', nama: 'Persediaan Pakan & Suplemen', tipe: 'ASSET', saldoNormal: 'DEBIT' },
  { id: '105', kode: '105', nama: 'Persediaan Telur Siap Jual', tipe: 'ASSET', saldoNormal: 'DEBIT' },
  { id: '121', kode: '121', nama: 'Aset Biologis (Bebek Petelur)', tipe: 'ASSET', saldoNormal: 'DEBIT' },
  { id: '122', kode: '122', nama: 'Bangunan Kandang', tipe: 'ASSET', saldoNormal: 'DEBIT' },
  { id: '123', kode: '123', nama: 'Akumulasi Penyusutan Aset', tipe: 'ASSET', saldoNormal: 'KREDIT' },
  { id: '201', kode: '201', nama: 'Hutang Usaha Pakan', tipe: 'LIABILITY', saldoNormal: 'KREDIT' },
  { id: '202', kode: '202', nama: 'Hutang Operasional Lainnya', tipe: 'LIABILITY', saldoNormal: 'KREDIT' },
  { id: '301', kode: '301', nama: 'Modal Pemilik Peternakan', tipe: 'EQUITY', saldoNormal: 'KREDIT' },
  { id: '302', kode: '302', nama: 'Laba Ditahan / Akumulasi Laba', tipe: 'EQUITY', saldoNormal: 'KREDIT' },
  { id: '401', kode: '401', nama: 'Pendapatan Penjualan Telur Grade A', tipe: 'REVENUE', saldoNormal: 'KREDIT' },
  { id: '402', kode: '402', nama: 'Pendapatan Penjualan Telur Grade B (Retak)', tipe: 'REVENUE', saldoNormal: 'KREDIT' },
  { id: '403', kode: '403', nama: 'Pendapatan Penjualan Bebek Afkir', tipe: 'REVENUE', saldoNormal: 'KREDIT' },
  { id: '404', kode: '404', nama: 'Pendapatan Penjualan Pupuk Kandang', tipe: 'REVENUE', saldoNormal: 'KREDIT' },
  { id: '501', kode: '501', nama: 'Beban Pokok Produksi - Pakan Konsentrat', tipe: 'EXPENSE', saldoNormal: 'DEBIT' },
  { id: '502', kode: '502', nama: 'Beban Vaksin, Vitamin & Obat', tipe: 'EXPENSE', saldoNormal: 'DEBIT' },
  { id: '503', kode: '503', nama: 'Beban Upah & Tenaga Kerja', tipe: 'EXPENSE', saldoNormal: 'DEBIT' },
  { id: '504', kode: '504', nama: 'Beban Listrik, Air & Sekam', tipe: 'EXPENSE', saldoNormal: 'DEBIT' },
  { id: '505', kode: '505', nama: 'Beban Perbaikan & Pemeliharaan Kandang', tipe: 'EXPENSE', saldoNormal: 'DEBIT' },
  { id: '506', kode: '506', nama: 'Beban Penyusutan Aset', tipe: 'EXPENSE', saldoNormal: 'DEBIT' },
];

const INITIAL_REAL_DATA = {
  kandang: [
    { id: 'k-1', namaKandang: 'Kandang 1 (Utama)', kapasitas: 1000, status: 'AKTIF', catatan: 'Unit kandang utama' }
  ],
  populasi: [
    {
      id: 'pop-1',
      kandangId: 'k-1',
      kodeBatch: 'BATCH-01',
      tglMasuk: new Date().toISOString().split('T')[0],
      jumlahAwal: 500,
      jumlahSaatIni: 500,
      hargaBeliPerEkor: 75000,
      umurMinggu: 24,
      status: 'PRODUKTIF'
    }
  ],
  pakan: [
    { id: 'pak-1', namaPakan: 'Konsentrat Bebek Petelur K-99', merk: 'Standard', stokKg: 500, hargaPerKg: 8000, minStokKg: 100 }
  ],
  kode_akun: DEFAULT_KODE_AKUN,
  pencatatan_harian: [],
  transaksi_keuangan: [],
  aset_tetap: [],
  hutang_piutang: []
};

class Database {
  constructor() {
    this.data = {
      REAL: JSON.parse(JSON.stringify(INITIAL_REAL_DATA)),
      DEMO: null,
      mode: 'REAL',
      lastUpdated: new Date().toISOString()
    };
    this.loadFromDisk();
  }

  loadFromDisk() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        if (parsed.REAL) {
          this.data = { ...this.data, ...parsed };
          console.log('[DATABASE] Berhasil memuat data peternakan dari hard disk:', DB_FILE);
          return;
        }
      }
      this.saveToDisk();
      console.log('[DATABASE] File database baru diinisialisasi:', DB_FILE);
    } catch (err) {
      console.error('[DATABASE] Error membaca database dari disk:', err);
    }
  }

  saveToDisk() {
    try {
      this.data.lastUpdated = new Date().toISOString();
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
      this.createPeriodicBackup();
    } catch (err) {
      console.error('[DATABASE] Gagal menyimpan data ke disk:', err);
    }
  }

  createPeriodicBackup() {
    try {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const backupFile = path.join(BACKUPS_DIR, `backup_${dateStr}.json`);
      // Create backup once a day
      if (!fs.existsSync(backupFile)) {
        fs.writeFileSync(backupFile, JSON.stringify(this.data, null, 2), 'utf-8');
        console.log('[DATABASE] Backup otomatis dibuat:', backupFile);
      }
    } catch (e) {
      console.error('[DATABASE] Error creating backup:', e);
    }
  }

  getAllData(mode = 'REAL') {
    const activeData = this.data[mode] || this.data.REAL;
    return {
      mode,
      lastUpdated: this.data.lastUpdated,
      kandang: activeData.kandang || [],
      populasi: activeData.populasi || [],
      pakan: activeData.pakan || [],
      pencatatan_harian: activeData.pencatatan_harian || [],
      transaksi_keuangan: activeData.transaksi_keuangan || [],
      aset_tetap: activeData.aset_tetap || [],
      hutang_piutang: activeData.hutang_piutang || [],
      kode_akun: activeData.kode_akun || DEFAULT_KODE_AKUN,
      metrics: this.calculateMetrics(mode)
    };
  }

  syncAllData(payload, mode = 'REAL') {
    if (!this.data[mode]) {
      this.data[mode] = {};
    }
    const current = this.data[mode];
    if (payload.kandang) current.kandang = payload.kandang;
    if (payload.populasi) current.populasi = payload.populasi;
    if (payload.pakan) current.pakan = payload.pakan;
    if (payload.pencatatan_harian) current.pencatatan_harian = payload.pencatatan_harian;
    if (payload.transaksi_keuangan) current.transaksi_keuangan = payload.transaksi_keuangan;
    if (payload.aset_tetap) current.aset_tetap = payload.aset_tetap;
    if (payload.hutang_piutang) current.hutang_piutang = payload.hutang_piutang;
    if (payload.kode_akun) current.kode_akun = payload.kode_akun;

    this.saveToDisk();
    return this.getAllData(mode);
  }

  addPencatatanHarian(log, mode = 'REAL') {
    const activeData = this.data[mode] || this.data.REAL;
    if (!activeData.pencatatan_harian) activeData.pencatatan_harian = [];
    if (!activeData.pakan) activeData.pakan = [];
    if (!activeData.populasi) activeData.populasi = [];

    const totalPopulasi = (activeData.populasi || []).reduce((acc, p) => acc + p.jumlahSaatIni, 0) || 500;
    const totalTelur = (log.telurUtuh || 0) + (log.telurRetak || 0) + (log.telurRusak || 0);
    const hdp = totalPopulasi > 0 ? Number(((totalTelur / totalPopulasi) * 100).toFixed(1)) : 0;
    const fcr = totalTelur > 0 && log.pakanKg ? Number((log.pakanKg / (totalTelur * 0.065)).toFixed(2)) : 0;

    const newEntry = {
      ...log,
      id: log.id || `log-${Date.now()}`,
      tanggal: log.tanggal || new Date().toISOString().split('T')[0],
      kandangId: log.kandangId || (activeData.kandang[0]?.id || 'k-1'),
      populasiId: log.populasiId || (activeData.populasi[0]?.id || 'pop-1'),
      telurUtuh: Number(log.telurUtuh) || 0,
      telurRetak: Number(log.telurRetak) || 0,
      telurRusak: Number(log.telurRusak) || 0,
      totalBeratTelurKg: Number(log.totalBeratTelurKg) || Number((totalTelur * 0.065).toFixed(2)),
      bebekMati: Number(log.bebekMati) || 0,
      bebekAfkir: Number(log.bebekAfkir) || 0,
      pakanKg: Number(log.pakanKg) || 0,
      pakanId: log.pakanId || (activeData.pakan[0]?.id || 'pak-1'),
      hdpPercentage: log.hdpPercentage !== undefined ? Number(log.hdpPercentage) : hdp,
      fcr: log.fcr !== undefined ? Number(log.fcr) : fcr,
      catatan: log.catatan || 'Dicatat via Sistem Terpadu',
      createdBy: log.createdBy || 'Peternak'
    };

    activeData.pencatatan_harian.unshift(newEntry);

    // Deduct feed
    if (newEntry.pakanId && newEntry.pakanKg > 0) {
      activeData.pakan = activeData.pakan.map(p =>
        p.id === newEntry.pakanId ? { ...p, stokKg: Math.max(0, p.stokKg - newEntry.pakanKg) } : p
      );
    }

    // Deduct dead / culled ducks
    const deadOrCulled = (newEntry.bebekMati || 0) + (newEntry.bebekAfkir || 0);
    if (deadOrCulled > 0 && newEntry.populasiId) {
      activeData.populasi = activeData.populasi.map(p =>
        p.id === newEntry.populasiId ? { ...p, jumlahSaatIni: Math.max(0, p.jumlahSaatIni - deadOrCulled) } : p
      );
    }

    this.saveToDisk();
    return newEntry;
  }

  addTransaksiKeuangan(trx, mode = 'REAL') {
    const activeData = this.data[mode] || this.data.REAL;
    if (!activeData.transaksi_keuangan) activeData.transaksi_keuangan = [];

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const noRef = trx.noRef || `TRX-${dateStr}-${Math.floor(100 + Math.random() * 900)}`;

    const newEntry = {
      ...trx,
      id: trx.id || `trx-${Date.now()}`,
      tanggal: trx.tanggal || new Date().toISOString().split('T')[0],
      noRef,
      deskripsi: trx.deskripsi || 'Transaksi Kas Peternakan',
      totalNominal: Number(trx.totalNominal) || 0,
      tipeTransaksi: trx.tipeTransaksi || 'PENGELUARAN',
      items: trx.items || [],
      createdBy: trx.createdBy || 'Peternak'
    };

    activeData.transaksi_keuangan.unshift(newEntry);
    this.saveToDisk();
    return newEntry;
  }

  calculateMetrics(mode = 'REAL') {
    const activeData = this.data[mode] || this.data.REAL;
    const trxs = activeData.transaksi_keuangan || [];
    const logs = activeData.pencatatan_harian || [];
    const populasi = activeData.populasi || [];
    const hpList = activeData.hutang_piutang || [];

    let revenueSum = 0;
    let expenseSum = 0;

    trxs.forEach((t) => {
      if (t.tipeTransaksi === 'PENDAPATAN') {
        revenueSum += t.totalNominal || 0;
      } else if (t.tipeTransaksi === 'PENGELUARAN') {
        expenseSum += t.totalNominal || 0;
      }
    });

    const saldoKas = revenueSum - expenseSum;
    const labaRugiMtd = revenueSum - expenseSum;
    const totalPopulasiHidup = populasi.reduce((acc, p) => acc + (p.jumlahSaatIni || 0), 0);

    const latestLog = logs[0];
    const hdpHariIni = latestLog ? (latestLog.hdpPercentage || 0) : 0;
    const totalTelurHariIni = latestLog
      ? (latestLog.telurUtuh || 0) + (latestLog.telurRetak || 0) + (latestLog.telurRusak || 0)
      : 0;
    const totalPakanKgHariIni = latestLog ? (latestLog.pakanKg || 0) : 0;

    const fcrAverage = logs.length > 0
      ? Number((logs.reduce((acc, l) => acc + (l.fcr || 0), 0) / logs.length).toFixed(2))
      : 0;

    const totalPiutang = hpList
      .filter((hp) => hp.jenis === 'PIUTANG' && hp.status === 'BELUM_LUNAS')
      .reduce((acc, hp) => acc + (hp.sisaNominal || 0), 0);

    const totalHutang = hpList
      .filter((hp) => hp.jenis === 'HUTANG' && hp.status === 'BELUM_LUNAS')
      .reduce((acc, hp) => acc + (hp.sisaNominal || 0), 0);

    return {
      saldoKas,
      labaRugiMtd,
      hdpHariIni,
      totalPopulasiHidup,
      totalTelurHariIni,
      totalPakanKgHariIni,
      fcrAverage,
      totalPiutang,
      totalHutang
    };
  }

  resetRealData() {
    this.data.REAL = JSON.parse(JSON.stringify(INITIAL_REAL_DATA));
    this.saveToDisk();
    return this.getAllData('REAL');
  }
}

export const db = new Database();
