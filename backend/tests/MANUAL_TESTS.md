# Checklist de Testes Manuais — GreenLife

Estes testes complementam a suíte automatizada e validam o fluxo end-to-end com servidor + MySQL real.

## Pré-condições

1. MySQL instalado e rodando em `localhost:3306`
2. Banco criado e populado:
   ```bash
   mysql -u root < database/schema.sql
   ```
3. Backend rodando:
   ```bash
   cd backend && npm run dev
   ```
4. Frontend acessível em `http://localhost:3000`

> Os usuários de seed têm a senha hash `$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi`. Se essa hash não bater com a senha que você quer usar, registre um novo usuário pela tela ou regenere o hash.

---

## CT-01 — Cadastro de usuário

| Passo | Ação                                                              | Resultado esperado                          |
|------:|-------------------------------------------------------------------|---------------------------------------------|
| 1     | Acessar `/`                                                       | Tela de login                               |
| 2     | Trocar para aba "Cadastrar"                                       | Formulário com nome, email, senha           |
| 3     | Submeter com email já existente                                   | Mensagem "Email já cadastrado"              |
| 4     | Submeter com nome, email novo e senha                             | Login automático + redirect para Feed       |
| 5     | Conferir no banco: `SELECT * FROM users WHERE email='novo@x.com'` | Registro criado com `password_hash`         |

## CT-02 — Login com conta banida

| Passo | Ação                                                                  | Resultado esperado                  |
|------:|-----------------------------------------------------------------------|-------------------------------------|
| 1     | Como admin, na rota Admin → Usuários, banir um usuário                | Status do usuário fica "banido"     |
| 2     | Logout, e tentar logar com credenciais do banido                       | Erro 403 "Conta banida"             |

## CT-03 — Registro de ação ecológica e pontuação

| Passo | Ação                                                  | Resultado esperado                                                |
|------:|-------------------------------------------------------|-------------------------------------------------------------------|
| 1     | Logar como usuário comum (`ana@email.com`)            | Dashboard carrega                                                 |
| 2     | Ir em "Meu Impacto" e registrar "Reciclei resíduos"    | Toast "+100 pontos ecológicos!"                                   |
| 3     | Conferir total de pontos no perfil                     | Aumentou em 100                                                   |
| 4     | Conferir badge "Primeiro Passo"                        | Marcada como conquistada                                          |
| 5     | Repetir 10× a mesma ação                               | Após a 10ª, badge "Reciclador" também desbloqueia                 |
| 6     | `SELECT * FROM eco_actions WHERE user_id = ?`         | 10 registros novos                                                |
| 7     | `SELECT * FROM user_badges WHERE user_id = ?`         | Linhas para badge_id=1 e badge_id=2                               |

## CT-04 — Curtir e salvar dica

| Passo | Ação                                          | Resultado esperado                            |
|------:|-----------------------------------------------|-----------------------------------------------|
| 1     | Logar como usuário                             | Feed carrega                                  |
| 2     | Clicar no coração de uma dica                  | Coração preenchido, contador +1               |
| 3     | Clicar de novo                                 | Coração esvazia, contador –1                  |
| 4     | Clicar no ícone de salvar                       | Ícone marcado                                 |
| 5     | Recarregar a página                             | Estado preservado                             |

## CT-05 — Comentar em dica

| Passo | Ação                                       | Resultado esperado                  |
|------:|--------------------------------------------|-------------------------------------|
| 1     | Abrir comentários de uma dica              | Lista de comentários                |
| 2     | Tentar enviar vazio                         | Erro 400 "Comentário não pode ser vazio" |
| 3     | Enviar texto                                | Comentário aparece no topo, com seu nome |

## CT-06 — Painel admin: criar dica

| Passo | Ação                                          | Resultado esperado            |
|------:|-----------------------------------------------|-------------------------------|
| 1     | Logar como admin (`admin@greenlife.com`)      | Dashboard admin               |
| 2     | Ir em "Conteúdo" e criar nova dica             | Dica aparece na listagem      |
| 3     | Logout, logar como usuário comum               | Nova dica aparece no Feed     |

## CT-07 — Painel admin: moderar comentário

| Passo | Ação                                                | Resultado esperado                          |
|------:|-----------------------------------------------------|---------------------------------------------|
| 1     | Como admin, ir em "Conteúdo" → tab Comentários       | Lista de comentários                        |
| 2     | Sinalizar (flag) um comentário                       | Linha muda de status                        |
| 3     | Conferir no banco: `SELECT flagged FROM comments`    | Valor invertido                             |
| 4     | Remover o comentário                                  | Some da lista, e do feed do usuário          |

## CT-08 — Acesso negado para não-admin

| Passo | Ação                                                                       | Resultado esperado |
|------:|----------------------------------------------------------------------------|--------------------|
| 1     | Logar como usuário comum                                                    | OK                 |
| 2     | Manualmente fazer `POST /api/tips` (Postman/curl) com o token desse usuário | 403 Forbidden      |
| 3     | `DELETE /api/tips/1` com o token de usuário comum                           | 403 Forbidden      |

## CT-09 — Token expirado / inválido

| Passo | Ação                                                                | Resultado esperado |
|------:|---------------------------------------------------------------------|--------------------|
| 1     | `GET /api/auth/me` sem header Authorization                          | 401                |
| 2     | `GET /api/auth/me` com `Authorization: Bearer abc.def.xyz`           | 401 token inválido |

## CT-10 — Health check

| Passo | Ação                       | Resultado esperado                         |
|------:|----------------------------|--------------------------------------------|
| 1     | `GET /api/health`           | `{ "status": "ok", "time": "..." }` 200    |

---

## Coleção Postman / curl

Uma coleção pronta para importar no Postman e exemplos com `curl` estão em [`docs/api-examples.md`](../../docs/api-examples.md) (gerado junto com este projeto).

## Critério de aceite global

Todos os 10 casos acima devem passar **antes** de considerar uma release pronta para deploy.
