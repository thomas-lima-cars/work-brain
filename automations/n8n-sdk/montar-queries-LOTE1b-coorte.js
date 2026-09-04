const now = new Date();
const ANO = now.getFullYear();
const pad = (n) => String(n).padStart(2,'0');
const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
const MES_INICIO = start.getFullYear() + '-' + pad(start.getMonth()+1);
const fimExcl = new Date(now.getFullYear(), now.getMonth() + 1, 1);
const MES_FIM_EXCLUSIVO = fimExcl.getFullYear() + '-' + pad(fimExcl.getMonth()+1);
const startRX = new Date(now.getFullYear(), now.getMonth() - 11, 1);
const MES_INICIO_RX = startRX.getFullYear() + '-' + pad(startRX.getMonth()+1);
const hoje = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const hojeMenos29 = new Date(hoje); hojeMenos29.setDate(hoje.getDate()-29);
const amanha = new Date(hoje); amanha.setDate(hoje.getDate()+1);
const fmtDate = (d) => d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const HOJE_MENOS_29D = fmtDate(hojeMenos29);
const AMANHA = fmtDate(amanha);

/* MULTI-WL: aqui havia um INNER JOIN em user_whitelabels preso ao WL 43.
   O EXISTS troca o join por teste de existencia — sem ele, quem esta
   em varios whitelabels apareceria N vezes e o COUNT(*) do kpi
   contaria repetido (user_whitelabels e N:N). */
const BASE = "SELECT u.id as user_id FROM users u WHERE u.deleted_at IS NULL AND u.internal_user = 0 AND u.email NOT REGEXP '(@cars2you|@datapage|@icarros|@itau|@teste|@dnr[.]com[.]br|@maisquecliente|@dealersclub|@c6bank[.]com)' AND EXISTS(SELECT 1 FROM user_whitelabels uw0 WHERE uw0.user_id = u.id)";

const UF_CASE = "CASE WHEN UPPER(TRIM(sa.state)) IN ('SP','MG','PR','SC','RJ','GO','RS','BA','MT','DF','CE','MS','ES','PE','PA','SE','AM','MA','RN','PB','AL','PI','RO','TO','AP','AC','RR') THEN UPPER(TRIM(sa.state)) WHEN UPPER(TRIM(sa.state)) = 'S.P' THEN 'SP' WHEN UPPER(TRIM(sa.state)) = 'RIO DE JANEIRO' THEN 'RJ' WHEN UPPER(TRIM(sa.state)) = 'MATO GROSSO DO SUL' THEN 'MS' WHEN UPPER(TRIM(sa.state)) LIKE 'ESPIRITO%SANTO%' THEN 'ES' ELSE NULL END";

const Q = [];

Q.push({ queryName: 'recencia', database: 'cars2you_production', sql:
  "SELECT 'login' as tipo, faixa, qtd FROM (SELECT CASE WHEN DATEDIFF(NOW(), ul) BETWEEN 0 AND 30 THEN '00-30d' WHEN DATEDIFF(NOW(), ul) BETWEEN 31 AND 90 THEN '31-90d' WHEN DATEDIFF(NOW(), ul) BETWEEN 91 AND 180 THEN '91-180d' ELSE '180d+' END as faixa, COUNT(*) as qtd FROM (SELECT ua.user_id, MAX(ua.created_at) as ul FROM user_access ua WHERE ua.user_id IN (SELECT user_id FROM (" + BASE + ") bb) GROUP BY ua.user_id) t GROUP BY faixa) rl " +
  "UNION ALL " +
  "SELECT 'oferta' as tipo, faixa, qtd FROM (SELECT CASE WHEN DATEDIFF(NOW(), ul) BETWEEN 0 AND 30 THEN '00-30d' WHEN DATEDIFF(NOW(), ul) BETWEEN 31 AND 90 THEN '31-90d' WHEN DATEDIFF(NOW(), ul) BETWEEN 91 AND 180 THEN '91-180d' ELSE '180d+' END as faixa, COUNT(*) as qtd FROM (SELECT o.buyer_user_id, MAX(o.created_at) as ul FROM offers o WHERE o.deleted_at IS NULL AND o.buyer_user_id IN (SELECT user_id FROM (" + BASE + ") bb) GROUP BY o.buyer_user_id) t GROUP BY faixa) ro " +
  "UNION ALL " +
  "SELECT 'compra' as tipo, faixa, qtd FROM (SELECT CASE WHEN DATEDIFF(NOW(), ul) BETWEEN 0 AND 30 THEN '00-30d' WHEN DATEDIFF(NOW(), ul) BETWEEN 31 AND 90 THEN '31-90d' WHEN DATEDIFF(NOW(), ul) BETWEEN 91 AND 180 THEN '91-180d' ELSE '180d+' END as faixa, COUNT(*) as qtd FROM (SELECT o.buyer_user_id, MAX(an.finish_date_offer) as ul FROM advertisement_negotiations an INNER JOIN offers o ON o.id=an.offer_actual_id INNER JOIN advertisements a ON a.id=an.advertisement_id WHERE an.status IN (2,3,7) AND o.buyer_user_id IN (SELECT user_id FROM (" + BASE + ") bb) GROUP BY o.buyer_user_id) t GROUP BY faixa) rc"
});

