/* ══════════════════════════════════════════════════════════════════════
   SONDA "Eventos ativos" — veículos por whitelabel e UF

   Pergunta do Thomas (2026-09-09): quantos veículos estão disponíveis em
   eventos ativos hoje, por whitelabel e UF.

   Esta sonda responde a pergunta E mede duas coisas que ainda não sabemos:

     1. **O domínio de `advertisement_negotiations.status`.** Nenhuma das
        duas fontes do banco documenta o que cada valor significa. A única
        pista é a sonda do lote 2, que usa `an.status IN (2,3,7)` para
        "comprado". Sem saber o resto, não dá para afirmar o que é
        "disponível" — então a `q_status` traz a distribuição inteira e a
        gente decide olhando.

     2. **O tamanho da inflação por whitelabel.** Um evento pode alvejar
        vários whitelabels via `event_whitelabels`, então o mesmo veículo
        conta em cada um. A `q_total` traz o número SEM fatiar; a soma da
        `q_wl_uf` vai ser maior. Somar whitelabel dá número inflado — a
        mesma armadilha do lote 2.

   Regras já medidas do MCP (ver automations/n8n-sdk/README.md):
   sem função de janela, resposta cortada em 50 linhas, deadline de 60s.
   ══════════════════════════════════════════════════════════════════════ */

const PAGE = 50;

const UF_CASE =
  "CASE WHEN UPPER(TRIM(sa.state)) IN ('SP','MG','PR','SC','RJ','GO','RS','BA','MT','DF','CE','MS','ES','PE','PA','SE','AM','MA','RN','PB','AL','PI','RO','TO','AP','AC','RR') THEN UPPER(TRIM(sa.state))" +
  " WHEN UPPER(TRIM(sa.state)) = 'S.P' THEN 'SP'" +
  " WHEN UPPER(TRIM(sa.state)) = 'RIO DE JANEIRO' THEN 'RJ'" +
  " WHEN UPPER(TRIM(sa.state)) = 'MATO GROSSO DO SUL' THEN 'MS'" +
  " WHEN UPPER(TRIM(sa.state)) LIKE 'ESPIRITO%SANTO%' THEN 'ES'" +
  " ELSE NULL END";

/* "ativo hoje" = já começou a exibir e ainda não encerrou o evento.
   Deliberadamente permissivo: a q_eventos lista as datas de cada um pra
   você conferir se o recorte bate com a operação. */
const ATIVO =
  " e.deleted_at IS NULL AND e.start_date_display <= NOW() AND e.finish_date_event >= NOW()";

const BASE =
  " FROM advertisement_negotiations an" +
  " INNER JOIN events e ON e.id = an.event_id AND" + ATIVO +
  " INNER JOIN advertisements a ON a.id = an.advertisement_id AND a.deleted_at IS NULL" +
  " WHERE an.deleted_at IS NULL";

const Q = [];
function push(nome, sql, pages) {
  for (let p = 0; p < pages; p++) {
    Q.push({
      queryName: nome,
      database: 'cars2you_production',
      sql: sql + ' LIMIT ' + PAGE + ' OFFSET ' + (p * PAGE),
      pagina: p
    });
  }
}

/* 1. quais eventos o recorte pegou, com as datas na mão pra conferir */
push('q_eventos',
  "SELECT e.id AS evento_id, e.name AS evento, e.type AS tipo," +
  " e.status AS status, e.situation AS situation," +
  " DATE_FORMAT(e.start_date_display, '%Y-%m-%d %H:%i') AS ini_display," +
  " DATE_FORMAT(e.start_date_offer, '%Y-%m-%d %H:%i') AS ini_oferta," +
  " DATE_FORMAT(e.finish_date_event, '%Y-%m-%d %H:%i') AS fim_evento," +
  " DATE_FORMAT(e.finish_date_display, '%Y-%m-%d %H:%i') AS fim_display" +
  " FROM events e WHERE" + ATIVO + " ORDER BY e.finish_date_event", 3);

