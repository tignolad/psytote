"""Gera uma ficha por caderno (metadados + URL + gabarito definitivo tipo 1 por número) em brutos/fgv-geral/<slug>/FICHA.json."""
import json, re, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from gabaritos import parse
RAIZ = pathlib.Path("/home/daniel/psytote/dados/brutos/fgv-geral")
lotes = json.loads((pathlib.Path(__file__).parent / "lotes.json").read_text())
for c in lotes:
    d = RAIZ / c["slug"]
    html = (RAIZ / "paginas" / f"{c['slug']}.html").read_text(errors="replace")
    urls = [u if u.startswith("http") else "https://conhecimento.fgv.br" + u for u in re.findall(r'href="([^"]+\.pdf)"', html)]
    provas = [p for p in d.glob("*.pdf") if not re.search(r"gab|comunicado", p.name, re.I)]
    assert len(provas) == 1, (c["slug"], provas)
    prova = provas[0]
    url = [u for u in urls if u.split("/")[-1] == prova.name][0]
    gtxt = (d / (c["gabarq"] + ".txt")).read_text(encoding="utf-8")
    gurl = [u for u in urls if u.split("/")[-1] == c["gabarq"] + ".pdf"][0]
    blocos = {k: v for k, v in parse(gtxt).items() if c["gabre"] in k}
    assert len(blocos) == 1, (c["slug"], list(blocos))
    (cab, g), = blocos.items()
    nums = []
    for faixa in (c["pt"], c["rlm"]):
        if faixa: nums += list(range(faixa[0], faixa[1] + 1))
    ficha = dict(c, prova_pdf=str(prova), prova_txt=str(prova.with_suffix(".txt")), fonte=url,
                 gabarito_pdf=gurl, gabarito_cabecalho=cab.split(" #")[0],
                 gabarito={str(n): g.get(n, "?") for n in nums})
    (d / "FICHA.json").write_text(json.dumps(ficha, ensure_ascii=False, indent=1), encoding="utf-8")
    print(c["slug"], "".join(ficha["gabarito"].values()), "|", ficha["gabarito_cabecalho"][-70:])
