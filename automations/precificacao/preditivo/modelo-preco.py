"""Modelo preditivo de preco de venda -- e o teste dele contra vendas reais.

    python automations/precificacao/preditivo/modelo-preco.py

Sai `resultado-modelo.json`, que `monta-relatorio.js` transforma em pagina.
Precisa de numpy e scikit-learn (instalados com --user em 14/10; por isso NAO
rodar com `python -I`, que desliga o site-packages do usuario).

── O QUE PREVE ──────────────────────────────────────────────────────────────
A RAZAO venda / FIPE do anuncio (= 1 - desagio). O preco previsto e
FIPE x razao prevista. Prever a razao, e nao o preco em reais, faz um Gol e uma
Hilux falarem a mesma lingua: "sai por 70% da tabela".

── COMO A ASSERTIVIDADE E MEDIDA ────────────────────────────────────────────
Por TEMPO, como o modelo seria usado: re-treinado todo mes com tudo o que veio
antes, e cobrado no mes seguinte.
    validacao  treino ate abril, mede maio e junho -> escolhe algoritmo,
               regularizacao e se a temperatura do mercado entra
    teste      julho, agosto e setembro, cada um previsto so com o passado
Sorteio aleatorio deixaria o modelo "ver o futuro" (carro do mesmo lote, mesmo
evento, mesma semana no treino e no teste) e o acerto sairia otimista. O teste
nao escolhe nada: so mede.

── A ESCADA ─────────────────────────────────────────────────────────────────
Cada degrau acrescenta UM bloco de informacao, e a pagina mostra quanto cada
bloco melhora. Indicador que nao melhora o teste nao se paga.
    A  so a media da base            (o chute ingenuo)
    B  + o modelo do carro           (marca + modelo, normalizados)
    C  + km, idade, UF, canal, categoria, faixa de FIPE, laudo do banco
    D  + sinais do texto do anuncio  (analisa-sinais.py)
    E  + indicadores do laudo em PDF (laudo_sinais.py)
    F  o conjunto do E com gradient boosting, se a validacao preferir

O modelo do carro entra como DESLOCAMENTO: a media dele no treino, encolhida
para a media da base quando ha poucas vendas (k = 10). O resto aprende o
residuo -- o mesmo "efeito dentro do modelo" do painel.

── TEMPERATURA DO MERCADO ───────────────────────────────────────────────────
Medido em 14/10: a razao da Dealers caiu de 0,707 (junho) para 0,673 (julho).
Um modelo treinado no ano inteiro superestima o mes seguinte. A temperatura e
quanto a base esta acima ou abaixo da propria media nos ultimos 60 dias do
treino; entra so na PREVISAO, nunca no alvo do treino.
"""

import importlib.util
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

import numpy as np
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.linear_model import LogisticRegression
from sklearn.linear_model import Ridge

sys.stdout.reconfigure(encoding="utf-8")
AQUI = Path(__file__).resolve().parent
ESTUDO = AQUI.parent
sys.path.insert(0, str(ESTUDO))
from analisa_sinais_lib import SINAIS, norm  # noqa: E402
import laudo_sinais  # noqa: E402
import laudo_itens  # noqa: E402

# as faixas de km e idade sao as do painel -- importadas, nao copiadas
_spec = importlib.util.spec_from_file_location("_mpd", ESTUDO / "monta-painel-dados.py")
_mpd = importlib.util.module_from_spec(_spec)
_argv, sys.argv = sys.argv, sys.argv[:1]
_spec.loader.exec_module(_mpd)
sys.argv = _argv
faixa_km, faixa_idade, num = _mpd.faixa_km, _mpd.faixa_idade, _mpd.n

BASES = {"cars2you": "Cars2You", "dealers": "Dealers"}
FIM_TREINO, FIM_VALID = "2026-05-01", "2026-07-01"
MESES_TESTE = ["2026-07", "2026-08", "2026-09"]
K_ENCOLHE = 10
DIAS_RECENTES = 60
TEXTOS_LAUDO = ESTUDO / "laudos" / "textos-vendas"

DEGRAUS = [("A", "Só a média da base"), ("B", "+ modelo do carro"),
           ("C", "+ km, idade, UF, canal, categoria, FIPE e laudo do banco"),
           ("D", "+ sinais do texto do anúncio"), ("E", "+ indicadores do laudo em PDF")]


def faixa_fipe(f):
    for lim, rot in ((20000, "a até 20 mil"), (35000, "b 20 a 35 mil"), (50000, "c 35 a 50 mil"),
                     (70000, "d 50 a 70 mil"), (100000, "e 70 a 100 mil"),
                     (150000, "f 100 a 150 mil")):
        if f < lim:
            return rot
    return "g 150 mil ou mais"


def vmv_valido(vmv, fipe):
    v = num(vmv)
    return round(v, 2) if fipe > 0 and 0.2 <= v / fipe <= 1.5 else None


# 🔴 REGRA DO PROJETO (Thomas, 14/10): o modelo existe para ser CONFRONTADO com
# o VMV e com o valor da venda. Nenhum dos dois pode entrar como variavel.
# A venda so aparece como alvo do treino, e o treino so ve meses anteriores.
PROIBIDO = ("vmv", "venda", "valor_ref", "comprador", "status")