/* 2. domínio de status — o que a documentação do banco não tem */
push('q_status',
  "SELECT an.status AS status, COUNT(*) AS negociacoes," +
  " COUNT(DISTINCT a.vehicle_id) AS veiculos" +
  BASE + " GROUP BY an.status ORDER BY negociacoes DESC", 2);

/* 3. total SEM fatiar por whitelabel — gabarito da inflação */
push('q_total',
  "SELECT COUNT(DISTINCT a.vehicle_id) AS veiculos," +
  " COUNT(DISTINCT an.id) AS negociacoes," +
  " COUNT(DISTINCT e.id) AS eventos," +
  " COUNT(DISTINCT a.shop_id) AS lojas" +
  BASE, 1);

/* 4. a resposta: veículos por whitelabel e UF.
   FROM próprio, escrito por extenso — nada de patch em string. */
push('q_wl_uf',
  "SELECT ew.whitelabel_id AS whitelabel_id, w.name AS whitelabel," +
  " COALESCE(" + UF_CASE + ", 'Não identificada') AS uf," +
  " COUNT(DISTINCT a.vehicle_id) AS veiculos," +
  " COUNT(DISTINCT an.id) AS negociacoes," +
  " COUNT(DISTINCT e.id) AS eventos," +
  " COUNT(DISTINCT a.shop_id) AS lojas" +
  " FROM advertisement_negotiations an" +
  " INNER JOIN events e ON e.id = an.event_id AND" + ATIVO +
  " INNER JOIN advertisements a ON a.id = an.advertisement_id AND a.deleted_at IS NULL" +
  " INNER JOIN event_whitelabels ew ON ew.event_id = e.id" +
  " LEFT JOIN whitelabels w ON w.id = ew.whitelabel_id" +
  " LEFT JOIN shop_addresses sa ON sa.shop_id = a.shop_id AND sa.deleted_at IS NULL" +
  " WHERE an.deleted_at IS NULL" +
  " GROUP BY whitelabel_id, whitelabel, uf ORDER BY veiculos DESC", 8);

/* 5. relógio do banco — resolve fuso e "que dia é hoje" pro servidor */
push('q_relogio',
  "SELECT DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s') AS agora," +
  " DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS hoje", 1);

/* 6. eventos que ENCERRAM hoje — abertos OU já fechados.
   A q_eventos só enxerga quem ainda não terminou (`finish >= NOW()`), então
   um evento que fechou às 11h de hoje é invisível lá. Esta não filtra por
   isso: pega tudo cujo finish_date_event caia na data de hoje. */
push('q_fecha_hoje',
  "SELECT e.id AS evento_id, e.name AS evento, e.status AS status," +
  " e.situation AS situation," +
  " DATE_FORMAT(e.start_date_display, '%Y-%m-%d %H:%i') AS ini_display," +
  " DATE_FORMAT(e.finish_date_event, '%Y-%m-%d %H:%i') AS fim_evento," +
  " DATE_FORMAT(e.finish_date_display, '%Y-%m-%d %H:%i') AS fim_display" +
  " FROM events e WHERE e.deleted_at IS NULL" +
  " AND DATE(e.finish_date_event) = CURDATE()" +
  " ORDER BY e.finish_date_event", 2);

/* 6b. eventos que encerraram num DIA ESPECIFICO, sem filtrar status.
   Motivo: o relatorio de aderencia recorta com `e.status = 1`, e nenhum
   evento do dia 9 apareceu na base mesmo com a janela abrindo a meia-noite
   daquele dia. Ou os eventos nao existem, ou o status muda quando fecham.
   Esta consulta responde: traz status e situation crus, e conta quantas
   negociacoes ainda estao em aberto (an.status = 1) em cada um. */
