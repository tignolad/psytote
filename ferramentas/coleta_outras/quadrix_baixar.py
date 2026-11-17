#!/usr/bin/env python3
"""Baixa provas aplicadas (zip) e gabaritos definitivos dos concursos Quadrix listados no índice.
Uso: python3 -I quadrix_baixar.py <indice.json> <destino_base> id:slug [id:slug ...]"""
import sys, re, json, urllib.request, pathlib, time
idx = json.load(open(sys.argv[1]))
base = pathlib.Path(sys.argv[2])
for par in sys.argv[3:]:
    cid, slug = par.split(":")
    dest = base / slug
    dest.mkdir(parents=True, exist_ok=True)
    n = 0
    for url, rot in idx[cid]["anexos"]:
        if re.search(r"(?i)prova(s)? aplicad|gabarito.*defin|an[aá]lise de recursos.*(gabarito|objetiva)", rot):
            ext = url.rsplit(".", 1)[-1]
            nome = re.sub(r"[^a-z0-9]+", "-", rot.lower()).strip("-")[:70] + "." + ext
            p = dest / nome
            if not p.exists():
                req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
                p.write_bytes(urllib.request.urlopen(req, timeout=120).read())
                time.sleep(0.3)
            n += 1
            (dest / "FONTES.txt").open("a").write(f"{nome}\t{url}\t{rot}\n")
    print(cid, slug, n)
