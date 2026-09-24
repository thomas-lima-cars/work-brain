# -*- coding: utf-8 -*-
"""Gera o SDK do Painel de Eventos C6.

    Rodar -> Baixar Representantes -> Ler Representantes -> Montar Consultas -> MCP Consultas -> Montar Painel -> Virar Arquivo -> Subir no SharePoint

    node _aplica-modelo.js && for f in montar-consultas.js montar-painel.js virar-arquivo.js; do node _enxuga.js $f; done
    node prova-local.js
    python build_wf.py

O codigo dos nos sai de n8n/*.js (a versao enxuta, sem comentario de bloco) e
entra como LITERAL DE TEMPLATE, cru e legivel -- nao como string JSON
escapada. Quem transmite o .wf.ts ao n8n e uma chamada de API escrita por
extenso, e uma linha de 60 KB cheia de escapes e onde a transcricao erra.
Cru, so tres coisas quebrariam o literal, e as tres sao barradas aqui.
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
# a planilha de lojas ativas do C6 com o representante (USUARIO_GP). Quem
# atualiza e substitui o arquivo neste caminho -- o nome e fixo.
PLANILHA = "Painel%20de%20Eventos%20C6/_dados/LojasAtivas_C6.xlsx"


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

/* a planilha de representantes comerciais, lida a cada run. EM SERIE e antes
   das consultas, nunca em ramo paralelo: na ordem de execucao v1 o n8n roda a
   cadeia principal inteira primeiro, e o no paralelo ainda nao existe quando
   o Montar Painel o procura (medido no Radar, run 52930). Sem onError: sem
   planilha, o run cai -- publicar todo mundo "Sem Representante" seria uma
   tela plausivel e errada. */
const baixarReps = node({{
  type: 'n8n-nodes-base.httpRequest',
  version: 4.2,
  config: {{
    name: 'Baixar Representantes',
    position: [224, 0],
    parameters: {{
      url: '{SP_BASE}{PLANILHA}:/content',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'microsoftSharePointOAuth2Api',
      options: {{ response: {{ response: {{ responseFormat: 'file' }} }} }}
    }},
    credentials: {{ microsoftSharePointOAuth2Api: newCredential('{SP_CRED[0]}', '{SP_CRED[1]}') }}
  }}
}});

/* primeira aba, sem sheetName: o nome da aba e o de um job do BigQuery e muda
   a cada exportacao. readAsString para o CNPJ nao virar numero. */
const lerReps = node({{
  type: 'n8n-nodes-base.extractFromFile',
  version: 1.1,
  config: {{
    name: 'Ler Representantes',
    position: [448, 0],
    parameters: {{ operation: 'xlsx', options: {{ headerRow: true, readAsString: true }} }}
  }}
}});

{no_code('consultas', 'Montar Consultas', 672, CONSULTAS)}

const mcp = node({{
  type: '@n8n/n8n-nodes-langchain.mcpClient',
  version: 1.1,
  config: {{
    name: 'MCP Consultas',
    position: [896, 0],
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

{no_code('painel', 'Montar Painel', 1120, PAINEL)}

{no_code('arquivo', 'Virar Arquivo', 1344, ARQUIVO)}

const subir = node({{
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {{
    name: 'Subir no SharePoint',
    position: [1568, 0],
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

export default workflow('painel-eventos-c6', 'Painel de Eventos C6')
  .add(rodar)
  .to(baixarReps)
  .to(lerReps)
  .to(consultas)
  .to(mcp)
  .to(painel)
  .to(arquivo)
  .to(subir);
"""

destino = os.path.join(AQUI, "painel-eventos-c6.wf.ts")
with open(destino, "w", encoding="utf-8") as f:
    f.write(code)

print("gerado:", destino, "·", len(code), "bytes")
assert code.count("mcpClient") == 1, "esperado 1 no MCP"
assert code.count("n8n-nodes-base.code") == 3, "esperados 3 nos Code"
assert code.count("extractFromFile") == 1, "esperado 1 no de leitura da planilha"
assert "scheduleTrigger" not in code, "sem gatilho automatico"
assert "gmail" not in code.lower() and "microsoftOutlook" not in code, "sem e-mail"
print("checagens: 8 nos, 1 MCP, 1 planilha, sem cron, sem e-mail")