Q.push({ queryName: 'evol_login', database: 'cars2you_production', sql:
  "SELECT DATE_FORMAT(ua.created_at,'%Y-%m') as mes, COUNT(DISTINCT ua.user_id) as unicos FROM user_access ua WHERE ua.user_id IN (SELECT user_id FROM (" + BASE + ") bb) AND ua.created_at >= '" + MES_INICIO + "-01' GROUP BY mes ORDER BY mes"
});

Q.push({ queryName: 'evol_oferta', database: 'cars2you_production', sql:
  "SELECT DATE_FORMAT(o.created_at,'%Y-%m') as mes, COUNT(DISTINCT o.buyer_user_id) as unicos FROM offers o WHERE o.deleted_at IS NULL AND o.buyer_user_id IN (SELECT user_id FROM (" + BASE + ") bb) AND o.created_at >= '" + MES_INICIO + "-01' AND o.created_at < '" + MES_FIM_EXCLUSIVO + "-01' GROUP BY mes ORDER BY mes"
});

Q.push({ queryName: 'evol_compra', database: 'cars2you_production', sql:
  "SELECT DATE_FORMAT(an.finish_date_offer,'%Y-%m') as mes, COUNT(DISTINCT o.buyer_user_id) as unicos, SUM(o.price) as volume FROM advertisement_negotiations an INNER JOIN offers o ON o.id=an.offer_actual_id INNER JOIN advertisements a ON a.id=an.advertisement_id WHERE an.status IN (2,3,7) AND o.buyer_user_id IN (SELECT user_id FROM (" + BASE + ") bb) AND an.finish_date_offer >= '" + MES_INICIO + "-01' AND an.finish_date_offer < '" + MES_FIM_EXCLUSIVO + "-01' GROUP BY mes ORDER BY mes"
});

Q.push({ queryName: 'evol_cadastro', database: 'cars2you_production', sql:
  "SELECT DATE_FORMAT(u.created_at,'%Y-%m') as mes, COUNT(*) as novos FROM users u WHERE u.id IN (SELECT user_id FROM (" + BASE + ") bb) AND u.created_at >= '" + MES_INICIO + "-01' AND u.created_at < '" + MES_FIM_EXCLUSIVO + "-01' GROUP BY mes ORDER BY mes"
});

Q.push({ queryName: 'evol_cadastro_dia', database: 'cars2you_production', sql:
  "SELECT DATE(u.created_at) as dia, COUNT(*) as novos FROM users u WHERE u.id IN (SELECT user_id FROM (" + BASE + ") bb) AND u.created_at >= '" + HOJE_MENOS_29D + "' AND u.created_at < '" + AMANHA + "' GROUP BY dia ORDER BY dia"
});

