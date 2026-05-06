/**
 * Testes unitários — Model Badge.
 *
 * O método `evaluateAndAward` é o coração do sistema de gamificação:
 * recebe contadores e decide quais conquistas conceder. É exatamente
 * o tipo de regra de negócio que se beneficia de TDD.
 */
const db = require('../../config/db');
const Badge = require('../../models/Badge');

beforeEach(() => db.__reset());

describe('Badge.evaluateAndAward', () => {
  it('concede "Primeiro Passo" na 1ª ação', async () => {
    db.__mockResolve({ affectedRows: 1 }); // INSERT IGNORE

    await Badge.evaluateAndAward(1, {
      totalActions: 1, recycleCount: 0, transportCount: 0,
    });

    const calls = db.__getCalls();
    expect(calls).toHaveLength(1);
    const [sql, params] = calls[0];
    expect(sql).toMatch(/INSERT IGNORE INTO user_badges/);
    expect(params).toEqual([1, Badge.BADGE_IDS.PRIMEIRO_PASSO]);
  });

  it('NÃO concede "Reciclador" com menos de 10 reciclagens', async () => {
    // Ainda haverá tentativa de PRIMEIRO_PASSO; mas não RECICLADOR.
    db.__mockResolve({ affectedRows: 1 });

    await Badge.evaluateAndAward(1, {
      totalActions: 5, recycleCount: 9, transportCount: 0,
    });

    const inserts = db.__getCalls().filter(([sql]) => /user_badges/.test(sql));
    expect(inserts).toHaveLength(1); // só primeiro passo
    expect(inserts[0][1][1]).toBe(Badge.BADGE_IDS.PRIMEIRO_PASSO);
  });

  it('concede "Reciclador" exatamente na 10ª reciclagem', async () => {
    db.__mockResolve({ affectedRows: 1 }); // PRIMEIRO_PASSO
    db.__mockResolve({ affectedRows: 1 }); // RECICLADOR

    await Badge.evaluateAndAward(1, {
      totalActions: 10, recycleCount: 10, transportCount: 0,
    });

    const inserts = db.__getCalls().filter(([sql]) => /user_badges/.test(sql));
    expect(inserts).toHaveLength(2);
    const badgeIds = inserts.map(([, p]) => p[1]);
    expect(badgeIds).toContain(Badge.BADGE_IDS.RECICLADOR);
  });

  it('concede "Transporte Verde" na 5ª viagem', async () => {
    db.__mockResolve({}); db.__mockResolve({}); db.__mockResolve({});

    await Badge.evaluateAndAward(1, {
      totalActions: 5, recycleCount: 0, transportCount: 5,
    });

    const inserts = db.__getCalls().filter(([sql]) => /user_badges/.test(sql));
    const badgeIds = inserts.map(([, p]) => p[1]);
    expect(badgeIds).toContain(Badge.BADGE_IDS.TRANSPORTE_VERDE);
  });

  it('concede múltiplas conquistas simultaneamente quando elegível', async () => {
    // 3 inserts esperados
    db.__mockResolve({}); db.__mockResolve({}); db.__mockResolve({});

    await Badge.evaluateAndAward(1, {
      totalActions: 20, recycleCount: 15, transportCount: 8,
    });

    const inserts = db.__getCalls().filter(([sql]) => /user_badges/.test(sql));
    const badgeIds = inserts.map(([, p]) => p[1]).sort();
    expect(badgeIds).toEqual([
      Badge.BADGE_IDS.PRIMEIRO_PASSO,
      Badge.BADGE_IDS.RECICLADOR,
      Badge.BADGE_IDS.TRANSPORTE_VERDE,
    ].sort());
  });

  it('é idempotente: reexecutar não duplica (INSERT IGNORE garante)', async () => {
    db.__mockResolve({ affectedRows: 0 }); // simula duplicata

    await expect(
      Badge.evaluateAndAward(1, { totalActions: 1, recycleCount: 0, transportCount: 0 })
    ).resolves.not.toThrow();
  });
});

describe('Badge.listWithStatus', () => {
  it('marca cada badge com earned: true|false e earned_at', async () => {
    db.__mockResolve([
      { id: 1, name: 'Primeiro Passo', icon: '🌱' },
      { id: 2, name: 'Reciclador',     icon: '♻️' },
      { id: 3, name: 'Transporte Verde', icon: '🚌' },
    ]);
    db.__mockResolve([
      { badge_id: 1, earned_at: '2024-01-01' },
    ]);

    const list = await Badge.listWithStatus(7);

    expect(list).toHaveLength(3);
    expect(list.find(b => b.id === 1).earned).toBe(true);
    expect(list.find(b => b.id === 2).earned).toBe(false);
    expect(list.find(b => b.id === 3).earned_at).toBeNull();
  });
});
