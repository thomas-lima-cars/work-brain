/* ÍNDICE DE CONFIANÇA POR CÓDIGO FIPE — etapa 1 do estudo de precificação.
 *
 * Uso: node analisa-confianca.js [dados-51070.json]
 *
 * "Mais vendido" NÃO é o mesmo que "mais confiável". Um código com 87 vendas e
 * desvio 0,69 diz menos sobre o próximo carro do que um com 106 vendas e desvio
 * 0,05. O que decide é o ERRO PADRÃO da média — dp / raiz(n) — porque ele junta
 * as duas coisas: quanto de amostra existe e quanto ela varia.
 *
 * O ranking final é pela meia-largura do intervalo de 95% (1,96 x erro padrão),
 * em pontos percentuais da FIPE. Lê-se direto: "±1,0 p.p." é a precisão com que
 * sabemos o patamar daquele código.
 */
const fs = require('fs');
const arq = process.argv[2] || 'dados-51070.json';
const D = JSON.parse(fs.readFileSync(arq, 'utf8'));

const n = (x) => Number(x || 0);
const br = (x, d) => x.toLocaleString('pt-BR', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
const pct = (x) => (x * 100).toFixed(1).replace('.', ',') + '%';

/* ── 1. o funil: onde cada veículo parou ─────────────────────────────── */
const NOME = {
  1: 'Ativo', 2: 'Aguardando Pagamento', 3: 'Aguard. Confirmação', 7: 'Vendido',
  8: 'Suspenso', 9: 'Em Análise Comprador', 10: 'Cancelado', 11: 'Sem Ofertas',
  13: 'Em Análise Vendedor', 14: 'Vendedor Rejeitou', 15: 'Comprador Rejeitou',
  18: 'Venda Cancelada'
};
const VENDA = [2, 3, 7];
const funil = D.q_ultimo_status;
const totalVeic = funil.reduce((s, r) => s + n(r.veiculos), 0);
const vendidos = funil.filter((r) => VENDA.indexOf(r.status) >= 0)
  .reduce((s, r) => s + n(r.veiculos), 0);

console.log('\n═══ O FUNIL — último status válido de cada veículo (todo o histórico) ═══\n');
console.log('  status                       veículos      %');
console.log('  ' + '-'.repeat(52));
funil.forEach((r) => {
  const rot = (r.status === null ? '(nulo)' : r.status + ' ' + (NOME[r.status] || '?'));
  const marca = VENDA.indexOf(r.status) >= 0 ? ' *' : '';
  console.log('  ' + rot.padEnd(28) + br(n(r.veiculos)).padStart(8) +
    '  ' + pct(n(r.veiculos) / totalVeic).padStart(6) + marca);
});
console.log('  ' + '-'.repeat(52));
console.log('  * = venda.  ' + br(vendidos) + ' de ' + br(totalVeic) +
  ' veículos = ' + pct(vendidos / totalVeic) + ' de conversão.');

/* ── 2. o que a correção da definição mudou ──────────────────────────── */
const s = D.q_sizing[0];
const antiga = n(D.q_delta[0].veiculos_com_alguma_venda);
const nova = n(s.veiculos_vendidos);
console.log('\n═══ O QUE A CORREÇÃO DA DEFINIÇÃO MUDOU (janela de 12 meses) ═══\n');
console.log('  definição antiga (qualquer negociação 2/3/7): ' + br(antiga));
console.log('  definição do Thomas (ÚLTIMA linha 2/3/7):     ' + br(nova));
console.log('  diferença: ' + br(antiga - nova) + ' veículos (' +
  pct((antiga - nova) / antiga) + ') venderam e a venda caiu depois.');

/* ── 3. os degraus de perda até a linha utilizável ───────────────────── */
console.log('\n═══ DEGRAUS DE PERDA — de "vendido" até "utilizável no estudo" ═══\n');
const degraus = [
  ['veículos vendidos', s.veiculos_vendidos],
  ['com oferta vencedora', s.com_oferta_vencedora],
  ['com preço de venda > 0', s.com_preco_venda],
  ['com FIPE no anúncio', s.com_fipe_anuncio],
  ['com código FIPE', s.com_code_fipe],
  ['UTILIZÁVEIS (as três)', s.utilizaveis]
];
let ant = null;
degraus.forEach(([rot, v]) => {
  const q = ant === null ? '' : '  -' + br(ant - n(v));
  console.log('  ' + rot.padEnd(26) + br(n(v)).padStart(7) +
    '  ' + pct(n(v) / nova).padStart(6) + q);
  ant = n(v);
});

/* ── 4. onde cortar o outlier — decidido por número, não por chute ───── */
console.log('\n═══ DISTRIBUIÇÃO DA RAZÃO venda/FIPE (n=' + br(n(s.utilizaveis)) + ') ═══\n');
const RF = D.q_razao_faixa;
const totR = RF.reduce((a, r) => a + n(r.vendas), 0);
const ROT = ['< 0,20', '0,20–0,40', '0,40–0,60', '0,60–0,70', '0,70–0,80',
  '0,80–0,90', '0,90–1,00', '1,00–1,20', '1,20–1,50', '>= 1,50'];
RF.forEach((r, i) => {
  const p = n(r.vendas) / totR;
  console.log('  ' + ROT[i].padEnd(11) + br(n(r.vendas)).padStart(6) + '  ' +
    pct(p).padStart(6) + '  ' + '#'.repeat(Math.max(0, Math.round(p * 60))));
});
const fora = n(RF[0].vendas) + n(RF[8].vendas) + n(RF[9].vendas);
console.log('\n  Massa entre 0,40 e 0,90: ' +
  pct((n(RF[2].vendas) + n(RF[3].vendas) + n(RF[4].vendas) + n(RF[5].vendas)) / totR));
console.log('  Cauda >= 1,50 vai até ' + RF[9].teto + 'x a FIPE — venda 107 vezes acima');
console.log('  da tabela não existe: é dado quebrado, não é desconto.');
console.log('  CORTE SUGERIDO 0,20 <= razão <= 1,20 — descarta ' + br(fora) +
  ' vendas (' + pct(fora / totR) + ').');

/* ── 5. o índice de confiança ────────────────────────────────────────── */
const T = D.q_top_codigo.map((r) => {
  const ep = n(r.razao_dp) / Math.sqrt(n(r.vendas));
  return Object.assign({}, r, {
    erro_padrao: ep,
    ic95: 1.96 * ep,
    /* suspeito: desvio alto demais ou máximo impossível. Não é opinião —
       razão acima de 1,5 quer dizer venda 50% acima da tabela. */
    suspeito: n(r.razao_dp) > 0.25 || n(r.razao_max) > 1.5
  });
});
const limpos = T.filter((r) => !r.suspeito).sort((a, b) => a.ic95 - b.ic95);
const sujos = T.filter((r) => r.suspeito);

console.log('\n═══ ÍNDICE DE CONFIANÇA — top 15 por precisão do patamar ═══\n');
console.log('  Ordenado por IC95 da média, não por volume. Lê-se: "o patamar deste');
console.log('  código é X% da FIPE, com ± tantos pontos percentuais".\n');
console.log('  código     marca/modelo               n    razão    ±IC95   lojas');
console.log('  ' + '-'.repeat(72));
limpos.slice(0, 15).forEach((r) => {
  console.log('  ' + r.code_fipe.padEnd(11) +
    (r.marca + ' ' + r.modelo).slice(0, 25).padEnd(26) +
    String(r.vendas).padStart(4) +
    ('  ' + pct(n(r.razao_media))).padStart(9) +
    ('±' + (r.ic95 * 100).toFixed(1).replace('.', ',')).padStart(9) +
    String(r.lojas_compradoras).padStart(7));
});

console.log('\n═══ DESCARTADOS — volume alto, dado quebrado ═══\n');
sujos.forEach((r) => {
  console.log('  ' + r.code_fipe + '  ' + (r.marca + ' ' + r.modelo).padEnd(22) +
    ' n=' + String(r.vendas).padStart(3) +
    '  média=' + n(r.razao_media).toFixed(2).replace('.', ',') +
    '  dp=' + n(r.razao_dp).toFixed(2).replace('.', ',') +
    '  máx=' + n(r.razao_max).toFixed(1).replace('.', ',') + 'x' +
    '  lojas=' + r.lojas_compradoras);
});

/* ── 6. quanto da base os códigos com amostra cobrem ─────────────────── */
console.log('\n═══ COBERTURA POR TAMANHO DE AMOSTRA ═══\n');
const CF = D.q_codigo_faixa;
const totV = CF.reduce((a, r) => a + n(r.vendas), 0);
const RCF = ['>= 200', '100–199', '50–99', '30–49', '10–29', '3–9', '1–2'];
let ac = 0, acc = 0;
console.log('  vendas/código   códigos    vendas    % da base   acumulado');
console.log('  ' + '-'.repeat(58));
CF.forEach((r, i) => {
  ac += n(r.vendas); acc += n(r.codigos);
  console.log('  ' + RCF[i].padEnd(15) + String(r.codigos).padStart(6) +
    br(n(r.vendas)).padStart(10) + pct(n(r.vendas) / totV).padStart(11) +
    pct(ac / totV).padStart(12));
});
const n30 = CF.slice(0, 4);
console.log('\n  Com n >= 30: ' + n30.reduce((a, r) => a + n(r.codigos), 0) +
  ' códigos, ' + br(n30.reduce((a, r) => a + n(r.vendas), 0)) + ' vendas (' +
  pct(n30.reduce((a, r) => a + n(r.vendas), 0) / totV) + ' da base).');
const n10 = CF.slice(0, 5);
console.log('  Com n >= 10: ' + n10.reduce((a, r) => a + n(r.codigos), 0) +
  ' códigos, ' + br(n10.reduce((a, r) => a + n(r.vendas), 0)) + ' vendas (' +
  pct(n10.reduce((a, r) => a + n(r.vendas), 0) / totV) + ' da base).');
console.log('');
