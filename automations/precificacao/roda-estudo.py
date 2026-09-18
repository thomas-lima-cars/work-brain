"""Estudo de precificacao na base da DEALERS.

Replica o estudo de `automations/n8n-sdk/precificacao/` (Cars2You) sobre
`wl_dlc_prd`, com as MESMAS definicoes, e emite os JSONs no formato que os
analisadores de la ja consomem -- para nao reescrever a estatistica.

  python roda-estudo.py

Sai:
  amostra-modelo-dealers.config.json   os 20 modelos, derivados AQUI
  dados-dealers.json                   {dados:{q_gabarito, q_km, q_idade, ...}}
  analitico-dealers.json               {vendas:[...]} uma linha por venda

Depois:
  node ../../n8n-sdk/precificacao/analisa-dimensoes.js dados-dealers.json ...
  node ../../n8n-sdk/precificacao/analisa-drivers.js   analitico-dealers.json

── O QUE MUDA EM RELACAO AO ESTUDO DA CARS2YOU ───────────────────────────────
Nada de definicao. Venda, "ultima", valor, FIPE, grupo, corte e janela sao
identicos -- ver o cabecalho de `sonda-09-template.js`.

Muda o CAMINHO: la o acesso e o MCP, que corta em 50 linhas e rejeita funcao
de janela, e por isso a sonda e paginada em 96 chamadas. Aqui a conexao e
direta: uma consulta por dimensao, sem teto e sem paginacao. Some com a
classe inteira de erro "filtro no gabarito e nao na pagina".

Muda a AMOSTRA: os 20 modelos sao re-derivados na Dealers. Reusar a lista da
Cars2You seria medir o ranking de la na base de ca.
"""

import datetime as dt
import json
import sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent
sys.path.insert(0, str(AQUI.parent / "bancos"))
sys.stdout.reconfigure(encoding="utf-8")
from conexao import conectar as _conectar  # noqa: E402


# 17/09: a Cars2You ganhou conexao direta tambem, entao a sonda virou
# multi-base. A amostra e SEMPRE re-derivada na base escolhida -- copiar a
# lista de modelos de uma para a outra mediria o ranking de la na base de ca.
BASE = "dealers"
for _i, _a in enumerate(sys.argv):
    if _a == "--base" and _i + 1 < len(sys.argv):
        BASE = sys.argv[_i + 1].lower()
if BASE not in ("dealers", "cars2you"):
    raise SystemExit("--base aceita dealers ou cars2you")
SUFIXO = BASE


def conectar():
    return _conectar(BASE)

JANELA_MESES = 12
CORTE = (0.2, 1.2)
EXCLUIR = ["Motocicleta", "Caminhao", "Onibus", "Reboque", "Semireboque"]
TOP_N = 20