# 🔴 VENDA SEM DISPUTA SAI DA ANALISE (Thomas, 14/10): com poucas lojas dando
# lance o preco para no VMV, e o modelo aprenderia o VMV por tabela. Medido em
# 14/10 na Cars2You, % de vendas que fecharam a ate 2% do VMV:
#     1 loja 67% · 2 lojas 33% · 3 lojas 10% · 4+ lojas 5 a 6%
# A partir de 3 a taxa estabiliza: e ali que o preco passa a ser de mercado.
# Vale para treino E teste. Contagem em `disputa.json` (coleta-disputa.py).
MIN_LOJAS = 3


DESCARTE = defaultdict(int)


# ── 1. as vendas, com tudo o que se sabe ANTES da venda ─────────────────
def carrega():
    sinais_rx = [(s["rotulo"], re.compile(s["rx"]),
                  re.compile(s["bloqueio"]) if s["bloqueio"] else None) for s in SINAIS]
    disputa = json.loads((AQUI / "disputa.json").read_text("utf-8"))
    evento = json.loads((AQUI / "evento.json").read_text("utf-8"))
    DESCARTE.clear()
    linhas = []
    for arq, base in BASES.items():
        # amostra do estudo (20 modelos) + a ampliada do preditivo (100 modelos,
        # roda-estudo.py --sufixo amplo), sem repetir negociacao. "estudo" marca
        # as vendas da amostra original: e nelas que o teste continua comparavel.
        estudo = json.loads((ESTUDO / ("analitico-%s.json" % arq)).read_text("utf-8"))["vendas"]
        ids_estudo = {str(r.get("negociacao_id")) for r in estudo}
        p_amplo = ESTUDO / ("analitico-amplo-%s.json" % arq)
        todas, vistas = [], set()
        for r in (json.loads(p_amplo.read_text("utf-8"))["vendas"] if p_amplo.exists() else []) + estudo:
            k = str(r.get("negociacao_id"))
            if k not in vistas:
                vistas.add(k)
                todas.append(r)
        for r in todas:
            f, v = num(r.get("valor_fipe_anuncio")), num(r.get("venda"))
            if f <= 0 or v <= 0:
                continue
            # conta de teste vendendo em producao (medido em 14/10: 26 vendas nas
            # duas bases, "Teste Cars2you v3", "Dealers Club - Teste 1"...) nao e mercado
            if re.search(r"teste|tutorial", (r.get("loja") or "").lower()):
                continue
            lances, lojas = disputa[base][str(int(num(r.get("negociacao_id"))))]
            DESCARTE[base] += lojas < MIN_LOJAS
            if lojas < MIN_LOJAS:
                continue
            vid = str(int(num(r.get("veiculo_id"))))
            txt = norm(r.get("descricao"))
            x = {
                "base": base, "id": vid, "g": "%s|%s" % (base, r.get("grupo")),
                "modelo": r.get("grupo"), "versao": r.get("versao") or "",
                "ano": r.get("ano_modelo") or "", "data": (r.get("data_venda") or "")[:10],
                "km": None if r.get("km") in (None, "", "None") else int(num(r.get("km"))),
                "uf": (r.get("patio_uf") or "").strip().upper() or "sem UF",
                "fipe": f, "venda": v, "razao": v / f, "cat": {}, "bin": {},
                # VMV so para CONFRONTO na pagina. Fica fora de "cat" e "bin",
                # que sao a unica coisa que a Matriz le. Valido entre 20% e
                # 150% da FIPE: na Dealers e 999000 em 98% das vendas.
                "vmv": vmv_valido(r.get("vmv"), f),
                "lojas": lojas, "lances": lances,
                "estudo": str(r.get("negociacao_id")) in ids_estudo,
            }
            x["cat"]["km"] = base + ":" + faixa_km(r.get("km"))
            x["cat"]["idade"] = base + ":" + faixa_idade(r.get("ano_modelo"), r.get("data_venda"))
            x["cat"]["uf"] = x["uf"]
            x["cat"]["canal"] = "%s:wl%s" % (base, r.get("whitelabel_id"))
            x["cat"]["categoria"] = r.get("categoria") or "nao informada"
            x["cat"]["faixa_fipe"] = faixa_fipe(f)
            x["cat"]["laudo_banco"] = (r.get("laudo") or "").strip() or "sem laudo"
            for rot, rx, bl in sinais_rx:
                if rx.search(txt) and not (bl and bl.search(txt)):
                    x["bin"]["texto: " + rot] = 1
            p = TEXTOS_LAUDO / arq / ("%s.txt" % vid)
            x["laudo_lido"] = False
            if p.exists():
                txt_laudo = p.read_text(encoding="utf-8", errors="replace")
                ld = laudo_sinais.ler(txt_laudo)
                if ld["legivel"]:
                    x["laudo_lido"] = True
                    x["bin"]["laudo PDF: lido"] = 1
                    for rot in ld["sinais"]:
                        x["bin"]["laudo PDF: " + rot] = 1
                    x["cat"]["lataria"] = laudo_sinais.faixa_lataria(ld["lataria"])
                    # item a item (presente / ausente / danificado) -- bloco G
                    for item, (est, _t) in (laudo_itens.ler(txt_laudo) or {}).items():
                        x["bin"]["item: %s=%s" % (item, est)] = 1
            # ── candidatos do degrau G: tudo conhecido ANTES do leilao ──────
            # vendedor = comitente (loja que anuncia), nunca o comprador
            x["cat"]["vendedor"] = "%s:%s" % (base, r.get("loja_id"))
            x["vendedor_nome"] = (r.get("loja") or "?").strip()
            x["cat"]["patio"] = "%s:%s" % (base, r.get("patio"))
            for c in ("cor", "cambio", "combustivel", "carroceria"):
                x["cat"][c] = (str(r.get(c) or "nao informado")).strip().lower()
            x["gv"] = "%s|%s" % (x["g"], x["versao"])
            am, af = num(r.get("ano_modelo")), num(r.get("ano_fabricacao"))
            dv = (r.get("data_venda") or "")[:4]
            mol, fv = num(r.get("valor_molicar_anuncio")), num(r.get("valor_fipe_veiculo"))
            x["num"] = {
                "idade": (int(dv) - am) if dv.isdigit() and am > 1950 else np.nan,
                "fab": (am - af) if am > 1950 and af > 1950 else np.nan,
                "molicar": mol / f if mol > 0 and 0.3 < mol / f < 2 else np.nan,
                "fipe_veic": fv / f if fv > 0 and 0.5 < fv / f < 2 else np.nan,
            }
            # o evento, fixado antes do primeiro lance (coleta-evento.py)
            ev = evento[base].get(str(int(num(r.get("negociacao_id")))), {})
            for k in ("n_evento", "n_mesmo", "n_wl", "n_grupos", "dias", "dia_semana", "hora"):
                v_ = ev.get(k)
                x["num"][k] = float(v_) if v_ is not None else np.nan
            linhas.append(x)
    return linhas


