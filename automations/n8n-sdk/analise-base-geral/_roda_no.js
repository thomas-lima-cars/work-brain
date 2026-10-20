/* Roda um nó Code do n8n fora do n8n (cópia do painel-precificacao/_roda_no.js).

     node _roda_no.js montar-queries.js              -> imprime os itens (JSON)
     require('./_roda_no').roda(arquivo, nos)        -> devolve os itens

   O corpo do nó tem `return` no nível de cima, então vira corpo de função.
   `nos` imita o `$('Nome do Nó')` do n8n: { 'Nome': [ {json}, ... ] }.
   Marcadores __X__ do arquivo são trocados por `troca` antes de rodar. */

const fs = require('fs');
const path = require('path');

function roda(arquivo, nos, troca) {
  let fonte = fs.readFileSync(path.resolve(__dirname, arquivo), 'utf8');
  Object.keys(troca || {}).forEach(function (k) { fonte = fonte.split(k).join(troca[k]); });
  const $ = (nome) => {
    if (!nos || !nos[nome]) throw new Error('no ' + nome + ' nao existe ou nao rodou');
    const itens = nos[nome];
    return { all: () => itens, first: () => itens[0] };
  };
  const fn = new Function('$', 'Buffer', fonte);
  return fn($, Buffer);
}

module.exports = { roda };

if (require.main === module) {
  const itens = roda(process.argv[2]);
  process.stdout.write(JSON.stringify(itens));
}
