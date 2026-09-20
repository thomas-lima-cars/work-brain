/* ══════════════════════════════════════════════════════════════════════
   NÓ "Montar Fase 1" — dimensiona antes de coletar

   Relatório de veículos em evento, com as lojas mais aderentes a cada um.

   ─── COMO ESCOLHER OS EVENTOS ─────────────────────────────────────────
   Duas formas, e só uma vale por vez:

     EVENTOS_IDS = [23860, 23861]   -> analisa exatamente esses
     EVENTOS_IDS = []               -> vale a janela de datas abaixo

   O padrão hoje é a JANELA DE 7 DIAS pedida em 2026-09-18: piso na
   meia-noite de hoje e teto em +168h — "os eventos que encerram em até 7
   dias a partir da data de atualização".

   ⚠️ O EIXO DO RELATÓRIO MUDOU AQUI. Até 17/09 a janela era aberta (piso
   fixo em 09/09, teto nenhum) e o relatório respondia "o que passou pelo
   evento e não vendeu" — a sobra. Agora ele responde "o que vai encerrar e
   ainda dá pra empurrar". Medido sobre o run 50406 antes de valer: dos
   1.221 veículos ficam 493, porque saem os 726 de evento já encerrado, dos
   quais 723 eram sobra. Comparar contagem com run anterior a 18/09 não faz
   sentido — é outra pergunta, não a mesma base menor.

   PISO NA MEIA-NOITE e TETO NO FIM DO DIA, não no relógio da coleta. No run 50406, às 17:24, nove
   eventos tinham encerrado entre 14h e 16h do MESMO dia, com 625 veículos
   — 51% da base. Com piso no relógio, o relatório encolheria conforme a
   hora em que roda. Quem faz isso é INCLUI_ENCERRADOS_HOJE de um lado e
   TETO_FIM_DO_DIA do outro — sem ele, evento que encerra no sétimo dia às
   20h fica de fora hoje e entra amanhã, pelo mesmo motivo invertido.

   SEM FILTRO DE e.status, decidido em 18/09 junto com a janela. Ele não
   removeria nada que a janela já não remova (zero eventos com status != 1
   têm fim no futuro, medido no 50406) e o status ATRASA: os mesmos nove
   eventos acima ainda estavam com status 1 horas depois de encerrados.
   Confiar nele seria um jeito silencioso de perder evento.

   Os outros modos continuam de pé e provados:
     PISO_FIXO = 'AAAA-MM-DD'  -> piso fixo naquele dia, ignora hoje
     HORAS_ADIANTE = 0         -> teto some, volta a janela aberta

   ⚠️ FUSO: o banco responde NOW() em UTC, mas grava as datas dos eventos em
   hora de Brasília — medido na sonda 49954. Por isso o recorte é calculado
   aqui e vai como literal; NÃO troque por NOW()/CURDATE(), que às 21h de
   Brasília já apontam para o dia seguinte e cortam o dia inteiro.

   ─── POR QUE UMA FASE SÓ PRA CONTAR ───────────────────────────────────
   O `OFFSET` faz o banco re-executar a query inteira a cada página, então
   página que sobra custa um agregado completo e devolve zero linha. Na
   execução 49803 isso queimou 170 chamadas. Contando antes, a fase 2
   monta exatamente ceil(n / 50) páginas.

   Limites do MCP já medidos (automations/n8n-sdk/README.md):
   sem função de janela, resposta cortada em 50 linhas, deadline de 60s.
   ══════════════════════════════════════════════════════════════════════ */

/* Vazia = vale a janela de datas. Preenchida, as datas nao valem: SELECAO
   vira `e.id IN (...)` e nao importa que dia e hoje -- util pra reanalisar
   uma edicao especifica. Ficou pregada nos nove eventos de 09/09 por um
   tempo, o que fazia todo run devolver aquele recorte em vez da regra. */
const EVENTOS_IDS = [];
/* Piso fixo em hora de Brasilia. VAZIO desde 18/09: o piso passou a ser a
   meia-noite de HOJE, que anda com a data de atualizacao. Preencher aqui
   prega o recorte num dia e o relatorio para de acompanhar o calendario --
   foi o que aconteceu entre 10 e 18/09 com '2026-09-09'. */
const PISO_FIXO = '';
/* Teto do recorte: 7 dias x 24h (pedido de 18/09). 0 = SEM TETO, que era o
   modo anterior e trazia a cauda longa (evento terminando em 2027). */
