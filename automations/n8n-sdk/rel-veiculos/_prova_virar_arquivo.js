/* Provas do nó "Virar Arquivo", sem tocar no n8n nem no SharePoint.
 *
 * O nó existe por causa de um defeito SILENCIOSO (o `Convert to File` que
 * gerou 14 bytes com status de sucesso), então não basta provar que o
 * caminho feliz funciona: é preciso provar que cada guarda MORDE. As provas
 * 4 e 7 sabotam o código de propósito e exigem que ele falhe.
 *
 *     node _prova_virar_arquivo.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const FONTE = fs.readFileSync(path.join(__dirname, 'virar-arquivo.js'), 'utf8');

let ok = 0;
let falhou = 0;

function prova(nome, fn) {
  try {
    fn();
    ok++;
    console.log('  ok   ' + nome);
  } catch (e) {
    falhou++;
    console.log('  FALHA ' + nome + ' :: ' + e.message);
  }
}

function igual(a, b, rot) {
  if (a !== b) throw new Error(rot + ': esperava ' + JSON.stringify(b) + ', veio ' + JSON.stringify(a));
}

/* Roda o nó com um `$input` de mentira. `Buffer` e `Date` entram por
 * parâmetro para as provas poderem sabotá-los. */
function rodaFonte(fonte, json, opcoes) {
  const o = opcoes || {};
  const $input = { first: () => ({ json: json }) };
  const corpo = new Function('$input', 'Buffer', 'Date', fonte);
  return corpo($input, o.Buffer || Buffer, o.Date || Date);
}

function roda(json, opcoes) {
  return rodaFonte(FONTE, json, opcoes);
}

/* Roda o MESMO no com outro nome de publicacao, trocando as constantes na
   fonte. Serve pra provar o encoder com acento mesmo quando o nome real nao
   tem nenhum — ver a prova do percent-encoding mais abaixo. */
function rodaCom(pasta, prefixo, json, opcoes) {
  const fonte = FONTE
    .replace(/const PASTA = '[^']*'/, "const PASTA = '" + pasta + "'")
    .replace(/const PREFIXO = '[^']*'/, "const PREFIXO = '" + prefixo + "'");
  if (fonte === FONTE) throw new Error('nao consegui trocar PASTA/PREFIXO na fonte');
  return rodaFonte(fonte, json, opcoes);
}

function htmlDe(bytes) {
  return '<!doctype html><html><body>' + 'x'.repeat(bytes) + '</body></html>';
}

console.log('\nVirar Arquivo\n');

/* ── 1. caminho feliz ─────────────────────────────────────────────────── */
prova('relatório de 4 MB vira binário com os mesmos bytes', () => {
  const html = htmlDe(4 * 1024 * 1024);
  const r = roda({ html: html, resumo: { veiculos: 1199 }, problemas: 2 });
  igual(r.length, 1, 'um item de saída');
  igual(r[0].json.bytes, Buffer.byteLength(html, 'utf8'), 'bytes declarados');
  igual(Buffer.from(r[0].binary.data.data, 'base64').length, Buffer.byteLength(html, 'utf8'), 'bytes do binário');
  /* com charset, sempre: sem ele o cabecalho HTTP vence o <meta charset>
     do documento e o portugues inteiro sai corrompido no navegador */
  igual(r[0].binary.data.mimeType, 'text/html; charset=utf-8', 'mimeType com charset');
});

prova('o binário decodifica de volta no MESMO html', () => {
  const html = htmlDe(200 * 1024) + ' acentuação çãõ — ↗';
  const r = roda({ html: html });
  igual(Buffer.from(r[0].binary.data.data, 'base64').toString('utf8'), html, 'ida e volta');
});

prova('carrega resumo, falhas e problemas adiante', () => {
  const r = roda({ html: htmlDe(200 * 1024), resumo: { veiculos: 7 }, falhas: ['x'], problemas: 1 });
  igual(r[0].json.resumo.veiculos, 7, 'resumo');
  igual(r[0].json.falhas.length, 1, 'falhas');
  igual(r[0].json.problemas, 1, 'problemas');
});

/* ── 2. guarda: html ausente ou do tipo errado ────────────────────────── */
[undefined, null, 123, {}, []].forEach((v) => {
  prova('recusa html do tipo ' + (v === null ? 'null' : typeof v), () => {
    let bateu = false;
    try { roda({ html: v }); } catch (e) {
      bateu = /não entregou/.test(e.message);
      if (!bateu) throw new Error('falhou pela razão errada: ' + e.message);
    }
    if (!bateu) throw new Error('deixou passar');
  });
});

/* ── 3. guarda: arquivo pequeno demais ────────────────────────────────── */
prova('recusa o arquivo de 14 bytes (o defeito da Lista LM)', () => {
  let bateu = false;
  try { roda({ html: '<html></html>x' }); } catch (e) {
    bateu = /abaixo do piso/.test(e.message);
    if (!bateu) throw new Error('falhou pela razão errada: ' + e.message);
  }
  if (!bateu) throw new Error('deixou passar um arquivo de 14 bytes');
});

prova('aceita exatamente no piso de 100 KB', () => {
  const html = 'x'.repeat(100 * 1024);
  const r = roda({ html: html });
  igual(r[0].json.bytes, 100 * 1024, 'bytes');
});

prova('recusa um byte abaixo do piso', () => {
  let bateu = false;
  try { roda({ html: 'x'.repeat(100 * 1024 - 1) }); } catch (e) { bateu = /abaixo do piso/.test(e.message); }
  if (!bateu) throw new Error('o piso não é exato');
});

