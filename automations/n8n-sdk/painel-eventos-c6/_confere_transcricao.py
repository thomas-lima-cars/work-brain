# -*- coding: utf-8 -*-
"""Confere, byte a byte, o codigo que esta no n8n contra os arquivos locais.

    python _confere_transcricao.py <dump-do-get_workflow_details.txt>

O codigo dos nos e transmitido pela API por extenso. Um caractere trocado
nao quebra a sintaxe -- envenena o numero ou apaga a logo, sem erro. Esta
conferencia roda DEPOIS de sincronizar e ANTES de rodar (licao do Radar de
Estoque, 10/09 e 18/09). Compara contra n8n/*.js, a versao enxuta que e a
que efetivamente viaja.
"""
import json
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

AQUI = Path(__file__).resolve().parent
NOS = {
    "Montar Consultas": "montar-consultas.js",
    "Montar Painel": "montar-painel.js",
    "Virar Arquivo": "virar-arquivo.js",
}

dump = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
wf = dump.get("workflow", dump)
por_nome = {n["name"]: n for n in wf["nodes"]}

falhou = False
for nome, arq in NOS.items():
    local = (AQUI / "n8n" / arq).read_text(encoding="utf-8")
    remoto = por_nome[nome]["parameters"].get("jsCode", "")
    if remoto == local:
        print("✓ %-17s %6d bytes idênticos" % (nome, len(local.encode("utf-8"))))
        continue
    falhou = True
    i = next((k for k in range(min(len(local), len(remoto))) if local[k] != remoto[k]), min(len(local), len(remoto)))
    print("✗ %-17s difere na posição %d (local %d, n8n %d caracteres)" % (nome, i, len(local), len(remoto)))
    print("   local: %r" % local[max(0, i - 40):i + 40])
    print("   n8n:   %r" % remoto[max(0, i - 40):i + 40])

for nome in ("Baixar Representantes", "Ler Representantes"):
    n = por_nome.get(nome)
    if not n:
        falhou = True
        print("✗ %s não existe no workflow" % nome)
        continue
    print("  %s: %s credencial=%s" % (nome, json.dumps(n["parameters"], ensure_ascii=False)[:160],
                                      list((n.get("credentials") or {}).values())))
con = wf.get("connections", {})
cadeia, atual = [], "Rodar"
while atual and len(cadeia) < 12:
    cadeia.append(atual)
    saidas = con.get(atual, {}).get("main", [[]])
    atual = saidas[0][0]["node"] if saidas and saidas[0] else None
print("  cadeia: " + " → ".join(cadeia))
if cadeia[:4] != ["Rodar", "Baixar Representantes", "Ler Representantes", "Montar Consultas"]:
    falhou = True
    print("✗ a planilha não está em série antes das consultas")

sub = por_nome["Subir no SharePoint"]
print("  Subir no SharePoint: disabled=%s credencial=%s" %
      (sub.get("disabled"), list((sub.get("credentials") or {}).values())))
mcp = por_nome["MCP Consultas"]
print("  MCP Consultas: credencial=%s onError=%s" %
      (list((mcp.get("credentials") or {}).values()), mcp.get("onError", "(padrão: para o run)")))
sys.exit(1 if falhou else 0)