const HORAS_ADIANTE = 168;
/* O teto fecha no FIM DO DIA alcancado, nao no relogio da coleta.
   Simetrico ao piso, e pelo mesmo motivo: com o teto em "agora + 168h", um
   evento que encerra no setimo dia as 20h fica de fora hoje e entra amanha,
   e o relatorio passa a depender da hora em que roda. */
const TETO_FIM_DO_DIA = true;
const INCLUI_ENCERRADOS_HOJE = true;  /* pedido em 2026-09-09 - ver nota abaixo */

/* ─── OS CANAIS QUE CONTAM (pedido de 2026-09-11) ────────────────────
   Só estes seis whitelabels entram na base — evento que não alveja nenhum
   deles fica fora, e loja de outro canal sai do universo.

   Por ID, não por nome: renomear um canal no banco quebraria um filtro por
   nome em silêncio. Os seis ids foram confirmados pelo Thomas em
   2026-09-11; antes disso, 48 e 65 vinham da documentação do brain, que os
   declara inferidos, e não apareciam na janela para conferir pelo dado.

   A `q_wl_nomes` continua valendo como guarda: id trocado não dá erro de
   SQL, só devolve base menor e plausível. Ela detecta mudança futura.

   Lista vazia = sem restrição de canal. */
const WHITELABELS = [4, 7, 43, 48, 62, 65];
const WL_ESPERADO = {
  4: 'Trucks2you',
  7: 'Marketplace Cars2You',
  43: 'Canal de vendas C6 Auto',
  48: 'Colaboradores C6',
  62: 'Lance Fácil BTB',
  65: 'Lance Fácil BTB Associados'
};
const WL_IN = WHITELABELS.join(',');
/* o evento precisa alvejar pelo menos um dos seis */
const SO_WL_EVENTO = WHITELABELS.length
  ? " AND EXISTS (SELECT 1 FROM event_whitelabels ew2" +
    " WHERE ew2.event_id = e.id AND ew2.whitelabel_id IN (" + WL_IN + "))"
  : "";
/* e a loja compradora precisa pertencer a um deles */
const SO_WL_LOJA = WHITELABELS.length
  ? " AND s.whitelabel_id IN (" + WL_IN + ")"
  : "";
/* usado nas duas consultas de event_whitelabels, que precisam contar a
   mesma coisa uma que a outra */
const SO_WL_EW = WHITELABELS.length
  ? " AND ew.whitelabel_id IN (" + WL_IN + ")"
  : "";
const MESES_HISTORICO = 6;   /* janela do perfil de compra das lojas */
const PAGE = 50;             /* teto duro do MCP. NÃO aumentar */
const LADO = 'buyer_shop_id';  /* a loja que DEU o lance */

/* ─── RELOGIO ────────────────────────────────────────────────────────────
   O banco responde NOW() em UTC (medido: sonda 49954, q_relogio devolveu
   2026-09-10 01:51 quando em Brasilia eram 22:51 do dia 9). Mas as datas
   dos eventos estao gravadas em hora de Brasilia. Entao NADA aqui pode
   usar NOW()/CURDATE() do banco pra recortar evento: o piso e o teto sao
   calculados aqui, em hora de Brasilia, e viajam como literal.

   O deslocamento e feito sobre o epoch e lido com getUTC*, entao o fuso do
   processo do n8n (tambem UTC) nao interfere. */
const FUSO_MIN = -180;               /* America/Sao_Paulo, sem horario de verao */
const pad = (n) => String(n).padStart(2, '0');
const now = new Date(Date.now() + FUSO_MIN * 60000);
const dataDe = (d) => d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
const horaDe = (d) => dataDe(d) + ' ' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':00';

const AGORA_BR = horaDe(now);
const HOJE_BR = dataDe(now);
const ini = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - MESES_HISTORICO, now.getUTCDate()));
const DATA_INI = dataDe(ini);

/* piso = meia-noite de hoje em Brasilia, pra evento que ja encerrou hoje
   continuar na base; teto = agora + HORAS_ADIANTE, tambem em Brasilia */
const PISO = PISO_FIXO
  ? (PISO_FIXO + ' 00:00:00')
  : (INCLUI_ENCERRADOS_HOJE ? (HOJE_BR + ' 00:00:00') : AGORA_BR);
/* string vazia = sem teto, e a clausula nem entra no SQL */
const ALVO_TETO = new Date(now.getTime() + HORAS_ADIANTE * 3600000);
const TETO = HORAS_ADIANTE > 0
  ? (TETO_FIM_DO_DIA ? (dataDe(ALVO_TETO) + ' 23:59:59') : horaDe(ALVO_TETO))
  : '';

