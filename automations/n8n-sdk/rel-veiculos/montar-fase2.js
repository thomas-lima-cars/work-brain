/* ════════
   NÓ "Montar Fase 2" — coleta dimensionada

   Lê da fase 1 quantos veículos e quantas lojas existem, e monta
   exatamente ceil(n / 50) páginas para cada conjunto. Nada de teto
   chutado: página que sobra custa um agregado completo e devolve zero.

   ⚠️ TODAS as consultas de loja sao dimensionadas pela MESMA contagem
   (q_lojas_total), entao todas precisam do MESMO filtro que ela. Filtrar
   so uma parte nao da erro: as outras batem no teto da paginacao e perdem
   as ultimas linhas em silencio. Aconteceu no run 50268.

   Dois conjuntos:

     A) os VEÍCULOS do evento — uma linha por negociação disponível, com
        valor (`value_actual`), modelo, categoria, ano, km, a loja vendedora
        e a UF **do pátio** (`shop_stocks`), não a do endereço da loja: o
        carro está fisicamente no estoque, e 68% dos veículos divergem entre
        as duas (sonda 50068). Traz também versão e uuid, que o Montar HTML
        usa para montar o link do anúncio.

     B) o PERFIL DE COMPRA das lojas nos últimos 6 meses — as mesmas 5
        queries do relatório `LZL3mxfbMIz4avyx`, já provadas em produção
        (execução 49803, 1.300 lojas). Sem função de janela: a última
        oferta sai de MAX(offers.id) e o topo das modas de INNER JOIN no
        MAX(n), porque o validador do MCP rejeita `OVER (`.
   ════════ */

const cab = $('Montar Fase 1').all()[0].json;
const META_IN = cab.meta;
const PAGE = META_IN.page;
const LADO = META_IN.lado;
const DATA_INI = META_IN.data_ini;
const SELECAO = META_IN.selecao;
const DISPONIVEL = META_IN.disponivel;
/* o relogio da fase 1, em hora de Brasilia. Precisa atravessar ate o
   Montar HTML pra ele saber qual evento ja encerrou -- este no reconstroi
   o META do zero, entao o que nao for repassado aqui chega undefined. */
const ULTIMA_NEG = META_IN.ultima_neg;
const AGORA_BR = META_IN.agora_br;
const JANELA_INI = META_IN.janela_ini;
const JANELA_FIM = META_IN.janela_fim;
/* o mesmo filtro de canal que dimensionou a q_lojas_total na fase 1 */
const SO_WL_LOJA = META_IN.so_wl_loja || '';

/* ── lê os totais da fase 1 ──────── */
const pedidos1 = $('Montar Fase 1').all().map((i) => i.json);
const outs1 = $('MCP Fase 1').all();
/* ACUMULA todas as paginas da consulta, nao devolve a primeira.
   Bug achado na execucao 50105: o `return` ficava DENTRO do laco, entao
   consulta paginada era lida so ate a pagina 0. Com nove eventos os 71
   pares de q_evento_wl ainda cabiam em 50 linhas e ninguem viu; com a
   janela aberta (47 eventos) sumiam 21 pares de whitelabel -- e whitelabel
   e metade da regra de elegibilidade, entao os veiculos daqueles eventos
   virariam "sem loja elegivel", indistinguiveis de quem nao tem par mesmo.
   Quem pegou foi a conferencia contra q_evwl_total, nao o olho. */
function leitura(nome) {
  const linhas = [];
  for (let i = 0; i < pedidos1.length; i++) {
    if (pedidos1[i].queryName !== nome) continue;
    const o = outs1[i] ? outs1[i].json : null;
    const sc = o ? (o.structuredContent || o) : null;
    const cols = (sc && sc.columns) || [];
    const rows = (sc && sc.rows) || [];
    for (let r = 0; r < rows.length; r++) {
      const obj = {};
      for (let c = 0; c < cols.length; c++) obj[cols[c]] = rows[r][c];
      linhas.push(obj);
    }
  }
  return linhas;
}

const eventos = leitura('q_eventos');
const vt = leitura('q_veic_total')[0] || {};
const lt = leitura('q_lojas_total')[0] || {};
const valor = leitura('q_valor')[0] || {};
const eventoWl = leitura('q_evento_wl');
/* a q_por_status roda na FASE 1, e o Montar HTML so enxerga os resultados
   da fase 2 -- entao ela precisa pegar carona no META, como eventos e
   evento_wl ja fazem. Sem isso o painel chega vazio e ninguem reclama. */
const porStatus = leitura('q_por_status');

const VEICULOS = vt.veiculos === undefined ? null : Number(vt.veiculos);
const LOJAS = lt.lojas === undefined ? null : Number(lt.lojas);

