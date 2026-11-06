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

module.exports = { roda };

if (require.main === module) {
  const itens = roda(process.argv[2]);
  process.stdout.write(JSON.stringify(itens));
}