/* o filtro de evento, montado uma vez e reusado na fase 2.
   Erro que ja cometi: com o piso em NOW(), evento que fechou mais cedo no
   mesmo dia some, e eu respondi "nenhum evento finaliza hoje" quando nove
   ja tinham fechado. O piso agora e a meia-noite de hoje em Brasilia. */
/* Repare que NAO ha filtro de e.status aqui.
   Evento encerrado tem status 0 (medido na sonda 49961: os nove do dia
   09/09 estao todos assim). Exigir status 1 excluiria justamente o que o
   INCLUI_ENCERRADOS_HOJE quer trazer -- a janela abriria e nada entraria.

   Quem filtra de verdade e o status da ULTIMA negociacao de cada veiculo,
   la embaixo: evento cancelado deixa suas negociacoes em status 10, que
   nao esta na lista, entao o carro cai fora por si. Filtrar pelo evento
   seria redundante e, aqui, prejudicial. */
/* o recorte de canal vale nos DOIS modos: "manter na base somente estes
   whitelabels" e regra da base inteira, nao do modo de selecao. */
const SELECAO = (EVENTOS_IDS.length
  ? " e.deleted_at IS NULL AND e.id IN (" + EVENTOS_IDS.join(',') + ")"
  : " e.deleted_at IS NULL" +
    (INCLUI_ENCERRADOS_HOJE ? "" : " AND e.status = 1") +
    " AND e.finish_date_event >= '" + PISO + "'" +
    (TETO ? " AND e.finish_date_event <= '" + TETO + "'" : "")) + SO_WL_EVENTO;

/* ─── QUAL VEÍCULO CONTA ──────────────────────────────────────────────
   Uma linha por VEÍCULO, com o status da ÚLTIMA negociação dele — não uma
   linha por negociação. O mesmo carro aparece em vários eventos (os feirões
   LM são diários e reciclam estoque), e contar por negociação o duplicava.

   A ordem importa e é fácil de inverter sem perceber: primeiro acha a
   última negociação, DEPOIS olha o status dela. Filtrar status antes faria
   um carro vendido hoje reaparecer como disponível pela negociação de
   ontem, que ficou em "Sem Ofertas".

   Domínio de status informado pelo Thomas em 2026-09-09 (ver
   context/banco-de-dados/dominios.md). Entram:

     1  Ativo              — em evento aberto
     11 Sem Ofertas        — sobrou: ninguém deu lance
     14 Vendedor Rejeitou  — sobrou: recusou a oferta
     15 Comprador Rejeitou — sobrou: comprador desistiu
     18 Venda Cancelada    — sobrou: a venda caiu depois de fechada

   Ficam de fora 9 e 13 (Em Análise Comprador/Vendedor): há oferta viva, e
   ranquear loja aí atrapalha negócio em andamento. Fora também 2, 3 e 7
   (venda) e 8, 10 (suspenso, cancelado). */
const STATUS_OK = [1, 11, 14, 15, 18];
const DISPONIVEL = " an.deleted_at IS NULL AND an.status IN (" + STATUS_OK.join(',') + ")";

/* a última negociação de cada veículo dentro da janela de eventos.
   MAX(an.id) porque o MCP rejeita função de janela — mesmo padrão que o
   q_perfil já usa para achar a última oferta. Repare que aqui NÃO há
   filtro de status: é a última de verdade, não a última entre as boas. */
const ULTIMA_NEG =
  "(SELECT a.vehicle_id AS vehicle_id, MAX(an.id) AS neg_id" +
  " FROM advertisement_negotiations an" +
  " INNER JOIN events e ON e.id = an.event_id AND" + SELECAO +
  " INNER JOIN advertisements a ON a.id = an.advertisement_id AND a.deleted_at IS NULL" +
  " WHERE an.deleted_at IS NULL" +
  " GROUP BY a.vehicle_id) u";

const JANELA_OFERTAS =
  " o.deleted_at IS NULL AND o." + LADO + " IS NOT NULL" +
  " AND o.created_at >= '" + DATA_INI + "' AND o.price > 0";

const Q = [];
function push(nome, sql, pages) {
  const n = pages === undefined ? 1 : pages;
  for (let p = 0; p < n; p++) {
    Q.push({
      queryName: nome, database: 'cars2you_production',
      sql: sql + ' LIMIT ' + PAGE + ' OFFSET ' + (p * PAGE), pagina: p
    });
  }
}

