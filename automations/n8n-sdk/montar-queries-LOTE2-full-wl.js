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
const BASE = "SELECT u.id as user_id FROM users u WHERE u.deleted_at IS NULL AND u.internal_user = 0 AND u.email NOT REGEXP '(@cars2you|@datapage|@icarros|@itau|@teste|@dnr[.]com[.]br|@maisquecliente|@dealersclub|@c6bank[.]com)' AND EXISTS(SELECT 1 FROM user_whitelabels uw0 WHERE uw0.user_id = u.id AND uw0.whitelabel_id IN (43, 48, 62, 65, 7, 4))";

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
const BASEF = "u.deleted_at IS NULL AND u.internal_user = 0 AND u.email NOT REGEXP '(@cars2you|@datapage|@icarros|@itau|@teste|@dnr[.]com[.]br|@maisquecliente|@dealersclub|@c6bank[.]com)' AND EXISTS(SELECT 1 FROM user_whitelabels uw0 WHERE uw0.user_id = u.id AND uw0.whitelabel_id IN (43, 48, 62, 65, 7, 4))";

const BEXT = "SELECT u.id uid, u.situation sit, DATE_FORMAT(u.created_at,'%Y-%m') ym," +
  " EXISTS(SELECT 1 FROM user_access ua WHERE ua.user_id = u.id) has_login," +
  " EXISTS(SELECT 1 FROM offers o WHERE o.deleted_at IS NULL AND o.buyer_user_id = u.id) has_offer" +
  " FROM users u WHERE " + BASEF;

const PC = "SELECT o.buyer_user_id uid, COUNT(DISTINCT an.id) neg," +
  " COUNT(DISTINCT CASE WHEN an.status = 7 THEN an.id END) neg7," +
  " COUNT(DISTINCT CASE WHEN an.status = 2 THEN an.id END) neg2," +
  " SUM(o.price) vol, MAX(an.finish_date_offer) ult" +
  " FROM advertisement_negotiations an" +
  " INNER JOIN offers o ON o.id = an.offer_actual_id" +
  " INNER JOIN advertisements a ON a.id = an.advertisement_id" +
  " WHERE an.status IN (2,3,7) GROUP BY o.buyer_user_id";

const METRICS = "COUNT(*) total, SUM(b.has_login) com_login, SUM(b.has_login = 0) sem_login," +
  " SUM(b.has_offer) ofertantes, SUM(pc.neg > 0) compradores," +
  " COALESCE(SUM(pc.neg),0) negociacoes, COALESCE(SUM(pc.neg7),0) vendido," +
  " COALESCE(SUM(pc.neg2),0) status2," +
  " COALESCE(SUM(pc.vol),0) volume, MAX(pc.ult) ultima_compra," +
  " SUM(b.sit = 1) s1, SUM(b.sit = 2) s2, SUM(b.sit = 3) s3," +
  " SUM(b.sit = 4) s4, SUM(b.sit = 5) s5, SUM(b.sit = 6) s6";

pushPaged('coorte',
  "SELECT b.ym, " + METRICS +
  " FROM (" + BEXT + ") b" +
  " LEFT JOIN (" + PC + ") pc ON pc.uid = b.uid" +
  " GROUP BY b.ym ORDER BY b.ym",
  3);

/* [lote 1d] total_ofertas — o unico KPI que nao sai da coorte (contagem
   bruta de ofertas, nao de compradores). A versao original usava
   `IN (SELECT user_id FROM (BASE) bb)`, que na escala da plataforma
   estourou o deadline do MCP (execucao 48429). Trocado por INNER JOIN.
   EQUIVALENCIA: BASE devolve 1 linha por usuario, entao o join nao
   duplica oferta nenhuma — mesmo COUNT, plano de execucao diferente. */
pushPaged('kpi_ofertas',
  "SELECT COUNT(*) as total_ofertas FROM offers o" +
  " INNER JOIN (" + BASE + ") bb ON bb.user_id = o.buyer_user_id" +
  " WHERE o.deleted_at IS NULL",
  1);

/* [lote 1f] COORTE POR WHITELABEL — fatiada por ANO DE CADASTRO.
   E o que faz o seletor de whitelabel funcionar.

   A versao com LIMIT/OFFSET sobre o universo inteiro estourou o deadline do
   MCP (execucao 48476, 67s): cada pagina recalculava os 29.010 usuarios do
   BEXT — dois EXISTS cada — pra descartar 50 linhas.

   Aqui o recorte de ano entra DENTRO do BEXT, como filtro em u.created_at,
   que e indexado. Cada consulta monta um BEXT de ~1/7 do tamanho. Medido no
   coorte_wl.json do prototipo: maior fatia = 6.797 usuarios / 92 linhas.

   Fatiar por faixa de whitelabel_id foi descartado: os WLs grandes se
   concentram nos ids baixos (a faixa 1-10 tem 59% das linhas) e o filtro so
   agiria depois do BEXT montado — nao economiza o que custa. */
