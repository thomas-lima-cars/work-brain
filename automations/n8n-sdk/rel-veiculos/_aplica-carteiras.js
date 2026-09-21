/* ══════════════════════════════════════════════════════════════════════
   Injeta a carteira comercial dentro de `montar-html.js`.

       node automations/n8n-sdk/rel-veiculos/_aplica-carteiras.js

   Entra:  carteiras.json  (gerado por gera-carteiras.py a partir do xlsx)
   Sai:    montar-html.js, com o bloco entre CARTEIRAS:INICIO/FIM reescrito.

   Mesma razao do `_aplica-modelo.js`: o no roda dentro do n8n, onde nao ha
   `require`, nem `fs`, nem pasta do repo. Tudo que ele usa viaja junto.

   ── A NORMALIZACAO DE NOME SAI DO PROPRIO ALVO ────────────────────────
   As chaves do mapa por nome tem que ser normalizadas EXATAMENTE como o no
   normaliza o nome que vem do banco. Reimplementar a funcao aqui criaria
   duas implementacoes escritas juntas — que erram juntas, e a divergencia
   so apareceria como loja sem responsavel, sem erro nenhum.

   Entao este script LE a `normNome` de dentro do `montar-html.js` (bloco
   NORMNOME) e executa aquela mesma funcao. Ha uma implementacao so, e ela
   mora no lado que vai pro n8n.

   ── QUEM CASA POR NOME ────────────────────────────────────────────────
   So nome inequivoco. Nome normalizado que aparece na planilha com DOIS
   consultores diferentes fica de fora do mapa: a loja cai em
   "Nao Distribuido" em vez de ser atribuida a metade errada da carteira.
   ══════════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');

const AQUI = __dirname;
const ALVO = path.join(AQUI, 'montar-html.js');
const FONTE = path.join(AQUI, 'carteiras.json');

/* --------------------------------------------------------------------- */
function bloco(fonte, marca) {
  const ini = '/* ' + marca + ':INICIO';
  const fim = '/* ' + marca + ':FIM */';
  const a = fonte.indexOf(ini), b = fonte.indexOf(fim);
  if (a < 0 || b < 0 || b < a) {
    console.error('✗ marcadores de %s nao encontrados em montar-html.js', marca);
    process.exit(1);
  }
  /* pula o resto da linha do marcador de abertura: ele pode ter comentario */
  const corpo = fonte.slice(a, b);
  return corpo.slice(corpo.indexOf('*/') + 2);
}

function trocaBloco(fonte, marca, conteudo) {
  const ini = '/* ' + marca + ':INICIO */';
  const fim = '/* ' + marca + ':FIM */';
  const a = fonte.indexOf(ini), b = fonte.indexOf(fim);
  if (a < 0 || b < 0 || b < a) {
    console.error('✗ marcadores de %s nao encontrados em montar-html.js', marca);
    process.exit(1);
  }
  return fonte.slice(0, a + ini.length) + '\n' + conteudo + '\n' + fonte.slice(b);
}

function recusaPerigo(txt, onde) {
  const achados = [];
  if (txt.includes('\\')) achados.push('barra invertida');
  if (txt.includes("'")) achados.push('aspa simples');
  if (txt.includes('${')) achados.push('${');
  if (achados.length) {
    console.error('✗ %s contem %s — o no viaja pro n8n como string e isso quebra la.',
                  onde, achados.join(' e '));
    console.error('  Limpe o dado na planilha; escapar aqui so adia o problema.');
    process.exit(1);
  }
}

/** A `normNome` do proprio montar-html.js, executada aqui. */
function carregaNormNome(fonteAlvo) {
  const src = bloco(fonteAlvo, 'NORMNOME');
  if (!/function\s+normNome/.test(src)) {
    console.error('✗ o bloco NORMNOME nao tem a funcao normNome');
    process.exit(1);
  }
  return new Function(src + '\nreturn normNome;')();
}

/* --------------------------------------------------------------------- */
const alvoFonte = fs.readFileSync(ALVO, 'utf8');
const normNome = carregaNormNome(alvoFonte);

if (!fs.existsSync(FONTE)) {
  console.error('✗ falta %s', FONTE);
  console.error('  gere com: python automations/n8n-sdk/rel-veiculos/gera-carteiras.py <planilha.xlsx>');
  process.exit(1);
}
const doc = JSON.parse(fs.readFileSync(FONTE, 'utf8'));
const consultores = doc.consultores.slice();
const idx = {};
consultores.forEach((c, i) => { idx[c] = i; });

const porCnpj = {};
const nomeVotos = {};      // nome normalizado -> Set de consultores
let semCnpj = 0;
doc.clientes.forEach((c) => {
  const cnpj = String(c.cnpj || '').replace(/\D/g, '');
  if (cnpj.length === 14) porCnpj[cnpj] = idx[c.consultor];
  else semCnpj++;
  const n = normNome(c.razao);
  if (!n) return;
  (nomeVotos[n] = nomeVotos[n] || {})[c.consultor] = 1;
});

const porNome = {};
let ambiguos = 0;
Object.keys(nomeVotos).forEach((n) => {
  const donos = Object.keys(nomeVotos[n]);
  if (donos.length === 1) porNome[n] = idx[donos[0]];
  else ambiguos++;
});

const literal = {
  gerado_em: doc.gerado_em,
  origem: doc.origem,
  consultores: consultores,
  cnpj: porCnpj,
  nome: porNome
};

/* JSON.stringify ja usa aspa dupla; o que sobra pra recusar e barra
   invertida (acento fora do UTF-8, ou nome com \) e `${`. */
const json = JSON.stringify(literal);
recusaPerigo(json, 'carteiras.json serializado');

const linhas = [];
linhas.push('const CARTEIRAS = ' + JSON.stringify(literal, null, 0) + ';');

module.exports = { blocoCarteiras: linhas.join('\n'), alvo: ALVO, fonte: FONTE };

if (require.main === module) {
  const saida = trocaBloco(alvoFonte, 'CARTEIRAS', linhas.join('\n'));
  fs.writeFileSync(ALVO, saida, 'utf8');

  console.log('✓ montar-html.js atualizado');
  console.log('  planilha : %s (gerada em %s)', doc.origem, doc.gerado_em);
  console.log('  clientes : %d', doc.clientes.length);
  console.log('  por CNPJ : %d', Object.keys(porCnpj).length);
  console.log('  por nome : %d inequívocos, %d ambíguos descartados',
              Object.keys(porNome).length, ambiguos);
  if (semCnpj) console.log('  %d cliente(s) sem CNPJ de 14 dígitos — só casam por nome', semCnpj);
  console.log('  literal  : %d bytes', json.length);
  console.log('');
  console.log('Confira com: node automations/n8n-sdk/rel-veiculos/_prova-carteiras.js');
}
