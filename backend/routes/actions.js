const router = require('express').Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// CO₂ impact table (kg per action)
const CO2_MAP = {
  'Usei transporte público':      2.30,
  'Reciclei resíduos':            1.80,
  'Economizei água':              0.50,
  'Reduzi consumo elétrico':      1.20,
  'Comprei produto sustentável':  0.80,
  'Andei de bicicleta':           1.50,
  'Plantei algo':                 0.60,
};
const POINTS_PER_ACTION = 100;

// GET /api/actions  — user's own history
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, action_type, icon, co2_saved, points_earned, created_at
       FROM eco_actions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    const [[totals]] = await db.query(
      `SELECT COUNT(*) AS total_actions, COALESCE(SUM(co2_saved),0) AS total_co2,
              COALESCE(SUM(points_earned),0) AS total_points
       FROM eco_actions WHERE user_id = ?`,
      [req.user.id]
    );
    res.json({ actions: rows, totals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar ações.' });
  }
});

// POST /api/actions  — register a new action
router.post('/', authMiddleware, async (req, res) => {
  const { action_type, icon } = req.body;
  if (!action_type) return res.status(400).json({ error: 'Tipo de ação é obrigatório.' });

  const co2     = CO2_MAP[action_type] ?? 0.50;
  const pts     = POINTS_PER_ACTION;
  const userId  = req.user.id;

  try {
    const [r] = await db.query(
      'INSERT INTO eco_actions (user_id, action_type, icon, co2_saved, points_earned) VALUES (?,?,?,?,?)',
      [userId, action_type, icon || 'leaf', co2, pts]
    );

    // update user points
    await db.query('UPDATE users SET points = points + ? WHERE id = ?', [pts, userId]);

    // --- check & award badges ---
    const [{ total }] = (await db.query(
      'SELECT COUNT(*) AS total FROM eco_actions WHERE user_id = ?', [userId]
    ))[0];

    // Badge: Primeiro Passo (1 action)
    if (total >= 1) await awardBadge(userId, 1);

    // Badge: Reciclador (10 recycle actions)
    const [[{ recycleCount }]] = await db.query(
      `SELECT COUNT(*) AS recycleCount FROM eco_actions WHERE user_id=? AND action_type='Reciclei resíduos'`,
      [userId]
    );
    if (recycleCount >= 10) await awardBadge(userId, 2);

    // Badge: Transporte Verde (5 transport actions)
    const [[{ transportCount }]] = await db.query(
      `SELECT COUNT(*) AS transportCount FROM eco_actions WHERE user_id=? AND action_type='Usei transporte público'`,
      [userId]
    );
    if (transportCount >= 5) await awardBadge(userId, 3);

    res.status(201).json({
      id: r.insertId, action_type, icon: icon || 'leaf',
      co2_saved: co2, points_earned: pts, message: `+${pts} pontos ecológicos!`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao registrar ação.' });
  }
});

async function awardBadge(userId, badgeId) {
  try {
    await db.query(
      'INSERT IGNORE INTO user_badges (user_id, badge_id) VALUES (?,?)',
      [userId, badgeId]
    );
  } catch { /* ignore duplicates */ }
}

// GET /api/actions/badges  — user badges
router.get('/badges', authMiddleware, async (req, res) => {
  try {
    const [all] = await db.query('SELECT * FROM badges');
    const [earned] = await db.query(
      'SELECT badge_id, earned_at FROM user_badges WHERE user_id = ?', [req.user.id]
    );
    const earnedSet = new Map(earned.map(e => [e.badge_id, e.earned_at]));
    const result = all.map(b => ({
      ...b, earned: earnedSet.has(b.id), earned_at: earnedSet.get(b.id) || null
    }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar conquistas.' });
  }
});

module.exports = router;
