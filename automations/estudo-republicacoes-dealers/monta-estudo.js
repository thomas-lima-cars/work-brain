/* ============================================================================
   Monta o Estudo de Republicações Dealers a partir de UMA fonte.

       node monta-estudo.js

   Entra:  estudo.template.html + resultados.json (analisa.py)
           + design/tokens/tema.css + design/marca/cars2you/*.svg
   Sai:    estudo-republicacoes-dealers.html (autossuficiente: zero requisição de rede)

   Aqui só se compacta: uma linha por carro vira um array, e cada lado (Cars2You,
   Dealers) um array com as mesmas colunas. Todo cálculo mora na página.
   ========================================================================== */
const fs = require('fs');
const path = require('path');

const AQUI = __dirname;
const DESIGN = path.resolve(AQUI, '..', '..', 'design');
const ler = p => fs.readFileSync(p, 'utf8');
const R = JSON.parse(ler(path.join(AQUI, 'resultados.json')));
const RS = R.resumo;
const nf = n => Number(n).toLocaleString('pt-BR');

const LADO = ['pub', 'ev', 'ini', 'fim', 'hist', 'of', 'pub_of', 'maior', 'ult', 'ult_dia', 'st', 'vend', 'venda', 'dv', 'fipe', 'fipe_o', 'molicar', 'vmv', 'evento'];
const CARRO = ['id', 'cat', 'dono', 'com_c', 'com_d', 'modelo', 'versao', 'ano', 'km', 'ordem', 'dias', 'sobre', 'st_antes', 'por', 'vendeu',
  'placa', 'placa_d', 'pas', 'pubs', 'dev', 'erro_sim', 'erro_rep', 'erro_txt', 'c', 'd'];
const FIPE_O = { anuncio: 1, veiculo: 2 };
const lado = s => LADO.map(k => (k === 'fipe_o' ? FIPE_O[s[k]] || 0 : s[k] === undefined ? null : s[k]));
const carros = R.carros.map(c => CARRO.map(k => (k === 'c' || k === 'd' ? lado(c[k]) : c[k] === undefined ? null : c[k])));

/* meses do gráfico: de jan/26 até o último mês com estreia na segunda base */
const seg = c => (c.ordem === 'DC' ? c.c : c.d);
const ultMes = R.carros.map(c => seg(c).ini.slice(0, 7)).sort().pop();
const meses = [];
for (let m = 1; m <= 12; m++) { const k = '2026-' + String(m).padStart(2, '0'); if (k <= ultMes) meses.push(k); }

