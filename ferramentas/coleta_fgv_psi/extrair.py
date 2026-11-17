"""Extrai texto (pypdf) de brutos/fgv-psi/*/*.pdf para .txt ao lado."""
import pathlib
from pypdf import PdfReader
RAIZ = pathlib.Path("/home/daniel/psytote/dados/brutos/fgv-psi")
for pdf in sorted(RAIZ.glob("*/*.pdf")):
    out = pdf.with_suffix(".txt")
    if out.exists():
        continue
    try:
        r = PdfReader(str(pdf))
        txt = "\n".join(f"<<<PAG {i+1}>>>\n" + (p.extract_text() or "") for i, p in enumerate(r.pages))
    except Exception as e:
        txt = f"ERRO {e}"
    out.write_text(txt, encoding="utf-8")
    print(pdf.parent.name, pdf.name, len(txt))
