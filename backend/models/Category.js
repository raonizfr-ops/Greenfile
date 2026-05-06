/**
 * Model: Category
 * Encapsula operações da tabela `categories`.
 */
const db = require('../config/db');

const Category = {
  /** Lista todas as categorias. */
  async findAll() {
    const [rows] = await db.query('SELECT * FROM categories');
    return rows;
  },

  /** Busca categoria pelo id. */
  async findById(id) {
    const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [id]);
    return rows[0] || null;
  },
};

module.exports = Category;
