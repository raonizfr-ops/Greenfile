# Exemplos de API — GreenLife

Este documento serve como referência rápida das rotas e como exercitá-las manualmente com `curl` ou Postman, complementando os testes automatizados.

> **Base URL:** `http://localhost:3000/api`
> Após login, guarde o token JWT — ele é necessário para a maioria das rotas.

---

## 1. Auth

### Registrar

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Maria","email":"maria@x.com","password":"senha123"}'
```

Resposta esperada (201):
```json
{
  "token": "eyJhbGciOi...",
  "user": { "id": 4, "name": "Maria", "email": "maria@x.com", "role": "user" }
}
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maria@x.com","password":"senha123"}'
```

### Perfil do usuário logado

```bash
TOKEN="cole_o_token_aqui"

curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Atualizar perfil

```bash
curl -X PUT http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Maria Silva","email":"maria.silva@x.com"}'
```

---

## 2. Ações ecológicas

### Listar histórico próprio

```bash
curl http://localhost:3000/api/actions \
  -H "Authorization: Bearer $TOKEN"
```

### Registrar nova ação

```bash
curl -X POST http://localhost:3000/api/actions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action_type":"Reciclei resíduos","icon":"♻️"}'
```

Tipos de ação reconhecidos (com CO₂ associado):

| Tipo                          | CO₂ economizado (kg) |
|-------------------------------|---------------------:|
| Usei transporte público       | 2,30                 |
| Reciclei resíduos             | 1,80                 |
| Andei de bicicleta            | 1,50                 |
| Reduzi consumo elétrico       | 1,20                 |
| Comprei produto sustentável   | 0,80                 |
| Plantei algo                  | 0,60                 |
| Economizei água               | 0,50                 |
| (qualquer outra string)       | 0,50 (default)       |

### Listar conquistas

```bash
curl http://localhost:3000/api/actions/badges \
  -H "Authorization: Bearer $TOKEN"
```

---

## 3. Dicas

### Listar (público)

```bash
curl http://localhost:3000/api/tips
curl "http://localhost:3000/api/tips?category=Reciclagem"
curl "http://localhost:3000/api/tips?userId=2"   # adiciona flags liked/saved
```

### Curtir / descurtir (toggle)

```bash
curl -X POST http://localhost:3000/api/tips/1/like \
  -H "Authorization: Bearer $TOKEN"
```

### Salvar / dessalvar (toggle)

```bash
curl -X POST http://localhost:3000/api/tips/1/save \
  -H "Authorization: Bearer $TOKEN"
```

### Comentários

```bash
# Listar
curl http://localhost:3000/api/tips/1/comments

# Publicar
curl -X POST http://localhost:3000/api/tips/1/comments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Excelente dica!"}'
```

### Criar dica (admin)

```bash
ADMIN_TOKEN="token_de_um_usuario_admin"

curl -X POST http://localhost:3000/api/tips \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Use sacolas reutilizáveis","description":"Evite plástico de uso único.","category_id":4}'
```

---

## 4. Admin

> Todas exigem token de usuário com `role = admin`.

### Estatísticas

```bash
curl http://localhost:3000/api/admin/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Listar usuários

```bash
curl "http://localhost:3000/api/admin/users?search=ana" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Suspender / banir / reativar

```bash
curl -X PUT http://localhost:3000/api/admin/users/3/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"banido"}'    # ou "suspenso" ou "ativo"
```

### Moderação de comentários

```bash
# Listar (flagged primeiro)
curl http://localhost:3000/api/admin/comments \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Inverter flag
curl -X PUT http://localhost:3000/api/admin/comments/5/flag \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Remover
curl -X DELETE http://localhost:3000/api/admin/comments/5 \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 5. Health

```bash
curl http://localhost:3000/api/health
# → {"status":"ok","time":"2026-05-05T..."}
```

---

## Códigos de resposta

| Código | Significado                                           |
|-------:|--------------------------------------------------------|
| 200    | OK                                                     |
| 201    | Criado com sucesso                                     |
| 400    | Requisição inválida (campo faltando, valor inválido)   |
| 401    | Não autenticado (token ausente, inválido ou expirado)  |
| 403    | Não autorizado (papel insuficiente, conta banida)      |
| 404    | Recurso não encontrado                                 |
| 409    | Conflito (ex.: email já cadastrado)                    |
| 500    | Erro interno do servidor                               |
