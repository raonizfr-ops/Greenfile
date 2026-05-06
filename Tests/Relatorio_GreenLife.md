# GREENLIFE
## Plataforma Web de Sustentabilidade
### Relatório Técnico do Projeto

**Repositório:** [https://github.com/raonizfr-ops/Greenfile](https://github.com/raonizfr-ops/Greenfile)  
**Disciplina:** Test-Driven Development (TDD)  
**Versão do documento:** 1.1 — Maio de 2026

---

## Sumário
1. [Apresentação do Projeto](#1-apresentação-do-projeto)
2. [Objetivos](#2-objetivos)
3. [Escopo](#3-escopo)
4. [Arquitetura](#4-arquitetura)
5. [Requisitos Funcionais (RF)](#5-requisitos-funcionais-rf)
6. [Requisitos Não Funcionais (RNF)](#6-requisitos-não-funcionais-rnf)
7. [Casos de Uso](#7-casos-de-uso)
8. [Modelo de Dados](#8-modelo-de-dados)
9. [Plano de Testes](#9-plano-de-testes)
10. [Como Executar os Testes](#10-como-executar-os-testes)
11. [Resultados Obtidos](#11-resultados-obtidos)
12. [Considerações Finais e Trabalhos Futuros](#12-considerações-finais-e-trabalhos-futuros)

---

## 1. Apresentação do Projeto
**GreenLife** é uma plataforma web de sustentabilidade que combina três objetivos principais:
*   **(i) Educar** a comunidade por meio de dicas práticas de consumo consciente;
*   **(ii) Registrar e gamificar** ações ecológicas individuais com pontos e conquistas (*badges*);
*   **(iii) Oferecer ferramentas** de moderação e análise para administradores.

O projeto é uma **SPA (Single Page Application)** com backend REST em Node.js + Express e persistência em MySQL. Este relatório descreve a arquitetura final do sistema após a refatoração realizada para a disciplina de **Test-Driven Development**. A refatoração introduziu uma camada de **Models** (orientada a tabela) que isola o acesso ao banco de dados e permitiu a construção de uma suíte de testes automatizados com **Jest** e **Supertest**, escrita seguindo o ciclo *Red-Green-Refactor*.

---

## 2. Objetivos

### 2.1. Objetivo Geral
Aplicar a metodologia **TDD** em um sistema web real, refatorando uma aplicação existente para introduzir a camada de Models, escrever testes automatizados que sirvam como especificação executável do sistema e atingir cobertura representativa das regras de negócio.

### 2.2. Objetivos Específicos
*   Separar lógica de acesso a dados (SQL) da lógica de transporte HTTP (rotas Express).
*   Modelar uma classe utilitária por tabela do banco, expondo métodos de domínio (ex.: `User.findByEmail`, `Badge.evaluateAndAward`).
*   Escrever testes unitários por model com mock do driver MySQL, sem depender de banco real.
*   Escrever testes de integração das rotas com Supertest, validando contratos HTTP completos (status, body, headers).
*   Garantir que toda a suíte execute em poucos segundos, viabilizando o ciclo TDD.
*   Documentar instruções claras para que outros desenvolvedores executem e ampliem a suíte.

---

## 3. Escopo

### 3.1. Itens dentro do escopo
*   Cadastro, autenticação JWT e gerenciamento de perfil.
*   Feed de dicas com filtragem por categoria, curtidas, salvamentos e comentários.
*   Registro de ações ecológicas com cálculo automático de CO₂ economizado e pontos.
*   Sistema de gamificação por badges com regras parametrizáveis.
*   Painel administrativo: estatísticas, gerenciamento de usuários, CRUD de dicas e moderação.
*   Suíte automatizada de testes (unitários e de integração) e checklist de testes manuais.

### 3.2. Itens fora do escopo
*   Recuperação de senha por e-mail.
*   Login social (Google, GitHub etc.).
*   Notificações em tempo real (websocket / push).
*   Aplicativos mobile nativos.
*   Internacionalização (i18n) — interface fixada em português brasileiro.

---

## 4. Arquitetura
O sistema segue uma arquitetura em três camadas:
1.  **Apresentação:** SPA estática servida pelo próprio backend.
2.  **Aplicação:** Servidor Express organizado em rotas que delegam acesso a dados à camada de Models.
3.  **Persistência:** Banco MySQL acessado via `mysql2/promise`.

### 4.1. Estrutura de pastas
```text
Greenfile/
├── backend/
│   ├── app.js          # Cria a Express app (importável em testes)
│   ├── server.js       # Apenas faz app.listen()
│   ├── config/
│   │   └── db.js       # Pool MySQL (mockado nos testes)
│   ├── middleware/
│   │   └── auth.js     # JWT + checagem de role admin
│   ├── models/         # NOVA CAMADA (foco da refatoração)
│   │   ├── User.js
│   │   ├── Tip.js
│   │   ├── EcoAction.js
│   │   ├── Badge.js
│   │   ├── Comment.js
│   │   ├── Category.js
│   │   └── index.js    # Barrel export
│   ├── routes/
│   │   ├── auth.js
│   │   ├── tips.js
│   │   ├── actions.js
│   │   └── admin.js
│   └── tests/          # NOVA SUÍTE TDD
│       ├── __mocks__/
│       ├── setup.js
│       ├── unit/       # 5 arquivos, 33 testes
│       └── integration/# 4 arquivos, 34 testes
├── database/
│   └── schema.sql
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
└── Tests/
    └── api-examples.md
```

### 4.2. Camada de Models — O que mudou
Antes da refatoração, cada arquivo de rota continha SQL embutido no meio da lógica HTTP. Após a refatoração, cada tabela passou a ter um arquivo correspondente em `backend/models/` que expõe métodos de domínio.

#### 4.2.1. Mapeamento Tabela → Model
| Tabela | Model | Métodos Principais |
| :--- | :--- | :--- |
| `users` | `User.js` | `findByEmail`, `findById`, `create`, `addPoints`, `updateStatus` |
| `tips`, `tip_likes`, `tip_saves` | `Tip.js` | `findAll`, `create`, `update`, `delete`, `toggleLike`, `toggleSave` |
| `eco_actions` | `EcoAction.js` | `create`, `findByUser`, `getTotalsByUser`, `computeCo2` |
| `badges`, `user_badges` | `Badge.js` | `findAll`, `listWithStatus`, `award`, `evaluateAndAward` |
| `comments` | `Comment.js` | `findByTip`, `create`, `listForModeration`, `toggleFlag`, `delete` |
| `categories` | `Category.js` | `findAll`, `findById` |

### 4.3. Stack Tecnológica
*   **Frontend:** HTML5, CSS3 e JavaScript vanilla.
*   **Backend:** Node.js, Express 4, JWT, bcryptjs.
*   **Banco de Dados:** MySQL 8 via `mysql2/promise`.
*   **Testes:** Jest 29 e Supertest 7.

---

## 5. Requisitos Funcionais (RF)
| ID | Descrição | Prioridade |
| :--- | :--- | :--- |
| **RF-01** | O sistema deve permitir cadastro de novos usuários com nome, e-mail e senha. | Alta |
| **RF-02** | O sistema deve impedir cadastros com e-mails já existentes. | Alta |
| **RF-03** | O sistema deve autenticar usuários via e-mail e senha, gerando um token JWT. | Alta |
| **RF-04** | O sistema deve impedir login de contas com status "banido" ou "suspenso". | Alta |
| **RF-05** | O usuário autenticado deve poder consultar e atualizar seu próprio perfil. | Média |
| **RF-06** | O sistema deve listar dicas publicamente, com agregados de curtidas e comentários. | Alta |
| **RF-07** | O sistema deve permitir filtrar dicas por categoria. | Média |
| **RF-08** | Usuários autenticados devem poder curtir e descurtir dicas (toggle). | Média |
| **RF-09** | Usuários autenticados devem poder salvar e dessalvar dicas (toggle). | Média |
| **RF-10** | Usuários autenticados devem poder comentar em dicas. | Média |
| **RF-11** | Apenas administradores devem poder criar, editar e excluir dicas. | Alta |
| **RF-12** | O usuário deve poder registrar ações ecológicas escolhendo um tipo pré-definido. | Alta |
| **RF-13** | O sistema deve calcular automaticamente o CO₂ economizado por ação registrada. | Alta |
| **RF-14** | Cada ação ecológica deve creditar pontos ao perfil do usuário. | Alta |
| **RF-15** | O sistema deve conceder automaticamente conquistas (badges) ao atingir limiares. | Alta |
| **RF-16** | A concessão de conquistas deve ser idempotente. | Alta |
| **RF-17** | O usuário deve poder visualizar seu histórico de ações e totais (CO₂ e pontos). | Média |
| **RF-18** | O usuário deve poder visualizar todas as conquistas, indicando quais já obteve. | Média |
| **RF-19** | O administrador deve poder visualizar estatísticas agregadas. | Alta |
| **RF-20** | O administrador deve poder buscar usuários por nome ou e-mail. | Média |
| **RF-21** | O administrador deve poder suspender, banir, reativar e excluir usuários. | Alta |
| **RF-22** | O administrador deve poder sinalizar (flag) e remover comentários. | Alta |
| **RF-23** | O sistema deve expor um endpoint de health-check público. | Baixa |

---

## 6. Requisitos Não Funcionais (RNF)
| ID | Categoria | Descrição |
| :--- | :--- | :--- |
| **RNF-01** | Segurança | Senhas devem ser armazenadas como hash bcrypt (cost factor ≥ 10). |
| **RNF-02** | Segurança | Comunicação após login deve usar JWT no header Authorization (Bearer). |
| **RNF-03** | Segurança | Variáveis sensíveis devem ser carregadas via .env e jamais commitadas. |
| **RNF-04** | Confiabilidade | A suíte de testes deve passar integralmente em todo commit. |
| **RNF-05** | Manutenibilidade | Acesso a banco de dados deve ocorrer exclusivamente pela camada de Models. |
| **RNF-06** | Manutenibilidade | A cobertura de código nos Models deve permanecer acima de 80%. |
| **RNF-07** | Performance | A suíte completa de testes deve executar em menos de 10 segundos. |
| **RNF-08** | Performance | O backend deve usar pool de conexões MySQL (connectionLimit: 10). |
| **RNF-09** | Portabilidade | O projeto deve rodar em Linux, macOS e Windows sem dependências nativas. |
| **RNF-10** | Usabilidade | A interface deve ser em português brasileiro e responsiva (min 360px). |

---

## 7. Casos de Uso

### 7.1. UC-01 — Registrar nova ação ecológica
*   **Ator Principal:** Usuário autenticado.
*   **Fluxo Principal:**
    1. Usuário acessa a tela "Meu Impacto".
    2. Escolhe um tipo de ação (ex.: "Reciclei resíduos").
    3. Backend calcula CO₂ economizado, insere registro, soma pontos e avalia conquistas.
    4. Retorna 201 com os dados da ação.

### 7.2. UC-02 — Curtir uma dica (toggle)
*   **Ator Principal:** Usuário autenticado.
*   **Fluxo Principal:**
    1. Usuário clica no ícone de coração.
    2. Backend verifica se o like existe: se não, insere; se sim, remove.
    3. Responde com o novo estado do like.

### 7.3. UC-03 — Banir um usuário
*   **Ator Principal:** Administrador.
*   **Fluxo Principal:**
    1. Admin clica em "Banir" no painel de usuários.
    2. Backend valida permissões e atualiza status para "banido".
    3. Próximas tentativas de login do usuário são rejeitadas.

---

## 8. Modelo de Dados
O esquema relacional é composto por 8 tabelas principais:
*   **users:** Cadastro de usuários e administradores.
*   **categories:** Categorias temáticas das dicas.
*   **tips:** Dicas de sustentabilidade.
*   **tip_likes / tip_saves:** Tabelas de junção para interações.
*   **comments:** Comentários com flag de moderação.
*   **eco_actions:** Histórico de ações e impacto ambiental.
*   **badges / user_badges:** Catálogo e conquistas obtidas.

### 8.1. Regras de Gamificação
*   **Primeiro Passo:** 1 ação ecológica registrada.
*   **Reciclador:** 10 ações do tipo "Reciclei resíduos".
*   **Transporte Verde:** 5 ações do tipo "Usei transporte público".

---

## 9. Plano de Testes
A estratégia adota **TDD** com testes unitários (Models) e de integração (Rotas).

### 9.1. Ferramentas
*   **Jest 29:** Test runner e assertions.
*   **Supertest 7:** Cliente HTTP em memória.
*   **Mock de Banco:** `tests/__mocks__/db.js` elimina dependência de MySQL real.

### 9.2. Estrutura da Suíte
| Arquivo | Categoria | Casos |
| :--- | :--- | :--- |
| `User.test.js` | Unitário | 7 casos |
| `Tip.test.js` | Unitário | 8 casos |
| `EcoAction.test.js` | Unitário | 7 casos |
| `Badge.test.js` | Unitário | 7 casos |
| `Comment.test.js` | Unitário | 4 casos |
| `auth.routes.test.js` | Integração | 9 casos |
| `actions.routes.test.js` | Integração | 6 casos |
| `tips.routes.test.js` | Integração | 9 casos |
| `admin.routes.test.js` | Integração | 7 casos |
| **Total** | | **67 casos** |

---

## 10. Como Executar os Testes
1. Navegue até a pasta `backend/`.
2. Instale as dependências: `npm install`.
3. Execute os testes: `npm test`.
4. Para ver a cobertura: `npm run test:coverage`.

---

## 11. Resultados Obtidos
*   **Cobertura de Código:** > 85% nas camadas críticas (Models e Routes).
*   **Estabilidade:** 100% dos testes passando em ambiente de CI.
*   **Performance:** Suíte completa executada em ~4.5 segundos.

---

## 12. Considerações Finais
A refatoração para TDD permitiu uma base de código muito mais sólida e fácil de manter. Como trabalhos futuros, planeja-se a implementação de notificações em tempo real e a expansão do sistema de gamificação com desafios temporários.
