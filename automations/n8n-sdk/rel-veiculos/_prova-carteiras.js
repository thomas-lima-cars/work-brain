/* ══════════════════════════════════════════════════════════════════════
   Prova de que a carteira comercial dentro de `montar-html.js` bate com o
   `carteiras.json`, e de que a regra de cruzamento e a que esta escrita.

       node automations/n8n-sdk/rel-veiculos/_prova-carteiras.js

   ── POR QUE ESTA PROVA EXISTE ─────────────────────────────────────────
   Mesma razao do `_prova-modelo.js`: o mapa viaja como COPIA dentro do no,
   porque la nao ha `require` nem `fs`. Copia que so um humano atualiza
   desatualiza — e esta desatualiza de um jeito MUDO. Consultor que trocou
   de carteira continua respondendo pela loja antiga, e a tela nao tem como
   saber. Nao ha erro, nao ha vazio: ha o nome errado.

   Se reprovar, a correcao e uma linha: `node _aplica-carteiras.js`.
   (E se a planilha mudou, antes disso: `python gera-carteiras.py <xlsx>`.)
   ══════════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const injetor = require('./_aplica-carteiras.js');

let erros = 0, testes = 0;
const ok = (cond, msg) => {
  testes++;
  if (cond) console.log('  ✓ ' + msg);
  else { console.log('  ✗ ' + msg); erros++; }
};

const fonte = fs.readFileSync(injetor.alvo, 'utf8');

/* O `\r` sai antes de comparar. O injetor escreve com \n, mas qualquer
   ferramenta que reescreva o arquivo inteiro no Windows o devolve em CRLF
   — e ai a prova acusaria divergencia de CONTEUDO por causa de fim de
   linha, mandando rodar um injetor que nao conserta nada. Aconteceu de
   verdade com o `_prova-modelo.js`, que reprovava desde 18/09 por isso. */
function extrai(marca) {
  const ini = '/* ' + marca + ':INICIO */';
  const fim = '/* ' + marca + ':FIM */';
  const a = fonte.indexOf(ini), b = fonte.indexOf(fim);
  if (a < 0 || b < 0) return null;
  return fonte.slice(a + ini.length, b)
    .replace(/\r/g, '').replace(/^\n/, '').replace(/\n$/, '');
}

/* --------------------------------------------------------------------- */
console.log('\n■ A copia bate com a fonte?');
const achado = extrai('CARTEIRAS');
ok(achado !== null, 'os marcadores CARTEIRAS existem em montar-html.js');
ok(achado === injetor.blocoCarteiras,
   'o mapa dentro do no é o que o carteiras.json produziria HOJE');
if (achado !== null && achado !== injetor.blocoCarteiras) {
  console.log('    rode: node automations/n8n-sdk/rel-veiculos/_aplica-carteiras.js');
}

/* --------------------------------------------------------------------- */
console.log('\n■ O mapa tem forma de mapa');
const mapa = new Function(achado + '\nreturn CARTEIRAS;')();
ok(Array.isArray(mapa.consultores) && mapa.consultores.length > 0,
   'tem ' + mapa.consultores.length + ' consultor(es)');
ok(!!mapa.gerado_em && !!mapa.origem,
   'declara de qual planilha veio e quando (' + mapa.origem + ', ' + mapa.gerado_em + ')');
const nCnpj = Object.keys(mapa.cnpj).length;
const nNome = Object.keys(mapa.nome).length;
ok(nCnpj > 0, 'tem ' + nCnpj + ' CNPJ mapeados');
ok(nNome > 0, 'tem ' + nNome + ' nomes inequívocos mapeados');
ok(nNome <= nCnpj,
   'o mapa por nome nao é MAIOR que o por CNPJ — se for, os ambíguos entraram');

const fora = Object.keys(mapa.cnpj).filter((k) => !/^[0-9]{14}$/.test(k));
ok(fora.length === 0,
   'toda chave de CNPJ tem 14 dígitos e nada mais' +
   (fora.length ? ' (achei ' + fora.slice(0, 3).join(', ') + ')' : ''));

