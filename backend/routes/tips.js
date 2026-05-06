const router = require('express').Router();
const { Tip, Comment, Category } = require('../models');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// GET /api/tips  — público; enriquece com dados do usuário se logado
router.get('/', async (req, res) => {
  const userId   = req.query.userId ? +req.query.userId : null;
  const category = req.query.category || null;

  try {
    const tips = await Tip.findAll({ category });

    if (userId) {
      const [likedSet, savedSet] = await Promise.all([
        Tip.likedIdsByUser(userId),
        Tip.savedIdsByUser(userId),
      ]);
      tips.forEach(t => {
        t.liked = likedSet.has(t.id);
        t.saved = savedSet.has(t.id);
      });
    }

    res.json(tips);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar dicas.' });
  }
});

// GET /api/tips/categories
router.get('/categories', async (_req, res) => {
  try {
    const rows = await Category.findAll();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar categorias.' });
  }
});

// POST /api/tips  (admin)
router.post('/', adminMiddleware, async (req, res) => {
  const { title, description, category_id } = req.body;
  if (!title || !description)
    return res.status(400).json({ error: 'Título e descrição são obrigatórios.' });
  try {
    const id = await Tip.create({
      title, description, category_id,
      author_id: req.user.id,
    });
    res.status(201).json({ id, message: 'Dica criada com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar dica.' });
  }
});

// PUT /api/tips/:id  (admin)
router.put('/:id', adminMiddleware, async (req, res) => {
  const { title, description, category_id } = req.body;
  try {
    await Tip.update(req.params.id, { title, description, category_id });
    res.json({ message: 'Dica atualizada.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar dica.' });
  }
});

// DELETE /api/tips/:id  (admin)
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    await Tip.delete(req.params.id);
    res.json({ message: 'Dica removida.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao remover dica.' });
  }
});

// POST /api/tips/:id/like  (toggle)
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const liked = await Tip.toggleLike(req.user.id, +req.params.id);
    res.json({ liked });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao registrar curtida.' });
  }
});

// POST /api/tips/:id/save  (toggle)
router.post('/:id/save', authMiddleware, async (req, res) => {
  try {
    const saved = await Tip.toggleSave(req.user.id, +req.params.id);
    res.json({ saved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao salvar dica.' });
  }
});

// GET /api/tips/:id/comments
router.get('/:id/comments', async (req, res) => {
  try {
    const rows = await Comment.findByTip(req.params.id);
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
    const id = await Comment.create({
      tip_id: req.params.id,
      user_id: req.user.id,
      content,
    });
    res.status(201).json({ id, content, author: req.user.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao publicar comentário.' });
  }
});

module.exports = router;
