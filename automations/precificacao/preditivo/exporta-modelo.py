"""Exporta o modelo de preco para JSON, para o n8n aplicar em JavaScript.

    python automations/precificacao/preditivo/exporta-modelo.py

Sai:
  modelo.json         tudo o que o avaliador JS precisa (sobe para o SharePoint)
  modelo-gabarito.json  400 vendas: entrada crua, matriz e previsao do Python,
                      para `prova-modelo-js.js` conferir o JS numero a numero

── POR QUE ASSIM ────────────────────────────────────────────────────────────
O n8n nao roda Python. O TREINO continua aqui (mensal, com VPN); o n8n so
AVALIA: percorre as arvores do gradient boosting, o que e uma soma de folhas.
Decidido com o Thomas em 14/10.

── O QUE VAI NO JSON ────────────────────────────────────────────────────────
  partida      media da razao por (base, modelo) e por base -- o ponto de partida
  colunas      a ordem exata das colunas da matriz: one-hot, log(FIPE), km, numericas
  arvores      tres modelos: preco (media), quantil 10% e 90%. Cada no:
               [coluna, limite, vazio_vai_esquerda, esquerda, direita, folha?, valor]
  calibracao   escala k da faixa e a logistica que traduz largura em probabilidade
  sinais       as expressoes do texto do anuncio (analisa-sinais.py)
  faixas       km, idade e FIPE -- os rotulos que o treino usou

Regra do projeto mantida: VMV e valor da venda nao estao em lugar nenhum daqui.
"""
import importlib.util
import json
import random
import sys
from collections import defaultdict
from math import erf, sqrt
from pathlib import Path

import numpy as np
from sklearn.linear_model import LogisticRegression

sys.stdout.reconfigure(encoding="utf-8")
AQUI = Path(__file__).resolve().parent
ESTUDO = AQUI.parent
_sp = importlib.util.spec_from_file_location("_mp", AQUI / "modelo-preco.py")
mp = importlib.util.module_from_spec(_sp)
_sp.loader.exec_module(mp)
from analisa_sinais_lib import SINAIS  # noqa: E402  (o modelo-preco ja pos ESTUDO no path)

R = json.loads((AQUI / "resultado-modelo.json").read_text("utf-8"))
ALPHA = R["alpha"]["E"]


def configura():
    # parte dos padroes do modelo (as opcoes da variante, desligadas) e aplica o
    # conf gravado -- um resultado antigo nao conhece as opcoes novas
    mp.CONF.update({"sem_texto": False, "itens_alta": False})
    mp.CONF.update(json.loads(json.dumps(R["conf"])))
    mp.FINAL = R["final"]


def arvores(m):
    """sklearn HistGradientBoostingRegressor -> listas compactas"""
    out = []
    for it in m._predictors:
        for p in it:
            out.append([[int(n["feature_idx"]), float(n["num_threshold"]), int(n["missing_go_to_left"]),
                         int(n["left"]), int(n["right"]), int(n["is_leaf"]), float(n["value"])]
                        for n in p.nodes])
    return {"base": float(np.ravel(m._baseline_prediction)[0]), "arvores": out}


def partida(treino):
    """as tabelas do deslocamento (o mesmo calculo de modelo-preco.deslocamento)"""
    pb, sg, ng = defaultdict(list), defaultdict(float), defaultdict(int)
    for x in treino:
        pb[x["base"]].append(x["razao"])
        sg[x["g"]] += x["razao"]
        ng[x["g"]] += 1
    mb = {b: sum(v) / len(v) for b, v in pb.items()}
    k = mp.K_ENCOLHE
    mg = {g: (sg[g] + k * mb[g.split("|")[0]]) / (ng[g] + k) for g in sg}
    return {"base": mb, "modelo": mg, "n_modelo": dict(ng)}


