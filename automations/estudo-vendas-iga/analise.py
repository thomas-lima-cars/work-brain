# -*- coding: utf-8 -*-
"""Estudo de Vendas IGA: transforma dados-brutos.json em resultados.json (so agregado).

    python analise.py

v2 (08/10): tudo MES A MES de jan/23 a set/26 e por CLUSTER. O Python entrega agregados
por (cluster x mes); a pagina refaz KPI, grafico e tabela para o cluster que o leitor escolher.

Unidades do estudo
  veiculo publicado = veiculo UNICO no mes (uma linha por veiculo x mes de evento)
  exito             = veiculos vendidos / veiculos publicados (unicos no mes)
  % sobre a FIPE    = (preco de venda, ou o VMV se nao vendeu) / FIPE do anuncio
Definicoes de venda em context/banco-de-dados/projetos/precificacao/definicoes.md
"""
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

AQUI = Path(__file__).resolve().parent
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

HOJE = pd.Timestamp("2026-10-08")
PRIMEIRO, ULTIMO = "2023-01", "2026-09"      # outubro/26 e parcial: fora
D = json.load(open(AQUI / "dados-brutos.json", encoding="utf-8"))
iga = pd.DataFrame(D["iga"]["linhas"], columns=D["iga"]["cols"])
par = pd.DataFrame(D["pares"]["linhas"], columns=D["pares"]["cols"])

MESES_TODOS = [str(p) for p in pd.period_range("2021-10", ULTIMO, freq="M")]
MESES = [m for m in MESES_TODOS if m >= PRIMEIRO]
MI = {m: i for i, m in enumerate(MESES)}
NM = len(MESES)


def corte(s):                          # definicoes.md: venda ÷ FIPE entre 0,20 e 1,20
    return s.between(0.20, 1.20)


# ── base IGA: uma UNIDADE por (veiculo, mes de evento) ──────────────────────
iga["vend"] = iga.status.isin([2, 3, 7])
iga["mes"] = iga.dia_evento.str[:7]
iga = iga[(iga.mes >= "2021-10") & (iga.mes <= ULTIMO)].copy()
iga["mes_v"] = iga.dia_venda.fillna(iga.dia_evento).str[:7]
# o representante da unidade: a negociacao vendida (a ultima, se houver mais de uma); sem venda, a ultima
u = iga.sort_values(["veic", "mes", "vend", "neg"]).groupby(["veic", "mes"], as_index=False).tail(1).copy()
vend_unid = iga.groupby(["veic", "mes"]).vend.max().rename("vendeu")
u = u.merge(vend_unid, on=["veic", "mes"])
# com oferta (09/10): algum lance em alguma negociacao do veiculo naquele mes. Vendido sempre tem
max_of = iga.groupby(["veic", "mes"]).n_ofertas.max().rename("maxof")
u = u.merge(max_of, on=["veic", "mes"])
u["vend"] = u.vendeu.astype(bool)
u["com_oferta"] = u.vend | (u.maxof > 0)
vmv_ok = u.vmv.notna() & (u.vmv > 1000) & (u.vmv < 900000)        # 999999 = sentinela de "sem minimo"
u["valor"] = np.where(u.vend, u.preco, np.where(vmv_ok, u.vmv, np.nan))
u["pct"] = u.valor / u.fipe
u["pct_ok"] = u.pct.notna() & corte(u.pct)
u["cl"] = u.cluster.fillna("(sem cluster)")

par["mes"] = par.dia_venda.str[:7]
par = par[(par.mes >= "2021-10") & (par.mes <= ULTIMO)].copy()
par["pct"] = par.preco / par.fipe
par["pct_ok"] = par.pct.notna() & corte(par.pct)
par["cl"] = par.cluster.fillna("(sem cluster)")

ordem_cl = lambda n: (0, int(n[1:])) if n[0] == "C" and n[1:].isdigit() else (1, int(n[1:])) if n[0] == "G" and n[1:].isdigit() else (2, n)
CLUSTERS = sorted(set(u.cl) | set(par.cl), key=ordem_cl)
CI = {c: i for i, c in enumerate(CLUSTERS)}
NC = len(CLUSTERS)
u["ci"] = u.cl.map(CI)
par["ci"] = par.cl.map(CI)
print("unidades IGA (veiculo x mes):", len(u), "| vendidas", int(u.vend.sum()), "| clusters", NC)