const DIA_ALVO = '2026-09-09';
push('q_dia_alvo',
  "SELECT e.id AS evento_id, e.name AS evento, e.status AS status," +
  " e.situation AS situation, e.deleted_at AS apagado," +
  " DATE_FORMAT(e.finish_date_event, '%Y-%m-%d %H:%i') AS fim_evento," +
  " COUNT(DISTINCT CASE WHEN an.status = 1 AND an.deleted_at IS NULL" +
  " THEN a.vehicle_id END) AS veiculos_em_aberto," +
  " COUNT(DISTINCT an.id) AS negociacoes" +
  " FROM events e" +
  " LEFT JOIN advertisement_negotiations an ON an.event_id = e.id" +
  " LEFT JOIN advertisements a ON a.id = an.advertisement_id AND a.deleted_at IS NULL" +
  " WHERE DATE(e.finish_date_event) = '" + DIA_ALVO + "'" +
  " GROUP BY e.id, e.name, e.status, e.situation, e.deleted_at, e.finish_date_event" +
  " ORDER BY e.finish_date_event", 2);

/* 7. e o que encerra nas próximas 48h, pra ver o que está na iminência */
push('q_fecha_48h',
  "SELECT e.id AS evento_id, e.name AS evento, e.status AS status," +
  " DATE_FORMAT(e.finish_date_event, '%Y-%m-%d %H:%i') AS fim_evento," +
  " COUNT(DISTINCT a.vehicle_id) AS veiculos" +
  " FROM events e" +
  " LEFT JOIN advertisement_negotiations an ON an.event_id = e.id" +
  " AND an.deleted_at IS NULL AND an.status = 1" +
  " LEFT JOIN advertisements a ON a.id = an.advertisement_id AND a.deleted_at IS NULL" +
  " WHERE e.deleted_at IS NULL AND e.status = 1" +
  " AND e.finish_date_event >= NOW()" +
  " AND e.finish_date_event <= DATE_ADD(NOW(), INTERVAL 48 HOUR)" +
  " GROUP BY e.id, e.name, e.status, fim_evento" +
  " ORDER BY e.finish_date_event", 2);

/* 8. quebra POR EVENTO x whitelabel x UF, para os que encerram amanhã.
   Só negociação em status 1 (disponível). A q_wl_uf agrega todos os
   eventos juntos; esta separa, que é o que a operação precisa ver. */
push('q_amanha',
  "SELECT e.id AS evento_id, e.name AS evento," +
  " DATE_FORMAT(e.finish_date_event, '%Y-%m-%d %H:%i') AS fim_evento," +
  " ew.whitelabel_id AS whitelabel_id, w.name AS whitelabel," +
  " COALESCE(" + UF_CASE + ", 'Não identificada') AS uf," +
  " COUNT(DISTINCT a.vehicle_id) AS veiculos," +
  " COUNT(DISTINCT a.shop_id) AS lojas" +
  " FROM events e" +
  " INNER JOIN advertisement_negotiations an ON an.event_id = e.id" +
  " AND an.deleted_at IS NULL AND an.status = 1" +
  " INNER JOIN advertisements a ON a.id = an.advertisement_id AND a.deleted_at IS NULL" +
  " INNER JOIN event_whitelabels ew ON ew.event_id = e.id" +
  " LEFT JOIN whitelabels w ON w.id = ew.whitelabel_id" +
  " LEFT JOIN shop_addresses sa ON sa.shop_id = a.shop_id AND sa.deleted_at IS NULL" +
  " WHERE e.deleted_at IS NULL AND e.status = 1" +
  " AND DATE(e.finish_date_event) = DATE_ADD(CURDATE(), INTERVAL 1 DAY)" +
  " GROUP BY evento_id, evento, fim_evento, whitelabel_id, whitelabel, uf" +
  " ORDER BY fim_evento, veiculos DESC", 4);

