/**
 * Model: Badge
 * Encapsula operações das tabelas `badges` e `user_badges`.
 *
 * Também concentra a lógica de avaliação de conquistas:
 * dado o estado atual do usuário, decide quais badges devem
 * ser concedidas após o registro de uma nova ação.
 */
const db = require('../config/db');

/** IDs das badges no schema (devem corresponder aos seeds em schema.sql). */
const BADGE_IDS = {
  PRIMEIRO_PASSO:   1,
  RECICLADOR:       2,
  TRANSPORTE_VERDE: 3,
};

const Badge = {
  BADGE_IDS,

  /** Lista todas as badges existentes. */
  async findAll() {
    const [rows] = await db.query('SELECT * FROM badges');
    return rows;
  },

  /** Lista os pares (badge_id, earned_at) que o usuário já conquistou. */
  async earnedByUser(userId) {
    const [rows] = await db.query(
      'SELECT badge_id, earned_at FROM user_badges WHERE user_id = ?',
      [userId]
    );
    return rows;
  },

  /**
   * Combina todas as badges com o estado de "conquistadas" para um usuário.
   * Retorna lista enriquecida com `earned: bool` e `earned_at`.
   */
  async listWithStatus(userId) {
    const [all, earned] = await Promise.all([
      Badge.findAll(),
      Badge.earnedByUser(userId),
    ]);
    const earnedMap = new Map(earned.map(e => [e.badge_id, e.earned_at]));
    return all.map(b => ({
      ...b,
      earned: earnedMap.has(b.id),
      earned_at: earnedMap.get(b.id) || null,
    }));
  },

  /** Concede uma badge ao usuário. Idempotente (INSERT IGNORE). */
  async award(userId, badgeId) {
    try {
      await db.query(
        'INSERT IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)',
        [userId, badgeId]
      );
    } catch {
      /* duplicatas são ignoradas silenciosamente */
    }
  },

  /**
   * Avalia e concede automaticamente badges com base no estado atual do usuário.
   * Recebe os contadores (já consultados pelo controlador/rota) para evitar
   * acoplamento direto com EcoAction aqui.
   *
   * @param {number} userId
   * @param {{ totalActions:number, recycleCount:number, transportCount:number }} stats
   */
  async evaluateAndAward(userId, stats) {
    const { totalActions = 0, recycleCount = 0, transportCount = 0 } = stats;
    if (totalActions   >= 1)  await Badge.award(userId, BADGE_IDS.PRIMEIRO_PASSO);
    if (recycleCount   >= 10) await Badge.award(userId, BADGE_IDS.RECICLADOR);
    if (transportCount >= 5)  await Badge.award(userId, BADGE_IDS.TRANSPORTE_VERDE);
  },
};

module.exports = Badge;
