const router = require('express').Router();
const { User, EcoAction, Tip, Comment } = require('../models');
const { adminMiddleware } = require('../middleware/auth');

// GET /api/admin/stats
router.get('/stats', adminMiddleware, async (_req, res) => {
  try {
    const [
      total_users,
      total_actions,
      total_co2,
      total_tips,
      flagged_comments,
      monthly,
      by_category,
    ] = await Promise.all([
      User.countUsers(),
      EcoAction.countAll(),
      EcoAction.sumCo2(),
      Tip.countAll(),
      Comment.countFlagged(),
      EcoAction.monthlyStats(),
      EcoAction.byCategory(),
    ]);

    res.json({
      total_users, total_actions, total_co2,
      total_tips, flagged_comments, monthly, by_category,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar estatísticas.' });
  }
});

// GET /api/admin/users
router.get('/users', adminMiddleware, async (req, res) => {
  const search = req.query.search ? `%${req.query.search}%` : '%';
  try {
    const rows = await User.listWithStats(search);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar usuários.' });
  }
});

// PUT /api/admin/users/:id/status
router.put('/users/:id/status', adminMiddleware, async (req, res) => {
  const { status } = req.body; // 'ativo' | 'suspenso' | 'banido'
  if (!['ativo', 'suspenso', 'banido'].includes(status))
    return res.status(400).json({ error: 'Status inválido.' });
  try {
    await User.updateStatus(req.params.id, status);
    res.json({ message: `Usuário ${status === 'ativo' ? 'reativado' : status}.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar usuário.' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', adminMiddleware, async (req, res) => {
  try {
    await User.delete(req.params.id);
    res.json({ message: 'Usuário removido.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao remover usuário.' });
  }
});

// GET /api/admin/comments  (lista para moderação)
router.get('/comments', adminMiddleware, async (_req, res) => {
  try {
    const rows = await Comment.listForModeration();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar comentários.' });
  }
});

// PUT /api/admin/comments/:id/flag
router.put('/comments/:id/flag', adminMiddleware, async (req, res) => {
  try {
    await Comment.toggleFlag(req.params.id);
    res.json({ message: 'Comentário atualizado.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao moderar comentário.' });
  }
});

// DELETE /api/admin/comments/:id
router.delete('/comments/:id', adminMiddleware, async (req, res) => {
  try {
    await Comment.delete(req.params.id);
    res.json({ message: 'Comentário removido.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao remover comentário.' });
  }
});

module.exports = router;