# ── idade e faixas (celula de comparacao) ───────────────────────────────────
def prepara(df, col_data):
    df = df.copy()
    ano = df[col_data].str[:4].astype(int)
    df["idade"] = (ano - df.ano_mod).clip(0, 25)
    df["f_idade"] = pd.cut(df.idade, [-1, 2, 5, 8, 12, 99], labels=["0-2", "3-5", "6-8", "9-12", "13+"]).astype(str)
    df["f_km"] = pd.cut(df.km, [0, 30e3, 60e3, 90e3, 120e3, 160e3, 220e3, 1e9],
                        labels=["<30k", "30-60k", "60-90k", "90-120k", "120-160k", "160-220k", "220k+"]).astype(str)
    return df


u = prepara(u, "dia_evento")
par = prepara(par, "dia_venda")

# ── regressao com efeito fixo de modelo, MES A MES ──────────────────────────
# y = % sobre a FIPE. X = idade, km, cluster, mes e IGA×mes. So entram modelos que os dois lados
# vendem (>= 5 vendas cada). O IGA×mes absorve o que e do IGA; o resto e o "esperado de mercado".
vi = u[u.vend & u.pct_ok & u.km.notna() & (u.mes >= PRIMEIRO)].copy()
vi["quem"] = "iga"
vp = par[par.pct_ok & par.km.notna() & (par.mes >= PRIMEIRO)].copy()
vp["quem"] = "par"
P = pd.concat([vi, vp], ignore_index=True)
c_ = P.groupby(["modelo", "quem"]).size().unstack(fill_value=0)
n_modelos_total = int(P.modelo.nunique())
bons = set(c_[(c_["iga"] >= 5) & (c_["par"] >= 5)].index)
P = P[P.modelo.isin(bons)].copy()
print("modelos nos dois lados (>=5 cada):", len(bons), "de", n_modelos_total, "| vendas IGA", int((P.quem == "iga").sum()),
      "| demais", int((P.quem == "par").sum()))


def matriz(df, meses, com_iga=True):
    cols = {}
    for k in ["f_idade", "f_km", "cl"]:
        d_ = pd.get_dummies(df[k], prefix=k, drop_first=True, dtype=float)
        for ccol in d_.columns:
            cols[ccol] = d_[ccol].values
    for m in meses[1:]:
        cols["mes_" + m] = (df.mes == m).astype(float).values
    if com_iga:
        for m in meses:
            cols["igaM_" + m] = ((df.quem == "iga") & (df.mes == m)).astype(float).values
    return pd.DataFrame(cols, index=df.index)


def ajusta(df, y):
    X = matriz(df, MESES)
    X = X.loc[:, X.std() > 0]
    gm = df.modelo
    Xd = X - X.groupby(gm).transform("mean")
    yd = y - y.groupby(gm).transform("mean")
    beta, *_ = np.linalg.lstsq(Xd.values, yd.values, rcond=None)
    beta = pd.Series(beta, index=X.columns)
    res = yd.values - Xd.values @ beta.values
    # efeito fixo do modelo com o termo IGA DENTRO da conta: tirado so dos demais coeficientes ele
    # engoliria o premio do IGA e o "esperado de mercado" sairia colado no proprio IGA
    fe = (y - X.values @ beta.values).groupby(gm).mean()
    r2 = float(1 - (res ** 2).sum() / (yd ** 2).sum())
    return X, beta, fe, r2


X, beta, fe, R2 = ajusta(P, P.pct)
print("R2 dentro do modelo: %.3f" % R2)
# esperado de mercado para as vendas do IGA da amostra (sem o termo IGA): o residual e a diferenca
Xi = X.loc[P.quem == "iga"].copy()
for ccol in [k for k in X.columns if k.startswith("igaM_")]:
    Xi[ccol] = 0.0
Pi = P.loc[P.quem == "iga"].copy()
Pi["esp"] = fe.reindex(Pi.modelo).values + Xi.values @ beta.values
Pi["dif"] = Pi.pct - Pi.esp


def desenho_como(df, colunas):
    """Matriz com EXATAMENTE as colunas do ajuste: get_dummies(drop_first) refeito sobre outro subconjunto
    pode derrubar outra categoria-base e desalinhar os coeficientes."""
    out = {}
    for c in colunas:
        if c.startswith("f_idade_"):
            out[c] = (df.f_idade == c[len("f_idade_"):]).astype(float).values
        elif c.startswith("f_km_"):
            out[c] = (df.f_km == c[len("f_km_"):]).astype(float).values
        elif c.startswith("cl_"):
            out[c] = (df.cl == c[len("cl_"):]).astype(float).values
        elif c.startswith("mes_"):
            out[c] = (df.mes == c[len("mes_"):]).astype(float).values
        else:                                   # igaM_*: fora, e o "esperado de mercado"
            out[c] = np.zeros(len(df))
    return pd.DataFrame(out, index=df.index)


