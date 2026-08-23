import React, { useState } from 'react';
import {
  Egg,
  PlusCircle,
  Trash2,
  AlertTriangle,
  Scale,
  Calendar,
  Layers,
  CheckCircle2,
  Search,
} from 'lucide-react';
import type { PencatatanHarian, Kandang, PopulasiBebek, PakanItem } from '../types';
import { StorageService } from '../services/storage';

interface OperasionalViewProps {
  logs: PencatatanHarian[];
  kandangList: Kandang[];
  populasiList: PopulasiBebek[];
  pakanList: PakanItem[];
  onRefreshData: () => void;
}

export const OperasionalView: React.FC<OperasionalViewProps> = ({
  logs,
  kandangList,
  populasiList,
  pakanList,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'table' | 'pakan'>('form');

  // Form State
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [kandangId, setKandangId] = useState<string>(kandangList[0]?.id || 'k-1');
  const [populasiId, setPopulasiId] = useState<string>(populasiList[0]?.id || 'pop-1');
  const [telurUtuh, setTelurUtuh] = useState<number>(850);
  const [telurRetak, setTelurRetak] = useState<number>(20);
  const [telurRusak, setTelurRusak] = useState<number>(5);
  const [bebekMati, setBebekMati] = useState<number>(0);
  const [bebekAfkir, setBebekAfkir] = useState<number>(0);
  const [pakanKg, setPakanKg] = useState<number>(365);
  const [pakanId, setPakanId] = useState<string>(pakanList[0]?.id || 'pak-1');
  const [catatan, setCatatan] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State - Tambah Pakan Baru / Restock
  const [showPakanForm, setShowPakanForm] = useState<boolean>(false);
  const [namaPakanBaru, setNamaPakanBaru] = useState('');
  const [merkPakanBaru, setMerkPakanBaru] = useState('');
  const [stokKgBaru, setStokKgBaru] = useState<number>(500);
  const [hargaPerKgBaru, setHargaPerKgBaru] = useState<number>(8000);
  const [minStokKgBaru, setMinStokKgBaru] = useState<number>(100);

  // Selected population live count
  const selectedPop = populasiList.find((p) => p.id === populasiId);
  const liveDuckCount = selectedPop ? selectedPop.jumlahSaatIni : 2435;

  // Auto-calculated fields
  const totalTelur = telurUtuh + telurRetak + telurRusak;
  const hdpPercentage = liveDuckCount > 0
    ? Number(((totalTelur / liveDuckCount) * 100).toFixed(1))
    : 0;

  // Total weight estimate (~65g per egg)
  const totalBeratTelurKg = Number(((totalTelur * 65) / 1000).toFixed(1));

  // FCR estimate = Pakan (kg) / Berat Telur (kg)
  const fcr = totalBeratTelurKg > 0
    ? Number((pakanKg / totalBeratTelurKg).toFixed(2))
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    StorageService.addPencatatanHarian({
      tanggal,
      kandangId,
      populasiId,
      telurUtuh,
      telurRetak,
      telurRusak,
      totalBeratTelurKg,
      bebekMati,
      bebekAfkir,
      pakanKg,
      pakanId,
      hdpPercentage,
      fcr,
      catatan,
      createdBy: 'Petugas Kandang',
    });

    setSuccessMessage('Data Panen Harian Berhasil Disimpan!');
    onRefreshData();

    setTimeout(() => {
      setSuccessMessage(null);
      setActiveTab('table');
    }, 1500);
  };

  const handleDeleteLog = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data panen harian ini?')) {
      const updated = logs.filter((l) => l.id !== id);
      StorageService.savePencatatanHarian(updated);
      onRefreshData();
    }
  };

  const handleAddPakanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPakanBaru.trim()) {
      alert('Mohon isi nama pakan!');
      return;
    }
    StorageService.addPakan({
      namaPakan: namaPakanBaru,
      merk: merkPakanBaru || 'Lokal / Standard',
      stokKg: stokKgBaru,
      hargaPerKg: hargaPerKgBaru,
      minStokKg: minStokKgBaru,
    });
    setSuccessMessage('Stok Pakan Baru Berhasil Ditambahkan!');
    onRefreshData();
    setShowPakanForm(false);
    setNamaPakanBaru('');
    setMerkPakanBaru('');
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  const handleRestockPakan = (id: string, nama: string) => {
    const qtyStr = prompt(`Masukkan jumlah restock pakan (kg) untuk ${nama}:`, '100');
    if (!qtyStr) return;
    const qty = parseFloat(qtyStr);
    if (!isNaN(qty) && qty > 0) {
      StorageService.restockPakan(id, qty);
      setSuccessMessage(`Stok ${nama} berhasil ditambah ${qty} kg!`);
      onRefreshData();
      setTimeout(() => setSuccessMessage(null), 2000);
    }
  };

  const handleDeletePakan = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus jenis pakan ini?')) {
      StorageService.deletePakan(id);
      onRefreshData();
    }
  };

  const filteredLogs = logs.filter(
    (l) => l.tanggal.includes(searchTerm) || (l.catatan && l.catatan.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Sub Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Egg className="w-6 h-6 text-amber-400" />
            Modul Pencatatan Operasional Kandang
          </h2>
          <p className="text-xs text-slate-400">
            Formulir panen harian, mortalitas bebek, dan pemantauan rasio pakan (FCR).
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('form')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'form'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Input Panen
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'table'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Riwayat Panen
          </button>
          <button
            onClick={() => setActiveTab('pakan')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'pakan'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-4 h-4" />
            Stok Pakan
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-bold text-sm flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          {successMessage}
        </div>
      )}

      {/* VIEW 1: Form Input Panen Harian */}
      {activeTab === 'form' && (
        <div className="space-y-4">
          {/* Card Panduan & Contoh Pengisian (Hanya Tulisan Referensi) */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-slate-300 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
              <span className="text-base">💡</span> Panduan & Contoh Pengisian Form Panen (Hanya Referensi Tulisan)
            </div>
            <p className="text-slate-300">
              Formulir di bawah ini <strong>murni dari 0 (kosong)</strong> agar Anda dapat memasukkan data asli peternakan Anda. Berikut adalah contoh standar pengisian data harian:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-400 block">Contoh Telur Utuh:</span>
                <span className="font-bold text-amber-400">850 butir</span>
              </div>
              <div>
                <span className="text-slate-400 block">Contoh Telur Retak:</span>
                <span className="font-bold text-orange-400">20 butir</span>
              </div>
              <div>
                <span className="text-slate-400 block">Contoh Pakan Harian:</span>
                <span className="font-bold text-sky-400">360 kg</span>
              </div>
              <div>
                <span className="text-slate-400 block">Hasil HDP %:</span>
                <span className="font-bold text-emerald-400">Auto Hitung 87.0%</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" /> Tanggal Panen
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Kandang</label>
              <select
                value={kandangId}
                onChange={(e) => setKandangId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                {kandangList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.namaKandang} (Kapasitas: {k.kapasitas})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Batch Populasi Bebek</label>
              <select
                value={populasiId}
                onChange={(e) => setPopulasiId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                {populasiList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.kodeBatch} ({p.jumlahSaatIni} ekor hidup)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Live Productivity Preview Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 rounded-xl border border-amber-500/20 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-[11px] font-semibold text-slate-400">Hasil Total Butir</p>
              <p className="text-xl font-black text-amber-400">{totalTelur.toLocaleString('id-ID')} <span className="text-xs font-normal">butir</span></p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400">Hen-Day Production (%)</p>
              <p className="text-xl font-black text-emerald-400">{hdpPercentage}%</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400">Estimasi Berat Total</p>
              <p className="text-xl font-black text-sky-400">{totalBeratTelurKg} <span className="text-xs font-normal">kg</span></p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400">Rasio FCR Pakan</p>
              <p className="text-xl font-black text-indigo-400">{fcr}</p>
            </div>
          </div>

          {/* Harvest Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <label className="block text-xs font-bold text-amber-400 mb-1">
                Telur Utuh / Grade A (Butir)
              </label>
              <input
                type="number"
                min="0"
                value={telurUtuh}
                onChange={(e) => setTelurUtuh(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-amber-500/30 rounded-lg px-3 py-2 text-lg font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <label className="block text-xs font-bold text-orange-400 mb-1">
                Telur Retak / Grade B (Butir)
              </label>
              <input
                type="number"
                min="0"
                value={telurRetak}
                onChange={(e) => setTelurRetak(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-orange-500/30 rounded-lg px-3 py-2 text-lg font-bold text-orange-300 focus:outline-none focus:border-orange-400"
              />
            </div>

            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <label className="block text-xs font-bold text-rose-400 mb-1">
                Telur Rusak / Pecah (Butir)
              </label>
              <input
                type="number"
                min="0"
                value={telurRusak}
                onChange={(e) => setTelurRusak(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-rose-500/30 rounded-lg px-3 py-2 text-lg font-bold text-rose-300 focus:outline-none focus:border-rose-400"
              />
            </div>
          </div>

          {/* Mortality & Feed Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-rose-400 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Bebek Mati (Ekor)
              </label>
              <input
                type="number"
                min="0"
                value={bebekMati}
                onChange={(e) => setBebekMati(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-300 mb-1">Bebek Afkir (Ekor)</label>
              <input
                type="number"
                min="0"
                value={bebekAfkir}
                onChange={(e) => setBebekAfkir(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Jenis Pakan</label>
              <select
                value={pakanId}
                onChange={(e) => setPakanId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium"
              >
                {pakanList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.namaPakan} (Sisa: {p.stokKg} kg)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Total Pakan Hari Ini (Kg)</label>
              <input
                type="number"
                min="0"
                value={pakanKg}
                onChange={(e) => setPakanKg(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Catatan Tambahan (Kondisi Cuaca / Kesehatan)</label>
            <textarea
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Cuaca agak dingin, pakan habis total pukul 16:00, nafsu makan baik..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-medium focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
            >
              Simpan Pencatatan Harian
            </button>
          </div>
        </form>
      </div>
      )}

      {/* VIEW 2: Tabel History Panen */}
      {activeTab === 'table' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h3 className="text-base font-bold text-white">Riwayat Panen Telur Harian</h3>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari tanggal / catatan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Grade A (Utuh)</th>
                  <th className="px-4 py-3">Grade B (Retak)</th>
                  <th className="px-4 py-3">Pecah</th>
                  <th className="px-4 py-3">Total Butir</th>
                  <th className="px-4 py-3">HDP %</th>
                  <th className="px-4 py-3">Pakan (Kg)</th>
                  <th className="px-4 py-3">FCR</th>
                  <th className="px-4 py-3">Mati</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-medium">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-4 py-3 font-bold text-white">{log.tanggal}</td>
                    <td className="px-4 py-3 text-amber-400 font-bold">{log.telurUtuh}</td>
                    <td className="px-4 py-3 text-orange-400">{log.telurRetak}</td>
                    <td className="px-4 py-3 text-rose-400">{log.telurRusak}</td>
                    <td className="px-4 py-3 font-bold text-white">{log.telurUtuh + log.telurRetak + log.telurRusak}</td>
                    <td className="px-4 py-3 text-emerald-400 font-bold">{log.hdpPercentage}%</td>
                    <td className="px-4 py-3">{log.pakanKg} kg</td>
                    <td className="px-4 py-3 text-sky-400 font-bold">{log.fcr}</td>
                    <td className="px-4 py-3 text-rose-400">{log.bebekMati > 0 ? `${log.bebekMati} ekor` : '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: Stok Pakan & Nutrisi */}
      {activeTab === 'pakan' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Inventaris Pakan & Nutrisi Kandang</h3>
              <p className="text-xs text-slate-400">Kelola stok konsentrat, dedak, dan nutrisi harian peternakan.</p>
            </div>
            <button
              onClick={() => setShowPakanForm(!showPakanForm)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              {showPakanForm ? 'Tutup Form' : '+ Tambah Jenis Pakan'}
            </button>
          </div>

          {/* Form Tambah Pakan Baru */}
          {showPakanForm && (
            <form onSubmit={handleAddPakanSubmit} className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 space-y-3 text-xs">
              <h4 className="font-bold text-amber-400 text-sm">Form Tambah Jenis Pakan Baru</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nama Pakan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Konsentrat Layer K-99"
                    value={namaPakanBaru}
                    onChange={(e) => setNamaPakanBaru(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Merk / Produsen</label>
                  <input
                    type="text"
                    placeholder="Contoh: Cargill / Petani Lokal"
                    value={merkPakanBaru}
                    onChange={(e) => setMerkPakanBaru(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Stok Awal (Kg)</label>
                  <input
                    type="number"
                    min="0"
                    value={stokKgBaru}
                    onChange={(e) => setStokKgBaru(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Harga Per Kg (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={hargaPerKgBaru}
                    onChange={(e) => setHargaPerKgBaru(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Batas Minimum Peringatan (Kg)</label>
                  <input
                    type="number"
                    min="0"
                    value={minStokKgBaru}
                    onChange={(e) => setMinStokKgBaru(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPakanForm(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
                >
                  Simpan Pakan Baru
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pakanList.map((pakan) => (
              <div key={pakan.id} className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-amber-400 text-sm">{pakan.namaPakan}</h4>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">{pakan.merk}</span>
                </div>
                <p className="text-2xl font-black text-white">{pakan.stokKg} <span className="text-xs font-normal text-slate-400">kg tersisa</span></p>
                <p className="text-xs text-slate-400">Harga per kg: Rp {pakan.hargaPerKg.toLocaleString('id-ID')}</p>
                
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => handleRestockPakan(pakan.id, pakan.namaPakan)}
                    className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs hover:bg-emerald-500/30 transition-colors"
                  >
                    + Restock (Tambah Kg)
                  </button>
                  <button
                    onClick={() => handleDeletePakan(pakan.id)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                    title="Hapus Pakan Ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
