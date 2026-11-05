// O Evolution manda para UM numero por chamada, entao aqui vira um item por
// destinatario. Mesmo desenho do Relatorio C6, ja validado em producao.
//
// 🔴 TUUNELIS AINDA NAO ENTROU, DE PROPOSITO.
// O gatilho deste fluxo e 'Diariamente as 08h' - DIARIO, nao semanal. O Caio
// aprovou o WhatsApp dele numa cadencia semanal. Enquanto nao se decidir entre
// trocar o gatilho para segunda ou aceitar o disparo diario, ele fica de fora.
// Para incluir, basta descomentar a linha abaixo.
var DESTINOS = [
  { nome: 'Caio', number: '<telefone>' }
, { nome: 'Tuunelis', number: '<telefone>' }
];

// Lido POR REFERENCIA: o no do Outlook substitui o json pela resposta da API da
// Microsoft, entao nada que precise sobreviver ao e-mail pode vir de $input.
var html = $('Montar HTML').first().json.html;

// Campo ausente tem que ABORTAR, nunca virar string vazia: arquivo vazio no
// WhatsApp sai como documento quebrado e ninguem percebe.
if (!html || typeof html !== 'string') throw new Error('HTML da analise nao chegou ao WhatsApp. Abortado sem enviar.');

var buf = Buffer.from(html, 'utf8');
var kb = Math.round(buf.length / 1024);

// Mesmo nome do anexo do e-mail, montado igual ao no Anexar HTML.
var now = new Date();
var p = function (n) { return String(n).padStart(2, '0'); };
var data = now.getFullYear() + '-' + p(now.getMonth() + 1) + '-' + p(now.getDate());
var fileName = 'Analise_Base_Clientes_C6_Lojista_' + data + '.html';

var resumo = '*Base de Clientes - C6 Lojista*\n'
  + data.split('-').reverse().join('/') + '\n\n'
  + 'Panorama da base do C6 Lojista: funil de conversao, recencia, evolucao '
  + 'mensal, distribuicao geografica e ranking de compradores.\n\n'
  + 'O arquivo completo vai a seguir (' + kb + ' KB).\n\n'
  + '_Mensagem automatica. Duvidas com o Caio._';

var saida = [];
var i;
for (i = 0; i < DESTINOS.length; i++) {
  saida.push({ json: {
    nome: DESTINOS[i].nome,
    number: DESTINOS[i].number,
    resumo: resumo,
    b64: buf.toString('base64'),
    fileName: fileName,
    kb: kb
  } });
}
return saida;