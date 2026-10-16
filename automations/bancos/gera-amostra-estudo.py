"""Amostra anonimizada de eventos, ofertas, clientes e vendas da Cars2You (1T/2026).

  python automations/bancos/gera-amostra-estudo.py [--saida arquivo.xlsx]

Somente SELECT, pela conexao direta (`conexao.py`). Sai um xlsx com uma aba por
tabela. A amostra e por EVENTO: sorteia eventos inteiros (30 por mes de
encerramento) e traz todas as negociacoes e ofertas deles -- assim a disputa de
cada veiculo esta completa, e nenhuma oferta fica sem seu cliente e seu evento.

Anonimizacao: nomes viram "Cliente 0001" / "Evento 001"; ids sao reembaralhados
(nao batem com o banco); CNPJ, e-mail, telefone, placa e chassi nunca saem;
valores sao arredondados (preco R$ 500, FIPE R$ 1.000, km 5.000).
"""
import argparse
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import pandas as pd  # noqa: E402
from conexao import conectar  # noqa: E402

SEMENTE = 20260930
POR_MES = 30
MESES = [("2026-01-01", "2026-02-01"), ("2026-02-01", "2026-03-01"),
         ("2026-03-01", "2026-04-01")]
STATUS = {1: "Ativo", 2: "Aguardando Pagamento", 3: "Aguardando Confirmacao de Pagamento",
          7: "Vendido", 8: "Suspenso", 9: "Em Analise Comprador", 10: "Cancelado",
          11: "Sem Ofertas", 13: "Em Analise Vendedor", 14: "Vendedor Rejeitou",
          15: "Comprador Rejeitou", 18: "Venda Cancelada"}
VENDA = (2, 3, 7)


def consulta(cx, sql, args=None):
    cur = cx.cursor(dictionary=True)
    cur.execute(sql, args or ())
    out = cur.fetchall()
    cur.close()
    return pd.DataFrame(out)


def em(cx, sql, ids):
    """Roda sql com {ids} em blocos (lista longa de IN)."""
    ids = [int(i) for i in ids]
    partes = []
    for i in range(0, len(ids), 1000):
        bloco = ids[i:i + 1000]
        partes.append(consulta(cx, sql.format(ids=",".join(map(str, bloco)))))
    return pd.concat(partes, ignore_index=True) if partes else pd.DataFrame()


