/* ══════════════════════════════════════════════════════════════════════
   NÓ "Montar Consultas" — Painel de Precificação

   Carros NÃO VENDIDOS da Cars2You cadastrados nos últimos 30 dias, em
   evento passado, ativo ou futuro (Thomas, 14/10/2026). O modelo de preço
   (automations/precificacao/preditivo) é aplicado a cada um no Montar Painel
   e comparado ao VMV do cliente.

   Só a Cars2You: o MCP do n8n não alcança o banco da Dealers (14/10).

   Cada consulta devolve UMA linha:
       SELECT COUNT(*) AS total, JSON_ARRAYAGG(JSON_ARRAY(...)) AS linhas
   O teto de 50 linhas do MCP deixa de existir. O total sai da MESMA
   varredura: se o pacote chegar menor, o Montar Painel derruba o run.

   ─── AS COLUNAS SÃO AS DO TREINO ─────────────────────────────────────
   O modelo aprendeu com as colunas de roda-estudo.py (o "analítico").
   Mesmo nome, mesma expressão: grupo = MARCA + MODELO normalizados, laudo =
   MAX(situation) por veículo, canal = whitelabel da loja VENDEDORA. Trocar
   uma expressão aqui muda a variável que o modelo recebe sem dar erro.
   data_venda, no carro não vendido, é o fim da oferta da negociação atual —
   o mesmo campo que, na venda, deu a idade do carro.

   ─── NÃO VENDIDO ─────────────────────────────────────────────────────
   A ÚLTIMA negociação do veículo (MAX(id), não deletada) fora de 2, 3 e 7.
   "Última" porque o carro reofertado tem várias; contar qualquer uma
   pegaria o que vendeu numa reoferta.

   ─── FUSO ────────────────────────────────────────────────────────────
   O banco responde NOW() em UTC e grava data de evento em hora de Brasília.
   O piso e o "agora" são calculados aqui e viajam como literal.

   ⚠️ Este arquivo viaja pro n8n como string: sem barra invertida e sem
   regex, de propósito (automations/n8n-sdk/README.md).
   ══════════════════════════════════════════════════════════════════════ */

const DIAS = 30;                 /* "cadastrados no último mês" */
const PARTES = 10;               /* veículos em partes pelo resto do id: medido em 14/10, 4 partes davam
                                    ~280 KB cada; com 10, ~115 KB, abaixo dos 130 KB que o MCP já passou */
const FUSO_MIN = -180;           /* America/Sao_Paulo, sem horário de verão */
const DB = 'cars2you_production';

const pad = (n) => String(n).padStart(2, '0');
const dataDe = (d) => d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
const agora = new Date(Date.now() + FUSO_MIN * 60000);
const AGORA_BR = dataDe(agora) + ' ' + pad(agora.getUTCHours()) + ':' + pad(agora.getUTCMinutes());
const PISO = dataDe(new Date(agora.getTime() - DIAS * 86400000)) + ' 00:00:00';

const MARCA = "UPPER(TRIM(COALESCE(b.name, '(sem marca)')))";
const MODELO = "UPPER(TRIM(COALESCE(m.name, '(sem modelo)')))";
const DATA = (c) => "DATE_FORMAT(" + c + ", '%Y-%m-%d %H:%i')";

/* o universo: a última negociação de cada veículo cadastrado desde o piso */
const ULTIMA = " INNER JOIN (SELECT a2.vehicle_id AS vid, MAX(an2.id) AS ult" +
  " FROM advertisement_negotiations an2" +
  " INNER JOIN advertisements a2 ON a2.id = an2.advertisement_id" +
  " INNER JOIN vehicles v2 ON v2.id = a2.vehicle_id" +
  " WHERE an2.deleted_at IS NULL AND v2.deleted_at IS NULL" +
  " AND v2.created_at >= '" + PISO + "'" +
  " GROUP BY a2.vehicle_id) u ON u.ult = an.id";
const NAO_VENDIDO = " an.status NOT IN (2, 3, 7)";

const UNIVERSO = " FROM advertisement_negotiations an" + ULTIMA +
  " INNER JOIN advertisements a ON a.id = an.advertisement_id" +
  " INNER JOIN vehicles v ON v.id = a.vehicle_id" +
  " INNER JOIN events e ON e.id = an.event_id AND e.deleted_at IS NULL";