const idxFora = Object.keys(mapa.cnpj).concat(Object.keys(mapa.nome))
  .filter((k) => {
    const v = (mapa.cnpj[k] !== undefined) ? mapa.cnpj[k] : mapa.nome[k];
    return !(v >= 0 && v < mapa.consultores.length);
  });
ok(idxFora.length === 0, 'todo índice aponta pra um consultor que existe');

/* --------------------------------------------------------------------- */
console.log('\n■ A normalizacao de nome e a MESMA dos dois lados');
const normSrc = (function () {
  const a = fonte.indexOf('/* NORMNOME:INICIO');
  const b = fonte.indexOf('/* NORMNOME:FIM */');
  if (a < 0 || b < 0) return null;
  const corpo = fonte.slice(a, b);
  return corpo.slice(corpo.indexOf('*/') + 2);
})();
ok(normSrc !== null, 'o bloco NORMNOME existe — e dele que o injetor le a funcao');
const norm = new Function(normSrc + '\nreturn normNome;')();

/* Os casos que o cruzamento real encontrou na planilha de 2026-09. */
[
  ['AUTOMARCAS LTDA', 'AUTOMARCAS', 'sufixo societario some'],
  ['R2 AUTOMOVEIS CONCEITO COMERCIO E SERVICOS LT', 'R2 AUTOMOVEIS CONCEITO COMERCIO E SERVICOS',
   'LT — o "LTDA" que a planilha corta em 45 caracteres — some tambem'],
  ['Presidente Veículos', 'PRESIDENTE VEICULOS', 'acento e caixa nao separam a mesma loja'],
  ['leo car multimarcas', 'LEO CAR MULTIMARCAS', 'caixa baixa sobe'],
  ['Maxxi-Vel  Multimarcas', 'MAXXI VEL MULTIMARCAS', 'hifen e espaco duplo viram um espaco so'],
  ['', '', 'nome vazio nao vira chave'],
].forEach(function (c) {
  ok(norm(c[0]) === c[1], c[2] + ' — ' + JSON.stringify(c[0]) + ' -> ' + JSON.stringify(norm(c[0])));
});
ok(norm(null) === '' && norm(undefined) === '',
   'nulo e indefinido nao estouram — loja sem nome existe no banco');

/* --------------------------------------------------------------------- */
console.log('\n■ A regra do cruzamento esta escrita no no');
ok(/responsavelDe/.test(fonte), 'o no tem a funcao que resolve o responsavel');
ok(/CARTEIRAS\.cnpj\[cnpj\]/.test(fonte), 'ele tenta o CNPJ');
ok(fonte.indexOf('CARTEIRAS.cnpj[cnpj]') < fonte.indexOf('CARTEIRAS.nome[n]'),
   'e tenta o CNPJ ANTES do nome — a ordem e a regra');
ok(/Não Distribuído/.test(fonte), 'quem nao casa recebe o rotulo, e nao um vazio');
ok(/sem_dono: SEM_CARTEIRA/.test(fonte),
   'o rotulo e publicado nos DADOS, pro bloco RENDER regerado enxergar');

/* O CNPJ e chave de cruzamento, nao dado de tela. Ele nao pode vazar pro
   array publicado: o HTML sobe pro SharePoint e nao precisa dele. */
const pub = fonte.slice(fonte.indexOf('const mapaLoja = {}'), fonte.indexOf('/* reindexa os pares'));
ok(!/cnpj/i.test(pub), 'o CNPJ NAO entra no array de lojas publicado no HTML');

/* --------------------------------------------------------------------- */
console.log('\n■ A SQL traz a chave');
const fase2 = fs.readFileSync(require('path').join(__dirname, 'montar-fase2.js'), 'utf8');
const qLojas = fase2.slice(fase2.indexOf("push('q_lojas'"), fase2.indexOf("push('q_ofertas'"));
ok(/MAX\(s\.cnpj\) AS cnpj/.test(qLojas),
   'q_lojas seleciona o CNPJ — sem isso o filtro inteiro cai em "Não Distribuído"');

console.log('\n' + (erros ? '✗ ' + erros + ' de ' + testes + ' falharam'
                          : '✓ ' + testes + ' provas passaram'));
process.exit(erros ? 1 : 0);
