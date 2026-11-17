# Formato das questões do PsyTote

Cada arquivo em `dados/questoes/*.json` é um **array JSON** de questões. Arquivo UTF-8, JSON válido (sem comentários, sem vírgula sobrando).

```json
{
  "id": "fgv-tjrn-2023-psi-41",
  "disciplina": "especificos",
  "assunto": "esp-documentos",
  "origem": {
    "tipo": "banca",
    "banca": "FGV",
    "orgao": "TJ-RN",
    "ano": 2023,
    "cargo": "Analista Judiciário – Psicologia",
    "fonte": "https://.../prova.pdf"
  },
  "texto": "(opcional) texto-base compartilhado, ex.: o texto da prova de Português",
  "enunciado": "Enunciado completo da questão.",
  "alternativas": ["texto da A", "texto da B", "texto da C", "texto da D", "texto da E"],
  "gabarito": 2,
  "comentario": "Por que a C está certa e, em uma frase cada, por que as outras erram. Citar artigo/resolução quando houver.",
  "dificuldade": 2,
  "anulada": false
}
```

Regras:

- `disciplina`: `portugues` | `legislacao` | `rlm` | `especificos`.
- `assunto`: um `id` de `dados/assuntos.json` **da mesma disciplina**.
- `origem.tipo`:
  - `"banca"` = questão REAL da FGV (a banca do concurso). Só use se você transcreveu de uma prova/gabarito oficial que de fato abriu. `fonte` = URL da prova; gabarito = gabarito DEFINITIVO.
  - `"outra"` = questão REAL de outra banca (Quadrix, Cebraspe, FCC, Vunesp, IBFC, Instituto AOCP…). `banca` = nome dela. Mesmas exigências de transcrição real.
  - `"autoral"` = questão escrita pelo Claude. `banca` = `"Claude (autoral)"`, sem órgão/ano/cargo; `fonte` = URL da norma/material usado como base (quando houver).
  - NUNCA rotular como FGV/outra banca algo que você não transcreveu de prova real. Na dúvida → `autoral`.
- `alternativas`: 5 itens no padrão FGV. Questões reais de outras bancas podem ter 4 (A–D). Questões Certo/Errado (Cebraspe/Quadrix) viram `["Certo", "Errado"]`. **Não** escreva a letra "A)" dentro do texto da alternativa.
- `gabarito`: índice 0-based da alternativa correta (0 = A).
- `anulada`: true se a questão foi anulada no gabarito definitivo (mantenha-a, mas marque; `gabarito` pode ser null).
- `dificuldade`: 1 (fácil) a 3 (difícil).
- `id`: único e estável. Padrões: `fgv-<orgao>-<ano>-<cargo>-<num>`, `outra-<banca>-<orgao>-<ano>-<num>`, `aut-<assunto>-<nnn>`.
- Questões de Português com texto-base: repetir o texto no campo `texto` de cada questão (o app agrupa iguais).
- Autorais: alternativas plausíveis, uma única correta, sem "todas as anteriores"; estilo FGV (enunciado com situação-problema quando fizer sentido, distratores que trocam um detalhe). Fundamentar no texto oficial da norma — conferir antes.
- Comentário sempre em português, didático, 2–6 frases.