# ── DEGRAU G: o E mais os blocos que a VALIDACAO aprovou ─────────────────
# Quem preenche CONF e a selecao em main(); os degraus A-F nao leem daqui, e por
# isso continuam iguais para a comparacao. Candidatos:
#   extras  vendedor, patio, cor, cambio, combustivel, carroceria, itens
#   num     idade, fab, molicar, fipe_veic   (colunas continuas do boosting)
#   versao  ponto de partida pela VERSAO, encolhido para o modelo (k = 10)
#   meia_vida  peso das vendas antigas cai pela metade a cada N dias
#   hgb     parametros do gradient boosting
HGB_PADRAO = dict(max_iter=400, learning_rate=0.04, max_leaf_nodes=15,
                  min_samples_leaf=40, l2_regularization=1.0)
CONF = {"extras": [], "num": [], "versao": False, "meia_vida": None, "hgb": dict(HGB_PADRAO),
        # VARIANTE DE TESTE (14/10, pedido do Thomas) -- desligadas no modelo oficial:
        #   sem_texto    tira os sinais do texto do anuncio (aba Observacoes)
        #   itens_alta   troca os indicadores do laudo e a lataria pelos ITENS do
        #                laudo (presente/ausente/danificado) com confianca alta,
        #                medida SO NO TREINO de cada mes (|t| >= 3,3, n >= 30) --
        #                a lista do painel usa vendas do periodo de teste
        "sem_texto": False, "itens_alta": False}
T_ITENS, N_MIN_ITENS = 3.3, 30
CANDIDATOS = ["vendedor", "versao", "itens", "acabamento", "patio",
              "num:idade", "num:fab", "num:molicar", "num:fipe_veic",
              "num:ev_tamanho", "num:ev_alcance", "num:ev_calendario"]
# candidatos numericos que sao um grupo de colunas
ROTULO_BLOCO = {"vendedor": "vendedor", "versao": "versão", "itens": "itens do laudo",
                "acabamento": "acabamento (cor, câmbio, combustível, carroceria)", "patio": "pátio",
                "num:idade": "idade contínua", "num:fab": "ano de fabricação", "num:molicar": "Molicar",
                "num:fipe_veic": "FIPE do veículo", "num:ev_tamanho": "tamanho do evento",
                "num:ev_alcance": "alcance do evento", "num:ev_calendario": "calendário do evento"}
GRUPOS_NUM = {"ev_tamanho": ["n_evento", "n_mesmo"], "ev_alcance": ["n_wl", "n_grupos"],
              "ev_calendario": ["dias", "dia_semana", "hora"]}


def colunas(degrau):
    cats, pref = [], []
    if degrau >= "C":
        cats += ["km", "idade", "uf", "canal", "categoria", "faixa_fipe", "laudo_banco"]
    if degrau >= "D":
        pref += ["texto: "]
    if degrau >= "E":
        pref += ["laudo PDF: "]
        cats += ["lataria"]
    if degrau == "G":
        if CONF["sem_texto"]:
            pref = [p for p in pref if p != "texto: "]
        if CONF["itens_alta"]:
            # fica so o "lido" do bloco do laudo: sem ele, laudo nao lido e
            # laudo lido que nao cita o item ficariam iguais
            pref = [p for p in pref if p != "laudo PDF: "] + ["laudo PDF: lido", "item: "]
            cats = [c for c in cats if c != "lataria"]
        for e in CONF["extras"]:
            if e == "itens":
                pref += ["item: "]
            elif e == "acabamento":
                cats += ["cor", "cambio", "combustivel", "carroceria"]
            else:
                cats += [e]
    return cats, pref