/* 9. o mesmo, SEM fatiar por whitelabel — o número real por evento */
push('q_amanha_total',
  "SELECT e.id AS evento_id, e.name AS evento," +
  " DATE_FORMAT(e.finish_date_event, '%Y-%m-%d %H:%i') AS fim_evento," +
  " COUNT(DISTINCT a.vehicle_id) AS veiculos," +
  " COUNT(DISTINCT a.shop_id) AS lojas" +
  " FROM events e" +
  " INNER JOIN advertisement_negotiations an ON an.event_id = e.id" +
  " AND an.deleted_at IS NULL AND an.status = 1" +
  " INNER JOIN advertisements a ON a.id = an.advertisement_id AND a.deleted_at IS NULL" +
  " WHERE e.deleted_at IS NULL AND e.status = 1" +
  " AND DATE(e.finish_date_event) = DATE_ADD(CURDATE(), INTERVAL 1 DAY)" +
  " GROUP BY evento_id, evento, fim_evento ORDER BY fim_evento", 2);

/* 10. TODOS os eventos C6 dos ultimos 30 dias, com veiculos por status da
   negociacao. Serve pra escolher QUAL edicao analisar: a de 09/09 fechou
   as 16h e a de 11/09 apareceu com zero em status 1. */
push('q_c6',
  "SELECT e.id AS evento_id, e.name AS evento, e.status AS ev_status," +
  " DATE_FORMAT(e.start_date_display, '%Y-%m-%d %H:%i') AS ini_display," +
  " DATE_FORMAT(e.finish_date_event, '%Y-%m-%d %H:%i') AS fim_evento," +
  " an.status AS neg_status," +
  " COUNT(DISTINCT a.vehicle_id) AS veiculos" +
  " FROM events e" +
  " LEFT JOIN advertisement_negotiations an ON an.event_id = e.id AND an.deleted_at IS NULL" +
  " LEFT JOIN advertisements a ON a.id = an.advertisement_id AND a.deleted_at IS NULL" +
  " WHERE e.deleted_at IS NULL AND e.name LIKE '%C6 Auto%'" +
  " AND e.finish_date_event >= DATE_SUB(NOW(), INTERVAL 30 DAY)" +
  " GROUP BY evento_id, evento, ev_status, ini_display, fim_evento, neg_status" +
  " ORDER BY fim_evento DESC, neg_status", 4);

/* 11. o value_actual esta preenchido? O Thomas escolheu ele como preco do
   veiculo; se vier nulo ou zero na maioria, o relatorio nasce cego. */
push('q_valor',
  "SELECT COUNT(*) AS negociacoes," +
  " SUM(CASE WHEN an.value_actual IS NULL THEN 1 ELSE 0 END) AS sem_valor," +
  " SUM(CASE WHEN an.value_actual = 0 THEN 1 ELSE 0 END) AS valor_zero," +
  " ROUND(MIN(NULLIF(an.value_actual, 0)), 2) AS minimo," +
  " ROUND(AVG(NULLIF(an.value_actual, 0)), 2) AS media," +
  " ROUND(MAX(an.value_actual), 2) AS maximo," +
  " ROUND(AVG(NULLIF(an.initial_price_reference, 0)), 2) AS media_inicial," +
  " ROUND(AVG(NULLIF(a.fipe_price, 0)), 2) AS media_fipe" +
  " FROM advertisement_negotiations an" +
  " INNER JOIN events e ON e.id = an.event_id AND e.deleted_at IS NULL" +
  " INNER JOIN advertisements a ON a.id = an.advertisement_id AND a.deleted_at IS NULL" +
  " WHERE an.deleted_at IS NULL AND e.name LIKE '%C6 Auto%'" +
  " AND e.finish_date_event >= DATE_SUB(NOW(), INTERVAL 30 DAY)", 1);

/* ═══ SONDA 2026-09-10: patio, link do anuncio e documentacao ═══════ */

/* 12-14. RIP information_schema: a sonda 50068 provou que o MCP bloqueia
   ("access to system schema is not allowed"). O contorno e `SELECT *` numa
   linha -- o cabecalho da resposta ENTREGA os nomes das colunas.

   A lista de tabelas e curta de proposito. `SELECT *` devolve valor, e em
   `vehicles`/`vehicle_extra_fields` isso e placa, chassi, renavam e
   documento do ultimo proprietario indo pra um dump em disco. Status de
   documentacao por negociacao moraria em advertisement_negotiations; o
   dominio do whitelabel, em whitelabels. Nenhuma das tres abaixo tem PII
   de pessoa fisica. */
