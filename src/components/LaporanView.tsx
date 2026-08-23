import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Layers,
  FileText,
  BookOpen,
} from 'lucide-react';
import type { TransaksiKeuangan, AsetTetap, HutangPiutang } from '../types';
import { formatIDR, ExportService } from '../utils/exportUtils';

interface LaporanViewProps {
  transactions: TransaksiKeuangan[];
  asetList: AsetTetap[];
  hpList: HutangPiutang[];
}

export const LaporanView: React.FC<LaporanViewProps> = ({
  transactions,
  asetList,
  hpList,
}) => {
  const [reportType, setReportType] = useState<'laba_rugi' | 'neraca' | 'buku_besar'>('laba_rugi');
  const [startDate, setStartDate] = useState<string>('2026-08-01');
  const [endDate, setEndDate] = useState<string>('2026-08-31');

  // Filter transactions by date range
  const filteredTrxs = transactions.filter((t) => t.tanggal >= startDate && t.tanggal <= endDate);

  // Group Revenues
  const revenueTrxs = filteredTrxs.filter((t) => t.tipeTransaksi === 'PENDAPATAN');
  const totalRevenue = revenueTrxs.reduce((acc, t) => acc + t.totalNominal, 0);

  // Breakdown Revenue Categories
  const revenueTelurGradeA = revenueTrxs
    .filter((t) => t.kategoriPendapatan === 'TELUR_GRADE_A' || !t.kategoriPendapatan)
    .reduce((acc, t) => acc + t.totalNominal, 0);

  const revenueTelurGradeB = revenueTrxs
    .filter((t) => t.kategoriPendapatan === 'TELUR_GRADE_B')
    .reduce((acc, t) => acc + t.totalNominal, 0);

  const revenueBebekAfkir = revenueTrxs
    .filter((t) => t.kategoriPendapatan === 'BEBEK_AFKIR')
    .reduce((acc, t) => acc + t.totalNominal, 0);

  const revenuePupuk = revenueTrxs
    .filter((t) => t.kategoriPendapatan === 'PUPUK_KANDANG')
    .reduce((acc, t) => acc + t.totalNominal, 0);

  // Group Expenses
  const expenseTrxs = filteredTrxs.filter((t) => t.tipeTransaksi === 'PENGELUARAN');
  const totalExpense = expenseTrxs.reduce((acc, t) => acc + t.totalNominal, 0);

  const expensePakan = expenseTrxs
    .filter((t) => t.kategoriPengeluaran === 'PAKAN' || !t.kategoriPengeluaran)
    .reduce((acc, t) => acc + t.totalNominal, 0);

  const expenseObat = expenseTrxs
    .filter((t) => t.kategoriPengeluaran === 'OBAT_VAKSIN')
    .reduce((acc, t) => acc + t.totalNominal, 0);

  const expenseGaji = expenseTrxs
    .filter((t) => t.kategoriPengeluaran === 'GAJI')
    .reduce((acc, t) => acc + t.totalNominal, 0);

  const expensePenyusutan = asetList.reduce((acc, a) => acc + (a.penyusutanBulanan || 0), 0);
  const netProfit = totalRevenue - (totalExpense + expensePenyusutan);

  // Balance Sheet Calculations
  const totalKasBank = totalRevenue - totalExpense;
  const totalPiutang = hpList
    .filter((hp) => hp.jenis === 'PIUTANG' && hp.status === 'BELUM_LUNAS')
    .reduce((acc, hp) => acc + hp.sisaNominal, 0);

  const totalNilaiKandangPeralatan = asetList
    .filter((a) => a.kategori !== 'BIOLOGIS_BEBEK')
    .reduce((acc, a) => acc + a.nilaiBuku, 0);

  const totalNilaiBiologis = asetList
    .filter((a) => a.kategori === 'BIOLOGIS_BEBEK')
    .reduce((acc, a) => acc + a.nilaiBuku, 0);

  const totalNilaiAsetTetap = totalNilaiKandangPeralatan + totalNilaiBiologis;
  const totalAset = totalKasBank + totalPiutang + totalNilaiAsetTetap;

  const totalHutang = hpList
    .filter((hp) => hp.jenis === 'HUTANG' && hp.status === 'BELUM_LUNAS')
    .reduce((acc, hp) => acc + hp.sisaNominal, 0);

  const totalModal = totalAset - totalHutang;

  const handleExportPDF = () => {
    const revenueItems = [
      { nama: 'Pendapatan Penjualan Telur Grade A (Utuh)', total: revenueTelurGradeA },
      { nama: 'Pendapatan Penjualan Telur Grade B (Retak)', total: revenueTelurGradeB },
      { nama: 'Pendapatan Penjualan Bebek Afkir', total: revenueBebekAfkir },
      { nama: 'Pendapatan Penjualan Pupuk Kandang (Kohe)', total: revenuePupuk },
    ].filter((i) => i.total > 0);

    const expenseItems = [
      { nama: 'Beban Pakan Bebek Harian', total: expensePakan },
      { nama: 'Beban Obat, Vaksin & Vitamin', total: expenseObat },
      { nama: 'Beban Gaji Anak Kandang & Pengelola', total: expenseGaji },
      { nama: 'Beban Penyusutan Aset & Populasi Bebek', total: expensePenyusutan },
    ];

    ExportService.exportLabaRugiPDF(
      startDate,
      endDate,
      revenueItems,
      expenseItems,
      totalRevenue,
      totalExpense + expensePenyusutan,
      netProfit
    );
  };

  const handleExportExcel = () => {
    ExportService.exportLaporanLengkapExcel(transactions, [], asetList, hpList);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-amber-400" />
            Modul Generator Laporan Keuangan Otomatis
          </h2>
          <p className="text-xs text-slate-400">
            Generate Laporan Laba/Rugi, Neraca Keuangan, dan Buku Besar berformat standar akuntansi.
          </p>
        </div>

        {/* Export Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            Cetak PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Date Filter Bar & Report Selector */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Report Type Selector */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setReportType('laba_rugi')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              reportType === 'laba_rugi'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Laporan Laba / Rugi
          </button>
          <button
            onClick={() => setReportType('neraca')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              reportType === 'neraca'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Neraca Keuangan
          </button>
          <button
            onClick={() => setReportType('buku_besar')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              reportType === 'buku_besar'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Buku Besar
          </button>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
          />
          <span className="text-xs text-slate-400">s/d</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
          />
        </div>
      </div>

      {/* REPORT 1: Laporan Laba Rugi */}
      {reportType === 'laba_rugi' && (
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
          <div className="text-center border-b border-slate-800 pb-4">
            <h3 className="text-xl font-black text-amber-400 uppercase tracking-wide">
              PETERNAKAN BEBEK PETELUR "BEBEKJAYA ABADI"
            </h3>
            <h4 className="text-lg font-bold text-white mt-1">LAPORAN LABA RUGI (INCOME STATEMENT)</h4>
            <p className="text-xs text-slate-400 mt-1">Periode: {startDate} s/d {endDate}</p>
          </div>

          {/* 1. Pendapatan Section */}
          <div className="space-y-2">
            <h5 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider border-b border-emerald-500/20 pb-1">
              1. PENDAPATAN OPERASIONAL
            </h5>
            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span>Pendapatan Penjualan Telur Grade A (Utuh)</span>
                <span className="font-bold text-white">{formatIDR(revenueTelurGradeA)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span>Pendapatan Penjualan Telur Grade B (Retak)</span>
                <span className="font-bold text-white">{formatIDR(revenueTelurGradeB)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span>Pendapatan Penjualan Bebek Afkir</span>
                <span className="font-bold text-white">{formatIDR(revenueBebekAfkir)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span>Pendapatan Penjualan Pupuk Kandang (Kohe)</span>
                <span className="font-bold text-white">{formatIDR(revenuePupuk)}</span>
              </div>
              <div className="flex justify-between py-2 font-black text-emerald-400 text-sm bg-emerald-950/20 px-3 rounded-lg">
                <span>TOTAL PENDAPATAN</span>
                <span>{formatIDR(totalRevenue)}</span>
              </div>
            </div>
          </div>

          {/* 2. Pengeluaran Section */}
          <div className="space-y-2">
            <h5 className="text-xs font-extrabold text-rose-400 uppercase tracking-wider border-b border-rose-500/20 pb-1">
              2. BEBAN & PENGELUARAN OPERASIONAL
            </h5>
            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span>Beban Pakan Bebek Harian</span>
                <span className="font-bold text-white">{formatIDR(expensePakan)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span>Beban Obat, Vaksin & Vitamin</span>
                <span className="font-bold text-white">{formatIDR(expenseObat)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span>Beban Gaji Anak Kandang & Pengelola</span>
                <span className="font-bold text-white">{formatIDR(expenseGaji)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span>Beban Penyusutan Aset & Populasi Bebek</span>
                <span className="font-bold text-white">{formatIDR(expensePenyusutan)}</span>
              </div>
              <div className="flex justify-between py-2 font-black text-rose-400 text-sm bg-rose-950/20 px-3 rounded-lg">
                <span>TOTAL BEBAN OPERASIONAL</span>
                <span>{formatIDR(totalExpense + expensePenyusutan)}</span>
              </div>
            </div>
          </div>

          {/* Net Profit Banner */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between font-black text-lg ${
              netProfit >= 0
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-400'
            }`}
          >
            <span>LABA BERSIH PERIODE INI</span>
            <span>{formatIDR(netProfit)}</span>
          </div>
        </div>
      )}

      {/* REPORT 2: Neraca Keuangan */}
      {reportType === 'neraca' && (
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
          <div className="text-center border-b border-slate-800 pb-4">
            <h3 className="text-xl font-black text-amber-400 uppercase tracking-wide">
              PETERNAKAN BEBEK PETELUR "BEBEKJAYA ABADI"
            </h3>
            <h4 className="text-lg font-bold text-white mt-1">NERACA KEUANGAN (BALANCE SHEET)</h4>
            <p className="text-xs text-slate-400 mt-1">Per Tanggal: {endDate}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* AKTIVA (ASET) */}
            <div className="space-y-4">
              <h5 className="text-sm font-extrabold text-sky-400 uppercase tracking-wider border-b border-sky-500/20 pb-1">
                AKTIVA (ASET)
              </h5>

              <div className="space-y-2">
                <p className="font-bold text-slate-200">Aset Lancar:</p>
                <div className="flex justify-between py-1 border-b border-slate-800/40">
                  <span>Kas Utama & Bank Operational</span>
                  <span className="font-bold text-white">{formatIDR(totalKasBank)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/40">
                  <span>Piutang Pengepul Telur</span>
                  <span className="font-bold text-white">{formatIDR(totalPiutang)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-200">Aset Tetap (Nilai Buku):</p>
                <div className="flex justify-between py-1 border-b border-slate-800/40">
                  <span>Bangunan Kandang & Peralatan</span>
                  <span className="font-bold text-white">{formatIDR(totalNilaiKandangPeralatan)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/40">
                  <span>Aset Biologis (Populasi Bebek)</span>
                  <span className="font-bold text-white">{formatIDR(totalNilaiBiologis)}</span>
                </div>
              </div>

              <div className="flex justify-between py-2 font-black text-sky-400 text-sm bg-sky-950/30 px-3 rounded-lg">
                <span>TOTAL AKTIVA (ASET)</span>
                <span>{formatIDR(totalAset)}</span>
              </div>
            </div>

            {/* PASIVA (KEWAJIBAN & MODAL) */}
            <div className="space-y-4">
              <h5 className="text-sm font-extrabold text-amber-400 uppercase tracking-wider border-b border-amber-500/20 pb-1">
                PASIVA (KEWAJIBAN & MODAL)
              </h5>

              <div className="space-y-2">
                <p className="font-bold text-slate-200">Kewajiban (Hutang):</p>
                <div className="flex justify-between py-1 border-b border-slate-800/40">
                  <span>Hutang Dagang Supplier Pakan</span>
                  <span className="font-bold text-white">{formatIDR(totalHutang)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-200">Ekuitas (Modal):</p>
                <div className="flex justify-between py-1 border-b border-slate-800/40">
                  <span>Modal Disetor Pemilik</span>
                  <span className="font-bold text-white">{formatIDR(totalModal - netProfit)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/40">
                  <span>Laba Ditahan & Berjalan</span>
                  <span className="font-bold text-white">{formatIDR(netProfit)}</span>
                </div>
              </div>

              <div className="flex justify-between py-2 font-black text-amber-400 text-sm bg-amber-950/30 px-3 rounded-lg">
                <span>TOTAL PASIVA (KEWAJIBAN + MODAL)</span>
                <span>{formatIDR(totalHutang + totalModal)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 3: Buku Besar */}
      {reportType === 'buku_besar' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white">Buku Besar Transaksi (General Ledger)</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">No Ref</th>
                  <th className="px-4 py-3">Keterangan</th>
                  <th className="px-4 py-3 text-right">Debit</th>
                  <th className="px-4 py-3 text-right">Kredit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-medium">
                {filteredTrxs.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-4 py-3 font-bold text-white">{t.tanggal}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{t.noRef}</td>
                    <td className="px-4 py-3 text-slate-200">{t.deskripsi}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-400">
                      {t.tipeTransaksi === 'PENDAPATAN' ? formatIDR(t.totalNominal) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-rose-400">
                      {t.tipeTransaksi === 'PENGELUARAN' ? formatIDR(t.totalNominal) : '-'}
                    </td>
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
