/**
 * Ponto de entrada do servidor.
 * A configuração da aplicação Express vive em `./app.js`.
 */
const createApp = require('./app');
const app = createApp();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n[GreenLife] Rodando em http://localhost:${PORT}`);
  console.log(
    `   Banco de dados: ${process.env.DB_NAME || 'greenlife'} @ ${process.env.DB_HOST || 'localhost'}\n`
  );
});