const ANO_INI_WL = 2019;
for (let ano = ANO_INI_WL; ano <= ANO; ano++) {
  const bextAno = BEXT + " AND u.created_at >= '" + ano + "-01-01'" +
    " AND u.created_at < '" + (ano + 1) + "-01-01'";
  pushPaged('coorte_wl',
    "SELECT uw.whitelabel_id wl, w.name wl_name, b.ym, " + METRICS +
    " FROM (" + bextAno + ") b" +
    " INNER JOIN user_whitelabels uw ON uw.user_id = b.uid" +
    " INNER JOIN whitelabels w ON w.id = uw.whitelabel_id" +
    " LEFT JOIN (" + PC + ") pc ON pc.uid = b.uid" +
    " GROUP BY uw.whitelabel_id, w.name, b.ym ORDER BY uw.whitelabel_id, b.ym",
    3);
}




pushPaged('rx_totais',
  "SELECT o.buyer_user_id, DATE_FORMAT(an.finish_date_offer,'%Y-%m') as ym, COUNT(*) as compras, SUM(o.price) as volume, SUM(CASE WHEN a.fipe_price>0 THEN o.price ELSE 0 END) as price_fipe_sum, SUM(CASE WHEN a.fipe_price>0 THEN a.fipe_price ELSE 0 END) as fipe_sum, SUM(CASE WHEN a.molicar_price>0 THEN o.price ELSE 0 END) as price_molicar_sum, SUM(CASE WHEN a.molicar_price>0 THEN a.molicar_price ELSE 0 END) as molicar_sum FROM advertisement_negotiations an INNER JOIN offers o ON o.id = an.offer_actual_id INNER JOIN advertisements a ON a.id = an.advertisement_id WHERE an.status IN (2,3,7) AND o.buyer_user_id IN (SELECT user_id FROM (" + BASE + ") bb) AND an.finish_date_offer >= '" + MES_INICIO_RX + "-01' AND an.finish_date_offer < '" + MES_FIM_EXCLUSIVO + "-01' GROUP BY o.buyer_user_id, ym ORDER BY o.buyer_user_id, ym",
  82);

pushPaged('rx_modelo',
  "SELECT o.buyer_user_id, DATE_FORMAT(an.finish_date_offer,'%Y-%m') as ym, COALESCE(m.name,'Não informado') as modelo, COUNT(*) as qtd FROM advertisement_negotiations an INNER JOIN offers o ON o.id = an.offer_actual_id INNER JOIN advertisements a ON a.id = an.advertisement_id INNER JOIN vehicles v ON v.id = a.vehicle_id LEFT JOIN models m ON m.id = v.model_id WHERE an.status IN (2,3,7) AND o.buyer_user_id IN (SELECT user_id FROM (" + BASE + ") bb) AND an.finish_date_offer >= '" + MES_INICIO_RX + "-01' AND an.finish_date_offer < '" + MES_FIM_EXCLUSIVO + "-01' GROUP BY o.buyer_user_id, ym, modelo ORDER BY o.buyer_user_id, ym, modelo",
  212);

pushPaged('rx_laudo',
  "SELECT o.buyer_user_id, DATE_FORMAT(an.finish_date_offer,'%Y-%m') as ym, COALESCE(vpr.situation,'sem_registro') as laudo, COUNT(*) as qtd FROM advertisement_negotiations an INNER JOIN offers o ON o.id = an.offer_actual_id INNER JOIN advertisements a ON a.id = an.advertisement_id LEFT JOIN vehicle_precautionary_reports vpr ON vpr.vehicle_id = a.vehicle_id AND vpr.deleted_at IS NULL WHERE an.status IN (2,3,7) AND o.buyer_user_id IN (SELECT user_id FROM (" + BASE + ") bb) AND an.finish_date_offer >= '" + MES_INICIO_RX + "-01' AND an.finish_date_offer < '" + MES_FIM_EXCLUSIVO + "-01' GROUP BY o.buyer_user_id, ym, laudo ORDER BY o.buyer_user_id, ym, laudo",
  105);

pushPaged('rx_uf',
  "SELECT o.buyer_user_id, DATE_FORMAT(an.finish_date_offer,'%Y-%m') as ym, COALESCE(ss.state,'ND') as uf, COUNT(*) as qtd FROM advertisement_negotiations an INNER JOIN offers o ON o.id = an.offer_actual_id INNER JOIN advertisements a ON a.id = an.advertisement_id LEFT JOIN shop_stocks ss ON ss.id = a.shop_stock_id WHERE an.status IN (2,3,7) AND o.buyer_user_id IN (SELECT user_id FROM (" + BASE + ") bb) AND an.finish_date_offer >= '" + MES_INICIO_RX + "-01' AND an.finish_date_offer < '" + MES_FIM_EXCLUSIVO + "-01' GROUP BY o.buyer_user_id, ym, uf ORDER BY o.buyer_user_id, ym, uf",
  157);

