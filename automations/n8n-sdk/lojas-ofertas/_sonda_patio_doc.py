# -*- coding: utf-8 -*-
"""Acrescenta a sonda que precede os quatro pedidos de 2026-09-10.

Nenhum dos quatro pode ser escrito por chute:

  1. UF pelo PATIO. O patio e `shop_stocks` ("estoques de uma loja, que podem
     ser locais fisicos diferentes", com state/city/garage_type). Ha DOIS
     caminhos ate ele -- `advertisements.shop_stock_id` e
     `vehicles.shop_stock_id` -- e nao sei qual esta preenchido, nem quanto
     a UF do patio difere da UF do endereco da loja, que e o que o relatorio
     usa hoje. `q_patio` e `q_uf_patio` medem os dois.

  2. LINK DO ANUNCIO. `advertisements` tem `uuid` e nenhuma coluna de URL. O
     dominio de cada whitelabel deve estar entre as 11 colunas que o
     diagrama colapsou. `q_colunas` abre essas colunas pelo
     information_schema.

  3. JANELA NOVA (tudo que encerrou a partir de 09/09 mais o que nao
     encerrou). Sem teto, entram eventos que terminam em dezembro e 2027 --
     `q_janela_nova` dimensiona antes de eu montar paginacao no escuro.

  4. STATUS DA DOCUMENTACAO. No esquema documentado nao existe: toda coluna
     `document` que aparece e CPF/CNPJ, e nao ha tabela de regularizacao.
     Mas 49 colunas de 4 tabelas sao invisiveis pra mim, e
     `advertisement_negotiations` (5 ocultas) e onde um status por
     negociacao moraria. `q_colunas` e `q_col_doc` resolvem isso pelo
     information_schema, que e SELECT e passa pelo validador do MCP.

De quebra, `q_colunas` fecha uma ressalva antiga da doc do banco.

    python _sonda_patio_doc.py
"""
import io
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "sonda-eventos-queries.js")
s = io.open(P, encoding="utf-8").read()
orig = s

ancora = "const comJanela = Q.filter"
if ancora not in s:
    raise SystemExit("ancora das guardas nao encontrada")

DIA = "2026-09-09 00:00:00"

