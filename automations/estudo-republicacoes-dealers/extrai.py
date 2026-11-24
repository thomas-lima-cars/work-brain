# -*- coding: utf-8 -*-
"""Estudo de Republicacoes Dealers: o mesmo carro publicado na Cars2You e na Dealers em 2026.

    python extrai.py --descobre   -> colunas de placa/chassi e categorias das duas bases (nada gravado)
    python extrai.py              -> grava dados-brutos.json (fora do git: nome de comitente e de evento)

Conexao direta, VPN ligada (context/banco-de-dados/plataforma/acessos.md).

Passo 1, em cada base: os veiculos com alguma negociacao em evento que comecou em 2026, com
a placa e o chassi NORMALIZADOS e embaralhados (SHA-256 com sal aleatorio desta rodada) DENTRO
do SQL. Placa e chassi nunca chegam ao Python (qualidade.md, PII); o sal morre com o processo,
entao nem os hashes servem fora desta rodada -- e nao sao gravados.
Casamento: mesmo chassi, ou mesma placa quando um dos lados nao tem chassi. Placa Mercosul
volta ao formato antigo (5o caractere A..J -> 0..9) antes do hash: o mesmo carro pode estar
com uma placa em cada base. Placa ou chassi repetido em muitos veiculos (lixo de cadastro)
sai do casamento.

Passo 2, em cada base: TODA negociacao (qualquer data) dos veiculos casados, com ofertas,
FIPE, Molicar, VMV, categoria e comitente. O recorte de 2026 e a ordem das publicacoes
ficam na analise (analisa.py), que e onde as escolhas estao escritas.

23/11, pedido do Thomas: a PLACA dos carros casados sai no passo 2 e vai para a tabela de
veiculos (excecao declarada a regra de PII do qualidade.md; os tres arquivos gerados seguem
fora do git). O chassi continua so embaralhado. Sai tambem o updated_at da negociacao: e a
melhor hora que o banco tem para quando uma publicacao CANCELADA deixou de estar no ar.
"""
import argparse
import json
import secrets
import sys
import time
from collections import Counter, defaultdict
from pathlib import Path

AQUI = Path(__file__).resolve().parent
sys.path.insert(0, str(AQUI.parents[0] / "bancos"))
from conexao import conectar  # noqa: E402

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

BASES = ("cars2you", "dealers")
DESDE = "2026-01-01 00:00:00"  # inicio das ofertas do evento, hora de Brasilia (literal, nunca NOW())
COL_PLACA = "plate"            # conferido no --descobre
COL_CHASSI = "chassi"          # idem
TETO_REPETIDO = 3              # placa/chassi em mais veiculos que isto, na mesma base, e lixo

# Evento-balde da Cars2You (dominios.md): nao e publicacao. Comeca em 2021, mas fica explicito.
EXCLUI_EVENTO = {"cars2you": "266", "dealers": None}

INICIO = "COALESCE(e.start_date_offer, an.start_date_offer)"


def norm_chassi(col):
    c = "REGEXP_REPLACE(UPPER(TRIM(v.%s)), '[^A-Z0-9]', '')" % col
    return "IF(CHAR_LENGTH(%s) = 17, %s, NULL)" % (c, c)


def norm_placa(col):
    p = "REGEXP_REPLACE(UPPER(TRIM(v.%s)), '[^A-Z0-9]', '')" % col
    # Mercosul ABC1D23 -> ABC1323 (A=0 ... J=9): ASCII('A') - 17 = ASCII('0')
    conv = ("IF(SUBSTRING(%s, 5, 1) REGEXP '^[A-J]$', "
            "CONCAT(LEFT(%s, 4), CHAR(ASCII(SUBSTRING(%s, 5, 1)) - 17), RIGHT(%s, 2)), %s)") % (p, p, p, p, p)
    return "IF(CHAR_LENGTH(%s) = 7 AND %s REGEXP '^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$', %s, NULL)" % (p, p, conv)


def sql_passo1(base, sal):
    ex = EXCLUI_EVENTO[base]
    return """
SELECT v.id AS veic,
       SHA2(CONCAT('{sal}', {ch}), 256) AS h_chassi,
       SHA2(CONCAT('{sal}', {pl}), 256) AS h_placa
  FROM vehicles v
 WHERE v.id IN (SELECT a.vehicle_id
                  FROM advertisement_negotiations an
                  INNER JOIN advertisements a ON a.id = an.advertisement_id
                  LEFT JOIN events e ON e.id = an.event_id
                 WHERE an.deleted_at IS NULL
                   AND {ini} >= '{desde}'{ex})
""".format(sal=sal, ch=norm_chassi(COL_CHASSI), pl=norm_placa(COL_PLACA), ini=INICIO, desde=DESDE,
           ex=("\n                   AND COALESCE(an.event_id, 0) <> " + ex) if ex else "")


