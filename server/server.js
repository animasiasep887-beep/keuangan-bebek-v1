import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './database.js';
import { GeminiService } from './geminiService.js';
import { telegramBot } from './telegramBot.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health & status endpoint
app.get('/api/status', (req, res) => {
  const botStatus = telegramBot.getStatus();
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: {
      location: path.join(__dirname, 'data', 'farm_database.json'),
      lastUpdated: db.data.lastUpdated,
      persisted: true
    },
    telegramBot: botStatus,
    aiStudio: {
      connected: !!process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash'
    }
  });
});

// Get all farm data
app.get('/api/data', (req, res) => {
  const mode = req.query.mode || 'REAL';
  const data = db.getAllData(mode);
  res.json(data);
});

// Full Sync endpoint
app.post('/api/sync', (req, res) => {
  const mode = req.query.mode || 'REAL';
  const updatedData = db.syncAllData(req.body, mode);
  res.json({
    success: true,
    message: 'Data peternakan berhasil disimpan permanen ke disk.',
    data: updatedData
  });
});

// Add daily harvest
app.post('/api/panen', (req, res) => {
  const mode = req.query.mode || 'REAL';
  const newLog = db.addPencatatanHarian(req.body, mode);
  res.json({
    success: true,
    data: newLog,
    metrics: db.calculateMetrics(mode)
  });
});

// Add transaction
app.post('/api/transaksi', (req, res) => {
  const mode = req.query.mode || 'REAL';
  const newTrx = db.addTransaksiKeuangan(req.body, mode);
  res.json({
    success: true,
    data: newTrx,
    metrics: db.calculateMetrics(mode)
  });
});

// AI Farm Consultant Chat
app.post('/api/ai/ask', async (req, res) => {
  try {
    const { question, mode } = req.body;
    const farmData = db.getAllData(mode || 'REAL');
    const answer = await GeminiService.askFarmConsultant(question, farmData);
    res.json({ success: true, answer });
  } catch (error) {
    console.error('[API /api/ai/ask] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI Automated Farm Performance Analysis
app.get('/api/ai/analysis', async (req, res) => {
  try {
    const mode = req.query.mode || 'REAL';
    const farmData = db.getAllData(mode);
    const analysis = await GeminiService.getAutomatedAnalysis(farmData);
    res.json({ success: true, analysis });
  } catch (error) {
    console.error('[API /api/ai/analysis] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Download JSON Backup
app.get('/api/backup/download', (req, res) => {
  const dbPath = path.join(__dirname, 'data', 'farm_database.json');
  res.download(dbPath, `bebekjaya_backup_${new Date().toISOString().slice(0, 10)}.json`);
});

// Reset Real Data
app.post('/api/reset-real', (req, res) => {
  const result = db.resetRealData();
  res.json({ success: true, data: result });
});

// Serve frontend static build files directly on http://localhost:3001
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// Fallback all non-API routes to index.html (Express 5 compatible)
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(distPath, 'index.html'));
  }
  next();
});

// Start Express Server
app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🦆 BebekJaya PRO - Backend Server Aktif di Port ${PORT}`);
  console.log(`💻 Web Dashboard: http://localhost:${PORT}`);
  console.log(`📁 Database Lokasi: ${path.join(__dirname, 'data', 'farm_database.json')}`);
  console.log(`🌐 API Endpoint: http://localhost:${PORT}/api/data`);
  console.log(`=======================================================`);

  // Start Telegram Bot
  await telegramBot.start();
});