const [ano, mes, dia] = R.rodada.slice(0, 10).split('-');
const DADOS = {
  sub: 'O mesmo carro publicado nas duas bases em 2026 · ' + nf(R.carros.length) + ' carros',
  gerado_br: dia + '/' + mes + '/' + ano + ' ' + R.rodada.slice(11, 16),
  rodape: 'Cars2You (cars2you_production) e Dealers (wl_dlc_prd), conexão direta somente leitura; publicações com início das ofertas de 01/01/2026 até a coleta (agendadas fora).',
  status: R.status, eventos: R.eventos, meses, lado_cols: LADO, carro_cols: CARRO, carros,
  metodo: [
    ['Como o mesmo carro foi achado nas duas bases', [
      'Pelo chassi; quando um dos lados não tem chassi, pela placa (Mercosul convertida ao formato antigo, porque o mesmo carro pode estar com uma placa em cada base).',
      'Placa e chassi foram comparados embaralhados dentro do próprio banco (SHA-256 com um sal novo a cada coleta). O chassi não sai da base; a placa dos carros casados aparece na tabela de veículos (a da Cars2You; sem ela, a da Dealers).',
      'Placa ou chassi repetido em mais de 3 veículos da mesma base é cadastro lixo e ficou fora (' + nf(RS.hash_lixo.cars2you_chassi + RS.hash_lixo.cars2you_placa) + ' valores na Cars2You, ' + nf(RS.hash_lixo.dealers_chassi + RS.hash_lixo.dealers_placa) + ' na Dealers). Mesma placa com chassi diferente não é o mesmo carro (' + nf(RS.conflito_placa_chassi) + ' caso).',
      'Casaram ' + nf(RS.carros_nas_duas) + ' carros (' + nf(RS.casou_por.chassi || 0) + ' pelo chassi, ' + nf(RS.casou_por.placa || 0) + ' pela placa). Saíram ' + nf(RS.sem_2026_nos_dois_apos_teste) + ' que só ficavam nas duas bases por causa de contas de teste ou de data fora de 2026.'
    ]],
    ['O que conta como publicação', [
      'Uma negociação: o carro num evento. O dia da publicação é o início das ofertas do evento (sem evento, o da própria negociação), em hora de Brasília.',
      'Entram as publicações com início de 01/01/2026 até o momento da coleta: as agendadas, em evento que ainda não abriu, ficam fora (' + nf((RS.agendadas_fora || {}).cars2you || 0) + ' na Cars2You e ' + nf((RS.agendadas_fora || {}).dealers || 0) + ' na Dealers). Ficam fora também as contas de teste ("teste" ou "tutorial" no nome do comitente: ' + nf(RS.negs_teste_fora.cars2you || 0) + ' negociações na Cars2You e ' + nf(RS.negs_teste_fora.dealers || 0) + ' na Dealers) e o evento-balde "Anúncios cancelados" da Cars2You.',
      'A ordem e o intervalo saem da primeira publicação de 2026 em cada base. Publicações anteriores a 2026 não mudam a ordem.'
    ]],
    ['Resultado de cada base', [
      'Status = o da última publicação de 2026 na base. Vendido = status Vendido, Aguardando pagamento ou Aguardando confirmação; o valor da venda é a oferta vencedora.',
      'Ofertas = todas as não apagadas, somadas nas publicações de 2026. Última oferta = a mais recente recebida na base.',
      'FIPE = a do anúncio (na Dealers ela falta em boa parte dos anúncios; sem ela, a do cadastro do veículo, e sem as duas, a da outra base). Molicar só existe na Cars2You.',
      'O VMV não aparece: na Dealers ele é um valor fictício (999.000 em quase toda venda).',
      'Data da venda = o dia da oferta vencedora da publicação vendida (sem ela, o fim do evento).'
    ]],
    ['Idas e voltas, devolvidos e erro operacional', [
      'Passagem = publicações seguidas na mesma base, em ordem de início. A cada troca de base o carro "foi" para a outra; ' + nf(RS.devolvidos) + ' carros voltaram à base de origem (Devolvidos).',
      'Erro operacional = o carro esteve no ar nas duas bases ao mesmo tempo (' + nf(RS.erro_sim) + ' carros), ou foi republicado quando a última publicação da outra base estava vendida, aguardando pagamento ou confirmação, ou em análise (' + nf(RS.erro_rep) + '). ' + nf(RS.erro_operacional) + ' carros têm um dos dois.',
      'No ar = do início das ofertas ao fim do evento. ' + (RS.cancelada_com_atualizado
        ? 'Uma publicação cancelada sai do ar na última atualização da negociação, quando ela vem antes do fim do evento: o banco não guarda a hora do cancelamento.'
        : 'Nesta coleta a publicação cancelada fica no ar até o fim do evento (a hora da última atualização ainda não foi coletada), o que pode contar como simultâneo um carro tirado de uma base antes de ir à outra.'),
      'O status é o de hoje, não o do dia da republicação: uma venda que caiu depois aparece como Venda cancelada e não conta.'
    ]],
    ['O que o estudo não prova', [
      'Que a segunda publicação foi por causa da primeira. O estudo mostra a sequência, não o motivo.',
      'Comparar o preço entre as bases não controla o momento: a segunda publicação acontece semanas depois, com o carro mais velho e a FIPE de outro mês.',
      'Carro vendido nas duas bases existe (' + nf(RS.vendeu.ambos || 0) + '): a venda de uma das pontas pode ter caído sem que o status fosse atualizado.'
    ]]
  ],
  glossario: [
    ['Republicação', 'O mesmo carro (mesmo chassi, ou mesma placa) publicado na Cars2You e na Dealers em 2026.'],
    ['Publicação', 'O carro num evento (uma negociação). O dia é o início das ofertas do evento.'],
    ['Ordem', 'Em qual base o carro foi publicado primeiro em 2026: Cars2You → Dealers, Dealers → Cars2You ou mesmo dia.'],
    ['Intervalo', 'Dias entre a primeira publicação de 2026 na Cars2You e na Dealers.'],
    ['Período', 'O filtro de datas olha o dia da republicação: a primeira publicação de 2026 na base em que o carro chegou depois (no mesmo dia, o dia das duas).'],
    ['Nas duas ao mesmo tempo', 'Alguma publicação de uma base estava no ar (do início das ofertas ao fim do evento; a cancelada, até a última atualização da negociação) enquanto outra, da outra base, também estava. Uma terminar na hora em que a outra começa não conta.'],
    ['Passagem', 'Publicações seguidas do carro na mesma base. O carro vai de uma passagem para a outra a cada troca de base. Passe o mouse em Passagens na tabela de veículos (ou clique, para fixar) para ver a tabela de cada uma: banco, início e fim, dias no ar, publicações, status e data da venda da última publicação.'],
    ['Devolvido', 'O carro voltou à base em que começou depois de passar pela outra (três passagens ou mais: C → D → C ou D → C → D).'],
    ['Erro operacional', 'O carro esteve no ar nas duas bases ao mesmo tempo, ou foi republicado quando a última publicação da outra base estava vendida, aguardando pagamento ou confirmação, ou em análise.'],
    ['Data da venda', 'O dia da oferta vencedora da publicação vendida.'],
    ['Tempo de venda', 'Dias entre a primeira publicação de 2026 do carro no banco e a data da venda nesse banco. No cartão, a mediana dos carros vendidos (nas duas bases juntas, e em cada uma).'],
    ['Placa', 'A placa do carro na Cars2You; sem ela, a da Dealers. Quando as duas bases têm placas diferentes (a antiga numa e a Mercosul na outra, por exemplo), a dica mostra as duas.'],
    ['1ª base, 2ª base', 'A base em que o carro estreou primeiro em 2026, e a outra.'],
    ['Comitente', 'O dono do carro. O nome é unificado entre as bases (ex.: "C6 Bank Lojista" e "BANCO C6 S.A." viram C6 Bank). Quando a Cars2You vendeu por canal de revenda (Outlet Netcarros, Multifrota), vale o nome da Dealers.'],
    ['Categoria', 'Pesados se alguma das bases classifica o carro como pesado (caminhão, ônibus, reboque, semirreboque, máquina…); Leves, com motos, se alguma o classifica como leve.'],
    ['Vendido', 'Última publicação de 2026 na base com status Vendido, Aguardando pagamento ou Aguardando confirmação.'],
    ['Última oferta', 'A oferta mais recente que o carro recebeu na base, em qualquer publicação de 2026.'],
    ['% sobre a FIPE', 'Valor ÷ FIPE. Venda ÷ FIPE em média, última oferta ÷ FIPE em mediana; nas duas só entram valores entre 20% e 120% da FIPE; fora disso é erro de cadastro.'],
    ['Molicar', 'Tabela de preço de referência gravada no anúncio da Cars2You. A Dealers não guarda.']
  ]
};

