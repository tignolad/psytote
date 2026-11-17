"""Baixa provas/gabaritos de psicólogo FGV listados em manifesto.json para dados/brutos/fgv-psi/<slug>/."""
import json, pathlib, subprocess
RAIZ = pathlib.Path("/home/daniel/psytote/dados/brutos/fgv-psi")
man = json.loads((pathlib.Path(__file__).parent / "manifesto.json").read_text())
for c in man:
    dest = RAIZ / c["slug"]
    dest.mkdir(parents=True, exist_ok=True)
    for url in [c["prova"]] + c["gab"]:
        url = url if url.startswith("http") else "https://conhecimento.fgv.br" + url
        out = dest / url.split("/")[-1]
        if not out.exists() or out.stat().st_size < 2000:
            subprocess.run(["curl", "-s", "-L", "-A", "Mozilla/5.0", "-o", str(out), url])
        print(c["slug"], out.name, out.stat().st_size if out.exists() else 0)
