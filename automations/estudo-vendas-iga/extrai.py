# -*- coding: utf-8 -*-
"""Extrai da Cars2You (conexao direta, VPN) o que o Estudo de Vendas IGA precisa.

    python extrai.py        -> grava dados-brutos.json (fora do git: tem nome de loja)

Duas fatias, mesmo molde de colunas:
  iga   = TODA negociacao de anuncio cujo vendedor e o Itau (lojas 594, 598, 16036),
          vendida ou nao -- e o que permite comparar o que vendeu com o que ficou.
  pares = TODA venda (definicoes.md: ultima negociacao do veiculo, status 2/3/7)
          de qualquer outro vendedor -- o mercado contra o qual o IGA se mede.
Definicoes em context/banco-de-dados/projetos/precificacao/definicoes.md.
"""
import json
import sys
import time
from pathlib import Path

AQUI = Path(__file__).resolve().parent
sys.path.insert(0, str(AQUI.parents[0] / "bancos"))
from conexao import conectar  # noqa: E402

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

IGA = "594, 598, 16036"
DESDE = "2021-10-01"

BASE = """
SELECT an.id AS neg, a.vehicle_id AS veic, a.shop_id AS vendedor, an.status AS status,
       e.id AS evento, DATE_FORMAT(e.start_date_offer, '%Y-%m-%d') AS dia_evento,
       DATE_FORMAT(o.created_at, '%Y-%m-%d') AS dia_venda,
       o.price AS preco, o.buyer_shop_id AS comprador,
       NULLIF(a.fipe_price, 0) AS fipe, NULLIF(an.min_sale_price, 0) AS vmv,
       (SELECT MAX(o2.price) FROM offers o2 WHERE o2.advs_negotiation_id = an.id AND o2.deleted_at IS NULL) AS maior_oferta,
       (SELECT COUNT(*) FROM offers o3 WHERE o3.advs_negotiation_id = an.id AND o3.deleted_at IS NULL) AS n_ofertas,
       CONCAT(UPPER(TRIM(COALESCE(b.name, '(sem marca)'))), ' ', UPPER(TRIM(COALESCE(m.name, '(sem modelo)')))) AS modelo,
       v.model_year AS ano_mod, NULLIF(v.km, 0) AS km,
       COALESCE(cl.name, '(sem cluster)') AS cluster,
       COALESCE(cat.name, 'Nao informada') AS categoria
  FROM advertisement_negotiations an
  INNER JOIN (SELECT a2.vehicle_id AS vid, MAX(an2.id) AS ult
                FROM advertisement_negotiations an2
                INNER JOIN advertisements a2 ON a2.id = an2.advertisement_id
               WHERE an2.deleted_at IS NULL GROUP BY a2.vehicle_id) u ON u.ult = an.id
  INNER JOIN advertisements a ON a.id = an.advertisement_id
  INNER JOIN vehicles v ON v.id = a.vehicle_id
  LEFT JOIN events e ON e.id = an.event_id
  LEFT JOIN offers o ON o.id = an.offer_actual_id AND o.deleted_at IS NULL
  LEFT JOIN brands b ON b.id = v.brand_id
  LEFT JOIN models m ON m.id = v.model_id
  LEFT JOIN clusters cl ON cl.id = v.cluster_id
  LEFT JOIN categories cat ON cat.id = v.category_id
 WHERE an.deleted_at IS NULL
"""

# IGA: TODA negociacao, nao so a ultima do veiculo -- o veiculo que voltou ao evento
# conta cada passagem. Por isso o IGA nao usa o join "ultima".
IGA_SQL = BASE.replace(
    """INNER JOIN (SELECT a2.vehicle_id AS vid, MAX(an2.id) AS ult
                FROM advertisement_negotiations an2
                INNER JOIN advertisements a2 ON a2.id = an2.advertisement_id
               WHERE an2.deleted_at IS NULL GROUP BY a2.vehicle_id) u ON u.ult = an.id
  """, "") + " AND a.shop_id IN (" + IGA + ") AND e.start_date_offer >= '" + DESDE + "'"

PARES_SQL = BASE + " AND an.status IN (2, 3, 7) AND a.shop_id NOT IN (" + IGA + ") AND o.created_at >= '" + DESDE + "'"

cx = conectar("cars2you")
cur = cx.cursor()
saida = {}
for nome, sql in (("iga", IGA_SQL), ("pares", PARES_SQL)):
    t = time.time()
    cur.execute(sql)
    cols = [d[0] for d in cur.description]
    linhas = cur.fetchall()
    saida[nome] = {"cols": cols, "linhas": [[(float(x) if hasattr(x, "as_tuple") else x) for x in l] for l in linhas]}
    print(nome, len(linhas), "linhas em %.1fs" % (time.time() - t))
(AQUI / "dados-brutos.json").write_text(json.dumps(saida, ensure_ascii=False), encoding="utf-8", newline="\n")
print("gravado dados-brutos.json")
