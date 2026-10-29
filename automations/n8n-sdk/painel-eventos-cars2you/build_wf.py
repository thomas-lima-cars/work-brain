# -*- coding: utf-8 -*-
"""Gera o SDK do Painel de Eventos Cars2You.

    Rodar -> Ler Carteira -> Montar Consultas -> MCP Consultas -> Montar Painel
          -> Virar Arquivo -> Subir no SharePoint

    node _aplica-modelo.js && for f in montar-consultas.js montar-painel.js virar-arquivo.js; do node _enxuga.js $f; done
    node prova-local.js
    python build_wf.py

Adaptado do build_wf.py do Eventos Fenauto C6 (28/10). O no novo e o Ler
Carteira: le o carteira-comercial.json que o workflow Carteira Comercial
publica as 6h (o mesmo arquivo do Radar). EM SERIE e antes das consultas: na
ordem de execucao v1 o n8n roda a cadeia principal inteira primeiro, e um no
em ramo paralelo ainda nao existe quando o Montar Painel o procura (Radar,
run 52930). onError continueRegularOutput: sem a carteira o painel sai sem o
filtro de responsavel e com o aviso, em vez de nao sair.

O codigo dos nos sai de n8n/*.js (a versao enxuta, sem comentario de bloco) e
entra como LITERAL DE TEMPLATE, cru e legivel. Cru, so tres coisas quebrariam
o literal, e as tres sao barradas aqui.

NADA vai ao n8n sem o ok final do Thomas. Este script so escreve o .wf.ts.
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
CARTEIRA = SP_BASE + "Radar%20de%20Estoque/_dados/carteira-comercial.json:/content"


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

/* a carteira comercial, EM SERIE e antes das consultas (ver build_wf.py) */
const carteira = node({{
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {{
    name: 'Ler Carteira',
    position: [224, 0],
    onError: 'continueRegularOutput',
    parameters: {{
      method: 'GET',
      url: '{CARTEIRA}',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'microsoftSharePointOAuth2Api',
      options: {{ timeout: 60000, response: {{ response: {{ responseFormat: 'json' }} }} }}
    }},
    credentials: {{ microsoftSharePointOAuth2Api: newCredential('{SP_CRED[0]}', '{SP_CRED[1]}') }}
  }}
}});

{no_code('consultas', 'Montar Consultas', 448, CONSULTAS)}

const mcp = node({{
  type: '@n8n/n8n-nodes-langchain.mcpClient',
  version: 1.1,
  config: {{
    name: 'MCP Consultas',
    position: [672, 0],
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

{no_code('painel', 'Montar Painel', 896, PAINEL)}

{no_code('arquivo', 'Virar Arquivo', 1120, ARQUIVO)}

const subir = node({{
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {{
    name: 'Subir no SharePoint',
    position: [1344, 0],
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

export default workflow('painel-eventos-cars2you', 'Painel de Eventos Cars2You')
  .add(rodar)
  .to(carteira)
  .to(consultas)
  .to(mcp)
  .to(painel)
  .to(arquivo)
  .to(subir);
"""

destino = os.path.join(AQUI, "painel-eventos-cars2you.wf.ts")
with open(destino, "w", encoding="utf-8", newline=chr(10)) as f:
    f.write(code)

print("gerado:", destino, "·", len(code), "bytes")
assert code.count("mcpClient") == 1, "esperado 1 no MCP"
assert code.count("n8n-nodes-base.code") == 3, "esperados 3 nos Code"
assert code.count("httpRequest") == 2, "esperados 2 HTTP: Ler Carteira e Subir"
assert "scheduleTrigger" not in code, "sem gatilho automatico ate o ok do Thomas"
assert "gmail" not in code.lower() and "microsoftOutlook" not in code, "sem e-mail"
print("checagens: 7 nos, 1 MCP, carteira em serie, sem cron, sem e-mail")
