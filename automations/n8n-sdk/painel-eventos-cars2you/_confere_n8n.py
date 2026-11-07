# -*- coding: utf-8 -*-
"""Confere se o codigo dos nos Code no n8n e o de n8n/*.js, por md5.

    python _confere_n8n.py <arquivo com a resposta do get_workflow_details>

O workflow vai ao n8n em pedacos (esqueleto + um update por no grande, ver
build_wf.py), transcritos pela API: um caractere trocado quebra o painel sem
aviso. Aqui cada jsCode do n8n e comparado com o arquivo local; se diferir,
mostra o primeiro caractere diferente.
"""
import hashlib
import io
import json
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

PASTA = Path(__file__).resolve().parent / "n8n"
NOS = {"Peças do Tema": "pecas-tema.js", "Peças da Página": "pecas-pagina.js", "Montar Consultas": "montar-consultas.js",
       "Montar Painel": "montar-painel-n8n.js", "Virar Arquivo": "virar-arquivo.js"}


def acha(o):
    """o JSON do workflow dentro da resposta (que pode vir embrulhada em blocos de texto)"""
    if isinstance(o, dict):
        if isinstance(o.get("nodes"), list):
            return o
        for v in o.values():
            r = acha(v)
            if r:
                return r
    elif isinstance(o, list):
        for v in o:
            r = acha(v)
            if r:
                return r
    elif isinstance(o, str) and '"nodes"' in o:
        try:
            return acha(json.loads(o))
        except Exception:
            return None
    return None


wf = acha(json.loads(io.open(sys.argv[1], encoding="utf-8").read()))
assert wf, "sem nodes na resposta"
lf = lambda s: s.replace("\r\n", "\n")  # noqa: E731
md5 = lambda s: hashlib.md5(lf(s).encode("utf-8")).hexdigest()  # noqa: E731
ruins = 0
nomes = [n["name"] for n in wf["nodes"]]
for n in wf["nodes"]:
    if n["name"] not in NOS:
        continue
    local = (PASTA / NOS[n["name"]]).read_text(encoding="utf-8")
    remoto = n.get("parameters", {}).get("jsCode", "")
    ok = md5(local) == md5(remoto)
    ruins += not ok
    print("%s %-18s local %s (%d)  n8n %s (%d)" % ("✓" if ok else "✗", n["name"], md5(local)[:12], len(lf(local)),
                                                  md5(remoto)[:12], len(lf(remoto))))
    if not ok:
        a, b = lf(local), lf(remoto)
        i = next((k for k in range(min(len(a), len(b))) if a[k] != b[k]), min(len(a), len(b)))
        print("   primeira diferença no caractere %d: local %r | n8n %r" % (i, a[max(0, i - 30):i + 30], b[max(0, i - 30):i + 30]))
faltam = [x for x in NOS if x not in nomes]
if faltam:
    print("✗ nós ausentes:", faltam)
print("nós:", nomes)
print("✓ código idêntico nos %d nós Code" % len(NOS) if not ruins and not faltam else "✗ %d nó(s) diferentes" % ruins)
sys.exit(1 if ruins or faltam else 0)
