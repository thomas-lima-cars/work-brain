/* Injeta o tema do brain e a marca do C6 dentro de `montar-painel.js`.

       node automations/n8n-sdk/painel-eventos-c6/_aplica-modelo.js

   Entra:  design/tokens/tema.css + design/tokens/tema-c6.css (nessa ordem)
           design/marca/c6/logo-c6-{preto,branco}.svg
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

const ler = (...p) => fs.readFileSync(path.join(DESIGN, ...p), 'utf8');
const css = compacta(ler('tokens', 'tema.css')) + compacta(ler('tokens', 'tema-c6.css'));
recusa(css, 'tema.css + tema-c6.css');

const blocoTema = 'const CSS_TEMA = [\n' +
  emLinhas(css, 96).map((l) => "  '" + l + "'").join(',\n') + '\n].join(\'\');';

const uri = (arq) => 'data:image/svg+xml;base64,' +
  fs.readFileSync(path.join(DESIGN, 'marca', 'c6', arq)).toString('base64');
const claro = uri('logo-c6-preto.svg');
const escuro = uri('logo-c6-branco.svg');
recusa(claro + escuro, 'logos em base64');
const blocoLogos = "const LOGO = {\n  claro: '" + claro + "',\n  escuro: '" + escuro + "'\n};";

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
  let fonte = fs.readFileSync(ALVO, 'utf8');
  fonte = troca(fonte, 'TEMA', blocoTema);
  fonte = troca(fonte, 'LOGOS', blocoLogos);
  fs.writeFileSync(ALVO, fonte, 'utf8');
  console.log('✓ montar-painel.js: tema %d bytes compactados · 2 logos', css.length);
}