pushPaged('rx_faixa',
  "SELECT o.buyer_user_id, DATE_FORMAT(an.finish_date_offer,'%Y-%m') as ym, CASE WHEN o.price < 25000 THEN 'Até R$ 25 mil' WHEN o.price < 50000 THEN 'R$ 25-50 mil' WHEN o.price < 100000 THEN 'R$ 50-100 mil' WHEN o.price < 200000 THEN 'R$ 100-200 mil' ELSE 'Acima de R$ 200 mil' END as faixa, COUNT(*) as qtd FROM advertisement_negotiations an INNER JOIN offers o ON o.id = an.offer_actual_id INNER JOIN advertisements a ON a.id = an.advertisement_id WHERE an.status IN (2,3,7) AND o.buyer_user_id IN (SELECT user_id FROM (" + BASE + ") bb) AND an.finish_date_offer >= '" + MES_INICIO_RX + "-01' AND an.finish_date_offer < '" + MES_FIM_EXCLUSIVO + "-01' GROUP BY o.buyer_user_id, ym, faixa ORDER BY o.buyer_user_id, ym, faixa",
  121);

pushPaged('rx_partic',
  "SELECT buyer_user_id, ym, COUNT(*) as participacoes FROM (SELECT o.buyer_user_id, DATE_FORMAT(MIN(o.created_at),'%Y-%m') as ym, o.advs_negotiation_id as neg_id FROM offers o INNER JOIN advertisement_negotiations an ON an.id = o.advs_negotiation_id INNER JOIN advertisements a ON a.id = an.advertisement_id WHERE o.deleted_at IS NULL AND o.buyer_user_id IN (SELECT user_id FROM (" + BASE + ") bb) AND o.created_at >= '" + MES_INICIO_RX + "-01' AND o.created_at < '" + MES_FIM_EXCLUSIVO + "-01' GROUP BY o.buyer_user_id, o.advs_negotiation_id) t GROUP BY buyer_user_id, ym ORDER BY buyer_user_id, ym",
  153);

/* [BC-17b] rx_buyers agora traz tambem loja + CNPJ (LEFT JOIN user_shops -> shops),
   para o Raio-X mostrar o mesmo subtitulo dos Top 10. Por causa do LEFT JOIN o numero
   de linhas pode passar o numero de compradores (usuario com mais de uma loja), entao
   as paginas subiram de 6 para 10 (500 linhas de teto, contra 185 compradores medidos
   em 27/08/2026). O colapso por u.id acontece no no 'Montar HTML', depois de paginar
   tudo - nunca antes. */
pushPaged('rx_buyers',
  "SELECT u.id, u.full_name, s.name AS loja, s.cnpj FROM users u LEFT JOIN user_shops us ON us.user_id = u.id LEFT JOIN shops s ON s.id = us.shop_id WHERE u.id IN (SELECT DISTINCT o.buyer_user_id FROM advertisement_negotiations an INNER JOIN offers o ON o.id = an.offer_actual_id WHERE an.status IN (2,3,7) AND o.buyer_user_id IN (SELECT user_id FROM (" + BASE + ") bb) AND an.finish_date_offer >= '" + MES_INICIO_RX + "-01' AND an.finish_date_offer < '" + MES_FIM_EXCLUSIVO + "-01') ORDER BY u.id, us.created_at",
  25);


/* ══════════════════════════════════════════════════════════════════
   [lote 2] baseWl() — a base de clientes carregando o whitelabel.
   Mesmo filtro de BASEF, verbatim. O INNER JOIN (e nao WHERE) e o ponto:
   quem esta em N whitelabels precisa aparecer N vezes aqui, uma vez em
   cada recorte. O total da plataforma NUNCA sai daqui — sai da query
   global correspondente, que nao tem o join. Somar os WLs pra chegar no
   total daria numero inflado, e e o erro que o EXISTS do BASE evita.
   `ano` null monta a base inteira; com ano, fatia por ano de cadastro
   dentro da subquery (padrao do lote 1f, coluna indexada).
   ══════════════════════════════════════════════════════════════════ */
function baseWl(ano) {
  return "SELECT u.id as user_id, uw.whitelabel_id as wl" +
    " FROM users u INNER JOIN user_whitelabels uw ON uw.user_id = u.id" + " AND uw.whitelabel_id IN (43, 48, 62, 65, 7, 4)" +
    " WHERE " + BASEF +
    (ano ? " AND u.created_at >= '" + ano + "-01-01' AND u.created_at < '" + (ano + 1) + "-01-01'" : "");
}
const BWL = "(" + baseWl(null) + ") bw";

/* ─── [lote 2] RECENCIA POR WL ────────────────────────────────────────
   Original: agrupa por faixa. Aqui agrupa por (wl, user) pra achar o
   ultimo evento de cada cliente dentro de cada whitelabel, e so entao
   conta por faixa. O CASE de faixa e verbatim do original.
   58 WL x 4 faixas x 3 tipos = teto de 696 linhas. */
