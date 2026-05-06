/**
 * Model: Tip
 * Encapsula operações das tabelas `tips`, `tip_likes` e `tip_saves`.
 */
const db = require('../config/db');

const Tip = {
  /** Lista dicas com agregações (likes, comentários, autor, categoria). */
  async findAll({ category = null } = {}) {
    let sql = `
      SELECT t.id, t.title, t.description, t.created_at,
             c.name AS category, c.color AS category_color, c.icon AS category_icon,
             u.name AS author,
             COUNT(DISTINCT tl.user_id) AS likes,
             COUNT(DISTINCT cm.id)       AS comments
      FROM tips t
      LEFT JOIN categories c ON c.id = t.category_id
      LEFT JOIN users u      ON u.id = t.author_id
      LEFT JOIN tip_likes tl ON tl.tip_id = t.id
      LEFT JOIN comments cm  ON cm.tip_id = t.id
    `;
    const params = [];
    if (category) {
      sql += ' WHERE c.name = ?';
      params.push(category);
    }
    sql += ' GROUP BY t.id ORDER BY t.created_at DESC';
    const [rows] = await db.query(sql, params);
    return rows;
  },

  /** Para um usuário, retorna o conjunto de ids que ele curtiu. */
  async likedIdsByUser(userId) {
    const [rows] = await db.query('SELECT tip_id FROM tip_likes WHERE user_id = ?', [userId]);
    return new Set(rows.map(r => r.tip_id));
  },

  /** Para um usuário, retorna o conjunto de ids que ele salvou. */
  async savedIdsByUser(userId) {
    const [rows] = await db.query('SELECT tip_id FROM tip_saves WHERE user_id = ?', [userId]);
    return new Set(rows.map(r => r.tip_id));
  },

  /** Cria nova dica e retorna o id. */
  async create({ title, description, category_id, author_id }) {
    const [r] = await db.query(
      'INSERT INTO tips (title, description, category_id, author_id) VALUES (?, ?, ?, ?)',
      [title, description, category_id || null, author_id]
    );
    return r.insertId;
  },

  /** Atualiza uma dica existente. */
  async update(id, { title, description, category_id }) {
    await db.query(
      'UPDATE tips SET title = ?, description = ?, category_id = ? WHERE id = ?',
      [title, description, category_id || null, id]
    );
  },

  /** Remove uma dica. */
  async delete(id) {
    await db.query('DELETE FROM tips WHERE id = ?', [id]);
  },

  /** Total de dicas (painel admin). */
  async countAll() {
    const [[row]] = await db.query('SELECT COUNT(*) AS total FROM tips');
    return row.total;
  },

  /** Alterna curtida do usuário em uma dica. Retorna o estado final (liked: bool). */
  async toggleLike(userId, tipId) {
    const [exists] = await db.query(
      'SELECT 1 FROM tip_likes WHERE user_id = ? AND tip_id = ?',
      [userId, tipId]
    );
    if (exists.length > 0) {
      await db.query('DELETE FROM tip_likes WHERE user_id = ? AND tip_id = ?', [userId, tipId]);
      return false;
    }
    await db.query('INSERT INTO tip_likes (user_id, tip_id) VALUES (?, ?)', [userId, tipId]);
    return true;
  },

  /** Alterna "salvar" do usuário em uma dica. Retorna o estado final (saved: bool). */
  async toggleSave(userId, tipId) {
    const [exists] = await db.query(
      'SELECT 1 FROM tip_saves WHERE user_id = ? AND tip_id = ?',
      [userId, tipId]
    );
    if (exists.length > 0) {
      await db.query('DELETE FROM tip_saves WHERE user_id = ? AND tip_id = ?', [userId, tipId]);
      return false;
    }
    await db.query('INSERT INTO tip_saves (user_id, tip_id) VALUES (?, ?)', [userId, tipId]);
    return true;
  },
};

module.exports = Tip;
