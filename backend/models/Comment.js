/**
 * Model: Comment
 * Encapsula operações da tabela `comments`.
 */
const db = require('../config/db');

const Comment = {
  /** Lista comentários de uma dica, mais recentes primeiro. */
  async findByTip(tipId) {
    const [rows] = await db.query(
      `SELECT cm.id, cm.content, cm.flagged, cm.created_at, u.name AS author
       FROM comments cm
       JOIN users u ON u.id = cm.user_id
       WHERE cm.tip_id = ?
       ORDER BY cm.created_at DESC`,
      [tipId]
    );
    return rows;
  },

  /** Cria comentário e retorna o id. */
  async create({ tip_id, user_id, content }) {
    const [r] = await db.query(
      'INSERT INTO comments (tip_id, user_id, content) VALUES (?, ?, ?)',
      [tip_id, user_id, content]
    );
    return r.insertId;
  },

  /** Lista comentários para moderação (flagged primeiro). */
  async listForModeration(limit = 50) {
    const [rows] = await db.query(
      `SELECT cm.id, cm.content, cm.flagged, cm.created_at,
              u.name AS author, t.title AS tip_title
       FROM comments cm
       JOIN users u ON u.id = cm.user_id
       JOIN tips  t ON t.id = cm.tip_id
       ORDER BY cm.flagged DESC, cm.created_at DESC
       LIMIT ?`,
      [limit]
    );
    return rows;
  },

  /** Inverte a flag de moderação de um comentário. */
  async toggleFlag(id) {
    await db.query('UPDATE comments SET flagged = NOT flagged WHERE id = ?', [id]);
  },

  /** Remove um comentário. */
  async delete(id) {
    await db.query('DELETE FROM comments WHERE id = ?', [id]);
  },

  /** Conta comentários sinalizados (painel admin). */
  async countFlagged() {
    const [[row]] = await db.query(
      'SELECT COUNT(*) AS total FROM comments WHERE flagged = 1'
    );
    return row.total;
  },
};

module.exports = Comment;