push('q_cols_neg',
  "SELECT * FROM advertisement_negotiations WHERE deleted_at IS NULL" +
  " ORDER BY id DESC", 1);

push('q_cols_wl', "SELECT * FROM whitelabels ORDER BY id", 1);

push('q_cols_anuncio',
  "SELECT * FROM advertisements WHERE deleted_at IS NULL ORDER BY id DESC", 1);

/* ── o PATIO ────────────────────────────────────────────────────────── */
const JAN_NOVA =
  " e.deleted_at IS NULL AND e.finish_date_event >= '2026-09-09 00:00:00'";

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

/* Sem regex: este arquivo viaja pro n8n como string JSON escapada, e
   escapar barra invertida uma vez a mais gera "Invalid regular expression"
   e derruba o run (aconteceu na execucao 49963, no outro no). indexOf nao
   tem barra nenhuma. */
function temJanela(sql) {
  const u = String(sql).toUpperCase();
  return u.indexOf('OVER (') >= 0 || u.indexOf('OVER(') >= 0;
}
/* 20. o link precisa de QUATRO pedacos, nao de um. O padrao esta decidido
   desde 25/08 e conferido contra os exemplos do Gui (ver
   n8n-flows/lista-lm-propostas.md): 
   cars2you.com.br/anuncio/veiculo/{marca}/{modelo}/{versao}/{uuid}
   Sem um dos tres nomes o link nao pode ser entregue -- melhor sem botao
   que botao que cai em lugar nenhum. Isso mede quantos ficariam sem. */
push('q_link_partes',
  "SELECT COUNT(DISTINCT a.vehicle_id) AS veiculos," +
  " SUM(CASE WHEN TRIM(COALESCE(b.name, '')) = '' THEN 1 ELSE 0 END) AS sem_marca," +
  " SUM(CASE WHEN TRIM(COALESCE(m.name, '')) = '' THEN 1 ELSE 0 END) AS sem_modelo," +
  " SUM(CASE WHEN TRIM(COALESCE(ve.name, '')) = '' THEN 1 ELSE 0 END) AS sem_versao," +
  " SUM(CASE WHEN TRIM(COALESCE(a.uuid, '')) = '' THEN 1 ELSE 0 END) AS sem_uuid," +
  " SUM(CASE WHEN TRIM(COALESCE(b.name,'')) <> '' AND TRIM(COALESCE(m.name,'')) <> ''" +
  " AND TRIM(COALESCE(ve.name,'')) <> '' AND TRIM(COALESCE(a.uuid,'')) <> ''" +
  " THEN 1 ELSE 0 END) AS link_completo" +
  " FROM advertisement_negotiations an" +
  " INNER JOIN events e ON e.id = an.event_id AND" + JAN_NOVA +
  " INNER JOIN advertisements a ON a.id = an.advertisement_id AND a.deleted_at IS NULL" +
  " INNER JOIN vehicles v ON v.id = a.vehicle_id AND v.deleted_at IS NULL" +
  " LEFT JOIN brands b ON b.id = v.brand_id" +
  " LEFT JOIN models m ON m.id = v.model_id" +
  " LEFT JOIN versions ve ON ve.id = v.version_id" +
  " WHERE an.deleted_at IS NULL", 1);

const comJanela = Q.filter((q) => temJanela(q.sql));
if (comJanela.length) throw new Error('funcao de janela: o MCP rejeita');
if (PAGE > 50) throw new Error('PAGE > 50: o MCP corta em 50 linhas');

return Q.map((q, i) => ({
  json: { queryName: q.queryName, database: q.database, sql: q.sql, pagina: q.pagina, idx: i, total: Q.length, page: PAGE }
}));
