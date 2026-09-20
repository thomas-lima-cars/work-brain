# -*- coding: utf-8 -*-
r"""Compara, byte a byte, o que esta NO N8N com o arquivo local.

Existe porque o codigo destes nos e transcrito a mao pro n8n como string
JSON, e barra invertida e onde este projeto erra: escapar uma vez a mais
gerou "Invalid regular expression" e derrubou a execucao 49963 inteira. O
montar-html.js tem 320 barras.

Achar isso DEPOIS de um run de nove minutos e caro; achar antes custa uma
chamada. E a diferenca aparece com contexto -- primeira posicao divergente
mais a vizinhanca dos dois lados -- porque "os arquivos diferem" nao ajuda
em nada num blob de 54 KB.

    python _confere_transcricao.py <dump-do-get_workflow_details.txt>
"""
import io
import json
import os
import sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

AQUI = os.path.dirname(os.path.abspath(__file__))

PARES = [
    ("Montar Fase 1", "montar-fase1.js"),
    ("Montar Fase 2", "montar-fase2.js"),
    ("Montar HTML", "montar-html.js"),
    ("Virar Arquivo", "virar-arquivo.js"),
]

d = json.load(io.open(sys.argv[1], encoding="utf-8"))
# Duas origens, mesmo conteudo: o get_workflow_details do MCP embrulha em
# {"workflow": {...}}, e o "Download" da interface do n8n entrega o objeto
# cru. Sem aceitar os dois, quem nao tem o MCP fica sem poder conferir --
# que e justamente quando a transcricao e manual e o risco e maior.
wf = d["workflow"] if "workflow" in d else d
if "nodes" not in wf:
    print("nao achei 'nodes' no arquivo. Esperado: o JSON do workflow, do "
          "get_workflow_details do MCP ou do Download da interface.")
    sys.exit(2)
nos = {n["name"]: n for n in wf.get("nodes", [])}

falhou = 0
for nome, arq in PARES:
    local = io.open(os.path.join(AQUI, arq), encoding="utf-8").read()
    if nome not in nos:
        print("AUSENTE no n8n: " + nome)
        falhou += 1
        continue
    remoto = nos[nome].get("parameters", {}).get("jsCode", "")
    if remoto == local:
        print("  ok  %-15s %6d bytes identicos (%d barras)"
              % (nome, len(local), local.count("\\")))
        continue
    falhou += 1
    print("DIVERGE %s: local %d bytes, n8n %d bytes" % (nome, len(local), len(remoto)))
    n = min(len(local), len(remoto))
    i = 0
    while i < n and local[i] == remoto[i]:
        i += 1
    print("  primeira diferenca no byte %d" % i)
    print("  local: " + repr(local[max(0, i - 60):i + 60]))
    print("  n8n  : " + repr(remoto[max(0, i - 60):i + 60]))

print("")
print("TRANSCRICAO CONFERIDA" if not falhou else str(falhou) + " NO(S) DIVERGENTE(S)")
sys.exit(0 if not falhou else 1)
