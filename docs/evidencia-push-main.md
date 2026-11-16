# Evidência: push direto recusado na main

- Repositório: `https://github.com/raonizfr-ops/Greenfile`
- Data/hora do teste: 2026-11-16 22:37:27 UTC
- Branch: `main`
- Commit de teste: `c30ceb0d93975298124fccc8ac5166dd87fbbda8` (árvore idêntica; sem alterações de arquivos)
- SHA da `main` antes e depois: `652ab4bedb239d1a7e75acd511ce6d65605f8319`
- Resultado: push direto recusado pelo GitHub; a branch permaneceu inalterada.

Saída do Git:

```text
remote: error: GH006: Protected branch update failed for refs/heads/main.
remote:
remote: - Changes must be made through a pull request.
To https://github.com/raonizfr-ops/Greenfile.git
 ! [remote rejected] c30ceb0d93975298124fccc8ac5166dd87fbbda8 -> main (protected branch hook declined)
error: failed to push some refs to 'https://github.com/raonizfr-ops/Greenfile.git'
```