def sql_passo2(base, ids):
    ex = EXCLUI_EVENTO[base]
    return """
SELECT an.id AS neg, a.vehicle_id AS veic, a.id AS anuncio, an.status AS status,
       a.shop_id AS comitente_id, s.name AS comitente,
       an.event_id AS evento, e.name AS evento_nome,
       DATE_FORMAT({ini}, '%Y-%m-%d %H:%i') AS inicio,
       DATE_FORMAT(COALESCE(e.finish_date_event, an.finish_date_offer), '%Y-%m-%d %H:%i') AS fim,
       NULLIF(a.fipe_price, 0) AS fipe, NULLIF(v.fipe_price, 0) AS fipe_veic, NULLIF(a.molicar_price, 0) AS molicar,
       NULLIF(v.molicar_price, 0) AS molicar_veic, NULLIF(an.min_sale_price, 0) AS vmv,
       vo.price AS valor_vencedora, DATE_FORMAT(vo.created_at, '%Y-%m-%d %H:%i') AS dia_vencedora,
       (SELECT COUNT(*) FROM offers o1 WHERE o1.advs_negotiation_id = an.id AND o1.deleted_at IS NULL) AS n_ofertas,
       (SELECT MAX(o2.price) FROM offers o2 WHERE o2.advs_negotiation_id = an.id AND o2.deleted_at IS NULL) AS maior_oferta,
       (SELECT o3.price FROM offers o3 WHERE o3.advs_negotiation_id = an.id AND o3.deleted_at IS NULL
         ORDER BY o3.id DESC LIMIT 1) AS ult_oferta,
       (SELECT DATE_FORMAT(o4.created_at, '%Y-%m-%d %H:%i') FROM offers o4
         WHERE o4.advs_negotiation_id = an.id AND o4.deleted_at IS NULL ORDER BY o4.id DESC LIMIT 1) AS dia_ult_oferta,
       v.category_id AS cat_id, cat.name AS categoria, cat.category_group_id AS grupo_id, cg.name AS grupo,
       CONCAT(UPPER(TRIM(COALESCE(b.name, '(sem marca)'))), ' ', UPPER(TRIM(COALESCE(m.name, '(sem modelo)')))) AS modelo,
       ver.name AS versao, v.model_year AS ano_mod, NULLIF(v.km, 0) AS km,
       IF(v.deleted_at IS NULL, 0, 1) AS veic_apagado,
       REGEXP_REPLACE(UPPER(TRIM(v.{pl})), '[^A-Z0-9]', '') AS placa,
       DATE_FORMAT(an.updated_at, '%Y-%m-%d %H:%i') AS atualizado
  FROM advertisement_negotiations an
  INNER JOIN advertisements a ON a.id = an.advertisement_id
  INNER JOIN vehicles v ON v.id = a.vehicle_id
  LEFT JOIN events e ON e.id = an.event_id
  LEFT JOIN shops s ON s.id = a.shop_id
  LEFT JOIN offers vo ON vo.id = an.offer_actual_id AND vo.deleted_at IS NULL
  LEFT JOIN categories cat ON cat.id = v.category_id
  LEFT JOIN category_groups cg ON cg.id = cat.category_group_id
  LEFT JOIN brands b ON b.id = v.brand_id
  LEFT JOIN models m ON m.id = v.model_id
  LEFT JOIN versions ver ON ver.id = v.version_id
 WHERE an.deleted_at IS NULL
   AND a.vehicle_id IN ({ids}){ex}
""".format(ini=INICIO, pl=COL_PLACA, ids=",".join(str(int(i)) for i in ids),
           ex=("\n   AND COALESCE(an.event_id, 0) <> " + ex) if ex else "")


def rodar(cur, sql):
    cur.execute(sql)
    cols = [d[0] for d in cur.description]
    return cols, [[(float(x) if hasattr(x, "as_tuple") else x) for x in l] for l in cur.fetchall()]


