"""Confere um arquivo de questões fgv-pt-*/fgv-rlm-* contra a FICHA do caderno:
gabarito definitivo, anulação, id, origem e se enunciado/alternativas/texto aparecem no texto extraído da prova.
Uso: conferir.py <arquivo.json> [...]"""
import json, re, sys, pathlib, unicodedata
R = pathlib.Path("/home/daniel/psytote/dados/brutos/fgv-geral")
FICHAS = [json.loads(p.read_text()) for p in R.glob("*/FICHA.json")]
def norm(s):
    s = unicodedata.normalize("NFKC", s).lower()
    return re.sub(r"[^0-9a-záàâãéêíóôõúüç]", "", s)
def presente(trecho, prova):
    t = norm(trecho)
    if not t: return 1.0
    if t in prova: return 1.0
    # fração de janelas de 12 caracteres encontradas
    jan = [t[i:i+12] for i in range(0, max(1, len(t) - 11), 6)]
    return sum(j in prova for j in jan) / len(jan)
erros = 0
for arq in sys.argv[1:]:
    qs = json.loads(pathlib.Path(arq).read_text(encoding="utf-8"))
    print(f"== {arq}: {len(qs)} questões")
    for q in qs:
        o = q.get("origem", {})
        f = [x for x in FICHAS if x["fonte"] == o.get("fonte")]
        if not f:
            print("  ", q.get("id"), "fonte não bate com nenhuma FICHA"); erros += 1; continue
        f = f[0]
        prova = norm(pathlib.Path(f["prova_txt"]).read_text(encoding="utf-8"))
        m = re.fullmatch(re.escape(f["id_prefixo"]) + r"(\d+)", q["id"])
        if not m:
            print("  ", q["id"], "id fora do padrão", f["id_prefixo"]); erros += 1; continue
        n = m.group(1); n = str(int(n))
        g = f["gabarito"].get(n)
        disc = q["disciplina"]
        faixa = f["pt"] if disc == "portugues" else f["rlm"]
        if not faixa or not (faixa[0] <= int(n) <= faixa[1]):
            print("  ", q["id"], f"número fora da faixa de {disc}"); erros += 1
        if o.get("tipo") != "banca" or o.get("banca") != "FGV" or o.get("ano") != f["ano"] or o.get("orgao") != f["orgao"]:
            print("  ", q["id"], "origem divergente da ficha"); erros += 1
        if g == "*":
            if not q.get("anulada"):
                print("  ", q["id"], "questão anulada no definitivo mas anulada!=true"); erros += 1
        else:
            letra = "ABCDE"[q["gabarito"]] if isinstance(q.get("gabarito"), int) else None
            if letra != g:
                print("  ", q["id"], f"gabarito {letra} != definitivo {g}"); erros += 1
            if q.get("anulada"):
                print("  ", q["id"], "marcada anulada mas definitivo tem letra"); erros += 1
        partes = [("enunciado", q["enunciado"])] + [(f"alt{i}", a) for i, a in enumerate(q["alternativas"])]
        if q.get("texto"): partes.append(("texto", q["texto"]))
        for nome, t in partes:
            p = presente(t, prova)
            lim = 0.5 if disc == "rlm" else 0.8
            if p < lim:
                print("  ", q["id"], f"{nome} pouco presente na prova ({p:.0%}): {t[:70]!r}"); erros += 1
            elif p < 1.0 and disc != "rlm":
                print("  ", q["id"], f"[aviso] {nome} {p:.0%}: {t[:60]!r}")
print("ERROS:", erros)
sys.exit(1 if erros else 0)
