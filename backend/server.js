require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

// ── MIDDLEWARE ──────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ── API ROUTES ──────────────────────────────────────────────────────────────
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/tips',    require('./routes/tips'));
app.use('/api/actions', require('./routes/actions'));
app.use('/api/admin',   require('./routes/admin'));

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

// Fallback → serve frontend SPA
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ── START ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n[GreenLife] Rodando em http://localhost:${PORT}`);
  console.log(`   Banco de dados: ${process.env.DB_NAME || 'greenlife'} @ ${process.env.DB_HOST || 'localhost'}\n`);
});
