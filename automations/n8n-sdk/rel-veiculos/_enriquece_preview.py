# -*- coding: utf-8 -*-
"""PREVIEW do extrato, sem gastar uma execucao nova.

O extrato precisa de `idade_desvio`, `km_desvio` e dos pesos. Esses campos
passaram a ser publicados agora, entao o `dados-49823.json` (coletado antes
da mudanca) nao os tem.

Aqui eu completo:
  - idade_desvio e km_desvio vem do `dados-49803.json`, o relatorio de lojas
    ofertantes, casado por loja_id. E a MESMA janela de 6 meses, coletada
    ~2h antes. Num agregado semestral a diferenca e desprezivel, mas NAO e
    o mesmo run -- por isso o arquivo sai marcado como preview.
  - p_preco, p_idade, p_km: recalculados de 1/(1 + desvio/media).
  - confianca: min(1, qt_veiculos / 5).

Isto serve para VALIDAR O FORMATO. Os numeros definitivos saem da proxima
execucao do workflow, que ja publica tudo de um run so.

    python _enriquece_preview.py
"""
import io
import json
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
CONF_MIN = 5


def carrega(nome):
    return json.loads(io.open(os.path.join(AQUI, nome), encoding="utf-8").read())


D = carrega("dados-49823.json")
perfil = carrega(os.path.join("..", "lojas-ofertas", "dados-49803.json"))
por_id = {l["loja_id"]: l for l in perfil["linhas"]}


def peso(media, desvio):
    if not media or media <= 0 or desvio is None:
        return 0.0
    return round(1.0 / (1.0 + (desvio / media)), 3)


achou = 0
faltou = []
for l in D["lojas"]:
    p = por_id.get(l["loja_id"])
    if p:
        achou += 1
        l["idade_desvio"] = p.get("idade_desvio")
        l["km_desvio"] = p.get("km_desvio")
    else:
        faltou.append(l["loja_id"])
        l["idade_desvio"] = None
        l["km_desvio"] = None
    l["p_preco"] = peso(l.get("preco_medio"), l.get("preco_desvio"))
    l["p_idade"] = peso(l.get("idade_media"), l.get("idade_desvio"))
    l["p_km"] = peso(l.get("km_medio"), l.get("km_desvio"))
    l["confianca"] = round(min(1.0, (l.get("qt_veiculos") or 0) / float(CONF_MIN)), 2)

D["_preview"] = {
    "aviso": "idade_desvio e km_desvio vieram da execucao 49803, nao da 49823",
    "lojas_casadas": achou,
    "lojas_sem_par_no_perfil": len(faltou),
}

destino = os.path.join(AQUI, "dados-49823-preview.json")
io.open(destino, "w", encoding="utf-8").write(json.dumps(D, ensure_ascii=False))
print("lojas no relatorio: " + str(len(D["lojas"])))
print("casadas com o perfil da 49803: " + str(achou))
print("sem correspondencia: " + str(len(faltou)))
com_peso = sum(1 for l in D["lojas"] if l["p_idade"] > 0 and l["p_km"] > 0)
print("com peso de idade e km preenchidos: " + str(com_peso))
print("gerado: dados-49823-preview.json")
