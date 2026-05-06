/**
 * Testes de integração — rotas /api/tips.
 */
const request = require('supertest');
const jwt = require('jsonwebtoken');

const db = require('../../config/db');
const createApp = require('../../app');

const SECRET = process.env.JWT_SECRET || 'greenlife_secret_2024';
const app = createApp();

const userToken  = jwt.sign({ id: 1, name: 'Ana', email: 'a@b.com', role: 'user' },  SECRET, { expiresIn: '1h' });
const adminToken = jwt.sign({ id: 9, name: 'Adm', email: 'adm@x.com', role: 'admin' }, SECRET, { expiresIn: '1h' });

beforeEach(() => db.__reset());

describe('GET /api/tips', () => {
  it('200 lista pública sem autenticação', async () => {
    db.__mockResolve([
      { id: 1, title: 'A', likes: 0, comments: 0 },
      { id: 2, title: 'B', likes: 0, comments: 0 },
    ]);

    const res = await request(app).get('/api/tips');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('enriquece com flags liked/saved quando userId é informado', async () => {
    db.__mockResolve([
      { id: 1, title: 'A' },
      { id: 2, title: 'B' },
    ]);
    db.__mockResolve([{ tip_id: 1 }]); // liked
    db.__mockResolve([{ tip_id: 2 }]); // saved

    const res = await request(app).get('/api/tips?userId=7');

    expect(res.status).toBe(200);
    expect(res.body[0].liked).toBe(true);
    expect(res.body[0].saved).toBe(false);
    expect(res.body[1].liked).toBe(false);
    expect(res.body[1].saved).toBe(true);
  });
});

describe('POST /api/tips (admin)', () => {
  it('401 sem token', async () => {
    const res = await request(app).post('/api/tips').send({ title: 'T', description: 'D' });
    expect(res.status).toBe(401);
  });

  it('403 com token de usuário comum', async () => {
    const res = await request(app)
      .post('/api/tips')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'T', description: 'D' });
    expect(res.status).toBe(403);
  });

  it('400 sem campos obrigatórios mesmo sendo admin', async () => {
    const res = await request(app)
      .post('/api/tips')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'só título' });
    expect(res.status).toBe(400);
  });

  it('201 cria nova dica com admin', async () => {
    db.__mockResolve({ insertId: 33 });

    const res = await request(app)
      .post('/api/tips')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Nova dica', description: 'Detalhes', category_id: 1 });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(33);
  });
});

describe('POST /api/tips/:id/like', () => {
  it('toggle: insere quando ainda não curtiu', async () => {
    db.__mockResolve([]); // SELECT 1 → não existe
    db.__mockResolve({ affectedRows: 1 }); // INSERT

    const res = await request(app)
      .post('/api/tips/5/like')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.liked).toBe(true);
  });

  it('toggle: remove quando já curtiu', async () => {
    db.__mockResolve([{ 1: 1 }]); // SELECT 1 → existe
    db.__mockResolve({ affectedRows: 1 }); // DELETE

    const res = await request(app)
      .post('/api/tips/5/like')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.liked).toBe(false);
  });
});

describe('POST /api/tips/:id/comments', () => {
  it('400 quando content vazio', async () => {
    const res = await request(app)
      .post('/api/tips/5/comments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ content: '' });
    expect(res.status).toBe(400);
  });

  it('201 cria comentário', async () => {
    db.__mockResolve({ insertId: 77 });

    const res = await request(app)
      .post('/api/tips/5/comments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ content: 'Boa dica!' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(77);
    expect(res.body.author).toBe('Ana');
  });
});