class Matriz:
    """One-hot das categoricas + binarias, com o vocabulario do TREINO."""

    def __init__(self, treino, degrau, permitidos=None):
        self.cats, self.pref = colunas(degrau)
        vocab = set()
        for x in treino:
            vocab.update(self.candidatos(x))
        if permitidos is not None:
            # itens do laudo: so os aprovados no treino (variante itens_alta)
            vocab = {v for v in vocab if not v.startswith("item: ") or v in permitidos}
        self.nomes = sorted(vocab)
        self.ix = {n: i for i, n in enumerate(self.nomes)}
        vaz = [n for n in self.nomes if n.split("=")[0].lower().startswith(PROIBIDO)]
        if vaz:
            raise SystemExit("variavel proibida no modelo: %s" % vaz[:5])

    def candidatos(self, x):
        out = [c + "=" + x["cat"][c] for c in self.cats if c in x["cat"]]
        return out + [b for b in x["bin"] if any(b.startswith(p) for p in self.pref)]

    def ativos(self, x):
        return [a for a in self.candidatos(x) if a in self.ix]

    def __call__(self, linhas):
        X = np.zeros((len(linhas), len(self.nomes)), dtype=np.float32)
        for i, x in enumerate(linhas):
            for a in self.ativos(x):
                X[i, self.ix[a]] = 1.0
        return X


def deslocamento(treino, recencia=False, versao=False):
    """media da razao por (base, modelo), encolhida para a media da base,
    mais a temperatura da base se recencia=True. Com versao=True desce mais um
    nivel: a media da VERSAO, encolhida para a do modelo."""
    pb, sg, ng = defaultdict(list), defaultdict(float), defaultdict(int)
    sv, nv = defaultdict(float), defaultdict(int)
    for x in treino:
        pb[x["base"]].append(x["razao"])
        sg[x["g"]] += x["razao"]
        ng[x["g"]] += 1
        sv[x["gv"]] += x["razao"]
        nv[x["gv"]] += 1
    mb = {b: sum(v) / len(v) for b, v in pb.items()}
    mg = {g: (sg[g] + K_ENCOLHE * mb[g.split("|")[0]]) / (ng[g] + K_ENCOLHE) for g in sg}
    if versao:
        mv = {k: (sv[k] + K_ENCOLHE * mg[k.rsplit("|", 1)[0]]) / (nv[k] + K_ENCOLHE) for k in sv}
        base_de = lambda x: mv.get(x["gv"], mg.get(x["g"], mb[x["base"]]))  # noqa: E731
    else:
        base_de = lambda x: mg.get(x["g"], mb[x["base"]])  # noqa: E731
    delta = {b: 0.0 for b in mb}
    if recencia:
        ult = max(x["data"] for x in treino)
        corte = str(np.datetime64(ult) - np.timedelta64(DIAS_RECENTES, "D"))
        for b in mb:
            rec = [x["razao"] for x in treino if x["base"] == b and x["data"] >= corte]
            if len(rec) >= 50:
                delta[b] = sum(rec) / len(rec) - mb[b]
    return ((lambda x: base_de(x) + delta[x["base"]]),
            {b: mb[b] + delta[b] for b in mb})


def itens_confianca_alta(treino, residuo):
    """Pares item=estado do laudo com confianca ALTA, medidos so no treino.

    Mesma conta do painel: residuo do (base, modelo) de quem tem o par contra o
    das outras vendas de laudo lido, Welch, |t| >= T_ITENS e n >= N_MIN_ITENS."""
    from math import sqrt
    lidos = [(x, r) for x, r in zip(treino, residuo) if x["laudo_lido"]]
    pares = {b for x, _ in lidos for b in x["bin"] if b.startswith("item: ")}
    ok = set()
    for par in pares:
        d = [r for x, r in lidos if par in x["bin"]]
        f = [r for x, r in lidos if par not in x["bin"]]
        if len(d) < N_MIN_ITENS or len(f) < N_MIN_ITENS:
            continue
        md, mf = sum(d) / len(d), sum(f) / len(f)
        vd = sum((v - md) ** 2 for v in d) / (len(d) - 1)
        vf = sum((v - mf) ** 2 for v in f) / (len(f) - 1)
        ep = sqrt(vd / len(d) + vf / len(f))
        if ep > 0 and abs(md - mf) / ep >= T_ITENS:
            ok.add(par)
    ULTIMOS_ITENS[:] = sorted(ok)
    return ok


ULTIMOS_ITENS = []   # o ultimo conjunto aprovado, para o relatorio da variante