if (VEICULOS === null || LOJAS === null) {
  throw new Error('a fase 1 nao voltou completa — sem contagem nao da pra dimensionar. ' +
    'veiculos=' + VEICULOS + ' lojas=' + LOJAS);
}
if (VEICULOS === 0) {
  throw new Error('nenhum veiculo disponivel no recorte de eventos escolhido. ' +
    'Eventos encontrados: ' + eventos.length + '. Revise EVENTOS_IDS ou HORAS_ADIANTE na fase 1.');
}
if (LOJAS === 0) throw new Error('nenhuma loja com oferta na janela de historico');

/* Mesma historia da q_evento_wl, e com um agravante: truncar a lista de
   eventos nao some so do cabecalho -- some do FILTRO de evento da pagina,
   entao o usuario deixa de conseguir isolar uma edicao que esta ali no
   meio dos veiculos. Achado em 18/09 no run 50406: 51+ eventos, uma
   pagina so, e o evento 21746 tinha veiculo e nao tinha linha. */
const EV_ESPERADO = Number((leitura('q_ev_total')[0] || {}).eventos);
if (Number.isFinite(EV_ESPERADO) && eventos.length !== EV_ESPERADO) {
  throw new Error('q_eventos veio incompleta: ' + eventos.length +
    ' eventos de ' + EV_ESPERADO +
    '. Aumente as paginas dela na fase 1 (evento faltando some do filtro ' +
    'da pagina sem dar erro).');
}

/* q_evento_wl e paginada por numero escolhido na fase 1. Truncar ali nao da
   erro: o veiculo perde whitelabel e vira "sem loja elegivel", que na tela
   fica igual a um carro sem loja compativel de verdade. Entao confere. */
const EVWL_ESPERADO = Number((leitura('q_evwl_total')[0] || {}).pares);
if (Number.isFinite(EVWL_ESPERADO) && eventoWl.length !== EVWL_ESPERADO) {
  throw new Error('q_evento_wl veio incompleta: ' + eventoWl.length +
    ' pares evento x whitelabel de ' + EVWL_ESPERADO +
    '. Aumente as paginas dela na fase 1 (whitelabel e metade da regra de ' +
    'elegibilidade -- faltar par faz veiculo perder loja em silencio).');
}

/* mesma guarda para a trava de grupo: par evento x grupo que falta tira
   comprador de veiculo, e na tela isso fica igual a carro sem loja. */
const eventoGrupo = leitura('q_evento_grupo');
const EVGR_ESPERADO = Number((leitura('q_evgr_total')[0] || {}).pares);
if (Number.isFinite(EVGR_ESPERADO) && eventoGrupo.length !== EVGR_ESPERADO) {
  throw new Error('q_evento_grupo veio incompleta: ' + eventoGrupo.length +
    ' pares evento x grupo de ' + EVGR_ESPERADO +
    '. Aumente as paginas dela na fase 1 (grupo e metade da trava de ' +
    'elegibilidade -- faltar par faz veiculo perder loja em silencio).');
}
const LOJAS_GRUPO = Number((leitura('q_lojas_grupo_total')[0] || {}).lojas);

const PAG_VEIC = Math.ceil(VEICULOS / PAGE);
const PAG_LOJAS = Math.ceil(LOJAS / PAGE);
/* As modas voltaram a caber em PAG_LOJAS: elas agora colapsam os empates no
   proprio SQL e devolvem UMA linha por loja. A folga de 2 paginas que
   existia aqui era chute, e o run 50327 mostrou que chute nao serve --
   bastou pra categoria (28 empates) e nao bastou pra modelo, que bateu no
   teto e deixou 47 lojas sem o componente.

   A conferencia de cobertura no Montar HTML continua de pe: foi ela que
   pegou isto, e e ela que pega a proxima surpresa. */

const UF_CASE =
  "CASE WHEN UPPER(TRIM(sa.state)) IN ('SP','MG','PR','SC','RJ','GO','RS','BA','MT','DF','CE','MS','ES','PE','PA','SE','AM','MA','RN','PB','AL','PI','RO','TO','AP','AC','RR') THEN UPPER(TRIM(sa.state))" +
  " WHEN UPPER(TRIM(sa.state)) = 'S.P' THEN 'SP'" +
  " WHEN UPPER(TRIM(sa.state)) = 'RIO DE JANEIRO' THEN 'RJ'" +
  " WHEN UPPER(TRIM(sa.state)) = 'MATO GROSSO DO SUL' THEN 'MS'" +
  " WHEN UPPER(TRIM(sa.state)) LIKE 'ESPIRITO%SANTO%' THEN 'ES'" +
  " ELSE NULL END";

