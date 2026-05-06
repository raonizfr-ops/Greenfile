# Testes — GreenLife

Suíte de testes automatizados do backend, escrita com **Jest** + **Supertest** seguindo a abordagem **TDD (Test-Driven Development)**.

> **TL;DR para rodar:** `cd backend && npm install && npm test`

---

## 1. Estrutura

```
backend/tests/
├── __mocks__/
│   └── db.js              ← Mock do módulo de conexão MySQL
├── setup.js               ← Substitui o db real pelo mock em todos os testes
├── unit/                  ← Testam models isoladamente (regras de negócio)
│   ├── User.test.js
│   ├── EcoAction.test.js
│   ├── Tip.test.js
│   ├── Badge.test.js
│   └── Comment.test.js
└── integration/           ← Testam rotas HTTP completas com Supertest
    ├── auth.routes.test.js
    ├── actions.routes.test.js
    ├── tips.routes.test.js
    └── admin.routes.test.js
```

**67 testes** em **9 suítes**. Tempo médio de execução: ~2,5 segundos.

---

## 2. Pré-requisitos

- Node.js 18+
- npm 9+

**Não é necessário** ter MySQL rodando. Os testes usam um mock do módulo `config/db.js` — nenhuma query real é executada contra o banco.

---

## 3. Como rodar

### 3.1. Instalar dependências (uma vez)

```bash
cd backend
npm install
```

### 3.2. Comandos disponíveis

| Comando                    | O que faz                                                  |
|----------------------------|------------------------------------------------------------|
| `npm test`                 | Roda todos os testes (unit + integration)                  |
| `npm run test:unit`        | Apenas testes unitários dos models                         |
| `npm run test:integration` | Apenas testes das rotas HTTP                               |
| `npm run test:watch`       | Modo "watch": re-executa ao salvar um arquivo              |
| `npm run test:coverage`    | Gera relatório de cobertura em `coverage/lcov-report/`     |

### 3.3. Saída esperada

```
PASS tests/unit/User.test.js
PASS tests/unit/Comment.test.js
PASS tests/unit/Badge.test.js
PASS tests/unit/EcoAction.test.js
PASS tests/unit/Tip.test.js
PASS tests/integration/tips.routes.test.js
PASS tests/integration/auth.routes.test.js
PASS tests/integration/admin.routes.test.js
PASS tests/integration/actions.routes.test.js

Test Suites: 9 passed, 9 total
Tests:       67 passed, 67 total
```

---

## 4. Estratégia (TDD)

A suíte foi escrita seguindo o ciclo **Red → Green → Refactor**:

1. **Red** — escrevemos primeiro o teste que descreve o comportamento esperado.
2. **Green** — implementamos o mínimo de código no model/rota para passar.
3. **Refactor** — limpamos o código mantendo todos os testes verdes.

Por exemplo, a regra de gamificação no `Badge.evaluateAndAward` foi construída a partir destes casos (em `tests/unit/Badge.test.js`):

- "concede 'Primeiro Passo' na 1ª ação"
- "NÃO concede 'Reciclador' com menos de 10 reciclagens"
- "concede 'Reciclador' exatamente na 10ª reciclagem"
- "é idempotente: reexecutar não duplica"

Os testes funcionam como **especificação executável** do que o sistema faz.

---

## 5. Como o mock do banco funciona

O arquivo `tests/__mocks__/db.js` substitui `config/db.js` durante os testes. Em vez de conectar no MySQL, ele expõe um `db.query` que devolve o que o teste enfileirar.

**Exemplo:**

```javascript
const db = require('../../config/db'); // já mockado

it('retorna usuário pelo email', async () => {
  // 1. Enfileira o que a próxima query deve retornar
  db.__mockResolve([{ id: 1, name: 'Ana', email: 'ana@x.com' }]);

  // 2. Chama o método real do model
  const user = await User.findByEmail('ana@x.com');

  // 3. Verifica retorno
  expect(user.name).toBe('Ana');

  // 4. Verifica que a query SQL correta foi montada
  const [sql, params] = db.__getCalls()[0];
  expect(sql).toMatch(/SELECT \* FROM users WHERE email = \?/);
  expect(params).toEqual(['ana@x.com']);
});
```

API do mock:

| Método                    | Descrição                                              |
|---------------------------|--------------------------------------------------------|
| `db.__reset()`            | Limpa fila e histórico (chame em `beforeEach`)         |
| `db.__mockResolve(rows)`  | Enfileira retorno bem-sucedido                         |
| `db.__mockReject(err)`    | Enfileira uma exceção                                  |
| `db.__getCalls()`         | Retorna `[[sql, params], ...]` das chamadas registradas |

---

## 6. Como adicionar um teste novo

### 6.1. Teste de model (unit)

Crie `backend/tests/unit/MeuModel.test.js`:

```javascript
const db = require('../../config/db');
const MeuModel = require('../../models/MeuModel');

beforeEach(() => db.__reset());

describe('MeuModel.metodo', () => {
  it('faz X', async () => {
    db.__mockResolve([{ id: 1 }]);
    const r = await MeuModel.metodo();
    expect(r).toBeDefined();
  });
});
```

### 6.2. Teste de rota (integration)

Crie `backend/tests/integration/minha.routes.test.js`:

```javascript
const request = require('supertest');
const db = require('../../config/db');
const createApp = require('../../app');

const app = createApp();
beforeEach(() => db.__reset());

it('GET /api/algo retorna 200', async () => {
  db.__mockResolve([{ id: 1 }]);
  const res = await request(app).get('/api/algo');
  expect(res.status).toBe(200);
});
```

---

## 7. Cobertura atual

Após `npm run test:coverage`:

| Camada     | Statements | Branches | Funções | Linhas |
|------------|-----------:|---------:|--------:|-------:|
| Models     | 88,3 %     | 67,5 %   | 82,2 %  | 87,6 % |
| Routes     | 62,0 %     | 85,1 %   | 62,5 %  | 61,5 % |
| Middleware | 94,1 %     | 75,0 %   | 100 %   | 100 %  |
| **Total**  | **72,7 %** | **77,1 %** | **76,3 %** | **72,2 %** |

As lacunas estão majoritariamente nos blocos `catch` de erro 500, que dependem de simular falha real do banco.

---

## 8. Testes manuais complementares

Para validações que dependem de um servidor real rodando (smoke test, fluxo completo end-to-end), há um checklist em [`MANUAL_TESTS.md`](./MANUAL_TESTS.md).
