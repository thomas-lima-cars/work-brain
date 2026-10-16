# -*- coding: utf-8 -*-
"""Nome de TODA loja que comprou do IGA, e, para os candidatos a "recorrente que parou",
as ofertas ao IGA e os acessos nas duas janelas.

    python analise.py && python extrai_compradores.py   -> compradores-detalhe.json (fora do git)
"""
import json
import sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent
sys.path.insert(0, str(AQUI.parents[0] / "bancos"))
from conexao import conectar  # noqa: E402

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

P = json.loads((AQUI / "compradores-ids.json").read_text(encoding="utf-8"))
todos = ", ".join(str(i) for i in P["ids"])
cand = ", ".join(str(i) for i in P["cand"])
IGA = "594, 598, 16036"
cx = conectar("cars2you")
cur = cx.cursor()


def rodar(sql):
    cur.execute(sql)
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, [(float(x) if hasattr(x, "as_tuple") else (str(x) if hasattr(x, "isoformat") else x)) for x in l])) for l in cur.fetchall()]


GRUPO = 10      # "VD Itaú - Grupo principal": ativo, alvejado por 710 dos eventos do IGA desde jan/24 (medido em 09/10)
# "no grupo" = algum usuario da loja esta no grupo. Usuario ligado a mais de 10 lojas e conta interna ou de assessoria
# (dominios.md) e leva o grupo para centenas de lojas: fica fora da conta.
lojas = rodar(
    "SELECT s.id, s.name, s.situation, (s.deleted_at IS NOT NULL) AS apagada,"
    " EXISTS (SELECT 1 FROM user_shops us INNER JOIN user_clients_group ucg ON ucg.user_id = us.user_id AND ucg.client_group_id = " + str(GRUPO) +
    " WHERE us.shop_id = s.id AND (SELECT COUNT(*) FROM user_shops u2 WHERE u2.user_id = us.user_id) <= 10) AS no_grupo"
    " FROM shops s WHERE s.id IN (" + todos + ")")
ofertas = rodar(
    "SELECT o.buyer_shop_id AS loja,"
    " SUM(o.created_at >= '" + P["rec_ini"] + "') AS rec_total,"
    " SUM(o.created_at >= '" + P["rec_ini"] + "' AND a.shop_id IN (" + IGA + ")) AS rec_iga,"
    " SUM(o.created_at BETWEEN '" + P["base_ini"] + "' AND '" + P["base_fim"] + " 23:59:59' AND a.shop_id IN (" + IGA + ")) AS base_iga"
    " FROM offers o INNER JOIN advertisement_negotiations an ON an.id = o.advs_negotiation_id"
    " INNER JOIN advertisements a ON a.id = an.advertisement_id"
    " WHERE o.deleted_at IS NULL AND o.buyer_shop_id IN (" + cand + ") AND o.created_at >= '" + P["base_ini"] + "'"
    " GROUP BY o.buyer_shop_id")
acessos = rodar(
    "SELECT al.shop_id AS loja, SUM(al.created_at >= '" + P["rec_ini"] + "') AS rec"
    " FROM access_logs al WHERE al.shop_id IN (" + cand + ") AND al.created_at >= '" + P["rec_ini"] + "' GROUP BY al.shop_id")
(AQUI / "compradores-detalhe.json").write_text(json.dumps(dict(lojas=lojas, ofertas=ofertas, acessos=acessos), ensure_ascii=False), encoding="utf-8", newline="\n")
print(len(lojas), "nomes;", len(ofertas), "com oferta;", len(acessos), "com acesso")
