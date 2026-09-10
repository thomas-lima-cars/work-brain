/* ══════════════════════════════════════════════════════════════════════
   Regera o HTML a partir de um `dados-*.json` já coletado, SEM rodar o
   workflow de novo.

   Mesma ideia do `monta_html_de_dados.js` do relatório C6: separar o que
   custa (a coleta, 8 minutos e ~140 chamadas em produção) do que é de
   graça (a tela). Mexeu só no visual? roda isto.

   Como funciona: o nó `montar-html.js` tem a seção de render delimitada
   por `RENDER:INICIO` / `RENDER:FIM`. Dali pra baixo tudo depende apenas
   de DADOS, então este script recorta esse trecho e executa com o DADOS
   salvo. Uma fonte só — o que muda no nó muda aqui, sem cópia paralela.

     node monta_html_de_dados.js dados-49823.json saida.html
   ══════════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');

const entrada = process.argv[2] || 'dados-49823.json';
const saida = process.argv[3] || entrada.replace(/^dados-/, 'saida-').replace(/\.json$/, '.html');
const AQUI = __dirname;

const DADOS = JSON.parse(fs.readFileSync(path.join(AQUI, entrada), 'utf8'));

const fonte = fs.readFileSync(path.join(AQUI, 'montar-html.js'), 'utf8');
const ini = fonte.indexOf('/* ==== RENDER:INICIO ====');
const fim = fonte.indexOf('/* ==== RENDER:FIM ==== */');
if (ini < 0 || fim < 0) {
  throw new Error('marcadores RENDER:INICIO / RENDER:FIM nao encontrados em montar-html.js');
}
const render = fonte.slice(ini, fim);

/* o que a seção de render espera encontrar no escopo */
const META = DADOS.meta || {};
const CONFIANCA_MIN = (DADOS.parametros && DADOS.parametros.confianca_min) || 5;
const DADOS_JSON = JSON.stringify(DADOS).split('</').join('<\\/');

const html = new Function('DADOS', 'META', 'CONFIANCA_MIN', 'DADOS_JSON',
  render + '\nreturn html;')(DADOS, META, CONFIANCA_MIN, DADOS_JSON);

fs.writeFileSync(path.join(AQUI, saida), html);

const V = DADOS.veiculos || [];
const eventos = Array.from(new Set(V.map((v) => v.evento))).sort();
console.log('entrada: ' + entrada);
console.log('saida:   ' + saida + '  (' + Math.round(html.length / 1024) + ' KB)');
console.log('veiculos: ' + V.length + ' | lojas: ' + (DADOS.lojas || []).length +
            ' | pares: ' + ((DADOS.pares || []).length / 3));
console.log('eventos no filtro: ' + eventos.length);
eventos.forEach((e) => {
  console.log('  ' + String(V.filter((v) => v.evento === e).length).padStart(4) + '  ' + e);
});
/* smoke test do JS do navegador: sintaxe + execucao num DOM de mentira.
   Sem isto, um erro de concatenacao so aparece quando voce abre a pagina. */
const erros = require('./_smoke_dom.js').smoke(html);
erros.forEach(function (e) { console.log('  FALHA ' + e); });

/* checagens rapidas do que este script existe pra garantir */
const testes = [
  ['tem o select de evento', html.indexOf('id="f_ev"') > 0],
  ['o filtro de evento reage', html.indexOf('onchange=pintaV') > 0],
  ['limpar zera o evento tambem', /f_ev\\"\).value=\\""/.test(html) || html.indexOf('$("#f_ev").value=""') > 0],
  ['as duas tabelas existem', html.indexOf('id="t_v"') > 0 && html.indexOf('id="t_l"') > 0],
  ['HTML integro', html.indexOf('<!doctype html>') === 0 && html.indexOf('</html>') > 0],
  ['sem virgula decimal em CSS', !/[a-z-]+:\s*[\d]+,[\d]+(%|px|em)/.test(html)]
];
let ruim = erros.length;
testes.forEach((t) => { if (!t[1]) { ruim++; console.log('  FALHA ' + t[0]); } });
console.log(ruim === 0 ? '\nchecagens: todas ok' : '\n' + ruim + ' checagem(ns) falhou');
process.exit(ruim === 0 ? 0 : 1);
