"""Parseia o .txt da prova (formato FGV) em questões: num, enunciado, alternativas.
Uso: parsear.py <prova.txt> <saida.json>"""
import re, sys, json, collections

def limpar_paginas(txt):
    pags = re.split(r"<<<PAG \d+>>>\n", txt)[1:]
    # linhas repetidas perto das bordas da página = cabeçalho/rodapé
    borda = collections.Counter()
    for p in pags:
        ls = [l.strip() for l in p.split("\n") if l.strip()]
        for l in set(ls[:4] + ls[-3:]):
            borda[l] += 1
    rep = {l for l, n in borda.items() if n >= max(3, len(pags) // 3)}
    out = []
    for p in pags:
        ls = p.split("\n")
        ne = [i for i, l in enumerate(ls) if l.strip()]
        cabeca = set(ne[:5] + ne[-3:])
        for i, l in enumerate(ls):
            s = l.strip()
            if i in cabeca and (s in rep or re.search(r"P[áa]gina \d+|FGV Conhecimento|Tipo \d+ *[–-]", s)):
                continue
            if re.search(r"P[ÁA]GINA \d+|P[áa]gina \d+|Tipo \d+ Branca|TIPO BRANCA|^-{20,}$|^Realiza[çc][ãa]o$", s):
                continue
            out.append(l)
        out.append("")
    return out

def juntar(linhas):
    t = ""
    for l in linhas:
        l = l.strip()
        if not l:
            if t and not t.endswith("\n"):
                t += "\n"
            continue
        if not t or t.endswith("\n"):
            t += l
        elif t.endswith("-") and not t.endswith(" -") and re.match(r"[a-zà-ú]", l):
            t = t + l  # FGV não hifeniza sílabas: hífen de fim de linha é real (técnico-científico, levá-lo)
        else:
            t += " " + l
    t = re.sub(r"[\uf000-\uf0ff]", "", t)
    return re.sub(r"[ \t]+", " ", t).strip()

def parse(path):
    linhas = limpar_paginas(open(path, encoding="utf-8").read())
    qs, atual, esperado = [], None, 1
    for l in linhas:
        s = l.strip()
        m = re.fullmatch(r"(?:Quest[ãa]o\s*)?(\d{1,3})", s)
        if m and int(m.group(1)) == esperado:
            atual = {"num": esperado, "linhas": []}
            qs.append(atual)
            esperado += 1
            continue
        if atual is not None:
            atual["linhas"].append(l)
    res = []
    for q in qs:
        corpo = "\n".join(q["linhas"])
        partes = re.split(r"(?m)^\s*\(([A-E])\)\s*", corpo)
        enun = juntar(partes[0].split("\n"))
        alts = {}
        for i in range(1, len(partes) - 1, 2):
            a = juntar(partes[i + 1].split("\n"))
            alts[partes[i]] = a.split("\n")[0].strip()  # depois da alternativa vem cabeçalho de seção/discursiva
        res.append({"num": q["num"], "enunciado": enun,
                    "alternativas": [alts.get(k, "") for k in "ABCDE"],
                    "ok": list(alts) == list("ABCDE")})
    return res

if __name__ == "__main__":
    r = parse(sys.argv[1])
    json.dump(r, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(len(r), "questões;", sum(not q["ok"] for q in r), "com alternativas estranhas:",
          [q["num"] for q in r if not q["ok"]])
