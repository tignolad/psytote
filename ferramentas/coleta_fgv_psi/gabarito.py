"""Extrai gabarito de um bloco do .txt do gabarito definitivo FGV.
gabarito(txt_path, regex_cabecalho, n) -> {num: 'A'..'E' ou '*'}"""
import re, sys

def gabarito(path, cab, n):
    ls = open(path, encoding="utf-8").read().split("\n")
    idx = [i for i, l in enumerate(ls) if re.search(cab, l)]
    if len(idx) != 1:
        raise SystemExit(f"cabeçalho {cab!r} achado {len(idx)}x: {[ls[i] for i in idx]}")
    nums, lets = [], []
    for l in ls[idx[0] + 1:]:
        s = l.strip()
        if not s or s.startswith("<<<PAG") or re.match(r"\(?\*\)?\s*Quest", s, re.I):
            continue
        toks = s.split()
        if all(re.fullmatch(r"\d{1,3}|[A-E*X]", t) or t.lower() in ("anulada", "anul.") for t in toks):
            for t in toks:
                if t.isdigit():
                    nums.append(int(t))
                else:
                    lets.append("*" if t in ("*", "X") or t.lower().startswith("anul") else t)
            if len(nums) >= n and len(lets) >= n:
                break
        else:
            if nums:
                break
    if nums[:n] != list(range(1, n + 1)) or len(lets) < n:
        raise SystemExit(f"falha: nums={nums[:n+2]} lets={len(lets)}")
    return dict(zip(range(1, n + 1), lets[:n]))

if __name__ == "__main__":
    g = gabarito(sys.argv[1], sys.argv[2], int(sys.argv[3]))
    print("".join(g.values()), "anuladas:", [k for k, v in g.items() if v == "*"])
