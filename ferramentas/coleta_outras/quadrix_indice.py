#!/usr/bin/env python3
"""Lista anexos (provas, gabaritos) das páginas de concursos Quadrix de conselhos de psicologia.
Uso: python3 -I quadrix_indice.py <id> [<id> ...]  -> imprime JSON {id: {titulo, anexos:[[url,rotulo]]}}"""
import sys, re, json, urllib.request, time
out = {}
for cid in sys.argv[1:]:
    req = urllib.request.Request(f"https://quadrix.org.br/informacoes/{cid}/", headers={"User-Agent": "Mozilla/5.0"})
    t = urllib.request.urlopen(req, timeout=60).read().decode("latin-1")
    tit = re.search(r"<title>(.*?)</title>", t, re.S)
    h = re.findall(r"<h\d[^>]*>(.*?)</h\d>", t, re.S)
    anexos = []
    for m in re.finditer(r'href="(https://anexos[^"]+)"[^>]*>(.*?)</a>', t, re.S):
        s = re.sub(r"\s+", " ", re.sub("<[^>]+>", "", m.group(2))).strip()
        if s:
            anexos.append([m.group(1), s])
    out[cid] = {"cab": [re.sub(r"\s+", " ", re.sub("<[^>]+>", "", x)).strip() for x in h][:4], "anexos": anexos}
    time.sleep(0.5)
json.dump(out, sys.stdout, ensure_ascii=False, indent=1)
