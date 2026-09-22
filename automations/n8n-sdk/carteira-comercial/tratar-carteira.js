/* ═══════════════════════════════════════════════════════════════════════════
   NÓ "Tratar Carteira" — a planilha vira o mapa que o Radar consome

   Entra: as linhas da aba `Todos os Clientes`, vindas do `Ler Planilha`.
   Sai:   UM item, com o mapa pronto: consultores, cnpj -> índice,
          nome normalizado -> índice.

   ─── POR QUE ESTE WORKFLOW É SEPARADO DO RADAR ────────────────────────────

   A planilha muda toda semana e o Radar roda 12 minutos. Juntar as duas
   coisas colocava um download de terceiro no caminho crítico de um job
   longo, e prendia o relatório ao espaço pessoal de uma pessoa.

   Separado, a dependência frágil fica isolada aqui: se a planilha sumir,
   quem falha é este workflow — que é pequeno, roda em segundos e pode
   falhar de manhã sem ninguém perder relatório. O Radar segue consumindo o
   **último arquivo bom conhecido**.

   ─── ESTE NÓ FALHA DE PROPÓSITO ───────────────────────────────────────────

   🔴 Toda validação aqui é `throw`, não aviso. É deliberado e é o contrário
   do que o Radar faz.

   O Radar publica um relatório: melhor sair com carteira velha e dizer isso
   do que não sair. Aqui o produto É a carteira — publicar uma ruim
   SUBSTITUI a boa que está lá, e a próxima leitura de todo mundo passa a
   ser a ruim. Então falhar deixa o arquivo anterior intacto, que é
   exatamente o que se quer.

   Dito de outro jeito: lá o custo do erro é um relatório desatualizado;
   aqui é destruir o único bom estado que existe.
   ═══════════════════════════════════════════════════════════════════════════ */

const ABA = 'Todos os Clientes';
const COL_CNPJ = 'CNPJ';
const COL_RAZAO = 'Razao Social';
const COL_CONS = 'Consultor Responsavel';

/* Piso de sanidade, na mesma linha do MIN_BYTES do Radar: em 2026-09 a
   planilha tinha 1.436 clientes em 7 carteiras. Um dia com 40 linhas não é
   "semana fraca", é leitura truncada ou aba trocada. O piso é generoso de
   propósito — ele pega catástrofe, não flutuação. */
const MIN_LINHAS = 500;
const MIN_CONSULTORES = 2;

/* ── a MESMA normalizacao do Montar HTML ────────────────────────────────
   🔴 Se esta funcao divergir da que esta no Radar, o mapa e o consumidor
   discordam sobre o que e "o mesmo nome" -- e o efeito e loja sem
   responsavel, sem erro nenhum. O `_prova-carteira.js` compara as duas
   byte a byte e falha alto se separarem. */
/* NORMNOME:INICIO */
function normNome(s) {
  var t = String(s === null || s === undefined ? '' : s).toUpperCase();
  var de = 'AAAAAAACEEEEIIIINOOOOOOUUUUY';
  var pa = 'ÀÁÂÃÄÅĀÇÈÉÊËÌÍÎÏÑÒÓÔÕÖØÙÚÛÜÝ';
  var fora = '';
  for (var i = 0; i < t.length; i++) {
    var p = pa.indexOf(t.charAt(i));
    fora += p >= 0 ? de.charAt(p) : t.charAt(i);
  }
  /* classes negadas em vez de \s e \D: este arquivo e transcrito a mao pro
     n8n como string JSON, e barra invertida e onde o projeto mais erra —
     ha ate um teto de 4 nele, conferido pelo prova-local. */
  fora = fora.replace(/[^A-Z0-9]+/g, ' ');
  /* sufixo societario e ruido de razao social: some dos dois lados ou de
     nenhum. `LT` esta na lista porque a planilha corta a razao social em
     45 caracteres e "LTDA" chega pela metade. */
  fora = ' ' + fora + ' ';
  var lixo = ['LTDA', 'LTD', 'LT', 'ME', 'EPP', 'EIRELI', 'SA', 'S A', 'CIA'];
  for (var j = 0; j < lixo.length; j++) {
    fora = fora.split(' ' + lixo[j] + ' ').join(' ');
  }
  return fora.replace(/[ ]+/g, ' ').trim();
}
/* NORMNOME:FIM */

function soDigitos(v) {
  return String(v === null || v === undefined ? '' : v).replace(/[^0-9]/g, '');
}

const linhas = $input.all().map((i) => i.json);

/* ── guarda 1: veio alguma coisa? ────────────────────────────────────────
   O item de erro do HTTP chega como {error: ...}: uma linha so, sem as
   colunas. Repetir o texto do erro aqui poupa abrir a execucao pra
   descobrir que foi 403. */
if (!linhas.length) {
  throw new Error('Tratar Carteira: o Ler Planilha nao devolveu linha nenhuma.');
}
if (linhas.length === 1 && linhas[0] && linhas[0].error !== undefined) {
  let msg = linhas[0].error;
  if (msg && typeof msg === 'object') msg = msg.message || JSON.stringify(msg);
  throw new Error('Tratar Carteira: a planilha nao veio — ' + String(msg).slice(0, 200));
}

/* ── guarda 2: as colunas obrigatorias ───────────────────────────────────
   As colunas variam POR LINHA: o Extract from File descarta celula vazia,
   entao a primeira linha pode nao ter UF nem Cidade. Procurar numa linha
   so daria falso negativo — por isso varre ate achar. */
