/* Injeta o tema do brain, a camada do IGA e as marcas do IGA e da Fenauto
   dentro de `montar-painel.js`.

       node automations/n8n-sdk/painel-eventos-fenauto-iga/_aplica-modelo.js

   Entra:  design/tokens/tema.css + design/tokens/tema-iga.css, nessa ordem —
           a identidade do IGA (05/11; o irmão da Cars2You usa o tema.css
           sozinho, o do C6 soma a tema-c6.css)
           design/marca/iga/logo-iga-claro.svg (inline; as cores de cada tema
           são CSS, no Montar Painel)
           design/marca/fenauto/logo-fenauto-claro.svg (inline, idem)
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
const css = compacta(ler('tokens', 'tema.css')) + compacta(ler('tokens', 'tema-iga.css'));
recusa(css, 'tema.css + tema-iga.css');

const blocoTema = 'const CSS_TEMA = [\n' +
  emLinhas(css, 96).map((l) => "  '" + l + "'").join(',\n') + '\n].join(\'\');';

/* a da Fenauto vai DENTRO do HTML, como SVG, numa cópia só (26/10): em base64,
   claro e escuro somavam 57 KB e o nó passava de 87 para 145 KB — e o nó é
   transmitido à API por extenso. Inline, a cor de cada tema é CSS e o
   texto não paga os 33% do base64. Compactada
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

/* a do IGA (05/11): a arte de design/marca/iga, 107 x 48, três cores. As duas
   que mudam com o tema viram classe — a tinta #000D3C (branca no escuro) e a
   barra azul #001FBD (#7C93FF no escuro, como a logo-iga-escuro.svg); o
   laranja #FF6200 é o mesmo nos dois e fica como atributo. Coordenadas com
   duas casas: 0,01 numa caixa de 107. */
const duasCasas = (d) => d.replace(/-?[0-9]+[.][0-9]+/g, (n) => {
  let s = Number(n).toFixed(2);
  while (s.indexOf('.') >= 0 && (s.slice(-1) === '0' || s.slice(-1) === '.')) s = s.slice(0, -1);
  return s === '-0' ? '0' : s;
});
const igaCru = ler('marca', 'iga', 'logo-iga-claro.svg');
if (igaCru.indexOf('viewBox="0 0 107 48"') < 0 || (igaCru.match(/fill="#000D3C"/g) || []).length !== 22 ||
    (igaCru.match(/fill="#001FBD"/g) || []).length !== 1 || (igaCru.match(/fill="#FF6200"/g) || []).length !== 1) {
  console.error('✗ logo-iga-claro.svg mudou de forma: conferir viewBox e cores antes de injetar');
  process.exit(1);
}
const iga = igaCru
  .split(String.fromCharCode(10)).map((l) => l.trim()).join('')
  .replace(/<svg width="107" height="48" viewBox="0 0 107 48" fill="none" xmlns="[^"]*">/,
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 107 48" fill="none" role="img" aria-label="IGA"><title>IGA</title>')
  .replace(/ d="([^"]*)"/g, (m, d) => ' d="' + duasCasas(d) + '"')
  .split('fill="#000D3C"').join('class="iga-t"')
  .split('fill="#001FBD"').join('class="iga-a"');
if (iga.indexOf('<svg xmlns=') !== 0 || iga.indexOf('<title>IGA</title>') < 0) {
  console.error('✗ abertura da logo do IGA não reconhecida');
  process.exit(1);
}
recusa(iga, 'logo do IGA em SVG');

const blocoLogos = "const LOGO_IGA = '" + iga + "';" + String.fromCharCode(10) +
  "const LOGO_FEN = '" + fenauto + "';";

function troca(fonte, marca, conteudo) {
  const ini = '/* ' + marca + ':INICIO */';
  const fim = '/* ' + marca + ':FIM */';
  const a = fonte.indexOf(ini);
  const b = fonte.indexOf(fim);
  if (a < 0 || b < a) { console.error('✗ marcadores de %s não encontrados', marca); process.exit(1); }
  return fonte.slice(0, a + ini.length) + '\n' + conteudo + '\n' + fonte.slice(b);
}

module.exports = { blocoTema, blocoLogos, logoFenauto: fenauto, logoIga: iga, alvo: ALVO };

if (require.main === module) {
  let fonte = semCR(fs.readFileSync(ALVO, 'utf8'));
  fonte = troca(fonte, 'TEMA', blocoTema);
  fonte = troca(fonte, 'LOGOS', blocoLogos);
  fs.writeFileSync(ALVO, fonte, 'utf8');
  console.log('✓ montar-painel.js: tema + IGA %d bytes compactados · logo do IGA inline (%d bytes) · logo da Fenauto inline (%d bytes)',
    css.length, iga.length, fenauto.length);
}