def ajusta(treino, degrau, algoritmo="ridge", alpha=10.0, recencia=False, quantil=None):
    """-> (funcao que preve a razao, partes para explicar o preco)

    quantil=0.1/0.9 (so com boosting) troca a media pelo quantil: e assim que
    sai a faixa da previsao, de onde vem o indice de confianca.

    O residuo e aprendido contra o deslocamento SEM temperatura; a temperatura
    entra so na previsao. Se entrasse no treino, deslocaria o residuo de todas
    as vendas antigas pelo nivel do mercado de hoje."""
    G = degrau == "G"
    off_tr, _ = deslocamento(treino, False, G and CONF["versao"])
    off, mb = deslocamento(treino, recencia, G and CONF["versao"])
    if degrau == "A":
        return (lambda ls: np.array([mb[x["base"]] for x in ls])), None
    if degrau == "B":
        return (lambda ls: np.array([off(x) for x in ls])), None
    y = np.array([x["razao"] - off_tr(x) for x in treino])
    M = Matriz(treino, degrau, itens_confianca_alta(treino, y) if G and CONF["itens_alta"] else None)
    nums = CONF["num"] if G else []

    def mat(ls):
        X = M(ls)
        if algoritmo == "ridge":
            return X
        cols = [X, [np.log(x["fipe"]) for x in ls],
                [x["km"] if x["km"] is not None else np.nan for x in ls]]
        cols += [[x["num"][k] for x in ls] for c in nums for k in GRUPOS_NUM.get(c, [c])]
        return np.column_stack(cols)
    # peso de recencia: a venda de N dias antes do fim do treino vale 0,5^(N/meia_vida)
    peso = None
    if G and CONF["meia_vida"]:
        fim = np.datetime64(max(x["data"] for x in treino))
        dias = np.array([(fim - np.datetime64(x["data"])).astype(int) for x in treino])
        peso = 0.5 ** (dias / CONF["meia_vida"])
    if algoritmo == "ridge":
        m = Ridge(alpha=alpha).fit(mat(treino), y, sample_weight=peso)
    else:
        extra = {"loss": "quantile", "quantile": quantil} if quantil else {}
        hgb = CONF["hgb"] if G else HGB_PADRAO
        # early_stopping=False: acima de 10.000 vendas o sklearn liga sozinho a
        # parada antecipada (10% separados ao acaso). Os treinos do teste tem
        # menos que isso; o de producao (10.388 em 14/10) teria, e sairia com
        # 366 arvores em vez de 400 -- outro modelo do que o validado.
        m = HistGradientBoostingRegressor(random_state=7, early_stopping=False, **hgb, **extra).fit(
            mat(treino), y, sample_weight=peso)

    def prev(ls):
        return np.array([off(x) for x in ls]) + m.predict(mat(ls))
    return prev, (M, m, off)


def metricas(ls, razao_prev):
    real = np.array([x["venda"] for x in ls])
    prev = np.array([x["fipe"] for x in ls]) * razao_prev
    erro = (prev - real) / real
    ae = np.abs(erro)
    yr = np.array([x["razao"] for x in ls])
    return {
        "n": len(ls),
        "mae_reais": float(np.mean(np.abs(prev - real))),
        "erro_mediano": float(np.median(ae)),
        "erro_medio": float(np.mean(ae)),
        "dentro_5": float(np.mean(ae <= 0.05)),
        "dentro_10": float(np.mean(ae <= 0.10)),
        "dentro_20": float(np.mean(ae <= 0.20)),
        "vies": float(np.mean(erro)),
        "r2": float(1 - np.sum((yr - razao_prev) ** 2) / np.sum((yr - yr.mean()) ** 2)),
    }


# ── indice de confianca ──────────────────────────────────────────────────
# Dois modelos a mais, iguais ao final mas treinados para o quantil 10% e 90%
# da razao: a faixa onde a venda deve cair em 8 de cada 10 casos. Faixa larga
# = carro dificil de prever. A largura crua dos quantis nao e confiavel (o
# boosting tende a estreitar), entao uma ESCALA k e calibrada na validacao
# (maio-junho) para que a faixa cubra de fato 80% -- antes de olhar o teste.
#
# indice = P(|erro| <= 10%), supondo erro normal com desvio
#          sigma = k x (meia-largura da faixa) / 1,2816
# 1,2816 e o z do quantil 90% da normal: meia-largura de uma faixa 10-90.
# A pagina confere se o indice anunciado bate com o acerto observado.
Z90 = 1.2816


def faixas(treino, alpha, recencia):
    lo, _ = ajusta(treino, FINAL, "boost", alpha, recencia, quantil=0.10)
    hi, _ = ajusta(treino, FINAL, "boost", alpha, recencia, quantil=0.90)
    return lambda ls: (lo(ls), hi(ls))


def indice(p, lo, hi, k):
    """-> (indice 0-1, faixa calibrada em razao)"""
    from math import erf, sqrt
    meia = np.maximum((hi - lo) / 2, 1e-4) / p * k        # meia-largura relativa, calibrada
    sigma = meia / Z90
    idx = np.array([erf(0.10 / (s * sqrt(2))) for s in sigma])
    return idx, p * (1 - meia), p * (1 + meia)