Q.push({ queryName: 'evol_media_oferta', database: 'cars2you_production', sql:
  "SELECT DATE_FORMAT(an.finish_date_offer,'%Y-%m') as mes, COUNT(DISTINCT a.vehicle_id) as anuncios_publicados, COUNT(DISTINCT a.id) as anuncios_criados, COUNT(o.id) as total_ofertas_recebidas, COUNT(DISTINCT CASE WHEN an.status IN (2,3,7) THEN a.vehicle_id END) as veiculos_vendidos, ROUND(COUNT(o.id)/COUNT(DISTINCT a.vehicle_id), 2) as media_ofertas_por_anuncio, ROUND(COUNT(DISTINCT a.id)/COUNT(DISTINCT a.vehicle_id), 2) as media_publicacoes_por_veiculo FROM advertisements a INNER JOIN shops s ON s.id = a.shop_id INNER JOIN advertisement_negotiations an ON an.advertisement_id = a.id LEFT JOIN offers o ON o.advertisement_id = a.id AND o.deleted_at IS NULL WHERE an.finish_date_offer >= '" + MES_INICIO + "-01' AND an.finish_date_offer < '" + MES_FIM_EXCLUSIVO + "-01' AND an.status <> 10 GROUP BY mes ORDER BY mes"
});

const SQL_TOP_HIST =
  "SELECT u.id, u.full_name, COUNT(DISTINCT an.id) as compras, SUM(o.price) as volume, MAX(an.finish_date_offer) as ultima_compra FROM advertisement_negotiations an INNER JOIN offers o ON o.id=an.offer_actual_id INNER JOIN advertisements a ON a.id=an.advertisement_id INNER JOIN users u ON u.id=o.buyer_user_id WHERE an.status IN (2,3,7) AND o.buyer_user_id IN (SELECT user_id FROM (" + BASE + ") bb) GROUP BY u.id, u.full_name ORDER BY compras DESC LIMIT 10";
Q.push({ queryName: 'top_compradores_hist', database: 'cars2you_production', sql: SQL_TOP_HIST });

const SQL_TOP_ANO =
  "SELECT u.id, u.full_name, COUNT(DISTINCT an.id) as compras, SUM(o.price) as volume, MAX(an.finish_date_offer) as ultima_compra FROM advertisement_negotiations an INNER JOIN offers o ON o.id=an.offer_actual_id INNER JOIN advertisements a ON a.id=an.advertisement_id INNER JOIN users u ON u.id=o.buyer_user_id WHERE an.status IN (2,3,7) AND o.buyer_user_id IN (SELECT user_id FROM (" + BASE + ") bb) AND an.finish_date_offer >= '" + ANO + "-01-01' GROUP BY u.id, u.full_name ORDER BY compras DESC LIMIT 10";
Q.push({ queryName: 'top_compradores_ano', database: 'cars2you_production', sql: SQL_TOP_ANO });

const SQL_TOP_ACESSO =
  "SELECT u.id, u.full_name, COUNT(DISTINCT DATE(ua.created_at)) as dias_ativos, COUNT(ua.id) as acessos_totais FROM user_access ua INNER JOIN users u ON u.id=ua.user_id WHERE ua.user_id IN (SELECT user_id FROM (" + BASE + ") bb) AND ua.created_at >= '" + ANO + "-01-01' GROUP BY u.id, u.full_name ORDER BY dias_ativos DESC LIMIT 10";
Q.push({ queryName: 'top_acesso_ano', database: 'cars2you_production', sql: SQL_TOP_ACESSO });

const SQL_TOP_OFERTAS =
  "SELECT u.id, u.full_name, COUNT(*) as ofertas FROM offers o INNER JOIN users u ON u.id=o.buyer_user_id WHERE o.deleted_at IS NULL AND o.created_at >= '" + ANO + "-01-01' AND o.buyer_user_id IN (SELECT user_id FROM (" + BASE + ") bb) GROUP BY u.id, u.full_name ORDER BY ofertas DESC LIMIT 10";
Q.push({ queryName: 'top_ofertas_ano', database: 'cars2you_production', sql: SQL_TOP_OFERTAS });

