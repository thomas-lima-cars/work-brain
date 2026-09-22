/* ══════════════════════════════════════════════════════════════════════
   Injeta o modelo do brain dentro de `montar-html.js`.

       node automations/n8n-sdk/rel-veiculos/_aplica-modelo.js

   Entra:  design/tokens/tema.css
           design/marca/cars2you/logo-{cars2you,c2y}-{preto,branco}.svg
   Sai:    montar-html.js, com os blocos entre TEMA:INICIO/FIM e
           LOGOS:INICIO/FIM reescritos.

   ── POR QUE INJETAR EM VEZ DE IMPORTAR ────────────────────────────────
   `montar-html.js` e o corpo de um no de Code do n8n. La ele nao tem
   `require`, nao tem `fs`, e nao existe pasta do repo — tudo que ele usa
   precisa estar DENTRO dele. Entao a folha de estilo e os logos viajam
   como literal.

   Isso cria uma copia, e copia sem dono desatualiza. Por isso existe o
   `_prova-modelo.js`: ele compara a copia com a fonte e falha se
   divergirem. Mesmo arranjo que o painel de precificacao usa pro Bootstrap.

   ── CUIDADO COM BARRA INVERTIDA ───────────────────────────────────────
   Este arquivo viaja pro n8n como string JSON transcrita a mao, e barra
   invertida e onde este projeto mais erra (ver o comentario antes do APP).
   Por isso o injetor RECUSA conteudo que tenha barra invertida, aspa
   simples ou `${` — em vez de escapar e torcer.
   ══════════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');

const AQUI = __dirname;
const REPO = path.resolve(AQUI, '..', '..', '..');
const DESIGN = path.join(REPO, 'design');
const ALVO = path.join(AQUI, 'montar-html.js');

/* --------------------------------------------------------------------- */
function compactaCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')       // comentario: e pra quem le a fonte
    .replace(/\s*\n\s*/g, '\n')
    .split('\n')
    .filter(Boolean)
    .join('');
}

/** Quebra em pedacos que caibam numa linha, sem cortar dentro de um valor. */
function emLinhas(css, largura) {
  const partes = [];
  let atual = '';
  for (const t of css.split(/(?<=[;{}])/)) {
    if (atual.length + t.length > largura && atual) { partes.push(atual); atual = ''; }
    atual += t;
  }
  if (atual) partes.push(atual);
  return partes;
}

function recusaPerigo(txt, onde) {
  const achados = [];
  if (txt.includes('\\')) achados.push('barra invertida');
  if (txt.includes("'")) achados.push('aspa simples');
  if (txt.includes('${')) achados.push('${');
  if (achados.length) {
    console.error('✗ %s contem %s — o no viaja pro n8n como string e isso quebra la.',
                  onde, achados.join(' e '));
    process.exit(1);
  }
}

function trocaBloco(fonte, marca, conteudo) {
  const ini = '/* ' + marca + ':INICIO */';
  const fim = '/* ' + marca + ':FIM */';
  const a = fonte.indexOf(ini), b = fonte.indexOf(fim);
  if (a < 0 || b < 0 || b < a) {
    console.error('✗ marcadores de %s nao encontrados em montar-html.js', marca);
    process.exit(1);
  }
  return fonte.slice(0, a + ini.length) + '\n' + conteudo + '\n' + fonte.slice(b);
}

/* --------------------------------------------------------------------- */
const cssFonte = fs.readFileSync(path.join(DESIGN, 'tokens', 'tema.css'), 'utf8');
const css = compactaCss(cssFonte);
recusaPerigo(css, 'design/tokens/tema.css (compactado)');

const linhasCss = emLinhas(css, 92).map(l => "  '" + l + "',");
linhasCss[linhasCss.length - 1] = linhasCss[linhasCss.length - 1].replace(/,$/, '');

/* SVG desde 22/09, no lugar dos PNG de 300 x 56. E sao QUATRO artes, nao
   duas: o tema escolhe a COR e a largura da tela escolhe a ARTE -- extensa na
   web, curta ("c2y") no telefone. Mesma estrutura do modelo do brain. */
const uri = arq => 'data:image/svg+xml;base64,' +
  fs.readFileSync(path.join(DESIGN, 'marca', 'cars2you', arq)).toString('base64');

const ARTES = [
  ['claro_extensa', 'logo-cars2you-preto.svg'],
  ['claro_curta', 'logo-c2y-preto.svg'],
  ['escuro_extensa', 'logo-cars2you-branco.svg'],
  ['escuro_curta', 'logo-c2y-branco.svg'],
];

/* Conferir o CONTEUDO, nao o invólucro: a primeira versao passava a linha
   inteira e reprovava nas aspas que o proprio injetor acabara de escrever. */
const logos = ARTES.map(([chave, arq]) => {
  const b64 = uri(arq);
  recusaPerigo(b64, arq + ' em base64');
  return "  " + chave + ": '" + b64 + "'";
}).join(',\n');

/* O que a prova precisa comparar. Exportar os BLOCOS PRONTOS, e nao as
   funcoes, e de proposito: se a prova refizesse a compactacao com codigo
   proprio, ela estaria conferindo uma segunda implementacao contra a
   primeira — e duas implementacoes escritas juntas erram juntas. Assim ela
   compara o que o injetor produziria HOJE com o que esta no arquivo. */
module.exports = {
  blocoTema: linhasCss.join('\n'),
  blocoLogos: logos,
  alvo: ALVO,
};

if (require.main === module) {
  let fonte = fs.readFileSync(ALVO, 'utf8');
  fonte = trocaBloco(fonte, 'TEMA', linhasCss.join('\n'));
  fonte = trocaBloco(fonte, 'LOGOS', logos);
  fs.writeFileSync(ALVO, fonte, 'utf8');

  console.log('✓ montar-html.js atualizado');
  console.log('  tema.css: %d -> %d bytes compactados, em %d linhas',
              cssFonte.length, css.length, linhasCss.length);
  console.log('  logos: %d artes (extensa/curta x claro/escuro)', ARTES.length);
  console.log('');
  console.log('Confira com: node automations/n8n-sdk/rel-veiculos/_prova-modelo.js');
}
