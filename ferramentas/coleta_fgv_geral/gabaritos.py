"""Parse de gabaritos FGV (texto extraído): blocos 'cabeçalho' seguidos de pares número/letra.
Uso: gabaritos.py <arquivo.txt> [filtro-regex]  -> lista cabeçalhos (e respostas se filtro)."""
import re, sys, json, pathlib

def parse(txt):
    blocos, atual, nome, pend = {}, None, None, None
    toks = []
    linhas = [l.strip() for l in txt.splitlines() if l.strip()]
    # layout em tabela: linha de números seguida de linha de letras -> intercala
    novas, i = [], 0
    while i < len(linhas):
        a = linhas[i].split()
        b = linhas[i + 1].split() if i + 1 < len(linhas) else []
        if len(a) >= 2 and all(x.isdigit() for x in a) and len(b) == len(a) and all(re.fullmatch(r"[A-E]|\*|X", x) for x in b):
            for n, r in zip(a, b):
                novas += [n, r]
            i += 2
            continue
        novas.append(linhas[i]); i += 1
    for s in novas:
        # linhas podem conter vários tokens "1 A 2 B"
        parts = s.split()
        if all(re.fullmatch(r"\d{1,3}|[A-E]|\*|X|ANULADA|Anulada", p) for p in parts):
            toks.extend(parts)
        else:
            toks.append(("H", s))
    cab = []
    for t in toks:
        if isinstance(t, tuple):
            if atual is not None and atual:
                pass
            cab.append(t[1])
            atual = None
            pend = None
            continue
        if atual is None:
            nome = " | ".join(cab[-3:])
            cab = []
            atual = blocos.setdefault(nome + f" #{len(blocos)}", {})
        if re.fullmatch(r"\d{1,3}", t) and pend is None:
            pend = int(t)
        elif pend is not None:
            atual[pend] = "*" if t in ("*", "X", "ANULADA", "Anulada") else t
            pend = None
    return {k: v for k, v in blocos.items() if len(v) >= 10}

if __name__ == "__main__":
    b = parse(pathlib.Path(sys.argv[1]).read_text(encoding="utf-8"))
    filtro = sys.argv[2] if len(sys.argv) > 2 else None
    for k, v in b.items():
        if filtro and not re.search(filtro, k, re.I):
            continue
        print(len(v), k[-160:])
        if filtro:
            print("  ", "".join(v.get(i, "?") for i in range(1, max(v) + 1)))