/* [BC-17] Loja + CNPJ dos usuarios que aparecem em qualquer um dos 4 Top 10.
   Subtitulo do nome nas tabelas de ranking (ver preenchimento.md 7) - nao entra
   em nenhum KPI. Os ids dos Top 10 so existem depois das queries rodarem, entao
   aqui a lista de ids vem das PROPRIAS 4 queries de ranking, reaproveitadas como
   subquery (LIMIT dentro de subquery so e permitido em tabela derivada - por isso
   o UNION esta envolvido em (...) uu). Maximo de 40 usuarios distintos; uma pagina
   de 50 cobre, com folga para quem tem mais de uma loja vinculada. */
Q.push({ queryName: 'top_lojas', database: 'cars2you_production', sql:
  "SELECT us.user_id, s.name AS loja, s.cnpj FROM user_shops us INNER JOIN shops s ON s.id = us.shop_id WHERE us.user_id IN (SELECT uid FROM (" +
  "SELECT id AS uid FROM (" + SQL_TOP_HIST + ") t1 UNION SELECT id AS uid FROM (" + SQL_TOP_ANO + ") t2 UNION SELECT id AS uid FROM (" + SQL_TOP_ACESSO + ") t3 UNION SELECT id AS uid FROM (" + SQL_TOP_OFERTAS + ") t4" +
  ") uu) ORDER BY us.user_id, us.created_at LIMIT 50"
});

/* [BC-25/26/27] Novos vs. recorrentes por mes (acesso, oferta, compra).
   'Novo' = o mes e o mes da PRIMEIRA ocorrencia do cliente na historia inteira.
   Por isso a subquery f (primeiro_mes) NAO leva filtro de data - se levar, todo
   cliente ativo no primeiro mes da janela vira 'novo' e o grafico passa a medir o
   comeco da janela, nao o comeco da vida do cliente. O filtro de data de m e
   identico ao de evol_login / evol_oferta / evol_compra, para os totais fecharem:
   novos + recorrentes = unicos do mesmo mes. */
const NR_SELECT = "SELECT m.mes, SUM(CASE WHEN m.mes = f.primeiro_mes THEN 1 ELSE 0 END) as novos, SUM(CASE WHEN m.mes > f.primeiro_mes THEN 1 ELSE 0 END) as recorrentes FROM ";
const NR_FIM = " f ON f.uid = m.uid GROUP BY m.mes ORDER BY m.mes";

Q.push({ queryName: 'nr_login', database: 'cars2you_production', sql:
  NR_SELECT +
  "(SELECT ua.user_id as uid, DATE_FORMAT(ua.created_at,'%Y-%m') as mes FROM user_access ua WHERE ua.user_id IN (SELECT user_id FROM (" + BASE + ") bb) AND ua.created_at >= '" + MES_INICIO + "-01' GROUP BY ua.user_id, mes) m INNER JOIN " +
  "(SELECT ua.user_id as uid, DATE_FORMAT(MIN(ua.created_at),'%Y-%m') as primeiro_mes FROM user_access ua WHERE ua.user_id IN (SELECT user_id FROM (" + BASE + ") bb) GROUP BY ua.user_id)" + NR_FIM
});

Q.push({ queryName: 'nr_oferta', database: 'cars2you_production', sql:
  NR_SELECT +
  "(SELECT o.buyer_user_id as uid, DATE_FORMAT(o.created_at,'%Y-%m') as mes FROM offers o WHERE o.deleted_at IS NULL AND o.buyer_user_id IN (SELECT user_id FROM (" + BASE + ") bb) AND o.created_at >= '" + MES_INICIO + "-01' AND o.created_at < '" + MES_FIM_EXCLUSIVO + "-01' GROUP BY o.buyer_user_id, mes) m INNER JOIN " +
  "(SELECT o.buyer_user_id as uid, DATE_FORMAT(MIN(o.created_at),'%Y-%m') as primeiro_mes FROM offers o WHERE o.deleted_at IS NULL AND o.buyer_user_id IN (SELECT user_id FROM (" + BASE + ") bb) GROUP BY o.buyer_user_id)" + NR_FIM
});