const FAIXA = "CASE WHEN DATEDIFF(NOW(), ul) BETWEEN 0 AND 30 THEN '00-30d' WHEN DATEDIFF(NOW(), ul) BETWEEN 31 AND 90 THEN '31-90d' WHEN DATEDIFF(NOW(), ul) BETWEEN 91 AND 180 THEN '91-180d' ELSE '180d+' END";
pushPaged('recencia_wl',
  "SELECT 'login' as tipo, wl, faixa, COUNT(*) as qtd FROM (SELECT bw.wl as wl, " + FAIXA + " as faixa FROM (SELECT ua.user_id as uid, MAX(ua.created_at) as ul FROM user_access ua GROUP BY ua.user_id) t INNER JOIN " + BWL + " ON bw.user_id = t.uid) rl GROUP BY wl, faixa " +
  "UNION ALL " +
  "SELECT 'oferta' as tipo, wl, faixa, COUNT(*) as qtd FROM (SELECT bw.wl as wl, " + FAIXA + " as faixa FROM (SELECT o.buyer_user_id as uid, MAX(o.created_at) as ul FROM offers o WHERE o.deleted_at IS NULL GROUP BY o.buyer_user_id) t INNER JOIN " + BWL + " ON bw.user_id = t.uid) ro GROUP BY wl, faixa " +
  "UNION ALL " +
  "SELECT 'compra' as tipo, wl, faixa, COUNT(*) as qtd FROM (SELECT bw.wl as wl, " + FAIXA + " as faixa FROM (SELECT o.buyer_user_id as uid, MAX(an.finish_date_offer) as ul FROM advertisement_negotiations an INNER JOIN offers o ON o.id=an.offer_actual_id INNER JOIN advertisements a ON a.id=an.advertisement_id WHERE an.status IN (2,3,7) GROUP BY o.buyer_user_id) t INNER JOIN " + BWL + " ON bw.user_id = t.uid) rc GROUP BY wl, faixa " +
  "ORDER BY tipo, wl, faixa",
  16);

/* ─── [lote 2] EVOLUCAO POR WL ────────────────────────────────────────
   Transformacao mecanica das evol_* globais: o
   `X.user_id IN (SELECT user_id FROM (BASE) bb)` vira INNER JOIN em
   baseWl(), e `bw.wl` entra no SELECT e no GROUP BY. Janela de data
   verbatim. 58 WL x 12 meses = teto de 696 linhas.
   NAO fatiam por ano de cadastro: partem da tabela de evento, que ja e
   seletiva pela janela de 12 meses — fatiar multiplicaria chamada sem
   tirar custo. Se estourar deadline, fatiar e o proximo passo. */
pushPaged('evol_login_wl',
  "SELECT bw.wl as wl, DATE_FORMAT(ua.created_at,'%Y-%m') as mes, COUNT(DISTINCT ua.user_id) as unicos FROM user_access ua INNER JOIN " + BWL + " ON bw.user_id = ua.user_id WHERE ua.created_at >= '" + MES_INICIO + "-01' GROUP BY wl, mes ORDER BY wl, mes",
  20);

pushPaged('evol_oferta_wl',
  "SELECT bw.wl as wl, DATE_FORMAT(o.created_at,'%Y-%m') as mes, COUNT(DISTINCT o.buyer_user_id) as unicos FROM offers o INNER JOIN " + BWL + " ON bw.user_id = o.buyer_user_id WHERE o.deleted_at IS NULL AND o.created_at >= '" + MES_INICIO + "-01' AND o.created_at < '" + MES_FIM_EXCLUSIVO + "-01' GROUP BY wl, mes ORDER BY wl, mes",
  20);

pushPaged('evol_compra_wl',
  "SELECT bw.wl as wl, DATE_FORMAT(an.finish_date_offer,'%Y-%m') as mes, COUNT(DISTINCT o.buyer_user_id) as unicos, SUM(o.price) as volume FROM advertisement_negotiations an INNER JOIN offers o ON o.id=an.offer_actual_id INNER JOIN advertisements a ON a.id=an.advertisement_id INNER JOIN " + BWL + " ON bw.user_id = o.buyer_user_id WHERE an.status IN (2,3,7) AND an.finish_date_offer >= '" + MES_INICIO + "-01' AND an.finish_date_offer < '" + MES_FIM_EXCLUSIVO + "-01' GROUP BY wl, mes ORDER BY wl, mes",
  20);

pushPaged('evol_cadastro_dia_wl',
  "SELECT bw.wl as wl, DATE(u.created_at) as dia, COUNT(*) as novos FROM users u INNER JOIN " + BWL + " ON bw.user_id = u.id WHERE u.created_at >= '" + HOJE_MENOS_29D + "' AND u.created_at < '" + AMANHA + "' GROUP BY wl, dia ORDER BY wl, dia",
  40);

