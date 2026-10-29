/* Injeta o tema do brain e a marca da Cars2You dentro de `montar-painel.js`.

       node automations/n8n-sdk/painel-eventos-cars2you/_aplica-modelo.js

   TEMA    design/tokens/tema.css, compactado (sem camada de produto: o painel
           é da própria Cars2You)
   LOGOS   design/marca/cars2you — extensa e curta, preta no claro e branca
           no escuro (as quatro do Painel de Precificação)

   O nó roda dentro do n8n, sem `fs` nem pasta do repo: folha e logos viajam
   como literal. Cópia desatualiza calada, então `prova-local.js` compara o
   que está no nó com o que este injetor produziria hoje, e reprova se
   divergir. Não edite os blocos à mão. */

const fs = require('fs');
const path = require('path');

const AQUI = __dirname;
const DESIGN = path.resolve(AQUI, '..', '..', '..', 'design');
const ALVO = path.join(AQUI, 'montar-painel.js');

const compacta = (css) => css
  .split(/\/\*[\s\S]*?\*\//).join('')
  .split(/\s*\n\s*/).filter(Boolean).join('');

function recusa(txt, onde) {
  const achou = [];
  if (txt.indexOf(String.fromCharCode(92)) >= 0) achou.push('barra invertida');
  if (txt.indexOf("'") >= 0) achou.push('aspa simples');
  if (txt.indexOf('${') >= 0) achou.push('${');
  if (achou.length) {
    console.error('✗ %s contém %s — o nó viaja pro n8n como string.', onde, achou.join(' e '));
    process.exit(1);
  }
}

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

/* o checkout do git grava CRLF aqui (core.autocrlf): sem normalizar, o bloco
   injetado e o que a prova recalcula divergem só no fim de linha */
const semCR = (s) => s.split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
const css = compacta(semCR(fs.readFileSync(path.join(DESIGN, 'tokens', 'tema.css'), 'utf8')));
recusa(css, 'tema.css');

const blocoTema = 'const CSS_TEMA = [\n' +
  emLinhas(css, 96).map((l) => "  '" + l + "'").join(',\n') + '\n].join(\'\');';

const uri = (arq) => 'data:image/svg+xml;base64,' +
  fs.readFileSync(path.join(DESIGN, 'marca', 'cars2you', arq)).toString('base64');
const L = {
  claro: { extensa: uri('logo-cars2you-preto.svg'), curta: uri('logo-c2y-preto.svg') },
  escuro: { extensa: uri('logo-cars2you-branco.svg'), curta: uri('logo-c2y-branco.svg') }
};
recusa(JSON.stringify(L), 'logos em base64');
const blocoLogos = 'const LOGO = ' + JSON.stringify(L) + ';';

function troca(fonte, marca, conteudo) {
  const ini = '/* ' + marca + ':INICIO */';
  const fim = '/* ' + marca + ':FIM */';
  const a = fonte.indexOf(ini);
  const b = fonte.indexOf(fim);
  if (a < 0 || b < a) { console.error('✗ marcadores de %s não encontrados', marca); process.exit(1); }
  return fonte.slice(0, a + ini.length) + '\n' + conteudo + '\n' + fonte.slice(b);
}

module.exports = { blocoTema, blocoLogos, alvo: ALVO };

if (require.main === module) {
  let fonte = semCR(fs.readFileSync(ALVO, 'utf8'));
  fonte = troca(fonte, 'TEMA', blocoTema);
  fonte = troca(fonte, 'LOGOS', blocoLogos);
  fs.writeFileSync(ALVO, fonte, 'utf8');
  console.log('✓ montar-painel.js: tema %d bytes compactados · 4 logos da Cars2You', css.length);
}
