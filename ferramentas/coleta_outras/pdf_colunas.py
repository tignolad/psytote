#!/usr/bin/env python3
"""Extrai texto de provas Quadrix em 2 colunas, removendo marca d'água (chars grandes).
Uso: pdf_colunas.py arq.pdf [...]  -> grava arq.col.txt"""
import sys, pdfplumber
for p in sys.argv[1:]:
    out = []
    with pdfplumber.open(p) as pdf:
        for i, pg in enumerate(pdf.pages):
            pg = pg.filter(lambda o: o.get("object_type") != "char" or (o.get("size", 0) < 20))
            w, h = pg.width, pg.height
            out.append(f"\n=== PAGINA {i+1} ===\n")
            for x0, x1 in ((0, w / 2), (w / 2, w)):
                t = pg.crop((x0, 0, x1, h)).extract_text() or ""
                out.append(t + "\n--- coluna ---\n")
    open(p[:-4] + ".col.txt", "w", encoding="utf-8").write("".join(out))
    print(p)
