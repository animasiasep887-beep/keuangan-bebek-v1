import React, { useState, useEffect } from 'react';
import { RefreshCw, PlusCircle, CheckCircle2, BookOpen, Trash2, Layers, Download, Database, Bot, ExternalLink, HardDrive } from 'lucide-react';
import type { Kandang, PopulasiBebek, KodeAkun, StatusPopulasi, TipeAkun, SaldoNormal } from '../types';
import { StorageService } from '../services/storage';

interface PengaturanViewProps {
  kandangList: Kandang[];
  populasiList: PopulasiBebek[];
  kodeAkunList: KodeAkun[];
  onRefreshData: () => void;
  onResetZero: () => void;
  onResetDemo: () => void;
}

export const PengaturanView: React.FC<PengaturanViewProps> = ({
  kandangList,
  populasiList,
  kodeAkunList,
  onRefreshData,
  onResetZero,
  onResetDemo,
}) => {
  const [activeTab, setActiveTab] = useState<'kandang' | 'populasi' | 'coa' | 'database'>('database');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<any>(null);

  useEffect(() => {
    StorageService.getServerStatus().then(st => setServerStatus(st));
  }, []);

  // Form for New Kandang
  const [namaKandang, setNamaKandang] = useState('');
  const [kapasitas, setKapasitas] = useState(500);

  // Form for New Populasi
  const [showPopulasiForm, setShowPopulasiForm] = useState(false);
  const [popKandangId, setPopKandangId] = useState(kandangList[0]?.id || 'k-1');
  const [kodeBatch, setKodeBatch] = useState('');
  const [tglMasuk, setTglMasuk] = useState(new Date().toISOString().split('T')[0]);
  const [jumlahAwal, setJumlahAwal] = useState<number>(500);
  const [hargaBeliPerEkor, setHargaBeliPerEkor] = useState<number>(75000);
  const [umurMinggu, setUmurMinggu] = useState<number>(20);
  const [statusPopulasi, setStatusPopulasi] = useState<StatusPopulasi>('PRODUKTIF');

  // Form for New COA
  const [showCoaForm, setShowCoaForm] = useState(false);
  const [kodeAkunInput, setKodeAkunInput] = useState('');
  const [namaAkunInput, setNamaAkunInput] = useState('');
  const [tipeAkunInput, setTipeAkunInput] = useState<TipeAkun>('EXPENSE');
  const [saldoNormalInput, setSaldoNormalInput] = useState<SaldoNormal>('DEBIT');

  const handleDownloadBackup = () => {
    window.open('/api/backup/download', '_blank');
  };

  const handleForceSync = async () => {
    await StorageService.syncToBackend();
    setSuccessMsg('Semua data berhasil disinkronkan ke Hard Disk!');
    setTimeout(() => setSuccessMsg(null), 2500);
  };


  const handleAddKandang = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaKandang.trim()) return;

    const newKandang: Kandang = {
      id: `k-${Date.now()}`,
      namaKandang,
      kapasitas,
      status: 'AKTIF',
    };

    StorageService.saveKandang([...kandangList, newKandang]);
    setSuccessMsg('Kandang Baru Berhasil Ditambahkan!');
    setNamaKandang('');
    onRefreshData();

    setTimeout(() => setSuccessMsg(null), 2000);
  };

  const handleAddPopulasi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kodeBatch.trim() || jumlahAwal <= 0) {
      alert('Mohon isi kode batch dan jumlah ekor bebek!');
      return;
    }

    StorageService.addPopulasi({
      kandangId: popKandangId,
      kodeBatch,
      tglMasuk,
      jumlahAwal,
      jumlahSaatIni: jumlahAwal,
      hargaBeliPerEkor,
      umurMinggu,
      status: statusPopulasi,
    });

    setSuccessMsg(`Batch Populasi ${kodeBatch} Berhasil Ditambahkan!`);
    onRefreshData();
    setShowPopulasiForm(false);
    setKodeBatch('');
    setTimeout(() => setSuccessMsg(null), 2000);
  };

  const handleAddCoa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kodeAkunInput.trim() || !namaAkunInput.trim()) {
      alert('Mohon isi kode akun dan nama akun!');
      return;
    }

    StorageService.addKodeAkun({
      kode: kodeAkunInput,
      nama: namaAkunInput,
      tipe: tipeAkunInput,
      saldoNormal: saldoNormalInput,
    });

    setSuccessMsg(`Kode Akun [${kodeAkunInput}] ${namaAkunInput} Berhasil Ditambahkan!`);
    onRefreshData();
    setShowCoaForm(false);
    setKodeAkunInput('');
    setNamaAkunInput('');
    setTimeout(() => setSuccessMsg(null), 2000);
  };

  const handleDeleteKandang = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus unit kandang ini?')) {
      StorageService.deleteKandang(id);
      onRefreshData();
    }
  };

  const handleDeletePopulasi = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data populasi bebek ini?')) {
      StorageService.deletePopulasi(id);
      onRefreshData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-amber-400" />
            Pengaturan Master Data & Kandang
          </h2>
          <p className="text-xs text-slate-400">
            Kelola unit kandang, batch populasi bebek, dan bagan akun akuntansi (Chart of Accounts).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('kandang')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'kandang' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400'
              }`}
            >
              Kandang ({kandangList.length})
            </button>
            <button
              onClick={() => setActiveTab('populasi')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'populasi' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400'
              }`}
            >
              Populasi ({populasiList.length})
            </button>
            <button
              onClick={() => setActiveTab('coa')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'coa' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400'
              }`}
            >
              Chart of Accounts ({kodeAkunList.length})
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'database' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Database & Bot
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onResetZero}
              className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/20 flex items-center gap-1"
              title="Kosongkan seluruh data ke 0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Mulai dari 0
            </button>
            <button
              onClick={onResetDemo}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700"
              title="Muat Data Contoh Demo (30 Hari)"
            >
              Muat Data Demo
            </button>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {successMsg}
        </div>
      )}

      {/* TAB 4: Database & Bot Integrasi */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Database Persistence Status */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Status Penyimpanan Data Permanen</h3>
                  <p className="text-xs text-slate-400">Penyimpanan Terpusat Hard Disk (Bukan Hanya Browser)</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status Server Database:</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    {serverStatus?.online ? 'Online & Aktif' : 'Tersinkronisasi'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Lokasi File Database:</span>
                  <span className="font-mono text-amber-400 text-[11px]">server/data/farm_database.json</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Auto-Backup:</span>
                  <span className="font-bold text-slate-200">Aktif Harian (server/data/backups/)</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleForceSync}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  Simpan & Sync Sekarang
                </button>
                <button
                  onClick={handleDownloadBackup}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Backup (.json)
                </button>
              </div>
            </div>

            {/* Telegram Bot Integration Card */}
            <div className="glass-panel p-5 rounded-2xl border border-sky-500/30 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Integrasi Bot Telegram</h3>
                  <p className="text-xs text-slate-400">Pencatatan Panen & Keuangan dari HP</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Username Bot:</span>
                  <span className="font-mono font-bold text-sky-400">@bebekpetelur_bot</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status Bot:</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Aktif (Long-Polling Terhubung)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">AI Engine:</span>
                  <span className="font-bold text-amber-400">Google Gemini Flash</span>
                </div>
              </div>

              <a
                href="https://t.me/bebekpetelur_bot"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Buka & Uji Chat Bot Telegram
              </a>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: Kandang */}
      {activeTab === 'kandang' && (

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-amber-400" />
              Tambah Kandang Baru
            </h3>
            <form onSubmit={handleAddKandang} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nama Kandang</label>
                <input
                  type="text"
                  placeholder="Contoh: Kandang Delta (Selatan)"
                  value={namaKandang}
                  onChange={(e) => setNamaKandang(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Kapasitas (Ekor)</label>
                <input
                  type="number"
                  value={kapasitas}
                  onChange={(e) => setKapasitas(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
              >
                + Simpan Kandang
              </button>
            </form>
          </div>

          <div className="md:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white">Daftar Kandang Terdaftar</h3>
            <div className="space-y-2">
              {kandangList.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4">Belum ada unit kandang terdaftar.</p>
              ) : (
                kandangList.map((k) => (
                  <div key={k.id} className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white text-sm">{k.namaKandang}</p>
                      <p className="text-xs text-slate-400">Kapasitas Maksimal: {k.kapasitas} ekor</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {k.status}
                      </span>
                      <button
                        onClick={() => handleDeleteKandang(k.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                        title="Hapus Kandang Ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Populasi */}
      {activeTab === 'populasi' && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              Batch Populasi Bebek Petelur
            </h3>
            <button
              onClick={() => setShowPopulasiForm(!showPopulasiForm)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              {showPopulasiForm ? 'Tutup Form' : '+ Tambah Batch Populasi'}
            </button>
          </div>

          {/* Form Input Batch Populasi */}
          {showPopulasiForm && (
            <form onSubmit={handleAddPopulasi} className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 space-y-3 text-xs">
              <h4 className="font-bold text-amber-400 text-sm">Input Batch Populasi Bebek Baru</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kandang</label>
                  <select
                    value={popKandangId}
                    onChange={(e) => setPopKandangId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    {kandangList.map((k) => (
                      <option key={k.id} value={k.id}>{k.namaKandang}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kode Batch</label>
                  <input
                    type="text"
                    placeholder="Contoh: BATCH-2026-A1"
                    value={kodeBatch}
                    onChange={(e) => setKodeBatch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tanggal Masuk</label>
                  <input
                    type="date"
                    value={tglMasuk}
                    onChange={(e) => setTglMasuk(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Jumlah Ekor Bebek</label>
                  <input
                    type="number"
                    min="1"
                    value={jumlahAwal}
                    onChange={(e) => setJumlahAwal(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Harga Beli / Ekor (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={hargaBeliPerEkor}
                    onChange={(e) => setHargaBeliPerEkor(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Umur Bebek (Minggu)</label>
                  <input
                    type="number"
                    min="1"
                    value={umurMinggu}
                    onChange={(e) => setUmurMinggu(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status Populasi</label>
                  <select
                    value={statusPopulasi}
                    onChange={(e) => setStatusPopulasi(e.target.value as StatusPopulasi)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="PRODUKTIF">PRODUKTIF</option>
                    <option value="PEMBESARAN">PEMBESARAN</option>
                    <option value="AFKIR">AFKIR</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPopulasiForm(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
                >
                  Simpan Batch Populasi
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-800 text-xs">
            <table className="w-full text-left text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="px-4 py-3">Kode Batch</th>
                  <th className="px-4 py-3">Tgl Masuk</th>
                  <th className="px-4 py-3">Jumlah Awal</th>
                  <th className="px-4 py-3 font-bold text-white">Jumlah Saat Ini</th>
                  <th className="px-4 py-3">Umur</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {populasiList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                      Belum ada batch populasi terdaftar.
                    </td>
                  </tr>
                ) : (
                  populasiList.map((pop) => (
                    <tr key={pop.id}>
                      <td className="px-4 py-3 font-bold text-amber-400">{pop.kodeBatch}</td>
                      <td className="px-4 py-3">{pop.tglMasuk}</td>
                      <td className="px-4 py-3">{pop.jumlahAwal} ekor</td>
                      <td className="px-4 py-3 font-extrabold text-emerald-400">{pop.jumlahSaatIni} ekor</td>
                      <td className="px-4 py-3">{pop.umurMinggu} minggu</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                          {pop.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeletePopulasi(pop.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                          title="Hapus Populasi Ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Chart of Accounts */}
      {activeTab === 'coa' && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              Chart of Accounts (Daftar Akun Akuntansi Standar)
            </h3>
            <button
              onClick={() => setShowCoaForm(!showCoaForm)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              {showCoaForm ? 'Tutup Form' : '+ Tambah Kode Akun'}
            </button>
          </div>

          {/* Form Input Kode Akun */}
          {showCoaForm && (
            <form onSubmit={handleAddCoa} className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 space-y-3 text-xs">
              <h4 className="font-bold text-amber-400 text-sm">Input Kode Akun Baru</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kode Akun</label>
                  <input
                    type="text"
                    placeholder="Contoh: 507"
                    value={kodeAkunInput}
                    onChange={(e) => setKodeAkunInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nama Akun</label>
                  <input
                    type="text"
                    placeholder="Contoh: Beban Transportasi & Distribusi"
                    value={namaAkunInput}
                    onChange={(e) => setNamaAkunInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tipe Akun</label>
                  <select
                    value={tipeAkunInput}
                    onChange={(e) => setTipeAkunInput(e.target.value as TipeAkun)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="ASSET">ASSET</option>
                    <option value="LIABILITY">LIABILITY</option>
                    <option value="EQUITY">EQUITY</option>
                    <option value="REVENUE">REVENUE</option>
                    <option value="EXPENSE">EXPENSE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Saldo Normal</label>
                  <select
                    value={saldoNormalInput}
                    onChange={(e) => setSaldoNormalInput(e.target.value as SaldoNormal)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="DEBIT">DEBIT</option>
                    <option value="KREDIT">KREDIT</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCoaForm(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
                >
                  Simpan Kode Akun
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-800 text-xs">
            <table className="w-full text-left text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="px-4 py-3">Kode Akun</th>
                  <th className="px-4 py-3">Nama Akun</th>
                  <th className="px-4 py-3">Tipe Akun</th>
                  <th className="px-4 py-3">Saldo Normal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-medium">
                {kodeAkunList.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3 font-mono font-bold text-amber-400">{a.kode}</td>
                    <td className="px-4 py-3 font-bold text-white">{a.nama}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          a.tipe === 'REVENUE'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : a.tipe === 'EXPENSE'
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-sky-500/10 text-sky-400'
                        }`}
                      >
                        {a.tipe}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{a.saldoNormal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
