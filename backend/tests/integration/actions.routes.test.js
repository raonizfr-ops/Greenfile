/**
 * Testes de integração — rotas /api/actions.
 */
const request = require('supertest');
const jwt = require('jsonwebtoken');

const db = require('../../config/db');
const createApp = require('../../app');

const SECRET = process.env.JWT_SECRET || 'greenlife_secret_2024';
const app = createApp();

function tokenFor(user = { id: 1, name: 'Ana', email: 'a@b.com', role: 'user' }) {
  return jwt.sign(user, SECRET, { expiresIn: '1h' });
}

beforeEach(() => db.__reset());

describe('GET /api/actions', () => {
  it('401 sem token', async () => {
    const res = await request(app).get('/api/actions');
    expect(res.status).toBe(401);
  });

  it('200 retorna actions + totals', async () => {
    db.__mockResolve([
      { id: 1, action_type: 'A', co2_saved: 1, points_earned: 100 },
    ]);
    db.__mockResolve([
      { total_actions: 1, total_co2: 1, total_points: 100 },
    ]);

    const res = await request(app)
      .get('/api/actions')
      .set('Authorization', `Bearer ${tokenFor()}`);

    expect(res.status).toBe(200);
    expect(res.body.actions).toHaveLength(1);
    expect(res.body.totals.total_points).toBe(100);
  });
});

describe('POST /api/actions', () => {
  it('400 sem action_type', async () => {
    const res = await request(app)
      .post('/api/actions')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('201 cria ação, soma pontos e responde com co2 calculado', async () => {
    // Sequência esperada de queries:
    db.__mockResolve({ insertId: 50 }); // EcoAction.create
    db.__mockResolve({ affectedRows: 1 });  // User.addPoints
    db.__mockResolve([{ total_actions: 1, total_co2: 1.8, total_points: 100 }]); // getTotalsByUser
    db.__mockResolve([{ total: 1 }]);   // countByType reciclagem
    db.__mockResolve([{ total: 0 }]);   // countByType transporte
    db.__mockResolve({});               // award PRIMEIRO_PASSO

    const res = await request(app)
      .post('/api/actions')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send({ action_type: 'Reciclei resíduos' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(50);
    expect(res.body.co2_saved).toBe(1.80);
    expect(res.body.points_earned).toBe(100);
    expect(res.body.message).toMatch(/100 pontos/);
  });
});

describe('GET /api/actions/badges', () => {
  it('401 sem token', async () => {
    const res = await request(app).get('/api/actions/badges');
    expect(res.status).toBe(401);
  });

  it('200 retorna lista de badges com status earned', async () => {
    db.__mockResolve([
      { id: 1, name: 'Primeiro Passo', icon: '🌱' },
      { id: 2, name: 'Reciclador',     icon: '♻️' },
    ]);
    db.__mockResolve([
      { badge_id: 1, earned_at: '2024-01-01' },
    ]);

    const res = await request(app)
      .get('/api/actions/badges')
      .set('Authorization', `Bearer ${tokenFor()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].earned).toBe(true);
    expect(res.body[1].earned).toBe(false);
  });
});
