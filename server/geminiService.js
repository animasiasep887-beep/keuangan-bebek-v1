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
    const lower = userInput.toLowerCase();

    // 1. Fast Smart Local Parser for Panen (e.g. "sekarang saya panen 90 butir dan total pakan 9kg")
    const isPanenContext = lower.includes('panen') || lower.includes('telur') || lower.includes('bertelur') || lower.includes('butir');
    if (isPanenContext && !lower.includes('jual') && !lower.includes('beli')) {
      // Extract Telur Utuh
      let telurUtuh = 0;
      const panenNumMatch = lower.match(/(?:panen|bertelur|dapat|total|ada)?\s*(\d+)\s*(?:butir|telur|biji)?/i);
      const specificTelurMatch = lower.match(/(\d+)\s*(?:butir|telur|biji)/i) || lower.match(/(?:panen|bertelur)\s*(\d+)/i);
      
      if (specificTelurMatch) {
        telurUtuh = parseInt(specificTelurMatch[1], 10);
      } else if (panenNumMatch) {
        telurUtuh = parseInt(panenNumMatch[1], 10);
      }

      // Extract Telur Retak
      let telurRetak = 0;
      const retakMatch = lower.match(/(?:retak|pecah|grade b|b)\s*(\d+)/i) || lower.match(/(\d+)\s*(?:butir\s*)?(?:retak|pecah)/i);
      if (retakMatch) telurRetak = parseInt(retakMatch[1], 10);

      // Extract Pakan (e.g. "pakan 9kg", "total pakan 9 kg", "9kg pakan")
      let pakanKg = 0;
      const pakanMatch = lower.match(/(?:pakan|konsentrat|dedak)\s*(?:total\s*)?(\d+(?:[.,]\d+)?)\s*(?:kg|kilo|karung)?/i) || lower.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|kilo)\s*(?:pakan)?/i);
      if (pakanMatch) {
        pakanKg = parseFloat(pakanMatch[1].replace(',', '.'));
      }

      // Extract Bebek Mati
      let bebekMati = 0;
      const matiMatch = lower.match(/(?:mati|kematian)\s*(\d+)/i) || lower.match(/(\d+)\s*(?:ekor\s*)?mati/i);
      if (matiMatch) bebekMati = parseInt(matiMatch[1], 10);

      if (telurUtuh > 0 || pakanKg > 0) {
        return {
          type: 'PANEN',
          data: {
            telurUtuh: telurUtuh || 0,
            telurRetak: telurRetak || 0,
            telurRusak: 0,
            pakanKg: pakanKg || 0,
            bebekMati: bebekMati || 0,
            bebekAfkir: 0,
            catatan: `Input teks bebas: "${userInput}"`
          },
          explanation: `Otomatis tercatat panen ${telurUtuh} butir telur${pakanKg > 0 ? ` dan ${pakanKg} kg pakan` : ''}${bebekMati > 0 ? `, ${bebekMati} ekor mati` : ''}.`
        };
      }
    }

    // 2. Fast Smart Local Parser for Transaksi Pemasukan (e.g. "jual 10 telur 15k", "jual telur laku 150000")
    if (lower.includes('jual') || lower.includes('laku') || lower.includes('pemasukan') || lower.includes('masuk kas')) {
      let nominal = 0;
      const kMatch = lower.match(/(\d+)\s*k\b/i);
      const rbMatch = lower.match(/(\d+)\s*rb\b/i) || lower.match(/(\d+)\s*ribu\b/i);
      const jtMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*jt\b/i) || lower.match(/(\d+(?:[.,]\d+)?)\s*juta\b/i);
      const numberMatch = lower.match(/(?:rp|sebesar|harga|seharga)?\s*(\d{4,})/i);

      if (jtMatch) nominal = parseFloat(jtMatch[1].replace(',', '.')) * 1000000;
      else if (kMatch) nominal = parseInt(kMatch[1], 10) * 1000;
      else if (rbMatch) nominal = parseInt(rbMatch[1], 10) * 1000;
      else if (numberMatch) nominal = parseInt(numberMatch[1], 10);

      if (nominal > 0) {
        return {
          type: 'TRANSAKSI',
          data: {
            tipeTransaksi: 'PENDAPATAN',
            totalNominal: nominal,
            deskripsi: userInput,
            kategori: 'TELUR_GRADE_A'
          },
          explanation: `Otomatis tercatat pemasukan kas Rp ${nominal.toLocaleString('id-ID')}.`
        };
      }
    }

    // 3. Fast Smart Local Parser for Transaksi Pengeluaran (e.g. "beli pakan 50k", "keluar uang 100rb")
    if (lower.includes('beli') || lower.includes('bayar') || lower.includes('pengeluaran') || lower.includes('biaya') || lower.includes('belanja')) {
      let nominal = 0;
      const kMatch = lower.match(/(\d+)\s*k\b/i);
      const rbMatch = lower.match(/(\d+)\s*rb\b/i) || lower.match(/(\d+)\s*ribu\b/i);
      const jtMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*jt\b/i) || lower.match(/(\d+(?:[.,]\d+)?)\s*juta\b/i);
      const numberMatch = lower.match(/(?:rp|sebesar|harga|seharga)?\s*(\d{4,})/i);

      if (jtMatch) nominal = parseFloat(jtMatch[1].replace(',', '.')) * 1000000;
      else if (kMatch) nominal = parseInt(kMatch[1], 10) * 1000;
      else if (rbMatch) nominal = parseInt(rbMatch[1], 10) * 1000;
      else if (numberMatch) nominal = parseInt(numberMatch[1], 10);

      if (nominal > 0) {
        return {
          type: 'TRANSAKSI',
          data: {
            tipeTransaksi: 'PENGELUARAN',
            totalNominal: nominal,
            deskripsi: userInput,
            kategori: lower.includes('pakan') ? 'PAKAN' : 'OPERASIONAL_KANDANG'
          },
          explanation: `Otomatis tercatat pengeluaran kas Rp ${nominal.toLocaleString('id-ID')}.`
        };
      }
    }

    // 4. Try Gemini AI for complex queries or questions
    try {
      const systemContext = `Anda adalah parser input data peternakan bebek petelur.
Baca pesan peternak, tentukan apakah "PANEN", "TRANSAKSI", atau "PERTANYAAN".
Keluarkan format JSON murni:
{"type": "PANEN", "data": {"telurUtuh": 90, "telurRetak": 0, "pakanKg": 9, "bebekMati": 0}, "explanation": "..."}
atau
{"type": "TRANSAKSI", "data": {"tipeTransaksi": "PENDAPATAN"|"PENGELUARAN", "totalNominal": 50000, "deskripsi": "..."}, "explanation": "..."}
atau
{"type": "PERTANYAAN", "answer": "Jawaban praktis seputar peternakan bebek."}`;

      const rawText = await this.generateContent(`Pesan: "${userInput}"`, systemContext);
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      return {
        type: 'PERTANYAAN',
        answer: 'Pesan Anda telah diterima! Anda bisa langsung mengetik santai seperti: "sekarang saya panen 90 butir dan total pakan 9kg", "jual telur 50rb", atau "beli pakan 100rb".'
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