const VEICULOS_DE = UNIVERSO +
  " LEFT JOIN versions ver ON ver.id = v.version_id" +
  " LEFT JOIN shop_stocks ss ON ss.id = v.shop_stock_id" +
  " LEFT JOIN models m ON m.id = v.model_id" +
  " LEFT JOIN brands b ON b.id = v.brand_id" +
  " LEFT JOIN categories cat ON cat.id = v.category_id" +
  " LEFT JOIN shops s ON s.id = v.shop_id" +
  " LEFT JOIN bodyworks bw ON bw.id = v.bodywork_id" +
  " LEFT JOIN colors c ON c.id = v.color_id" +
  " LEFT JOIN driver_shifts dsh ON dsh.id = v.drive_shift_id" +
  " LEFT JOIN fuels f ON f.id = v.fuel_id" +
  /* laudo: MAX(situation) como no treino; o id mais recente dá o PDF */
  " LEFT JOIN (SELECT vpr0.vehicle_id AS vid, MAX(vpr0.situation) AS sit, MAX(vpr0.id) AS lid" +
  " FROM vehicle_precautionary_reports vpr0" +
  " INNER JOIN vehicles v3 ON v3.id = vpr0.vehicle_id" +
  " WHERE vpr0.deleted_at IS NULL AND v3.created_at >= '" + PISO + "'" +
  " GROUP BY vpr0.vehicle_id) lau ON lau.vid = v.id" +
  " LEFT JOIN vehicle_precautionary_reports vpr ON vpr.id = lau.lid";

const COLS_VEICULO = [
  ['veiculo_id', 'v.id'], ['negociacao_id', 'an.id'], ['anuncio_id', 'a.id'],
  ['status', 'an.status'], ['evento_id', 'an.event_id'],
  ['grupo', "CONCAT(" + MARCA + ", ' ', " + MODELO + ")"],
  ['marca', 'b.name'], ['modelo', 'm.name'], ['versao', 'ver.name'],
  ['valor_fipe_anuncio', 'a.fipe_price'], ['km', 'v.km'],
  ['ano_modelo', 'v.model_year'], ['ano_fabricacao', 'v.manufacture_year'],
  ['data_venda', DATA('an.finish_date_offer')],
  ['patio', 'ss.name'], ['patio_uf', 'ss.state'],
  ['whitelabel_id', 's.whitelabel_id'], ['loja_id', 's.id'], ['loja', 's.name'],
  ['categoria', 'cat.name'], ['laudo', 'lau.sit'], ['laudo_url', 'vpr.file_url'],
  ['descricao', 'v.description'],
  ['cor', 'c.name'], ['cambio', 'dsh.name'], ['combustivel', 'f.name'], ['carroceria', 'bw.name'],
  /* o VMV é para o CONFRONTO na tela; o modelo não o recebe (regra do projeto) */
  ['vmv', 'an.min_sale_price'],
  ['cadastro', DATA('v.created_at')]
];

/* o evento: canais (whitelabels) para o filtro, e o calendário, que é
   variável do modelo — duração da oferta, dia da semana (0 = segunda, o
   WEEKDAY do MySQL, igual ao Python do treino) e hora do fechamento */
const COLS_EVENTO = [
  ['evento_id', 'e.id'], ['nome', 'e.name'], ['situacao', 'e.status'],
  ['inicio', DATA('e.start_date_offer')], ['fim', DATA('e.finish_date_event')],
  ['dias', 'TIMESTAMPDIFF(SECOND, e.start_date_offer, e.finish_date_event) / 86400'],
  ['dia_semana', 'WEEKDAY(e.finish_date_event)'], ['hora', 'HOUR(e.finish_date_event)'],
  ['canais', "(SELECT JSON_ARRAYAGG(JSON_ARRAY(w.id, w.name)) FROM event_whitelabels ew" +
             " INNER JOIN whitelabels w ON w.id = ew.whitelabel_id WHERE ew.event_id = e.id)"]
];
const EVENTOS_DE = " FROM events e WHERE e.id IN (SELECT an.event_id" + UNIVERSO + " WHERE" + NAO_VENDIDO + ")";

const TABELAS = [];
for (let p = 0; p < PARTES; p++) {
  TABELAS.push({ nome: 'veiculos_p' + p, cols: COLS_VEICULO,
    de: VEICULOS_DE + " WHERE" + NAO_VENDIDO + " AND MOD(v.id, " + PARTES + ") = " + p });
}
TABELAS.push({ nome: 'eventos', cols: COLS_EVENTO, de: EVENTOS_DE });

/* ── guardas ────────────────────────────────────────────────────────── */
function temJanela(sql) {
  const u = String(sql).toUpperCase();
  return u.indexOf('OVER (') >= 0 || u.indexOf('OVER(') >= 0;
}
/* nenhuma coluna de placa, chassi, renavam ou documento sai daqui */
function temPii(sql) {
  const u = String(sql).toLowerCase();
  return ['plate', 'chassi', 'renavam', 'document', 'cpf', 'cnpj'].some((p) => u.indexOf(p) >= 0);
}

return TABELAS.map((t, i) => {
  const sql = "SELECT COUNT(*) AS total, JSON_ARRAYAGG(JSON_ARRAY(" +
    t.cols.map((c) => c[1]).join(', ') + ")) AS linhas" + t.de;
  if (temJanela(sql)) throw new Error('funcao de janela em ' + t.nome + ' (o MCP rejeita)');
  if (temPii(sql)) throw new Error('coluna de PII em ' + t.nome);
  return {
    json: {
      queryName: t.nome, database: DB, sql: sql, cols: t.cols.map((c) => c[0]), idx: i,
      meta: { piso: PISO, agora_br: AGORA_BR, dias: DIAS, partes: PARTES }
    }
  };
});
