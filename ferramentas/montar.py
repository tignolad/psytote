#!/usr/bin/env python3
"""Junta dados/questoes/*.json + assuntos + materiais em app/dados/banco.json.

Questões inválidas (pelo validar.py) são descartadas e listadas.
Textos-base repetidos viram uma tabela (`textos`) e cada questão aponta por índice.
Uso: python3 -I ferramentas/montar.py
"""
import json, pathlib, sys, datetime, hashlib

RAIZ = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "ferramentas"))
import validar  # noqa: E402


def main():
    assuntos = json.loads((RAIZ / "dados/assuntos.json").read_text(encoding="utf-8"))
    mat_path = RAIZ / "dados/materiais.json"
    materiais = json.loads(mat_path.read_text(encoding="utf-8")) if mat_path.exists() else {"assuntos": {}, "gerais": []}

    questoes, textos, idx_texto, vistos, descartadas = [], [], {}, set(), []
    for arq in sorted((RAIZ / "dados/questoes").glob("*.json")):
        try:
            dados = json.loads(arq.read_text(encoding="utf-8"))
        except Exception as ex:
            descartadas.append(f"{arq.name}: JSON inválido ({ex})")
            continue
        for i, q in enumerate(dados):
            erros = validar.checar(q, f"{arq.name}#{i}")
            if erros:
                descartadas.extend(erros)
                continue
            if q["id"] in vistos:
                descartadas.append(f"{arq.name}#{i}: id duplicado {q['id']}")
                continue
            # duplicata de conteúdo (mesmo enunciado+alternativas) entre fontes
            assin = hashlib.sha1((q["enunciado"].strip() + "|".join(q["alternativas"])).encode()).hexdigest()
            if assin in vistos:
                descartadas.append(f"{arq.name}#{i}: conteúdo duplicado {q['id']}")
                continue
            vistos.add(q["id"]); vistos.add(assin)
            o = q["origem"]
            item = {
                "id": q["id"], "d": q["disciplina"], "a": q["assunto"],
                "o": {k: o[k] for k in ("tipo", "banca", "orgao", "ano", "cargo", "fonte") if o.get(k)},
                "e": q["enunciado"].strip(), "alt": [a.strip() for a in q["alternativas"]],
                "g": q["gabarito"], "c": q["comentario"].strip(),
                "dif": q.get("dificuldade", 2),
            }
            if q.get("anulada"):
                item["anulada"] = True
            t = (q.get("texto") or "").strip()
            if t:
                if t not in idx_texto:
                    idx_texto[t] = len(textos); textos.append(t)
                item["t"] = idx_texto[t]
            questoes.append(item)

    banco = {
        "gerado": datetime.datetime.now().isoformat(timespec="seconds"),
        "disciplinas": assuntos["disciplinas"], "assuntos": assuntos["assuntos"],
        "materiais": materiais, "textos": textos, "questoes": questoes,
    }
    saida = RAIZ / "app/dados/banco.json"
    saida.parent.mkdir(parents=True, exist_ok=True)
    saida.write_text(json.dumps(banco, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    from collections import Counter
    print(f"{len(questoes)} questões, {len(textos)} textos-base → {saida} ({saida.stat().st_size/1e6:.2f} MB)")
    print("por disciplina:", dict(Counter(q['d'] for q in questoes)))
    print("por origem:", dict(Counter(q['o']['tipo'] for q in questoes)))
    if descartadas:
        print(f"{len(descartadas)} descartes:")
        for d in descartadas[:50]:
            print("  ", d)


if __name__ == "__main__":
    main()
