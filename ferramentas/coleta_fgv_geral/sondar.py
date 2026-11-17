"""Para cada slug: escolhe 1 caderno de nível superior tipo 1, baixa caderno+gabaritos definitivos,
extrai texto e mostra contagem de questões de Português e RLM."""
import re, sys, pathlib, subprocess, json
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from secoes import secoes
from pypdf import PdfReader
RAIZ = pathlib.Path("/home/daniel/psytote/dados/brutos/fgv-geral")
RUIM = re.compile(r"discurs|tecnico|t[ée]cnico-de-n[ií]vel-m|medio|fundamental|cnm|agente|soldado|guarda|cadete|juiz|defensor|promotor|procurador-cns|delegad|notari|cart[oó]rio|ingresso|remocao|estagio|resultado|convoca|edital|recurso|espelho|padrao", re.I)
def baixar(url, out):
    if not out.exists():
        subprocess.run(["curl", "-s", "-L", "-A", "Mozilla/5.0", "-o", str(out), url])
def texto(pdf):
    out = pdf.with_suffix(".txt")
    if not out.exists():
        r = PdfReader(str(pdf))
        out.write_text("\n".join(f"<<<PAG {i+1}>>>\n" + (p.extract_text() or "") for i, p in enumerate(r.pages)), encoding="utf-8")
    return out
for slug in sys.argv[1:]:
    html = (RAIZ / "paginas" / f"{slug}.html").read_text(errors="replace")
    urls = [u if u.startswith("http") else "https://conhecimento.fgv.br" + u for u in re.findall(r'href="([^"]+\.pdf)"', html)]
    provas = [u for u in urls if re.search(r"tipo[-_ ]?1|t01", u, re.I) and not RUIM.search(u.split("/")[-1])]
    pref = [u for u in provas if re.search(r"psic", u, re.I)] + [u for u in provas if re.search(r"analista", u, re.I)] + provas
    gabs = [u for u in urls if re.search(r"gab", u, re.I) and re.search(r"defin|def[-_]", u, re.I)]
    if not pref or not gabs:
        print(slug, "SEM", len(provas), len(gabs)); continue
    d = RAIZ / slug; d.mkdir(exist_ok=True)
    p = d / pref[0].split("/")[-1]
    try:
        baixar(pref[0], p)
        for g in gabs: baixar(g, d / g.split("/")[-1])
        t = texto(p)
        for g in gabs: texto(d / g.split("/")[-1])
        ss = secoes(t)
    except Exception as e:
        print(slug, "ERRO", e); continue
    resumo = [(s["titulo"][:30], s["ate"] - s["de"] + 1) for s in ss]
    print(slug, p.name[:70], resumo)