Q.push({ queryName: 'nr_compra', database: 'cars2you_production', sql:
  NR_SELECT +
  "(SELECT o.buyer_user_id as uid, DATE_FORMAT(an.finish_date_offer,'%Y-%m') as mes FROM advertisement_negotiations an INNER JOIN offers o ON o.id=an.offer_actual_id INNER JOIN advertisements a ON a.id=an.advertisement_id WHERE an.status IN (2,3,7) AND o.buyer_user_id IN (SELECT user_id FROM (" + BASE + ") bb) AND an.finish_date_offer >= '" + MES_INICIO + "-01' AND an.finish_date_offer < '" + MES_FIM_EXCLUSIVO + "-01' GROUP BY o.buyer_user_id, mes) m INNER JOIN " +
  "(SELECT o.buyer_user_id as uid, DATE_FORMAT(MIN(an.finish_date_offer),'%Y-%m') as primeiro_mes FROM advertisement_negotiations an INNER JOIN offers o ON o.id=an.offer_actual_id INNER JOIN advertisements a ON a.id=an.advertisement_id WHERE an.status IN (2,3,7) AND o.buyer_user_id IN (SELECT user_id FROM (" + BASE + ") bb) GROUP BY o.buyer_user_id)" + NR_FIM
});

Q.push({ queryName: 'uf_cadastro', database: 'cars2you_production', sql:
  "SELECT COALESCE(ufn.uf_norm, 'Não identificada') as uf, COUNT(DISTINCT b.user_id) as qtd FROM (" + BASE + ") b LEFT JOIN (SELECT DISTINCT us.user_id, " + UF_CASE + " as uf_norm FROM user_shops us INNER JOIN shop_addresses sa ON sa.shop_id = us.shop_id AND sa.deleted_at IS NULL) ufn ON ufn.user_id = b.user_id AND ufn.uf_norm IS NOT NULL GROUP BY uf ORDER BY qtd DESC"
});

Q.push({ queryName: 'uf_compra', database: 'cars2you_production', sql:
  "SELECT COALESCE(ufn2.uf_norm, 'Não identificada') as uf, COUNT(DISTINCT an.id) as compras, SUM(o.price) as volume FROM advertisement_negotiations an INNER JOIN offers o ON o.id=an.offer_actual_id INNER JOIN advertisements a ON a.id=an.advertisement_id LEFT JOIN (SELECT s.id as shop_id, " + UF_CASE + " as uf_norm FROM shops s INNER JOIN shop_addresses sa ON sa.shop_id = s.id AND sa.deleted_at IS NULL) ufn2 ON ufn2.shop_id = o.buyer_shop_id WHERE an.status IN (2,3,7) AND o.buyer_user_id IN (SELECT user_id FROM (" + BASE + ") bb) GROUP BY uf ORDER BY compras DESC"
});

/* ══════════════════════════════════════════════════════════════════
   QUERIES DO RAIO-X — PAGINADAS. O servidor MCP limita cada chamada de
   run_query a um número máximo de linhas, e o nó "MCP Run" faz UMA
   chamada por item, sem lógica de paginação.
   Como estas 7 queries agregam por (comprador, mês[, dimensão]) e podem
   passar de centenas de linhas, cada uma aqui vira N itens paginados
   (mesmo queryName, LIMIT/OFFSET diferentes) — "Montar HTML" concatena
   depois pelo nome. ORDER BY é obrigatório para paginação estável
   (sem ele o MySQL não garante a mesma ordem entre chamadas).
   O corte real do servidor é de 50 linhas por chamada (confirmado: todos os
   arrays RX do anexo vinham com exatamente 50 linhas), então RX_PAGE tem de
   ser 50 — usar um LIMIT maior faz o servidor truncar dentro da página e as
   linhas entre o corte e o próximo OFFSET somem silenciosamente.
   Janela ampliada para 12 meses em 27/08/2026 (era 6). Linhas reais
   (12 meses, medido em 27/08/2026): rx_totais 748, rx_modelo 1779,
   rx_laudo 1022, rx_uf 1376, rx_faixa 1106, rx_partic 1355, rx_buyers 185.
   As páginas abaixo dão ~1,5x de margem — se a base crescer, aumentar.
   Total de 234 chamadas ao MCP (rx_buyers subiu de 6 para 10 páginas em
   28/08/2026, quando passou a trazer loja + CNPJ); em 6 meses eram 108,
   com execução de ~56s.
   rx_partic mantém o join com advertisement_negotiations de propósito:
   a unidade contada ali é a negociação (participação), não a oferta —
   um advs_negotiation_id órfão não é participação real. Ver regra § 3.
   ══════════════════════════════════════════════════════════════════ */