/* a UF do VEICULO sai do PATIO, nao do endereco da loja vendedora: o carro
   esta fisicamente no estoque (`shop_stocks`), e 68% dos veiculos tem UF de
   patio diferente da UF da loja (sonda 50068). UF e metade da regra de
   elegibilidade, entao isso decide quem pode aparecer pra quem.
   As 25 UFs medidas ja vem como sigla limpa, sem vazios -- a validacao
   abaixo e GUARDA, nao caminho: sujeira futura cai em 'Nao identificada' e
   aparece na tela em vez de virar UF fantasma. */
const UF_PATIO =
  "CASE WHEN UPPER(TRIM(ss.state)) IN ('SP','MG','PR','SC','RJ','GO','RS','BA','MT','DF','CE','MS','ES','PE','PA','SE','AM','MA','RN','PB','AL','PI','RO','TO','AP','AC','RR') THEN UPPER(TRIM(ss.state))" +
  " ELSE NULL END";

const JANELA =
  " o.deleted_at IS NULL AND o." + LADO + " IS NOT NULL" +
  " AND o.created_at >= '" + DATA_INI + "' AND o.price > 0";

/* O MESMO recorte de canal que a q_lojas_total usou pra dimensionar estas
   consultas. Sem ele, q_ofertas/q_perfil/q_modelo/q_categoria varrem o
   universo INTEIRO de lojas com paginacao dimensionada pelo universo
   FILTRADO -- e as ultimas linhas somem no teto. Foi o que aconteceu no
   run 50268: quatro consultas devolvendo exatos 1.300 = 26 x 50, e tres
   lojas ficando sem perfil.

   Montado uma vez so, de proposito: quatro copias do mesmo join e quatro
   chances de uma divergir das outras. */
const JOIN_LOJA_CANAL = SO_WL_LOJA
  ? " INNER JOIN shops s ON s.id = o." + LADO + " AND s.deleted_at IS NULL" + SO_WL_LOJA
  : "";

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

/* ── A) os veículos do evento ──────── */
push('q_veiculos',
  "SELECT an.id AS neg_id, e.id AS evento_id, e.name AS evento," +
  " DATE_FORMAT(e.finish_date_event, '%Y-%m-%d %H:%i') AS fim_evento," +
  " a.id AS anuncio_id, a.vehicle_id AS vehicle_id," +
  " ROUND(an.value_actual, 2) AS valor," +
  " ROUND(NULLIF(an.initial_price_reference, 0), 2) AS valor_inicial," +
  " ROUND(NULLIF(a.fipe_price, 0), 2) AS fipe," +
  " v.model_id AS model_id, mo.name AS modelo," +
  " v.category_id AS category_id, cat.name AS categoria," +
  " br.name AS marca, ve.name AS versao, a.uuid AS anuncio_uuid," +
  " v.model_year AS model_year, NULLIF(v.km, 0) AS km," +
  " an.status AS neg_status," +
  /* laudo cautelar do veiculo. Dominio medido na sonda 50346: aprovado,
     aprovado_com_apontamento, reprovado, nao_informado e vazio.
     'nao_informado' e laudo SEM VEREDITO (78% da base), diferente de nao ter
     laudo -- que aqui chega como NULL. Sao tres estados, nao dois. */
  " vpr.situation AS laudo," +
  " a.shop_id AS loja_id, s.name AS loja_vendedora," +
  " COALESCE(" + UF_PATIO + ", 'Não identificada') AS uf," +
  /* VMV = valor minimo de venda, decidido pelo vendedor por negociacao.
     E real na Cars2You (mediana 0,71x a FIPE, medido em 17/09) -- na Dealers
     e valor-sentinela e nao seria comparavel, mas esta query so le
     cars2you_production, entao o numero vale. Pode vir NULL: nem toda
     negociacao tem VMV declarado, e o farol trata isso como "nao da pra
     confirmar atingido", nao como zero. */
  " NULLIF(an.min_sale_price, 0) AS vmv," +
  /* ofertas da PROPRIA negociacao (nao do historico de 6 meses da loja,
     que e outra coisa e ja vem em q_ofertas/q_perfil). advs_negotiation_id
     e a FK de offers pra advertisement_negotiations -- correlacionada aqui
     porque e um numero por negociacao, nao por loja. Sem filtro de
     `situation`: o dominio dela ainda nao foi decodificado (ver
     dominios.md), e contar so 'existe oferta com preco' nao depende de
     entender esse codigo. */
  " (SELECT COUNT(*) FROM offers o WHERE o.advs_negotiation_id = an.id" +
  " AND o.deleted_at IS NULL AND o.price > 0) AS qt_ofertas," +
  " (SELECT MAX(o.price) FROM offers o WHERE o.advs_negotiation_id = an.id" +
  " AND o.deleted_at IS NULL AND o.price > 0) AS oferta_max" +
  " FROM " + ULTIMA_NEG +
  " INNER JOIN advertisement_negotiations an ON an.id = u.neg_id" +
  " INNER JOIN events e ON e.id = an.event_id" +
  " INNER JOIN advertisements a ON a.id = an.advertisement_id AND a.deleted_at IS NULL" +
  " INNER JOIN vehicles v ON v.id = u.vehicle_id AND v.deleted_at IS NULL" +
  " LEFT JOIN models mo ON mo.id = v.model_id" +
  " LEFT JOIN categories cat ON cat.id = v.category_id" +
  " LEFT JOIN brands br ON br.id = v.brand_id" +
  " LEFT JOIN versions ve ON ve.id = v.version_id" +
  " LEFT JOIN shops s ON s.id = a.shop_id" +
  /* os DOIS caminhos ate o patio estao preenchidos em 100% dos casos; o
     COALESCE prefere o do anuncio, que e o local de onde o carro esta
     sendo vendido naquele evento. shop_addresses saiu daqui: a UF da loja
     vendedora nao e mais lida, e join que ninguem le custa caro num
     agregado paginado. */
  " LEFT JOIN shop_stocks ss ON ss.id = COALESCE(a.shop_stock_id, v.shop_stock_id)" +
  " AND ss.deleted_at IS NULL" +
  /* LEFT, nunca INNER: 4% dos veiculos nao tem laudo (sonda 50346) e com
     INNER eles sumiriam da base inteira, mudando a contagem em silencio.
     Uma linha por veiculo, medido -- a juncao nao multiplica. */
  " LEFT JOIN vehicle_precautionary_reports vpr" +
  " ON vpr.vehicle_id = a.vehicle_id AND vpr.deleted_at IS NULL" +
  " WHERE" + DISPONIVEL +
  " GROUP BY neg_id, evento_id, evento, fim_evento, anuncio_id, vehicle_id," +
  " valor, valor_inicial, fipe, model_id, modelo, category_id, categoria," +
  " marca, versao, anuncio_uuid, model_year, km, neg_status, laudo," +
  " loja_id, loja_vendedora, uf, vmv" +
  /* qt_ofertas e oferta_max NAO entram aqui: sao subquery correlacionada,
     nao coluna simples de tabela juntada -- e neg_id (chave primaria de
     an, ja no GROUP BY) ja garante uma linha por negociacao. */
  " ORDER BY an.id", PAG_VEIC);