/* ── 4. SABOTAGEM: a conversão come conteúdo ──────────────────────────── */
prova('a conferência de ida e volta MORDE quando o base64 é truncado', () => {
  /* Buffer falso: o toString('base64') devolve um base64 mais curto do que
   * o conteúdo real. É o modo de falha do `Convert to File`, reproduzido. */
  const BufferFalso = {
    byteLength: Buffer.byteLength,
    from: (x, enc) => {
      const b = Buffer.from(x, enc);
      if (enc === 'base64') return b;
      return { toString: () => b.slice(0, 10).toString('base64'), length: b.length };
    }
  };
  let bateu = false;
  try { roda({ html: htmlDe(200 * 1024) }, { Buffer: BufferFalso }); } catch (e) {
    bateu = /comeu conteúdo/.test(e.message);
    if (!bateu) throw new Error('falhou pela razão errada: ' + e.message);
  }
  if (!bateu) throw new Error('base64 truncado passou em silêncio — a guarda não serve');
});

/* ── 5. o fuso ────────────────────────────────────────────────────────── */
function comRelogio(iso) {
  const fixo = new Date(iso).getTime();
  function DateFalso(v) { return v === undefined ? new Date(fixo) : new Date(v); }
  DateFalso.now = () => fixo;
  DateFalso.prototype = Date.prototype;
  return DateFalso;
}

prova('23h de Brasília ainda é o dia de hoje, não o de amanhã', () => {
  /* 2026-09-12T02:00Z = 2026-09-11 23:00 em Brasília */
  const r = roda({ html: htmlDe(200 * 1024) }, { Date: comRelogio('2026-09-12T02:00:00Z') });
  igual(r[0].json.nomeArquivo, 'radar-de-estoque-2026-09-11.html', 'nome do arquivo');
});

prova('00h30 de Brasília já é o dia novo', () => {
  /* 2026-09-12T03:30Z = 2026-09-12 00:30 em Brasília */
  const r = roda({ html: htmlDe(200 * 1024) }, { Date: comRelogio('2026-09-12T03:30:00Z') });
  igual(r[0].json.nomeArquivo, 'radar-de-estoque-2026-09-12.html', 'nome do arquivo');
});

prova('meio-dia UTC e meio-dia de Brasília caem no mesmo dia', () => {
  const r = roda({ html: htmlDe(200 * 1024) }, { Date: comRelogio('2026-09-11T12:00:00Z') });
  igual(r[0].json.nomeArquivo, 'radar-de-estoque-2026-09-11.html', 'nome do arquivo');
});

/* ── 6. o caminho ─────────────────────────────────────────────────────── */
prova('o espaço da pasta vai codificado, e a barra NÃO', () => {
  const r = roda({ html: htmlDe(200 * 1024) }, { Date: comRelogio('2026-09-11T12:00:00Z') });
  igual(r[0].json.caminho, 'Radar%20de%20Estoque/radar-de-estoque-2026-09-11.html', 'caminho');
  igual((r[0].json.caminho.match(/\//g) || []).length, 1, 'exatamente uma barra separadora');
});

/* ── o encoder ainda tem que aguentar acento ──────────────────────────────
   O nome de hoje ("Radar de Estoque") e ASCII puro, e isso quase apagou esta
   prova: sem acento no nome, a ida-e-volta passaria comparando dois ASCII
   iguais sem testar nada — a propria prova avisava isso, e o aviso disparou
   quando o nome mudou.

   A capacidade continua importando: o proximo nome pode ter acento, e a
   correcao de 15/09 (charset + percent-encoding) custou uma investigacao
   inteira. Entao a prova passa a FORCAR um nome acentuado no lugar das
   constantes, em vez de depender de o nome real ter acento por sorte. */
prova('o acento SOBREVIVE à codificação: o caminho decodifica de volta', () => {
  const r = rodaCom('Pasta Acentuada Ação', 'relatório-acentuação',
                    { html: htmlDe(200 * 1024) });
  const partes = r[0].json.caminho.split('/');
  /* Conferir que a string "mudou de forma" nao prova nada -- percent-encoding
     errado tambem muda a forma. O que prova e a VOLTA: decodificado, o
     caminho tem que ser exatamente a pasta e o nome acentuados. */
  igual(decodeURIComponent(partes[0]), r[0].json.pasta, 'a pasta volta acentuada');
  igual(decodeURIComponent(partes[1]), r[0].json.nomeArquivo, 'o nome volta acentuado');
  /* e o nome acentuado e mesmo acentuado, senao a prova acima passaria com
     dois ASCII iguais e nao teria testado nada */
  if (!/[áàâãéêíóôõúüç]/i.test(r[0].json.nomeArquivo)) {
    throw new Error('o nome nao tem acento: a prova de ida e volta passaria por acaso');
  }
  /* nenhum acento CRU sobra no caminho: tudo tem que estar codificado */
  if (/[áàâãéêíóôõúüç]/i.test(r[0].json.caminho)) {
    throw new Error('sobrou acento sem codificar no caminho da URL');
  }
});

/* ── 7. SABOTAGEM: sem codificar, o caminho quebraria ─────────────────── */
prova('a pasta REALMENTE tem espaço (senão a prova 6 não prova nada)', () => {
  const r = roda({ html: htmlDe(200 * 1024) });
  if (r[0].json.pasta.indexOf(' ') < 0) {
    throw new Error('a pasta não tem espaço: a prova de codificação passaria por acaso');
  }
});

console.log('\n' + ok + ' provas ok, ' + falhou + ' falha(s)\n');
process.exit(falhou ? 1 : 0);
