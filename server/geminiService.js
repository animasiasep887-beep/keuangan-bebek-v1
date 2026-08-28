import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6KoRMxISktWzIUFCoJ64d9tq5BPNjXg_Prn5VP8yn8oAw';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

const FALLBACK_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite'];

export const GeminiService = {
  async generateContent(prompt, systemInstruction = '', modelIndex = 0) {
    const activeModel = FALLBACK_MODELS[modelIndex] || GEMINI_MODEL;
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${GEMINI_API_KEY}`;
      
      const payload = {
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ]
      };

      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }]
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[GEMINI] API Error with model ${activeModel}:`, response.status, errText);
        if (modelIndex + 1 < FALLBACK_MODELS.length) {
          console.log(`[GEMINI] Mencoba fallback model: ${FALLBACK_MODELS[modelIndex + 1]}`);
          return await GeminiService.generateContent(prompt, systemInstruction, modelIndex + 1);
        }
        throw new Error(`Gemini API Error (${response.status}): ${response.statusText}`);
      }

      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, tidak ada respon dari AI.';
      return textResponse;
    } catch (error) {
      console.error('[GEMINI] Error in generateContent:', error);
      if (modelIndex + 1 < FALLBACK_MODELS.length) {
        return await GeminiService.generateContent(prompt, systemInstruction, modelIndex + 1);
      }
      throw error;
    }
  },

  async fallbackGenerateContent(prompt, systemInstruction, fallbackModel) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${fallbackModel}:generateContent?key=${GEMINI_API_KEY}`;
      const payload = {
        contents: [{ parts: [{ text: prompt }] }]
      };
      if (systemInstruction) {
        payload.systemInstruction = { parts: [{ text: systemInstruction }] };
      }
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, tidak ada respon dari AI.';
    } catch (e) {
      console.error('[GEMINI] Fallback error:', e);
      return 'Maaf, saat ini AI sedang mengalami kendala jaringan.';
    }
  },

  buildSystemContext(farmData) {
    const { metrics, kandang, populasi, pakan, pencatatan_harian, transaksi_keuangan } = farmData;
    const recentLogs = (pencatatan_harian || []).slice(0, 5);
    const recentTrxs = (transaksi_keuangan || []).slice(0, 5);

    return `Anda adalah "Asisten AI Ahli Peternakan Bebek Petelur & Akuntan Farm" untuk sistem BebekJaya PRO.
Karakter Anda: Sangat ramah, profesional, praktis, menguasai ilmu nutrisi unggas, manajemen kandang bebek petelur, diagnosa penyakit bebek, pencegahan telur drop (HDP turun), efisiensi pakan (FCR), dan keuangan peternakan.

Data Peternakan Saat Ini (Real-Time):
- Total Populasi Bebek Hidup: ${metrics?.totalPopulasiHidup || 0} ekor
- HDP Hari Ini / Terakhir: ${metrics?.hdpHariIni || 0}%
- Total Telur Panen Terakhir: ${metrics?.totalTelurHariIni || 0} butir
- Rata-rata FCR: ${metrics?.fcrAverage || 0}
- Konsumsi Pakan Terakhir: ${metrics?.totalPakanKgHariIni || 0} kg
- Saldo Kas Aktif: Rp ${(metrics?.saldoKas || 0).toLocaleString('id-ID')}
- Estimasi Laba/Rugi: Rp ${(metrics?.labaRugiMtd || 0).toLocaleString('id-ID')}
- Total Piutang: Rp ${(metrics?.totalPiutang || 0).toLocaleString('id-ID')}
- Total Hutang: Rp ${(metrics?.totalHutang || 0).toLocaleString('id-ID')}
- Stok Pakan Tersedia: ${(pakan || []).map(p => `${p.namaPakan} (${p.stokKg} kg)`).join(', ') || 'Belum ada data'}
- Jumlah Kandang Aktif: ${(kandang || []).length} unit
- Riwayat 5 Panen Terakhir: ${JSON.stringify(recentLogs)}
- Riwayat 5 Transaksi Terakhir: ${JSON.stringify(recentTrxs)}

Instruksi:
1. Berikan analisa atau jawaban yang to-the-point, jelas, actionable (bisa langsung dipraktikkan peternak di kandang), dan berbasis data di atas.
2. Gunakan Bahasa Indonesia yang sopan, santun, dan mudah dimengerti peternak lokal.
3. Gunakan format markdown yang rapi (poin-poin, tebal/bold, emoji relevan).`;
  },

  async askFarmConsultant(userQuestion, farmData) {
    const systemContext = this.buildSystemContext(farmData);
    return await this.generateContent(userQuestion, systemContext);
  },

  async parseNaturalLanguageInput(userInput, farmData) {
    const systemContext = `Anda adalah parser input data peternakan bebek petelur.
Tugas Anda adalah membaca pesan peternak, lalu menentukan apakah pesan tersebut merupakan:
1. "PANEN": Pencatatan panen telur & pakan
2. "TRANSAKSI": Pencatatan keuangan (pemasukan/pengeluaran)
3. "PERTANYAAN": Pertanyaan konsultasi/umum

