# -*- coding: utf-8 -*-
"""Gera o SDK da Rotina Fenauto: os tres paineis da Fenauto num workflow so.

    node _divide.js && node prova.js && python build_wf.py

Pedido do Thomas (09/11): "inclua os 3 em uma rotina do n8n com a exportacao
dos arquivos no sharepoint em uma pasta Fenauto_202611 com subpasta para C6 e
IGA". De hora em hora, 9h as 18h, segunda a sabado; o Mega Evento Fenauto
(Cars2You) na raiz da pasta.

    Agenda / Rodar
      -> [C6]       Pecas do Tema -> Pecas da Pagina -> Montar Consultas -> MCP Consultas
                    -> Montar Painel -> Virar Arquivo -> Subir no SharePoint
      -> [IGA]      o mesmo
      -> [Cars2You] o mesmo

Os ramos vao EM SERIE: o Subir de um alimenta as Pecas do Tema do seguinte,
que ignoram a entrada (devolvem constantes), e o Montar Consultas tambem
ignora. Erro num ramo para o run: o painel falha alto de proposito, e um run
verde com painel faltando seria pior.

Gera tres coisas:
  rotina-fenauto.wf.ts            o workflow inteiro (referencia; ~350 KB, nao
                                  passa numa chamada so da API)
  rotina-fenauto.esqueleto.wf.ts  os 15 nos Code com um marcador: e o que se cria
  n8n/_envio/<ramo>.json          os 5 jsCode de cada ramo, para o update_workflow
"""
import json
import os

AQUI = os.path.dirname(os.path.abspath(__file__))

MCP_CRED = ("MCP Cars2You Readonly - BD SQL", "Cc8CxzVDwvA3EysZ")
SP_CRED = ("Microsoft SharePoint Conta PowerBI/Automações", "AOTm9J6pFcF0DS6g")
DRIVE = "b!WIoPIE-Ra0WlwvYnLSod44VOGNL5_GRNoDqrqsWDT53xop-CS7vvT4Ura4LiRKaM"
SP_BASE = "https://automakers.sharepoint.com/sites/N8N/_api/v2.0/drives/" + DRIVE + "/root:/"
PROJETO = "yAo7DiqDfz6XfXyv"   # Cars2You, o dos tres paineis irmaos
CRON = "0 9-18 * * 1-6"         # Thomas, 09/11: de hora em hora, 9h-18h, seg a sab

RAMOS = [("c6", " C6"), ("iga", " IGA"), ("cars2you", " Cars2You")]
CODE = [  # (arquivo, nome do no)
    ("pecas-tema.js", "Peças do Tema"),
    ("pecas-pagina.js", "Peças da Página"),
    ("montar-consultas.js", "Montar Consultas"),
]
CODE_DEPOIS = [
    ("montar-painel.js", "Montar Painel"),
    ("virar-arquivo.js", "Virar Arquivo"),
]
MARCA = "`return [{ json: { marcador: true } }];`"


def fonte(ramo, arq):
    with open(os.path.join(AQUI, "n8n", ramo, arq), encoding="utf-8") as f:
        s = f.read()
    for proibido, porque in ((chr(92), "barra invertida"), ("`", "crase"), ("${", "${")):
        assert proibido not in s, ramo + "/" + arq + " tem " + porque + " -- quebraria o literal"
    return s


def no_code(var, nome, x, y, code):
    return f"""const {var} = node({{
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {{
    name: '{nome}',
    position: [{x}, {y}],
    parameters: {{ mode: 'runOnceForAllItems', language: 'javaScript', jsCode: {code} }}
  }}
}});"""


