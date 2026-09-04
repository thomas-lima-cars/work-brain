# -*- coding: utf-8 -*-
"""Gera o codigo SDK da SONDA (sonda-lote2.wf.ts).

Por que gerar por script em vez de escrever o .ts a mao: o jsCode do builder tem
16 KB, 7 backticks e acentos dentro do SQL ('Nao identificada' com til). Escapar
isso a mao e como se erra — e o erro so aparece depois de subir. json.dumps faz
o escape correto por construcao, e o proprio script confere o roundtrip.
"""
import io, os, json, sys, hashlib
sys.stdout.reconfigure(encoding="utf-8")

HERE = os.path.dirname(os.path.abspath(__file__))
SONDA = os.path.join(HERE, "sonda-lote2-queries.js")
js = io.open(SONDA, encoding="utf-8").read()
print("builder: %d chars — md5 %s" % (len(js), hashlib.md5(js.encode()).hexdigest()))

# json.dumps produz um literal de string JS valido, com escape de ", \\ e control chars.
# Backtick e ${ nao sao especiais dentro de aspas duplas, entao nao precisam de nada.
js_lit = json.dumps(js, ensure_ascii=False)
assert json.loads(js_lit) == js, "roundtrip do escape falhou"
print("escape: ok (roundtrip confere), literal com %d chars" % len(js_lit))

MEDIR = r"""/* ─── MEDIR ────────────────────────────────────────────────────────────
   O que a sonda existe pra responder: cada query _wl cabe no deadline de
   60s do MCP, e quantas linhas ela devolve de verdade?

   As paginas do lote 2 foram dimensionadas por estimativa (58 WL x N). Se a
   contagem real encostar no teto, a pagina esta curta e linha some em
   silencio — que e exatamente o modo de falha descrito no comentario do
   RX_PAGE. Aqui isso vira numero, nao suposicao. */
const nomes = $('Queries Sonda').all().map(function (i) { return i.json; });
const outs = $('MCP Exec').all();

const por = {};
for (let i = 0; i < nomes.length; i++) {
  const n = nomes[i].queryName;
  if (!por[n]) por[n] = { queryName: n, chamadas: 0, linhas: 0, vazias: 0, erro: null };
  por[n].chamadas++;

  const o = outs[i] ? outs[i].json : null;
  let rows = null;
  if (o) {
    const sc = o.structuredContent || o;
    rows = sc && sc.rows ? sc.rows : (Array.isArray(sc) ? sc : null);
    if (o.error || (sc && sc.error)) por[n].erro = String(o.error || sc.error).slice(0, 200);
  }
  if (rows && rows.length) por[n].linhas += rows.length;
  else por[n].vazias++;
}

const RX_PAGE = 50;
const out = Object.keys(por).map(function (k) {
  const p = por[k];
  const teto = p.chamadas * RX_PAGE;
  /* paginas sobrando = a ultima pagina cheia foi seguida de pagina vazia.
     Se vazias == 0, TODAS as paginas vieram cheias — sinal de que o dado foi
     cortado no teto e falta pagina. */
  p.teto = teto;
  p.ocupacao = teto ? Math.round((p.linhas / teto) * 100) + '%' : '-';
  p.veredito = p.erro ? 'ERRO'
    : (p.vazias === 0 ? 'TETO ESTOURADO — faltam paginas'
      : (p.linhas === 0 ? 'ZERO LINHAS — conferir' : 'ok'));
  return p;
});

const totLinhas = out.reduce(function (s, p) { return s + p.linhas; }, 0);
const totChamadas = out.reduce(function (s, p) { return s + p.chamadas; }, 0);
const problemas = out.filter(function (p) { return p.veredito !== 'ok'; });

return [{ json: {
  resumo: {
    queries: out.length,
    chamadas: totChamadas,
    linhas: totLinhas,
    paginas_desperdicadas: out.reduce(function (s, p) { return s + p.vazias; }, 0),
    problemas: problemas.length
  },
  detalhe: out
} }];
"""

TS = '''import { workflow, node, trigger } from '@n8n/workflow-sdk';

/**
 * SONDA — LOTE 2 (medicao, nao entrega)
 *
 * Roda SO as 15 queries _wl novas do lote 2 e mede: tempo, linhas reais e se
 * alguma estoura o deadline de 60s do MCP. 380 chamadas, contra as 1.280 do
 * lote 2 completo.
 *
 * Por que existe: quando uma query passa do deadline, o no inteiro falha e nao
 * devolve NADA (execucao 48410) — subir o lote 2 completo e esperar 19 minutos
 * daria "falhou" sem dizer qual query. A sonda isola o custo novo.
 *
 * NAO TEM NO DE E-MAIL, de proposito. Nada aqui sai pra ninguem.
 * Leitura apenas: o MCP e o servidor readonly de SQL.
 */

const inicio = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'Rodar sonda' }
});

const queries = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Queries Sonda',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: __JSCODE__
    }
  }
});

const mcpExec = node({
  type: '@n8n/n8n-nodes-langchain.mcpClient',
  version: 1.1,
  config: {
    name: 'MCP Exec',
    parameters: {
      serverTransport: 'sse',
      endpointUrl: 'https://mcp-cars2you-readonly.cars2you.com.br/sse',
      authentication: 'bearerAuth',
      tool: { __rl: true, mode: 'id', value: 'run_query', cachedResultName: 'run_query' },
      inputMode: 'json',
      jsonInput: '={{ JSON.stringify({ sql: $json.sql, database: $json.database }) }}',
      options: { timeout: 60000 }
    },
    credentials: {
      httpBearerAuth: { id: 'Cc8CxzVDwvA3EysZ', name: 'MCP Cars2You Readonly - BD SQL' }
    }
  }
});

const medir = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Medir',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: __MEDIR__
    }
  }
});

export default workflow('sonda-lote2', 'SONDA lote 2 - custo das queries _wl')
  .add(inicio)
  .to(queries)
  .to(mcpExec)
  .to(medir);
'''

ts = TS.replace("__JSCODE__", js_lit).replace("__MEDIR__", json.dumps(MEDIR, ensure_ascii=False))

# provas
assert "__JSCODE__" not in ts and "__MEDIR__" not in ts, "placeholder sobrou"
assert "microsoftOutlook" not in ts, "a sonda ganhou no de e-mail — nao pode"
assert "'Não identificada'" in ts, "o acento do SQL nao sobreviveu ao escape"
for n in ['recencia_wl', 'rx_buyer_wl', 'top_ofertas_ano_wl']:
    assert n in ts, "query ausente no .ts: %s" % n
print("provas: ok (sem no de e-mail, acento preservado, queries presentes)")

out = os.path.join(HERE, "sonda-lote2.wf.ts")
io.open(out, "w", encoding="utf-8", newline="").write(ts)
print("\ngravado: %s — %d chars" % (os.path.basename(out), len(ts)))
