/* Injeta no nó `montar-painel.js` o que ele não pode ler de arquivo no n8n:

       node automations/n8n-sdk/painel-precificacao/_aplica-modelo.js

   TEMA    design/tokens/tema.css, compactado
   LOGOS   design/marca/cars2you — as mesmas quatro artes do modelo claro
           (extensa e curta, preta no claro e branca no escuro)
   APLICA  automations/precificacao/preditivo/aplica-modelo.js — o avaliador
           do modelo de preço, sem a linha de module.exports

   O nó roda dentro do n8n, sem `fs` nem pasta do repo. Cópia desatualiza
   calada, então `prova-local.js` compara o que está no nó com o que este
   injetor produziria hoje, e reprova se divergir. Não edite os blocos à mão.
   Padrão copiado do Painel de Eventos C6. */

const fs = require('fs');
const path = require('path');

const AQUI = __dirname;
const RAIZ = path.resolve(AQUI, '..', '..', '..');
const DESIGN = path.join(RAIZ, 'design');
const ALVO = path.join(AQUI, 'montar-painel.js');

const semCR = (s) => s.split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
const compacta = (css) => css.split(/\/\*[\s\S]*?\*\//).join('').split(/\s*\n\s*/).filter(Boolean).join('');

function recusa(txt, onde, aspas) {
  const achou = [];
  if (txt.indexOf(String.fromCharCode(92)) >= 0) achou.push('barra invertida');
  if (aspas && txt.indexOf("'") >= 0) achou.push('aspa simples');
  if (aspas && txt.indexOf('${') >= 0) achou.push('${');
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

const css = compacta(semCR(fs.readFileSync(path.join(DESIGN, 'tokens', 'tema.css'), 'utf8')));
recusa(css, 'tema.css', true);
const blocoTema = 'const CSS_TEMA = [\n' + emLinhas(css, 96).map((l) => "  '" + l + "'").join(',\n') + "\n].join('');";

const uri = (arq) => 'data:image/svg+xml;base64,' +
  fs.readFileSync(path.join(DESIGN, 'marca', 'cars2you', arq)).toString('base64');
const L = { claro: { extensa: uri('logo-cars2you-preto.svg'), curta: uri('logo-c2y-preto.svg') },
            escuro: { extensa: uri('logo-cars2you-branco.svg'), curta: uri('logo-c2y-branco.svg') } };
recusa(JSON.stringify(L), 'logos em base64', true);
const blocoLogos = 'const LOGO = ' + JSON.stringify(L) + ';';

let aplica = semCR(fs.readFileSync(path.join(RAIZ, 'automations', 'precificacao', 'preditivo', 'aplica-modelo.js'), 'utf8'));
const corte = aplica.indexOf("if (typeof module !== 'undefined')");
if (corte < 0) { console.error('✗ aplica-modelo.js sem a linha de module.exports esperada'); process.exit(1); }
aplica = aplica.slice(0, corte).trim();
recusa(aplica, 'aplica-modelo.js', false);
const blocoAplica = aplica;

function troca(fonte, marca, conteudo) {
  const ini = '/* ' + marca + ':INICIO */';
  const fim = '/* ' + marca + ':FIM */';
  const a = fonte.indexOf(ini);
  const b = fonte.indexOf(fim);
  if (a < 0 || b < a) { console.error('✗ marcadores de %s não encontrados', marca); process.exit(1); }
  return fonte.slice(0, a + ini.length) + '\n' + conteudo + '\n' + fonte.slice(b);
}

function injeta(fonte) {
  fonte = troca(fonte, 'TEMA', blocoTema);
  fonte = troca(fonte, 'LOGOS', blocoLogos);
  return troca(fonte, 'APLICA', blocoAplica);
}

module.exports = { injeta, alvo: ALVO, semCR };

if (require.main === module) {
  const fonte = injeta(semCR(fs.readFileSync(ALVO, 'utf8')));
  fs.writeFileSync(ALVO, fonte, 'utf8');
  console.log('✓ montar-painel.js: tema %d bytes · 4 logos · avaliador %d bytes', css.length, blocoAplica.length);
}