/* quantos eventos o recorte pegou -- gabarito da paginacao da q_eventos.
   Existe desde 18/09: a q_eventos rodava com uma pagina so, e o teto de 50
   linhas do MCP cortava em silencio. No run 50406 a janela aberta tinha
   mais de 50 eventos, e o 21746 ("Em preparacao Net Carros", fim em 2027)
   tinha veiculo no relatorio e NAO estava na lista -- some do filtro da
   pagina e do cabecalho, sem erro nenhum. */
push('q_ev_total',
  "SELECT COUNT(*) AS eventos FROM events e WHERE" + SELECAO);

/* quais eventos o recorte pegou.
   4 paginas = 200 eventos. Numero escolhido, mas VERIFICADO: a fase 2
   confere contra q_ev_total e mata o run se faltar pagina. Com a janela de
   7 dias sao ~18; com a janela aberta passavam de 50. */
push('q_eventos',
  "SELECT e.id AS evento_id, e.name AS evento, e.status AS ev_status," +
  " DATE_FORMAT(e.start_date_display, '%Y-%m-%d %H:%i') AS ini_display," +
  " DATE_FORMAT(e.finish_date_event, '%Y-%m-%d %H:%i') AS fim_evento" +
  " FROM events e WHERE" + SELECAO + " ORDER BY e.finish_date_event", 4);

/* quantos veículos disponíveis — dimensiona a paginação da fase 2 */
push('q_veic_total',
  "SELECT COUNT(*) AS veiculos, COUNT(*) AS negociacoes," +
  " COUNT(DISTINCT an.event_id) AS eventos" +
  " FROM " + ULTIMA_NEG +
  " INNER JOIN advertisement_negotiations an ON an.id = u.neg_id" +
  " INNER JOIN vehicles v ON v.id = u.vehicle_id AND v.deleted_at IS NULL" +
  " WHERE" + DISPONIVEL);

/* quantos veículos a janela tem por status da última negociação — mostra
   quanto do total é sobra de evento encerrado e quanto está em evento
   aberto. Vai para a tela como leitura, não entra em nenhum cálculo. */
push('q_por_status',
  "SELECT an.status AS status, COUNT(*) AS veiculos" +
  " FROM " + ULTIMA_NEG +
  " INNER JOIN advertisement_negotiations an ON an.id = u.neg_id" +
  " INNER JOIN vehicles v ON v.id = u.vehicle_id AND v.deleted_at IS NULL" +
  " GROUP BY an.status ORDER BY veiculos DESC");

/* quantos pares evento x whitelabel existem. Nao dimensiona a paginacao
   daqui (a fase 1 nao le resultado), mas deixa a fase 2 CONFERIR se a
   q_evento_wl veio inteira -- ver a nota na paginacao dela, abaixo. */
push('q_evwl_total',
  "SELECT COUNT(*) AS pares" +
  " FROM event_whitelabels ew" +
  " INNER JOIN events e ON e.id = ew.event_id AND" + SELECAO +
  " WHERE 1 = 1" + SO_WL_EW);

/* o banco confirma que cada id e o canal que eu penso que e. Sem isto, um
   id errado tiraria um canal inteiro da base e o relatorio sairia menor sem
   uma linha de aviso. */
push('q_wl_nomes',
  "SELECT w.id AS whitelabel_id, w.name AS whitelabel" +
  " FROM whitelabels w WHERE w.id IN (" + WL_IN + ") ORDER BY w.id");

/* quantas lojas TEM moda de modelo e quantas TEM moda de categoria.
   Serve pra conferir cobertura das duas consultas de moda, que sao as
   unicas que podem passar do numero de lojas (empate no topo rende mais de
   uma linha por loja) e por isso nao dao pra dimensionar por contagem de
   linha. A conferencia e por LOJA DISTINTA. */
push('q_moda_lojas',
  "SELECT COUNT(DISTINCT CASE WHEN v.model_id IS NOT NULL THEN o." + LADO + " END) AS lojas_modelo," +
  " COUNT(DISTINCT CASE WHEN v.category_id IS NOT NULL THEN o." + LADO + " END) AS lojas_categoria" +
  " FROM offers o" +
  " INNER JOIN shops s ON s.id = o." + LADO + " AND s.deleted_at IS NULL" + SO_WL_LOJA +
  " INNER JOIN advertisements a ON a.id = o.advertisement_id AND a.deleted_at IS NULL" +
  " INNER JOIN vehicles v ON v.id = a.vehicle_id AND v.deleted_at IS NULL" +
  " WHERE" + JANELA_OFERTAS);

