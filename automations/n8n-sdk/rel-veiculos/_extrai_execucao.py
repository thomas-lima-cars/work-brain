# -*- coding: utf-8 -*-
"""Tira o HTML e o DADOS de um dump de execucao salvo pelo harness.

Por que existe: o no `Montar HTML` devolve ~3 MB de JSON e ~2,8 MB de HTML.
Um resultado desse tamanho nao cabe na conversa -- o harness grava o retorno
inteiro num arquivo em .claude/.../tool-results/ e me entrega so o caminho.
Este script le esse arquivo e materializa os dois artefatos no repo, do mesmo
jeito que os runs anteriores (saida-49823.html, dados-49823.json).

    python _extrai_execucao.py            # pega o dump mais recente
    python _extrai_execucao.py <arquivo>  # ou um especifico
"""
import glob
import io
import json
import os
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
DUMPS = os.path.join(
    os.path.expanduser("~"), ".claude", "projects",
    "C--Users-thoma-Documents-work-brain", "*", "tool-results",
    "*get_workflow_execution*.txt")


def achar():
    cs = glob.glob(DUMPS)
    if not cs:
        raise SystemExit("nenhum dump de execucao encontrado em " + DUMPS)
    return sorted(cs, key=os.path.getmtime)[-1]


caminho = sys.argv[1] if len(sys.argv) > 1 else achar()
print("dump:   " + caminho)
print("        " + str(os.path.getsize(caminho)) + " bytes")

d = json.load(io.open(caminho, encoding="utf-8"))
ex = d.get("execution", {})
eid = str(ex.get("id", "?"))
print("execucao: " + eid + "  status=" + str(ex.get("status")))

run = d.get("data", {}).get("resultData", {}).get("runData", {})
if "Montar HTML" not in run:
    raise SystemExit("o dump nao tem o no 'Montar HTML'. Nos: " + ", ".join(run.keys()))

no = run["Montar HTML"][0]
if no.get("error"):
    print("ERRO NO NO:")
    print(json.dumps(no["error"], ensure_ascii=False, indent=2)[:2000])
    raise SystemExit(1)

item = no["data"]["main"][0][0]["json"]
html = item["html"]
dados = item["DADOS"]

fh = os.path.join(AQUI, "saida-" + eid + ".html")
fd = os.path.join(AQUI, "dados-" + eid + ".json")
io.open(fh, "w", encoding="utf-8").write(html)
io.open(fd, "w", encoding="utf-8").write(
    json.dumps(dados, ensure_ascii=False))

r = dados.get("resumo", {})
print("")
print("saida-" + eid + ".html   " + str(len(html)) + " chars")
print("dados-" + eid + ".json")
print("")
print("veiculos ......... " + str(r.get("veiculos")))
print("lojas elegiveis .. " + str(r.get("lojas_elegiveis")))
print("lojas no universo  " + str(r.get("lojas_no_universo")))
print("pares ............ " + str(r.get("pares")))
print("eventos .......... " + str(r.get("eventos")))
print("sem par .......... " + str(r.get("sem_par")))
print("")
falhas = dados.get("falhas", [])
print("falhas: " + str(len(falhas)))
for f in falhas:
    print("  - " + f)
ruins = [x for x in dados.get("diagnostico", []) if x.get("veredito") != "ok"]
print("queries com problema: " + str(len(ruins)))
for x in ruins:
    print("  - " + x.get("queryName", "?") + ": " + str(x.get("veredito")) +
          ((" | " + str(x.get("erro"))) if x.get("erro") else ""))
