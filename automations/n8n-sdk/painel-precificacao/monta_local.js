/* Roda o nó "Montar Painel" fora do n8n, com o dado de coleta_local.py.

     node monta_local.js            -> saida-local.html + resumo no console

   Imita os três nós de que ele lê: Montar Consultas, MCP Consultas e Ler
   Modelo (o modelo.json do preditivo, como o n8n entrega depois do
   "Extract from File"). */
const fs = require('fs');
const path = require('path');
const { roda } = require('./_roda_no.js');

const AQUI = __dirname;
const dados = JSON.parse(fs.readFileSync(path.join(AQUI, 'dados-local.json'), 'utf8'));
const modelo = JSON.parse(fs.readFileSync(path.join(AQUI, '..', '..', 'precificacao', 'preditivo', 'modelo.json'), 'utf8'));

const saida = roda('montar-painel.js', {
  'Montar Consultas': dados.consultas,
  'MCP Consultas': dados.mcp,
  'Ler Modelo': [{ json: { data: modelo } }]
});
const { html, resumo } = saida[0].json;
fs.writeFileSync(path.join(AQUI, 'saida-local.html'), html, 'utf8');
console.log('saida-local.html  ' + (Buffer.byteLength(html) / 1024).toFixed(0) + ' KB');
console.log(JSON.stringify(resumo, null, 1));
