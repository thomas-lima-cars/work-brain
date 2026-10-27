/* Injeta o tema do brain e as marcas do Fenauto e do C6 dentro de `montar-painel.js`.

       node automations/n8n-sdk/painel-eventos-fenauto-c6/_aplica-modelo.js

   Entra:  design/tokens/tema.css + design/tokens/tema-c6.css (nessa ordem)
           design/marca/c6/logo-c6-{preto,branco}.svg
           design/marca/fenauto/logo-fenauto-claro.svg (26/10; inline, o escuro é CSS)
   Sai:    os blocos TEMA e LOGOS de montar-painel.js, reescritos.

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
const ler = (...p) => semCR(fs.readFileSync(path.join(DESIGN, ...p), 'utf8'));
const css = compacta(ler('tokens', 'tema.css')) + compacta(ler('tokens', 'tema-c6.css'));
recusa(css, 'tema.css + tema-c6.css');

const blocoTema = 'const CSS_TEMA = [\n' +
  emLinhas(css, 96).map((l) => "  '" + l + "'").join(',\n') + '\n].join(\'\');';

const uri = (pasta, arq) => 'data:image/svg+xml;base64,' +
  fs.readFileSync(path.join(DESIGN, 'marca', pasta, arq)).toString('base64');
const claro = uri('c6', 'logo-c6-preto.svg');
const escuro = uri('c6', 'logo-c6-branco.svg');
recusa(claro + escuro, 'logos em base64');

/* a da Fenauto vai DENTRO do HTML, como SVG, numa cópia só (26/10): em base64,
   claro e escuro somavam 57 KB e o nó passava de 87 para 145 KB — e o nó é
   transmitido à API por extenso. Inline, a cor do escuro é CSS (o branco da
   logo-fenauto-escuro.svg) e o texto não paga os 33% do base64. Compactada
   aqui, como o CSS: sem quebra de linha, sem width/height (o tamanho é do
   CSS), coordenadas do traço com uma casa — 0,1 numa caixa de 1076. O
   transform da Cars2You NÃO é arredondado: a escala dela tem cinco casas. */
const umaCasa = (d) => d.replace(/-?[0-9]+[.][0-9]+/g, (n) => {
  const s = Number(n).toFixed(1);
  return s.slice(-2) === '.0' ? s.slice(0, -2) : s;
});
const fenauto = ler('marca', 'fenauto', 'logo-fenauto-claro.svg')
  .split(String.fromCharCode(10)).join('')
  .replace(/ width="[^"]*" height="[^"]*"/, '')
  .replace(/ d="([^"]*)"/g, (m, d) => ' d="' + umaCasa(d) + '"');
if (fenauto.indexOf('<svg ') !== 0 || fenauto.indexOf('viewBox="0 8.1 1076 298.3"') < 0) {
  console.error('✗ logo-fenauto-claro.svg mudou de forma: conferir o viewBox antes de injetar');
  process.exit(1);
}
recusa(fenauto, 'logo da Fenauto em SVG');
const blocoLogos = "const LOGO = {\n  claro: '" + claro + "',\n  escuro: '" + escuro + "'\n};\n" +
  "const LOGO_FEN = '" + fenauto + "';";

function troca(fonte, marca, conteudo) {
  const ini = '/* ' + marca + ':INICIO */';
  const fim = '/* ' + marca + ':FIM */';
  const a = fonte.indexOf(ini);
  const b = fonte.indexOf(fim);
  if (a < 0 || b < a) { console.error('✗ marcadores de %s não encontrados', marca); process.exit(1); }
  return fonte.slice(0, a + ini.length) + '\n' + conteudo + '\n' + fonte.slice(b);
}

module.exports = { blocoTema, blocoLogos, logoFenauto: fenauto, alvo: ALVO };

if (require.main === module) {
  let fonte = semCR(fs.readFileSync(ALVO, 'utf8'));
  fonte = troca(fonte, 'TEMA', blocoTema);
  fonte = troca(fonte, 'LOGOS', blocoLogos);
  fs.writeFileSync(ALVO, fonte, 'utf8');
  console.log('✓ montar-painel.js: tema %d bytes compactados · logos do C6 + Fenauto inline (%d bytes)', css.length, fenauto.length);
}
