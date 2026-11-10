/* Provas da Rotina Fenauto.

     node prova.js        (depois do _divide.js; precisa das coletas de cada painel)

   Para cada ramo, contra a coleta local do painel (dados-local.json e, se
   houver, dados-prova.json): o Montar Painel INTEIRO do painel e o ramo
   dividido daqui (Peças do Tema → Peças da Página → Montar Painel, com os
   nomes do ramo) têm que dar o MESMO HTML e o MESMO resumo. E o Virar Arquivo
   do ramo tem que publicar na pasta da rotina. */

const fs = require('fs');
const path = require('path');
const { RAMOS, TETO, nos } = require('./_divide');

let ok = 0;
let falhas = 0;
const prova = (nome, cond, info) => {
  if (cond) { ok++; return; }
  falhas++;
  console.log('✗ ' + nome + (info === undefined ? '' : ' · ' + JSON.stringify(info).slice(0, 300)));
};

/* roda um nó Code fora do n8n: `nos` imita o $('Nome') */
const roda = (fonte, tabela, input) => {
  const $ = (nome) => {
    if (!tabela[nome]) throw new Error('no ' + nome + ' nao existe ou nao rodou');
    return { all: () => tabela[nome], first: () => tabela[nome][0] };
  };
  const $input = { all: () => input || [], first: () => (input || [])[0] };
  return new Function('$', '$input', 'Buffer', fonte)($, $input, Buffer);
};

RAMOS.forEach((ramo) => {
  const dirPainel = path.join(__dirname, '..', ramo.painel);
  const inteiro = fs.readFileSync(path.join(dirPainel, 'n8n', 'montar-painel.js'), 'utf8');
  const n = nos(ramo);
  const gravado = (arq) => fs.readFileSync(path.join(__dirname, 'n8n', ramo.id, arq), 'utf8');

  Object.keys(n).forEach((arq) => {
    prova(ramo.id + '/' + arq + ': o gravado é o que o _divide gera (rodar node _divide.js)', gravado(arq) === n[arq]);
    prova(ramo.id + '/' + arq + ': abaixo do teto de ' + TETO + ' bytes', Buffer.byteLength(n[arq]) <= TETO);
  });
  prova(ramo.id + ': Montar Consultas igual ao do painel',
    n['montar-consultas.js'] === fs.readFileSync(path.join(dirPainel, 'n8n', 'montar-consultas.js'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10)));
  prova(ramo.id + ': o Montar Painel lê os nós do ramo, e só eles', ["$('Montar Consultas" + ramo.sufixo + "')",
    "$('MCP Consultas" + ramo.sufixo + "')", "$('Peças do Tema" + ramo.sufixo + "')", "$('Peças da Página" + ramo.sufixo + "')"]
    .every((r) => n['montar-painel.js'].indexOf(r) >= 0) &&
    n['montar-painel.js'].indexOf("$('Montar Consultas')") < 0 && n['montar-painel.js'].indexOf("$('MCP Consultas')") < 0);

  ['dados-local.json', 'dados-prova.json'].forEach((coleta) => {
    const arq = path.join(dirPainel, coleta);
    if (!fs.existsSync(arq)) return;
    const d = JSON.parse(fs.readFileSync(arq, 'utf8'));
    const a = roda(inteiro, { 'Montar Consultas': d.consultas, 'MCP Consultas': d.mcp })[0].json;
    const tab = {};
    tab['Montar Consultas' + ramo.sufixo] = d.consultas;
    tab['MCP Consultas' + ramo.sufixo] = d.mcp;
    tab['Peças do Tema' + ramo.sufixo] = roda(n['pecas-tema.js'], {});
    tab['Peças da Página' + ramo.sufixo] = roda(n['pecas-pagina.js'], {});
    const b = roda(n['montar-painel.js'], tab)[0].json;
    prova(ramo.id + ' · ' + coleta + ': o mesmo HTML do nó inteiro', a.html === b.html, [a.html.length, b.html.length]);
    prova(ramo.id + ' · ' + coleta + ': o mesmo resumo', JSON.stringify(a.resumo) === JSON.stringify(b.resumo));
    prova(ramo.id + ' · ' + coleta + ': as peças viajam como JSON (texto puro)',
      JSON.stringify(JSON.parse(JSON.stringify(tab['Peças do Tema' + ramo.sufixo]))) === JSON.stringify(tab['Peças do Tema' + ramo.sufixo]));

    if (coleta !== 'dados-local.json') return;
    const v = roda(n['virar-arquivo.js'], {}, [{ json: b }])[0];
    const esperado = ramo.pasta.split('/').map(encodeURIComponent).join('/') + '/' + v.json.nomeArquivo;
    prova(ramo.id + ': publica em ' + ramo.pasta + '/', v.json.caminho === esperado && v.json.pasta === ramo.pasta, v.json.caminho);
    prova(ramo.id + ': a barra da subpasta não vira %2F', v.json.caminho.indexOf('%2F') < 0);
    prova(ramo.id + ': o arquivo volta inteiro do base64',
      Buffer.from(v.binary.data.data, 'base64').toString('utf8') === String.fromCharCode(0xFEFF) + b.html);
  });
});

prova('três subpastas: C6, IGA e a raiz para o Cars2You',
  RAMOS.map((r) => r.pasta).join('|') === 'Fenauto_202611/C6|Fenauto_202611/IGA|Fenauto_202611');

console.log((falhas ? '✗' : '✓') + ' %d provas, %d falha(s)', ok + falhas, falhas);
if (falhas) process.exit(1);