/* ── B) perfil de compra das lojas (mesmas queries do LZL3mxfbMIz4avyx) ── */
/* mesmo filtro de q_lojas_total (fase 1), que a dimensiona -- repetido
   aqui porque tres consultas (q_lojas, o antigo q_contato, o antigo
   q_cluster) partiam da mesma clausula, letra por letra. Uma fusao so:
   MESMA base, MESMA pagina, tres vezes menos chamada.
   Otimizacao de 2026-09-23: eram 3 consultas x 27 paginas = 81 chamadas
   por run; viram 1 x 27 = 27. O merge nao muda nenhum numero publicado,
   so onde ele mora -- contato e cluster (`ult_oferta`/`ult_acesso`) saem
   direto da linha de `q_lojas` agora, sem indice proprio no Montar HTML. */
const LOJA_TEM_OFERTA =
  " AND EXISTS (SELECT 1 FROM offers o WHERE o." + LADO + " = s.id" +
  " AND o.deleted_at IS NULL AND o.created_at >= '" + DATA_INI + "' AND o.price > 0)";
/* ── contato (ex-q_contato) ────────
   Telefone sai de `shops` (comercial 79,3%, whatsapp 79,0%, privativo 8,9%).
   O privativo entra a pedido explicito do Thomas em 11/09.

   🔴 O e-mail NAO sai de `shops`: medido em 5,8% ali contra 99,5% em `users`
   via `user_shops` (sonda 50347). Quando a loja tem mais de um usuario com
   e-mail -- 1,19 por loja na media -- o desempate e o MENOR user_id, pelo
   mesmo motivo que a moda usa MIN(item_id): e deterministico entre runs.
   `user_shops.function` nao serve de criterio, esta nulo em 77% dos
   vinculos.

   🚨 ISTO E PII. O relatorio passa a carregar e-mail e telefone de loja real,
   e ele sobe pro SharePoint. `qt_emails` viaja junto para a tela poder dizer
   "1 de N" em vez de fingir que a loja tem um contato so. */
const EMAIL_AG =
  "(SELECT us.shop_id AS shop_id, MIN(us.user_id) AS user_id," +
  " COUNT(DISTINCT us.user_id) AS qt" +
  " FROM user_shops us" +
  " INNER JOIN users u ON u.id = us.user_id AND u.deleted_at IS NULL" +
  " WHERE TRIM(COALESCE(u.email, '')) <> ''" +
  " GROUP BY us.shop_id) ue";