let temCnpj = false;
let temCons = false;
for (let i = 0; i < linhas.length; i++) {
  if (linhas[i][COL_CNPJ] !== undefined) temCnpj = true;
  if (linhas[i][COL_CONS] !== undefined) temCons = true;
  if (temCnpj && temCons) break;
}
if (!temCnpj || !temCons) {
  throw new Error('Tratar Carteira: faltam colunas na aba "' + ABA + '" — ' +
    COL_CNPJ + ': ' + temCnpj + ', ' + COL_CONS + ': ' + temCons +
    '. A planilha foi reorganizada, ou a aba nao e a certa.');
}

if (linhas.length < MIN_LINHAS) {
  throw new Error('Tratar Carteira: so ' + linhas.length + ' linhas, abaixo do piso de ' +
    MIN_LINHAS + '. Isso e leitura truncada ou aba trocada, nao semana fraca — ' +
    'publicar assim substituiria a carteira boa por uma pela metade.');
}

/* ── o mapa ──────────────────────────────────────────────────────────── */
const consultores = [];
const idx = {};
const porCnpj = {};
const votos = {};
let semConsultor = 0;
let semCnpj = 0;

for (let k = 0; k < linhas.length; k++) {
  const l = linhas[k];
  const cons = String(l[COL_CONS] === undefined || l[COL_CONS] === null ? '' : l[COL_CONS]).trim();
  if (!cons) { semConsultor++; continue; }
  if (idx[cons] === undefined) { idx[cons] = consultores.length; consultores.push(cons); }
  const cnpj = soDigitos(l[COL_CNPJ]);
  if (cnpj.length === 14) porCnpj[cnpj] = idx[cons]; else semCnpj++;
  const n = normNome(l[COL_RAZAO]);
  if (n) { (votos[n] = votos[n] || {})[cons] = 1; }
}

if (semConsultor) {
  throw new Error('Tratar Carteira: ' + semConsultor + ' linha(s) sem consultor responsavel. ' +
    'Planilha em edicao — melhor manter a anterior do que publicar cliente sem dono.');
}
if (consultores.length < MIN_CONSULTORES) {
  throw new Error('Tratar Carteira: so ' + consultores.length + ' consultor(es) na planilha.');
}

/* nome so vale quando e INEQUIVOCO: nome normalizado que leva a dois
   consultores nao entra. Atribuir a loja a metade errada da carteira e pior
   que deixa-la como "Nao Distribuido" — a mesma regra do link do anuncio no
   Radar, que nao entra quando falta um pedaco. */
const porNome = {};
let ambiguos = 0;
const chaves = Object.keys(votos);
for (let j = 0; j < chaves.length; j++) {
  const donos = Object.keys(votos[chaves[j]]);
  if (donos.length === 1) porNome[chaves[j]] = idx[donos[0]];
  else ambiguos++;
}

/* ── ordenar os consultores, e REMAPEAR os indices junto ─────────────────
   Ordenar depois de indexar e a pegadinha obvia deste trecho: os mapas
   guardam indice, entao reordenar o array sem remapear faz cada loja
   apontar pro consultor errado. Silencioso e catastrofico. */
const ordem = consultores.slice().sort();
const de = {};
for (let o = 0; o < ordem.length; o++) de[idx[ordem[o]]] = o;

const cnpjOrd = {};
const kc = Object.keys(porCnpj);
for (let c = 0; c < kc.length; c++) cnpjOrd[kc[c]] = de[porCnpj[kc[c]]];

const nomeOrd = {};
const kn = Object.keys(porNome);
for (let m = 0; m < kn.length; m++) nomeOrd[kn[m]] = de[porNome[kn[m]]];

/* ── guarda final: o mapa serve? ─────────────────────────────────────────
   Chegar aqui com zero CNPJ significa coluna presente mas vazia — passa
   nas guardas de cima e produz um mapa que nao casa com ninguem. */
if (!kc.length) {
  throw new Error('Tratar Carteira: nenhum CNPJ valido de 14 digitos em ' +
    linhas.length + ' linhas. A coluna existe mas esta vazia ou com outro formato.');
}

/* ── o relogio, em hora de Brasilia ──────────────────────────────────────
   `new Date()` no no responde em UTC. As 21h de Brasilia o UTC ja virou o
   dia seguinte -- mesma armadilha que ja mordeu a janela de eventos e o
   nome do arquivo do Radar. */
const FUSO_MIN = -180;
const agora = new Date(Date.now() + FUSO_MIN * 60000);

/* DOIS carimbos, e a diferenca nao e preciosismo.

   `gerado_em` e hora de Brasilia para ser lido por gente -- e um texto SEM
   fuso, entao `Date.parse` o interpreta como hora LOCAL de quem le. No n8n,
   que roda em UTC, isso faz a carteira parecer 3 horas mais nova do que e.
   Medido em 21/09: uma carteira de 12 dias era calculada como 11.

   `gerado_em_utc` e o instante, sem ambiguidade. E ele que o Radar usa pra
   contar idade. Numero que compara tempo precisa de instante, nao de texto
   bonito -- a mesma licao que a janela de eventos ja cobrou. */
return [{
  json: {
    carteira: {
      gerado_em: agora.toISOString().slice(0, 19).replace('T', ' '),
      gerado_em_utc: new Date().toISOString(),
      origem: 'planilha da area comercial (SharePoint)',
      linhas_lidas: linhas.length,
      consultores: ordem,
      cnpj: cnpjOrd,
      nome: nomeOrd
    },
    /* o que a execucao mostra pra quem abrir o n8n, sem precisar ler o mapa */
    resumo: {
      linhas: linhas.length,
      consultores: ordem.length,
      cnpj: kc.length,
      nome_inequivoco: kn.length,
      nome_ambiguo: ambiguos,
      linhas_sem_cnpj: semCnpj
    }
  }
}];
