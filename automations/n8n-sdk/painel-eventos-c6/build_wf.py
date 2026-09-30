# -*- coding: utf-8 -*-
"""Gera o SDK do Painel de Eventos C6.

    Rodar -> Ler Representantes -> Ler Nomes -> Montar Consultas -> MCP Consultas -> Montar Painel -> Virar Arquivo -> Subir no SharePoint

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
# a carteira de lojas do C6 com o representante (GN_Usuario, GP_Usuario), na
# tabela de dados do projeto Cars2You. Quem atualiza troca as LINHAS desta
# tabela -- o id e fixo; tabela nova pede trocar o id aqui.
TABELA_REPS = ("3CErbnlGy2b5sFT5", "Carteira C6 - Lojas (base 17-08-2026)")
# o nome de cada representante (Usuario, Papel, Nome), mesmo projeto
TABELA_NOMES = ("2yD9cWG0J98sFFll", "Carteira C6 - Gerentes")
# as duas tabelas moram no projeto Cars2You, e o workflow tambem
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

/* a carteira de representantes comerciais do C6, lida a cada run da tabela
   de dados do n8n (projeto Cars2You). Uma linha por loja: CNPJ, GN_Usuario,
   GP_Usuario e outras. EM SERIE e antes das consultas, nunca em ramo
   paralelo: na ordem de execucao v1 o n8n roda a cadeia principal inteira
   primeiro, e o no paralelo ainda nao existe quando o Montar Painel o
   procura (medido no Radar, run 52930). alwaysOutputData: tabela vazia
   segue adiante como um item vazio e o Montar Painel derruba o run pelo
   piso de linhas -- sem isso a cadeia pararia calada, sem painel e sem erro. */
const lerReps = node({{
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {{
    name: 'Ler Representantes',
    position: [224, 0],
    alwaysOutputData: true,
    parameters: {{
      resource: 'row',
      operation: 'get',
      dataTableId: {{ __rl: true, mode: 'id', value: '{TABELA_REPS[0]}', cachedResultName: '{TABELA_REPS[1]}' }},
      returnAll: true
    }}
  }}
}});

/* o nome de cada representante, para a tela nao mostrar o usuario. Nome e
   cosmetico: sem ele o Montar Painel mostra o usuario e avisa.
   executeOnce: o no recebe as 30 mil linhas da carteira, e sem isso roda uma
   vez POR LINHA -- 280 x 30.719 itens derrubaram o run 55187 (30/09) por
   falta de memoria. */
const lerNomes = node({{
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {{
    name: 'Ler Nomes',
    position: [448, 0],
    alwaysOutputData: true,
    executeOnce: true,
    parameters: {{
      resource: 'row',
      operation: 'get',
      dataTableId: {{ __rl: true, mode: 'id', value: '{TABELA_NOMES[0]}', cachedResultName: '{TABELA_NOMES[1]}' }},
      returnAll: true
    }}
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
  .to(lerReps)
  .to(lerNomes)
  .to(consultas)
  .to(mcp)
  .to(painel)
  .to(arquivo)
  .to(subir);
"""

destino = os.path.join(AQUI, "painel-eventos-c6.wf.ts")
with open(destino, "w", encoding="utf-8", newline=chr(10)) as f:
    f.write(code)

print("gerado:", destino, "·", len(code), "bytes")
assert code.count("mcpClient") == 1, "esperado 1 no MCP"
assert code.count("n8n-nodes-base.code") == 3, "esperados 3 nos Code"
assert code.count("n8n-nodes-base.dataTable") == 2, "esperados 2 nos de tabela: carteira e nomes"
assert "extractFromFile" not in code and "LojasAtivas" not in code, "a planilha do SharePoint saiu"
assert "scheduleTrigger" not in code, "sem gatilho automatico"
assert "gmail" not in code.lower() and "microsoftOutlook" not in code, "sem e-mail"
print("checagens: 8 nos, 1 MCP, 2 tabelas de dados, sem cron, sem e-mail")
