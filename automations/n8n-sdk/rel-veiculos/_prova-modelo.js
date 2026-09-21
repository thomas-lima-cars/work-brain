/* ══════════════════════════════════════════════════════════════════════
   Prova de que a copia do modelo dentro de `montar-html.js` bate com a
   fonte em `design/`.

       node automations/n8n-sdk/rel-veiculos/_prova-modelo.js

   ── POR QUE ESTA PROVA EXISTE ─────────────────────────────────────────
   `montar-html.js` e o corpo de um no de Code do n8n: la dentro nao ha
   `require` nem `fs`, entao a folha de estilo e os logos precisam viajar
   como literal. Isso e uma COPIA, e copia que so um humano atualiza vira
   copia desatualizada — normalmente descoberta quando alguem pergunta por
   que o relatorio ficou com a cor antiga.

   Aqui a divergencia falha alto. Se esta prova reprovar, a correcao e
   uma linha: `node _aplica-modelo.js`.
   ══════════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');
const injetor = require('./_aplica-modelo.js');

let erros = 0, testes = 0;
const ok = (cond, msg) => {
  testes++;
  if (cond) console.log('  ✓ ' + msg);
  else { console.log('  ✗ ' + msg); erros++; }
};

const fonte = fs.readFileSync(injetor.alvo, 'utf8');

/* Tira o `\r` antes de comparar. O injetor escreve com \n, mas qualquer
   ferramenta que reescreva o arquivo inteiro no Windows o devolve em CRLF,
   e a prova passava a acusar divergencia de CONTEUDO por causa de fim de
   linha — mandando rodar o `_aplica-modelo.js`, que nao conserta isso.
   Corrigido em 21/09, junto com a prova da carteira, que caiu na mesma. */
function extrai(marca) {
  const ini = '/* ' + marca + ':INICIO */';
  const fim = '/* ' + marca + ':FIM */';
  const a = fonte.indexOf(ini), b = fonte.indexOf(fim);
  if (a < 0 || b < 0) return null;
  return fonte.slice(a + ini.length, b)
    .replace(/\r/g, '').replace(/^\n/, '').replace(/\n$/, '');
}

console.log('\n■ A copia bate com a fonte?');
for (const [marca, esperado, origem] of [
  ['TEMA', injetor.blocoTema, 'design/tokens/tema.css'],
  ['LOGOS', injetor.blocoLogos, 'design/marca/cars2you/*.png'],
]) {
  const achado = extrai(marca);
  ok(achado !== null, marca + ': os marcadores existem em montar-html.js');
  if (achado !== null) {
    ok(achado === esperado,
       marca + ': o embutido e igual ao que ' + origem + ' geraria hoje' +
       (achado === esperado ? '' : '  → rode: node _aplica-modelo.js'));
  }
}

/* ---------------------------------------------------------------------
   O que quebra quando este arquivo viaja pro n8n
   ---------------------------------------------------------------------
   O no e transcrito a mao como string JSON. Em 2026-09-10 as 248
   sequencias de escape de aspa foram DOBRADAS nessa transcricao e o
   relatorio saiu em branco. Por isso o gerador inteiro evita barra
   invertida — sao 4 no arquivo todo, contaveis na mao — e o bloco
   injetado nao pode adicionar nenhuma.
   ------------------------------------------------------------------- */
console.log('\n■ Nada que quebre na transcricao pro n8n');
for (const marca of ['TEMA', 'LOGOS']) {
  const b = extrai(marca) || '';
  ok(!b.includes('\\'), marca + ': sem barra invertida');
  ok(!b.includes('${'), marca + ': sem ${');
}

/* ---------------------------------------------------------------------
   A ponte: os nomes antigos continuam existindo
   ---------------------------------------------------------------------
   O relatorio usa 24 classes proprias em centenas de lugares. A adocao do
   modelo NAO renomeou nada — trocou o que os nomes significam. Se um
   apelido sumir, o elemento fica sem estilo e ninguem percebe numa
   diferenca de codigo.
   ------------------------------------------------------------------- */
console.log('\n■ A ponte cobre os tokens antigos');
const ponte = fonte.slice(fonte.indexOf('const PONTE = ['),
                          fonte.indexOf('const CSS = ['));
for (const t of ['--bg', '--card', '--line', '--line2', '--tx', '--dim',
                 '--ac', '--mar', '--gr', '--or', '--rd', '--pu', '--tl']) {
  ok(new RegExp('\\' + t + ':').test(ponte), 'token ' + t + ' tem apelido');
}

console.log('\n■ As classes proprias do relatorio continuam estilizadas');
for (const c of ['.pg', '.tit', '.card', '.card-h', '.card-b', '.kpis', '.kpi',
                 '.filtros', '.fg', '.nota', '.wrap', '.vazio', '.xg', '.xk',
                 '.bar', '.grid', '.aviso', '.ctx', '.gl', '.mono', '.dim']) {
  ok(ponte.includes(c + '{') || ponte.includes(c + ' ') || ponte.includes(c + ','),
     'classe ' + c + ' aparece na ponte');
}

/* ---------------------------------------------------------------------
   Regras do modelo que valem aqui tambem
   ------------------------------------------------------------------- */
console.log('\n■ Regras do modelo');
ok(/data-tema="claro"/.test(fonte), 'o documento nasce num tema declarado');
ok(fonte.includes('LOGOS[t]'), 'o logo troca com o tema (o azul some no escuro)');
ok(!/localStorage/.test(fonte),
   'o tema NAO e gravado — relatorio por link abre igual pra todo mundo');
const kpi = ponte.match(/\.kpi \.vl\{font-size:(\d+)px/);
ok(kpi && Number(kpi[1]) <= 26,
   'o numero do KPI tem ' + (kpi ? kpi[1] : '?') + 'px (teto 26: KPI nao e manchete)');

console.log('\n' + (erros ? '✗ ' + erros + ' de ' + testes + ' falharam'
                          : '✓ ' + testes + ' provas passaram'));
process.exit(erros ? 1 : 0);
