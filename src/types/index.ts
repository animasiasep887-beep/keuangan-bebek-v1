export type TipeAkun = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
export type SaldoNormal = 'DEBIT' | 'KREDIT';
export type StatusKandang = 'AKTIF' | 'ISTIRAHAT' | 'PERAWATAN';
export type StatusPopulasi = 'PRODUKTIF' | 'AFKIR' | 'PEMBESARAN';
export type JenisHutangPiutang = 'HUTANG' | 'PIUTANG';
export type StatusHutangPiutang = 'LUNAS' | 'BELUM_LUNAS';

export interface Kandang {
  id: string;
  namaKandang: string;
  kapasitas: number;
  status: StatusKandang;
  catatan?: string;
}

export interface PopulasiBebek {
  id: string;
  kandangId: string;
  kodeBatch: string;
  tglMasuk: string;
  jumlahAwal: number;
  jumlahSaatIni: number;
  hargaBeliPerEkor: number;
  umurMinggu: number;
  status: StatusPopulasi;
}

export interface PakanItem {
  id: string;
  namaPakan: string;
  merk: string;
  stokKg: number;
  hargaPerKg: number;
  minStokKg: number;
}

export interface PencatatanHarian {
  id: string;
  tanggal: string; // YYYY-MM-DD
  kandangId: string;
  populasiId: string;
  telurUtuh: number; // Grade A
  telurRetak: number; // Grade B
  telurRusak: number;
  totalBeratTelurKg: number;
  bebekMati: number;
  bebekAfkir: number;
  pakanKg: number;
  pakanId: string;
  hdpPercentage: number; // Calculated Hen-Day Production %
  fcr: number; // Feed Conversion Ratio
  catatan?: string;
  createdBy: string;
}

export interface KodeAkun {
  id: string;
  kode: string; // e.g. "101", "401"
  nama: string;
  tipe: TipeAkun;
  saldoNormal: SaldoNormal;
}

export interface JurnalItem {
  akunId: string;
  debit: number;
  kredit: number;
}

export interface TransaksiKeuangan {
  id: string;
  tanggal: string; // YYYY-MM-DD
  noRef: string;
  deskripsi: string;
  totalNominal: number;
  tipeTransaksi: 'PENDAPATAN' | 'PENGELUARAN' | 'JURNAL_UMUM';
  kategoriPendapatan?: 'TELUR_GRADE_A' | 'TELUR_GRADE_B' | 'BEBEK_AFKIR' | 'PUPUK_KANDANG' | 'LAINNYA';
  kategoriPengeluaran?: 'PAKAN' | 'OBAT_VAKSIN' | 'GAJI' | 'OPERASIONAL_KANDANG' | 'LISTRIK_AIR' | 'LAINNYA';
  pencatatanHarianId?: string;
  items: JurnalItem[];
  createdBy: string;
}

export interface AsetTetap {
  id: string;
  namaAset: string;
  kategori: 'KANDANG' | 'PERALATAN' | 'BIOLOGIS_BEBEK' | 'KENDARAAN' | 'LAINNYA';
  nilaiPerolehan: number;
  akumulasiPenyusutan: number;
  nilaiBuku: number;
  tglPerolehan: string;
  masaManfaatBulan: number;
  penyusutanBulanan: number;
}

export interface HutangPiutang {
  id: string;
  jenis: JenisHutangPiutang;
  namaKontak: string;
  noHp?: string;
  deskripsi: string;
  nominalTotal: number;
  sisaNominal: number;
  tglJatuhTempo: string;
  status: StatusHutangPiutang;
}

export interface FarmMetricsSummary {
  saldoKas: number;
  labaRugiMtd: number;
  hdpHariIni: number;
  totalPopulasiHidup: number;
  totalTelurHariIni: number;
  totalPakanKgHariIni: number;
  fcrAverage: number;
  totalPiutang: number;
  totalHutang: number;
}
