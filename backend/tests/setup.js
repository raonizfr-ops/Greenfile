/**
 * Setup global do Jest.
 *
 * Substitui o módulo `config/db` pelo mock em `tests/__mocks__/db.js`
 * para todos os testes unitários. Isso evita qualquer conexão real
 * com MySQL durante a execução da suíte.
 */
jest.mock('../config/db', () => require('./__mocks__/db'));
