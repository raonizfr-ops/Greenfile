/**
 * Model: EcoAction
 * Encapsula operações da tabela `eco_actions` (ações ecológicas dos usuários).
 *
 * Também expõe a tabela de impacto CO₂ por tipo de ação, que antes vivia
 * dentro do arquivo de rotas. Manter aqui deixa a regra de negócio
 * (quanto CO₂ cada ação economiza) próxima dos dados.
 */
const db = require('../config/db');

/** Tabela de impacto: kg de CO₂ economizado por tipo de ação. */
const CO2_MAP = {
  'Usei transporte público':      2.30,
  'Reciclei resíduos':            1.80,
  'Economizei água':              0.50,
  'Reduzi consumo elétrico':      1.20,
  'Comprei produto sustentável':  0.80,
  'Andei de bicicleta':           1.50,
  'Plantei algo':                 0.60,
};
const DEFAULT_CO2 = 0.50;
const POINTS_PER_ACTION = 100;

const EcoAction = {
  CO2_MAP,
  DEFAULT_CO2,
  POINTS_PER_ACTION,

  /** Calcula o CO₂ economizado para um determinado tipo de ação. */
  computeCo2(actionType) {
    return CO2_MAP[actionType] ?? DEFAULT_CO2;
  },

  /** Cria uma nova ação ecológica e retorna o id. */
  async create({ user_id, action_type, icon, co2_saved, points_earned }) {
    const [r] = await db.query(
      `INSERT INTO eco_actions
        (user_id, action_type, icon, co2_saved, points_earned)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, action_type, icon || 'leaf', co2_saved, points_earned]
    );
    return r.insertId;
  },

  /** Histórico recente do usuário (50 mais recentes). */
  async findByUser(userId) {
    const [rows] = await db.query(
      `SELECT id, action_type, icon, co2_saved, points_earned, created_at
       FROM eco_actions
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );
    return rows;
  },

  /** Totais agregados do usuário (ações, CO₂, pontos). */
  async getTotalsByUser(userId) {
    const [[totals]] = await db.query(
      `SELECT COUNT(*) AS total_actions,
              COALESCE(SUM(co2_saved), 0)     AS total_co2,
              COALESCE(SUM(points_earned), 0) AS total_points
       FROM eco_actions
       WHERE user_id = ?`,
      [userId]
    );
    return totals;
  },

  /** Conta quantas ações de um tipo específico um usuário registrou. */
  async countByType(userId, actionType) {
    const [[row]] = await db.query(
      'SELECT COUNT(*) AS total FROM eco_actions WHERE user_id = ? AND action_type = ?',
      [userId, actionType]
    );
    return row.total;
  },

  /** Total global de ações (painel admin). */
  async countAll() {
    const [[row]] = await db.query('SELECT COUNT(*) AS total FROM eco_actions');
    return row.total;
  },

  /** Soma global de CO₂ economizado (painel admin). */
  async sumCo2() {
    const [[row]] = await db.query(
      'SELECT COALESCE(SUM(co2_saved), 0) AS total FROM eco_actions'
    );
    return +row.total;
  },

  /** Ações por mês (últimos 7 meses) — usado em gráfico admin. */
  async monthlyStats() {
    const [rows] = await db.query(`
      SELECT DATE_FORMAT(created_at, '%b') AS month,
             MONTH(created_at)             AS month_num,
             COUNT(*)                       AS total
      FROM eco_actions
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 MONTH)
      GROUP BY month_num, month
      ORDER BY month_num ASC
      LIMIT 7
    `);
    return rows;
  },

  /** Distribuição de ações por categoria (painel admin). */
  async byCategory() {
    const [rows] = await db.query(`
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
    return rows;
  },
};

module.exports = EcoAction;