# o MESMO esperado de mercado, agora para TODO veiculo do IGA nos modelos comparaveis, vendido ou nao:
# observado = preco de venda, ou o VMV se nao vendeu, ÷ FIPE. Separado por com oferta x sem oferta
UV = u[u.modelo.isin(bons) & u.km.notna() & u.pct_ok & (u.mes >= PRIMEIRO)].copy()
UV["esp"] = fe.reindex(UV.modelo).values + desenho_como(UV, X.columns).values @ beta.values
print("veiculos IGA com esperado (venda ou VMV):", len(UV), "| com oferta", int(UV.com_oferta.sum()), "| sem oferta", int((~UV.com_oferta).sum()))
print("diferenca media IGA − esperado de mercado: %+.4f" % Pi.dif.mean())

# ── o PEDIDO contra o mercado (em reais, sem FIPE) ──────────────────────────
def amostra_preco(df, quem):
    d_ = df[df.km.notna() & df.preco.notna() & (df.preco >= 3000) & (df.mes >= PRIMEIRO)].copy()
    d_["quem"] = quem
    d_["ly"] = np.log(d_.preco)
    return d_


Q = pd.concat([amostra_preco(u[u.vend], "iga"), amostra_preco(par, "par")], ignore_index=True)
cq = Q.groupby(["modelo", "quem"]).size().unstack(fill_value=0)
bons2 = set(cq[(cq["iga"] >= 5) & (cq["par"] >= 5)].index)
Q = Q[Q.modelo.isin(bons2)].copy()
X2, b2, fe2, R2P = ajusta(Q, Q.ly)
N = u[u.modelo.isin(bons2) & u.km.notna() & vmv_ok & (u.mes >= PRIMEIRO)].copy()
M2 = matriz(N.assign(quem="par"), MESES, com_iga=False)
for ccol in X2.columns:
    if ccol not in M2.columns:
        M2[ccol] = 0.0
M2 = M2[X2.columns]
for ccol in [k for k in X2.columns if k.startswith("igaM_")]:
    M2[ccol] = 0.0
N["esp"] = fe2.reindex(N.modelo).values + M2.values @ b2.values
N["pedido"] = np.exp(np.log(N.vmv) - N.esp) - 1
N = N[N.pedido.between(-0.8, 3.0)].copy()
BINS = [-9, -0.10, 0.0, 0.10, 0.25, 9]
N["faixa"] = pd.cut(N.pedido, BINS, labels=False)
print("pedido: modelos", len(bons2), "| unidades", len(N), "| R2 %.3f" % R2P)

# ── agregados cluster × mes (o que a pagina recompoe a cada filtro) ─────────
def zeros():
    return np.zeros((NC, NM))


pub, vend, vol, nf, sf, ng, sg, so, np_, sp = (zeros() for _ in range(10))
u_d = u[u.mes >= PRIMEIRO]
for (ci, m), g in u_d.groupby(["ci", "mes"]):
    i = MI[m]
    pub[ci, i] = len(g)
    vend[ci, i] = int(g.vend.sum())
    vol[ci, i] = float(g[g.vend].preco.sum())
    gg = g[g.pct_ok]
    nf[ci, i] = len(gg)
    sf[ci, i] = float(gg.pct.sum())
for (ci, m), g in Pi.groupby(["ci", "mes"]):
    ng[ci, MI[m]] = len(g)
    sg[ci, MI[m]] = float(g.dif.sum())
    so[ci, MI[m]] = float(g.pct.sum())
for (ci, m), g in par[(par.mes >= PRIMEIRO) & par.pct_ok].groupby(["ci", "mes"]):
    np_[ci, MI[m]] = len(g)
    sp[ci, MI[m]] = float(g.pct.sum())

og = {k: zeros() for k in ("ngc", "soc", "sec", "ngs", "sos", "ses")}
for flag, suf in ((True, "c"), (False, "s")):
    for (ci, m), g in UV[UV.com_oferta == flag].groupby(["ci", "mes"]):
        og["ng" + suf][ci, MI[m]] = len(g)
        og["so" + suf][ci, MI[m]] = float(g.pct.sum())
        og["se" + suf][ci, MI[m]] = float(g.esp.sum())
