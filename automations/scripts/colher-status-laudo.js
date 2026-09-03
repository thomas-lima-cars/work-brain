#!/usr/bin/env node
/*
 * Colhe o STATUS DO LAUDO abrindo o link de cada veiculo.
 *
 * Uso:
 *   node colher-status-laudo.js "<planilha.xlsx>"              # so os que faltam
 *   node colher-status-laudo.js "<planilha.xlsx>" --validar     # confere contra o que a LM ja preencheu
 *   node colher-status-laudo.js "<planilha.xlsx>" --limite=20
 *
 * ┌─ REGRA DURA ───────────────────────────────────────────────────────────┐
 * │ NAO SE INFERE STATUS. (Caio, 21/08: "não podemos fazer inferência, tem │
 * │ q ser como está no Laudo".) Cada adaptador le o veredito que o proprio │
 * │ laudo publica — nome do arquivo do selo, ou o texto do selo. Se o      │
 * │ adaptador nao encontra o veredito, devolve nulo e o veiculo continua   │
 * │ "sem status". Nunca deduzir a partir de comentario, conservacao ou     │
 * │ descricao de avaria.                                                   │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * O resultado fica em automations/estado/status-laudo.json, que o
 * gerar-lista-lm.js le para preencher a coluna que a LM deixou vazia.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { lerPlanilha, consertarLink, limpo } = require('./lib-planilha-lm');

const ARQUIVO_CACHE = path.join(__dirname, '..', 'estado', 'status-laudo.json');
const ESPERA_MS = 350;          // respiro entre requisicoes ao mesmo fornecedor
const TIMEOUT_MS = 45000;

// --------------------------------------------------------------- adaptadores ---

/*
 * Cada adaptador declara:
 *   dominio  — regex que casa o host do link
 *   tipo     — 'http' (da para ler com requisicao simples) ou 'navegador'
 *   extrair  — recebe o corpo da resposta e devolve o status da LM, ou null
 *
 * O que esta como 'navegador' NAO e falha de implementacao: o veredito so
 * existe depois que o JavaScript da pagina roda, entao requisicao simples
 * devolve casca vazia. Foi verificado um por um em 21/08.
 */

