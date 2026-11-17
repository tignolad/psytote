# PsyTote

Estudos para o concurso de **Psicóloga(o) do CRP/05** (banca FGV, prova em 28/02/2027).

- `app/` — o app (PWA estático, funciona offline). Publicado via GitHub Pages.
- `dados/questoes/*.json` — banco de questões (formato em `dados/FORMATO.md`). Cada questão diz quem a fez: FGV (real), outra banca (real) ou autoral (Claude).
- `ferramentas/montar.py` — junta tudo em `app/dados/banco.json`. Rodar depois de mexer nas questões.
- `ferramentas/validar.py` — valida as questões.