/* ── as duas datas do cluster (ex-q_cluster) ────────
   So as DATAS CRUAS vem do banco; a regra das sete faixas e calculada no
   Montar HTML. Assim ela e testavel pelo prova-local.js sem tocar no banco,
   e mudar uma faixa nao exige rodar o workflow inteiro.

   `ult_oferta` NAO leva filtro de janela: a pergunta e "ja ofertou alguma
   vez", e `offers` alcanca 2020-06-24 (sonda 50347). `ult_acesso` sai de
   `access_logs`, que so comeca em 2025-08-31 -- por isso "nunca acessou" e,
   na verdade, "nao acessou nos ultimos 12 meses". A tela tem que dizer isso.

   🚨 Na base deste relatorio o cluster e DEGENERADO: 98,8% cai em Diamante
   ou Ouro, porque a base *e* "lojas que ofertaram nos ultimos 6 meses" e
   nenhuma delas pode ser "nunca ofertou". Medido na sonda 50347. Entra assim
   mesmo por decisao do Thomas; os sete so existem sobre o universo inteiro
   de lojas. */
push('q_lojas',
  "SELECT s.id AS shop_id, MAX(s.name) AS loja," +
  /* o CNPJ e a chave do cruzamento com a carteira comercial (filtro de
     responsavel, no Montar HTML). MAX porque o GROUP BY e por s.id e o
     resto da linha ja vem assim -- nao ha dois CNPJ pra mesma loja. */
  " MAX(s.cnpj) AS cnpj," +
  " MAX(s.whitelabel_id) AS whitelabel_id, MAX(w.name) AS whitelabel," +
  " COALESCE(MAX(" + UF_CASE + "), 'Não identificada') AS uf," +
  /* ex-q_contato: telefone sai de shops (comercial/whatsapp/privativo); o
     e-mail sai de users via user_shops (99,5% preenchido ali contra 5,8%
     em shops, sonda 50347) -- desempate pelo MENOR user_id, deterministico
     entre runs. ISTO E PII: sobe pro SharePoint junto do relatorio. */
  " MAX(s.comercial_number) AS tel_comercial," +
  " MAX(s.whatsapp_number) AS whatsapp," +
  " MAX(s.privative_number) AS tel_privativo," +
  " MAX(uu.email) AS email," +
  " MAX(ue.qt) AS qt_emails," +
  /* ex-q_cluster: as duas datas cruas (a regra das sete faixas e calculada
     no Montar HTML, pra ser testavel sem tocar no banco). Correlacionada
     por shop_id como antes -- so mudou de consulta, nao de forma. */
  " (SELECT MAX(o2.created_at) FROM offers o2 WHERE o2." + LADO + " = s.id" +
  " AND o2.deleted_at IS NULL AND o2.price > 0) AS ult_oferta," +
  " (SELECT MAX(al.created_at) FROM access_logs al WHERE al.shop_id = s.id) AS ult_acesso" +
  " FROM shops s" +
  " LEFT JOIN whitelabels w ON w.id = s.whitelabel_id" +
  " LEFT JOIN shop_addresses sa ON sa.shop_id = s.id AND sa.deleted_at IS NULL" +
  " LEFT JOIN " + EMAIL_AG + " ON ue.shop_id = s.id" +
  " LEFT JOIN users uu ON uu.id = ue.user_id" +
  " WHERE s.deleted_at IS NULL" + SO_WL_LOJA + LOJA_TEM_OFERTA +
  " GROUP BY s.id ORDER BY s.id", PAG_LOJAS);

push('q_ofertas',
  "SELECT o." + LADO + " AS shop_id, COUNT(*) AS qt_ofertas" +
  " FROM offers o" + JOIN_LOJA_CANAL + " WHERE" + JANELA +
  " GROUP BY o." + LADO + " ORDER BY o." + LADO, PAG_LOJAS);

const ULTIMAS =
  "(SELECT o." + LADO + " AS shop_id, a.vehicle_id AS vehicle_id, MAX(o.id) AS offer_id" +
  " FROM offers o" + JOIN_LOJA_CANAL +
  " INNER JOIN advertisements a ON a.id = o.advertisement_id AND a.deleted_at IS NULL" +
  " WHERE" + JANELA +
  " GROUP BY o." + LADO + ", a.vehicle_id) u";
const IDADE = "(YEAR(CURDATE()) - NULLIF(v.model_year, 0))";

