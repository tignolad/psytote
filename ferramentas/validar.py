#!/usr/bin/env python3
"""Valida arquivos de questões do PsyTote.

Uso: python3 -I ferramentas/validar.py [arquivo.json ...]   (sem args = todos)
Sai com código 1 se houver erro. Também reporta ids duplicados entre arquivos
e contagem por disciplina/assunto/origem.
"""
import json, sys, pathlib, collections

RAIZ = pathlib.Path(__file__).resolve().parent.parent
ASSUNTOS = json.loads((RAIZ / "dados/assuntos.json").read_text(encoding="utf-8"))
DISC = {d["id"] for d in ASSUNTOS["disciplinas"]}
ASS = {a["id"]: a["disciplina"] for a in ASSUNTOS["assuntos"]}
TIPOS = {"banca", "outra", "autoral"}


def checar(q, onde):
    erros = []
    def e(msg):
        erros.append(f"{onde} [{q.get('id', '?')}]: {msg}")
    for campo in ("id", "disciplina", "assunto", "origem", "enunciado", "alternativas", "gabarito", "comentario"):
        if campo not in q:
            e(f"falta campo {campo}")
    if erros:
        return erros
    if q["disciplina"] not in DISC:
        e(f"disciplina inválida {q['disciplina']}")
    if q["assunto"] not in ASS:
        e(f"assunto inválido {q['assunto']}")
    elif ASS[q["assunto"]] != q["disciplina"]:
        e(f"assunto {q['assunto']} não é da disciplina {q['disciplina']}")
    o = q["origem"]
    if not isinstance(o, dict) or o.get("tipo") not in TIPOS:
        e("origem.tipo inválido")
    else:
        if not o.get("banca"):
            e("origem.banca vazio")
        if o["tipo"] == "banca" and o.get("banca") != "FGV":
            e("tipo banca deve ter banca FGV")
        if o["tipo"] in ("banca", "outra"):
            for c in ("orgao", "ano", "fonte"):
                if not o.get(c):
                    e(f"questão real sem origem.{c}")
        if o["tipo"] == "autoral" and o.get("banca") != "Claude (autoral)":
            e("autoral deve ter banca 'Claude (autoral)'")
    alts = q["alternativas"]
    if not isinstance(alts, list) or not (2 <= len(alts) <= 5):
        e("alternativas deve ter 2 a 5 itens")
    elif any(not isinstance(a, str) or not a.strip() for a in alts):
        e("alternativa vazia")
    elif len(set(a.strip() for a in alts)) != len(alts):
        e("alternativas repetidas")
    elif any(a.strip()[:3] in ("A) ", "B) ", "C) ", "D) ", "E) ", "(A)", "(B)", "(C)", "(D)", "(E)") for a in alts):
        e("alternativa começa com letra (remova 'A)')")
    g = q["gabarito"]
    if q.get("anulada"):
        if g is not None and not (isinstance(g, int) and 0 <= g < len(alts)):
            e("gabarito inválido")
    elif not (isinstance(g, int) and 0 <= g < len(alts)):
        e("gabarito inválido")
    if len(q["enunciado"].strip()) < 10:
        e("enunciado curto demais")
    if len(q["comentario"].strip()) < 20:
        e("comentário curto demais")
    if o.get("tipo") == "autoral" and isinstance(alts, list) and len(alts) != 5:
        e("autoral deve ter 5 alternativas")
    return erros


def main(args):
    arquivos = [pathlib.Path(a) for a in args] or sorted((RAIZ / "dados/questoes").glob("*.json"))
    erros, ids = [], collections.Counter()
    por_disc, por_ass, por_orig = collections.Counter(), collections.Counter(), collections.Counter()
    total = 0
    for arq in arquivos:
        try:
            dados = json.loads(arq.read_text(encoding="utf-8"))
        except Exception as ex:
            erros.append(f"{arq.name}: JSON inválido: {ex}")
            continue
        if not isinstance(dados, list):
            erros.append(f"{arq.name}: raiz deve ser array")
            continue
        for i, q in enumerate(dados):
            erros += checar(q, f"{arq.name}#{i}")
            ids[q.get("id")] += 1
            total += 1
            por_disc[q.get("disciplina")] += 1
            por_ass[q.get("assunto")] += 1
            por_orig[(q.get("origem") or {}).get("tipo")] += 1
    for i, n in ids.items():
        if n > 1:
            erros.append(f"id duplicado: {i} ({n}x)")
    print(f"{total} questões em {len(arquivos)} arquivo(s)")
    print("por disciplina:", dict(por_disc))
    print("por origem:", dict(por_orig))
    if "-v" in sys.argv:
        for a, n in sorted(por_ass.items()):
            print(f"  {a}: {n}")
    for x in erros[:200]:
        print("ERRO", x)
    if len(erros) > 200:
        print(f"... +{len(erros) - 200} erros")
    return 1 if erros else 0


if __name__ == "__main__":
    sys.exit(main([a for a in sys.argv[1:] if a != "-v"]))
