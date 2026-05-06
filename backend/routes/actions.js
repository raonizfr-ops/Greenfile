const router = require('express').Router();
const { User, EcoAction, Badge } = require('../models');
const { authMiddleware } = require('../middleware/auth');

// GET /api/actions  — histórico do próprio usuário
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [actions, totals] = await Promise.all([
      EcoAction.findByUser(req.user.id),
      EcoAction.getTotalsByUser(req.user.id),
    ]);
    res.json({ actions, totals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar ações.' });
  }
});

// POST /api/actions  — registra uma nova ação ecológica
router.post('/', authMiddleware, async (req, res) => {
  const { action_type, icon } = req.body;
  if (!action_type)
    return res.status(400).json({ error: 'Tipo de ação é obrigatório.' });

  const userId  = req.user.id;
  const co2     = EcoAction.computeCo2(action_type);
  const pts     = EcoAction.POINTS_PER_ACTION;

  try {
    const id = await EcoAction.create({
      user_id: userId,
      action_type,
      icon: icon || 'leaf',
      co2_saved: co2,
      points_earned: pts,
    });

    // Atualiza pontos do usuário
    await User.addPoints(userId, pts);

    // Avalia conquistas com base no estado atualizado do usuário
    const [totals, recycleCount, transportCount] = await Promise.all([
      EcoAction.getTotalsByUser(userId),
      EcoAction.countByType(userId, 'Reciclei resíduos'),
      EcoAction.countByType(userId, 'Usei transporte público'),
    ]);
    await Badge.evaluateAndAward(userId, {
      totalActions: totals.total_actions,
      recycleCount,
      transportCount,
    });

    res.status(201).json({
      id,
      action_type,
      icon: icon || 'leaf',
      co2_saved: co2,
      points_earned: pts,
      message: `+${pts} pontos ecológicos!`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao registrar ação.' });
  }
});

// GET /api/actions/badges  — conquistas do usuário
router.get('/badges', authMiddleware, async (req, res) => {
  try {
    const badges = await Badge.listWithStatus(req.user.id);
    res.json(badges);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar conquistas.' });
  }
});

module.exports = router;