/* ── desagio contra a FIPE ────────
   A FIPE sai de `advertisements.fipe_price`, medida na sonda 50346 em 85,6%
   das ofertas contra 63,8% de `vehicles.fipe_price`. Nao existe tabela de
   preco FIPE por codigo: `versions.code_fipe` guarda so o codigo, e o valor
   vive denormalizado nessas duas colunas, que divergem entre si em 633
   ofertas.

   O corte de outlier NAO e conservadorismo: o desagio cru medido vai de
   -1.586% a +94%, ou seja existe oferta 16 vezes acima da FIPE registrada.
   Uma media por loja e destruida por um unico caso desses. O corte e
   declarado aqui e aparece no glossario -- numero descartado em silencio e
   pior que numero errado. */
const DESAGIO_MIN = -100;
const DESAGIO_MAX = 95;
const DESAGIO = "(100 * (1 - ult.price / aq.fipe_price))";
const DESAGIO_OK = "aq.fipe_price > 0 AND " + DESAGIO +
  " BETWEEN " + DESAGIO_MIN + " AND " + DESAGIO_MAX;

push('q_perfil',
  "SELECT u.shop_id AS shop_id, COUNT(*) AS qt_veiculos," +
  " ROUND(AVG(ult.price), 2) AS preco_medio," +
  " ROUND(STDDEV_SAMP(ult.price), 2) AS preco_desvio," +
  " ROUND(AVG(" + IDADE + "), 2) AS idade_media," +
  " ROUND(STDDEV_SAMP(" + IDADE + "), 2) AS idade_desvio," +
  " ROUND(AVG(NULLIF(v.km, 0)), 0) AS km_medio," +
  " ROUND(STDDEV_SAMP(NULLIF(v.km, 0)), 0) AS km_desvio," +
  /* o desagio pega carona: a ULTIMA oferta de cada (loja, veiculo) ja e a
     linha que ele precisa, entao nao custa chamada nenhuma. */
  " COUNT(CASE WHEN " + DESAGIO_OK + " THEN 1 END) AS desagio_n," +
  " ROUND(AVG(CASE WHEN " + DESAGIO_OK + " THEN " + DESAGIO + " END), 2) AS desagio_medio," +
  /* o desvio e o que torna o desagio um indicador QUANTITATIVO de verdade:
     a aderencia usa 1/(1+|valor-media|/desvio) e o peso usa o inverso do
     coeficiente de variacao. Sem ele, loja de desagio consistente e loja
     erratica pesariam igual. */
  " ROUND(STDDEV_SAMP(CASE WHEN " + DESAGIO_OK + " THEN " + DESAGIO + " END), 2) AS desagio_desvio," +
  " COUNT(CASE WHEN aq.fipe_price > 0 THEN 1 END) AS com_fipe" +
  " FROM " + ULTIMAS +
  " INNER JOIN offers ult ON ult.id = u.offer_id" +
  " INNER JOIN vehicles v ON v.id = u.vehicle_id AND v.deleted_at IS NULL" +
  /* LEFT, nunca INNER: com INNER, oferta cujo anuncio foi apagado sairia da
     conta e qt_veiculos/preco/idade/km -- que ja existem e ja foram
     conferidos -- mudariam de valor em silencio. Coluna nova nao pode mexer
     nas antigas. */
  " LEFT JOIN advertisements aq ON aq.id = ult.advertisement_id AND aq.deleted_at IS NULL" +
  " GROUP BY u.shop_id ORDER BY u.shop_id", PAG_LOJAS);

/* ── UF e laudo cautelar, numa varredura so ────────
   As duas perguntas ("% de ofertas na mesma UF" e "% por status de laudo")
   leem exatamente as mesmas linhas: offers + advertisements da janela. Duas
   consultas custariam 52 chamadas; esta custa 26.

   A UF da loja entra por TABELA DERIVADA, nao por junção direta em
   `shop_addresses`: loja com dois enderecos duplicaria cada oferta dela e
   inflaria a contagem. Agregar antes garante uma linha por loja. (Medido:
   nenhuma loja da base tem mais de um endereco hoje -- isto e guarda contra
   o dia em que tiver.)

   O laudo vem PIVOTADO em colunas em vez de uma linha por (loja, status):
   uma linha por loja mantem a paginacao em PAG_LOJAS e dimensionada. Foi a
   licao do run 50327, em que a moda devolvia uma linha por empate e bateu no
   teto sem ninguem ver.

   🚨 `laudo_nao_informado` NAO e o mesmo que `laudo_ausente`. O primeiro e
   laudo que existe e nao diz o resultado (78% dos laudos do banco); o
   segundo e veiculo sem laudo nenhum. Somar os dois apaga a diferenca. */
const UF_LOJA_AG =
  "(SELECT sa2.shop_id AS shop_id, MAX(sa2.state) AS state" +
  " FROM shop_addresses sa2 WHERE sa2.deleted_at IS NULL" +
  " GROUP BY sa2.shop_id) lu";