const RX_PAGE = 50;
function pushPaged(name, sqlNoLimit, pages){
  for (let i = 0; i < pages; i++){
    Q.push({ queryName: name, database: 'cars2you_production', sql: sqlNoLimit + " LIMIT " + RX_PAGE + " OFFSET " + (i*RX_PAGE) });
  }
}

/* ══════════════════════════════════════════════════════════════════
   COORTE — substitui kpi e situacao (lote 1b, 2026-09-03).
   O kpi original fazia 10 subqueries independentes, cada uma varrendo a
   BASE inteira; com a plataforma toda (29.002 clientes) estourou o
   deadline do MCP na execucao 48410. Esta resolve em UMA passada.
   As safras sao particoes disjuntas (cada cliente tem 1 mes de cadastro),
   entao somar os meses reproduz os totais — e o mesmo raciocinio permite
   filtrar por ano/mes no cliente sem consultar o banco de novo.
   Fragmentos verbatim do HANDOFF-PROTOTIPO-SAFRA.md secao 8.1; o schema
   confere com dados/coorte_all.json, que esta query gerou.
   ══════════════════════════════════════════════════════════════════ */
const BASEF = "u.deleted_at IS NULL AND u.internal_user = 0 AND u.email NOT REGEXP '(@cars2you|@datapage|@icarros|@itau|@teste|@dnr[.]com[.]br|@maisquecliente|@dealersclub|@c6bank[.]com)' AND EXISTS(SELECT 1 FROM user_whitelabels uw0 WHERE uw0.user_id = u.id)";

const BEXT = "SELECT u.id uid, u.situation sit, DATE_FORMAT(u.created_at,'%Y-%m') ym," +
  " EXISTS(SELECT 1 FROM user_access ua WHERE ua.user_id = u.id) has_login," +
  " EXISTS(SELECT 1 FROM offers o WHERE o.deleted_at IS NULL AND o.buyer_user_id = u.id) has_offer" +
  " FROM users u WHERE " + BASEF;

const PC = "SELECT o.buyer_user_id uid, COUNT(DISTINCT an.id) neg," +
  " COUNT(DISTINCT CASE WHEN an.status = 7 THEN an.id END) neg7," +
  " SUM(o.price) vol, MAX(an.finish_date_offer) ult" +
  " FROM advertisement_negotiations an" +
  " INNER JOIN offers o ON o.id = an.offer_actual_id" +
  " INNER JOIN advertisements a ON a.id = an.advertisement_id" +
  " WHERE an.status IN (2,3,7) GROUP BY o.buyer_user_id";

const METRICS = "COUNT(*) total, SUM(b.has_login) com_login, SUM(b.has_login = 0) sem_login," +
  " SUM(b.has_offer) ofertantes, SUM(pc.neg > 0) compradores," +
  " COALESCE(SUM(pc.neg),0) negociacoes, COALESCE(SUM(pc.neg7),0) vendido," +
  " COALESCE(SUM(pc.vol),0) volume, MAX(pc.ult) ultima_compra," +
  " SUM(b.sit = 1) s1, SUM(b.sit = 2) s2, SUM(b.sit = 3) s3," +
  " SUM(b.sit = 4) s4, SUM(b.sit = 5) s5, SUM(b.sit = 6) s6";

