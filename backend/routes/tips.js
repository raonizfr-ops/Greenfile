const router = require('express').Router();
const db = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// GET /api/tips  (public — but enriched if logged in)
router.get('/', async (req, res) => {
  const userId   = req.query.userId ? +req.query.userId : null;
  const category = req.query.category || null;

  try {
    let sql = `
      SELECT t.id, t.title, t.description, t.created_at,
             c.name AS category, c.color AS category_color, c.icon AS category_icon,
             u.name AS author,
             COUNT(DISTINCT tl.user_id)   AS likes,
             COUNT(DISTINCT cm.id)         AS comments
      FROM tips t
      LEFT JOIN categories c ON c.id = t.category_id
      LEFT JOIN users u      ON u.id = t.author_id
      LEFT JOIN tip_likes tl ON tl.tip_id = t.id
      LEFT JOIN comments cm  ON cm.tip_id = t.id
    `;
    const params = [];
    if (category) { sql += ' WHERE c.name = ?'; params.push(category); }
    sql += ' GROUP BY t.id ORDER BY t.created_at DESC';

    const [tips] = await db.query(sql, params);

    // enrich with user-specific liked / saved flags
    if (userId) {
      const [liked] = await db.query('SELECT tip_id FROM tip_likes WHERE user_id = ?', [userId]);
      const [saved] = await db.query('SELECT tip_id FROM tip_saves WHERE user_id = ?', [userId]);
      const likedSet = new Set(liked.map(r => r.tip_id));
      const savedSet = new Set(saved.map(r => r.tip_id));
      tips.forEach(t => { t.liked = likedSet.has(t.id); t.saved = savedSet.has(t.id); });
    }

    res.json(tips);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar dicas.' });
  }
});

// GET /api/tips/categories
router.get('/categories', async (_req, res) => {
  const [rows] = await db.query('SELECT * FROM categories');
  res.json(rows);
});

// POST /api/tips  (admin only)
router.post('/', adminMiddleware, async (req, res) => {
  const { title, description, category_id } = req.body;
  if (!title || !description)
    return res.status(400).json({ error: 'Título e descrição são obrigatórios.' });
  try {
    const [r] = await db.query(
      'INSERT INTO tips (title, description, category_id, author_id) VALUES (?,?,?,?)',
      [title, description, category_id || null, req.user.id]
    );
    res.status(201).json({ id: r.insertId, message: 'Dica criada com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar dica.' });
  }
});

// PUT /api/tips/:id  (admin only)
router.put('/:id', adminMiddleware, async (req, res) => {
  const { title, description, category_id } = req.body;
  try {
    await db.query(
      'UPDATE tips SET title=?, description=?, category_id=? WHERE id=?',
      [title, description, category_id || null, req.params.id]
    );
    res.json({ message: 'Dica atualizada.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar dica.' });
  }
});

// DELETE /api/tips/:id  (admin only)
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM tips WHERE id = ?', [req.params.id]);
    res.json({ message: 'Dica removida.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao remover dica.' });
  }
});

// POST /api/tips/:id/like  (toggle)
router.post('/:id/like', authMiddleware, async (req, res) => {
  const tipId  = +req.params.id;
  const userId = req.user.id;
  try {
    const [exists] = await db.query(
      'SELECT 1 FROM tip_likes WHERE user_id=? AND tip_id=?', [userId, tipId]
    );
    if (exists.length > 0) {
      await db.query('DELETE FROM tip_likes WHERE user_id=? AND tip_id=?', [userId, tipId]);
      res.json({ liked: false });
    } else {
      await db.query('INSERT INTO tip_likes (user_id, tip_id) VALUES (?,?)', [userId, tipId]);
      res.json({ liked: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao registrar curtida.' });
  }
});

// POST /api/tips/:id/save  (toggle)
router.post('/:id/save', authMiddleware, async (req, res) => {
  const tipId  = +req.params.id;
  const userId = req.user.id;
  try {
    const [exists] = await db.query(
      'SELECT 1 FROM tip_saves WHERE user_id=? AND tip_id=?', [userId, tipId]
    );
    if (exists.length > 0) {
      await db.query('DELETE FROM tip_saves WHERE user_id=? AND tip_id=?', [userId, tipId]);
      res.json({ saved: false });
    } else {
      await db.query('INSERT INTO tip_saves (user_id, tip_id) VALUES (?,?)', [userId, tipId]);
      res.json({ saved: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao salvar dica.' });
  }
});

// GET /api/tips/:id/comments
router.get('/:id/comments', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT cm.id, cm.content, cm.flagged, cm.created_at, u.name AS author
       FROM comments cm JOIN users u ON u.id = cm.user_id
       WHERE cm.tip_id = ? ORDER BY cm.created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar comentários.' });
  }
});

// POST /api/tips/:id/comments
router.post('/:id/comments', authMiddleware, async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Comentário não pode ser vazio.' });
  try {
    const [r] = await db.query(
      'INSERT INTO comments (tip_id, user_id, content) VALUES (?,?,?)',
      [req.params.id, req.user.id, content]
    );
    res.status(201).json({ id: r.insertId, content, author: req.user.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao publicar comentário.' });
  }
});

module.exports = router;