push('q_uf_laudo',
  "SELECT o." + LADO + " AS shop_id, COUNT(*) AS ofertas_base," +
  " SUM(CASE WHEN TRIM(COALESCE(ss.state, '')) <> ''" +
  " AND UPPER(TRIM(ss.state)) = UPPER(TRIM(lu.state)) THEN 1 ELSE 0 END) AS ofertas_mesma_uf," +
  " SUM(CASE WHEN vpr.id IS NULL THEN 1 ELSE 0 END) AS laudo_ausente," +
  " SUM(CASE WHEN vpr.situation = 'aprovado' THEN 1 ELSE 0 END) AS laudo_aprovado," +
  " SUM(CASE WHEN vpr.situation = 'aprovado_com_apontamento' THEN 1 ELSE 0 END) AS laudo_apontamento," +
  " SUM(CASE WHEN vpr.situation = 'reprovado' THEN 1 ELSE 0 END) AS laudo_reprovado," +
  " SUM(CASE WHEN vpr.situation = 'nao_informado' THEN 1 ELSE 0 END) AS laudo_nao_informado," +
  " SUM(CASE WHEN vpr.id IS NOT NULL AND TRIM(COALESCE(vpr.situation, '')) = ''" +
  " THEN 1 ELSE 0 END) AS laudo_vazio" +
  " FROM offers o" + JOIN_LOJA_CANAL +
  " INNER JOIN advertisements a ON a.id = o.advertisement_id AND a.deleted_at IS NULL" +
  " LEFT JOIN vehicles v ON v.id = a.vehicle_id" +
  " LEFT JOIN shop_stocks ss ON ss.id = COALESCE(a.shop_stock_id, v.shop_stock_id)" +
  " LEFT JOIN " + UF_LOJA_AG + " ON lu.shop_id = o." + LADO +
  " LEFT JOIN vehicle_precautionary_reports vpr" +
  " ON vpr.vehicle_id = a.vehicle_id AND vpr.deleted_at IS NULL" +
  " WHERE" + JANELA +
  " GROUP BY o." + LADO + " ORDER BY o." + LADO, PAG_LOJAS);

/* 🔴 REVERTIDO em 2026-09-23, mesmo dia: a fusao de q_modelo+q_categoria em
   `q_moda` (um LEFT JOIN duplo, duas modas lado a lado) rodou no run 53385
   e ESTOUROU O PRAZO NAS 27 PAGINAS -- "context deadline exceeded" em
   todas, 0 de 1.316 lojas cobertas nas duas. O banco parece nao
   compartilhar a varredura de offers/advertisements/vehicles entre os
   dois `ganhador()` independentes: junto, o dobro do trabalho de cada
   parte sozinha, e isso passou dos 60s do MCP. Separadas, cada uma corria
   dentro do prazo (medido em runs anteriores a esta sessao). A fusao de
   q_lojas (contato+cluster, acima) NAO teve esse problema -- rodou limpa
   no mesmo run 53385, 27 paginas, sem erro. So a moda voltou atras. */
function moda(nome, campo, tabela) {
  const AG =
    "(SELECT o." + LADO + " AS shop_id, v." + campo + " AS item_id, COUNT(*) AS n" +
    " FROM offers o" + JOIN_LOJA_CANAL +
    " INNER JOIN advertisements a ON a.id = o.advertisement_id AND a.deleted_at IS NULL" +
    " INNER JOIN vehicles v ON v.id = a.vehicle_id AND v.deleted_at IS NULL" +
    " WHERE" + JANELA + " AND v." + campo + " IS NOT NULL" +
    " GROUP BY o." + LADO + ", v." + campo + ")";
  /* UMA linha por loja. O GROUP BY externo com MIN(item_id) colapsa os
     empates no topo, e com isso:
       - o numero de linhas passa a ser conhecido (= lojas com moda), entao
         a paginacao volta a ser dimensionada em vez de chutada;
       - o desempate fica DETERMINISTICO. Antes quem desempatava era o
         `primeiraPorLoja` no Montar HTML, ficando com a linha que chegou
         primeiro -- dependia da ordem de paginacao, entao a mesma loja
         podia ter modelo diferente entre dois runs.
     Medido no run 50327: com uma linha por (loja, item), q_modelo bateu no
     teto de 1.400 e 47 lojas perderam o componente de modelo. */
  push(nome,
    "SELECT t.shop_id AS shop_id, t.item_id AS item_id, cat.name AS nome, t.n AS n" +
    " FROM (SELECT ag.shop_id AS shop_id, MIN(ag.item_id) AS item_id, MAX(ag.n) AS n" +
    " FROM " + AG + " ag" +
    " INNER JOIN (SELECT t2.shop_id AS shop_id, MAX(t2.n) AS mx FROM " + AG + " t2" +
    " GROUP BY t2.shop_id) top ON top.shop_id = ag.shop_id AND ag.n = top.mx" +
    " GROUP BY ag.shop_id) t" +
    " LEFT JOIN " + tabela + " cat ON cat.id = t.item_id" +
    " ORDER BY t.shop_id", PAG_LOJAS);
}
moda('q_modelo', 'model_id', 'models');
moda('q_categoria', 'category_id', 'categories');

