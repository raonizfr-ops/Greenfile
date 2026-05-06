const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'Token não fornecido.' });

  const token = header.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Formato inválido. Use: Bearer <token>' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'greenlife_secret_2024');
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso restrito a administradores.' });
    }
    next();
  });
}

module.exports = { authMiddleware, adminMiddleware };
