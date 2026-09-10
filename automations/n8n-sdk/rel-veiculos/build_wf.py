# -*- coding: utf-8 -*-
"""Gera o SDK do relatorio de veiculos x aderencia de lojas.

    Rodar -> Montar Fase 1 -> MCP Fase 1 -> Montar Fase 2 -> MCP Fase 2 -> Montar HTML

Fase 1 conta veiculos e lojas; fase 2 pagina exatamente ceil(n/50). Os
jsCode viajam INLINE pela API do MCP, entao json.dumps faz o escape --
escapar 22 KB na mao e onde se erra (licao do gerador de 87 KB).

    python build_wf.py
"""
import json
import os

AQUI = os.path.dirname(os.path.abspath(__file__))

def js(nome):
    with open(os.path.join(AQUI, nome), encoding="utf-8") as f:
        return json.dumps(f.read())

F1 = js("montar-fase1.js")
F2 = js("montar-fase2.js")
HTML = js("montar-html.js")

CRED_ID = "Cc8CxzVDwvA3EysZ"
CRED_NOME = "MCP Cars2You Readonly - BD SQL"
ENDPOINT = "https://mcp-cars2you-readonly.cars2you.com.br/sse"

def no_mcp(var, nome, x):
    return f"""const {var} = node({{
  type: '@n8n/n8n-nodes-langchain.mcpClient',
  version: 1.1,
  config: {{
    name: '{nome}',
    position: [{x}, 0],
    onError: 'continueRegularOutput',
    parameters: {{
      serverTransport: 'sse',
      endpointUrl: '{ENDPOINT}',
      authentication: 'bearerAuth',
      tool: {{ __rl: true, mode: 'id', value: 'run_query', cachedResultName: 'run_query' }},
      inputMode: 'json',
      jsonInput: expr('{{{{ JSON.stringify({{ sql: $json.sql, database: $json.database }}) }}}}'),
      options: {{ timeout: 60000 }}
    }},
    credentials: {{ httpBearerAuth: newCredential('{CRED_NOME}', '{CRED_ID}') }}
  }}
}});"""

def no_code(var, nome, x, code):
    return f"""const {var} = node({{
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {{
    name: '{nome}',
    position: [{x}, 0],
    parameters: {{
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: {code}
    }}
  }}
}});"""

code = f"""import {{ workflow, node, trigger, newCredential, expr }} from '@n8n/workflow-sdk';

const rodar = trigger({{
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: {{ name: 'Rodar', position: [0, 0] }}
}});

{no_code('fase1', 'Montar Fase 1', 224, F1)}

{no_mcp('mcp1', 'MCP Fase 1', 448)}

{no_code('fase2', 'Montar Fase 2', 672, F2)}

{no_mcp('mcp2', 'MCP Fase 2', 896)}

{no_code('html', 'Montar HTML', 1120, HTML)}

export default workflow('rel-veiculos-aderencia', 'RELATORIO Veiculos em evento - lojas mais aderentes')
  .add(rodar)
  .to(fase1)
  .to(mcp1)
  .to(fase2)
  .to(mcp2)
  .to(html);
"""

destino = os.path.join(AQUI, "rel-veiculos.wf.ts")
with open(destino, "w", encoding="utf-8") as f:
    f.write(code)

print("gerado:", destino)
print("bytes:", len(code))
for rot, s in [("Fase 1", F1), ("Fase 2", F2), ("HTML", HTML)]:
    print(f"  jsCode {rot}: {len(s)} bytes escapados")

assert code.count("mcpClient") == 2, "esperados 2 nos MCP"
assert code.count("n8n-nodes-base.code") == 3, "esperados 3 nos Code"
assert "gmail" not in code.lower() and "emailSend" not in code, "nenhum no de e-mail"
assert "scheduleTrigger" not in code and "cron" not in code.lower(), "nenhum gatilho automatico"
assert "const PAGE = 50" in code, "PAGE tem que ser 50"
assert "value_actual" in code, "o preco do veiculo e o value_actual"
print("checagens: 6 nos, sem e-mail, sem cron, PAGE=50, value_actual presente")
