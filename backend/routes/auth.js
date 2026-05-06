const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { User } = require('../models');
const { authMiddleware } = require('../middleware/auth');

const SECRET = process.env.JWT_SECRET || 'greenlife_secret_2024';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });

  try {
    const exists = await User.findByEmail(email);
    if (exists) return res.status(409).json({ error: 'Email já cadastrado.' });

    const password_hash = await bcrypt.hash(password, 10);
    const userId = await User.create({ name, email, password_hash });

    const token = jwt.sign(
      { id: userId, name, email, role: 'user' },
      SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({ token, user: { id: userId, name, email, role: 'user' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });

  try {
    const user = await User.findByEmail(email);
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas.' });

    if (user.status === 'banido')
      return res.status(403).json({ error: 'Conta banida. Entre em contato com o suporte.' });
    if (user.status === 'suspenso')
      return res.status(403).json({ error: 'Conta suspensa temporariamente.' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Credenciais inválidas.' });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: {
        id: user.id, name: user.name, email: user.email,
        role: user.role, points: user.points,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor.' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const profile = await User.findProfileWithStats(req.user.id);
    if (!profile) return res.status(404).json({ error: 'Usuário não encontrado.' });
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor.' });
  }
});

// PUT /api/auth/me
router.put('/me', authMiddleware, async (req, res) => {
  const { name, email } = req.body;
  try {
    await User.updateProfile(req.user.id, { name, email });
    res.json({ message: 'Perfil atualizado com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor.' });
  }
});

module.exports = router;