/* quantas lojas têm histórico de oferta — dimensiona o perfil */
/* o INNER JOIN em shops entra por causa do recorte de canal. Ele e o
   gabarito que dimensiona a q_lojas da fase 2 -- os dois PRECISAM ter o
   mesmo filtro, senao a paginacao sobra (pagina vazia custa um agregado
   inteiro) ou falta (coleta incompleta, que a completude acusa). */
push('q_lojas_total',
  "SELECT COUNT(DISTINCT o." + LADO + ") AS lojas, COUNT(*) AS ofertas" +
  " FROM offers o" +
  " INNER JOIN shops s ON s.id = o." + LADO + " AND s.deleted_at IS NULL" + SO_WL_LOJA +
  " WHERE" + JANELA_OFERTAS);

/* o value_actual está preenchido? O Thomas escolheu ele como preço do
   veículo; se vier nulo ou zero na maioria, o relatório nasce cego. */
push('q_valor',
  "SELECT COUNT(*) AS negociacoes," +
  " SUM(CASE WHEN an.value_actual IS NULL THEN 1 ELSE 0 END) AS sem_valor," +
  " SUM(CASE WHEN an.value_actual = 0 THEN 1 ELSE 0 END) AS valor_zero," +
  " ROUND(MIN(NULLIF(an.value_actual, 0)), 2) AS minimo," +
  " ROUND(AVG(NULLIF(an.value_actual, 0)), 2) AS media," +
  " ROUND(MAX(an.value_actual), 2) AS maximo," +
  " ROUND(AVG(NULLIF(an.initial_price_reference, 0)), 2) AS media_inicial," +
  " ROUND(AVG(NULLIF(a.fipe_price, 0)), 2) AS media_fipe" +
  " FROM " + ULTIMA_NEG +
  " INNER JOIN advertisement_negotiations an ON an.id = u.neg_id" +
  " INNER JOIN advertisements a ON a.id = an.advertisement_id AND a.deleted_at IS NULL" +
  " WHERE" + DISPONIVEL);

/* quais whitelabels cada evento alveja.
   É a regra de elegibilidade: um veículo só pode casar com loja do MESMO
   whitelabel do evento dele E da mesma UF. Um evento pode alvejar vários
   whitelabels via event_whitelabels, então isto é 1:N, não 1:1. */
push('q_evento_wl',
  "SELECT ew.event_id AS evento_id, ew.whitelabel_id AS whitelabel_id," +
  " w.name AS whitelabel" +
  " FROM event_whitelabels ew" +
  " INNER JOIN events e ON e.id = ew.event_id AND" + SELECAO +
  " LEFT JOIN whitelabels w ON w.id = ew.whitelabel_id" +
  " WHERE 1 = 1" + SO_WL_EW +
  /* 8 paginas, nao 4: as 4 anteriores dimensionavam NOVE eventos, e a
     janela aberta traz 47. Numero escolhido, mas VERIFICADO -- a fase 2
     confere contra q_evwl_total e mata o run se faltar pagina, em vez de
     deixar veiculo perder whitelabel calado. Barato por ser join simples,
     nao agregado: pagina vazia nao custa um GROUP BY inteiro. */
  " ORDER BY ew.event_id, ew.whitelabel_id", 8);

if (PAGE > 50) throw new Error('PAGE > 50: o MCP corta a resposta em 50 linhas');

const META = {
  selecao: SELECAO,
  ultima_neg: ULTIMA_NEG,
  status_ok: STATUS_OK,
  agora_br: AGORA_BR,
  janela_ini: PISO,
  janela_fim: TETO,
  disponivel: DISPONIVEL,
  whitelabels: WHITELABELS,
  wl_esperado: WL_ESPERADO,
  so_wl_loja: SO_WL_LOJA,
  eventos_ids: EVENTOS_IDS,
  horas_adiante: EVENTOS_IDS.length ? null : HORAS_ADIANTE,
  meses_historico: MESES_HISTORICO,
  data_ini: DATA_INI,
  page: PAGE,
  lado: LADO
};

return Q.map((q, i) => ({
  json: { queryName: q.queryName, database: q.database, sql: q.sql, pagina: q.pagina, idx: i, total: Q.length, meta: META }
}));
