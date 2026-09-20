/* ══════════════════════════════════════════════════════════════════════
   Tira o DADOS de dentro de um `saida-*.html` já pronto.

   Existe porque o `_extrai_execucao.py` depende dos dumps do MCP do n8n, e
   sem esse conector nao ha dump nenhum -- mas o HTML publicado carrega o
   DADOS inteiro embutido, que e a mesma coisa. Com o JSON de volta em disco,
   o `_confere_run.js` e o `monta_html_de_dados.js` voltam a funcionar sem
   depender de ferramenta que a sessao pode nao ter.

   O HTML e a fonte pior das duas (ja passou por serializacao), entao aqui
   nao se conserta nada: se o bloco nao parsear, falha e diz onde.

     node _extrai_do_html.js saida-50410.html
     node _extrai_do_html.js saida-50410.html dados-50410.json
   ══════════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');

const entrada = process.argv[2];
if (!entrada) {
  console.error('uso: node _extrai_do_html.js <saida-*.html> [dados-*.json]');
  process.exit(2);
}
const AQUI = __dirname;
const caminho = path.isAbsolute(entrada) ? entrada : path.join(AQUI, entrada);
const html = fs.readFileSync(caminho, 'utf8');

const m = html.match(/<script>const D=([\s\S]*?);<\/script>/);
if (!m) {
  console.error('nao achei o bloco `<script>const D=...;</script>` em ' + entrada +
    '. Este arquivo foi gerado pelo Montar HTML deste projeto?');
  process.exit(1);
}
/* o gerador escapa `</` para nao fechar o <script> antes da hora; desfazer
   isso e o unico tratamento, e e o inverso exato do que ele faz */
let bruto = m[1].split('<\/').join('</');
let D;
try {
  D = JSON.parse(bruto);
} catch (e) {
  console.error('o bloco existe mas nao e JSON valido: ' + e.message);
  process.exit(1);
}

const saida = process.argv[3] ||
  path.basename(entrada).replace(/^saida-/, 'dados-').replace(/\.html$/, '.json');
const destino = path.isAbsolute(saida) ? saida : path.join(AQUI, saida);
fs.writeFileSync(destino, JSON.stringify(D));

const R = D.resumo || {};
console.log('extraido de ' + path.basename(caminho) + ' -> ' + path.basename(destino));
console.log('  gerado em      : ' + (D.gerado_em || '?'));
console.log('  janela         : ' + ((D.meta || {}).janela_ini || '?') +
            '  ate  ' + ((D.meta || {}).janela_fim || '(sem teto)'));
console.log('  corresp. minima: ' + ((D.parametros || {}).corresp_min));
console.log('  eventos        : ' + R.eventos);
console.log('  veiculos       : ' + R.veiculos + '   (encerrados: ' + R.encerrados +
            ', sobra: ' + R.sobra + ')');
console.log('  lojas          : ' + R.lojas_elegiveis + ' de ' + R.lojas_no_universo);
console.log('  pares          : ' + R.pares);
console.log('  sem par        : ' + R.sem_par);
if ((D.falhas || []).length) {
  console.log('  falhas declaradas:');
  D.falhas.forEach((f) => console.log('    - ' + f));
}
