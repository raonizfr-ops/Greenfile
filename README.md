# GreenLife

Aplicação web de sustentabilidade com interface SPA, API REST em Node.js/Express e persistência MySQL. O repositório é denominado **Greenfile**; o nome do software é **GreenLife**.

## Estrutura

```text
.
├── backend/       # API Express, models, rotas e testes Jest/Supertest
├── database/      # esquema MySQL e dados iniciais
├── frontend/      # SPA estática (HTML, CSS e JavaScript)
├── Tests/         # relatório e exemplos de API
├── docs/          # plano e registros de GCS
└── .github/       # automações e modelos de contribuição
```

## Requisitos

- Node.js 20 ou superior e npm.
- MySQL 8 para execução funcional da aplicação.
- Os testes automatizados mockam o banco e não exigem um servidor MySQL.

## Executar localmente

1. Prepare o banco com `database/schema.sql`.
2. Copie `backend/.env.example` para `backend/.env` e defina valores locais. Substitua `JWT_SECRET` por um segredo forte; nunca use o valor de exemplo em produção.
3. Instale as dependências e inicie a API:

   ```bash
   cd backend
   npm install
   npm start
   ```

4. Abra `http://localhost:3000`. O health check está disponível em `http://localhost:3000/api/health`.

## Testes

```bash
cd backend
npm install
npm test
```

Também estão disponíveis `npm run test:unit`, `npm run test:integration` e `npm run test:coverage`.

## Gestão de configuração e contribuição

O plano aprovado para identificar, controlar, revisar, testar e liberar itens de configuração está em [`docs/PLANO_GCS.md`](docs/PLANO_GCS.md). Mudanças devem ser propostas por pull request; push direto em `main` é vedado pelas regras do repositório. Consulte o modelo de PR em [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md).

As proteções e ambientes do GitHub (incluindo revisores) são configurações do repositório, não arquivos versionados. Os valores efetivamente aplicados e a evidência da recusa de push direto serão registrados no plano após a configuração no GitHub.
