/* Gera as quatro paginas HTML do estudo da Dealers, reusando os geradores
 * provados de `automations/n8n-sdk/precificacao/` sem toca-los.
 *
 *   node monta-paginas.js
 *
 * ── POR QUE ESTE ARQUIVO EXISTE ──────────────────────────────────────────
 * Dois dos quatro geradores consomem formatos que o lado Dealers ainda nao
 * tinha:
 *
 *   monta-colunas.js   quer a saida do NO `no-analisar.js`, que roda dentro do
 *                      n8n e nao existe como arquivo aqui. O no e executado
 *                      local com um shim dos dois unicos globais que ele usa
 *                      ($('Montar Queries') e $('MCP Exec')).
 *
 *   monta-analitico.js quer o analitico em formato COLUNAR (colunas + linhas),
 *                      e o `roda-estudo.py` emite {vendas:[...]}.
 *
 * ⚠️ USAR O NO, E NAO `analisa-drivers.js`, E DELIBERADO. Os dois calculam a
 * mesma regressao mas controlam por campos DIFERENTES: o no subtrai a media do
 * `grupo` (modelo), o script local subtrai a do `codigo_fipe`. O ranking
 * publicado da Cars2You saiu do no. Gerar a pagina da Dealers com o script
 * local faria a diferenca de controle aparecer como achado na comparacao.
 */
const fs = require('fs');
const path = require('path');

const AQUI = __dirname;
const LA = path.join(AQUI, '..', '..', 'n8n-sdk', 'precificacao');
const ler = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

const analitico = ler(path.join(AQUI, 'analitico-dealers.json')).vendas;
const dims = ler(path.join(AQUI, 'dados-dealers.json')).dados;
const cfg = ler(path.join(AQUI, 'amostra-modelo-dealers.config.json'));

/* ── 1. roda o no do n8n com um shim ──────────────────────────────────── */
const COLUNAS = Object.keys(analitico[0]);
const emLinhas = (arr) => ({
  columns: Object.keys(arr[0] || {}),
  rows: arr.map((o) => Object.keys(arr[0]).map((k) => o[k]))
});

const pedidos = [
  { json: { queryName: 'q_gabarito', meta: { estudo: 'precificacao-dealers',
      amostra: cfg.nome, chave: cfg.chave, base: cfg.base } } },
  { json: { queryName: 'q_vendas', meta: { estudo: 'precificacao-dealers',
      amostra: cfg.nome, chave: cfg.chave, base: cfg.base } } }
];
const outs = [
  { json: { structuredContent: emLinhas(dims.q_gabarito) } },
  { json: { structuredContent: emLinhas(analitico) } }
];

const fonte = fs.readFileSync(path.join(LA, 'no-analisar.js'), 'utf8');
const shim = (nome) => ({ all: () => (nome === 'Montar Queries' ? pedidos : outs) });
const saidaNo = new Function('$', fonte)(shim);
const drivers = saidaNo[0].json;

/* o no so confia na coleta se o gabarito bater com as linhas. Se nao bater,
   a pagina sairia dizendo "coleta incompleta" sem ninguem notar. */
if (!drivers.coleta.completa) {
  throw new Error('coleta incompleta: esperadas=' + drivers.coleta.esperadas +
    ' colhidas=' + drivers.coleta.usadas_na_regressao);
}
if (drivers.coleta.duplicadas) {
  throw new Error('negociacao_id duplicado: ' + drivers.coleta.duplicadas);
}
/* ⚠️ DESVIO ENTRE O NO ARQUIVADO E O QUE RODOU NO n8n.
   `no-analisar.js` do repo emite `desagio.por_codigo` e `coleta.codigos`.
   O `drivers-51358.json`, que saiu da execucao real, tem `por_grupo` e
   `codigos_fipe` -- e e ISSO que `monta-colunas.js` le. Ou seja: a copia
   arquivada do no esta atrasada em relacao ao que executou.
   Normalizo aqui para a pagina sair, mas o desvio precisa ser resolvido la:
   enquanto existir, reexportar o no do n8n gera um arquivo que nao alimenta
   o gerador de pagina. */
drivers.desagio.por_grupo = drivers.desagio.por_codigo;
delete drivers.desagio.por_codigo;
drivers.coleta.codigos_fipe = drivers.coleta.codigos;
delete drivers.coleta.codigos;

