"""Monta dados/questoes/fgv-psi-<orgao>-<ano>.json a partir de: prova (parse), gabarito definitivo e
anotacoes/<slug>.json  ({"<num>": {"assunto","dificuldade","comentario"[,"enunciado","alternativas"]} ou {"pular": motivo}}).
Uso: montar.py [slug ...]   (sem args = todos com anotação)"""
import json, pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from parsear import parse
from gabarito import gabarito
AQUI = pathlib.Path(__file__).parent
BR = pathlib.Path("/home/daniel/psytote/dados/brutos/fgv-psi")
SAIDA = pathlib.Path("/home/daniel/psytote/dados/questoes")
ROM = r"(?:I|II|III|IV|V|VI|VII)"

def quebras(t):
    t = re.sub(rf"(?<=[;.:?])\s+(?={ROM}\.\s)", "\n", t)
    t = re.sub(r"(?<=[;.:?])\s+(?=\(\s*\)\s)", "\n", t)
    if re.search(rf"\n(?:{ROM}\.|\(\s*\))\s", t):
        partes = t.split("\n")
        ult = partes[-1]
        m = re.search(r"(?<=[.;])\s+(?=(As afirmativas|A rela[çc][ãa]o|Est[áã]o?|É|Assinale|A sequ[êe]ncia|Faz|S[ãa]o|Agora|De acordo|Considerando|Sobre|Nesse|Com base|Diante|Indique)\b)", ult)
        if m:
            partes[-1] = ult[:m.start()] + "\n" + ult[m.end():]
        t = "\n".join(partes)
    return t

def num_ord(t):
    """pypdf perde o 'º' de 'nº' em algumas provas: 'Lei no 11.340' -> 'Lei nº 11.340'."""
    return re.sub(r"(?i)\b(lei|resolu[çc][ãa]o|decreto|portaria|emenda constitucional|nota t[ée]cnica|complementar|res\.|CFP|CNJ|CONANDA)\s+no\s+(?=\d)", lambda m: m.group(1) + " nº ", t)

def main(slugs):
    man = json.loads((AQUI / "manifesto.json").read_text())
    for c in man:
        an_path = AQUI / "anotacoes" / f"{c['slug']}.json"
        if (slugs and c["slug"] not in slugs) or not an_path.exists():
            continue
        an = json.loads(an_path.read_text(encoding="utf-8"))
        d = BR / c["slug"]
        qs = {q["num"]: q for q in parse(str(d / c["prova"].split("/")[-1].replace(".pdf", ".txt")))}
        g = gabarito(str(d / c["gab_arquivo"]), c["gab_cab"], c["n"])
        orgao_id, ano = c["slug"].rsplit("-", 1)
        out, faltam, pulos = [], [], []
        for n in range(c["de"], c["ate"] + 1):
            a = an.get(str(n))
            if a is None:
                faltam.append(n); continue
            if "pular" in a:
                pulos.append((n, a["pular"])); continue
            q = qs[n]
            anulada = g[n] == "*"
            ass = a["assunto"]
            out.append({
                "id": f"fgv-{orgao_id}-{ano}-psi-{n}",
                "disciplina": "legislacao" if ass.startswith("leg-") else "especificos",
                "assunto": ass,
                "origem": {"tipo": "banca", "banca": "FGV", "orgao": c["orgao"], "ano": c["ano"],
                           "cargo": c["cargo"], "fonte": c["prova"], "fonte_gabarito": next(g for g in c["gab"] if g.split("/")[-1].replace(".pdf", ".txt") == c["gab_arquivo"]),
                           "questao_original": n, "caderno": "Tipo 1"},
                "enunciado": num_ord(a.get("enunciado") or quebras(q["enunciado"])),
                "alternativas": [num_ord(x) for x in (a.get("alternativas") or [x for x in q["alternativas"] if x])],  # provas FGV com 4 opções (A–D)
                "gabarito": None if anulada else "ABCDE".index(g[n]),
                "comentario": a["comentario"],
                "dificuldade": a["dificuldade"],
                "anulada": anulada,
            })
        arq = SAIDA / f"fgv-psi-{orgao_id}-{ano}.json"
        arq.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        print(c["slug"], len(out), "questões ->", arq.name, "| faltam:", faltam, "| puladas:", pulos)

if __name__ == "__main__":
    main(sys.argv[1:])
