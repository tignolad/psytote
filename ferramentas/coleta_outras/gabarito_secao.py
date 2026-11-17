#!/usr/bin/env python3
"""Lê gabarito Quadrix (.txt) e devolve a sequência C/E/X da seção cujo título casa com o regex.
Uso: gabarito_secao.py gabarito.txt "REGEX"  -> imprime 'C E C ...' e notas"""
import sys, re
ls = open(sys.argv[1], encoding="utf-8").read().splitlines()
rx = re.compile(sys.argv[2])
i = next(k for k, l in enumerate(ls) if rx.search(l))
res, notas, k = {}, [], i + 1
while k < len(ls):
    l = ls[k].strip()
    if re.match(r"^\d+(\.\d+)+ ", l) and k > i + 1:
        break
    nums = l.split()
    if nums and all(x.isdigit() for x in nums) and k + 1 < len(ls):
        let = ls[k + 1].split()
        if len(let) == len(nums) and all(x in "CEX" for x in let):
            for a, b in zip(nums, let):
                res[int(a)] = b
            k += 2
            continue
    if l.startswith("Ite"):
        notas.append(l)
    k += 1
print(" ".join(res[j] for j in range(1, max(res) + 1)))
for n in notas:
    print("#", n, file=sys.stderr)