/* ─── [lote 2] NOVOS vs RECORRENTES POR WL ────────────────────────────
   A subquery `f` (primeiro_mes) segue SEM filtro de data e SEM wl, de
   proposito: 'novo' e quem esta no mes da primeira ocorrencia na
   historia inteira do cliente — nao na historia dentro daquele
   whitelabel, e nao no comeco da janela. Mudar isso faria o grafico
   medir o comeco da janela, que e exatamente a armadilha descrita no
   comentario original do BC-25/26/27. So `m` ganha wl. */
const NR_SEL_WL = "SELECT m.wl, m.mes, SUM(CASE WHEN m.mes = f.primeiro_mes THEN 1 ELSE 0 END) as novos, SUM(CASE WHEN m.mes > f.primeiro_mes THEN 1 ELSE 0 END) as recorrentes FROM ";
const NR_FIM_WL = " f ON f.uid = m.uid GROUP BY m.wl, m.mes ORDER BY m.wl, m.mes";

pushPaged('nr_login_wl',
  NR_SEL_WL +
  "(SELECT bw.wl as wl, ua.user_id as uid, DATE_FORMAT(ua.created_at,'%Y-%m') as mes FROM user_access ua INNER JOIN " + BWL + " ON bw.user_id = ua.user_id WHERE ua.created_at >= '" + MES_INICIO + "-01' GROUP BY bw.wl, ua.user_id, mes) m INNER JOIN " +
  "(SELECT ua.user_id as uid, DATE_FORMAT(MIN(ua.created_at),'%Y-%m') as primeiro_mes FROM user_access ua WHERE ua.user_id IN (SELECT user_id FROM (" + BASE + ") bb) GROUP BY ua.user_id)" + NR_FIM_WL,
  20);

pushPaged('nr_oferta_wl',
  NR_SEL_WL +
  "(SELECT bw.wl as wl, o.buyer_user_id as uid, DATE_FORMAT(o.created_at,'%Y-%m') as mes FROM offers o INNER JOIN " + BWL + " ON bw.user_id = o.buyer_user_id WHERE o.deleted_at IS NULL AND o.created_at >= '" + MES_INICIO + "-01' AND o.created_at < '" + MES_FIM_EXCLUSIVO + "-01' GROUP BY bw.wl, o.buyer_user_id, mes) m INNER JOIN " +
  "(SELECT o.buyer_user_id as uid, DATE_FORMAT(MIN(o.created_at),'%Y-%m') as primeiro_mes FROM offers o WHERE o.deleted_at IS NULL AND o.buyer_user_id IN (SELECT user_id FROM (" + BASE + ") bb) GROUP BY o.buyer_user_id)" + NR_FIM_WL,
  20);

pushPaged('nr_compra_wl',
  NR_SEL_WL +
  "(SELECT bw.wl as wl, o.buyer_user_id as uid, DATE_FORMAT(an.finish_date_offer,'%Y-%m') as mes FROM advertisement_negotiations an INNER JOIN offers o ON o.id=an.offer_actual_id INNER JOIN advertisements a ON a.id=an.advertisement_id INNER JOIN " + BWL + " ON bw.user_id = o.buyer_user_id WHERE an.status IN (2,3,7) AND an.finish_date_offer >= '" + MES_INICIO + "-01' AND an.finish_date_offer < '" + MES_FIM_EXCLUSIVO + "-01' GROUP BY bw.wl, o.buyer_user_id, mes) m INNER JOIN " +
  "(SELECT o.buyer_user_id as uid, DATE_FORMAT(MIN(an.finish_date_offer),'%Y-%m') as primeiro_mes FROM advertisement_negotiations an INNER JOIN offers o ON o.id=an.offer_actual_id INNER JOIN advertisements a ON a.id=an.advertisement_id WHERE an.status IN (2,3,7) AND o.buyer_user_id IN (SELECT user_id FROM (" + BASE + ") bb) GROUP BY o.buyer_user_id)" + NR_FIM_WL,
  20);

/* ─── [lote 2] UF POR WL ──────────────────────────────────────────────
   uf_cadastro: a `(BASE) b` do original vira baseWl(), que ja traz b.wl.
   O LEFT JOIN de UF, o UF_CASE e o COALESCE ficam verbatim.
   uf_compra: o `IN (BASE)` vira INNER JOIN. ~58 WL x ~28 UF = ~1,6k. */
pushPaged('uf_cadastro_wl',
  "SELECT b.wl as wl, COALESCE(ufn.uf_norm, 'Não identificada') as uf, COUNT(DISTINCT b.user_id) as qtd FROM (" + baseWl(null) + ") b LEFT JOIN (SELECT DISTINCT us.user_id, " + UF_CASE + " as uf_norm FROM user_shops us INNER JOIN shop_addresses sa ON sa.shop_id = us.shop_id AND sa.deleted_at IS NULL) ufn ON ufn.user_id = b.user_id AND ufn.uf_norm IS NOT NULL GROUP BY wl, uf ORDER BY wl, qtd DESC",
  40);

