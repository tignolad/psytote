#!/usr/bin/env python3
"""Monta arquivo de questões a partir de itens parseados (JSON) + spec TSV.
Uso: montar.py itens.json spec.tsv meta.json saida.json
spec.tsv: linhas 'num\tassunto\tdif\tcomentário'; linha 'num\t!item\ttexto' substitui o texto do item;
'num\t!cmd\ttexto' substitui o comando; '# ...' comentário. Só os nums presentes no spec entram.
meta.json: {banca, orgao, ano, cargo, fonte, fonte_gabarito, prefixo}"""
import sys, json
itens = {q["num"]: q for q in json.load(open(sys.argv[1], encoding="utf-8"))}
meta = json.load(open(sys.argv[3], encoding="utf-8"))
spec, over = {}, {}
for l in open(sys.argv[2], encoding="utf-8"):
    l = l.rstrip("\n")
    if not l.strip() or l.startswith("#"):
        continue
    p = l.split("\t")
    n = int(p[0])
    if p[1].startswith("!"):
        over.setdefault(n, {})[p[1][1:]] = p[2]
    else:
        spec[n] = (p[1], int(p[2]), p[3])
out = []
for n, (ass, dif, com) in spec.items():
    q = itens[n] if not isinstance(n, tuple) else itens[n]
    item = over.get(n, {}).get("item", q["item"]).split(" PROVA DIS")[0].strip()
    cmd = over.get(n, {}).get("cmd", q["comando"])
    g = q["gab"]
    disc = "legislacao" if ass.startswith("leg-") else "especificos"
    origem = {k: meta[k] for k in ("banca", "orgao", "ano", "cargo", "fonte")}
    origem["tipo"] = "outra"
    if meta.get("fonte_gabarito"):
        origem["fonte_gabarito"] = meta["fonte_gabarito"]
    out.append({
        "id": f"{meta['prefixo']}-{n}",
        "disciplina": disc, "assunto": ass, "origem": origem,
        "enunciado": (cmd + "\n\n" if cmd else "") + f"Item {n}: " + item,
        "alternativas": ["Certo", "Errado"],
        "gabarito": None if g == "X" else (0 if g == "C" else 1),
        "comentario": com, "dificuldade": dif, "anulada": g == "X",
    })
json.dump(out, open(sys.argv[4], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(sys.argv[4], len(out))
