"""Baixa provas/gabaritos do manifesto a partir das páginas conhecimento.fgv.br já salvas."""
import json, re, pathlib, subprocess, sys
RAIZ = pathlib.Path("/home/daniel/psytote/dados/brutos/fgv-geral")
man = json.loads((pathlib.Path(__file__).parent / "manifesto.json").read_text())
for c in man:
    html = (RAIZ / "paginas" / f"{c['slug']}.html").read_text(errors="replace")
    urls = re.findall(r'href="([^"]+\.pdf)"', html)
    dest = RAIZ / f"{c['slug']}"
    dest.mkdir(exist_ok=True)
    for nome in [c["prova"]] + c["gab"]:
        u = [x for x in urls if x.split("/")[-1] == nome]
        if not u:
            print("NAO ACHEI", c["slug"], nome); continue
        url = u[0] if u[0].startswith("http") else "https://conhecimento.fgv.br" + u[0]
        out = dest / nome
        if not out.exists():
            subprocess.run(["curl", "-s", "-L", "-A", "Mozilla/5.0", "-o", str(out), url])
        print(c["slug"], nome, out.stat().st_size if out.exists() else 0, url)