/* [correcao pos-sonda 48644/48645 — MEDIDO, nao suposto]
   Duas execucoes identicas provaram que o problema nao e carga nem janela de
   data: e a FORMA. Juntar a base-por-whitelabel direto contra a tabela de
   negociacoes estoura o deadline em qualquer variacao (com shard, sem shard,
   com a derivada de UF, sem ela). Pre-agregar primeiro passa.

   Variantes medidas, 1 pagina cada, duas vezes com o mesmo resultado:
     A  derivada de UF + shard por ano ......... timeout
     B  join direto em shops + shard ........... timeout
     C  join direto sem shard .................. timeout
     D  pre-agregado por (comprador, loja) ..... OK, 50 linhas
   O padrao D e o mesmo `PC` que a coorte usa em producao: agrega por chave
   pequena UMA vez, e so entao encosta em user_whitelabels.

   Somar as fatias e valido: `ag` tem uma linha por (comprador, loja), e o
   whitelabel multiplica essa linha sem alterar o valor agregado dentro dela. */
pushPaged('uf_compra_wl',
  "SELECT bw.wl as wl, COALESCE(" + UF_CASE + ", 'Não identificada') as uf, SUM(ag.compras) as compras, SUM(ag.volume) as volume" +
  " FROM (SELECT o.buyer_user_id as uid, o.buyer_shop_id as shop, COUNT(DISTINCT an.id) as compras, SUM(o.price) as volume" +
  " FROM advertisement_negotiations an INNER JOIN offers o ON o.id=an.offer_actual_id INNER JOIN advertisements a ON a.id=an.advertisement_id" +
  " WHERE an.status IN (2,3,7) GROUP BY o.buyer_user_id, o.buyer_shop_id) ag" +
  " INNER JOIN " + BWL + " ON bw.user_id = ag.uid" +
  " LEFT JOIN shops s2 ON s2.id = ag.shop" +
  " LEFT JOIN shop_addresses sa ON sa.shop_id = s2.id AND sa.deleted_at IS NULL" +
  " GROUP BY wl, uf ORDER BY wl, compras DESC",
  40);

/* ─── [lote 2] TOP 10 POR WL ──────────────────────────────────────────
   LIMIT 10 nao serve aqui: daria os 10 primeiros do conjunto todo, nao
   os 10 de cada whitelabel. ROW_NUMBER() OVER (PARTITION BY wl) resolve
   — exige MySQL 8. Metricas e criterio de ordenacao verbatim do
   original. 58 WL x 10 = teto de 580 linhas por ranking. */
/* [correcao pos-sonda 48571] A primeira versao agregava DEPOIS de juntar com
   user_whitelabels: cada linha de evento era multiplicada pela quantidade de
   whitelabels do comprador antes do GROUP BY. Foi essa forma que estourou o
   deadline em uf_compra_wl, e estes rankings tem a mesma forma.

   Aqui a ordem se inverte, seguindo o padrao `PC` que a coorte ja usa em
   producao: agrega por usuario UMA vez (poucos milhares de linhas), e so
   entao junta com whitelabel e ranqueia. O join com user_whitelabels passa a
   acontecer sobre o agregado, nao sobre o evento.

   Fatiar por ano nao serviria aqui: top-10 por ano nao soma pra top-10 geral
   — quem for 11o em todo ano e 5o no total sumiria. Por isso pre-agregar, e
   nao paginar por data. */
function topWl(nome, m, ordem, extraWhere) {
  const agregado =
    "SELECT " + m.uid + " as uid, " + m.sel + " FROM " + m.from2 +
    (extraWhere || "") + " GROUP BY " + m.uid;
  pushPaged(nome,
    "SELECT wl, id, full_name, " + m.campos + ", rn FROM (" +
    "SELECT bw.wl as wl, u.id as id, u.full_name as full_name, " + m.campos +
    ", ROW_NUMBER() OVER (PARTITION BY bw.wl ORDER BY " + ordem + " DESC) as rn" +
    " FROM (" + agregado + ") ag" +
    " INNER JOIN users u ON u.id = ag.uid" +
    " INNER JOIN " + BWL + " ON bw.user_id = ag.uid" +
    ") t WHERE t.rn <= 10 ORDER BY wl, rn",
    16);
}

/* `from2` = o mesmo FROM do original, SEM o join com users: o nome do cliente
   entra depois, sobre o agregado. Manter o join com advertisements preserva a
   semantica (negociacao sem anuncio nao e compra real — regra § 3). */
