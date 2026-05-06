/**
 * Testes unitários — Model EcoAction.
 */
const db = require('../../config/db');
const EcoAction = require('../../models/EcoAction');

beforeEach(() => db.__reset());

describe('EcoAction.computeCo2', () => {
  it('retorna o valor da tabela CO2_MAP para tipos conhecidos', () => {
    expect(EcoAction.computeCo2('Reciclei resíduos')).toBe(1.80);
    expect(EcoAction.computeCo2('Andei de bicicleta')).toBe(1.50);
    expect(EcoAction.computeCo2('Usei transporte público')).toBe(2.30);
  });

  it('retorna o valor padrão para tipos não mapeados', () => {
    expect(EcoAction.computeCo2('Ação inventada qualquer')).toBe(EcoAction.DEFAULT_CO2);
  });
});

describe('EcoAction.create', () => {
  it('insere ação e retorna id', async () => {
    db.__mockResolve({ insertId: 99 });

    const id = await EcoAction.create({
      user_id: 1,
      action_type: 'Plantei algo',
      icon: '🌱',
      co2_saved: 0.6,
      points_earned: 100,
    });

    expect(id).toBe(99);
    const [sql, params] = db.__getCalls()[0];
    expect(sql).toMatch(/INSERT INTO eco_actions/);
    expect(params).toEqual([1, 'Plantei algo', '🌱', 0.6, 100]);
  });

  it('usa "leaf" como ícone padrão quando não fornecido', async () => {
    db.__mockResolve({ insertId: 100 });

    await EcoAction.create({
      user_id: 1, action_type: 'X',
      co2_saved: 1, points_earned: 100,
    });

    const [, params] = db.__getCalls()[0];
    expect(params[2]).toBe('leaf');
  });
});

describe('EcoAction.findByUser', () => {
  it('lista até 50 ações ordenadas pela data desc', async () => {
    db.__mockResolve([
      { id: 1, action_type: 'A', co2_saved: 1, points_earned: 100 },
      { id: 2, action_type: 'B', co2_saved: 2, points_earned: 100 },
    ]);

    const rows = await EcoAction.findByUser(7);

    expect(rows).toHaveLength(2);
    const [sql, params] = db.__getCalls()[0];
    expect(sql).toMatch(/ORDER BY created_at DESC/);
    expect(sql).toMatch(/LIMIT 50/);
    expect(params).toEqual([7]);
  });
});

describe('EcoAction.getTotalsByUser', () => {
  it('retorna agregados de ações, co2 e pontos', async () => {
    db.__mockResolve([{ total_actions: 10, total_co2: 12.5, total_points: 1000 }]);

    const totals = await EcoAction.getTotalsByUser(1);

    expect(totals).toEqual({ total_actions: 10, total_co2: 12.5, total_points: 1000 });
  });
});

describe('EcoAction.countByType', () => {
  it('conta ações de um tipo específico para um usuário', async () => {
    db.__mockResolve([{ total: 4 }]);

    const n = await EcoAction.countByType(1, 'Reciclei resíduos');

    expect(n).toBe(4);
    const [, params] = db.__getCalls()[0];
    expect(params).toEqual([1, 'Reciclei resíduos']);
  });
});
