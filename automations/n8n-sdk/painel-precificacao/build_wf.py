# -*- coding: utf-8 -*-
"""Gera o SDK do Painel de Precificacao.

    Diariamente 7h -> Ler Modelo -> Montar Consultas -> MCP Consultas -> Montar Painel
                   -> Virar Arquivo -> Subir no SharePoint

    node _aplica-modelo.js && for f in montar-consultas.js montar-painel.js virar-arquivo.js; do node _enxuga.js $f; done
    node prova-local.js
    python build_wf.py

Padrao do Painel de Eventos C6 (build_wf.py de la): o codigo dos nos sai de
n8n/*.js (enxuto, sem comentario de bloco) e entra como LITERAL DE TEMPLATE,
cru. Tres coisas quebrariam o literal -- barra invertida, crase e ${ -- e as
tres sao barradas aqui.

O MODELO nao viaja no workflow: e um arquivo de 1,4 MB (modelo.json, de
automations/precificacao/preditivo/exporta-modelo.py) que mora no SharePoint
ao lado do painel e e lido a cada run. Re-treinar = rodar o exportador e
substituir o arquivo; o workflow nao muda.
"""
import os
from urllib.parse import quote

AQUI = os.path.dirname(os.path.abspath(__file__))


def js(nome):
    with open(os.path.join(AQUI, "n8n", nome), encoding="utf-8") as f:
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
PASTA = "Painel de Precificação"
# codificado como o Virar Arquivo faz (encodeURI): espaco e cedilha na URL crua
# quebram o pedido ao SharePoint
MODELO = quote(PASTA) + "/modelo.json"


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

/* diario, de manha (Thomas, 14/10): o que muda de um dia para o outro e a
   lista de carros e eventos; o modelo so muda no re-treino mensal */
const diario = trigger({{
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {{
    name: 'Diariamente às 07h',
    position: [0, 0],
    parameters: {{ rule: {{ interval: [{{ triggerAtHour: 7 }}] }} }}
  }},
  output: [{{}}]
}});

/* o modelo de preco (modelo.json, 1,4 MB) lido do SharePoint a cada run.
   EM SERIE e antes das consultas: na ordem de execucao v1 o n8n roda a
   cadeia principal inteira primeiro, e um no em ramo paralelo ainda nao
   existe quando o Montar Painel o procura (Radar, run 52930). */
const lerModelo = node({{
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {{
    name: 'Ler Modelo',
    position: [224, 0],
    parameters: {{
      method: 'GET',
      url: '{SP_BASE}{MODELO}:/content',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'microsoftSharePointOAuth2Api',
      options: {{ timeout: 120000, response: {{ response: {{ responseFormat: 'json' }} }} }}
    }},
    credentials: {{ microsoftSharePointOAuth2Api: newCredential('{SP_CRED[0]}', '{SP_CRED[1]}') }}
  }}
}});

{no_code("consultas", "Montar Consultas", 448, CONSULTAS)}

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

{no_code("painel", "Montar Painel", 896, PAINEL)}

{no_code("arquivo", "Virar Arquivo", 1120, ARQUIVO)}

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

export default workflow('painel-precificacao', 'Painel de Precificação')
  .add(diario)
  .to(lerModelo)
  .to(consultas)
  .to(mcp)
  .to(painel)
  .to(arquivo)
  .to(subir);
"""

with open(os.path.join(AQUI, "painel-precificacao.wf.ts"), "w", encoding="utf-8", newline="\n") as f:
    f.write(code)
print("painel-precificacao.wf.ts: %.0f KB" % (len(code.encode("utf-8")) / 1024))
