# -*- coding: utf-8 -*-
"""Confere o codigo dos 15 nos Code da Rotina Fenauto no n8n contra n8n/<ramo>/*.js.

    python _confere_n8n.py <arquivo com a resposta do get_workflow_details>

A resposta pode vir crua ({"workflow": ...}) ou embrulhada pelo MCP (lista de
{"type":"text","text":"..."}). Compara por md5, depois de normalizar o fim de
linha. Sai com erro se algum no difere ou falta.
"""
import hashlib
import json
import os
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
RAMOS = [("c6", " C6"), ("iga", " IGA"), ("cars2you", " Cars2You")]
NOS = [("pecas-tema.js", "Peças do Tema"), ("pecas-pagina.js", "Peças da Página"),
       ("montar-consultas.js", "Montar Consultas"), ("montar-painel.js", "Montar Painel"),
       ("virar-arquivo.js", "Virar Arquivo")]


def carrega(caminho):
    with open(caminho, encoding="utf-8") as f:
        d = json.load(f)
    if isinstance(d, list):
        d = json.loads("".join(x.get("text", "") for x in d))
    if isinstance(d, dict) and "result" in d:
        d = d["result"]
    if isinstance(d, dict) and "content" in d and "workflow" not in d:
        d = json.loads("".join(x.get("text", "") for x in d["content"]))
    return d["workflow"]


try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass
md5 = lambda s: hashlib.md5(s.replace("\r\n", "\n").encode("utf-8")).hexdigest()
wf = carrega(sys.argv[1])
porNome = {n["name"]: n for n in wf["nodes"]}
falhas = 0
for ramo, suf in RAMOS:
    for arq, nome in NOS:
        with open(os.path.join(AQUI, "n8n", ramo, arq), encoding="utf-8") as f:
            local = f.read()
        no = porNome.get(nome + suf)
        remoto = no["parameters"].get("jsCode", "") if no else ""
        igual = md5(local) == md5(remoto)
        falhas += not igual
        print("%s %-28s local %6d · n8n %6d%s" % ("✓" if igual else "✗", nome + suf, len(local), len(remoto),
              "" if igual else "  <- DIFERE"))
print("versão", wf.get("versionId"), "·", "tudo igual" if not falhas else "%d nó(s) diferente(s)" % falhas)
sys.exit(1 if falhas else 0)
