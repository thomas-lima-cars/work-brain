/* Roda um nó Code do n8n fora do n8n.

     node _roda_no.js montar-consultas.js              -> imprime os itens (JSON)
     require('./_roda_no').roda(arquivo, nos)          -> devolve os itens

   O corpo do nó tem `return` no nível de cima, então vira corpo de função.
   `nos` imita o `$('Nome do Nó')` do n8n: { 'Nome': [ {json}, ... ] }. */

const fs = require('fs');
const path = require('path');

function roda(arquivo, nos, input) {
  const fonte = fs.readFileSync(path.resolve(__dirname, arquivo), 'utf8');
  const $ = (nome) => {
    if (!nos || !nos[nome]) throw new Error('no ' + nome + ' nao existe ou nao rodou');
    const itens = nos[nome];
    return { all: () => itens, first: () => itens[0] };
  };
  const $input = { all: () => input || [], first: () => (input || [])[0] };
  const fn = new Function('$', '$input', 'Buffer', fonte);
  return fn($, $input, Buffer);
}

/* os nós que o Montar Painel lê, de uma coleta local: as consultas, as
   respostas, a carteira e as metas (metas-local.json, do le_metas.py; sem
   ele, as metas não vêm, como no n8n sem a planilha) */
function nosLocais(d, semMetas) {
  const nos = { 'Montar Consultas': d.consultas, 'MCP Consultas': d.mcp, 'Ler Carteira': d.carteira };
  const arq = path.resolve(__dirname, 'metas-local.json');
  if (!semMetas && fs.existsSync(arq)) Object.assign(nos, JSON.parse(fs.readFileSync(arq, 'utf8')));
  return nos;
}

module.exports = { roda, nosLocais };

if (require.main === module) {
  const itens = roda(process.argv[2]);
  process.stdout.write(JSON.stringify(itens));
}