const M_COMPRA = {
  from2: "advertisement_negotiations an INNER JOIN offers o ON o.id=an.offer_actual_id INNER JOIN advertisements a ON a.id=an.advertisement_id",
  uid: "o.buyer_user_id",
  sel: "COUNT(DISTINCT an.id) as compras, SUM(o.price) as volume, MAX(an.finish_date_offer) as ultima_compra",
  campos: "compras, volume, ultima_compra"
};
/* ⚠️ OS 4 RANKINGS POR WHITELABEL ESTAO FORA DA FILA — decisao medida.
   As execucoes 48644 e 48645 (identicas) provaram que os quatro estouram o
   deadline mesmo depois de reescritos no padrao PC. Mante-los aqui custaria
   64 chamadas x ~15s = ~16 minutos de execucao em falha garantida.

   O gerador ja trata a ausencia: cai no ranking GLOBAL e marca a secao com
   "sem recorte por whitelabel — mostrando a plataforma". Melhor um Top 10 da
   plataforma, rotulado, do que 16 minutos gastos pra chegar em secao vazia.

   Pra reativar quando houver um desenho que passe, basta descomentar.
   O que ainda nao foi tentado: materializar o ranking a partir da coorte
   (que ja tem compradores por WL) em vez de ir a negociacao. */
const TOPS_WL_ATIVOS = false;
if (TOPS_WL_ATIVOS) {
  topWl('top_compradores_hist_wl', M_COMPRA, "ag.compras",
    " WHERE an.status IN (2,3,7)");
  topWl('top_compradores_ano_wl', M_COMPRA, "ag.compras",
    " WHERE an.status IN (2,3,7) AND an.finish_date_offer >= '" + ANO + "-01-01'");
  topWl('top_acesso_ano_wl', {
    from2: "user_access ua",
    uid: "ua.user_id",
    sel: "COUNT(DISTINCT DATE(ua.created_at)) as dias_ativos, COUNT(ua.id) as acessos_totais",
    campos: "dias_ativos, acessos_totais"
  }, "ag.dias_ativos", " WHERE ua.created_at >= '" + ANO + "-01-01'");
  topWl('top_ofertas_ano_wl', {
    from2: "offers o",
    uid: "o.buyer_user_id",
    sel: "COUNT(*) as ofertas",
    campos: "ofertas"
  }, "ag.ofertas", " WHERE o.deleted_at IS NULL AND o.created_at >= '" + ANO + "-01-01'");
}


/* ─── [lote 2b] ATIVACAO POR SAFRA — quanto tempo ate a primeira acao ──
   Pedido de 04/09: por mes de cadastro, quantos logaram / ofertaram /
   compraram DENTRO de 30, 60, 90 e 180 dias do proprio cadastro.

   E dado novo: nenhuma query existente sabe "tempo ate a primeira acao".
   A coorte so sabe SE o cliente ja logou algum dia, nao QUANDO.

   Forma: o padrao PC, o unico que passou no deadline hoje. Cada "primeira
   ocorrencia" e agregada UMA vez sobre a tabela de evento inteira (poucos
   milhares de linhas) e so entao encostada na base por LEFT JOIN. Correlacionar
   um MIN() por usuario dentro do SELECT seria a forma que estourou em todas as
   variantes medidas nas execucoes 48644/48645.

   As faixas sao CUMULATIVAS: quem logou em 12 dias conta em 30, 60, 90 e 180.
   E o que "dentro de N dias" quer dizer.

   DATEDIFF negativo (primeira acao ANTES do cadastro) existe no dado e conta
   como "dentro de 30" — o cliente agiu, e a anomalia esta na data de cadastro,
   nao no comportamento. Sao poucos; o campo `anomalos` conta quantos, pra nao
   ficar escondido.

   ⚠️ MATURIDADE: uma safra de mes passado nao teve 180 dias pra acontecer. O
   HTML tem de marcar a celula como imatura em vez de mostrar 0% como se fosse
   resultado. O calculo disso e no cliente, que sabe a data de hoje. */
/* Preenchido pelo gera_lote2.py junto com o resto do recorte de whitelabel,
   pra a lista de ids ter UMA fonte so no arquivo inteiro. */
const FILTRO_WL_JOIN = " AND uw.whitelabel_id IN (43, 48, 62, 65, 7, 4)";

const PRIMEIRO_LOGIN = "SELECT ua.user_id uid, MIN(ua.created_at) p FROM user_access ua GROUP BY ua.user_id";
const PRIMEIRA_OFERTA = "SELECT o.buyer_user_id uid, MIN(o.created_at) p FROM offers o WHERE o.deleted_at IS NULL GROUP BY o.buyer_user_id";
const PRIMEIRA_COMPRA = "SELECT o.buyer_user_id uid, MIN(an.finish_date_offer) p FROM advertisement_negotiations an INNER JOIN offers o ON o.id=an.offer_actual_id INNER JOIN advertisements a ON a.id=an.advertisement_id WHERE an.status IN (2,3,7) GROUP BY o.buyer_user_id";

