/* ============================================================================
   Monta o Estudo de Vendas IGA a partir de UMA fonte.

       node monta-estudo.js

   Entra:  estudo.template.html + resultados.json (analise.py)
           + design/tokens/tema.css + design/tokens/tema-iga.css
           + design/marca/iga/logo-iga-claro.svg e logo-iga-escuro.svg
   Sai:    estudo-vendas-iga.html (autossuficiente: zero requisição de rede)

   v2 (08/10): o cálculo mora na PÁGINA. Aqui só entram os agregados (cluster × mês),
   os textos estáticos (método, glossário, notas) e os números que não mudam com o
   filtro de cluster (pareamento exato, perfil dos dois lados, tamanho das amostras).
   ========================================================================== */
const fs = require('fs');
const path = require('path');

const AQUI = __dirname;
const DESIGN = path.resolve(AQUI, '..', '..', 'design');
const ler = p => fs.readFileSync(p, 'utf8');
const R = JSON.parse(ler(path.join(AQUI, 'resultados.json')));

/* 09/10 (Thomas): o estudo mostra de jan/24 em diante. A regressão que gera o "esperado de mercado" foi
   estimada com dados desde jan/23 (mais vendas dos demais vendedores = comparação mais firme); aqui só
   se corta o que vai para a tela. meses_todos fica inteiro: as janelas de recorrência precisam do passado. */
const I0 = R.meses.indexOf('2024-01');
R.meses = R.meses.slice(I0);
R.primeiro_mes = '2024-01';
Object.keys(R.cel).forEach(k => { R.cel[k] = R.cel[k].map(l => l.slice(I0)); });
delete R.fx;     // as faixas de pedido saíram da página