/* ── os textos que os geradores traziam FIXOS da Cars2You ────────────────
   Sem isto a pagina da Dealers sai afirmando fato de outra base. O caso mais
   grave e o VMV: o texto fixo dizia "7,6% acima de 3x a FIPE", medido na
   execucao 51328; aqui sao 98,1%. Uma pagina que erra o numero por 13x e pior
   que pagina nenhuma -- o risco ja registrado do `saida-teste-local.html`. */
const ROTULO = 'Base Dealers (<code>wl_dlc_prd</code>)';
const ORIGEM = 'consulta direta ao RDS da Dealers via <code>roda-estudo.py</code>, ' +
               'sem passar pelo MCP';
drivers.rotulo = ROTULO;
drivers.origem = ORIGEM;
drivers.alertas = {
  vmv: 'nesta base o VMV e valor-sentinela: 999000,00 em 98,1% das vendas, ' +
       '66 valores distintos em 4.771 linhas. Nao usar',
  valor_molicar_anuncio: 'preenchida em 0,0% das linhas nesta base',
  valor_ref_vendedor: 'preenchida em 0,0% das linhas nesta base',
  whitelabel_id: 'constante nesta base — a Dealers e whitelabel unica',
  cluster: 'praticamente nao usada aqui: 3 niveis, contra 22 na Cars2You'
};

fs.writeFileSync(path.join(AQUI, 'drivers-dealers.json'),
  JSON.stringify(drivers), 'utf8');
console.log('drivers-dealers.json  ' + drivers.regressoes.length +
  ' colunas, controle por grupo, ' + drivers.coleta.usadas_na_regressao + ' linhas');

/* ── 2. analitico em formato colunar ──────────────────────────────────── */
const dims_rot = ler(path.join(AQUI, 'dimensoes-dealers.json'));
dims_rot.rotulo = ROTULO;
dims_rot.origem = ORIGEM;
dims_rot.nota_movimento = 'Medido aqui: as 4.771 vendas são o retrato da extração de ' +
  '17/09/2026. A anedota das 1.302 contra 1.306 é da Cars2You, não desta base.';
const pDims = path.join(AQUI, '_dimensoes-rotulado.json');
fs.writeFileSync(pDims, JSON.stringify(dims_rot), 'utf8');

const colunar = {
  rotulo: ROTULO,
  origem: ORIGEM,
  execucao: 'dealers',
  gerado_em: cfg.gerado_em,
  amostra: { estudo: 'precificacao-dealers', amostra: cfg.nome,
             chave: cfg.chave, base: cfg.base },
  coleta: drivers.coleta,
  media: drivers.desagio.media,
  colunas: COLUNAS,
  linhas: analitico.map((r) => COLUNAS.map((c) => r[c]))
};
const pColunar = path.join(AQUI, '_analitico-colunar.json');
fs.writeFileSync(pColunar, JSON.stringify(colunar), 'utf8');

/* ── 3. as quatro paginas ─────────────────────────────────────────────── */
const { execFileSync } = require('child_process');
const paginas = [
  ['monta-graficos.js',  pDims,                                   'graficos-modelo.html'],
  ['monta-colunas.js',   path.join(AQUI, 'drivers-dealers.json'), 'colunas-desagio.html'],
  ['monta-analitico.js', pColunar,                                'analitico-veiculos.html']
  /* `monta-termos.js` NAO entra. Aquele gerador nao e so layout: o corpo do
     texto afirma "duas frases cobrem 44% da base", "98,9% das vendas tem
     texto" e traz um destaque fixo de REPASSE vs TRADICIONAL. Nenhuma das
     tres coisas e verdade na Dealers -- aqui sao 4.470 textos distintos para
     4.771 vendas e REPASSE nao existe. Parametrizar isso seria reescrever a
     pagina, nao ajusta-la. Os termos da Dealers estao em
     `resultado-dealers.md` e em `termos-dealers.json`. */
];
paginas.forEach(([script, entrada, saida]) => {
  const destino = path.join(AQUI, saida);
  execFileSync('node', [path.join(LA, script), entrada, destino], { stdio: 'pipe' });
  const kb = (fs.statSync(destino).size / 1024).toFixed(0);
  console.log(saida.padEnd(26) + kb + ' KB');
});

fs.unlinkSync(pColunar);
fs.unlinkSync(pDims);
console.log('\nok');