pushPaged('coorte',
  "SELECT b.ym, " + METRICS +
  " FROM (" + BEXT + ") b" +
  " LEFT JOIN (" + PC + ") pc ON pc.uid = b.uid" +
  " GROUP BY b.ym ORDER BY b.ym",
  3);


pushPaged('rx_totais',
  "SELECT o.buyer_user_id, DATE_FORMAT(an.finish_date_offer,'%Y-%m') as ym, COUNT(*) as compras, SUM(o.price) as volume, SUM(CASE WHEN a.fipe_price>0 THEN o.price ELSE 0 END) as price_fipe_sum, SUM(CASE WHEN a.fipe_price>0 THEN a.fipe_price ELSE 0 END) as fipe_sum, SUM(CASE WHEN a.molicar_price>0 THEN o.price ELSE 0 END) as price_molicar_sum, SUM(CASE WHEN a.molicar_price>0 THEN a.molicar_price ELSE 0 END) as molicar_sum FROM advertisement_negotiations an INNER JOIN offers o ON o.id = an.offer_actual_id INNER JOIN advertisements a ON a.id = an.advertisement_id WHERE an.status IN (2,3,7) AND o.buyer_user_id IN (SELECT user_id FROM (" + BASE + ") bb) AND an.finish_date_offer >= '" + MES_INICIO_RX + "-01' AND an.finish_date_offer < '" + MES_FIM_EXCLUSIVO + "-01' GROUP BY o.buyer_user_id, ym ORDER BY o.buyer_user_id, ym",
  140);

pushPaged('rx_modelo',
  "SELECT o.buyer_user_id, DATE_FORMAT(an.finish_date_offer,'%Y-%m') as ym, COALESCE(m.name,'Não informado') as modelo, COUNT(*) as qtd FROM advertisement_negotiations an INNER JOIN offers o ON o.id = an.offer_actual_id INNER JOIN advertisements a ON a.id = an.advertisement_id INNER JOIN vehicles v ON v.id = a.vehicle_id LEFT JOIN models m ON m.id = v.model_id WHERE an.status IN (2,3,7) AND o.buyer_user_id IN (SELECT user_id FROM (" + BASE + ") bb) AND an.finish_date_offer >= '" + MES_INICIO_RX + "-01' AND an.finish_date_offer < '" + MES_FIM_EXCLUSIVO + "-01' GROUP BY o.buyer_user_id, ym, modelo ORDER BY o.buyer_user_id, ym, modelo",
  320);

pushPaged('rx_laudo',
  "SELECT o.buyer_user_id, DATE_FORMAT(an.finish_date_offer,'%Y-%m') as ym, COALESCE(vpr.situation,'sem_registro') as laudo, COUNT(*) as qtd FROM advertisement_negotiations an INNER JOIN offers o ON o.id = an.offer_actual_id INNER JOIN advertisements a ON a.id = an.advertisement_id LEFT JOIN vehicle_precautionary_reports vpr ON vpr.vehicle_id = a.vehicle_id AND vpr.deleted_at IS NULL WHERE an.status IN (2,3,7) AND o.buyer_user_id IN (SELECT user_id FROM (" + BASE + ") bb) AND an.finish_date_offer >= '" + MES_INICIO_RX + "-01' AND an.finish_date_offer < '" + MES_FIM_EXCLUSIVO + "-01' GROUP BY o.buyer_user_id, ym, laudo ORDER BY o.buyer_user_id, ym, laudo",
  190);

pushPaged('rx_uf',
  "SELECT o.buyer_user_id, DATE_FORMAT(an.finish_date_offer,'%Y-%m') as ym, COALESCE(ss.state,'ND') as uf, COUNT(*) as qtd FROM advertisement_negotiations an INNER JOIN offers o ON o.id = an.offer_actual_id INNER JOIN advertisements a ON a.id = an.advertisement_id LEFT JOIN shop_stocks ss ON ss.id = a.shop_stock_id WHERE an.status IN (2,3,7) AND o.buyer_user_id IN (SELECT user_id FROM (" + BASE + ") bb) AND an.finish_date_offer >= '" + MES_INICIO_RX + "-01' AND an.finish_date_offer < '" + MES_FIM_EXCLUSIVO + "-01' GROUP BY o.buyer_user_id, ym, uf ORDER BY o.buyer_user_id, ym, uf",
  250);