function faixasAtivacao(alias) {
  return [30, 60, 90, 180].map(function (d) {
    return "SUM(" + alias + ".p IS NOT NULL AND DATEDIFF(" + alias + ".p, b.cad) <= " + d + ")";
  });
}
const ATIV_METRICS =
  "COUNT(*) total, " +
  faixasAtivacao('fl').map(function (e, i) { return e + " lg" + [30,60,90,180][i]; }).join(', ') + ", " +
  faixasAtivacao('fo').map(function (e, i) { return e + " of" + [30,60,90,180][i]; }).join(', ') + ", " +
  faixasAtivacao('fc').map(function (e, i) { return e + " cp" + [30,60,90,180][i]; }).join(', ') + ", " +
  "SUM(fl.p IS NOT NULL AND DATEDIFF(fl.p, b.cad) < 0) anomalos";

const ATIV_JOINS =
  " LEFT JOIN (" + PRIMEIRO_LOGIN + ") fl ON fl.uid = b.uid" +
  " LEFT JOIN (" + PRIMEIRA_OFERTA + ") fo ON fo.uid = b.uid" +
  " LEFT JOIN (" + PRIMEIRA_COMPRA + ") fc ON fc.uid = b.uid";

/* base enxuta: so id, safra e data de cadastro — nao precisa dos EXISTS do BEXT */
const BASE_CAD = "SELECT u.id uid, DATE_FORMAT(u.created_at,'%Y-%m') ym, u.created_at cad" +
  " FROM users u WHERE " + BASEF;

pushPaged('ativacao',
  "SELECT b.ym, " + ATIV_METRICS +
  " FROM (" + BASE_CAD + ") b" + ATIV_JOINS +
  " GROUP BY b.ym ORDER BY b.ym",
  3);

/* Por whitelabel: mesma coisa com o join de user_whitelabels sobre a base.
   6 WL x ~78 safras = teto de 468 linhas. */
pushPaged('ativacao_wl',
  "SELECT uw.whitelabel_id wl, b.ym, " + ATIV_METRICS +
  " FROM (" + BASE_CAD + ") b" +
  " INNER JOIN user_whitelabels uw ON uw.user_id = b.uid" + FILTRO_WL_JOIN +
  ATIV_JOINS +
  " GROUP BY uw.whitelabel_id, b.ym ORDER BY uw.whitelabel_id, b.ym",
  12);

/* ─── [lote 2] MAPA COMPRADOR -> WHITELABEL (Raio-X) ──────────────────
   O que faz as duas abas do Raio-X filtrarem sem tocar nas 7 queries
   rx_*, que ja somam 855 chamadas ao MCP. Elas vem indexadas por
   buyer_user_id; com este mapa o cliente recorta os arrays existentes.
   O conjunto de compradores e o MESMO subquery do rx_buyers, verbatim,
   pra nao existir comprador no Raio-X sem entrada no mapa. */
pushPaged('rx_buyer_wl',
  "SELECT uw.user_id, uw.whitelabel_id as wl FROM user_whitelabels uw WHERE uw.user_id IN (SELECT DISTINCT o.buyer_user_id FROM advertisement_negotiations an INNER JOIN offers o ON o.id = an.offer_actual_id WHERE an.status IN (2,3,7) AND o.buyer_user_id IN (SELECT user_id FROM (" + BASE + ") bb) AND an.finish_date_offer >= '" + MES_INICIO_RX + "-01' AND an.finish_date_offer < '" + MES_FIM_EXCLUSIVO + "-01') ORDER BY uw.user_id, uw.whitelabel_id",
  60);

/* A coorte vai PRIMEIRO na fila. Se uma query pesada estourar o deadline do
   MCP no meio, o no inteiro falha e nada e devolvido (foi o que aconteceu na
   execucao 48410). Com a coorte na frente, o dado de verificacao ja esta
   colhido antes de qualquer risco. */
const PRIMEIRO = ['coorte', 'coorte_wl', 'kpi_ofertas',
  /* [lote 2] as _wl entram logo atras da coorte: se uma query pesada
     estourar o deadline la na frente, o no inteiro falha e nao devolve
     nada (execucao 48410). O que e barato e colhido antes do risco. */
  'recencia_wl', 'evol_login_wl', 'evol_oferta_wl', 'evol_compra_wl',
  'nr_login_wl', 'nr_oferta_wl', 'nr_compra_wl', 'evol_cadastro_dia_wl',
  'uf_cadastro_wl', 'uf_compra_wl', 'top_compradores_hist_wl',
  'top_compradores_ano_wl', 'top_acesso_ano_wl', 'top_ofertas_ano_wl',
  'rx_buyer_wl'];
const Q_ORD = Q.filter(function(q){ return PRIMEIRO.indexOf(q.queryName) >= 0; })
  .concat(Q.filter(function(q){ return PRIMEIRO.indexOf(q.queryName) < 0; }));

return Q_ORD.map(function(q){ return { json: q }; });