/* ── montagem ────────────────────────────────────────────────────────────── */
const uri = a => 'data:image/svg+xml;base64,' + fs.readFileSync(path.join(DESIGN, 'marca', 'cars2you', a)).toString('base64');
const troca = (txt, de, por) => txt.split(de).join(por);
let html = ler(path.join(AQUI, 'estudo.template.html'));
html = troca(html, '/*__CSS__*/', ler(path.join(DESIGN, 'tokens', 'tema.css')));
html = troca(html, '/*__DADOS__*/{}', JSON.stringify(DADOS).split('<').join('\\u003c'));
html = troca(html, '__LOGO_CURTA_CLARO__', uri('logo-c2y-preto.svg'));
html = troca(html, '__LOGO_CURTA_ESCURO__', uri('logo-c2y-branco.svg'));
html = troca(html, '__LOGO_CLARO__', uri('logo-cars2you-preto.svg'));
html = troca(html, '__LOGO_ESCURO__', uri('logo-cars2you-branco.svg'));

const sobrou = html.match(/__[A-Z_]+__|\/\*__[A-Z_]+__\*\//g);
if (sobrou) { console.error('✗ marcador não substituído: ' + [...new Set(sobrou)].join(', ')); process.exit(1); }
const destino = path.join(AQUI, 'estudo-republicacoes-dealers.html');
fs.writeFileSync(destino, html, 'utf8');
console.log('✓ estudo-republicacoes-dealers.html · %d KB · %d carros', Math.round(html.length / 1024), R.carros.length);