def variaveis(M):
    """nomes da matriz agrupados: {grupo: [niveis]}"""
    g = defaultdict(list)
    for n in M.nomes:
        if n.startswith("texto: "):
            g["texto"].append(n[7:])
        elif n.startswith("laudo PDF: "):
            g["laudo_pdf"].append(n[11:])
        else:
            c, v = n.split("=", 1)
            g[c].append(v)
    return {k: sorted(set(v)) for k, v in g.items()}


FINAL = "E"     # vira "G" se a selecao de blocos melhorar a validacao
# Tres janelas, e nao duas: com duas, tirar UMA venda (uma conta de teste, 14/10)
# mudou o bloco escolhido -- o vendedor passava por 0,06 p.p. e deixou de passar.
JANELAS_VALID = [("2026-01-01", "2026-03-01"), ("2026-03-01", "2026-05-01"),
                 ("2026-05-01", "2026-07-01")]
ACEITE = 0.0005  # ganho minimo de erro medio para um bloco entrar (0,05 p.p.)


def erro_janelas(linhas, degrau, alpha):
    """erro medio do boosting nas TRES janelas de validacao, cada uma treinada
    so com o que veio antes dela. Uma janela so premiava acaso: em 14/10 idade e
    Molicar ajudavam em maio-junho e atrapalhavam em marco-abril."""
    es = []
    for a, b in JANELAS_VALID:
        tr = [x for x in linhas if x["data"] < a]
        va = [x for x in linhas if a <= x["data"] < b]
        p, _ = ajusta(tr, degrau, "boost", alpha)
        es.append(metricas(va, p(va))["erro_medio"])
    return sum(es) / len(es), es


def _liga(c, on):
    if c == "versao":
        CONF["versao"] = on
    elif c.startswith("num:"):
        (CONF["num"].append if on else CONF["num"].remove)(c[4:])
    else:
        (CONF["extras"].append if on else CONF["extras"].remove)(c)


def seleciona_blocos(linhas, alpha):
    """Selecao gulosa: a cada rodada entra o candidato que mais reduz o erro
    medio das tres janelas, se reduzir mais que ACEITE. Para quando nenhum
    reduz. So treino e validacao -- o teste nao participa."""
    atual, _ = erro_janelas(linhas, "E", alpha)
    hist = [{"bloco": "E (ponto de partida)", "erro": atual}]
    resto = list(CANDIDATOS)
    while resto:
        res = []
        for c in resto:
            _liga(c, True)
            e, js = erro_janelas(linhas, "G", alpha)
            _liga(c, False)
            res.append((e, c, js))
        e, c, js = min(res)
        print("   selecao: melhor candidato %-16s %.4f (%s)" % (c, e, " / ".join("%.4f" % j for j in js)))
        if e >= atual - ACEITE:
            break
        _liga(c, True)
        resto.remove(c)
        hist.append({"bloco": c, "erro": e, "janelas": js})
        atual = e
    return hist


def mes_a_mes(linhas, degrau, algoritmo, alpha, recencia, so_estudo=False):
    """Re-treina a cada mes com tudo o que veio antes e preve o mes.
    so_estudo=True treina so com a amostra original (o modelo de antes)."""
    ls, ps = [], []
    for mes in MESES_TESTE:
        tr = [x for x in linhas if x["data"] < mes + "-01" and (x["estudo"] or not so_estudo)]
        te = [x for x in linhas if x["data"][:7] == mes]
        p, _ = ajusta(tr, degrau, algoritmo, alpha, recencia)
        ls += te
        ps += list(p(te))
    return ls, np.array(ps)


def bloco(ls, ps, rotulo, degrau, algoritmo):
    def sub(f):
        return [i for i, x in enumerate(ls) if f(x)]

    def med(ix):
        return metricas([ls[i] for i in ix], ps[ix]) if ix else None
    return {"degrau": degrau, "rotulo": rotulo, "algoritmo": algoritmo,
            "teste": metricas(ls, ps),
            "teste_laudo_lido": med(sub(lambda x: x["laudo_lido"])),
            "por_base": {b: med(sub(lambda x, b=b: x["base"] == b)) for b in BASES.values()},
            "por_mes": {m: med(sub(lambda x, m=m: x["data"][:7] == m)) for m in MESES_TESTE}}