Keluarkan HANYA JSON murni tanpa backtick markdown (\`\`\`json) dengan format berikut:
Jika PANEN:
{
  "type": "PANEN",
  "data": {
    "telurUtuh": 400,
    "telurRetak": 5,
    "telurRusak": 0,
    "pakanKg": 50,
    "bebekMati": 0,
    "bebekAfkir": 0,
    "catatan": "Keterangan opsional"
  },
  "explanation": "Ringkasan data panen yang terdeteksi"
}

Jika TRANSAKSI:
{
  "type": "TRANSAKSI",
  "data": {
    "tipeTransaksi": "PENDAPATAN" atau "PENGELUARAN",
    "totalNominal": 500000,
    "deskripsi": "Penjualan telur 200 butir / Beli pakan 2 karung",
    "kategori": "TELUR_GRADE_A" atau "PAKAN" atau "OBAT_VAKSIN" atau "OPERASIONAL_KANDANG" dll
  },
  "explanation": "Ringkasan transaksi yang terdeteksi"
}

Jika PERTANYAAN:
{
  "type": "PERTANYAAN",
  "answer": "Jawaban langsung dan solutif untuk pertanyaan peternak berdasarkan ilmu bebek petelur."
}`;

    const prompt = `Pesan peternak: "${userInput}"`;
    try {
      const rawText = await this.generateContent(prompt, systemContext);
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      console.warn('[GEMINI] AI parsing failed, using smart local parser fallback:', e.message);
      
      // Smart Local Fallback Parser (Zero dependency)
      const lower = userInput.toLowerCase();

      // Check for egg harvest pattern (e.g. "bertelur 91", "panen 91", "91 telur")
      const harvestMatch = lower.match(/(?:bertelur|panen|dapat|telur)\s*(\d+)/i) || lower.match(/(\d+)\s*(?:butir|telur)/i);
      if (harvestMatch && (lower.includes('telur') || lower.includes('panen') || lower.includes('bertelur'))) {
        const telurCount = parseInt(harvestMatch[1], 10) || 0;
        const pakanMatch = lower.match(/pakan\s*(\d+)/i);
        const matiMatch = lower.match(/mati\s*(\d+)/i);

        return {
          type: 'PANEN',
          data: {
            telurUtuh: telurCount,
            telurRetak: 0,
            telurRusak: 0,
            pakanKg: pakanMatch ? parseInt(pakanMatch[1], 10) : 0,
            bebekMati: matiMatch ? parseInt(matiMatch[1], 10) : 0,
            bebekAfkir: 0,
            catatan: `Input otomatis via chat: "${userInput}"`
          },
          explanation: `Terdeteksi panen ${telurCount} butir telur.`
        };
      }

      // Check for sales/income pattern (e.g. "jual 10 telur 15k", "jual telur 50000")
      if (lower.includes('jual') || lower.includes('masuk') || lower.includes('laku') || lower.includes('dapat uang')) {
        let nominal = 0;
        const kMatch = lower.match(/(\d+)\s*k\b/i);
        const rbMatch = lower.match(/(\d+)\s*rb\b/i) || lower.match(/(\d+)\s*ribu\b/i);
        const numberMatch = lower.match(/(?:rp|sebesar|harga)?\s*(\d{4,})/i);

        if (kMatch) nominal = parseInt(kMatch[1], 10) * 1000;
        else if (rbMatch) nominal = parseInt(rbMatch[1], 10) * 1000;
        else if (numberMatch) nominal = parseInt(numberMatch[1], 10);

        return {
          type: 'TRANSAKSI',
          data: {
            tipeTransaksi: 'PENDAPATAN',
            totalNominal: nominal || 50000,
            deskripsi: userInput,
            kategori: 'TELUR_GRADE_A'
          },
          explanation: `Terdeteksi pemasukan penjualan ${nominal ? 'Rp ' + nominal.toLocaleString('id-ID') : ''}.`
        };
      }

      // Check for expense pattern (e.g. "beli pakan 50k", "keluar uang 100000")
      if (lower.includes('beli') || lower.includes('keluar') || lower.includes('bayar') || lower.includes('biaya')) {
        let nominal = 0;
        const kMatch = lower.match(/(\d+)\s*k\b/i);
        const rbMatch = lower.match(/(\d+)\s*rb\b/i) || lower.match(/(\d+)\s*ribu\b/i);
        const numberMatch = lower.match(/(?:rp|sebesar|harga)?\s*(\d{4,})/i);

        if (kMatch) nominal = parseInt(kMatch[1], 10) * 1000;
        else if (rbMatch) nominal = parseInt(rbMatch[1], 10) * 1000;
        else if (numberMatch) nominal = parseInt(numberMatch[1], 10);

        return {
          type: 'TRANSAKSI',
          data: {
            tipeTransaksi: 'PENGELUARAN',
            totalNominal: nominal || 50000,
            deskripsi: userInput,
            kategori: lower.includes('pakan') ? 'PAKAN' : 'OPERASIONAL_KANDANG'
          },
          explanation: `Terdeteksi pengeluaran biaya ${nominal ? 'Rp ' + nominal.toLocaleString('id-ID') : ''}.`
        };
      }

      return {
        type: 'PERTANYAAN',
        answer: 'Terima kasih atas pesannya! Untuk mencatat panen silakan gunakan contoh: "/panen 430 10 2 50 1" atau ketik "panen 430 telur".'
      };
    }
  },

  async getAutomatedAnalysis(farmData) {
    const prompt = `Berikan analisis singkat dan tajam (3-4 paragraf) mengenai performa peternakan bebek petelur saat ini berdasarkan metrik yang ada. Soroti:
1. Evaluasi Hen-Day Production (HDP %) & Kesehatan Populasi
2. Efisiensi Biaya Pakan (FCR)
3. Kesehatan Arus Kas & Saldo
4. 2 Rekomendasi Tindakan Segera untuk peternak hari ini.`;
    return await this.askFarmConsultant(prompt, farmData);
  }
};