novo = """/* ═══ SONDA 2026-09-10: patio, link do anuncio e documentacao ═══════ */

/* 12. as colunas que o diagrama colapsou. information_schema e SELECT,
   entao passa pelo validador do MCP. Resolve tres coisas de uma vez: se
   existe status de documentacao em advertisement_negotiations, onde esta o
   dominio de cada whitelabel (pro link), e a ressalva das 49 colunas. */
push('q_colunas',
  "SELECT c.TABLE_NAME AS tabela, c.ORDINAL_POSITION AS pos," +
  " c.COLUMN_NAME AS coluna, c.COLUMN_TYPE AS tipo," +
  " c.IS_NULLABLE AS aceita_nulo, c.COLUMN_COMMENT AS comentario" +
  " FROM information_schema.COLUMNS c" +
  " WHERE c.TABLE_SCHEMA = 'cars2you_production'" +
  " AND c.TABLE_NAME IN ('advertisement_negotiations', 'whitelabels')" +
  " ORDER BY c.TABLE_NAME, c.ORDINAL_POSITION", 3);

/* 13. qualquer coluna do banco com cara de documentacao, em qualquer
   tabela. Se o status existir com outro nome, aparece aqui. */
push('q_col_doc',
  "SELECT c.TABLE_NAME AS tabela, c.COLUMN_NAME AS coluna, c.COLUMN_TYPE AS tipo" +
  " FROM information_schema.COLUMNS c" +
  " WHERE c.TABLE_SCHEMA = 'cars2you_production'" +
  " AND (c.COLUMN_NAME LIKE '%doc%' OR c.COLUMN_NAME LIKE '%regulariz%'" +
  " OR c.COLUMN_NAME LIKE '%crlv%' OR c.COLUMN_NAME LIKE '%renavam%'" +
  " OR c.COLUMN_NAME LIKE '%transfer%' OR c.COLUMN_NAME LIKE '%laudo%'" +
  " OR c.COLUMN_NAME LIKE '%vistoria%' OR c.COLUMN_NAME LIKE '%gravame%')" +
  " ORDER BY c.TABLE_NAME, c.COLUMN_NAME", 3);

/* 14. e as tabelas com nome sugestivo, caso o status more numa tabela
   propria em vez de numa coluna */
push('q_tab_doc',
  "SELECT t.TABLE_NAME AS tabela, t.TABLE_ROWS AS linhas_aprox," +
  " t.TABLE_COMMENT AS comentario" +
  " FROM information_schema.TABLES t" +
  " WHERE t.TABLE_SCHEMA = 'cars2you_production'" +
  " AND (t.TABLE_NAME LIKE '%doc%' OR t.TABLE_NAME LIKE '%regulariz%'" +
  " OR t.TABLE_NAME LIKE '%despach%' OR t.TABLE_NAME LIKE '%transfer%')" +
  " ORDER BY t.TABLE_NAME", 2);

/* ── o PATIO ────────────────────────────────────────────────────────── */
const JAN_NOVA =
  " e.deleted_at IS NULL AND e.finish_date_event >= '""" + DIA + """'";

/* 15. cobertura: qual dos dois caminhos ate o patio esta preenchido, e
   quanto a UF do patio difere da UF do endereco da loja (que e a que o
   relatorio usa hoje). Se divergir pouco, a mudanca e cosmetica; se
   divergir muito, a elegibilidade inteira muda de lugar. */
push('q_patio',
  "SELECT COUNT(*) AS negociacoes," +
  " SUM(CASE WHEN a.shop_stock_id IS NOT NULL THEN 1 ELSE 0 END) AS patio_no_anuncio," +
  " SUM(CASE WHEN v.shop_stock_id IS NOT NULL THEN 1 ELSE 0 END) AS patio_no_veiculo," +
  " SUM(CASE WHEN ss.id IS NOT NULL THEN 1 ELSE 0 END) AS patio_encontrado," +
  " SUM(CASE WHEN TRIM(COALESCE(ss.state, '')) <> '' THEN 1 ELSE 0 END) AS patio_com_uf," +
  " SUM(CASE WHEN TRIM(COALESCE(sa.state, '')) <> '' THEN 1 ELSE 0 END) AS loja_com_uf," +
  " SUM(CASE WHEN TRIM(COALESCE(ss.state, '')) <> '' AND TRIM(COALESCE(sa.state, '')) <> ''" +
  " AND UPPER(TRIM(ss.state)) <> UPPER(TRIM(sa.state)) THEN 1 ELSE 0 END) AS divergem" +
  " FROM advertisement_negotiations an" +
  " INNER JOIN events e ON e.id = an.event_id AND" + JAN_NOVA +
  " INNER JOIN advertisements a ON a.id = an.advertisement_id AND a.deleted_at IS NULL" +
  " INNER JOIN vehicles v ON v.id = a.vehicle_id AND v.deleted_at IS NULL" +
  " LEFT JOIN shop_stocks ss ON ss.id = COALESCE(a.shop_stock_id, v.shop_stock_id)" +
  " AND ss.deleted_at IS NULL" +
  " LEFT JOIN shop_addresses sa ON sa.shop_id = a.shop_id AND sa.deleted_at IS NULL" +
  " WHERE an.deleted_at IS NULL", 1);

/* 16. como a UF do patio vem escrita -- o UF_CASE do relatorio normaliza
   'S.P', 'Rio de Janeiro' e afins, e preciso saber se a lista muda */
push('q_uf_patio',
  "SELECT UPPER(TRIM(COALESCE(ss.state, '(vazio)'))) AS uf_patio," +
  " COUNT(*) AS negociacoes, COUNT(DISTINCT ss.id) AS patios" +
  " FROM advertisement_negotiations an" +
  " INNER JOIN events e ON e.id = an.event_id AND" + JAN_NOVA +
  " INNER JOIN advertisements a ON a.id = an.advertisement_id AND a.deleted_at IS NULL" +
  " INNER JOIN vehicles v ON v.id = a.vehicle_id AND v.deleted_at IS NULL" +
  " LEFT JOIN shop_stocks ss ON ss.id = COALESCE(a.shop_stock_id, v.shop_stock_id)" +
  " AND ss.deleted_at IS NULL" +
  " WHERE an.deleted_at IS NULL" +
  " GROUP BY uf_patio ORDER BY negociacoes DESC", 2);

/* ── a JANELA NOVA ──────────────────────────────────────────────────── */
/* 17. quanto o recorte novo traz. Sem teto entram eventos que terminam em
   dezembro e em 2027; isso dimensiona a paginacao ANTES de eu montar. */
push('q_janela_nova',
  "SELECT COUNT(DISTINCT e.id) AS eventos," +
  " COUNT(DISTINCT a.vehicle_id) AS veiculos," +
  " COUNT(*) AS negociacoes" +
  " FROM advertisement_negotiations an" +
  " INNER JOIN events e ON e.id = an.event_id AND" + JAN_NOVA +
  " INNER JOIN advertisements a ON a.id = an.advertisement_id AND a.deleted_at IS NULL" +
  " INNER JOIN vehicles v ON v.id = a.vehicle_id AND v.deleted_at IS NULL" +
  " WHERE an.deleted_at IS NULL AND an.status IN (1, 11, 14, 15, 18)", 1);

/* 18. os eventos do recorte novo, com quantos veiculos cada um. Mostra se
   um evento de fim distante esta arrastando a base. */
push('q_eventos_novos',
  "SELECT e.id AS evento_id, e.name AS evento, e.status AS ev_status," +
  " DATE_FORMAT(e.finish_date_event, '%Y-%m-%d %H:%i') AS fim_evento," +
  " COUNT(DISTINCT a.vehicle_id) AS veiculos" +
  " FROM events e" +
  " INNER JOIN advertisement_negotiations an ON an.event_id = e.id" +
  " AND an.deleted_at IS NULL AND an.status IN (1, 11, 14, 15, 18)" +
  " INNER JOIN advertisements a ON a.id = an.advertisement_id AND a.deleted_at IS NULL" +
  " WHERE" + JAN_NOVA +
  " GROUP BY evento_id, evento, ev_status, fim_evento" +
  " ORDER BY e.finish_date_event", 4);

/* ── o LINK ─────────────────────────────────────────────────────────── */
/* 19. o uuid existe e esta preenchido? E amostra pra eu ver o formato. */
push('q_uuid',
  "SELECT COUNT(*) AS anuncios," +
  " SUM(CASE WHEN a.uuid IS NULL OR a.uuid = '' THEN 1 ELSE 0 END) AS sem_uuid," +
  " MIN(a.uuid) AS exemplo_uuid, MIN(a.id) AS exemplo_id" +
  " FROM advertisement_negotiations an" +
  " INNER JOIN events e ON e.id = an.event_id AND" + JAN_NOVA +
  " INNER JOIN advertisements a ON a.id = an.advertisement_id AND a.deleted_at IS NULL" +
  " WHERE an.deleted_at IS NULL", 1);

"""

s = s.replace(ancora, novo + ancora, 1)
io.open(P, "w", encoding="utf-8").write(s)
print("mudou: " + str(s != orig))
print("8 consultas novas: q_colunas, q_col_doc, q_tab_doc, q_patio,")
print("q_uf_patio, q_janela_nova, q_eventos_novos, q_uuid")
