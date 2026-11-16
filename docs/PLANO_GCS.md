# Plano de Gestão de Configuração de Software (GCS) — GreenLife

| Campo | Valor |
|---|---|
| Repositório | `raonizfr-ops/Greenfile` |
| Produto | GreenLife — plataforma web de sustentabilidade |
| Responsável pela configuração | `raonizfr-ops` |
| Versão do plano | 1.0 |
| Situação | Proposta para publicação e adoção no repositório |
| Última revisão | 2026-11-16 |

## 1. Objetivo

Definir como identificar, versionar, revisar, verificar e liberar os itens de configuração do GreenLife, mantendo histórico auditável e evitando alterações não revisadas na branch de produção (`main`). O plano aplica-se ao código e aos artefatos do repositório, aos testes, à documentação, ao esquema de banco e às configurações operacionais do GitHub.

## 2. Organização e itens de configuração

A branch `main` é a baseline de referência. Cada alteração aprovada por pull request passa a integrar uma nova baseline identificada pelo commit e, para releases, por uma tag SemVer (`MAJOR.MINOR.PATCH`).

| ID | Item de configuração | Localização | Controle |
|---|---|---|---|
| CI-01 | API, modelos, rotas e middleware | `backend/` | Git, pull request, testes Jest/Supertest |
| CI-02 | Interface web | `frontend/` | Git, pull request e revisão funcional |
| CI-03 | Esquema e dados iniciais | `database/schema.sql` | Git, revisão de compatibilidade e segurança |
| CI-04 | Testes automatizados e manuais | `backend/tests/`, `Tests/` | Git, execução da suíte e revisão |
| CI-05 | Documentação do produto e GCS | `README.md`, `docs/`, `Tests/` | Git, revisão por pull request |
| CI-06 | Dependências e scripts | `backend/package.json` e lockfile, se adotado | Git, revisão de impacto e atualização controlada |
| CI-07 | Segredos e parâmetros de execução | variáveis de ambiente e GitHub Environments | Segredos fora do Git; acesso mínimo necessário |
| CI-08 | Regras de branch, colaboradores e environments | configurações do repositório GitHub | Acesso administrativo; registrar estado e evidências neste plano |

Arquivos gerados, dependências instaladas, credenciais e dados pessoais não são baseline versionada. Arquivos `.env` não devem ser adicionados ao Git.

## 3. Papéis e responsabilidades

- **Responsável/administrador:** `raonizfr-ops`; mantém o repositório, aprova a configuração dos environments e é o revisor obrigatório para `production`.
- **Par de revisão:** `vinipoll`; convite com permissão `Write` enviado pelo GitHub em 2026-11-16; a pessoa precisa aceitar o convite para a permissão ficar efetiva e revisar pull requests.
- **Contribuidor:** propõe mudanças em branch própria e fornece contexto, testes e evidências no pull request.

A permissão de escrita não elimina a exigência de revisão nem autoriza push direto em `main`.

## 4. Estratégia de branches e mudanças

- `main`: baseline estável; alterações entram somente via pull request aprovado.
- `feature/<assunto>`: funcionalidades e melhorias.
- `fix/<assunto>`: correções.
- `docs/<assunto>`: documentação.
- `hotfix/<assunto>`: correções urgentes, ainda sujeitas a pull request e controles de `main`.

Cada pull request deve descrever objetivo e impacto, apontar issues quando houver, listar testes executados e riscos/migrações. Commits devem ter escopo pequeno e mensagens claras. Tags de release seguem SemVer; notas de versão registram alterações relevantes e procedimentos de migração/rollback.

## 5. Revisão e proteção da baseline

Proteção aplicada e verificada para `main` no GitHub em 2026-11-16:

1. Exigir pull request antes do merge.
2. Exigir pelo menos uma aprovação antes do merge.
3. Exigir revisão aprovada de code owner e invalidar aprovações obsoletas após novos commits.
4. Executar as verificações do workflow de CI no pull request.
5. Bloquear force-push e exclusão da branch.
6. Bypass administrativo desabilitado.

