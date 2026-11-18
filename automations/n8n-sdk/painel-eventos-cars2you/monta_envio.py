# -*- coding: utf-8 -*-
"""Monta o envio ao n8n: as operacoes do update_workflow, em arquivos.

    python monta_envio.py      (depois do _enxuga.js, do _divide.js e do build_wf.py)

Envio de 18/11 (tarde: o Valor vendido em cartao proprio no Mensal): a
estrutura do workflow nao muda. Mudam tres nos Code, so o Montar Painel
dividido (o Montar Consultas e o mesmo da 27691b29):

    n8n/_envio/ops-1-pecas-tema.json        o jsCode da Pecas do Tema (~52 KB)
    n8n/_envio/ops-2-pecas-pagina.json      o jsCode da Pecas da Pagina (~48 KB)
    n8n/_envio/ops-3-montar-painel-n8n.json o jsCode do Montar Painel (~48 KB)

Cada arquivo e o "operations" de UM update_workflow (o n8n grava no
rascunho; a versao ativa segue rodando ate o publish_workflow). Depois dos
tres: get_workflow_details salvo em arquivo e _confere_n8n.py (md5 dos 6
nos Code). Voltar atras: restore_workflow_version para a 27691b29.

O envio de 17/11 (a estrutura das metas por aba de mes) esta no git, no
commit 8ec533d.
"""
import json
from pathlib import Path

AQUI = Path(__file__).resolve().parent
N8N = AQUI / "n8n"
ENVIO = N8N / "_envio"
ENVIO.mkdir(exist_ok=True)
js = lambda f: (N8N / f).read_text(encoding="utf-8").replace("\r\n", "\n")  # noqa: E731

for velho in ENVIO.glob("ops-*.json"):
    velho.unlink()
NOS = [("Peças do Tema", "pecas-tema.js"),
       ("Peças da Página", "pecas-pagina.js"), ("Montar Painel", "montar-painel-n8n.js")]
for i, (no, f) in enumerate(NOS, start=1):
    ops = [{"type": "setNodeParameter", "nodeName": no, "path": "/jsCode", "value": js(f)}]
    nome = "ops-%d-%s.json" % (i, f[:-3])
    t = json.dumps(ops, ensure_ascii=False)
    (ENVIO / nome).write_text(t, encoding="utf-8", newline="\n")
    print("%-34s %3d operação(ões) · %6.1f KB" % (nome, len(ops), len(t.encode("utf-8")) / 1024))
