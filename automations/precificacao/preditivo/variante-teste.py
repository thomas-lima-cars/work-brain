"""Modelo TESTE contra o atual: sem as Observacoes, laudo por itens de confianca alta.

    python automations/precificacao/preditivo/variante-teste.py

Pedido do Thomas em 14/10. Quatro versoes, para separar o efeito de cada mudanca:
    atual                    o G de resultado-modelo.json (mesmos blocos)
    sem Observacoes          G sem os sinais do texto do anuncio
    laudo por itens          G com os itens do laudo de confianca alta no lugar
                             dos indicadores do laudo e da lataria
    variante pedida          as duas mudancas juntas

Mesma regua do modelo oficial: tres janelas de validacao (jan-fev, mar-abr,
mai-jun) e teste mes a mes (jul-set), re-treinando com o passado. A lista de
itens de confianca alta e recalculada SO com o treino de cada mes -- a do painel
usa vendas do periodo de teste e vazaria o futuro.

Grava `variante-teste.json`. Nao mexe no modelo oficial.
"""
import importlib.util
import json
import sys
from pathlib import Path

import numpy as np

sys.stdout.reconfigure(encoding="utf-8")
AQUI = Path(__file__).resolve().parent
_sp = importlib.util.spec_from_file_location("_mp", AQUI / "modelo-preco.py")
mp = importlib.util.module_from_spec(_sp)
_sp.loader.exec_module(mp)

R = json.loads((AQUI / "resultado-modelo.json").read_text("utf-8"))
BASE_CONF = {k: R["conf"][k] for k in ("extras", "num", "versao", "meia_vida", "hgb")}
VERSOES = [
    ("atual", "Modelo atual (G)", False, False),
    ("sem_obs", "Sem as Observações do veículo", True, False),
    ("itens", "Laudo por itens de confiança alta", False, True),
    ("variante", "Variante pedida: sem Observações + laudo por itens", True, True),
]
ALPHA = R["alpha"]["E"]


def configura(sem_texto, itens_alta):
    mp.CONF.clear()
    mp.CONF.update(json.loads(json.dumps(BASE_CONF)))
    mp.CONF.update({"sem_texto": sem_texto, "itens_alta": itens_alta})


def main():
    linhas = mp.carrega()
    saida = {"gerado_em": R["gerado_em"], "conf_base": BASE_CONF, "versoes": []}
    preds = {}
    for chave, rotulo, st, it in VERSOES:
        configura(st, it)
        val, janelas = mp.erro_janelas(linhas, "G", ALPHA)
        ls, ps = mp.mes_a_mes(linhas, "G", "boost", ALPHA, False)
        preds[chave] = (ls, ps)

        def med(f):
            ix = [i for i, x in enumerate(ls) if f(x)]
            return mp.metricas([ls[i] for i in ix], ps[ix])
        v = {"chave": chave, "rotulo": rotulo, "validacao": val, "janelas": janelas,
             "teste": med(lambda x: True), "teste_estudo": med(lambda x: x["estudo"]),
             "teste_laudo_lido": med(lambda x: x["laudo_lido"]),
             "itens_setembro": list(mp.ULTIMOS_ITENS) if it else None}
        saida["versoes"].append(v)
        t = v["teste"]
        print("%-52s valid %.2f%% | teste med %.2f%% ±10 %.1f%% MAE %5.0f | estudo med %.2f%% | lido med %.2f%% (n=%d)"
              % (rotulo, 100 * val, 100 * t["erro_mediano"], 100 * t["dentro_10"], t["mae_reais"],
                 100 * v["teste_estudo"]["erro_mediano"], 100 * v["teste_laudo_lido"]["erro_mediano"],
                 v["teste_laudo_lido"]["n"]))
    # carro a carro: em quantas vendas a variante chega mais perto que o atual
    (la, pa), (lv, pv) = preds["atual"], preds["variante"]
    assert [x["id"] for x in la] == [x["id"] for x in lv]
    real = np.array([x["venda"] for x in la])
    fipe = np.array([x["fipe"] for x in la])
    ea, ev = np.abs(fipe * pa - real), np.abs(fipe * pv - real)
    saida["carro_a_carro"] = {"variante_mais_perto": float(np.mean(ev < ea)),
                              "atual_mais_perto": float(np.mean(ea < ev)),
                              "diferenca_mediana_reais": float(np.median(np.abs(fipe * pv - fipe * pa)))}
    print("carro a carro: variante mais perto em %.0f%%, atual em %.0f%%; as previsoes diferem R$ %.0f na mediana"
          % (100 * saida["carro_a_carro"]["variante_mais_perto"], 100 * saida["carro_a_carro"]["atual_mais_perto"],
             saida["carro_a_carro"]["diferenca_mediana_reais"]))
    itens = saida["versoes"][-1]["itens_setembro"]
    print("itens de confianca alta no treino de setembro (%d):" % len(itens))
    for i in itens:
        print("   ", i)
    (AQUI / "variante-teste.json").write_text(json.dumps(saida, ensure_ascii=False), "utf-8")
    print("gravado variante-teste.json")


if __name__ == "__main__":
    main()