O GitHub exige uma aprovação e tem habilitada a regra de revisão de code owner. `.github/CODEOWNERS` identifica `@vinipoll` como responsável por revisar todas as mudanças; a regra passa a localizar o par como code owner após esse arquivo entrar na baseline `main`. A tentativa controlada de push direto deve ser recusada; registrar seu resultado em “Evidências de avaliação” somente após o teste real.

## 6. Verificação e qualidade

O workflow `CI` instala as dependências do backend e executa `npm test` em pull requests para `main` e em atualizações de `main`. A suíte usa Jest e Supertest com mock de MySQL. Revisores verificam também alterações de interface, schema, segurança e documentação pertinentes. Falhas devem ser corrigidas antes do merge; exceções só podem ser aceitas com justificativa explícita no PR.

## 7. Ambientes

Os ambientes GitHub `staging` e `production` representam validação pré-produção e produção. `production` deve exigir aprovação manual de `raonizfr-ops` antes de qualquer job/deployment que o utilize. `staging` é destinado à validação e não exige aprovação obrigatória inicialmente. Segredos devem ser cadastrados no escopo do environment apropriado e nunca no repositório ou em logs.

O repositório não identifica atualmente um provedor/target de hospedagem nem um processo de deployment. Portanto, este plano define os gates e o uso dos environments; uma automação de deploy só deve ser acrescentada após o responsável escolher o target e fornecer os parâmetros necessários. Criar um environment, por si só, não executa implantação.

## 8. Gerenciamento de acesso e segurança

Conceder apenas o menor nível necessário; registrar login, papel, data e motivo para cada concessão ou revogação. Revisar acessos a cada mudança de equipe e no encerramento do projeto. Credenciais são armazenadas nos GitHub Secrets/Environment Secrets e rotacionadas se houver exposição. Não incluir tokens, senhas reais ou dados de usuários em commits, issues ou logs. O valor de `JWT_SECRET` do arquivo de exemplo é demonstrativo e deve ser substituído fora do código.

## 9. Solicitações de mudança, release e rollback

Toda mudança passa por branch, pull request, CI e aprovação requeridos. Após merge, registrar o SHA da baseline. Para release, criar tag SemVer no commit aprovado e publicar resumo das alterações. Se uma release causar regressão, reverter pelo fluxo de pull request (ou procedimento de emergência documentado), restaurar configuração/schema compatível e registrar o incidente e o SHA revertido.

## 10. Evidências de avaliação

| Requisito | Evidência | Estado |
|---|---|---|
| Plano GCS publicado no repositório | `docs/PLANO_GCS.md`, nesta branch e no pull request a abrir | Ainda não publicado na `main` |
| Repositório acessível | URL pública do repositório | Público, confirmado em 2026-11-16 |
| Recusa de push direto na `main` | [`docs/evidencia-push-main.md`](evidencia-push-main.md): GH006 recusou o push e o SHA remoto não mudou | Confirmado em 2026-11-16 |
| Par de revisão com escrita | Convite `Write` enviado a `vinipoll` | Aguardando aceite do convite pelo par |
| Environment `staging` | Environment do GitHub sem revisor obrigatório | Criado e verificado em 2026-11-16 |
| Environment `production` com revisor obrigatório | `raonizfr-ops` listado como revisor obrigatório | Criado e verificado em 2026-11-16 |

Após o aceite do convite e os testes, acrescentar data, resultado e referência/URL das evidências reais. Não usar este plano como prova de uma configuração que ainda não foi confirmada no GitHub.

## 11. Histórico de revisões

| Versão | Data | Responsável | Alteração |
|---|---|---|---|
| 1.0 | 2026-11-16 | `raonizfr-ops` | Criação do plano inicial para o GreenLife e registro do par `vinipoll`. |
