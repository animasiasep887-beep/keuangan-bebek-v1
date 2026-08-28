import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  Zap,
  ExternalLink,
  Lightbulb,
} from 'lucide-react';
import { StorageService } from '../services/storage';
import type { FarmMetricsSummary } from '../types';

interface AIAssistantViewProps {
  metrics: FarmMetricsSummary;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({ metrics }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Halo Peternak Hebat! 🦆\n\nSaya adalah **Konsultan AI BebekJaya PRO** yang didukung oleh **Google AI Studio (Gemini)**.\n\nSaya telah terhubung langsung dengan data peternakan Anda:\n• **${metrics.totalPopulasiHidup} ekor** populasi bebek\n• **${metrics.hdpHariIni}%** HDP panen hari ini\n• **Rp ${metrics.saldoKas.toLocaleString('id-ID')}** saldo kas operasional\n\nSilakan tanyakan apa saja tentang nutrisi pakan, cara menaikkan produksi telur, diagnosa penyakit bebek, atau analisis keuangan peternakan Anda!`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<any>(null);
  const [autoAnalysis, setAutoAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check server & bot status
    StorageService.getServerStatus().then(status => {
      setServerStatus(status);
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputMessage('');
    setIsLoading(true);

    try {
      const answer = await StorageService.askAI(textToSend);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: answer,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e: any) {
      const errorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: `Maaf, terjadi kesalahan: ${e.message}`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunAutoAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const analysis = await StorageService.getAIAnalysis();
      setAutoAnalysis(analysis);
    } catch (err: any) {
      setAutoAnalysis('Gagal menjalankan audit otomatis. Pastikan server backend aktif.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const quickPrompts = [
    'Bagaimana cara meningkatkan HDP / produksi telur yang sedang turun?',
    'Berapa porsi pakan konsentrat & dedak ideal untuk 500 ekor bebek?',
    'Hitung efisiensi FCR dan margin keuntungan pakan saya saat ini',
    'Tips pencegahan bebek stres & rontok bulu saat musim hujan',
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900/60 via-slate-900/90 to-amber-950/60 border border-emerald-500/30 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Google AI Studio (Gemini) + Bot Telegram
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Konsultan AI & Integrasi Peternakan Bebek
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl">
              Asisten kecerdasan buatan terpadu yang memantau performa ternak, menganalisis FCR & HDP secara real-time, dan tersinkronisasi langsung dengan Bot Telegram Anda di HP.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://t.me/bebekpetelur_bot"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-sky-600/20 hover:scale-105 transition-all"
            >
              <Bot className="w-4 h-4" />
              Buka Bot Telegram (@bebekpetelur_bot)
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </a>
          </div>
        </div>

        {/* Integration Status Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-semibold">Penyimpanan Database</div>
              <div className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {serverStatus?.online ? 'Database Hard Disk Aktif' : 'Tersimpan Permanen'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-semibold">Bot Telegram</div>
              <div className="text-xs font-extrabold text-sky-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
                @{serverStatus?.telegramBot?.username || 'bebekpetelur_bot'} (Aktif)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-semibold">Google Gemini AI Engine</div>
              <div className="text-xs font-extrabold text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                AI Studio Terhubung
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: AI Chat Assistant */}
        <div className="lg:col-span-2 flex flex-col rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden min-h-[600px]">
          {/* Chat Header */}
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center text-slate-950 shadow-md">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  Konsultasi AI Peternakan Bebek
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Live Data
                  </span>
                </h2>
                <p className="text-xs text-slate-400">Didukung Google Gemini Flash</p>
              </div>
            </div>

            <button
              onClick={() => setMessages(messages.slice(0, 1))}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-all flex items-center gap-1.5"
              title="Bersihkan Obrolan"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Chat
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[480px]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex-shrink-0 flex items-center justify-center mt-1">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none shadow-md shadow-amber-500/10'
                      : 'bg-slate-950/70 border border-slate-800 text-slate-200 rounded-tl-none prose prose-invert prose-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                  <div
                    className={`text-[10px] mt-2 font-mono ${
                      msg.sender === 'user' ? 'text-slate-800' : 'text-slate-500'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl rounded-tl-none text-slate-400 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  AI sedang menganalisis data peternakan & menyusun jawaban...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="p-3 bg-slate-950/40 border-t border-slate-800/60 overflow-x-auto flex gap-2 no-scrollbar">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="whitespace-nowrap text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all flex items-center gap-1.5 flex-shrink-0"
              >
                <Lightbulb className="w-3 h-3 text-amber-400" />
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-4 bg-slate-950/90 border-t border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Tanyakan apa saja seputar ternak bebek, nutrisi pakan, atau laporan keuangan..."
                disabled={isLoading}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all"
              >
                <Send className="w-4 h-4" />
                Kirim
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: AI Audit & Telegram Guide */}
        <div className="space-y-6">
          {/* Automated AI Audit Card */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Audit Kinerja AI Hari Ini
              </h2>
              <button
                onClick={handleRunAutoAnalysis}
                disabled={isAnalyzing}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 font-semibold transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                {isAnalyzing ? 'Menganalisis...' : 'Analisis Ulang'}
              </button>
            </div>

            {autoAnalysis ? (
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
                {autoAnalysis}
              </div>
            ) : (
              <div className="p-5 rounded-xl bg-slate-950/50 border border-dashed border-slate-800 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-slate-800/80 text-amber-400 flex items-center justify-center mx-auto">
                  <Sparkles className="w-5 h-5" />
                </div>
                <p className="text-xs text-slate-400">
                  Dapatkan analisa mendalam mengenai efisiensi HDP, pakan FCR, dan kondisi arus kas peternakan Anda secara otomatis.
                </p>
                <button
                  onClick={handleRunAutoAnalysis}
                  disabled={isAnalyzing}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all"
                >
                  {isAnalyzing ? 'Sedang Memproses...' : '🚀 Mulai Audit AI Sekarang'}
                </button>
              </div>
            )}
          </div>

          {/* Telegram Bot Cheatsheet Card */}
          <div className="rounded-2xl bg-gradient-to-b from-sky-950/40 to-slate-900/90 border border-sky-500/30 p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Panduan Bot Telegram (@bebekpetelur_bot)</h2>
                <p className="text-xs text-sky-300">Catat jurnal dari HP tanpa buka laptop</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="font-bold text-amber-400 font-mono">/ringkasan</div>
                <div className="text-slate-400">Lihat total populasi, saldo kas, panen, dan HDP hari ini.</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="font-bold text-emerald-400 font-mono">/panen 430 10 2 50 1</div>
                <div className="text-slate-400">
                  Format: <code>/panen &lt;utuh&gt; &lt;retak&gt; &lt;rusak&gt; &lt;pakanKg&gt; [mati]</code>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="font-bold text-sky-400 font-mono">/masuk 1200000 Jual Telur</div>
                <div className="text-slate-400">Catat pemasukan kas langsung ke jurnal.</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="font-bold text-rose-400 font-mono">/keluar 450000 Beli Pakan</div>
                <div className="text-slate-400">Catat pengeluaran kas langsung ke jurnal.</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="font-bold text-purple-400 font-mono">Ketik Bahasa Alami</div>
                <div className="text-slate-400">
                  Misal: <em>"panen telur utuh 420 retak 5 pakan 50kg"</em> — AI otomatis menyimpannya!
                </div>
              </div>
            </div>

            <a
              href="https://t.me/bebekpetelur_bot"
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Mulai Chat di Telegram (@bebekpetelur_bot)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