const ADAPTADORES = [
  {
    nome: 'alesca',
    dominio: /(^|\.)alesca\.com\.br$/i,
    tipo: 'http',
    // <img src='/template/imagens/1.png' alt='Status do Laudo'>
    //   1 = Aprovado · 2 = Aprovado com restricao · 3 = Reprovado
    // Atencao: o HTML usa ASPAS SIMPLES nesse trecho.
    extrair(corpo) {
      const m = corpo.match(/\/template\/imagens\/(\d+)\.png['"][^>]*alt=['"]Status do Laudo/i);
      if (!m) return null;
      const mapa = { 1: 'APROVADO', 2: 'C/ APONTAMENTO', 3: 'REPROVADO' };
      return mapa[Number(m[1])] || null;
    }
  },
  {
    nome: 'unionsolutions',
    dominio: /(^|\.)unionsolutions\.com\.br$/i,
    tipo: 'navegador',
    // O veredito existe e e texto, mas dentro de app Angular montado no cliente:
    //   <div class="... bg-danger">REPROVADO</div>
    //   <div class="... bg-warning">APROVADO COM APONTAMENTO</div>
    //   <div class="... bg-success">APROVADO</div>
    // A rota e em hash (#/laudo/<token>), entao o servidor devolve so a casca.
    extrair(corpo) {
      const m = corpo.match(/>\s*(REPROVADO|APROVADO COM APONTAMENTO|APROVADO)\s*</i);
      if (!m) return null;
      const t = m[1].toUpperCase();
      if (t === 'REPROVADO') return 'REPROVADO';
      if (t === 'APROVADO COM APONTAMENTO') return 'C/ APONTAMENTO';
      return 'APROVADO';
    }
  },
  {
    nome: 'conferilaudo',
    dominio: /(^|\.)conferilaudo\.com\.br$/i,
    tipo: 'navegador',
    // A pagina renderizada comeca com o veredito ("Aprovado SEZ3A95"), mas e
    // SPA com rota em hash — requisicao simples devolve casca de 11 KB.
    extrair(corpo) {
      const m = corpo.match(/^\s*(Aprovado com restrição|Aprovado com apontamento|Reprovado|Aprovado)\b/i);
      if (!m) return null;
      const t = m[1].toLowerCase();
      if (t.startsWith('reprovado')) return 'REPROVADO';
      if (t.includes('restri') || t.includes('apontamento')) return 'C/ APONTAMENTO';
      return 'APROVADO';
    }
  },
  {
    nome: 'carvist',
    dominio: /(^|\.)vistonline\.com\.br$/i,
    tipo: 'imagem-em-pdf',
    // O laudo vem como PDF de ~5 MB e 253 paginas. O selo do veredito
    // (APROVADO / REPROVADO / APROVADO COM RESSALVA) e IMAGEM no topo, e nao
    // aparece na camada de texto — conferido com pdftotext em 21/08.
    extrair() { return null; }
  },
  {
    nome: 'vistoriago',
    dominio: /(^|\.)vistoriago\.com\.br$/i,
    tipo: 'navegador',
    // Mesmo motor do carvist. No HTML servido o selo vem como
    // <div class="resultado res-padrao"><img src=""></div> — src VAZIO,
    // preenchido por JavaScript. Sem navegador nao ha veredito.
    extrair() { return null; }
  },
  {
    nome: 'nasli',
    dominio: /(^|\.)(naslitecnologia\.com|gruponasli\.com\.br)$/i,
    tipo: 'indefinido',
    // O HTML tem "APROVADO" em texto, mas a palavra aparece tambem em cada
    // item de checagem ("Chassi/Base Aprovado"). Falta confirmar qual no
    // carrega o veredito geral antes de ler — nao chutar.
    extrair() { return null; }
  },
  {
    nome: 'autorola',
    dominio: /(^|\.)autorola\.com$/i,
    tipo: 'sem-acesso',
    extrair() { return null; }
  }
];

const adaptadorDe = (url) => {
  let host = '';
  try { host = new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return null; }
  return ADAPTADORES.find((a) => a.dominio.test(host)) || null;
};

// ------------------------------------------------------------------ rede ---

function baixar(url, redirecionamentos) {
  return new Promise((resolve) => {
    const nivel = redirecionamentos || 0;
    if (nivel > 5) return resolve({ erro: 'redirecionamentos demais' });
    let alvo;
    try { alvo = new URL(url); } catch (e) { return resolve({ erro: 'url invalida' }); }
    const cliente = alvo.protocol === 'http:' ? http : https;
    const req = cliente.get(alvo, {
      timeout: TIMEOUT_MS,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', Accept: 'text/html,*/*' }
    }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        res.resume();
        return resolve(baixar(new URL(res.headers.location, alvo).toString(), nivel + 1));
      }
      const tipo = String(res.headers['content-type'] || '');
      // PDF nao interessa como texto; nao gastar banda baixando 5 MB
      if (/pdf/i.test(tipo)) { res.destroy(); return resolve({ erro: 'pdf', tipo }); }
      const partes = [];
      res.on('data', (d) => partes.push(d));
      res.on('end', () => resolve({
        status: res.statusCode,
        // os laudos da alesca vem em ISO-8859-1; latin1 preserva os bytes que
        // interessam (o veredito esta no nome do arquivo, que e ASCII)
        corpo: Buffer.concat(partes).toString('latin1'),
        tipo
      }));
      res.on('error', (e) => resolve({ erro: e.message }));
    });
    req.on('timeout', () => { req.destroy(); resolve({ erro: 'timeout' }); });
    req.on('error', (e) => resolve({ erro: e.message }));
  });
}

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

// ----------------------------------------------------------------- cache ---

function lerCache() {
  if (!fs.existsSync(ARQUIVO_CACHE)) return { placas: {} };
  try {
    const c = JSON.parse(fs.readFileSync(ARQUIVO_CACHE, 'utf8'));
    return c && c.placas ? c : { placas: {} };
  } catch (e) {
    console.error('cache corrompido em ' + ARQUIVO_CACHE + ' — ' + e.message);
    process.exit(1);
  }
}

function gravarCache(cache) {
  fs.mkdirSync(path.dirname(ARQUIVO_CACHE), { recursive: true });
  fs.writeFileSync(ARQUIVO_CACHE, JSON.stringify(cache, null, 1), 'utf8');
}

// --------------------------------------------------------------- execucao ---

async function main() {
  const args = process.argv.slice(2);
  const entrada = args.find((a) => !a.startsWith('--'));
  if (!entrada) {
    console.error('uso: node colher-status-laudo.js "<planilha.xlsx>" [--validar] [--limite=N]');
    process.exit(1);
  }
  const validar = args.includes('--validar');
  const limiteArg = (args.find((a) => a.startsWith('--limite=')) || '').split('=')[1];
  const limite = limiteArg ? Number(limiteArg) : Infinity;

  const { linhas } = lerPlanilha(entrada);

  const alvos = [];
  for (const l of linhas) {
    const placa = limpo(l.placa).toUpperCase();
    if (!placa) continue;
    const { url } = consertarLink(l.link);
    if (!url) continue;
    const daLM = limpo(l.statusLaudo).toUpperCase();
    // --validar visita quem JA tem status, pra medir o adaptador contra a LM.
    // Sem a flag, visita so quem esta sem status — que e o trabalho de verdade.
    if (validar ? !daLM : daLM) continue;
    alvos.push({ placa, url, daLM, classif: limpo(l.classif) });
  }

  // agrupa por fornecedor pra saber de antemao o que da e o que nao da
  const porAdaptador = new Map();
  for (const a of alvos) {
    const ad = adaptadorDe(a.url);
    const chave = ad ? ad.nome : 'desconhecido';
    if (!porAdaptador.has(chave)) porAdaptador.set(chave, { adaptador: ad, itens: [] });
    porAdaptador.get(chave).itens.push(a);
  }

  console.log((validar ? 'VALIDACAO' : 'COLHEITA') + ' — ' + alvos.length + ' veiculo(s) com link');
  console.log('');
  console.log('fornecedor'.padEnd(18) + 'itens'.padStart(7) + '   situacao');
  for (const [nome, g] of [...porAdaptador.entries()].sort((a, b) => b[1].itens.length - a[1].itens.length)) {
    const t = g.adaptador ? g.adaptador.tipo : 'desconhecido';
    console.log(nome.padEnd(18) + String(g.itens.length).padStart(7) + '   ' + t);
  }
  console.log('');

  const cache = lerCache();
  const conferencia = { ok: 0, erro: 0, semVeredito: 0, divergentes: [] };
  let colhidos = 0;
  let visitados = 0;

  for (const [nome, g] of porAdaptador.entries()) {
    if (!g.adaptador || g.adaptador.tipo !== 'http') {
      console.log('-- ' + nome + ': pulado (' + (g.adaptador ? g.adaptador.tipo : 'sem adaptador')
        + ') — ' + g.itens.length + ' veiculo(s) seguem sem status');
      continue;
    }
    console.log('-- ' + nome + ': lendo ' + Math.min(g.itens.length, limite) + ' laudo(s)...');
    for (const item of g.itens) {
      if (visitados >= limite) break;
      visitados += 1;
      const r = await baixar(item.url);
      await dormir(ESPERA_MS);
      if (r.erro || !r.corpo) {
        conferencia.erro += 1;
        continue;
      }
      const status = g.adaptador.extrair(r.corpo);
      if (!status) { conferencia.semVeredito += 1; continue; }

      if (validar) {
        if (status === item.daLM) conferencia.ok += 1;
        else conferencia.divergentes.push({ placa: item.placa, lm: item.daLM, laudo: status, url: item.url });
      } else {
        cache.placas[item.placa] = {
          status,
          fornecedor: nome,
          origem: 'laudo',
          lido_em: new Date().toISOString().slice(0, 10)
        };
        colhidos += 1;
      }
    }
  }

  console.log('');
  if (validar) {
    const total = conferencia.ok + conferencia.divergentes.length;
    console.log('CONFERENCIA CONTRA A LM');
    console.log('  bateu: ' + conferencia.ok + ' de ' + total
      + (total ? '  (' + ((conferencia.ok / total) * 100).toFixed(1) + '%)' : ''));
    console.log('  divergiu: ' + conferencia.divergentes.length);
    console.log('  sem veredito no laudo: ' + conferencia.semVeredito + ' | erro de rede: ' + conferencia.erro);
    for (const d of conferencia.divergentes.slice(0, 15)) {
      console.log('    ' + d.placa + ' | LM diz ' + d.lm + ' | laudo diz ' + d.laudo);
    }
    if (conferencia.divergentes.length > 15) {
      console.log('    ... e mais ' + (conferencia.divergentes.length - 15));
    }
  } else {
    cache.atualizado = new Date().toISOString().slice(0, 10);
    gravarCache(cache);
    console.log('colhidos: ' + colhidos + ' status');
    console.log('  sem veredito no laudo: ' + conferencia.semVeredito + ' | erro de rede: ' + conferencia.erro);
    console.log('cache: ' + ARQUIVO_CACHE + ' (' + Object.keys(cache.placas).length + ' placas)');
  }
}

main();