def ramo_ts(ramo, suf, y, esqueleto):
    partes, vars_ = [], []
    x = 224
    for arq, nome in CODE:
        v = ramo + "_" + arq.split(".")[0].replace("-", "_")
        partes.append(no_code(v, nome + suf, x, y, MARCA if esqueleto else "`" + fonte(ramo, arq) + "`"))
        vars_.append(v)
        x += 224
    v = ramo + "_mcp"
    partes.append(f"""const {v} = node({{
  type: '@n8n/n8n-nodes-langchain.mcpClient',
  version: 1.1,
  config: {{
    name: 'MCP Consultas{suf}',
    position: [{x}, {y}],
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
}});""")
    vars_.append(v)
    x += 224
    for arq, nome in CODE_DEPOIS:
        v = ramo + "_" + arq.split(".")[0].replace("-", "_")
        partes.append(no_code(v, nome + suf, x, y, MARCA if esqueleto else "`" + fonte(ramo, arq) + "`"))
        vars_.append(v)
        x += 224
    v = ramo + "_subir"
    partes.append(f"""const {v} = node({{
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {{
    name: 'Subir no SharePoint{suf}',
    position: [{x}, {y}],
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
}});""")
    vars_.append(v)
    return "\n\n".join(partes), vars_


def monta(esqueleto):
    blocos, cadeia = [], []
    for i, (ramo, suf) in enumerate(RAMOS):
        ts, vs = ramo_ts(ramo, suf, i * 256, esqueleto)
        blocos.append("/* ── ramo" + suf + " ── */\n" + ts)
        cadeia += vs
    corpo = "\n\n".join(blocos)
    tos = "".join("\n  .to(" + v + ")" for v in cadeia)
    return f"""import {{ workflow, node, trigger, newCredential, expr }} from '@n8n/workflow-sdk';

const rodar = trigger({{
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: {{ name: 'Rodar', position: [0, 0] }}
}});

/* a agenda (Thomas, 09/11): de hora em hora, das 9h as 18h, segunda a sabado.
   O fuso do workflow e America/Sao_Paulo (setWorkflowSettings, no n8n) */
const agenda = trigger({{
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {{
    name: 'De hora em hora, 9h às 18h, seg a sáb',
    position: [0, -208],
    parameters: {{ rule: {{ interval: [{{ field: 'cronExpression', expression: '{CRON}' }}] }} }}
  }}
}});

{corpo}

export default workflow('rotina-fenauto', 'Rotina Fenauto')
  .add(rodar){tos}
  .add(agenda)
  .to({cadeia[0]});
"""


code = monta(False)
esq = monta(True)
with open(os.path.join(AQUI, "rotina-fenauto.wf.ts"), "w", encoding="utf-8", newline=chr(10)) as f:
    f.write(code)
with open(os.path.join(AQUI, "rotina-fenauto.esqueleto.wf.ts"), "w", encoding="utf-8", newline=chr(10)) as f:
    f.write(esq)

os.makedirs(os.path.join(AQUI, "n8n", "_envio"), exist_ok=True)
for ramo, suf in RAMOS:
    envio = {nome + suf: fonte(ramo, arq) for arq, nome in CODE + CODE_DEPOIS}
    with open(os.path.join(AQUI, "n8n", "_envio", ramo + ".json"), "w", encoding="utf-8", newline=chr(10)) as f:
        json.dump(envio, f, ensure_ascii=False, indent=1)

print("gerado: rotina-fenauto.wf.ts", len(code), "bytes · esqueleto", len(esq), "bytes")
assert code.count("mcpClient") == 3 and code.count("n8n-nodes-base.code") == 15 and code.count("httpRequest") == 3
assert esq.count(MARCA) == 15 and code.count(MARCA) == 0
assert code.count("scheduleTrigger") == 1 and "'" + CRON + "'" in code
assert "gmail" not in code.lower() and "microsoftOutlook" not in code, "sem e-mail"
for ramo, suf in RAMOS:
    for arq, nome in CODE + CODE_DEPOIS:
        assert code.count("name: '" + nome + suf + "'") == 1
print("checagens: 23 nos (2 gatilhos, 3 ramos de 7), agenda", CRON, ", sem e-mail")
