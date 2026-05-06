/**
 * Testes unitários — Model User.
 *
 * Estes testes validam o contrato do model isoladamente, com `db.query`
 * mockado. Servem como especificação executável: quem ler estes testes
 * entende o que cada método deve fazer sem precisar abrir o banco.
 */
const db = require('../../config/db'); // mockado via tests/setup.js
const User = require('../../models/User');

beforeEach(() => db.__reset());

describe('User.findByEmail', () => {
  it('deve retornar o usuário quando o email existe', async () => {
    db.__mockResolve([{ id: 1, name: 'Ana', email: 'ana@x.com' }]);

    const user = await User.findByEmail('ana@x.com');

    expect(user).toEqual({ id: 1, name: 'Ana', email: 'ana@x.com' });
    const [sql, params] = db.__getCalls()[0];
    expect(sql).toMatch(/SELECT \* FROM users WHERE email = \?/);
    expect(params).toEqual(['ana@x.com']);
  });

  it('deve retornar null quando o email não existe', async () => {
    db.__mockResolve([]);
    const user = await User.findByEmail('nao@existe.com');
    expect(user).toBeNull();
  });
});

describe('User.create', () => {
  it('deve inserir e devolver o id gerado', async () => {
    db.__mockResolve({ insertId: 42 });

    const id = await User.create({
      name: 'Bia', email: 'bia@x.com', password_hash: 'hash',
    });

    expect(id).toBe(42);
    const [sql, params] = db.__getCalls()[0];
    expect(sql).toMatch(/INSERT INTO users/);
    expect(params).toEqual(['Bia', 'bia@x.com', 'hash']);
  });
});

describe('User.addPoints', () => {
  it('deve somar pontos ao usuário', async () => {
    db.__mockResolve({ affectedRows: 1 });
    await User.addPoints(7, 100);

    const [sql, params] = db.__getCalls()[0];
    expect(sql).toMatch(/UPDATE users SET points = points \+ \?/);
    expect(params).toEqual([100, 7]);
  });
});

describe('User.updateStatus', () => {
  it('só atualiza usuários comuns (cláusula role="user")', async () => {
    db.__mockResolve({ affectedRows: 1 });
    await User.updateStatus(3, 'banido');

    const [sql, params] = db.__getCalls()[0];
    expect(sql).toMatch(/role = "user"/);
    expect(params).toEqual(['banido', 3]);
  });
});

describe('User.findProfileWithStats', () => {
  it('deve retornar perfil com agregados', async () => {
    db.__mockResolve([{
      id: 1, name: 'Ana', email: 'ana@x.com',
      role: 'user', points: 200, status: 'ativo',
      total_actions: 5, total_co2: 3.7,
    }]);

    const profile = await User.findProfileWithStats(1);

    expect(profile.total_actions).toBe(5);
    expect(profile.total_co2).toBe(3.7);
  });

  it('deve retornar null quando usuário não existe', async () => {
    db.__mockResolve([]);
    const profile = await User.findProfileWithStats(999);
    expect(profile).toBeNull();
  });
});
