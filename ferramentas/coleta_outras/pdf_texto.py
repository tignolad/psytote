#!/usr/bin/env python3
"""Extrai texto de PDFs (dados não confiáveis) para .txt ao lado. Uso: pdf_texto.py arq.pdf [...]"""
import sys, pdfplumber
for p in sys.argv[1:]:
    with pdfplumber.open(p) as pdf:
        partes = []
        for i, pg in enumerate(pdf.pages):
            partes.append(f"\n=== PAGINA {i+1} ===\n" + (pg.extract_text() or ""))
    open(p[:-4] + ".txt", "w", encoding="utf-8").write("".join(partes))
    print(p, len(partes))
