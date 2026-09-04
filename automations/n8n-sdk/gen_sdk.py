# -*- coding: utf-8 -*-
"""Gera o codigo SDK do workflow de PORT (sandbox do Thomas).

Base: 2ECmLRceNEgCCYyb (producao). Diferencas deliberadas:
  - SEM o no 'Enviar Relatorio por Email' -> zero risco de disparo.
    A cadeia termina em 'Anexar HTML'; o HTML se le pela execucao.
  - Nome/slug proprios, pra nao confundir com producao nem com a copia do Everton.

Os tres jsCode sao embutidos VERBATIM via json.dumps (escaping a prova de
backtick / ${} / base64). Nada e reescrito por LLM.
"""
import io, json, os, sys, hashlib

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))


def js(name):
    p = os.path.join(HERE, name + ".js")
    s = io.open(p, encoding="utf-8").read()
    return s


MQ = js("Montar_Queries")
MH = js("Montar_HTML")
AH = js("Anexar_HTML")

for label, code in [("Montar Queries", MQ), ("Montar HTML", MH), ("Anexar HTML", AH)]:
    print("%-16s %7d chars  md5 %s" % (label, len(code), hashlib.md5(code.encode("utf-8")).hexdigest()))

TPL = """import { workflow, node, trigger, newCredential, expr } from '@n8n/workflow-sdk';

const diariamente = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {
    name: 'Diariamente as 08h',
    position: [0, 0],
    parameters: { rule: { interval: [{ triggerAtHour: 8 }] } }
  },
  output: [{}]
});

const montarQueries = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Montar Queries',
    position: [208, 0],
    parameters: { jsCode: %s }
  },
  output: [{}]
});

const mcpRun = node({
  type: '@n8n/n8n-nodes-langchain.mcpClient',
  version: 1.1,
  config: {
    name: 'MCP Run',
    position: [416, 0],
    parameters: {
      serverTransport: 'sse',
      endpointUrl: 'https://mcp-cars2you-readonly.cars2you.com.br/sse',
      authentication: 'bearerAuth',
      tool: { __rl: true, mode: 'id', value: 'run_query', cachedResultName: 'run_query' },
      inputMode: 'json',
      jsonInput: expr("{{ JSON.stringify({ sql: $json.sql, database: $json.database }) }}"),
      options: { timeout: 60000 }
    },
    credentials: { httpBearerAuth: newCredential('MCP Cars2You Readonly - BD SQL', 'Cc8CxzVDwvA3EysZ') }
  },
  output: [{}]
});

const montarHtml = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Montar HTML',
    position: [704, 0],
    parameters: { jsCode: %s }
  },
  output: [{}]
});

const anexarHtml = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Anexar HTML',
    position: [944, 0],
    parameters: { jsCode: %s }
  },
  output: [{}]
});

export default workflow('port-base-clientes-multi-wl', '[PORT-THOMAS] Base de Clientes multi-whitelabel')
  .add(diariamente)
  .to(montarQueries)
  .to(mcpRun)
  .to(montarHtml)
  .to(anexarHtml);
"""

code = TPL % (json.dumps(MQ), json.dumps(MH), json.dumps(AH))
out = os.path.join(HERE, "port-base-clientes.wf.ts")
io.open(out, "w", encoding="utf-8", newline="").write(code)
print()
print("gerado:", out, "|", len(code), "chars")

# gate de verificacao: o jsCode volta identico ao sair do literal JSON?
for label, original, lit in [
    ("Montar Queries", MQ, json.dumps(MQ)),
    ("Montar HTML", MH, json.dumps(MH)),
    ("Anexar HTML", AH, json.dumps(AH)),
]:
    back = json.loads(lit)
    ok = back == original
    print("  gate %-16s roundtrip=%s  md5 %s" % (
        label, ok, hashlib.md5(back.encode("utf-8")).hexdigest()[:12]))
    assert ok, label
