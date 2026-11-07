# -*- coding: utf-8 -*-
"""Gera o SDK do Painel de Eventos Cars2You.

    Rodar -> Pecas do Tema -> Pecas da Pagina -> Ler Carteira -> Ler Metas Mensais
          -> Metas Mensais -> Ler Metas Diarias -> Metas Diarias -> Montar Consultas
          -> MCP Consultas -> Montar Painel -> Virar Arquivo -> Subir no SharePoint

O Montar Painel vai DIVIDIDO em tres nos Code (06/11, _divide.js): o
workflow inteiro tem 164 KB e nenhuma chamada da API do n8n carrega isso sem
trocar caractere. Pecas do Tema (CSS, logos, icones) e Pecas da Pagina (a
funcao APP) sao texto que o Montar Painel le pelo nome; a prova exige o mesmo
HTML e o mesmo resumo do no inteiro. Alem do .wf.ts completo, sai o
ESQUELETO (os tres nos grandes com um marcador, para criar o workflow) e, em
n8n/_envio/, o jsCode de cada um em JSON, para preencher com update_workflow.

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

As metas (06/11): a planilha metas-painel-eventos.xlsx (gera_metas.py) mora em
METAS no SharePoint, com duas abas. Lidas SEM cabecalho (headerRow false: um
item { row: [...] } por linha): a aba tem margem, medidas mescladas e o nome
da categoria repetido -- o Montar Painel acha a linha do ID comitente. O Extract From File le UMA aba e nao
devolve o arquivo, entao a planilha e baixada duas vezes, uma por aba, tudo em
serie pelo mesmo motivo da carteira. executeOnce no segundo download: ele
recebe uma linha por grupo da primeira aba e baixaria uma vez por linha.
onError + alwaysOutputData: sem a planilha (ou sem a aba) a cadeia segue, e o
Montar Painel sai sem meta e avisa.

O codigo dos nos sai de n8n/*.js (a versao enxuta, sem comentario de bloco) e
entra como LITERAL DE TEMPLATE, cru e legivel. Cru, so tres coisas quebrariam
o literal, e as tres sao barradas aqui.

No n8n: workflow cRChMwAnLYGRMesM (projeto Cars2You), ativo desde 06/11.
Este script so escreve os arquivos; ir ao n8n e pelo update_workflow (README).
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
PECAS_TEMA = js("pecas-tema.js")
PECAS_PAGINA = js("pecas-pagina.js")
PAINEL = js("montar-painel-n8n.js")
ARQUIVO = js("virar-arquivo.js")
GRANDES = {"Peças do Tema": "pecas-tema.js", "Peças da Página": "pecas-pagina.js", "Montar Painel": "montar-painel-n8n.js"}

MCP_CRED = ("MCP Cars2You Readonly - BD SQL", "Cc8CxzVDwvA3EysZ")
SP_CRED = ("Microsoft SharePoint Conta PowerBI/Automações", "AOTm9J6pFcF0DS6g")
DRIVE = "b!WIoPIE-Ra0WlwvYnLSod44VOGNL5_GRNoDqrqsWDT53xop-CS7vvT4Ura4LiRKaM"
SP_BASE = "https://automakers.sharepoint.com/sites/N8N/_api/v2.0/drives/" + DRIVE + "/root:/"
CARTEIRA = SP_BASE + "Radar%20de%20Estoque/_dados/carteira-comercial.json:/content"
# a pasta onde o Thomas subiu a planilha (06/11): "Comitente - Metas", na raiz do site N8N
METAS = SP_BASE + "Comitente%20-%20Metas/metas-painel-eventos.xlsx:/content"


def ler_metas(var, nome, x):
    return f"""const {var} = node({{
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {{
    name: '{nome}',
    position: [{x}, 0],
    onError: 'continueRegularOutput',
    executeOnce: true,
    parameters: {{
      method: 'GET',
      url: '{METAS}',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'microsoftSharePointOAuth2Api',
      options: {{ timeout: 60000, response: {{ response: {{ responseFormat: 'file' }} }} }}
    }},
    credentials: {{ microsoftSharePointOAuth2Api: newCredential('{SP_CRED[0]}', '{SP_CRED[1]}') }}
  }}
}});"""


def aba_metas(var, nome, aba, x):
    return f"""const {var} = node({{
  type: 'n8n-nodes-base.extractFromFile',
  version: 1.2,
  config: {{
    name: '{nome}',
    position: [{x}, 0],
    onError: 'continueRegularOutput',
    alwaysOutputData: true,
    parameters: {{ operation: 'xlsx', binaryPropertyName: 'data', options: {{ headerRow: false, sheetName: '{aba}' }} }}
  }}
}});"""


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

/* a agenda (Thomas, 06/11: "de hora em hora das 9h as 18h"): todo dia, no
   minuto 0, das 9h as 18h -- 10 runs. O fuso do workflow e America/Sao_Paulo
   (setWorkflowSettings, no n8n). O Rodar fica para rodada avulsa */
const agenda = trigger({{
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {{
    name: 'De hora em hora, 9h às 18h',
    position: [0, -208],
    parameters: {{ rule: {{ interval: [{{ field: 'cronExpression', expression: '0 9-18 * * *' }}] }} }}
  }}
}});

/* o Montar Painel dividido (ver build_wf.py): as pecas grandes vem antes */
{no_code('pecasTema', 'Peças do Tema', 224, PECAS_TEMA)}

{no_code('pecasPagina', 'Peças da Página', 448, PECAS_PAGINA)}

/* a carteira comercial, EM SERIE e antes das consultas (ver build_wf.py) */
const carteira = node({{
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {{
    name: 'Ler Carteira',
    position: [672, 0],
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

/* as metas, em serie: uma aba por download (ver build_wf.py) */
{ler_metas('lerMetasMes', 'Ler Metas Mensais', 896)}

{aba_metas('metasMes', 'Metas Mensais', 'Média mensal', 1120)}

{ler_metas('lerMetasDia', 'Ler Metas Diárias', 1344)}

{aba_metas('metasDia', 'Metas Diárias', 'Média diária', 1568)}

{no_code('consultas', 'Montar Consultas', 1792, CONSULTAS)}

const mcp = node({{
  type: '@n8n/n8n-nodes-langchain.mcpClient',
  version: 1.1,
  config: {{
    name: 'MCP Consultas',
    position: [2016, 0],
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

{no_code('painel', 'Montar Painel', 2240, PAINEL)}

{no_code('arquivo', 'Virar Arquivo', 2464, ARQUIVO)}

const subir = node({{
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {{
    name: 'Subir no SharePoint',
    position: [2688, 0],
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
  .to(pecasTema)
  .to(pecasPagina)
  .to(carteira)
  .to(lerMetasMes)
  .to(metasMes)
  .to(lerMetasDia)
  .to(metasDia)
  .to(consultas)
  .to(mcp)
  .to(painel)
  .to(arquivo)
  .to(subir)
  .add(agenda)
  .to(pecasTema);
"""

