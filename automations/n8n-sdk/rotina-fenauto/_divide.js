/* Prepara os nós da Rotina Fenauto: os três painéis num workflow só.

     node _divide.js      (depois do ciclo de cada painel: _aplica-modelo + _enxuga)

   Lê o n8n/*.js (enxuto) de cada painel e grava, em n8n/<ramo>/, os nós do
   ramo com o nome trocado e o Montar Painel em três pedaços:

     Peças do Tema <ramo>     o CSS do tema e as logos (até o LOGO_FEN) e o
                              CSS do painel e os ícones (CSS_PAINEL, ICONE):
                              texto puro, só entra no HTML
     Peças da Página <ramo>   a função APP da página (só entra no HTML pelo
                              texto, APP.toString())
     Montar Painel <ramo>     o resto, que lê as duas pelo nome

   Por quê: cada Montar Painel tem 100 a 115 KB e a API do n8n só recebe o
   código inline. No Painel de Eventos Cars2You (06/11) nenhuma chamada levou
   164 KB sem trocar caractere; abaixo de 56 KB, levou. Mesma solução, mesmo
   teto (ver ../painel-eventos-cars2you/_divide.js).

   O nome de cada nó ganha o ramo (" C6", " IGA", " Cars2You"), porque os
   três ramos moram no mesmo workflow; as referências $('...') seguem.
   O Virar Arquivo publica em Fenauto_202611/<subpasta> (Thomas, 09/11).

   A FONTE de cada painel não muda: prova.js roda o nó inteiro de cada um e os
   pedaços daqui contra a mesma coleta e exige o mesmo HTML e o mesmo resumo. */

const fs = require('fs');
const path = require('path');

const NL = String.fromCharCode(10);
const PASTA_RAIZ = 'Fenauto_202611';
const TETO = 56 * 1024;

const RAMOS = [
  { id: 'c6', sufixo: ' C6', painel: 'painel-eventos-fenauto-c6', pasta: PASTA_RAIZ + '/C6' },
  { id: 'iga', sufixo: ' IGA', painel: 'painel-eventos-fenauto-iga', pasta: PASTA_RAIZ + '/IGA' },
  { id: 'cars2you', sufixo: ' Cars2You', painel: 'painel-eventos-fenauto-cars2you', pasta: PASTA_RAIZ }
];

const ler = (ramo, arq) => fs.readFileSync(path.join(__dirname, '..', ramo.painel, 'n8n', arq), 'utf8')
  .split(String.fromCharCode(13, 10)).join(NL);

/* troca exata, contando: uma troca que não acontece é um nó que leria o
   nó errado, calado */
const troca = (s, de, para, vezes) => {
  const n = s.split(de).length - 1;
  if (n !== vezes) throw new Error('esperado ' + vezes + 'x "' + de + '", achei ' + n);
  return s.split(de).join(para);
};

/* nomes declarados no nível de cima de uma fatia (const X = ...) */
const nomes = (fatia) => fatia.split(NL).filter((l) => l.indexOf('const ') === 0)
  .map((l) => l.slice(6, l.indexOf(' = ')));

