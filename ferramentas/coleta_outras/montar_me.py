#!/usr/bin/env python3
"""Monta questões de múltipla escolha a partir de spec JSON: {meta:{...}, questoes:[{num, assunto, dif, enunciado, alternativas, gab(letra|X), comentario}]}
Uso: montar_me.py spec.json saida.json"""
import sys, json
s = json.load(open(sys.argv[1], encoding="utf-8"))
m = s["meta"]
out = []
for q in s["questoes"]:
    origem = {"tipo": "outra", **{k: m[k] for k in ("banca", "orgao", "ano", "cargo", "fonte")}}
    if m.get("fonte_gabarito"):
        origem["fonte_gabarito"] = m["fonte_gabarito"]
    g = q["gab"]
    out.append({
        "id": f"{m['prefixo']}-{q['num']}",
        "disciplina": "legislacao" if q["assunto"].startswith("leg-") else "especificos",
        "assunto": q["assunto"], "origem": origem,
        "enunciado": q["enunciado"], "alternativas": q["alternativas"],
        "gabarito": None if g == "X" else "ABCDE".index(g),
        "comentario": q["comentario"], "dificuldade": q["dif"], "anulada": g == "X",
    })
json.dump(out, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(sys.argv[2], len(out))
