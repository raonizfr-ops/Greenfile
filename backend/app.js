/**
 * Cria e configura a aplicação Express.
 *
 * Este módulo é **separado** do `server.js` para permitir que os
 * testes de integração importem a app sem precisar abrir uma porta.
 *   server.js  → require('./app') + app.listen(...)
 *   tests      → require('./app') + supertest(app)
 */
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

function createApp() {
  const app = express();

  // ── MIDDLEWARES ────────────────────────────────────────────────────────────
  app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ── FRONTEND ESTÁTICO ──────────────────────────────────────────────────────
  app.use(express.static(path.join(__dirname, '..', 'frontend')));

  // ── ROTAS DA API ───────────────────────────────────────────────────────────
  app.use('/api/auth',    require('./routes/auth'));
  app.use('/api/tips',    require('./routes/tips'));
  app.use('/api/actions', require('./routes/actions'));
  app.use('/api/admin',   require('./routes/admin'));

  // Health check
  app.get('/api/health', (_req, res) =>
    res.json({ status: 'ok', time: new Date() })
  );

  // Fallback → SPA
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
  });

  return app;
}

module.exports = createApp;
