/**
 * Testes unitários — Model Comment.
 */
const db = require('../../config/db');
const Comment = require('../../models/Comment');

beforeEach(() => db.__reset());

describe('Comment.create', () => {
  it('insere comentário e retorna id', async () => {
    db.__mockResolve({ insertId: 88 });

    const id = await Comment.create({ tip_id: 5, user_id: 1, content: 'Boa dica!' });

    expect(id).toBe(88);
    const [sql, params] = db.__getCalls()[0];
    expect(sql).toMatch(/INSERT INTO comments/);
    expect(params).toEqual([5, 1, 'Boa dica!']);
  });
});

describe('Comment.findByTip', () => {
  it('lista comentários ordenados por data desc', async () => {
    db.__mockResolve([
      { id: 1, content: 'A', author: 'Ana' },
      { id: 2, content: 'B', author: 'Bia' },
    ]);

    const rows = await Comment.findByTip(7);

    expect(rows).toHaveLength(2);
    const [sql, params] = db.__getCalls()[0];
    expect(sql).toMatch(/ORDER BY cm.created_at DESC/);
    expect(params).toEqual([7]);
  });
});

describe('Comment.toggleFlag', () => {
  it('inverte a flag de um comentário', async () => {
    db.__mockResolve({ affectedRows: 1 });

    await Comment.toggleFlag(99);

    const [sql, params] = db.__getCalls()[0];
    expect(sql).toMatch(/SET flagged = NOT flagged/);
    expect(params).toEqual([99]);
  });
});

describe('Comment.countFlagged', () => {
  it('retorna a contagem de comentários sinalizados', async () => {
    db.__mockResolve([{ total: 4 }]);

    const n = await Comment.countFlagged();

    expect(n).toBe(4);
  });
});
