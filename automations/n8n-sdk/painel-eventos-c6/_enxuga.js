/* Tira os comentários de bloco de um nó antes de ele ir para o n8n.

     node _enxuga.js montar-painel.js      -> grava n8n/montar-painel.js

   O comentário é documentação e mora no repo; no n8n ele só pesa na
   transmissão pela API, que é escrita por extenso. O arquivo enxuto é
   DERIVADO: não se edita, regera-se. prova-local.js confere que o nó
   enxuto produz exatamente o mesmo HTML que o original.

   Anda caractere a caractere respeitando aspas simples e duplas — um "/*"
   dentro de string não é comentário. Os nós não têm regex nem comentário
   de linha, e a prova de barra invertida garante que não há escape de aspa
   para confundir a leitura. */

const fs = require('fs');
const path = require('path');

function enxuga(fonte) {
  let saida = '';
  let aspa = null;
  for (let i = 0; i < fonte.length; i++) {
    const c = fonte[i];
    if (aspa) {
      saida += c;
      if (c === aspa) aspa = null;
      continue;
    }
    if (c === "'" || c === '"') { aspa = c; saida += c; continue; }
    if (c === '/' && fonte[i + 1] === '*') {
      const fim = fonte.indexOf('*/', i + 2);
      if (fim < 0) throw new Error('comentário sem fim na posição ' + i);
      i = fim + 1;
      continue;
    }
    saida += c;
  }
  return saida.split('\n').map((l) => l.replace(/\s+$/, '')).filter((l) => l.trim() !== '').join('\n') + '\n';
}

module.exports = { enxuga };

if (require.main === module) {
  const nome = process.argv[2];
  const fonte = fs.readFileSync(path.join(__dirname, nome), 'utf8');
  const pasta = path.join(__dirname, 'n8n');
  if (!fs.existsSync(pasta)) fs.mkdirSync(pasta);
  const saida = enxuga(fonte);
  fs.writeFileSync(path.join(pasta, nome), saida, 'utf8');
  console.log('✓ n8n/%s · %d → %d bytes', nome, Buffer.byteLength(fonte), Buffer.byteLength(saida));
}
