# -*- coding: utf-8 -*-
"""Gera o SDK do Eventos Fenauto C6.

    Rodar -> Montar Consultas -> MCP Consultas -> Montar Painel -> Virar Arquivo -> Subir no SharePoint

    node _aplica-modelo.js && for f in montar-consultas.js montar-painel.js virar-arquivo.js; do node _enxuga.js $f; done
    node prova-local.js
    python build_wf.py

Adaptado do build_wf.py do Painel de Eventos C6 (26/10): sem Ler
Representantes e sem Ler Nomes -- este painel nao tem representante, entao
nao le tabela de dados nenhuma. O resto e o mesmo: mesmo MCP, mesma conta do
SharePoint, gatilho manual.

O codigo dos nos sai de n8n/*.js (a versao enxuta, sem comentario de bloco) e
entra como LITERAL DE TEMPLATE, cru e legivel -- nao como string JSON
escapada. Cru, so tres coisas quebrariam o literal, e as tres sao barradas aqui.
Depois de sincronizar: python _confere_transcricao.py <dump>.
"""
import os

AQUI = os.path.dirname(os.path.abspath(__file__))


def js(nome):
    caminho = os.path.join(AQUI, "n8n", nome)
    with open(caminho, encoding="utf-8") as f:
        fonte = f.read()
    for proibido, porque in ((chr(92), "barra invertida"), ("`", "crase"), ("${", "${")):
        assert proibido not in fonte, nome + " tem " + porque + " -- quebraria o literal"
    return "`" + fonte + "`"


CONSULTAS = js("montar-consultas.js")
PAINEL = js("montar-painel.js")
ARQUIVO = js("virar-arquivo.js")

MCP_CRED = ("MCP Cars2You Readonly - BD SQL", "Cc8CxzVDwvA3EysZ")
SP_CRED = ("Microsoft SharePoint Conta PowerBI/Automações", "AOTm9J6pFcF0DS6g")
DRIVE = "b!WIoPIE-Ra0WlwvYnLSod44VOGNL5_GRNoDqrqsWDT53xop-CS7vvT4Ura4LiRKaM"
SP_BASE = "https://automakers.sharepoint.com/sites/N8N/_api/v2.0/drives/" + DRIVE + "/root:/"
# o mesmo projeto do painel do C6 (Cars2You). Sem tabela de dados, nada obriga
# a ficar nele -- ficou para os dois paineis irmaos morarem juntos.
PROJETO = "yAo7DiqDfz6XfXyv"


def no_code(var, nome, x, code):
    return f"""const {var} = node({{
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {{
    name: '{nome}',
    position: [{x}, 0],
    parameters: {{ mode: 'runOnceForAllItems', language: 'javaScript', jsCode: {code} }}
  }}
}});"""


code = f"""import {{ workflow, node, trigger, newCredential, expr }} from '@n8n/workflow-sdk';

const rodar = trigger({{
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: {{ name: 'Rodar', position: [0, 0] }}
}});

{no_code('consultas', 'Montar Consultas', 224, CONSULTAS)}

const mcp = node({{
  type: '@n8n/n8n-nodes-langchain.mcpClient',
  version: 1.1,
  config: {{
    name: 'MCP Consultas',
    position: [448, 0],
    parameters: {{
      serverTransport: 'sse',
      endpointUrl: 'https://mcp-cars2you-readonly.cars2you.com.br/sse',
      authentication: 'bearerAuth',
      tool: {{ __rl: true, mode: 'id', value: 'run_query', cachedResultName: 'run_query' }},
      inputMode: 'json',
      jsonInput: expr('{{{{ JSON.stringify({{ sql: $json.sql, database: $json.database }}) }}}}'),
      options: {{ timeout: 60000 }}
    }},
    credentials: {{ httpBearerAuth: newCredential('{MCP_CRED[0]}', '{MCP_CRED[1]}') }}
  }}
}});

{no_code('painel', 'Montar Painel', 672, PAINEL)}

{no_code('arquivo', 'Virar Arquivo', 896, ARQUIVO)}

const subir = node({{
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {{
    name: 'Subir no SharePoint',
    position: [1120, 0],
    parameters: {{
      method: 'PUT',
      url: expr('{{{{ "{SP_BASE}" + $json.caminho + ":/content" }}}}'),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'microsoftSharePointOAuth2Api',
      sendBody: true,
      contentType: 'binaryData',
      inputDataFieldName: 'data',
      options: {{ timeout: 180000 }}
    }},
    credentials: {{ microsoftSharePointOAuth2Api: newCredential('{SP_CRED[0]}', '{SP_CRED[1]}') }}
  }}
}});

export default workflow('eventos-fenauto-c6', 'Eventos Fenauto C6')
  .add(rodar)
  .to(consultas)
  .to(mcp)
  .to(painel)
  .to(arquivo)
  .to(subir);
"""

destino = os.path.join(AQUI, "eventos-fenauto-c6.wf.ts")
with open(destino, "w", encoding="utf-8", newline=chr(10)) as f:
    f.write(code)

print("gerado:", destino, "·", len(code), "bytes")
assert code.count("mcpClient") == 1, "esperado 1 no MCP"
assert code.count("n8n-nodes-base.code") == 3, "esperados 3 nos Code"
assert "dataTable" not in code, "sem tabela de dados: este painel nao tem representante"
assert "Ler Representantes" not in code and "Ler Nomes" not in code, "sem os nos do representante"
assert "scheduleTrigger" not in code, "sem gatilho automatico"
assert "gmail" not in code.lower() and "microsoftOutlook" not in code, "sem e-mail"
print("checagens: 6 nos, 1 MCP, nenhuma tabela de dados, sem cron, sem e-mail")
