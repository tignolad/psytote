#!/usr/bin/env python3
"""Mede o viés "a certa é a mais longa" por arquivo.

Uso: python3 -I ferramentas/vies_tamanho.py [arquivos...]  (sem args = todos)
     -l  lista os ids das questões em que a certa é a ÚNICA mais longa
Meta para autorais: <= 25% por arquivo (FGV real fica em ~20%).
"""
import json, sys, pathlib, glob

RAIZ = pathlib.Path(__file__).resolve().parent.parent
args = [a for a in sys.argv[1:] if not a.startswith('-')]
listar = '-l' in sys.argv
arqs = args or sorted(glob.glob(str(RAIZ / 'dados/questoes/*.json')))
for f in arqs:
    qs = json.load(open(f, encoding='utf-8'))
    n = longa = curta = 0
    ids = []
    for q in qs:
        if q.get('gabarito') is None or len(q['alternativas']) < 5:
            continue
        L = [len(a) for a in q['alternativas']]
        n += 1
        if L[q['gabarito']] == max(L) and L.count(max(L)) == 1:
            longa += 1; ids.append(q['id'])
        if L[q['gabarito']] == min(L) and L.count(min(L)) == 1:
            curta += 1
    if n:
        print(f"{pathlib.Path(f).name:45} n={n:3}  certa=mais longa {100*longa//n:3}%  certa=mais curta {100*curta//n:3}%")
        if listar and ids:
            print('   ', ' '.join(ids))
