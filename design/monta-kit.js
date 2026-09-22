/* ============================================================================
   Monta o KIT DE PAINEL — o arquivo único que sai daqui para o time.

       node design/monta-kit.js

   Entra:  _fonte-kit.md  +  tokens/tema.css
   Sai:    kit-de-painel.md

   ── POR QUE GERAR EM VEZ DE ESCREVER À MÃO ────────────────────────────────
   O kit precisa ser AUTOSSUFICIENTE: quem recebe não tem este repositório,
   então o tema inteiro viaja dentro dele. Copiar 580 linhas de CSS à mão cria
   exatamente a duplicata que a regra 11 proíbe — a cópia apodrece calada, e o
   time passa a montar painel com um tema que já não existe aqui.

   Mesma lógica do `monta-modelos.js`: uma fonte, vários alvos.
   ========================================================================== */

const fs = require('fs');
const path = require('path');

const AQUI = __dirname;
const MOLDE = path.join(AQUI, '_fonte-kit.md');
const TEMA = path.join(AQUI, 'tokens', 'tema.css');
const ALVO = path.join(AQUI, 'kit-de-painel.md');

const ler = (p) => fs.readFileSync(p, 'utf8');

/* O marcador é montado em pedaços de propósito. Escrito inteiro, ele
   apareceria DUAS vezes no molde — uma como marcador e outra dentro deste
   comentário —, e a guarda abaixo acusaria o próprio arquivo. A guarda está
   certa; quem tinha que mudar era o jeito de escrever. */
const MARCA = '__' + 'TEMA_CSS' + '__';
const MARCA_LOGOS = '__' + 'LOGOS' + '__';

/* As quatro artes da marca viajam DENTRO do kit: quem recebe não tem a pasta
   `marca/`, e um kit que manda "cole a sua logo aqui" deixa o painel do
   colega sem marca nenhuma até alguém caçar o arquivo. São ~13 KB.

   A ordem é a mesma do modelo e a mesma do nó do Radar — três lugares, um
   arranjo só, para quem leu um reconhecer o outro. */
const ARTES = [
  ['claro', 'extensa', 'logo-cars2you-preto.svg'],
  ['claro', 'curta', 'logo-c2y-preto.svg'],
  ['escuro', 'extensa', 'logo-cars2you-branco.svg'],
  ['escuro', 'curta', 'logo-c2y-branco.svg'],
];

const uriArte = (arq) => 'data:image/svg+xml;base64,' +
  fs.readFileSync(path.join(AQUI, 'marca', 'cars2you', arq)).toString('base64');

function blocoLogos() {
  const por = {};
  for (const [tema, largura, arq] of ARTES) {
    (por[tema] = por[tema] || {})[largura] = uriArte(arq);
  }
  /* Uma arte por linha, e aspas SIMPLES: o base64 não tem aspa nem barra
     invertida, então não há o que escapar — e o bloco entra colável tal como
     está, sem o leitor ter que decidir nada. */
  return 'const LOGO = {\n' + ['claro', 'escuro'].map((t) =>
    '  ' + t + ': {\n' +
    "    extensa: '" + por[t].extensa + "',\n" +
    "    curta:   '" + por[t].curta + "'\n" +
    '  }').join(',\n') + '\n};';
}

/* ── os comentários do tema apontam para ESTE repositório ──────────────────
   "node design/modelos/monta-modelos.js" é a instrução certa aqui dentro e
   inútil para quem recebe o kit — a pessoa não tem essa pasta. Em vez de
   deixar o tema sem comentário (eles são metade do valor da folha) ou de
   manter uma segunda cópia à mão (a duplicata que este gerador existe para
   evitar), a troca é EXPLÍCITA e pequena.

   A prova reaplica esta mesma tabela sobre o `tema.css` e exige que o
   resultado seja idêntico ao que está no kit. É assim que a garantia
   continua valendo: nada além destas linhas pode divergir. */
const TROCAS = [
  ['node design/modelos/monta-modelos.js',
   'regere o painel a partir do kit'],
  ['Ver design/paletas/README.md.',
   'Ver "Trocar de marca", no kit.'],
  ['design/regras-de-layout.md: texto só sobre superfície.',
   'a regra 9 do kit: texto só sobre superfície.'],
  ['(node design/_contraste.js)',
   '(o medidor esta em "Trocar de marca", no kit)'],
  ['(ver a prova de hierarquia em design/_prova_modelos.js)',
   '(ver a regra 2 do kit: KPI nao e manchete)'],
  ['Ver a regra 10c em design/regras-de-layout.md.',
   'Ver a regra 9 do kit.'],
];

const paraOKit = (txt) => TROCAS.reduce((s, [de, por]) => s.split(de).join(por), txt);

function monta() {
  const molde = ler(MOLDE);
  const css = ler(TEMA);

  for (const [marca, nome] of [[MARCA, 'tema'], [MARCA_LOGOS, 'logos']]) {
    const quantos = molde.split(marca).length - 1;
    if (quantos !== 1) {
      console.error('FALHA: o molde tem ' + quantos + ' marcador(es) de ' +
        nome + ', esperava 1.');
      process.exit(1);
    }
  }

  /* Cerca de três crases dentro do CSS fecharia o bloco de código do Markdown
     no meio, e o resto do tema viraria texto corrido. Nunca aconteceu, mas o
     custo de conferir é uma linha, e o de não conferir é um kit quebrado em
     silêncio na mão de outra pessoa. */
  if (css.indexOf('```') >= 0) {
    console.error('FALHA: o tema.css tem cerca de crases — ela fecharia o bloco do Markdown.');
    process.exit(1);
  }

  const cssKit = paraOKit(css);
  if (cssKit.indexOf('design/') >= 0) {
    console.error('FALHA: sobrou caminho deste repositorio no tema do kit — ' +
      'quem recebe nao tem essa pasta. Acrescente a linha em TROCAS.');
    process.exit(1);
  }

  const logos = blocoLogos();
  const saida = molde.split(MARCA).join(cssKit).split(MARCA_LOGOS).join(logos);
  fs.writeFileSync(ALVO, saida);

  console.log('kit-de-painel.md  ' + Buffer.byteLength(saida) + ' bytes' +
    '  (tema: ' + css.split('\n').length + ' linhas' +
    ', marca: ' + ARTES.length + ' artes, ' +
    Math.round(logos.length / 1024) + ' KB)');
}

/* A prova importa a TABELA daqui para reaplicá-la e conferir igualdade. Sem
   esta guarda, importar rodaria o gerador — e a prova passaria a regerar o
   alvo que deveria estar julgando, transformando a conferência de frescor num
   carimbo automático. */
module.exports = { TROCAS, paraOKit, ARTES, uriArte, blocoLogos };
if (require.main === module) monta();
