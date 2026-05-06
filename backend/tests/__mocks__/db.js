/**
 * Mock do módulo `config/db`. Permite que os models sejam testados
 * sem nenhuma conexão MySQL real — substituímos `db.query` por uma
 * função do Jest (`jest.fn()`) cujo retorno é controlado em cada teste.
 *
 * Como funciona o retorno do mysql2/promise:
 *   const [rows, fields] = await db.query(sql, params);
 * Ou seja: o resolved value é um array de 2 posições.
 *
 * Helpers expostos:
 *   __reset()                   → limpa o histórico de chamadas
 *   __mockResolve(rows, fields) → enfileira um retorno bem-sucedido
 *   __mockReject(err)           → enfileira uma rejeição
 *   __getCalls()                → retorna histórico [sql, params][]
 */
const calls = [];
const queue = [];

const query = jest.fn(async (sql, params) => {
  calls.push([sql, params]);
  if (queue.length === 0) return [[], []]; // default vazio
  const next = queue.shift();
  if (next.error) throw next.error;
  return [next.rows, next.fields || []];
});

module.exports = {
  query,
  __reset() {
    calls.length = 0;
    queue.length = 0;
    query.mockClear();
  },
  __mockResolve(rows = [], fields = []) {
    queue.push({ rows, fields });
  },
  __mockReject(err) {
    queue.push({ error: err });
  },
  __getCalls() {
    return calls.slice();
  },
};
