/**
 * Testes de integração — rotas /api/admin.
 */
const request = require('supertest');
const jwt = require('jsonwebtoken');

const db = require('../../config/db');
const createApp = require('../../app');

const SECRET = process.env.JWT_SECRET || 'greenlife_secret_2024';
const app = createApp();

const userToken  = jwt.sign({ id: 1, role: 'user'  }, SECRET, { expiresIn: '1h' });
const adminToken = jwt.sign({ id: 9, role: 'admin' }, SECRET, { expiresIn: '1h' });

beforeEach(() => db.__reset());

describe('GET /api/admin/stats', () => {
  it('401 sem token', async () => {
    const res = await request(app).get('/api/admin/stats');
    expect(res.status).toBe(401);
  });

  it('403 para usuário comum', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('200 com agregados completos para admin', async () => {
    // ordem das queries: countUsers, countAll, sumCo2,
    //                    Tip.countAll, Comment.countFlagged,
    //                    monthlyStats, byCategory
    db.__mockResolve([{ total: 10 }]);
    db.__mockResolve([{ total: 50 }]);
    db.__mockResolve([{ total: 75.5 }]);
    db.__mockResolve([{ total: 6 }]);
    db.__mockResolve([{ total: 2 }]);
    db.__mockResolve([{ month: 'Jan', month_num: 1, total: 5 }]);
    db.__mockResolve([{ name: 'Reciclagem', total: 20 }]);

    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      total_users: 10,
      total_actions: 50,
      total_co2: 75.5,
      total_tips: 6,
      flagged_comments: 2,
    });
    expect(res.body.monthly).toHaveLength(1);
    expect(res.body.by_category).toHaveLength(1);
  });
});

describe('PUT /api/admin/users/:id/status', () => {
  it('400 com status inválido', async () => {
    const res = await request(app)
      .put('/api/admin/users/3/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'inventado' });
    expect(res.status).toBe(400);
  });

  it('200 com status válido', async () => {
    db.__mockResolve({ affectedRows: 1 });

    const res = await request(app)
      .put('/api/admin/users/3/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'banido' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/banido/);
  });
});

describe('DELETE /api/admin/users/:id', () => {
  it('200 remove usuário', async () => {
    db.__mockResolve({ affectedRows: 1 });

    const res = await request(app)
      .delete('/api/admin/users/3')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });
});

describe('GET /api/admin/comments', () => {
  it('200 lista comentários para moderação', async () => {
    db.__mockResolve([
      { id: 1, content: 'oi', flagged: 1, author: 'X', tip_title: 'T' },
    ]);

    const res = await request(app)
      .get('/api/admin/comments')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

describe('PUT /api/admin/comments/:id/flag', () => {
  it('200 inverte flag', async () => {
    db.__mockResolve({ affectedRows: 1 });

    const res = await request(app)
      .put('/api/admin/comments/5/flag')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });
});
