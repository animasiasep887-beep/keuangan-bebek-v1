import dotenv from 'dotenv';
import { db } from './database.js';
import { GeminiService } from './geminiService.js';

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8974401483:AAEOmJ-VDPLbaUVMz39VxvYfJRdnan76Mh8';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

class TelegramBotService {
  constructor() {
    this.isRunning = false;
    this.offset = 0;
    this.botInfo = null;
    this.chatSessions = new Map(); // Store state for multi-step prompts if needed
  }

  async getMe() {
    try {
      const res = await fetch(`${TELEGRAM_API}/getMe`);
      const data = await res.json();
      if (data.ok) {
        this.botInfo = data.result;
        console.log(`[TELEGRAM] Bot terhubung: @${this.botInfo.username} (${this.botInfo.first_name})`);
        return this.botInfo;
      }
      console.error('[TELEGRAM] Gagal verifikasi bot:', data);
      return null;
    } catch (err) {
      console.error('[TELEGRAM] Koneksi error:', err.message);
      return null;
    }
  }

  async sendMessage(chatId, text, options = {}) {
    try {
      const payload = {
        chat_id: chatId,
        text,
        parse_mode: options.parse_mode || 'Markdown',
        ...options
      };

      const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!data.ok && options.parse_mode === 'Markdown') {
        // Retry without markdown if markdown parsing failed
        payload.parse_mode = undefined;
        await fetch(`${TELEGRAM_API}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      return data;
    } catch (err) {
      console.error('[TELEGRAM] Error sendMessage:', err.message);
    }
  }

  getMainKeyboard() {
    return {
      reply_markup: {
        keyboard: [
          [{ text: '📊 Ringkasan Hari Ini' }, { text: '🤖 Tanya AI Peternakan' }],
          [{ text: '🥚 Catat Panen Telur' }, { text: '💰 Catat Kas Masuk/Keluar' }],
          [{ text: '🌾 Cek Stok Pakan' }, { text: '❓ Panduan Perintah' }]
        ],
        resize_keyboard: true,
        persistent: true
      }
    };
  }

  async handleStart(chatId, fromName) {
    const welcome = `👋 *Halo, Peternak Hebat (${fromName})!*

Selamat datang di *BebekJaya PRO Bot* 🦆🥚
Sistem pencatatan peternakan & keuangan bebek petelur otomatis yang terhubung langsung ke aplikasi web Anda.

📌 *Fitur Utama Bot:*
1. 📊 *Cek Ringkasan*: Ketik \`/ringkasan\` atau klik tombol di bawah
2. 🥚 *Catat Panen Cepat*:
   Contoh: \`/panen 430 10 2 50 1\`
   _(430 utuh, 10 retak, 2 rusak, 50kg pakan, 1 mati)_
3. 💵 *Catat Pemasukan*:
   Contoh: \`/masuk 1200000 Jual 600 butir telur\`
4. 💸 *Catat Pengeluaran*:
   Contoh: \`/keluar 450000 Beli pakan konsentrat\`
5. 🤖 *Konsultasi AI Pintar*:
   Ketik \`/tanya <pertanyaan>\` atau ketik pertanyaan langsung!
6. 🗣️ *Bahasa Alami*:
   Bisa kirim teks biasa, misal: _"panen hari ini 400 telur utuh dan 10 retak pakan 50 kg"_, AI akan otomatis menyimpannya ke jurnal!

_Silakan pilih menu di bawah atau ketik perintah Anda!_`;

    await this.sendMessage(chatId, welcome, this.getMainKeyboard());
  }

  async handleSummary(chatId) {
    const farmData = db.getAllData('REAL');
    const { metrics, pakan, kandang, populasi } = farmData;

    const summaryText = `📊 *RINGKASAN PETERNAKAN BEBEK REAL-TIME*
📅 _${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}_

🦆 *Populasi & Kandang:*
• Total Bebek Hidup: *${(metrics.totalPopulasiHidup || 0).toLocaleString('id-ID')} ekor*
• Kandang Aktif: *${kandang.length} unit* (${populasi.length} batch)

🥚 *Produksi Telur Hari Ini:*
• Total Panen: *${(metrics.totalTelurHariIni || 0).toLocaleString('id-ID')} butir*
• Produktivitas (HDP): *${metrics.hdpHariIni || 0}%*
• Konsumsi Pakan: *${metrics.totalPakanKgHariIni || 0} kg*
• Efisiensi Pakan (FCR): *${metrics.fcrAverage || 0}*

💰 *Keuangan Peternakan:*
• Saldo Kas Aktif: *Rp ${(metrics.saldoKas || 0).toLocaleString('id-ID')}*
• Estimasi Laba/Rugi: *Rp ${(metrics.labaRugiMtd || 0).toLocaleString('id-ID')}*
• Total Piutang: *Rp ${(metrics.totalPiutang || 0).toLocaleString('id-ID')}*
• Total Hutang: *Rp ${(metrics.totalHutang || 0).toLocaleString('id-ID')}*

🌾 *Stok Pakan:*
${pakan.length > 0 ? pakan.map(p => `• ${p.namaPakan}: *${p.stokKg} kg* (${p.stokKg <= p.minStokKg ? '⚠️ Stok Menipis' : '✅ Aman'})`).join('\n') : '• Belum ada data pakan'}

🔗 _Data otomatis tersinkronisasi dengan Dashboard Web BebekJaya PRO._`;

    await this.sendMessage(chatId, summaryText, this.getMainKeyboard());
  }

  async handleFeedStock(chatId) {
    const farmData = db.getAllData('REAL');
    const { pakan } = farmData;

    if (!pakan || pakan.length === 0) {
      await this.sendMessage(chatId, '🌾 *Belum ada data pakan.* Silakan input di web dashboard.', this.getMainKeyboard());
      return;
    }

    let text = `🌾 *STATUS STOK PAKAN & SUPLEMEN:*\n\n`;
    pakan.forEach(p => {
      const status = p.stokKg <= p.minStokKg ? '⚠️ *KRITIS / PERLU RESTOCK*' : '✅ *AMAN*';
      text += `📦 *${p.namaPakan}* (${p.merk || 'Standar'})\n`;
      text += `• Sisa Stok: *${p.stokKg} kg*\n`;
      text += `• Batas Minimum: ${p.minStokKg} kg\n`;
      text += `• Estimasi Nilai: Rp ${(p.stokKg * p.hargaPerKg).toLocaleString('id-ID')}\n`;
      text += `• Status: ${status}\n\n`;
    });

    await this.sendMessage(chatId, text, this.getMainKeyboard());
  }

  async handlePanenCommand(chatId, text, fromName) {
    // Format: /panen <utuh> <retak> <rusak> <pakanKg> [bebekMati] [bebekAfkir]
    const parts = text.trim().split(/\s+/);
    if (parts.length < 5) {
      const guide = `ℹ️ *Format Perintah Panen:*
\`\`\`
/panen <utuh> <retak> <rusak> <pakanKg> [bebekMati] [bebekAfkir]
\`\`\`

Contoh:
\`/panen 420 15 2 50 1\`
_(420 telur utuh, 15 retak, 2 rusak, 50kg pakan, 1 bebek mati)_

Atau ketik pesan santai:
_"panen telur utuh 420 butir, retak 15, pakan 50 kg, mati 1 ekor"_`;
      await this.sendMessage(chatId, guide, this.getMainKeyboard());
      return;
    }

    const telurUtuh = Number(parts[1]) || 0;
    const telurRetak = Number(parts[2]) || 0;
    const telurRusak = Number(parts[3]) || 0;
    const pakanKg = Number(parts[4]) || 0;
    const bebekMati = Number(parts[5]) || 0;
    const bebekAfkir = Number(parts[6]) || 0;

    const newLog = db.addPencatatanHarian({
      telurUtuh,
      telurRetak,
      telurRusak,
      pakanKg,
      bebekMati,
      bebekAfkir,
      catatan: `Input via Telegram Bot (${fromName})`,
      createdBy: `Telegram (@${fromName})`
    }, 'REAL');

    const totalTelur = telurUtuh + telurRetak + telurRusak;
    const reply = `✅ *PENCATATAN PANEN BERHASIL DISIMPAN KE JURNAL!* 🦆🥚

📅 Tanggal: *${newLog.tanggal}*
🥚 Telur Utuh (Grade A): *${telurUtuh} butir*
🥚 Telur Retak (Grade B): *${telurRetak} butir*
🥚 Telur Rusak: *${telurRusak} butir*
📦 Total Telur: *${totalTelur} butir*
🌾 Pakan Terpakai: *${pakanKg} kg*
💀 Kematian / Afkir: *${bebekMati} mati / ${bebekAfkir} afkir*

📊 *Indikator Performa:*
• HDP Hari Ini: *${newLog.hdpPercentage}%* ${newLog.hdpPercentage >= 80 ? '🔥 Sangat Baik' : newLog.hdpPercentage >= 70 ? '👍 Normal' : '⚠️ Perlu Perhatian'}
• FCR: *${newLog.fcr}*

💾 _Data tersimpan permanen di database & langsung muncul di Dashboard Web!_`;

    await this.sendMessage(chatId, reply, this.getMainKeyboard());
  }

  async handleMasukCommand(chatId, text, fromName) {
    const parts = text.trim().split(/\s+/);
    if (parts.length < 3) {
      await this.sendMessage(chatId, `ℹ️ *Format Catat Pemasukan:*\n\`/masuk <nominal> <keterangan>\`\n\nContoh:\n\`/masuk 1250000 Penjualan telur Grade A 500 butir\``, this.getMainKeyboard());
      return;
    }

    const nominal = Number(parts[1].replace(/[^0-9]/g, '')) || 0;
    const deskripsi = parts.slice(2).join(' ');

    if (nominal <= 0) {
      await this.sendMessage(chatId, '❌ Nominal harus lebih dari 0.');
      return;
    }

    const newTrx = db.addTransaksiKeuangan({
      tipeTransaksi: 'PENDAPATAN',
      totalNominal: nominal,
      deskripsi: `${deskripsi} (via Telegram)`,
      items: [
        { akunId: '101', debit: nominal, kredit: 0 },
        { akunId: '401', debit: 0, kredit: nominal }
      ],
      createdBy: `Telegram (@${fromName})`
    }, 'REAL');

    const metrics = db.calculateMetrics('REAL');
    const reply = `💵 *PEMASUKAN KAS BERHASIL DICATAT!*

📝 No Ref: \`${newTrx.noRef}\`
💰 Nominal: *Rp ${nominal.toLocaleString('id-ID')}*
📄 Keterangan: *${deskripsi}*
💼 Saldo Kas Baru: *Rp ${metrics.saldoKas.toLocaleString('id-ID')}*

💾 _Tercatat otomatis di Jurnal Keuangan & Laporan Laba Rugi._`;

    await this.sendMessage(chatId, reply, this.getMainKeyboard());
  }

  async handleKeluarCommand(chatId, text, fromName) {
    const parts = text.trim().split(/\s+/);
    if (parts.length < 3) {
      await this.sendMessage(chatId, `ℹ️ *Format Catat Pengeluaran:*\n\`/keluar <nominal> <keterangan>\`\n\nContoh:\n\`/keluar 520000 Beli pakan konsentrat 1 karung\``, this.getMainKeyboard());
      return;
    }

    const nominal = Number(parts[1].replace(/[^0-9]/g, '')) || 0;
    const deskripsi = parts.slice(2).join(' ');

    if (nominal <= 0) {
      await this.sendMessage(chatId, '❌ Nominal harus lebih dari 0.');
      return;
    }

    const newTrx = db.addTransaksiKeuangan({
      tipeTransaksi: 'PENGELUARAN',
      totalNominal: nominal,
      deskripsi: `${deskripsi} (via Telegram)`,
      items: [
        { akunId: '501', debit: nominal, kredit: 0 },
        { akunId: '101', debit: 0, kredit: nominal }
      ],
      createdBy: `Telegram (@${fromName})`
    }, 'REAL');

    const metrics = db.calculateMetrics('REAL');
    const reply = `💸 *PENGELUARAN KAS BERHASIL DICATAT!*

📝 No Ref: \`${newTrx.noRef}\`
💰 Nominal: *Rp ${nominal.toLocaleString('id-ID')}*
📄 Keterangan: *${deskripsi}*
💼 Sisa Saldo Kas: *Rp ${metrics.saldoKas.toLocaleString('id-ID')}*

💾 _Tercatat otomatis di Buku Kas & Jurnal Pengeluaran._`;

    await this.sendMessage(chatId, reply, this.getMainKeyboard());
  }

  async handleAskAI(chatId, question, fromName) {
    if (!question || question.trim().length === 0) {
      await this.sendMessage(chatId, `🤖 *Silakan ketik pertanyaan Anda untuk Konsultan AI Peternakan.*\n\nContoh:\n\`/tanya Bagaimana cara menaikkan produksi telur bebek yang sedang drop?\`\nAtau langsung ketik pertanyaan apa saja!`, this.getMainKeyboard());
      return;
    }

    await this.sendMessage(chatId, `⏳ *Sedang menganalisa dengan Google Gemini AI...*`);

    try {
      const farmData = db.getAllData('REAL');
      const answer = await GeminiService.askFarmConsultant(question, farmData);
      const reply = `🤖 *KONSULTAN AI PETERNAKAN (GEMINI):*\n\n${answer}`;
      await this.sendMessage(chatId, reply, this.getMainKeyboard());
    } catch (err) {
      await this.sendMessage(chatId, `❌ Gagal menghubungi AI: ${err.message}`, this.getMainKeyboard());
    }
  }

  async handleNaturalMessage(chatId, text, fromName) {
    // Check quick button commands first
    if (text === '📊 Ringkasan Hari Ini') {
      return this.handleSummary(chatId);
    }
    if (text === '🌾 Cek Stok Pakan') {
      return this.handleFeedStock(chatId);
    }
    if (text === '🥚 Catat Panen Telur') {
      return this.sendMessage(chatId, `🥚 *Pencatatan Panen Telur:*\nKetik dengan format:\n\`/panen <utuh> <retak> <rusak> <pakanKg> [bebekMati]\`\n\nAtau ketik biasa seperti:\n_"panen telur utuh 450 butir, retak 10 butir, pakan 50 kg, mati 0"_`, this.getMainKeyboard());
    }
    if (text === '💰 Catat Kas Masuk/Keluar') {
      return this.sendMessage(chatId, `💰 *Pencatatan Keuangan:*\n\n1. Pemasukan:\n\`/masuk <nominal> <keterangan>\`\n_Contoh: /masuk 900000 Jual 450 telur_\n\n2. Pengeluaran:\n\`/keluar <nominal> <keterangan>\`\n_Contoh: /keluar 450000 Beli pakan konsentrat_\n\nAtau ketik biasa: _"beli vitamin bebek 150000"_`, this.getMainKeyboard());
    }
    if (text === '🤖 Tanya AI Peternakan') {
      return this.sendMessage(chatId, `🤖 *Konsultan AI Peternakan Siap Membantu!*\n\nSilakan ajukan pertanyaan apapun mengenai nutrisi pakan, penyakit bebek, perlakuan musim hujan/kemarau, atau analisis keuangan peternakan Anda.`, this.getMainKeyboard());
    }
    if (text === '❓ Panduan Perintah') {
      return this.handleStart(chatId, fromName);
    }

    // Let Gemini parse the message (Smart Natural Language)
    await this.sendMessage(chatId, `⏳ *Sedang memproses pesan Anda...*`);
    try {
      const farmData = db.getAllData('REAL');
      const parsed = await GeminiService.parseNaturalLanguageInput(text, farmData);

      if (parsed.type === 'PANEN' && parsed.data) {
        const d = parsed.data;
        const newLog = db.addPencatatanHarian({
          telurUtuh: d.telurUtuh || 0,
          telurRetak: d.telurRetak || 0,
          telurRusak: d.telurRusak || 0,
          pakanKg: d.pakanKg || 0,
          bebekMati: d.bebekMati || 0,
          bebekAfkir: d.bebekAfkir || 0,
          catatan: `${d.catatan || 'Auto AI'} (via Telegram: "${text}")`,
          createdBy: `Telegram (@${fromName})`
        }, 'REAL');

        const reply = `✨ *AI BERHASIL MENCATAT PANEN OTOMATIS!* 🥚

📋 *Data Tersimpan:*
• Telur Utuh: *${newLog.telurUtuh} butir*
• Telur Retak: *${newLog.telurRetak} butir*
• Pakan Terpakai: *${newLog.pakanKg} kg*
• Kematian: *${newLog.bebekMati} ekor*
• HDP Hari Ini: *${newLog.hdpPercentage}%*

💡 _${parsed.explanation || 'Data telah disinkronkan ke Web Dashboard BebekJaya PRO.'}_`;
        return this.sendMessage(chatId, reply, this.getMainKeyboard());
      }

      if (parsed.type === 'TRANSAKSI' && parsed.data) {
        const d = parsed.data;
        const isPendapatan = d.tipeTransaksi === 'PENDAPATAN';
        const newTrx = db.addTransaksiKeuangan({
          tipeTransaksi: d.tipeTransaksi || 'PENGELUARAN',
          totalNominal: d.totalNominal || 0,
          deskripsi: `${d.deskripsi || text} (via Telegram)`,
          items: isPendapatan
            ? [{ akunId: '101', debit: d.totalNominal, kredit: 0 }, { akunId: '401', debit: 0, kredit: d.totalNominal }]
            : [{ akunId: '501', debit: d.totalNominal, kredit: 0 }, { akunId: '101', debit: 0, kredit: d.totalNominal }],
          createdBy: `Telegram (@${fromName})`
        }, 'REAL');

        const metrics = db.calculateMetrics('REAL');
        const reply = `✨ *AI BERHASIL MENCATAT KAS OTOMATIS!* 💰

📋 *Transaksi:* ${isPendapatan ? '🟢 Pemasukan' : '🔴 Pengeluaran'}
• Nominal: *Rp ${(d.totalNominal || 0).toLocaleString('id-ID')}*
• Deskripsi: *${d.deskripsi || text}*
• Saldo Kas Sekarang: *Rp ${metrics.saldoKas.toLocaleString('id-ID')}*

💡 _${parsed.explanation || 'Tercatat di sistem akuntansi BebekJaya PRO.'}_`;
        return this.sendMessage(chatId, reply, this.getMainKeyboard());
      }

      // Default: AI answering the question
      const answer = parsed.answer || await GeminiService.askFarmConsultant(text, farmData);
      const reply = `🤖 *KONSULTAN AI (GEMINI):*\n\n${answer}`;
      await this.sendMessage(chatId, reply, this.getMainKeyboard());
    } catch (e) {
      console.error('[TELEGRAM] Error handling natural message:', e);
      await this.sendMessage(chatId, `Maaf, terjadi kesalahan dalam memproses pesan: ${e.message}`, this.getMainKeyboard());
    }
  }

  async processUpdate(update) {
    if (!update.message || !update.message.text) return;

    const message = update.message;
    const chatId = message.chat.id;
    const text = message.text.trim();
    const fromName = message.from?.first_name || message.from?.username || 'Peternak';

    console.log(`[TELEGRAM] Pesan dari ${fromName} (${chatId}): "${text}"`);

    if (text === '/start' || text === '/help') {
      return this.handleStart(chatId, fromName);
    }
    if (text === '/ringkasan' || text === '/status') {
      return this.handleSummary(chatId);
    }
    if (text.startsWith('/panen')) {
      return this.handlePanenCommand(chatId, text, fromName);
    }
    if (text.startsWith('/masuk')) {
      return this.handleMasukCommand(chatId, text, fromName);
    }
    if (text.startsWith('/keluar')) {
      return this.handleKeluarCommand(chatId, text, fromName);
    }
    if (text.startsWith('/tanya')) {
      const question = text.replace(/^\/tanya\s*/, '');
      return this.handleAskAI(chatId, question, fromName);
    }

    // Process free text with Gemini AI
    return this.handleNaturalMessage(chatId, text, fromName);
  }

  async pollUpdates() {
    if (!this.isRunning) return;

    try {
      const url = `${TELEGRAM_API}/getUpdates?offset=${this.offset}&timeout=25`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          this.offset = update.update_id + 1;
          await this.processUpdate(update);
        }
      }
    } catch (err) {
      console.error('[TELEGRAM] Error polling updates:', err.message);
      // Wait 3 seconds before retrying on network error
      await new Promise(r => setTimeout(r, 3000));
    }

    if (this.isRunning) {
      setTimeout(() => this.pollUpdates(), 500);
    }
  }

  async start() {
    const info = await this.getMe();
    if (!info) {
      console.warn('[TELEGRAM] Tidak dapat menjalankan bot Telegram. Periksa token di .env.');
      return false;
    }
    this.isRunning = true;
    console.log('[TELEGRAM] Polling aktif untuk bot @' + info.username);
    this.pollUpdates();
    return true;
  }

  stop() {
    this.isRunning = false;
    console.log('[TELEGRAM] Polling dihentikan.');
  }

  getStatus() {
    return {
      connected: this.isRunning && !!this.botInfo,
      username: this.botInfo?.username || 'bebekpetelur_bot',
      firstName: this.botInfo?.first_name || 'PETERNAKAN',
      botUrl: `https://t.me/${this.botInfo?.username || 'bebekpetelur_bot'}`
    };
  }
}

export const telegramBot = new TelegramBotService();
