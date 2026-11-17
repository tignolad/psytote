"""Lista seções (títulos de disciplina) de um caderno FGV já extraído e as questões em cada uma."""
import re, sys, pathlib, json
TIT = re.compile(r"^(L[ÍI]NGUA PORTUGUESA|RACIOC[ÍI]NIO.*|MATEM[ÁA]TICA.*|NO[ÇC][ÕO]ES DE .*|LEGISLA[ÇC][ÃA]O.*|CONHECIMENTOS .*|ATUALIDADES.*|INFORM[ÁA]TICA|DIREITO .*|[ÉE]TICA .*|L[ÍI]NGUA INGLESA|ESTAT[ÍI]STICA.*|ADMINISTRA[ÇC][ÃA]O .*)$", re.I)
def secoes(path):
    L = pathlib.Path(path).read_text(encoding="utf-8").splitlines()
    sec, out = None, []
    for i, l in enumerate(L, 1):
        s = l.strip()
        if TIT.match(s) and len(s) < 70 and not s.endswith((".", ",")) and (i < 3 or not L[i-2].strip().endswith((" de", " da", " do", ",")) ):
            nxt = L[i].strip() if i < len(L) else ""
            if re.fullmatch(r"\d{1,3}", nxt) or nxt == "" or TIT.match(nxt) or len(nxt) < 40:
                sec = {"titulo": s, "linha": i, "questoes": []}
                out.append(sec)
                continue
        if sec and re.fullmatch(r"\d{1,3}", s):
            n = int(s)
            q = sec["questoes"]
            prev = max([x for o in out for x in o["questoes"]] or [0])
            if n == prev + 1:
                q.append(n)
    return [ {"titulo": o["titulo"], "linha": o["linha"], "de": o["questoes"][0], "ate": o["questoes"][-1]} for o in out if o["questoes"]]
if __name__ == "__main__":
    for p in sys.argv[1:]:
        print("==", p)
        for s in secoes(p):
            print("  ", s)
