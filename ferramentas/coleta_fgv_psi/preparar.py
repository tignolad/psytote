"""Gera ferramentas/coleta_fgv_psi/revisao/<slug>.txt (questões da faixa específica + gabarito definitivo)
e /tmp/... parse para anotação. Uso: preparar.py"""
import json, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from parsear import parse
from gabarito import gabarito
AQUI = pathlib.Path(__file__).parent
BR = pathlib.Path("/home/daniel/psytote/dados/brutos/fgv-psi")
(AQUI / "revisao").mkdir(exist_ok=True)
for c in json.loads((AQUI / "manifesto.json").read_text()):
    d = BR / c["slug"]
    prova = d / c["prova"].split("/")[-1].replace(".pdf", ".txt")
    qs = parse(str(prova))
    assert len(qs) == c["n"], (c["slug"], len(qs))
    g = gabarito(str(d / c["gab_arquivo"]), c["gab_cab"], c["n"])
    linhas = []
    for q in qs:
        if not c["de"] <= q["num"] <= c["ate"]:
            continue
        linhas.append(f"### Q{q['num']}   GABARITO DEFINITIVO: {g[q['num']]}")
        linhas.append(q["enunciado"])
        for L, a in zip("ABCDE", q["alternativas"]):
            linhas.append(f"({L}) {a}")
        linhas.append("")
    (AQUI / "revisao" / f"{c['slug']}.txt").write_text("\n".join(linhas), encoding="utf-8")
    print(c["slug"], c["ate"] - c["de"] + 1, "anuladas:", [k for k, v in g.items() if v == "*" and c["de"] <= k <= c["ate"]])