const nf = (n, d) => Number(n).toLocaleString('pt-BR', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
const pc = (x, d) => nf(100 * x, d === undefined ? 0 : d) + '%';
const pp = (x, d) => (x > 0 ? '+' : x < 0 ? '−' : '') + nf(Math.abs(100 * x), d === undefined ? 1 : d) + ' p.p.';
const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const rotMes = m => MES[Number(m.slice(5, 7)) - 1] + '/' + m.slice(2, 4);

const E = R.estatico, PAR = E.pareamento, PF = E.perfil;
const JB = R.compr.janelas.base, JR = R.compr.janelas.rec;
const ult = R.ultimo_mes;

/* a classificação de cluster mudou em 2025: C1–C6 até abr/25, G1–G17 a partir de fev/25 */
const ehC = c => /^C\d+$/.test(c), ehG = c => /^G\d+$/.test(c);
const totM = (re, m) => R.clusters.reduce((s, c, i) => s + (re(c) ? R.cel.pub[i][m] : 0), 0);
const mC = R.meses.map((x, m) => (totM(ehC, m) >= 50 ? x : null)).filter(Boolean), mG = R.meses.map((x, m) => (totM(ehG, m) >= 50 ? x : null)).filter(Boolean);
const CLUSTER_NOTA = 'Atenção: a classificação de cluster mudou. C1–C6 só existem de ' + rotMes(mC[0]) + ' a ' + rotMes(mC[mC.length - 1]) + '; G1–G17, a partir de ' + rotMes(mG[0]) +
  '. As duas não se enxergam: marcar C mostra só a série até a troca, marcar G só depois dela.';


const NOTAS = {
  pct: 'Veículos do IGA nos ' + nf(E.modelos.com_ambos) + ' modelos que o IGA e os demais vendedores vendem em volume. Linha laranja = % sobre a FIPE do IGA: o preço de venda ou, quando o veículo não vendeu, o VMV. ' +
    'Linha azul = o que veículos comparáveis (mesmo modelo, idade, quilometragem, cluster e mês) obtiveram nas vendas dos demais vendedores, calculado para os MESMOS veículos. ' +
    'Barras = a diferença em p.p.: positiva quando o IGA vendeu (ou pediu) acima do que o mercado obtém. Os botões separam os veículos que receberam alguma oferta no mês dos que não receberam nenhuma; ' +
    'todo veículo vendido tem oferta, então "Sem oferta" mostra só o VMV de quem ninguém quis. Lacuna = menos de 5 veículos no mês. ' +
    'Antes de 4T/25 a FIPE dos não vendidos está pouco preenchida (' + pc(E.fipe_tri['2024Q4'].nao_vendido, 0) + ' em 4T/24), então "Sem oferta" tem poucos veículos nesse período. ' +
    'Para ver o nível bruto: desde 1T/23 o IGA vendeu a ' + pc(PF.pct_iga, 1) + ' da FIPE e os demais a ' + pc(PF.pct_par, 1) + ', mas o IGA vende carro bem diferente (idade mediana de ' + nf(PF.idade_iga) + ' anos contra ' + nf(PF.idade_par) + '; ' + nf(PF.km_iga / 1000) + ' mil km contra ' + nf(PF.km_par / 1000) + ' mil; FIPE mediana de R$ ' + nf(PF.fipe_iga / 1000) + ' mil contra R$ ' + nf(PF.fipe_par / 1000) + ' mil), por isso essa média não compara veículos semelhantes.',
  ped: 'Êxito = veículos vendidos ÷ publicados (únicos no mês). % sobre a FIPE = média, nos veículos do IGA com FIPE no anúncio, do preço de venda ou, quando não vendeu, do VMV. Antes de 4T/25 a FIPE dos não vendidos está pouco preenchida (' + pc(E.fipe_tri['2024Q4'].nao_vendido, 0) + ' em 4T/24), então a série mistura vendas bem cobertas com o VMV de poucos não vendidos. Lacuna = menos de 5 veículos com FIPE no mês.',
  ativas: ' Filtro "só lojas ativas" (ligado): fica a loja com situação 3 (a única que opera) e não apagada; ' + nf(R.compr.ativa.filter(Boolean).length) + ' das ' + nf(R.compr.ativa.length) + ' lojas que já compraram do IGA passam. As demais saíram da plataforma ou estão inativas.'
};

const METODO = [
  ['O que é "IGA" aqui', [
    'Todo anúncio cujo vendedor é Itaú Unibanco (loja 594), Repasse Itaú (598) ou IGA Participações (16036) na plataforma Cars2You. A série do estudo vai de ' + rotMes(R.primeiro_mes) + ' a ' + rotMes(ult) +
    ', mês a mês, em todos os gráficos. ' + rotMes('2026-10') + ' fica de fora: o mês ainda está aberto. O histórico de compradores começa em out/21, para as janelas de recorrência de 2023 terem 6 meses para trás.',
    'Veículo publicado = veículo único no mês: uma passagem do mesmo veículo por dois eventos do mesmo mês conta uma vez. Veículo vendido = o que teve uma negociação vendida naquele mês.'
  ]],
  ['% sobre a FIPE', [
    '% sobre a FIPE = (preço de venda, ou o VMV quando o veículo não vendeu) ÷ FIPE do anúncio. Os visuais de comparação com o mercado usam só vendas: o VMV dos não vendidos fica de fora, porque o mercado só tem preço de venda para comparar. Em veículo vendido há mais de uma negociação no mês, vale a vendida. Fora do corte 20% a 120% da FIPE e VMV 999999 (sentinela de "sem mínimo") ficam de fora.',
    'A FIPE do anúncio, para o IGA, só está preenchida na maior parte dos veículos que venderam até 3T/25 (não vendidos: ' + pc(E.fipe_tri['2024Q4'].nao_vendido, 0) + ' em 4T/24, contra ' + pc(E.fipe_tri['2024Q4'].vendido, 0) + ' dos vendidos). ' +
    'Por isso, antes de 4T/25 a média do IGA mistura vendas (bem cobertas) e VMV de poucos não vendidos.'
  ]],
  ['Como o IGA é comparado ao mercado', [
    'Mercado = as vendas de todos os outros vendedores da plataforma, na mesma janela. Não são vendas de outros comitentes fora da Cars2You.',
    'A comparação é feita dentro do mesmo modelo (marca + nome), controlando idade, faixa de quilometragem, cluster e mês. O modelo entra como efeito fixo: o que se compara é o IGA contra os demais DENTRO de cada modelo. Só entram modelos com pelo menos 5 vendas de cada lado.',
    'Conferência sem modelo estatístico: só células exatas (modelo × faixa de idade × faixa de km × trimestre, 2 vendas ou mais de cada lado), são ' + nf(PAR.celulas) + ' células e ' + nf(PAR.n_iga) + ' vendas do IGA contra ' +
    nf(PAR.n_par) + ' dos demais, com diferença de ' + pp(PAR.dif) + ' sobre a FIPE. Mesmo sinal da regressão, magnitude menor: a regressão usa todas as vendas, o pareamento só as que caem em célula comum. Vale para todos os clusters juntos.',
    'A série mostrada começa em jan/24. A regressão que gera o esperado de mercado usa vendas desde jan/23, porque o mercado vendeu bem menos em 2021–2022 e mais dados dão uma comparação mais firme.'
  ]],
  ['Filtro de cluster e janelas', [
    CLUSTER_NOTA + ' O filtro de cluster refaz todos os números da página para os clusters marcados: KPIs, achados, gráficos, compradores e tabelas. A conferência por pareamento e o perfil dos dois lados (nota do gráfico de % sobre a FIPE) são sempre de todos os clusters.',
    'Recorrente = comprou do IGA no mês considerado e em ao menos 6 dos 12 meses anteriores. Janela-base: ' + rotMes(JB[0]) + ' a ' + rotMes(JB[1]) + '. "Pararam" = lojas que foram recorrentes em algum mês da janela-base e não compraram nada de ' + rotMes(JR[0]) + ' a ' + rotMes(JR[1]) +
    '. Com um cluster marcado, "recorrente" e "parou" valem para as compras daquele cluster. Ofertas e acessos da tabela de quem parou são da loja inteira.'
  ]],
  ['O que o estudo não prova', [
    'A diferença para o esperado pode refletir o estado do veículo, que a comparação não enxerga (modelo, idade, quilometragem e cluster são o que se controla). O IGA vende carro mais velho e mais barato que os demais (idade mediana ' + nf(PF.idade_iga) + ' anos contra ' + nf(PF.idade_par) +
    '); só ' + nf(E.modelos.com_ambos) + ' dos ' + nf(E.modelos.total) + ' modelos vendidos desde jan/23 são vendidos pelos dois lados em volume para comparar (conta desde jan/23).',
    'Novembro de 2024 foi um mês atípico (poucos veículos publicados e vendidos); aparece como vale nos gráficos mensais. Compradores são contados por loja: uma loja que passou a comprar por outro cadastro aparece como "parou".'
  ]]
];

const GLOSS = [
  ['IGA', 'Os anúncios vendidos pelo Itaú Unibanco, pelo Repasse Itaú e pela IGA Participações na plataforma. É o que o estudo chama de "IGA".'],
  ['Veículo publicado', 'Veículo único com negociação em evento do IGA naquele mês. O mesmo veículo em dois eventos do mesmo mês conta uma vez; em dois meses, uma vez em cada.'],
  ['Veículo vendido', 'Veículo publicado cuja negociação do mês está em Aguardando Pagamento, Aguardando Confirmação de Pagamento ou Vendido (status 2, 3 ou 7). Venda cancelada depois não conta.'],
  ['Êxito', 'Veículos vendidos ÷ veículos publicados (únicos no mês). Substitui a antiga "conversão", que contava negociações.'],
  ['FIPE do anúncio', 'A tabela FIPE gravada no anúncio, contemporânea da oferta. Para o IGA só está bem preenchida, nos não vendidos, a partir de 4T/25.'],
  ['% sobre a FIPE', '(Preço de venda, ou o VMV quando não vendeu) ÷ FIPE do anúncio. 70% = o veículo saiu, ou foi pedido, a 70% da tabela. Substitui o "deságio" (100% − % sobre a FIPE).'],
  ['p.p.', 'Ponto percentual: a diferença entre dois percentuais (75% − 70% = 5 p.p.).'],
  ['VMV', 'Valor mínimo que o vendedor aceita, por negociação. O valor 999999 é sentinela de "sem mínimo" e fica de fora.'],
  ['Demais vendedores', 'Todo vendedor da plataforma que não é o IGA. É o mercado contra o qual o IGA é comparado.'],
  ['Esperado de mercado', 'O % sobre a FIPE que veículos comparáveis (mesmo modelo, idade, quilometragem, cluster e mês) alcançaram nas vendas dos demais vendedores.'],
  ['Mesma célula', 'Mesmo modelo, mesma faixa de idade, mesma faixa de quilometragem e mesmo cluster, no mesmo período.'],
  ['Cluster', 'Agrupamento de veículos do catálogo da plataforma (C1 a C5, G1 a G17 e outros). O filtro do topo recorta a página inteira por ele.'],
  ['Efeito fixo de modelo', 'Técnica que compara o IGA com os demais DENTRO de cada modelo, para que a diferença de mix não passe por diferença de preço.'],
  ['Com oferta / Sem oferta', 'Veículo publicado no mês que recebeu (ou não) ao menos um lance. Todo veículo vendido tem oferta.'],
  ['Comprador recorrente', 'Loja que comprou do IGA no mês considerado e em ao menos 6 dos 12 meses anteriores.'],
  ['Janela-base', 'Os 12 meses (' + rotMes(JB[0]) + ' a ' + rotMes(JB[1]) + ') em que se procura quem foi recorrente em algum mês, para ver quem parou depois.'],
  ['Pararam', 'Lojas que foram recorrentes em algum mês da janela-base e não compraram do IGA de ' + rotMes(JR[0]) + ' a ' + rotMes(JR[1]) + '.'],
  ['Comparação personalizada', 'Tabela das lojas que mais compraram no período escolhido, com as compras dos últimos 3 meses ao lado. Marcar lojas filtra o gráfico "Vendas mês a mês".'],
  ['Variação histórica', '(Média de compras por mês nos últimos 3 meses ÷ média por mês do período selecionado) − 1. +25% = a loja comprou 25% mais por mês no último trimestre.']
];

const DADOS = {
  cluster_nota: CLUSTER_NOTA,
  sub: 'Itaú · Venda Direta IGA · ' + rotMes(R.primeiro_mes) + ' a ' + rotMes(ult) + ' · base Cars2You',
  gerado_br: R.gerado.slice(8, 10) + '/' + R.gerado.slice(5, 7) + '/' + R.gerado.slice(0, 4),
  rodape: 'vendedor IGA (lojas 594, 598 e 16036) contra os demais vendedores da Cars2You, ' + rotMes(R.primeiro_mes) + ' a ' + rotMes(ult),
  res: R, notas: NOTAS, metodo: METODO, glossario: GLOSS
};

/* ── montagem ────────────────────────────────────────────────────────────── */
const uri = a => 'data:image/svg+xml;base64,' + fs.readFileSync(path.join(DESIGN, 'marca', 'iga', a)).toString('base64');
const troca = (txt, de, por) => txt.split(de).join(por);
let html = ler(path.join(AQUI, 'estudo.template.html'));
html = troca(html, '/*__CSS__*/', ler(path.join(DESIGN, 'tokens', 'tema.css')) + ler(path.join(DESIGN, 'tokens', 'tema-iga.css')));
html = troca(html, '/*__DADOS__*/{}', JSON.stringify(DADOS).split('<').join('\\u003c'));
html = troca(html, '__LOGO_CLARO__', uri('logo-iga-claro.svg'));
html = troca(html, '__LOGO_ESCURO__', uri('logo-iga-escuro.svg'));

const sobrou = html.match(/__[A-Z_]+__|\/\*__[A-Z_]+__\*\//g);
if (sobrou) { console.error('✗ marcador não substituído: ' + [...new Set(sobrou)].join(', ')); process.exit(1); }
const destino = path.join(AQUI, 'estudo-vendas-iga.html');
fs.writeFileSync(destino, html, 'utf8');
console.log('✓ estudo-vendas-iga.html · %d KB', Math.round(html.length / 1024));
