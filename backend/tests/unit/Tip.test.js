/**
 * Testes unitários — Model Tip.
 */
const db = require('../../config/db');
const Tip = require('../../models/Tip');

beforeEach(() => db.__reset());

describe('Tip.findAll', () => {
  it('retorna lista sem filtro', async () => {
    db.__mockResolve([
      { id: 1, title: 'Dica 1' },
      { id: 2, title: 'Dica 2' },
    ]);

    const tips = await Tip.findAll();

    expect(tips).toHaveLength(2);
    const [sql, params] = db.__getCalls()[0];
    expect(sql).not.toMatch(/WHERE c.name/);
    expect(params).toEqual([]);
  });

  it('aplica filtro de categoria quando informado', async () => {
    db.__mockResolve([{ id: 1, title: 'Dica de água', category: 'Água' }]);

    await Tip.findAll({ category: 'Água' });

    const [sql, params] = db.__getCalls()[0];
    expect(sql).toMatch(/WHERE c.name = \?/);
    expect(params).toEqual(['Água']);
  });
});

describe('Tip.toggleLike', () => {
  it('insere quando ainda não curtiu (retorna true)', async () => {
    db.__mockResolve([]);                    // SELECT 1 → não existe
    db.__mockResolve({ affectedRows: 1 });   // INSERT

    const liked = await Tip.toggleLike(1, 5);

    expect(liked).toBe(true);
    const calls = db.__getCalls();
    expect(calls[0][0]).toMatch(/SELECT 1 FROM tip_likes/);
    expect(calls[1][0]).toMatch(/INSERT INTO tip_likes/);
  });

  it('remove quando já curtiu (retorna false)', async () => {
    db.__mockResolve([{ 1: 1 }]);            // SELECT 1 → existe
    db.__mockResolve({ affectedRows: 1 });   // DELETE

    const liked = await Tip.toggleLike(1, 5);

    expect(liked).toBe(false);
    const calls = db.__getCalls();
    expect(calls[1][0]).toMatch(/DELETE FROM tip_likes/);
  });
});

describe('Tip.toggleSave', () => {
  it('insere quando ainda não salvou (retorna true)', async () => {
    db.__mockResolve([]);
    db.__mockResolve({ affectedRows: 1 });

    const saved = await Tip.toggleSave(1, 5);

    expect(saved).toBe(true);
    expect(db.__getCalls()[1][0]).toMatch(/INSERT INTO tip_saves/);
  });
});

describe('Tip.likedIdsByUser', () => {
  it('retorna um Set com os ids curtidos', async () => {
    db.__mockResolve([{ tip_id: 1 }, { tip_id: 5 }, { tip_id: 9 }]);

    const set = await Tip.likedIdsByUser(7);

    expect(set).toBeInstanceOf(Set);
    expect(set.size).toBe(3);
    expect(set.has(5)).toBe(true);
    expect(set.has(99)).toBe(false);
  });
});

describe('Tip.create', () => {
  it('insere e retorna id', async () => {
    db.__mockResolve({ insertId: 17 });

    const id = await Tip.create({
      title: 'T', description: 'D',
      category_id: 2, author_id: 1,
    });

    expect(id).toBe(17);
    const [, params] = db.__getCalls()[0];
    expect(params).toEqual(['T', 'D', 2, 1]);
  });

  it('usa null para category_id quando não informado', async () => {
    db.__mockResolve({ insertId: 18 });

    await Tip.create({ title: 'T', description: 'D', author_id: 1 });

    const [, params] = db.__getCalls()[0];
    expect(params[2]).toBeNull();
  });
});