const nos = (ramo) => {
  const s = ler(ramo, 'montar-painel.js');
  const acha = (marca, desde) => {
    const i = s.indexOf(marca, desde || 0);
    if (i < 0 || s.indexOf(marca, i + 1) >= 0) throw new Error(ramo.id + ': marcador ausente ou repetido: ' + marca);
    return i;
  };
  /* fatia 1: do início ao fim da linha do LOGO_FEN (CSS_TEMA e as logos) */
  if (s.indexOf('const CSS_TEMA = [') !== 0) throw new Error(ramo.id + ': o nó não começa no CSS_TEMA');
  const fimLogo = s.indexOf("';" + NL, acha(NL + "const LOGO_FEN = '")) + 3;
  /* fatia 2: a função APP inteira, até a chave que fecha ela na coluna 0
     (o que vem depois, como o DADOS.glossario, fica no Montar Painel) */
  const iApp = acha(NL + 'function APP(D) {') + 1;
  const fimApp = s.indexOf(NL + '}' + NL, iApp) + 3;
  const iCss = acha(NL + 'const CSS_PAINEL = [') + 1;
  /* fatia 3: CSS_PAINEL e ICONE, até o primeiro ajudante do HTML */
  const iChip = acha(NL + 'const chip = ') + 1;
  if (!(fimLogo < iApp && iApp < fimApp && fimApp <= iCss && iCss < iChip)) throw new Error(ramo.id + ': fatias fora de ordem');

  const temaA = s.slice(0, fimLogo);
  const temaB = s.slice(iCss, iChip);
  const app = s.slice(iApp, fimApp);
  const doTema = nomes(temaA).concat(nomes(temaB));
  if (nomes(app).length) throw new Error(ramo.id + ': a fatia da APP tem const solto: ' + nomes(app));
  ['CSS_TEMA', 'LOGO_FEN', 'CSS_PAINEL', 'ICONE'].forEach((n) => {
    if (doTema.indexOf(n) < 0) throw new Error(ramo.id + ': faltou ' + n + ' nas peças');
  });

  const nTema = 'Peças do Tema' + ramo.sufixo;
  const nPagina = 'Peças da Página' + ramo.sufixo;
  const tema = temaA + temaB + 'return [{ json: { ' + doTema.map((n) => n + ': ' + n).join(', ') + ' } }];' + NL;
  const pagina = app + 'return [{ json: { APP: APP.toString() } }];' + NL;

  /* o Montar Painel: lê as peças, depois o código de antes, entre e depois */
  let painel = "const PECAS = $('" + nTema + "').first().json;" + NL +
    nomes(temaA).map((n) => 'const ' + n + ' = PECAS.' + n + ';').join(NL) + NL +
    s.slice(fimLogo, iApp) +
    s.slice(fimApp, iCss) +
    nomes(temaB).map((n) => 'const ' + n + ' = PECAS.' + n + ';').join(NL) + NL +
    s.slice(iChip);
  painel = troca(painel, 'APP.toString()', "$('" + nPagina + "').first().json.APP", 1);
  painel = troca(painel, "$('Montar Consultas')", "$('Montar Consultas" + ramo.sufixo + "')", 1);
  painel = troca(painel, "$('MCP Consultas')", "$('MCP Consultas" + ramo.sufixo + "')", 1);

  /* o Virar Arquivo: a pasta da rotina, com subpasta (cada parte do caminho
     codificada à parte: a barra entre elas não pode virar %2F) */
  let arquivo = ler(ramo, 'virar-arquivo.js');
  arquivo = arquivo.replace(/const PASTA = '[^']*';/, "const PASTA = '" + ramo.pasta + "';");
  arquivo = troca(arquivo, 'const caminho = [PASTA, nomeArquivo].map(',
    "const caminho = PASTA.split('/').concat([nomeArquivo]).map(", 1);

  return {
    'pecas-tema.js': tema,
    'pecas-pagina.js': pagina,
    'montar-consultas.js': ler(ramo, 'montar-consultas.js'),
    'montar-painel.js': painel,
    'virar-arquivo.js': arquivo
  };
};

module.exports = { RAMOS, PASTA_RAIZ, TETO, nos };

if (require.main === module) {
  RAMOS.forEach((ramo) => {
    const dir = path.join(__dirname, 'n8n', ramo.id);
    fs.mkdirSync(dir, { recursive: true });
    const n = nos(ramo);
    Object.keys(n).forEach((arq) => {
      const b = Buffer.byteLength(n[arq]);
      if (b > TETO) throw new Error(ramo.id + '/' + arq + ' passou de ' + TETO + ' bytes: ' + b);
      [String.fromCharCode(92), '`', '${'].forEach((p) => {
        if (n[arq].indexOf(p) >= 0) throw new Error(ramo.id + '/' + arq + ' tem ' + p + ' (quebraria o literal)');
      });
      fs.writeFileSync(path.join(dir, arq), n[arq], 'utf8');
      console.log('✓ n8n/%s/%s · %d bytes', ramo.id, arq, b);
    });
  });
}