def main():
    linhas = carrega()
    treino = [x for x in linhas if x["data"] < FIM_TREINO]
    valid = [x for x in linhas if FIM_TREINO <= x["data"] < FIM_VALID]
    print("vendas %d (descartadas com menos de %d lojas: %s) · treino %d · validacao %d · teste %d" % (
        len(linhas), MIN_LOJAS, dict(DESCARTE), len(treino), len(valid),
        sum(1 for x in linhas if x["data"] >= FIM_VALID)))

    # ── 2. validacao (maio-junho): alpha, temperatura e algoritmo ────────
    escolha = {}
    for d in "CDE":
        melhor = None
        for a in (1, 3, 10, 30, 100, 300):
            p, _ = ajusta(treino, d, "ridge", a)
            e = metricas(valid, p(valid))["erro_medio"]
            if melhor is None or e < melhor[1]:
                melhor = (a, e)
        escolha[d] = melhor[0]
    val = {}
    for alg in ("ridge", "boost"):
        for rec in (False, True):
            p, _ = ajusta(treino, "E", alg, escolha["E"], rec)
            val[alg + ("+temperatura" if rec else "")] = metricas(valid, p(valid))["erro_medio"]
    for k, v in val.items():
        print("validacao E %-20s erro medio %.4f" % (k, v))
    final = min(val, key=val.get)
    alg_final, rec_final = final.split("+")[0], final.endswith("temperatura")
    print("escolhido:", final, "· alphas", escolha)

    # blocos novos (degrau G), escolhidos nas duas janelas de validacao
    global FINAL
    selecao = seleciona_blocos(linhas, escolha["E"])
    if len(selecao) > 1 and alg_final == "boost":
        FINAL = "G"
    print("blocos aprovados:", [h["bloco"] for h in selecao[1:]], "-> modelo final", FINAL)

    # escala k da faixa: a que faz a faixa cobrir 80% das vendas da VALIDACAO
    pF, _ = ajusta(treino, FINAL, "boost", escolha["E"], rec_final)
    lo, hi = faixas(treino, escolha["E"], rec_final)(valid)
    p = pF(valid)
    meia = np.maximum((hi - lo) / 2, 1e-4) / p
    errel = np.abs(np.array([x["razao"] for x in valid]) - p) / p
    K_FAIXA = float(np.quantile(errel / meia, 0.80))
    print("escala da faixa calibrada na validacao: k = %.2f" % K_FAIXA)
    # O indice cru (largura da faixa -> probabilidade pela normal) ORDENA bem
    # mas promete demais no topo: medido em 14/10, "alta" anunciava 86% e
    # entregava 76%. A traducao para probabilidade passa a ser aprendida na
    # validacao por regressao logistica sobre o logito do indice cru (preserva a ordem).
    bruto_val, _, _ = indice(p, lo, hi, K_FAIXA)
    # logistica (2 parametros) e nao isotonica: a isotonica, com ~1.000 vendas
    # de validacao, virou escada e deu indice 0% a carro que acertou em 57%.
    logit = lambda q: np.log(np.clip(q, 1e-3, 1 - 1e-3) / (1 - np.clip(q, 1e-3, 1 - 1e-3)))  # noqa: E731
    _lr = LogisticRegression().fit(logit(bruto_val).reshape(-1, 1), (errel <= 0.10).astype(int))
    CALIB = type("Calib", (), {"predict": staticmethod(
        lambda q: _lr.predict_proba(logit(q).reshape(-1, 1))[:, 1])})

    # ── 3. teste mes a mes: julho, agosto, setembro ──────────────────────
    escada = []
    for d, rot in DEGRAUS:
        ls, ps = mes_a_mes(linhas, d, "ridge", escolha.get(d, 10), rec_final)
        escada.append(bloco(ls, ps, rot, d, "ridge"))
    lsE, psE = mes_a_mes(linhas, "E", alg_final, escolha["E"], rec_final)
    if alg_final != "ridge":
        escada.append(bloco(lsE, psE, "Mesmo conjunto do E, com gradient boosting", "F", alg_final))
    lsF, psF = lsE, psE
    if FINAL == "G":
        lsF, psF = mes_a_mes(linhas, "G", alg_final, escolha["E"], rec_final)
        escada.append(bloco(lsF, psF, "+ " + ", ".join(ROTULO_BLOCO.get(h["bloco"], h["bloco"])
                                                         for h in selecao[1:]) + " (gradient boosting)",
                            "G", alg_final))
    # antes x depois, nas MESMAS vendas do teste anterior (amostra do estudo):
    # o modelo de antes (E, boosting, so amostra do estudo) contra o final
    lsA, psA = mes_a_mes(linhas, "E", alg_final, escolha["E"], rec_final, so_estudo=True)
    ix_a = [i for i, x in enumerate(lsA) if x["estudo"]]
    ix_f = [i for i, x in enumerate(lsF) if x["estudo"]]
    antes_depois = {"antes": metricas([lsA[i] for i in ix_a], psA[ix_a]),
                    "depois": metricas([lsF[i] for i in ix_f], psF[ix_f]),
                    "antes_ampliado": metricas(lsA, psA)}
    for e in escada:
        t, lido = e["teste"], e["teste_laudo_lido"]
        print("%s %-50s med %4.1f%% · ±10%% %4.1f%% · MAE %5.0f · vies %+4.1f%% | lido med %4.1f%%"
              % (e["degrau"], e["rotulo"][:50], 100 * t["erro_mediano"], 100 * t["dentro_10"],
                 t["mae_reais"], 100 * t["vies"], 100 * lido["erro_mediano"]))

    # ── 4. composicao do preco: ridge E, re-treinado mes a mes ───────────
    veiculos = []
    for mes in MESES_TESTE:
        tr = [x for x in linhas if x["data"] < mes + "-01"]
        te = [x for x in linhas if x["data"][:7] == mes]
        _, (M, mdl, off) = ajusta(tr, FINAL, "ridge", escolha["E"], rec_final)
        coef = dict(zip(M.nomes, (float(c) for c in mdl.coef_)))
        for x in te:
            comp = sorted(((a, coef[a]) for a in M.ativos(x)), key=lambda t: -abs(t[1]))
            veiculos.append({
                "b": x["base"], "id": x["id"], "g": x["modelo"], "v": x["versao"], "a": x["ano"],
                "k": x["km"], "uf": x["uf"], "dt": x["data"], "f": round(x["fipe"], 2),
                "real": round(x["venda"], 2), "vmv": x["vmv"], "lido": x["laudo_lido"],
                "lojas": x["lojas"],
                "base_modelo": round(off(x) + float(mdl.intercept_), 4),
                "ajustes": [[a, round(c, 4)] for a, c in comp if abs(c) >= 0.002]})
    # faixa e indice, re-treinados mes a mes como o preco
    conf = {}
    for mes in MESES_TESTE:
        tr = [x for x in linhas if x["data"] < mes + "-01"]
        te = [x for x in linhas if x["data"][:7] == mes]
        pm, _ = ajusta(tr, FINAL, "boost", escolha["E"], rec_final)
        p = pm(te)
        lo, hi = faixas(tr, escolha["E"], rec_final)(te)
        bruto, flo, fhi = indice(p, lo, hi, K_FAIXA)
        idx = CALIB.predict(bruto)
        for x, i, a, b in zip(te, idx, flo, fhi):
            conf[(x["base"], x["id"], x["data"])] = (float(i), x["fipe"] * float(a), x["fipe"] * float(b))
    urls = json.loads((AQUI / "laudos-url.json").read_text("utf-8"))
    prev = {}
    for x, r in zip(lsF, psF):
        prev[(x["base"], x["id"], x["data"])] = float(r)
    for v in veiculos:
        k = (v["b"], v["id"], v["dt"])
        v["prev"] = round(v["f"] * prev[k], 2)
        v["conf"] = round(conf[k][0], 3)
        v["faixa"] = [round(conf[k][1], 2), round(conf[k][2], 2)]
        v["laudo_url"] = urls.get(v["b"], {}).get(v["id"])
    ix = np.array([v["conf"] for v in veiculos])
    ok = np.array([abs(v["prev"] - v["real"]) / v["real"] <= 0.10 for v in veiculos])
    dentro = np.array([v["faixa"][0] <= v["real"] <= v["faixa"][1] for v in veiculos])
    print("indice medio %.0f%% · acerto ±10%% observado %.0f%% · faixa cobriu %.0f%% (alvo 80%%)"
          % (100 * ix.mean(), 100 * ok.mean(), 100 * dentro.mean()))
    for a, b in ((0, .5), (.5, .7), (.7, .85), (.85, 1.01)):
        s = (ix >= a) & (ix < b)
        if s.sum():
            print("  indice %3.0f-%3.0f%%: %4d vendas, indice medio %.0f%%, acerto observado %.0f%%"
                  % (100 * a, 100 * min(b, 1), s.sum(), 100 * ix[s].mean(), 100 * ok[s].mean()))

    # pesos do ajuste de setembro (o mais recente), com quantas vendas sustentam cada um
    tr = [x for x in linhas if x["data"] < MESES_TESTE[-1] + "-01"]
    _, (M, mdl, _o) = ajusta(tr, FINAL, "ridge", escolha["E"], rec_final)
    cont = defaultdict(int)
    for x in tr:
        for a in M.ativos(x):
            cont[a] += 1
    pesos = sorted(([n, float(c), cont[n]] for n, c in zip(M.nomes, mdl.coef_)),
                   key=lambda t: -abs(t[1]))
    saida = {
        "gerado_em": "2026-10-14",
        "corte": {"validacao": [FIM_TREINO, FIM_VALID], "meses_teste": MESES_TESTE,
                  "n_teste": len(lsF), "n_vendas": len(linhas),
                  "min_lojas": MIN_LOJAS, "descartadas": dict(DESCARTE),
                  "n_modelos": {b: len({x["modelo"] for x in linhas if x["base"] == b})
                                for b in BASES.values()},
                  "n_laudo_lido": sum(1 for x in linhas if x["laudo_lido"])},
        "algoritmo_final": alg_final, "temperatura": rec_final, "dias_temperatura": DIAS_RECENTES,
        "k_faixa": K_FAIXA, "k_encolhe": K_ENCOLHE,
        # o que o modelo leva em conta, tirado da propria matriz de setembro --
        # a pagina de explicacao le daqui para nunca divergir do que roda
        "variaveis": variaveis(M),
        "final": FINAL, "selecao": selecao, "conf": CONF, "antes_depois": antes_depois,
        "nomes_vendedor": {x["cat"]["vendedor"]: x["vendedor_nome"] for x in linhas},
        "alpha": escolha, "validacao": val, "escada": escada, "pesos": pesos,
        "veiculos": veiculos,
    }
    (AQUI / "resultado-modelo.json").write_text(json.dumps(saida, ensure_ascii=False), "utf-8")
    print("gravado resultado-modelo.json · %d veiculos de teste" % len(veiculos))


if __name__ == "__main__":
    main()