fn = np.zeros((NC, 5, NM))
fv = np.zeros((NC, 5, NM))
for (ci, f, m), g in N.groupby(["ci", "faixa", "mes"]):
    fn[ci, int(f), MI[m]] = len(g)
    fv[ci, int(f), MI[m]] = int(g.vend.sum())

# ── compradores: linhas esparsas (comprador, mes, cluster, compras), desde 10/2021 ──
compras = iga[iga.vend & iga.comprador.notna()].copy()
compras["comprador"] = compras.comprador.astype(int)
compras = compras[(compras.mes_v >= "2021-10") & (compras.mes_v <= ULTIMO)]
compras["ci"] = compras.cluster.fillna("(sem cluster)").map(CI)
MI_ALL = {m: i for i, m in enumerate(MESES_TODOS)}
compras["mi"] = compras.mes_v.map(MI_ALL)
agg = compras.groupby(["comprador", "mi", "ci"]).size().reset_index(name="n")
ids = sorted(agg.comprador.unique().tolist())
bi = {b: i for i, b in enumerate(ids)}
rows = [[bi[r.comprador], int(r.mi), int(r.ci), int(r.n)] for r in agg.itertuples()]
print("compradores distintos:", len(ids), "| linhas esparsas:", len(rows))

# candidatos a "recorrente que parou" (qualquer cluster): >= 3 meses com compra na janela-base
fim = len(MESES_TODOS) - 1
base = (fim - 15, fim - 4)
rec = (fim - 3, fim)
mat = pd.crosstab(compras.comprador, compras.mi).reindex(columns=range(len(MESES_TODOS)), fill_value=0)
# recorrente (09/10, Thomas): comprou no mes E em ao menos 6 dos 12 meses anteriores. Candidato a "parou" =
# foi recorrente em algum mes da janela-base
arr = (mat.values > 0).astype(int)
cs = np.cumsum(np.pad(arr, ((0, 0), (1, 0))), axis=1)          # cs[:, k] = meses com compra antes do mes k
def foi_recorrente(i):
    for t in range(base[0], base[1] + 1):
        ant = cs[i, t] - cs[i, max(t - 12, 0)]
        if arr[i, t] and ant >= 6:
            return True
    return False
cand = [mat.index[i] for i in range(len(mat)) if foi_recorrente(i)]
janelas = dict(base=[MESES_TODOS[base[0]], MESES_TODOS[base[1]]], rec=[MESES_TODOS[rec[0]], MESES_TODOS[rec[1]]])
(AQUI / "compradores-ids.json").write_text(json.dumps(dict(ids=ids, cand=[int(x) for x in cand],
    base_ini=janelas["base"][0] + "-01", base_fim=janelas["base"][1] + "-31", rec_ini=janelas["rec"][0] + "-01")),
    encoding="utf-8", newline="\n")
print("candidatos (foram recorrentes na janela-base):", len(cand), janelas)

nomes, det, ativas = {}, {}, {}
dp = AQUI / "compradores-detalhe.json"
if dp.exists():
    dd = json.load(open(dp, encoding="utf-8"))
    nomes = {int(x["id"]): x["name"] for x in dd["lojas"]}
    ativas = {int(x["id"]): int(x["situation"] == 3 and not x["apagada"]) for x in dd["lojas"]}
    of_ = {int(x["loja"]): x for x in dd["ofertas"]}
    ac_ = {int(x["loja"]): x for x in dd["acessos"]}
    for b in cand:
        o, a = of_.get(int(b), {}), ac_.get(int(b), {})
        det[int(b)] = [int(o.get("base_iga", 0) or 0), int(o.get("rec_iga", 0) or 0),
                       int(o.get("rec_total", 0) or 0), int(a.get("rec", 0) or 0)]
    print("detalhe de", len(det), "candidatos;", len(nomes), "nomes")

# ── conferencia por pareamento exato + perfil (estaticos, todos os clusters) ─
def celula_exata(df):
    d_ = df.copy()
    d_["fi"] = pd.cut(d_.idade, [-1, 2, 5, 8, 12, 99], labels=False)
    d_["fk"] = pd.cut(d_.km, [0, 30e3, 60e3, 90e3, 120e3, 160e3, 220e3, 1e9], labels=False)
    return d_