def descobre():
    for base in BASES:
        cx = conectar(base)
        cur = cx.cursor()
        print("\n=== %s" % base)
        _, cols = rodar(cur, "SHOW COLUMNS FROM vehicles")
        print("colunas de vehicles com placa/chassi:",
              [c[0] for c in cols if any(k in c[0].lower() for k in ("plate", "chass", "placa"))])
        _, linhas = rodar(cur, """
SELECT cat.id, cat.name, cat.category_group_id, cg.name, COUNT(v.id)
  FROM categories cat LEFT JOIN category_groups cg ON cg.id = cat.category_group_id
  LEFT JOIN vehicles v ON v.category_id = cat.id AND v.deleted_at IS NULL
 GROUP BY cat.id, cat.name, cat.category_group_id, cg.name ORDER BY cat.id""")
        for l in linhas:
            print("  cat", l)
        cx.close()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--descobre", action="store_true")
    args = ap.parse_args()
    if args.descobre:
        return descobre()

    sal = secrets.token_hex(16)
    cxs = {b: conectar(b) for b in BASES}
    veics = {}
    for base in BASES:
        t = time.time()
        _, linhas = rodar(cxs[base].cursor(), sql_passo1(base, sal))
        veics[base] = linhas
        print("passo 1, %s: %d veiculos com negociacao em 2026 (%.1fs)" % (base, len(linhas), time.time() - t))

    # Placa/chassi repetido em muitos veiculos da mesma base = cadastro lixo, nao casa
    lixo = {}
    for base in BASES:
        for idx, nome in ((1, "chassi"), (2, "placa")):
            cnt = Counter(l[idx] for l in veics[base] if l[idx])
            lixo[(base, nome)] = {h for h, n in cnt.items() if n > TETO_REPETIDO}
    resumo = {"veiculos_2026": {b: len(veics[b]) for b in BASES},
              "sem_chassi": {b: sum(1 for l in veics[b] if not l[1]) for b in BASES},
              "sem_placa": {b: sum(1 for l in veics[b] if not l[2]) for b in BASES},
              "hash_lixo": {"%s_%s" % k: len(v) for k, v in lixo.items()}}

    # Grafo carro: no = (base, veic); aresta = mesmo chassi, ou mesma placa
    pai = {}

    def acha(x):
        while pai.setdefault(x, x) != x:
            pai[x] = pai[pai[x]]
            x = pai[x]
        return x

    def une(a, b):
        pai[acha(a)] = acha(b)

    chassi_de = {}
    por_chassi, por_placa = defaultdict(list), defaultdict(list)
    for base in BASES:
        for veic, hc, hp in veics[base]:
            no = (base, veic)
            acha(no)
            hc = hc if hc and hc not in lixo[(base, "chassi")] else None
            hp = hp if hp and hp not in lixo[(base, "placa")] else None
            chassi_de[no] = hc
            if hc:
                por_chassi[hc].append(no)
            if hp:
                por_placa[hp].append(no)
    for nos in por_chassi.values():
        for n in nos[1:]:
            une(nos[0], n)
    conflito_placa = 0
    for nos in por_placa.values():
        for n in nos[1:]:
            a, b = chassi_de[nos[0]], chassi_de[n]
            if a and b and a != b:  # mesma placa, chassi diferente: nao e o mesmo carro
                conflito_placa += 1
                continue
            une(nos[0], n)

    grupos = defaultdict(list)
    for no in pai:
        grupos[acha(no)].append(no)
    carros = []
    for nos in grupos.values():
        bases = {b for b, _ in nos}
        if bases == set(BASES):
            pelo = "chassi" if len({chassi_de[n] for n in nos if chassi_de[n]}) == 1 and all(chassi_de[n] for n in nos) else "placa"
            carros.append({"veics": {b: sorted(v for bb, v in nos if bb == b) for b in BASES}, "casou_por": pelo})
    resumo["carros_nas_duas"] = len(carros)
    resumo["conflito_placa_chassi"] = conflito_placa
    resumo["casou_por"] = dict(Counter(c["casou_por"] for c in carros))
    print("casados:", resumo)

    saida = {"rodada": time.strftime("%Y-%m-%d %H:%M"), "desde": DESDE, "resumo": resumo, "carros": carros, "negs": {}}
    for base in BASES:
        ids = sorted({v for c in carros for v in c["veics"][base]})
        t = time.time()
        cols, linhas = (None, [])
        for i in range(0, len(ids), 2000):
            cols, parte = rodar(cxs[base].cursor(), sql_passo2(base, ids[i:i + 2000]))
            linhas += parte
        saida["negs"][base] = {"cols": cols, "linhas": linhas}
        print("passo 2, %s: %d negociacoes de %d veiculos (%.1fs)" % (base, len(linhas), len(ids), time.time() - t))
    for cx in cxs.values():
        cx.close()
    (AQUI / "dados-brutos.json").write_text(json.dumps(saida, ensure_ascii=False, default=str),
                                            encoding="utf-8", newline="\n")
    print("gravado dados-brutos.json")


if __name__ == "__main__":
    main()
