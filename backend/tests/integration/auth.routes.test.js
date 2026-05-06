/**
 * Testes de integração — rotas /api/auth.
 *
 * Estes testes sobem a aplicação Express com `supertest` e verificam
 * o comportamento HTTP completo (status, body, headers). O banco está
 * mockado, então só validamos a camada de rota + model.
 */
const request = require('supertest');
const bcrypt = require('bcryptjs');

const db = require('../../config/db');
const createApp = require('../../app');

const app = createApp();

beforeEach(() => db.__reset());

describe('POST /api/auth/register', () => {
  it('400 quando faltam campos obrigatórios', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@b.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/obrigatórios/i);
  });

  it('409 quando o email já existe', async () => {
    db.__mockResolve([{ id: 1, email: 'a@b.com' }]); // findByEmail → existe

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'A', email: 'a@b.com', password: '123' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/cadastrado/i);
  });

  it('201 e retorna token + user em registro válido', async () => {
    db.__mockResolve([]);                  // findByEmail → não existe
    db.__mockResolve({ insertId: 7 });     // create

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Nova', email: 'n@x.com', password: '123' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({ id: 7, email: 'n@x.com', role: 'user' });
  });
});

describe('POST /api/auth/login', () => {
  it('400 quando faltam credenciais', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  it('401 quando o usuário não existe', async () => {
    db.__mockResolve([]); // findByEmail vazio

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'x@x.com', password: 'y' });

    expect(res.status).toBe(401);
  });

  it('403 quando a conta está banida', async () => {
    db.__mockResolve([{
      id: 1, email: 'a@b.com', password_hash: 'h',
      role: 'user', status: 'banido', name: 'X',
    }]);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b.com', password: 'qualquer' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/banida/i);
  });

  it('401 quando a senha está incorreta', async () => {
    const hash = await bcrypt.hash('senha-correta', 10);
    db.__mockResolve([{
      id: 1, email: 'a@b.com', password_hash: hash,
      role: 'user', status: 'ativo', name: 'X',
    }]);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b.com', password: 'errada' });

    expect(res.status).toBe(401);
  });

  it('200 retorna token quando credenciais batem', async () => {
    const hash = await bcrypt.hash('senha123', 10);
    db.__mockResolve([{
      id: 1, email: 'a@b.com', password_hash: hash,
      role: 'user', status: 'ativo', name: 'Ana', points: 50,
    }]);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b.com', password: 'senha123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.name).toBe('Ana');
  });
});

describe('GET /api/auth/me', () => {
  it('401 sem token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('401 com token inválido', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not-a-token');
    expect(res.status).toBe(401);
  });
});