pushPaged('rx_faixa',
  "SELECT o.buyer_user_id, DATE_FORMAT(an.finish_date_offer,'%Y-%m') as ym, CASE WHEN o.price < 25000 THEN 'Até R$ 25 mil' WHEN o.price < 50000 THEN 'R$ 25-50 mil' WHEN o.price < 100000 THEN 'R$ 50-100 mil' WHEN o.price < 200000 THEN 'R$ 100-200 mil' ELSE 'Acima de R$ 200 mil' END as faixa, COUNT(*) as qtd FROM advertisement_negotiations an INNER JOIN offers o ON o.id = an.offer_actual_id INNER JOIN advertisements a ON a.id = an.advertisement_id WHERE an.status IN (2,3,7) AND o.buyer_user_id IN (SELECT user_id FROM (" + BASE + ") bb) AND an.finish_date_offer >= '" + MES_INICIO_RX + "-01' AND an.finish_date_offer < '" + MES_FIM_EXCLUSIVO + "-01' GROUP BY o.buyer_user_id, ym, faixa ORDER BY o.buyer_user_id, ym, faixa",
  210);

pushPaged('rx_partic',
  "SELECT buyer_user_id, ym, COUNT(*) as participacoes FROM (SELECT o.buyer_user_id, DATE_FORMAT(MIN(o.created_at),'%Y-%m') as ym, o.advs_negotiation_id as neg_id FROM offers o INNER JOIN advertisement_negotiations an ON an.id = o.advs_negotiation_id INNER JOIN advertisements a ON a.id = an.advertisement_id WHERE o.deleted_at IS NULL AND o.buyer_user_id IN (SELECT user_id FROM (" + BASE + ") bb) AND o.created_at >= '" + MES_INICIO_RX + "-01' AND o.created_at < '" + MES_FIM_EXCLUSIVO + "-01' GROUP BY o.buyer_user_id, o.advs_negotiation_id) t GROUP BY buyer_user_id, ym ORDER BY buyer_user_id, ym",
  250);

/* [BC-17b] rx_buyers agora traz tambem loja + CNPJ (LEFT JOIN user_shops -> shops),
   para o Raio-X mostrar o mesmo subtitulo dos Top 10. Por causa do LEFT JOIN o numero
   de linhas pode passar o numero de compradores (usuario com mais de uma loja), entao
   as paginas subiram de 6 para 10 (500 linhas de teto, contra 185 compradores medidos
   em 27/08/2026). O colapso por u.id acontece no no 'Montar HTML', depois de paginar
   tudo - nunca antes. */
pushPaged('rx_buyers',
  "SELECT u.id, u.full_name, s.name AS loja, s.cnpj FROM users u LEFT JOIN user_shops us ON us.user_id = u.id LEFT JOIN shops s ON s.id = us.shop_id WHERE u.id IN (SELECT DISTINCT o.buyer_user_id FROM advertisement_negotiations an INNER JOIN offers o ON o.id = an.offer_actual_id WHERE an.status IN (2,3,7) AND o.buyer_user_id IN (SELECT user_id FROM (" + BASE + ") bb) AND an.finish_date_offer >= '" + MES_INICIO_RX + "-01' AND an.finish_date_offer < '" + MES_FIM_EXCLUSIVO + "-01') ORDER BY u.id, us.created_at",
  60);

/* A coorte vai PRIMEIRO na fila. Se uma query pesada estourar o deadline do
   MCP no meio, o no inteiro falha e nada e devolvido (foi o que aconteceu na
   execucao 48410). Com a coorte na frente, o dado de verificacao ja esta
   colhido antes de qualquer risco. */
const Q_ORD = Q.filter(function(q){ return q.queryName === 'coorte'; })
  .concat(Q.filter(function(q){ return q.queryName !== 'coorte'; }));

return Q_ORD.map(function(q){ return { json: q }; });