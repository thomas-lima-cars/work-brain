# -*- coding: utf-8 -*-
"""Monta o envio de 17/11 ao n8n: as operacoes do update_workflow, em arquivos.

    python monta_envio.py      (depois do _enxuga.js, do _divide.js e do build_wf.py)

O workflow no ar (cRChMwAnLYGRMesM, versao a3751072, conferida igual ao
commit em 17/11) tem as metas em quatro nos: Ler Metas Mensais -> Metas
Mensais -> Ler Metas Diarias -> Metas Diarias. A planilha nova tem uma aba
por mes, e a leitura vira tres: Ler Metas -> Abas das Metas -> Metas
(build_wf.py). Em vez de recriar os nos, RENOMEIA os dois primeiros: o
download fica com a credencial do SharePoint e o executeOnce que ja tem, e o
Extract so ganha a aba pela expressao. Os dois do diario saem.

    n8n/_envio/ops-1-estrutura.json     a estrutura + Abas das Metas + Montar Consultas (~17 KB)
    n8n/_envio/ops-2-pecas-tema.json    o jsCode da Pecas do Tema (~52 KB)
    n8n/_envio/ops-3-pecas-pagina.json  o jsCode da Pecas da Pagina (~47 KB)
    n8n/_envio/ops-4-montar-painel-n8n.json o jsCode do Montar Painel (~48 KB)

Cada arquivo e o "operations" de UM update_workflow (o n8n grava no
rascunho; a versao ativa segue rodando ate o publish_workflow). Depois dos
quatro: get_workflow_details salvo em arquivo e _confere_n8n.py (md5 dos 6
nos Code). Voltar atras: restore_workflow_version para a a3751072.
"""
import json
from pathlib import Path

AQUI = Path(__file__).resolve().parent
N8N = AQUI / "n8n"
ENVIO = N8N / "_envio"
ENVIO.mkdir(exist_ok=True)
js = lambda f: (N8N / f).read_text(encoding="utf-8").replace("\r\n", "\n")  # noqa: E731

estrutura = [
    # as ligacoes antigas da cadeia das metas
    {"type": "removeConnection", "source": "Ler Metas Mensais", "target": "Metas Mensais"},
    {"type": "removeConnection", "source": "Metas Mensais", "target": "Ler Metas Diárias"},
    {"type": "removeConnection", "source": "Ler Metas Diárias", "target": "Metas Diárias"},
    {"type": "removeConnection", "source": "Metas Diárias", "target": "Montar Consultas"},
    {"type": "removeNode", "nodeName": "Ler Metas Diárias"},
    {"type": "removeNode", "nodeName": "Metas Diárias"},
    # os dois que ficam, com o nome novo (o Montar Painel le $('Metas') e $('Abas das Metas'))
    {"type": "renameNode", "oldName": "Ler Metas Mensais", "newName": "Ler Metas"},
    {"type": "renameNode", "oldName": "Metas Mensais", "newName": "Metas"},
    {"type": "setNodePosition", "nodeName": "Metas", "position": [1344, 0]},
    {"type": "setNodeParameter", "nodeName": "Metas", "path": "/options/sheetName", "value": "={{ $json.aba }}"},
    {"type": "addNode", "node": {"name": "Abas das Metas", "type": "n8n-nodes-base.code", "typeVersion": 2,
                                 "position": [1120, 0],
                                 "parameters": {"mode": "runOnceForAllItems", "language": "javaScript",
                                                "jsCode": js("abas-metas.js")}}},
    {"type": "addConnection", "source": "Ler Metas", "target": "Abas das Metas"},
    {"type": "addConnection", "source": "Abas das Metas", "target": "Metas"},
    {"type": "addConnection", "source": "Metas", "target": "Montar Consultas"},
    # os status do sistema no mensal (as colunas s1..s18 do mes_veic)
    {"type": "setNodeParameter", "nodeName": "Montar Consultas", "path": "/jsCode", "value": js("montar-consultas.js")},
]
arquivos = [("ops-1-estrutura.json", estrutura)]
for i, (no, f) in enumerate([("Peças do Tema", "pecas-tema.js"), ("Peças da Página", "pecas-pagina.js"),
                              ("Montar Painel", "montar-painel-n8n.js")], start=2):
    arquivos.append(("ops-%d-%s.json" % (i, f[:-3]), [{"type": "setNodeParameter", "nodeName": no, "path": "/jsCode", "value": js(f)}]))
for nome, ops in arquivos:
    t = json.dumps(ops, ensure_ascii=False)
    (ENVIO / nome).write_text(t, encoding="utf-8", newline="\n")
    print("%-28s %3d operação(ões) · %6.1f KB" % (nome, len(ops), len(t.encode("utf-8")) / 1024))