destino = os.path.join(AQUI, "painel-eventos-cars2you.wf.ts")
with open(destino, "w", encoding="utf-8", newline=chr(10)) as f:
    f.write(code)

print("gerado:", destino, "·", len(code), "bytes")
assert code.count("mcpClient") == 1, "esperado 1 no MCP"
assert code.count("n8n-nodes-base.code") == 5, "esperados 5 nos Code (o Montar Painel em tres)"
assert code.count("httpRequest") == 4, "esperados 4 HTTP: Ler Carteira, as duas Ler Metas e Subir"
assert code.count("extractFromFile") == 2, "esperados 2 Extract: uma aba de metas cada"
assert code.index("'Metas Diárias'") < code.index("'Montar Consultas'"), "metas antes das consultas"
assert code.count("scheduleTrigger") == 1 and "'0 9-18 * * *'" in code, "a agenda: de hora em hora, 9h as 18h (ok do Thomas, 06/11)"
assert "gmail" not in code.lower() and "microsoftOutlook" not in code, "sem e-mail"
assert code.index("'Peças da Página'") < code.index("'Ler Carteira'"), "pecas antes de tudo"
print("checagens: 14 nos, 1 MCP, pecas, carteira e metas em serie, agenda 9h-18h de hora em hora, sem e-mail")

# o esqueleto (para create_workflow_from_code) e o envio de cada no grande
MARCA = "`return [{ json: { marcador: true } }];`"
esqueleto = code
for lit in (PECAS_TEMA, PECAS_PAGINA, PAINEL):
    assert esqueleto.count(lit) == 1
    esqueleto = esqueleto.replace(lit, MARCA)
with open(os.path.join(AQUI, "painel-eventos-cars2you.esqueleto.wf.ts"), "w", encoding="utf-8", newline=chr(10)) as f:
    f.write(esqueleto)
import json
os.makedirs(os.path.join(AQUI, "n8n", "_envio"), exist_ok=True)
for nome, arq in GRANDES.items():
    with open(os.path.join(AQUI, "n8n", arq), encoding="utf-8") as f:
        fonte = f.read()
    with open(os.path.join(AQUI, "n8n", "_envio", arq + ".json"), "w", encoding="utf-8", newline=chr(10)) as f:
        f.write(json.dumps(fonte, ensure_ascii=False))
print("esqueleto:", len(esqueleto), "bytes · envio:", ", ".join(GRANDES.values()))