ai, ap = celula_exata(vi), celula_exata(vp)
ai["tri"] = pd.PeriodIndex(ai.mes, freq="M").asfreq("Q").astype(str)
ap["tri"] = pd.PeriodIndex(ap.mes, freq="M").asfreq("Q").astype(str)
kk = ["modelo", "fi", "fk", "tri"]   # trimestre: por mes a celula fica rala demais (107 celulas)
gi = ai.groupby(kk).pct.agg(["mean", "size"]).rename(columns={"mean": "mi", "size": "ni"})
gp = ap.groupby(kk).pct.agg(["mean", "size"]).rename(columns={"mean": "mp", "size": "np_"})
mm = gi.join(gp, how="inner")
mm = mm[(mm.ni >= 2) & (mm.np_ >= 2)]
ww = np.minimum(mm.ni, mm.np_)
PAREAMENTO = dict(celulas=int(len(mm)), dif=float(((mm.mi - mm.mp) * ww).sum() / ww.sum()),
                  n_iga=int(mm.ni.sum()), n_par=int(mm.np_.sum()))
PERFIL = dict(idade_iga=float(vi.idade.median()), idade_par=float(vp.idade.median()),
              km_iga=float(vi.km.median()), km_par=float(vp.km.median()),
              fipe_iga=float(vi.fipe.median()), fipe_par=float(vp.fipe.median()),
              pct_iga=float(vi.pct.mean()), pct_par=float(vp.pct.mean()))
print("pareamento exato:", PAREAMENTO)
print("perfil:", PERFIL)

# FIPE preenchida: o que limita o "% sobre a FIPE" de quem nao vendeu
fp = u[u.mes >= PRIMEIRO].copy()
fp["tri"] = pd.PeriodIndex(fp.mes, freq="M").asfreq("Q").astype(str)
fipe_tri = fp.groupby(["tri", "vend"]).fipe.apply(lambda s: s.notna().mean()).unstack()

r1 = lambda a: np.round(a, 4).tolist()
saida = dict(
    gerado=str(HOJE.date()), ultimo_mes=ULTIMO, primeiro_mes=PRIMEIRO,
    meses=MESES, meses_todos=MESES_TODOS, clusters=CLUSTERS,
    cel=dict(pub=pub.astype(int).tolist(), vend=vend.astype(int).tolist(), vol=np.round(vol).astype(int).tolist(),
             nf=nf.astype(int).tolist(), sf=r1(sf), ng=ng.astype(int).tolist(), sg=r1(sg), so=r1(so),
             np=np_.astype(int).tolist(), sp=r1(sp),
             ngc=og['ngc'].astype(int).tolist(), soc=r1(og['soc']), sec=r1(og['sec']),
             ngs=og['ngs'].astype(int).tolist(), sos=r1(og['sos']), ses=r1(og['ses'])),
    fx=dict(n=fn.astype(int).tolist(), v=fv.astype(int).tolist()),
    compr=dict(ids=[int(i) for i in ids], nomes=[nomes.get(int(i), "") for i in ids], ativa=[ativas.get(int(i), 0) for i in ids], linhas=rows, cand=[int(x) for x in cand],
               det=det, janelas=janelas),
    estatico=dict(pareamento=PAREAMENTO, perfil=PERFIL,
                  modelos=dict(com_ambos=len(bons), total=n_modelos_total),
                  amostra=dict(iga=int((P.quem == "iga").sum()), par=int((P.quem == "par").sum()), r2=R2),
                  preco=dict(modelos=len(bons2), iga=int((Q.quem == "iga").sum()), par=int((Q.quem == "par").sum()), r2=R2P),
                  fipe_tri={k: {("vendido" if c else "nao_vendido"): float(v) for c, v in r.items() if v == v}
                            for k, r in fipe_tri.iterrows()}),
)


def limpa(o):
    """NaN nao e JSON: vira null (o Node recusa o arquivo inteiro)."""
    if isinstance(o, dict):
        return {k: limpa(v) for k, v in o.items()}
    if isinstance(o, list):
        return [limpa(v) for v in o]
    if isinstance(o, float) and o != o:
        return None
    return o


(AQUI / "resultados.json").write_text(json.dumps(limpa(saida), ensure_ascii=False), encoding="utf-8", newline="\n")
print("gravado resultados.json (%d KB)" % (len(json.dumps(limpa(saida))) // 1024))