def main():
    configura()
    if mp.CONF.get("versao") or mp.CONF.get("meia_vida") or R.get("temperatura"):
        raise SystemExit("o avaliador JS nao implementa versao, meia_vida nem temperatura")
    linhas = mp.carrega()

    # ── calibracao: a mesma do modelo oficial (treino ate abril, valida mai-jun)
    treino = [x for x in linhas if x["data"] < mp.FIM_TREINO]
    valid = [x for x in linhas if mp.FIM_TREINO <= x["data"] < mp.FIM_VALID]
    pF, _ = mp.ajusta(treino, mp.FINAL, "boost", ALPHA, False)
    lo, hi = mp.faixas(treino, ALPHA, False)(valid)
    p = pF(valid)
    meia = np.maximum((hi - lo) / 2, 1e-4) / p
    errel = np.abs(np.array([x["razao"] for x in valid]) - p) / p
    K = float(np.quantile(errel / meia, 0.80))
    bruto, _, _ = mp.indice(p, lo, hi, K)
    logit = lambda q: np.log(np.clip(q, 1e-3, 1 - 1e-3) / (1 - np.clip(q, 1e-3, 1 - 1e-3)))  # noqa: E731
    lr = LogisticRegression().fit(logit(bruto).reshape(-1, 1), (errel <= 0.10).astype(int))
    print("calibracao: k = %.3f · logistica a = %.4f b = %.4f (oficial k = %.3f)"
          % (K, lr.coef_[0][0], lr.intercept_[0], R["k_faixa"]))

    # ── modelo final: TODAS as vendas disputadas disponiveis ─────────────
    prev, (M, m_med, _o) = mp.ajusta(linhas, mp.FINAL, "boost", ALPHA, False)
    p_lo, (_m1, m_lo, _o1) = mp.ajusta(linhas, mp.FINAL, "boost", ALPHA, False, quantil=0.10)
    p_hi, (_m2, m_hi, _o2) = mp.ajusta(linhas, mp.FINAL, "boost", ALPHA, False, quantil=0.90)
    nums = [k for c in mp.CONF["num"] for k in mp.GRUPOS_NUM.get(c, [c])]
    modelo = {
        "versao": "G-" + R["gerado_em"],
        "treinado_com": {"vendas": len(linhas), "de": min(x["data"] for x in linhas),
                         "ate": max(x["data"] for x in linhas), "bases": sorted({x["base"] for x in linhas}),
                         "min_lojas": mp.MIN_LOJAS},
        "teste": {k: R["escada"][-1]["teste"][k] for k in ("erro_mediano", "dentro_10", "mae_reais", "vies", "n")},
        "conf": mp.CONF, "cats": M.cats, "prefixos": M.pref,
        "colunas": M.nomes + ["log_fipe", "km"] + nums, "n_onehot": len(M.nomes), "numericas": nums,
        "partida": partida(linhas),
        "arvores": {"preco": arvores(m_med), "q10": arvores(m_lo), "q90": arvores(m_hi)},
        "calibracao": {"k": K, "z90": mp.Z90, "a": float(lr.coef_[0][0]), "b": float(lr.intercept_[0])},
        "sinais": [{"rotulo": s["rotulo"], "rx": s["rx"], "bloqueio": s["bloqueio"]} for s in SINAIS],
        "faixas": {
            "km": [[20000, "a até 20k"], [40000, "b 20 a 40k"], [60000, "c 40 a 60k"], [80000, "d 60 a 80k"],
                   [100000, "e 80 a 100k"], [150000, "f 100 a 150k"], [200000, "g 150 a 200k"]],
            "km_acima": "h 200k ou mais", "km_vazio": "z sem km",
            "idade": [[1, "a 0 a 1 ano"], [2, "b 2 anos"], [3, "c 3 anos"], [4, "d 4 anos"], [5, "e 5 anos"],
                      [6, "f 6 anos"], [7, "g 7 anos"], [9, "h 8 a 9 anos"], [14, "i 10 a 14 anos"]],
            "idade_acima": "j 15 anos ou mais", "idade_vazio": "z sem ano",
            "fipe": [[20000, "a até 20 mil"], [35000, "b 20 a 35 mil"], [50000, "c 35 a 50 mil"],
                     [70000, "d 50 a 70 mil"], [100000, "e 70 a 100 mil"], [150000, "f 100 a 150 mil"]],
            "fipe_acima": "g 150 mil ou mais",
        },
        "modelos_cobertos": sorted({x["modelo"] for x in linhas if x["base"] == "Cars2You"}),
    }
    texto = json.dumps(modelo, ensure_ascii=False, separators=(",", ":"))
    # trava nos NOMES das colunas e categorias -- os sinais de texto citam
    # "por conta do comprador" e sao legitimos (falso positivo em 14/10)
    for n in modelo["colunas"] + modelo["cats"]:
        chave = n.split("=")[0].lower()
        if not chave.startswith("texto: ") and chave.startswith(mp.PROIBIDO):
            raise SystemExit("variavel proibida no modelo exportado: " + n)
    (AQUI / "modelo.json").write_text(texto, "utf-8")
    print("modelo.json: %.0f KB · %d colunas · %d arvores por modelo · %d vendas"
          % (len(texto.encode()) / 1024, len(modelo["colunas"]), len(modelo["arvores"]["preco"]["arvores"]),
             len(linhas)))

    # ── gabarito: entrada CRUA (como o n8n vai receber) + o que o Python preve
    crus = {}
    evento = json.loads((AQUI / "evento.json").read_text("utf-8"))
    for arq, base in mp.BASES.items():
        for nome in ("analitico-%s.json" % arq, "analitico-amplo-%s.json" % arq):
            for r in json.loads((ESTUDO / nome).read_text("utf-8"))["vendas"]:
                crus[(base, str(int(float(r["veiculo_id"]))), (r.get("data_venda") or "")[:10])] = r
    random.seed(7)
    amostra = random.sample([x for x in linhas if not x["laudo_lido"]], 400)
    campos = ("grupo", "veiculo_id", "negociacao_id", "valor_fipe_anuncio", "km", "ano_modelo", "ano_fabricacao",
              "data_venda", "patio_uf", "whitelabel_id", "categoria", "laudo", "descricao", "loja_id", "cor",
              "cambio", "combustivel", "carroceria", "valor_molicar_anuncio", "valor_fipe_veiculo", "versao")
    gab = []
    X = M(amostra)
    pm, pl, ph = prev(amostra), p_lo(amostra), p_hi(amostra)
    idx, flo, fhi = mp.indice(pm, pl, ph, K)
    conf = lr.predict_proba(logit(idx).reshape(-1, 1))[:, 1]
    for i, x in enumerate(amostra):
        r = crus[(x["base"], x["id"], x["data"])]
        ev = evento[x["base"]].get(str(int(float(r["negociacao_id"]))), {})
        gab.append({"base": x["base"], "cru": {c: r.get(c) for c in campos}, "evento": ev,
                    "onehot": [int(j) for j in np.flatnonzero(X[i])],
                    "num": [None if np.isnan(v) else float(v) for v in
                            [np.log(x["fipe"]), x["km"] if x["km"] is not None else np.nan] +
                            [x["num"][k] for k in nums]],
                    "razao": float(pm[i]), "q10": float(pl[i]), "q90": float(ph[i]), "conf": float(conf[i])})
    (AQUI / "modelo-gabarito.json").write_text(json.dumps(gab, ensure_ascii=False), "utf-8")
    print("modelo-gabarito.json: %d vendas" % len(gab))


if __name__ == "__main__":
    main()