def arred(serie, passo):
    return (serie / passo).round() * passo


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--saida", default=str(Path(__file__).resolve().parent
                                           / "amostra-estudo-1T2026.xlsx"))
    a = ap.parse_args()
    rnd = random.Random(SEMENTE)
    cx = conectar("cars2you")

    # 1. eventos: encerram e comecam dentro do trimestre, com ao menos 1 oferta
    ev = []
    for ini, fim in MESES:
        d = consulta(cx, """
            SELECT e.id FROM events e
             WHERE e.deleted_at IS NULL AND e.start_date_offer >= '2026-01-01'
               AND e.finish_date_event >= %s AND e.finish_date_event < %s
               AND EXISTS (SELECT 1 FROM advertisement_negotiations an
                             INNER JOIN offers o ON o.advs_negotiation_id = an.id
                                                AND o.deleted_at IS NULL
                            WHERE an.event_id = e.id AND an.deleted_at IS NULL)
        """, (ini, fim))
        ids = sorted(d["id"].tolist())
        rnd.shuffle(ids)
        ev += ids[:POR_MES]
    print("eventos sorteados:", len(ev))

    # 2. negociacoes dos eventos + marca de 'ultima do veiculo'
    neg = em(cx, """
        SELECT an.id, an.event_id, an.advertisement_id, an.status, an.offer_actual_id,
               a.vehicle_id, a.shop_id AS vendedor_shop, a.fipe_price AS fipe,
               a.shop_stock_id,
               (an.id = (SELECT MAX(an2.id) FROM advertisement_negotiations an2
                           INNER JOIN advertisements a2 ON a2.id = an2.advertisement_id
                          WHERE an2.deleted_at IS NULL AND a2.vehicle_id = a.vehicle_id)
               ) AS ultima
          FROM advertisement_negotiations an
          INNER JOIN advertisements a ON a.id = an.advertisement_id
         WHERE an.deleted_at IS NULL AND an.event_id IN ({ids})
    """, ev)
    print("negociacoes:", len(neg))

    # 3. ofertas: todas as das negociacoes; cliente comprador obrigatorio
    of = em(cx, """
        SELECT o.id, o.advs_negotiation_id, o.advertisement_id, o.buyer_shop_id,
               o.seller_shop_id, o.price, o.type_offer, o.counter_proposal, o.created_at
          FROM offers o WHERE o.deleted_at IS NULL AND o.advs_negotiation_id IN ({ids})
    """, neg["id"])
    antes = len(of)
    of = of[of["buyer_shop_id"].notna()].copy()
    print("ofertas: %d (descartadas sem comprador: %d)" % (len(of), antes - len(of)))

    # 4. clientes: compradores e vendedores que aparecem na amostra
    shop_ids = set(of["buyer_shop_id"].astype(int)) | set(neg["vendedor_shop"].dropna().astype(int)) \
        | set(of["seller_shop_id"].dropna().astype(int))
    shops = em(cx, """
        SELECT s.id, s.situation, s.created_at, w.name AS canal,
               (SELECT sa.state FROM shop_addresses sa WHERE sa.shop_id = s.id
                   AND sa.deleted_at IS NULL ORDER BY sa.id LIMIT 1) AS uf
          FROM shops s LEFT JOIN whitelabels w ON w.id = s.whitelabel_id
         WHERE s.id IN ({ids})
    """, shop_ids)

    # 5. veiculos/anuncios
    veic = em(cx, """
        SELECT a.id AS anuncio, b.name AS marca, m.name AS modelo, c.name AS categoria,
               v.manufacture_year AS ano_fab, v.model_year AS ano_modelo, v.km,
               ss.state AS uf_patio
          FROM advertisements a
          INNER JOIN vehicles v ON v.id = a.vehicle_id
          LEFT JOIN brands b ON b.id = v.brand_id
          LEFT JOIN models m ON m.id = v.model_id
          LEFT JOIN categories c ON c.id = v.category_id
          LEFT JOIN shop_stocks ss ON ss.id = a.shop_stock_id
         WHERE a.id IN ({ids})
    """, neg["advertisement_id"])

    evd = em(cx, """
        SELECT e.id, e.type AS tipo, e.start_date_offer AS inicio_ofertas,
               e.finish_date_event AS fim_evento,
               (SELECT GROUP_CONCAT(DISTINCT w.name ORDER BY w.name SEPARATOR ' | ')
                  FROM event_whitelabels ew INNER JOIN whitelabels w ON w.id = ew.whitelabel_id
                 WHERE ew.event_id = e.id) AS canais
          FROM events e WHERE e.id IN ({ids})
    """, ev)
    cx.close()

    # ---- integridade: vendas = ultima negociacao do veiculo em 2/3/7, com oferta
    #      vencedora presente na amostra
    neg["venda"] = neg["status"].isin(VENDA) & (neg["ultima"] == 1) & neg["offer_actual_id"].notna()
    venc = of.set_index("id")
    neg["venda"] &= neg["offer_actual_id"].isin(venc.index)

    # ---- ids anonimos (permutacao semeada)
    def mapa(valores, comeco=1):
        v = sorted(set(int(x) for x in valores))
        novo = list(range(comeco, comeco + len(v)))
        rnd.shuffle(novo)
        return dict(zip(v, novo))

    m_ev = mapa(evd["id"])
    m_cli = mapa(shops["id"])
    m_an = mapa(neg["advertisement_id"])
    m_of = mapa(of["id"])
    m_ng = mapa(neg["id"])

    nomes_canal = sorted(set(shops["canal"].dropna()) | {
        c for x in evd["canais"].dropna() for c in x.split(" | ")})
    rnd.shuffle(nomes_canal)
    m_canal = {n: "Canal %s" % chr(65 + i) for i, n in enumerate(nomes_canal)}
    shops["canal"] = shops["canal"].map(m_canal)
    evd["canais"] = evd["canais"].map(
        lambda x: " | ".join(sorted(m_canal[c] for c in x.split(" | "))) if isinstance(x, str) else x)

    clientes = shops.copy()
    clientes["cliente_id"] = clientes["id"].map(m_cli)
    comprou = set(of["buyer_shop_id"].astype(int))
    vendeu = set(neg["vendedor_shop"].dropna().astype(int))
    clientes["papel"] = clientes["id"].map(
        lambda i: "comprador e vendedor" if i in comprou and i in vendeu
        else ("comprador" if i in comprou else "vendedor"))
    clientes["nome"] = clientes["cliente_id"].map(lambda i: "Cliente %04d" % i)
    clientes["cadastro_mes"] = pd.to_datetime(clientes["created_at"]).dt.strftime("%Y-%m")
    clientes = clientes.rename(columns={"situation": "situacao"})[
        ["cliente_id", "nome", "papel", "canal", "uf", "situacao", "cadastro_mes"]
    ].sort_values("cliente_id")

    n_of = of.groupby("advs_negotiation_id").size()
    neg["n_ofertas"] = neg["id"].map(n_of).fillna(0).astype(int)
    eventos = evd.copy()
    eventos["evento_id"] = eventos["id"].map(m_ev)
    eventos["nome"] = eventos["evento_id"].map(lambda i: "Evento %03d" % i)
    por_ev = neg.groupby("event_id").agg(veiculos=("id", "size"), vendas=("venda", "sum"),
                                         ofertas=("n_ofertas", "sum"))
    for c in ("veiculos", "vendas", "ofertas"):
        eventos[c] = eventos["id"].map(por_ev[c]).fillna(0).astype(int)
    eventos = eventos[["evento_id", "nome", "tipo", "canais", "inicio_ofertas", "fim_evento",
                       "veiculos", "ofertas", "vendas"]].sort_values("evento_id")

    veiculos = veic.copy()
    veiculos["anuncio_id"] = veiculos["anuncio"].map(m_an)
    vi = neg.drop_duplicates("advertisement_id").set_index("advertisement_id")
    veiculos["fipe"] = arred(veiculos["anuncio"].map(vi["fipe"]), 1000)
    veiculos["vendedor_cliente_id"] = veiculos["anuncio"].map(vi["vendedor_shop"]).map(m_cli)
    veiculos["evento_id"] = veiculos["anuncio"].map(vi["event_id"]).map(m_ev)
    veiculos["km"] = arred(veiculos["km"], 5000)
    veiculos = veiculos[["anuncio_id", "evento_id", "marca", "modelo", "categoria", "ano_fab", "ano_modelo",
                         "km", "uf_patio", "fipe", "vendedor_cliente_id"]].sort_values("anuncio_id")

    ofertas = of.copy()
    ofertas["oferta_id"] = ofertas["id"].map(m_of)
    ng_ev = neg.set_index("id")["event_id"]
    ofertas["evento_id"] = ofertas["advs_negotiation_id"].map(ng_ev).map(m_ev)
    ofertas["negociacao_id"] = ofertas["advs_negotiation_id"].map(m_ng)
    ofertas["anuncio_id"] = ofertas["advertisement_id"].map(m_an)
    ofertas["cliente_comprador_id"] = ofertas["buyer_shop_id"].astype(int).map(m_cli)
    ofertas["valor"] = arred(ofertas["price"], 500)
    ofertas["vencedora"] = ofertas["id"].isin(neg.loc[neg["venda"], "offer_actual_id"]).astype(int)
    ofertas = ofertas.rename(columns={"created_at": "data_hora"})[
        ["oferta_id", "evento_id", "negociacao_id", "anuncio_id", "cliente_comprador_id",
         "valor", "data_hora", "vencedora"]].sort_values(["evento_id", "negociacao_id", "data_hora"])

    v = neg[neg["venda"]].copy()
    w = venc.loc[v["offer_actual_id"].astype(int)]
    v["valor_venda"] = arred(w["price"].values, 500)
    v["data_venda"] = w["created_at"].values
    v["cliente_comprador_id"] = w["buyer_shop_id"].astype(int).map(m_cli).values
    vendas = pd.DataFrame({
        "venda_id": v["id"].map(m_ng),
        "evento_id": v["event_id"].map(m_ev),
        "anuncio_id": v["advertisement_id"].map(m_an),
        "cliente_comprador_id": v["cliente_comprador_id"],
        "cliente_vendedor_id": v["vendedor_shop"].map(m_cli),
        "oferta_vencedora_id": v["offer_actual_id"].astype(int).map(m_of),
        "status": v["status"].map(STATUS),
        "data_venda": v["data_venda"],
        "valor_venda": v["valor_venda"],
        "fipe": arred(v["fipe"], 1000),
    })
    vendas["desagio_pct"] = ((1 - vendas["valor_venda"] / vendas["fipe"]) * 100).round(0)
    vendas.loc[vendas["fipe"].isna() | (vendas["fipe"] <= 0), "desagio_pct"] = None
    vendas = vendas.sort_values(["evento_id", "venda_id"])

    # ---- guardas de integridade (falha alto)
    ce, cc, ca = set(eventos["evento_id"]), set(clientes["cliente_id"]), set(veiculos["anuncio_id"])
    assert ofertas["evento_id"].isin(ce).all(), "oferta sem evento"
    assert ofertas["cliente_comprador_id"].isin(cc).all(), "oferta sem cliente"
    assert ofertas["anuncio_id"].isin(ca).all(), "oferta sem veiculo"
    assert vendas["cliente_comprador_id"].isin(cc).all() and vendas["cliente_vendedor_id"].isin(cc).all()
    assert vendas["oferta_vencedora_id"].isin(set(ofertas["oferta_id"])).all(), "venda sem oferta"
    assert vendas["evento_id"].isin(ce).all()
    assert veiculos["evento_id"].isin(ce).all(), "veiculo sem evento"
    assert veiculos["vendedor_cliente_id"].isin(cc).all(), "veiculo sem vendedor"

    leia = pd.DataFrame({"item": [
        "Fonte", "Recorte", "Amostra", "Anonimizacao", "Arredondamento", "Venda",
        "Integridade", "Abas"], "descricao": [
        "Banco Cars2You (producao), leitura direta, extraido em 2026-10-02",
        "Eventos com inicio das ofertas e fim entre 2026-01-01 e 2026-03-31, ao menos 1 oferta",
        "Sorteio de %d eventos por mes de encerramento (semente %d); de cada evento vieram TODOS os veiculos e ofertas" % (POR_MES, SEMENTE),
        "Nomes substituidos (Cliente NNNN, Evento NNN, Canal X); ids reembaralhados; sem CNPJ, e-mail, telefone, placa, chassi",
        "Ofertas e venda: R$ 500. FIPE: R$ 1.000. Km: 5.000. Deságio recalculado sobre os valores arredondados",
        "Ultima negociacao do veiculo (no banco todo) com status 2, 3 ou 7 (Aguardando Pagamento, Aguardando Confirmacao, Vendido)",
        "Toda oferta tem cliente, evento e veiculo nas outras abas; toda venda tem a oferta vencedora na aba ofertas. Ofertas sem comprador foram descartadas (%d)" % (antes - len(of)),
        "eventos, clientes (compradores e vendedores), veiculos, ofertas, vendas"]})

    with pd.ExcelWriter(a.saida, engine="openpyxl") as xw:
        leia.to_excel(xw, sheet_name="leia-me", index=False)
        for nome, df in (("eventos", eventos), ("clientes", clientes), ("veiculos", veiculos),
                         ("ofertas", ofertas), ("vendas", vendas)):
            df.to_excel(xw, sheet_name=nome, index=False)
            ws = xw.sheets[nome]
            ws.freeze_panes = "A2"
            for col in ws.columns:
                ws.column_dimensions[col[0].column_letter].width = min(
                    42, max(10, max(len(str(c.value)) if c.value is not None else 0
                                    for c in col[:200]) + 2))
        ws = xw.sheets["leia-me"]
        ws.column_dimensions["A"].width = 16
        ws.column_dimensions["B"].width = 140
    print({k: len(d) for k, d in (("eventos", eventos), ("clientes", clientes),
                                  ("veiculos", veiculos), ("ofertas", ofertas), ("vendas", vendas))})
    print("salvo em", a.saida)


if __name__ == "__main__":
    main()
