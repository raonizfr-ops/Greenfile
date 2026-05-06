const router = require('express').Router();
const db = require('../config/db');
const { adminMiddleware } = require('../middleware/auth');

// GET /api/admin/stats
router.get('/stats', adminMiddleware, async (_req, res) => {
  try {
    const [[{ total_users }]]   = await db.query('SELECT COUNT(*) AS total_users FROM users WHERE role="user"');
    const [[{ total_actions }]] = await db.query('SELECT COUNT(*) AS total_actions FROM eco_actions');
    const [[{ total_co2 }]]     = await db.query('SELECT COALESCE(SUM(co2_saved),0) AS total_co2 FROM eco_actions');
    const [[{ total_tips }]]    = await db.query('SELECT COUNT(*) AS total_tips FROM tips');
    const [[{ flagged_comments }]] = await db.query('SELECT COUNT(*) AS flagged_comments FROM comments WHERE flagged=1');

    // actions per month (last 7 months)
    const [monthly] = await db.query(`
      SELECT DATE_FORMAT(created_at,'%b') AS month,
             MONTH(created_at)            AS month_num,
             COUNT(*)                     AS total
      FROM eco_actions
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 MONTH)
      GROUP BY month_num, month
      ORDER BY month_num ASC
      LIMIT 7
    `);

    // actions by category
    const [by_category] = await db.query(`
      SELECT c.name, COUNT(*) AS total
      FROM eco_actions ea
      JOIN categories c ON c.name = CASE
        WHEN ea.action_type LIKE '%reciclei%' OR ea.action_type LIKE '%recicl%' THEN 'Reciclagem'
        WHEN ea.action_type LIKE '%água%' OR ea.action_type LIKE '%torneira%' THEN 'Água'
        WHEN ea.action_type LIKE '%energi%' OR ea.action_type LIKE '%elétric%' THEN 'Energia'
        ELSE 'Consumo Consciente'
      END
      GROUP BY c.name
    `);

    res.json({ total_users, total_actions, total_co2: +total_co2, total_tips, flagged_comments, monthly, by_category });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar estatísticas.' });
  }
});

// GET /api/admin/users
router.get('/users', adminMiddleware, async (req, res) => {
  const search = req.query.search ? `%${req.query.search}%` : '%';
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.name, u.email, u.role, u.status, u.points, u.created_at,
             COUNT(DISTINCT a.id) AS total_actions
      FROM users u
      LEFT JOIN eco_actions a ON a.user_id = u.id
      WHERE (u.name LIKE ? OR u.email LIKE ?) AND u.role = 'user'
      GROUP BY u.id
      ORDER BY u.points DESC
    `, [search, search]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar usuários.' });
  }
});

// PUT /api/admin/users/:id/status
router.put('/users/:id/status', adminMiddleware, async (req, res) => {
  const { status } = req.body; // 'ativo' | 'suspenso' | 'banido'
  if (!['ativo','suspenso','banido'].includes(status))
    return res.status(400).json({ error: 'Status inválido.' });
  try {
    await db.query('UPDATE users SET status=? WHERE id=? AND role="user"', [status, req.params.id]);
    res.json({ message: `Usuário ${status === 'ativo' ? 'reativado' : status}.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar usuário.' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', adminMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE id=? AND role="user"', [req.params.id]);
    res.json({ message: 'Usuário removido.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao remover usuário.' });
  }
});

// GET /api/admin/comments  (flagged)
router.get('/comments', adminMiddleware, async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT cm.id, cm.content, cm.flagged, cm.created_at,
             u.name AS author, t.title AS tip_title
      FROM comments cm
      JOIN users u ON u.id = cm.user_id
      JOIN tips  t ON t.id = cm.tip_id
      ORDER BY cm.flagged DESC, cm.created_at DESC
      LIMIT 50
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar comentários.' });
  }
});

// PUT /api/admin/comments/:id/flag
router.put('/comments/:id/flag', adminMiddleware, async (req, res) => {
  try {
    await db.query('UPDATE comments SET flagged=NOT flagged WHERE id=?', [req.params.id]);
    res.json({ message: 'Comentário atualizado.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao moderar comentário.' });
  }
});

// DELETE /api/admin/comments/:id
router.delete('/comments/:id', adminMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM comments WHERE id=?', [req.params.id]);
    res.json({ message: 'Comentário removido.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao remover comentário.' });
  }
});

module.exports = router;
