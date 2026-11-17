#!/usr/bin/env python3
"""Separa itens C/E de prova Quadrix (texto .col.txt) e gabarito (linhas do gabarito).
Uso: quadrix_itens.py prova.col.txt "<gabarito: sequência de C/E/X para itens 1..N>" [ini fim]
Imprime JSON lista {num, comando, item, gab}."""
import sys, re, json
RUIDO = re.compile(r"^(--- coluna ---|=== PAGINA|Quadrix \| ?\d{4}|RASCUNHO|\d{1,2}$|CONSELHO (REGIONAL|FEDERAL)|CONHECIMENTO|COMPLEMENTARES|OS ESPEC|ESPEC[ÍI]FICOS|PROVA OBJETIVA|B[ÁA]SICOS)")
def limpa(ls, rodape):
    return [l for l in ls if l.strip() and not RUIDO.match(l.strip()) and l.strip() not in rodape]
linhas = open(sys.argv[1], encoding="utf-8").read().splitlines()
gab = sys.argv[2].split()
ini = int(sys.argv[3]) if len(sys.argv) > 3 else 1
fim = int(sys.argv[4]) if len(sys.argv) > 4 else len(gab)
# rodapé = linha mais frequente
from collections import Counter
cont = Counter(l.strip() for l in linhas if l.strip())
rodape = {l for l, c in cont.items() if c >= 4 and not re.match(r"^\d", l)}
blocos, cur, n = {}, None, 1
pre = []
for l in linhas:
    m = re.match(r"^(\d{1,3}) (.*)", l.strip())
    if m and int(m.group(1)) == n:
        cur = n; blocos[n] = [m.group(2)]; n += 1
    elif cur:
        blocos[cur].append(l)
itens = []
comando = ""
for k in sorted(blocos):
    ls = limpa(blocos[k], rodape)
    corpo, prox = ls, []
    js = [i for i, l in enumerate(ls) if re.search(r"julgue|assinale|Texto para os itens|Texto (I|II)", l)]
    if js:
        j = js[0]
        s = j
        while s > 0 and not re.search(r"[.;:)”\"]$", ls[s - 1].strip()):
            s -= 1
        corpo, prox = ls[:s], ls[s:]
    if ini <= k <= fim:
        itens.append({"num": k, "comando": comando, "item": " ".join(x.strip() for x in corpo), "gab": gab[k - 1] if k - 1 < len(gab) else None})
    if prox:
        comando = " ".join(x.strip() for x in prox)
json.dump(itens, sys.stdout, ensure_ascii=False, indent=0)
