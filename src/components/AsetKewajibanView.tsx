import React, { useState } from 'react';
import { ShieldCheck, Trash2, PlusCircle, X, CheckCircle2, Building, Scale } from 'lucide-react';
import type { AsetTetap, HutangPiutang } from '../types';
import { formatIDR } from '../utils/exportUtils';
import { StorageService } from '../services/storage';

interface AsetKewajibanViewProps {
  asetList: AsetTetap[];
  hpList: HutangPiutang[];
  onRefreshData: () => void;
}

export const AsetKewajibanView: React.FC<AsetKewajibanViewProps> = ({
  asetList,
  hpList,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'aset' | 'hutang_piutang'>('aset');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State - Aset Tetap
  const [namaAset, setNamaAset] = useState('');
  const [kategoriAset, setKategoriAset] = useState<'KANDANG' | 'PERALATAN' | 'BIOLOGIS_BEBEK' | 'KENDARAAN' | 'LAINNYA'>('KANDANG');
  const [nilaiPerolehan, setNilaiPerolehan] = useState<number>(0);
  const [masaManfaatBulan, setMasaManfaatBulan] = useState<number>(60);
  const [tglPerolehan, setTglPerolehan] = useState<string>(new Date().toISOString().split('T')[0]);

  // Form State - Hutang & Piutang
  const [jenisHp, setJenisHp] = useState<'HUTANG' | 'PIUTANG'>('PIUTANG');
  const [namaKontak, setNamaKontak] = useState('');
  const [noHp, setNoHp] = useState('');
  const [deskripsiHp, setDeskripsiHp] = useState('');
  const [nominalTotalHp, setNominalTotalHp] = useState<number>(0);
  const [tglJatuhTempo, setTglJatuhTempo] = useState<string>(new Date().toISOString().split('T')[0]);

  // Total Valuasi Aset Tetap
  const totalPerolehan = asetList.reduce((acc, a) => acc + a.nilaiPerolehan, 0);
  const totalNilaiBuku = asetList.reduce((acc, a) => acc + a.nilaiBuku, 0);

  // Total Hutang & Piutang
  const totalPiutang = hpList
    .filter((hp) => hp.jenis === 'PIUTANG' && hp.status === 'BELUM_LUNAS')
    .reduce((acc, hp) => acc + hp.sisaNominal, 0);

  const totalHutang = hpList
    .filter((hp) => hp.jenis === 'HUTANG' && hp.status === 'BELUM_LUNAS')
    .reduce((acc, hp) => acc + hp.sisaNominal, 0);

  const handleAddAsetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaAset.trim() || nilaiPerolehan <= 0) {
      alert('Mohon isi nama aset dan nilai perolehan dengan benar!');
      return;
    }

    const masa = masaManfaatBulan > 0 ? masaManfaatBulan : 1;
    const penyusutanBulanan = Math.round(nilaiPerolehan / masa);

    StorageService.addAset({
      namaAset,
      kategori: kategoriAset,
      nilaiPerolehan,
      tglPerolehan,
      masaManfaatBulan: masa,
      penyusutanBulanan,
    });

    setSuccessMessage('Catatan Aset Tetap Berhasil Ditambahkan!');
    onRefreshData();

    // Reset Form
    setNamaAset('');
    setNilaiPerolehan(0);
    setShowAddForm(false);
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  const handleAddHpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaKontak.trim() || nominalTotalHp <= 0) {
      alert('Mohon isi nama kontak dan nominal transaksi dengan benar!');
      return;
    }

    StorageService.addHutangPiutang({
      jenis: jenisHp,
      namaKontak,
      noHp: noHp || undefined,
      deskripsi: deskripsiHp || `${jenisHp === 'PIUTANG' ? 'Tagihan' : 'Kewajiban'} ${namaKontak}`,
      nominalTotal: nominalTotalHp,
      tglJatuhTempo,
    });

    setSuccessMessage(`Catatan ${jenisHp === 'PIUTANG' ? 'Piutang' : 'Hutang'} Berhasil Ditambahkan!`);
    onRefreshData();

    // Reset Form
    setNamaKontak('');
    setNoHp('');
    setDeskripsiHp('');
    setNominalTotalHp(0);
    setShowAddForm(false);
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  const handleStatusChange = (id: string, newStatus: 'LUNAS' | 'BELUM_LUNAS') => {
    const updated = hpList.map((hp) =>
      hp.id === id ? { ...hp, status: newStatus, sisaNominal: newStatus === 'LUNAS' ? 0 : hp.nominalTotal } : hp
    );
    StorageService.saveHutangPiutang(updated);
    onRefreshData();
  };

  const handleDeleteAset = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus catatan aset ini?')) {
      StorageService.deleteAset(id);
      onRefreshData();
    }
  };

  const handleDeleteHP = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus catatan hutang/piutang ini?')) {
      StorageService.deleteHutangPiutang(id);
      onRefreshData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title & Tab Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-sky-400" />
            Modul Aset Perusahaan & Kewajiban (Hutang / Piutang)
          </h2>
          <p className="text-xs text-slate-400">
            Valuasi bangunan kandang, mesin/peralatan, populasi ternak, dan amortisasi penyusutan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('aset')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'aset' ? 'bg-sky-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Aset Perusahaan ({asetList.length})
            </button>
            <button
              onClick={() => setActiveTab('hutang_piutang')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'hutang_piutang'
                  ? 'bg-sky-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Hutang & Piutang ({hpList.length})
            </button>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-sky-500/20 active:scale-95 transition-all"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
            {showAddForm ? 'Tutup Form' : activeTab === 'aset' ? '+ Tambah Aset' : '+ Tambah Hutang/Piutang'}
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-bold text-sm flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          {successMessage}
        </div>
      )}

      {/* FORM INPUT: Tambah Aset Tetap */}
      {showAddForm && activeTab === 'aset' && (
        <form onSubmit={handleAddAsetSubmit} className="glass-panel p-6 rounded-2xl border border-sky-500/30 space-y-4 bg-slate-900/60">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-sky-400" />
              Formulir Tambah Aset Perusahaan Baru
            </h3>
            <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Nama Aset / Inventaris</label>
              <input
                type="text"
                placeholder="Contoh: Kandang Baja Ringan Unit B"
                value={namaAset}
                onChange={(e) => setNamaAset(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Kategori Aset</label>
              <select
                value={kategoriAset}
                onChange={(e) => setKategoriAset(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:ring-2 focus:ring-sky-500"
              >
                <option value="KANDANG">Kandang & Bangunan</option>
                <option value="PERALATAN">Mesin & Peralatan</option>
                <option value="BIOLOGIS_BEBEK">Aset Biologis (Populasi Bebek)</option>
                <option value="KENDARAAN">Kendaraan Operasional</option>
                <option value="LAINNYA">Lain-lain</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Tanggal Perolehan</label>
              <input
                type="date"
                value={tglPerolehan}
                onChange={(e) => setTglPerolehan(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Nilai Perolehan / Harga Beli (Rp)</label>
              <input
                type="number"
                min="0"
                placeholder="Contoh: 50000000"
                value={nilaiPerolehan || ''}
                onChange={(e) => setNilaiPerolehan(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm font-bold text-sky-400 focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Masa Manfaat (Bulan)</label>
              <input
                type="number"
                min="1"
                placeholder="Contoh: 60 (5 Tahun)"
                value={masaManfaatBulan || ''}
                onChange={(e) => setMasaManfaatBulan(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                required
              />
              {nilaiPerolehan > 0 && masaManfaatBulan > 0 && (
                <p className="text-[11px] text-amber-400 mt-1 font-semibold">
                  Estimasi Penyusutan Bulanan: {formatIDR(Math.round(nilaiPerolehan / masaManfaatBulan))} / bln
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-sky-500/20 active:scale-95 transition-all"
            >
              + Simpan Catatan Aset
            </button>
          </div>
        </form>
      )}

      {/* FORM INPUT: Tambah Hutang / Piutang */}
      {showAddForm && activeTab === 'hutang_piutang' && (
        <form onSubmit={handleAddHpSubmit} className="glass-panel p-6 rounded-2xl border border-sky-500/30 space-y-4 bg-slate-900/60">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-400" />
              Formulir Tambah Catatan Hutang / Piutang Baru
            </h3>
            <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Jenis Catatan</label>
              <select
                value={jenisHp}
                onChange={(e) => setJenisHp(e.target.value as 'HUTANG' | 'PIUTANG')}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:ring-2 focus:ring-sky-500 font-bold"
              >
                <option value="PIUTANG">PIUTANG (Tagihan ke Pengepul / Pembeli)</option>
                <option value="HUTANG">HUTANG (Kewajiban ke Supplier / Bank)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Nama Pihak / Kontak</label>
              <input
                type="text"
                placeholder="Contoh: Pak Haji Rohman (Pengepul)"
                value={namaKontak}
                onChange={(e) => setNamaKontak(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">No WhatsApp / HP (Opsional)</label>
              <input
                type="text"
                placeholder="Contoh: 0812-3456-7890"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">Deskripsi / Keterangan Tagihan</label>
              <input
                type="text"
                placeholder="Contoh: Penjualan 10 tray telur grade A jatuh tempo minggu depan"
                value={deskripsiHp}
                onChange={(e) => setDeskripsiHp(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Nominal Total (Rp)</label>
              <input
                type="number"
                min="0"
                placeholder="Contoh: 3500000"
                value={nominalTotalHp || ''}
                onChange={(e) => setNominalTotalHp(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm font-bold text-amber-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Tanggal Jatuh Tempo</label>
            <input
              type="date"
              value={tglJatuhTempo}
              onChange={(e) => setTglJatuhTempo(e.target.value)}
              className="w-full sm:w-64 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              + Simpan Catatan {jenisHp === 'PIUTANG' ? 'Piutang' : 'Hutang'}
            </button>
          </div>
        </form>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <p className="text-xs text-slate-400 font-semibold">Total Nilai Buku Aset Tetap</p>
          <p className="text-2xl font-black text-sky-400 mt-1">{formatIDR(totalNilaiBuku)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Perolehan: {formatIDR(totalPerolehan)}</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <p className="text-xs text-slate-400 font-semibold">Total Piutang Usaha (Tagihan)</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{formatIDR(totalPiutang)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Belum dilunasi pengepul</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <p className="text-xs text-slate-400 font-semibold">Total Hutang Usaha (Kewajiban)</p>
          <p className="text-2xl font-black text-rose-400 mt-1">{formatIDR(totalHutang)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Kewajiban pakan & supplier</p>
        </div>
      </div>

      {/* TAB 1: Tabel Aset Tetap */}
      {activeTab === 'aset' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Daftar Aset Perusahaan & Amortisasi Biologis</h3>
            <button
              onClick={() => setShowAddForm(true)}
              className="text-xs text-sky-400 hover:underline font-bold flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" /> + Tambah Aset
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Nama Aset</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Nilai Perolehan</th>
                  <th className="px-4 py-3">Akumulasi Penyusutan</th>
                  <th className="px-4 py-3 font-bold text-sky-400">Nilai Buku Saat Ini</th>
                  <th className="px-4 py-3">Penyusutan / Bln</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-medium">
                {asetList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      Belum ada aset terdaftar. Klik <strong>"+ Tambah Aset"</strong> untuk memasukkan data aset peternakan Anda.
                    </td>
                  </tr>
                ) : (
                  asetList.map((aset) => (
                    <tr key={aset.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-white">{aset.namaAset}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                          {aset.kategori}
                        </span>
                      </td>
                      <td className="px-4 py-3">{formatIDR(aset.nilaiPerolehan)}</td>
                      <td className="px-4 py-3 text-rose-400">{formatIDR(aset.akumulasiPenyusutan)}</td>
                      <td className="px-4 py-3 font-black text-sky-400">{formatIDR(aset.nilaiBuku)}</td>
                      <td className="px-4 py-3 text-amber-400">{formatIDR(aset.penyusutanBulanan)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteAset(aset.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                          title="Hapus Aset Ini"
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

      {/* TAB 2: Tabel Hutang & Piutang */}
      {activeTab === 'hutang_piutang' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Monitoring Hutang & Piutang Jatuh Tempo</h3>
            <button
              onClick={() => setShowAddForm(true)}
              className="text-xs text-emerald-400 hover:underline font-bold flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" /> + Tambah Catatan
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Jenis</th>
                  <th className="px-4 py-3">Kontak / Nama Pihak</th>
                  <th className="px-4 py-3">Keterangan</th>
                  <th className="px-4 py-3">Nominal Total</th>
                  <th className="px-4 py-3 font-bold text-white">Sisa Nominal</th>
                  <th className="px-4 py-3">Jatuh Tempo</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-medium">
                {hpList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      Belum ada catatan hutang/piutang. Klik <strong>"+ Tambah Hutang/Piutang"</strong> untuk memasukkan data baru.
                    </td>
                  </tr>
                ) : (
                  hpList.map((hp) => {
                    const isPiutang = hp.jenis === 'PIUTANG';
                    const isLunas = hp.status === 'LUNAS';
                    return (
                      <tr key={hp.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isPiutang ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                            }`}
                          >
                            {hp.jenis}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-white">{hp.namaKontak}</td>
                        <td className="px-4 py-3 text-slate-300">{hp.deskripsi}</td>
                        <td className="px-4 py-3">{formatIDR(hp.nominalTotal)}</td>
                        <td className="px-4 py-3 font-black text-amber-400">{formatIDR(hp.sisaNominal)}</td>
                        <td className="px-4 py-3 text-slate-400">{hp.tglJatuhTempo}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isLunas ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {hp.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                          {!isLunas ? (
                            <button
                              onClick={() => handleStatusChange(hp.id, 'LUNAS')}
                              className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-bold text-[11px] hover:bg-emerald-400"
                            >
                              Tandai Lunas
                            </button>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Selesai</span>
                          )}

                          <button
                            onClick={() => handleDeleteHP(hp.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                            title="Hapus Catatan Ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
