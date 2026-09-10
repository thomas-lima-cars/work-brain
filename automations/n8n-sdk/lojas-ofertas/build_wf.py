# -*- coding: utf-8 -*-
"""Gera o SDK do workflow embutindo os tres nos Code como string literal.

Os jsCode viajam INLINE pela API do MCP. Encodar via json.dumps evita o erro
classico de escapar string de 20 KB na mao (a licao do gerador de 87 KB).

Arquitetura de DUAS FASES (desde 2026-09-09, depois da execucao 49803):

    Rodar -> Montar Totais -> MCP Totais -> Montar Queries -> MCP Exec -> Montar HTML

A fase 1 conta lojas e ofertas em 1 chamada; a fase 2 monta exatamente
ceil(lojas / 50) paginas por query. Antes o teto era chutado em 60 paginas e
170 chamadas caiam em pagina vazia -- e pagina vazia custa um agregado
completo, porque o OFFSET reexecuta a query inteira.

    python build_wf.py
"""
import json
import os

AQUI = os.path.dirname(os.path.abspath(__file__))

def js(nome):
    with open(os.path.join(AQUI, nome), encoding="utf-8") as f:
        return json.dumps(f.read())

TOTAIS = js("montar-totais.js")
QUERIES = js("montar-queries.js")
HTML = js("montar-html.js")

CRED_ID = "Cc8CxzVDwvA3EysZ"
CRED_NOME = "MCP Cars2You Readonly - BD SQL"
ENDPOINT = "https://mcp-cars2you-readonly.cars2you.com.br/sse"

def no_mcp(var, nome, x):
    """Os dois nos MCP sao identicos fora nome e posicao."""
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

{no_code('montarTotais', 'Montar Totais', 224, TOTAIS)}

{no_mcp('mcpTotais', 'MCP Totais', 448)}

{no_code('montarQueries', 'Montar Queries', 672, QUERIES)}

{no_mcp('mcpExec', 'MCP Exec', 896)}

{no_code('montarHtml', 'Montar HTML', 1120, HTML)}

export default workflow('lojas-ofertas-6m', 'RELATORIO Lojas ofertantes - 6 meses (por UF e whitelabel)')
  .add(rodar)
  .to(montarTotais)
  .to(mcpTotais)
  .to(montarQueries)
  .to(mcpExec)
  .to(montarHtml);
"""

destino = os.path.join(AQUI, "lojas-ofertas-6m.wf.ts")
with open(destino, "w", encoding="utf-8") as f:
    f.write(code)

print("gerado:", destino)
print("bytes:", len(code))
print("jsCode Montar Totais: ", len(TOTAIS), "bytes escapados")
print("jsCode Montar Queries:", len(QUERIES), "bytes escapados")
print("jsCode Montar HTML:   ", len(HTML), "bytes escapados")

# checagens
assert code.count("mcpClient") == 2, "esperados 2 nos MCP"
assert code.count("n8n-nodes-base.code") == 3, "esperados 3 nos Code"
assert "gmail" not in code.lower() and "emailSend" not in code, "nenhum no de e-mail"
assert "scheduleTrigger" not in code and "cron" not in code.lower(), "nenhum gatilho automatico"
assert "MAX(o.id) AS offer_id" in code, "ultima oferta sem funcao de janela"
assert "const PAGE = 50" in code, "PAGE tem que ser 50 (teto do MCP)"
print("checagens: 6 nos, sem e-mail, sem cron, sem janela, PAGE=50")
