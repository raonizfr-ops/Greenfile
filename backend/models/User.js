/**
 * Model: User
 * Encapsula todas as operações de banco da tabela `users`.
 * As rotas NÃO devem fazer queries diretas — devem chamar este model.
 */
const db = require('../config/db');

const User = {
  /** Busca usuário pelo email (retorna o registro completo, incluindo password_hash). */
  async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  },

  /** Busca usuário pelo id (sem password_hash, apenas dados públicos do perfil). */
  async findById(id) {
    const [rows] = await db.query(
      'SELECT id, name, email, role, status, points, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  /** Cria um novo usuário e retorna o id gerado. */
  async create({ name, email, password_hash }) {
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, password_hash]
    );
    return result.insertId;
  },

  /** Atualiza nome e email do usuário. */
  async updateProfile(id, { name, email }) {
    await db.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, id]);
  },

  /** Soma pontos ao usuário. */
  async addPoints(id, amount) {
    await db.query('UPDATE users SET points = points + ? WHERE id = ?', [amount, id]);
  },

  /** Atualiza status (ativo | suspenso | banido) — apenas para usuários comuns. */
  async updateStatus(id, status) {
    await db.query(
      'UPDATE users SET status = ? WHERE id = ? AND role = "user"',
      [status, id]
    );
  },

  /** Remove usuário (apenas comuns). */
  async delete(id) {
    await db.query('DELETE FROM users WHERE id = ? AND role = "user"', [id]);
  },

  /** Lista usuários comuns com filtro de busca por nome/email e contagem de ações. */
  async listWithStats(search = '%') {
    const [rows] = await db.query(
      `SELECT u.id, u.name, u.email, u.role, u.status, u.points, u.created_at,
              COUNT(DISTINCT a.id) AS total_actions
       FROM users u
       LEFT JOIN eco_actions a ON a.user_id = u.id
       WHERE (u.name LIKE ? OR u.email LIKE ?) AND u.role = 'user'
       GROUP BY u.id
       ORDER BY u.points DESC`,
      [search, search]
    );
    return rows;
  },

  /** Perfil completo + estatísticas agregadas (usado em GET /api/auth/me). */
  async findProfileWithStats(id) {
    const [rows] = await db.query(
      `SELECT u.id, u.name, u.email, u.role, u.points, u.status, u.created_at,
              COUNT(DISTINCT a.id) AS total_actions,
              COALESCE(SUM(a.co2_saved), 0) AS total_co2
       FROM users u
       LEFT JOIN eco_actions a ON a.user_id = u.id
       WHERE u.id = ?
       GROUP BY u.id`,
      [id]
    );
    return rows[0] || null;
  },

  /** Total de usuários comuns (para painel admin). */
  async countUsers() {
    const [[row]] = await db.query(
      'SELECT COUNT(*) AS total FROM users WHERE role = "user"'
    );
    return row.total;
  },
};

module.exports = User;