# A data vai como LITERAL, calculada fora do SQL: o banco responde em UTC e o
# evento e horario de Brasilia. Regra ja registrada no estado-atual.md.
AGORA = dt.datetime.now(dt.timezone.utc) - dt.timedelta(minutes=180)
INI = AGORA.replace(year=AGORA.year - JANELA_MESES // 12)
JANELA = (" AND an.finish_date_offer >= '%s 00:00:00'"
          " AND an.finish_date_offer <= '%s 23:59:59'"
          % (INI.strftime("%Y-%m-%d"), AGORA.strftime("%Y-%m-%d")))

ULTIMA = (" INNER JOIN (SELECT a2.vehicle_id AS vid, MAX(an2.id) AS ult"
          " FROM advertisement_negotiations an2"
          " INNER JOIN advertisements a2 ON a2.id = an2.advertisement_id"
          " WHERE an2.deleted_at IS NULL"
          " GROUP BY a2.vehicle_id) u ON u.ult = an.id")

# o laudo pre-agregado: 1 linha por veiculo aconteca o que acontecer
LAUDO = (" LEFT JOIN (SELECT vpr0.vehicle_id AS vid, MAX(vpr0.situation) AS sit"
         " FROM vehicle_precautionary_reports vpr0 WHERE vpr0.deleted_at IS NULL"
         " GROUP BY vpr0.vehicle_id) lau ON lau.vid = v.id")

CAMINHO = (" FROM advertisement_negotiations an" + ULTIMA +
           " LEFT JOIN offers o ON o.id = an.offer_actual_id AND o.deleted_at IS NULL"
           " INNER JOIN advertisements a ON a.id = an.advertisement_id"
           " INNER JOIN vehicles v ON v.id = a.vehicle_id"
           " LEFT JOIN versions ver ON ver.id = v.version_id"
           " LEFT JOIN shop_stocks ss ON ss.id = v.shop_stock_id"
           " LEFT JOIN models m ON m.id = v.model_id"
           " LEFT JOIN brands b ON b.id = v.brand_id"
           " LEFT JOIN categories cat ON cat.id = v.category_id")

MARCA = "UPPER(TRIM(COALESCE(b.name, '(sem marca)')))"
MODELO = "UPPER(TRIM(COALESCE(m.name, '(sem modelo)')))"
GRUPO = "CONCAT(%s, ' ', %s)" % (MARCA, MODELO)
RAZAO = "(o.price / a.fipe_price)"

SEM_PESADOS = (" AND COALESCE(cat.name, 'Nao informada') NOT IN ('"
               + "', '".join(EXCLUIR) + "')")

MEDIDAS = (" COUNT(*) AS vendas,"
           " ROUND(AVG(%s), 6) AS razao_media,"
           " ROUND(STDDEV_SAMP(%s), 6) AS razao_dp,"
           " ROUND(AVG(o.price), 2) AS venda_media,"
           " ROUND(AVG(a.fipe_price), 2) AS fipe_media" % (RAZAO, RAZAO))

# As faixas: iguais as da sonda 9, prefixo de letra incluido. O prefixo existia
# porque o MCP nao tem funcao de janela e a ordem alfabetica segurava a faixa;
# aqui nao seria necessario, mas o analisador de la limpa o prefixo e espera
# encontra-lo. Mudar quebraria a comparabilidade.
F_KM = ("CASE WHEN v.km IS NULL THEN 'z sem km'"
        " WHEN v.km < 20000 THEN 'a ate 20k'"
        " WHEN v.km < 40000 THEN 'b 20 a 40k'"
        " WHEN v.km < 60000 THEN 'c 40 a 60k'"
        " WHEN v.km < 80000 THEN 'd 60 a 80k'"
        " WHEN v.km < 100000 THEN 'e 80 a 100k'"
        " WHEN v.km < 150000 THEN 'f 100 a 150k'"
        " WHEN v.km < 200000 THEN 'g 150 a 200k'"
        " ELSE 'h 200k ou mais' END")

IDADE = "(YEAR(an.finish_date_offer) - v.model_year)"
F_IDADE = ("CASE WHEN v.model_year IS NULL OR v.model_year < 1950 THEN 'z sem ano'"
           " WHEN %(i)s <= 1 THEN 'a 0 a 1 ano'"
           " WHEN %(i)s = 2 THEN 'b 2 anos'"
           " WHEN %(i)s = 3 THEN 'c 3 anos'"
           " WHEN %(i)s = 4 THEN 'd 4 anos'"
           " WHEN %(i)s = 5 THEN 'e 5 anos'"
           " WHEN %(i)s = 6 THEN 'f 6 anos'"
           " WHEN %(i)s = 7 THEN 'g 7 anos'"
           " WHEN %(i)s <= 9 THEN 'h 8 a 9 anos'"
           " WHEN %(i)s <= 14 THEN 'i 10 a 14 anos'"
           " ELSE 'j 15 anos ou mais' END") % {"i": IDADE}

F_UF = "UPPER(TRIM(COALESCE(NULLIF(TRIM(ss.state), ''), 'z sem UF')))"
F_LAUDO = "COALESCE(NULLIF(TRIM(lau.sit), ''), 'z sem laudo')"

# Colunas do analitico: as mesmas da sonda 10, menos PII. `descricao` entra
# porque o maior achado do estudo da Cars2You saiu dali.
COLUNAS_ANALITICO = [
    (GRUPO, "grupo"),
    ("v.id", "veiculo_id"), ("an.id", "negociacao_id"),
    ("ver.code_fipe", "codigo_fipe"), ("ver.code_molicar", "codigo_molicar"),
    ("o.price", "venda"), ("a.fipe_price", "valor_fipe_anuncio"),
    ("v.fipe_price", "valor_fipe_veiculo"),
    ("an.price_reference_advertiser", "valor_ref_vendedor"),
    ("an.min_sale_price", "vmv"),
    ("v.molicar_price", "valor_molicar_veiculo"),
    ("a.molicar_price", "valor_molicar_anuncio"),
    ("v.retail_value", "valor_varejo"),
    ("s.id", "loja_id"), ("s.name", "loja"), ("s.whitelabel_id", "whitelabel_id"),
    ("ss.name", "patio"), ("ss.city", "patio_cidade"), ("ss.state", "patio_uf"),
    ("cat.name", "categoria"), ("b.name", "marca"), ("m.name", "modelo"),
    ("ver.name", "versao"), ("bw.name", "carroceria"), ("c.name", "cor"),
    ("dsh.name", "cambio"), ("f.name", "combustivel"), ("cl.name", "cluster"),
    ("v.situation", "situacao_codigo"),
    ("v.manufacture_year", "ano_fabricacao"), ("v.model_year", "ano_modelo"),
    ("v.km", "km"), ("v.ports_qtd", "portas"),
    ("v.fipe_quantity_version", "fipe_qtd_versoes"),
    ("v.created_at", "veiculo_criado_em"), ("v.updated_at", "veiculo_atualizado_em"),
    ("an.finish_date_offer", "data_venda"), ("an.status", "status_negociacao"),
    ("o.buyer_shop_id", "comprador_loja_id"),
    ("lau.sit", "laudo"),
    ("v.description", "descricao"),
]

CAMINHO_ANALITICO = (CAMINHO + LAUDO +
                     " LEFT JOIN shops s ON s.id = v.shop_id"
                     " LEFT JOIN bodyworks bw ON bw.id = v.bodywork_id"
                     " LEFT JOIN colors c ON c.id = v.color_id"
                     " LEFT JOIN driver_shifts dsh ON dsh.id = v.drive_shift_id"
                     " LEFT JOIN clusters cl ON cl.id = v.cluster_id"
                     " LEFT JOIN fuels f ON f.id = v.fuel_id")

# ── PII: o estudo da Cars2You proibe placa/chassi/renavam na sonda. A mesma
# regra vale aqui, e e conferida antes de rodar qualquer coisa.
PII = ("plate", "chassi", "chassis", "renavam", "last_owner",
       "document", "cpf", "cnpj")


def prova_sem_pii(sql, quem):
    baixo = sql.lower()
    for p in PII:
        if p in baixo:
            raise SystemExit("PII na consulta %s: '%s'" % (quem, p))


def filtro(escopo=""):
    return (" WHERE an.status IN (2, 3, 7)" + JANELA +
            " AND o.price > 0 AND a.fipe_price > 0"
            " AND %s >= %s AND %s <= %s" % (RAZAO, CORTE[0], RAZAO, CORTE[1]) +
            SEM_PESADOS + escopo)


def linhas(cur, sql, quem):
    prova_sem_pii(sql, quem)
    cur.execute(sql)
    cols = [c[0] for c in cur.description]
    return [dict(zip(cols, ["" if v is None else
                           (str(v) if not isinstance(v, (int, float)) else v)
                           for v in r])) for r in cur.fetchall()]


def main():
    cx = conectar()
    cur = cx.cursor()
    print("janela: %s -> %s" % (INI.date(), AGORA.date()))

    # ── 1. os 20 modelos, derivados AQUI ──────────────────────────────────
    sql_top = ("SELECT %s AS marca, %s AS modelo, COUNT(*) AS vendas,"
               " COUNT(DISTINCT v.model_id) AS ids" % (MARCA, MODELO) +
               CAMINHO + filtro() +
               " GROUP BY marca, modelo ORDER BY vendas DESC LIMIT %d" % TOP_N)
    top = linhas(cur, sql_top, "top_modelos")

    cur.execute("SELECT COUNT(*)" + CAMINHO + filtro())
    elegiveis = cur.fetchone()[0]
    cobertura = sum(m["vendas"] for m in top)
    print("elegiveis: %d  |  top %d cobre %d (%.1f%%)"
          % (elegiveis, TOP_N, cobertura, 100 * cobertura / elegiveis))

    cfg = {
        "nome": "top20-modelos-12m-" + SUFIXO.upper(),
        "descricao": ("Mesmas definicoes do estudo da Cars2You, sobre wl_dlc_prd. "
                      "Os 20 modelos foram re-derivados nesta base, nao copiados."),
        "base": BASE,
        "gerado_em": AGORA.strftime("%Y-%m-%d %H:%M") + " (Brasilia)",
        "chave": "marca + nome do modelo, normalizados (UPPER/TRIM)",
        "modelos": [{"marca": m["marca"], "modelo": m["modelo"],
                     "vendas": m["vendas"], "ids": m["ids"]} for m in top],
        "excluir_categorias": EXCLUIR,
        "janela_meses": JANELA_MESES,
        "corte_razao": list(CORTE),
        "elegiveis": elegiveis,
        "vendas_esperadas": cobertura,
    }
    (AQUI / ("amostra-modelo-%s.config.json" % SUFIXO)).write_text(
        json.dumps(cfg, ensure_ascii=False, indent=2), encoding="utf-8")

    chaves = [m["marca"] + "|" + m["modelo"] for m in top]
    escopo = (" AND CONCAT(%s, '|', %s) IN ('" % (MARCA, MODELO)
              + "', '".join(chaves) + "')")
    F = filtro(escopo)

    # ── 2. as quatro dimensoes ────────────────────────────────────────────
    dados = {}
    dados["q_gabarito"] = linhas(cur,
        "SELECT COUNT(*) AS vendas, COUNT(DISTINCT %s) AS grupos,"
        " COUNT(DISTINCT ver.code_fipe) AS codigos_fipe,"
        " COUNT(DISTINCT v.model_id) AS model_ids,"
        " ROUND(AVG(%s), 6) AS razao_media,"
        " MIN(an.finish_date_offer) AS primeira,"
        " MAX(an.finish_date_offer) AS ultima" % (GRUPO, RAZAO)
        + CAMINHO + F, "q_gabarito")

    dados["q_categorias_restantes"] = linhas(cur,
        "SELECT COALESCE(cat.name, '(sem categoria)') AS categoria, COUNT(*) AS vendas"
        + CAMINHO + F + " GROUP BY categoria ORDER BY vendas DESC",
        "q_categorias_restantes")

    for nome, faixa, extra in (("q_km", F_KM, ""), ("q_idade", F_IDADE, ""),
                               ("q_uf", F_UF, ""), ("q_laudo", F_LAUDO, LAUDO)):
        dados[nome] = linhas(cur,
            "SELECT %s AS grupo, %s AS faixa,%s" % (GRUPO, faixa, MEDIDAS)
            + CAMINHO + extra + F + " GROUP BY grupo, faixa ORDER BY grupo, faixa",
            nome)
        print("  %-10s %5d linhas (grupo x faixa)" % (nome, len(dados[nome])))

    (AQUI / ("dados-%s.json" % SUFIXO)).write_text(
        json.dumps({"dados": dados, "base": BASE,
                    "gerado_em": cfg["gerado_em"]}, ensure_ascii=False),
        encoding="utf-8")

    # ── 3. o analitico, linha a linha ─────────────────────────────────────
    sel = ", ".join("%s AS %s" % (e, a) for e, a in COLUNAS_ANALITICO)
    vendas = linhas(cur, "SELECT " + sel + CAMINHO_ANALITICO + F
                    + " ORDER BY grupo, v.id", "analitico")
    print("  analitico  %5d linhas" % len(vendas))

    # As duas saidas TEM de falar da mesma amostra. Erro ja cometido em 15/09:
    # 4.127 contra 4.582, cada pagina com o proprio gabarito batendo.
    gab = int(dados["q_gabarito"][0]["vendas"])
    if len(vendas) != gab:
        raise SystemExit("DIVERGENCIA: gabarito=%d analitico=%d" % (gab, len(vendas)))
    print("  conferido: analitico == gabarito == %d" % gab)

    (AQUI / ("analitico-%s.json" % SUFIXO)).write_text(
        json.dumps({"vendas": vendas, "base": BASE,
                    "gerado_em": cfg["gerado_em"]}, ensure_ascii=False),
        encoding="utf-8")

    cur.close()
    cx.close()
    print("\nok")


if __name__ == "__main__":
    main()