/* ── os grupos de cada loja ────────
   Consulta DIRETA e separada: uma linha por loja, com os grupos numa coluna
   so (`GROUP_CONCAT`). Uma linha por (loja, grupo) teria contagem
   desconhecida e a paginacao voltaria a ser chute; assim ela cabe nas mesmas
   PAG_LOJAS das outras. O cruzamento com o evento e feito no Montar HTML.
   O FROM/WHERE vem pronto da fase 1, identico ao da contagem que confere
   esta coleta. Custo medido em 23/09: ~4,5s por passada, 1.309 lojas.
   Paginada por LOJAS, nao por LOJAS_GRUPO: sao ate LOJAS linhas (loja sem
   grupo nenhum nao aparece), entao a pagina que sobra, se sobrar, e uma. */
push('q_loja_grupos',
  "SELECT us.shop_id AS shop_id," +
  " GROUP_CONCAT(DISTINCT ucg.client_group_id ORDER BY ucg.client_group_id) AS grupos" +
  META_IN.grupo_loja_base +
  " GROUP BY us.shop_id ORDER BY us.shop_id", PAG_LOJAS);

/* ── guardas ──────── */
/* Sem regex de proposito. Este arquivo viaja ate o n8n como string JSON
   escapada, transcrita a mao, e barra invertida e onde este projeto erra:
   escapar uma vez a mais gera "Invalid regular expression" e derruba o run
   inteiro (aconteceu na execucao 49963). indexOf nao tem esse risco -- e
   por isso nem este comentario usa barra invertida. */
function temJanela(sql) {
  const u = String(sql).toUpperCase();
  return u.indexOf('OVER (') >= 0 || u.indexOf('OVER(') >= 0;
}
const comJanela = Q.filter((q) => temJanela(q.sql));
if (comJanela.length) {
  throw new Error('funcao de janela detectada (o MCP rejeita): ' + comJanela[0].queryName);
}
if (PAGE > 50) throw new Error('PAGE > 50: o MCP corta a resposta em 50 linhas');

const META = {
  selecao: SELECAO,
  ultima_neg: ULTIMA_NEG,
  status_ok: META_IN.status_ok,
  agora_br: AGORA_BR,
  janela_ini: JANELA_INI,
  janela_fim: JANELA_FIM,
  /* o cabecalho do relatorio decide a frase do recorte por eventos_ids: com
     lista, as datas nao valem e anunciar janela seria mentira. Este no
     reconstroi o META do zero -- ja esqueci de repassar campo duas vezes, e
     as duas o efeito foi um valor `undefined` que ninguem viu. */
  eventos_ids: META_IN.eventos_ids,
  horas_adiante: META_IN.horas_adiante,
  whitelabels: META_IN.whitelabels,
  wl_esperado: META_IN.wl_esperado,
  wl_nomes_banco: leitura('q_wl_nomes'),
  moda_lojas: leitura('q_moda_lojas')[0] || {},
  eventos: eventos,
  evento_wl: eventoWl,
  evento_grupo: eventoGrupo,
  esperado_lojas_grupo: Number.isFinite(LOJAS_GRUPO) ? LOJAS_GRUPO : null,
  por_status: porStatus,
  meses_historico: META_IN.meses_historico,
  /* o corte de outlier viaja pro glossario: numero descartado em silencio e
     pior que numero errado */
  desagio_min: DESAGIO_MIN,
  desagio_max: DESAGIO_MAX,
  data_ini: DATA_INI,
  page: PAGE,
  lado: LADO,
  esperado_veiculos: VEICULOS,
  esperado_negociacoes: vt.negociacoes === undefined ? null : Number(vt.negociacoes),
  esperado_lojas: LOJAS,
  esperado_ofertas: lt.ofertas === undefined ? null : Number(lt.ofertas),
  pag_veic: PAG_VEIC,
  pag_lojas: PAG_LOJAS,
  cobertura_valor: valor,
  chamadas: Q.length + 4
};

return Q.map((q, i) => ({
  json: { queryName: q.queryName, database: q.database, sql: q.sql, pagina: q.pagina, idx: i, total: Q.length, meta: META }
}));
