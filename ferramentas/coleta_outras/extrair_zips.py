#!/usr/bin/env python3
"""Extrai zips (dados não confiáveis) com nomes sanitizados, só .pdf. Uso: extrair_zips.py <dir_base>"""
import sys, zipfile, pathlib, re
for z in pathlib.Path(sys.argv[1]).glob("*/*.zip"):
    out = z.with_suffix("")
    out.mkdir(exist_ok=True)
    with zipfile.ZipFile(z) as zf:
        for info in zf.infolist():
            if info.is_dir() or not info.filename.lower().endswith(".pdf"):
                continue
            nome = re.sub(r"[^A-Za-z0-9._-]+", "_", pathlib.PurePosixPath(info.filename).name)
            (out / nome).write_bytes(zf.read(info))
