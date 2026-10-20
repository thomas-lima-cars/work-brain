"""Gera analise-base-geral.wf.ts a partir dos .js e do template.
Os nos Code entram como string; as constantes sao injetadas no Montar HTML no
lugar do marcador __CONST_JSON__, e o template vira dois nos proprios.
Uso: python gen_wf.py
"""
import json, os

AQUI = os.path.dirname(os.path.abspath(__file__))
ler = lambda n: open(os.path.join(AQUI, n), encoding='utf-8').read()
js = lambda s: json.dumps(s, ensure_ascii=False)

montar_queries = ler('montar-queries.js')
montar_html = ler('montar-html.js').replace('__CONST_JSON__', json.dumps(json.loads(ler('constantes.json')), ensure_ascii=False))

# O template vai em dois nos: jsCode viaja inteiro pela API, e no de 87 KB ja nao passou.
# Corte no inicio do <script> principal; o Montar HTML concatena os dois.
def partes_template():
    t = ler('template.html')
    i = t.index('<script>\nvar D = ')
    return t[:i], t[i:]
tpl_topo, tpl_script = partes_template()
# Texto cru (String.raw) em vez de JSON: o no fica legivel e igual ao arquivo.
# So vale enquanto o template nao tiver crase, ${ nem barra invertida - a guarda abaixo para.
def no_tpl(t):
    assert '`' not in t and '${' not in t and '\\' not in t, 'template com crase, ${ ou barra: String.raw nao serve'
    return ('/* Gerado por gen_wf.py a partir de template.html. Nao editar aqui. */\n'
            'return [{ json: { t: String.raw`' + t + '` } }];')

anexar = (
    "const html = $json.html;\n"
    "const buff = Buffer.from(html, 'utf8');\n"
    "const now = new Date();\n"
    "const p = (n) => String(n).padStart(2,'0');\n"
    "const fileName = 'Analise_base_geral_clientes_' + now.getFullYear() + '-' + p(now.getMonth()+1) + '-' + p(now.getDate()) + '.html';\n"
    "return { json: {}, binary: { html: { data: buff.toString('base64'), mimeType: 'text/html', fileName: fileName, fileExtension: 'html' } } };"
)

corpo = ("=Olá,\n\nSegue em anexo a Análise de Base de Clientes. "
         "Abra o arquivo no navegador e use o seletor de canal e o filtro de período no topo.\n\nAutomação Cars2You")

# Destinatarios (16/10, pedido do Thomas). O anexo tem nome e CNPJ de cliente:
# so conta @cars2you.com.br. Everton e Guilherme entraram em 19/10.
DESTINOS = ['thomas.lima@cars2you.com.br', 'caio.ledesma@cars2you.com.br', 'fernando.tuunelis@cars2you.com.br',
            'everton.vieira@cars2you.com.br', 'guilherme.pinheiro@cars2you.com.br']
assert all(d.endswith('@cars2you.com.br') for d in DESTINOS), 'destino fora da Cars2You'


ts = f"""import {{ workflow, node, trigger, newCredential, expr }} from '@n8n/workflow-sdk';

const rodar = trigger({{
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: {{ name: 'Rodar', position: [0, 0] }},
  output: [{{}}]
}});

/* Disparo diario as 8h (pedido do Thomas, 20/10), igual ao gatilho do C6 Lojista.
   O workflow precisa de settings.timezone = America/Sao_Paulo: workflow novo
   nasce em UTC e as 8h virariam 5h de Brasilia. */
const diario = trigger({{
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {{ name: 'Diariamente as 08h', position: [0, 192], parameters: {{ rule: {{ interval: [{{ triggerAtHour: 8 }}] }} }} }},
  output: [{{}}]
}});

const templateTopo = node({{
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {{
    name: 'Template Topo',
    position: [224, -192],
    parameters: {{ jsCode: {js(no_tpl(tpl_topo))} }}
  }},
  output: [{{}}]
}});

const templateScript = node({{
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {{
    name: 'Template Script',
    position: [448, -192],
    parameters: {{ jsCode: {js(no_tpl(tpl_script))} }}
  }},
  output: [{{}}]
}});

const montarQueries = node({{
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {{
    name: 'Montar Queries',
    position: [224, 0],
    parameters: {{ jsCode: {js(montar_queries)} }}
  }},
  output: [{{}}]
}});

const mcpRun = node({{
  type: '@n8n/n8n-nodes-langchain.mcpClient',
  version: 1.1,
  config: {{
    name: 'MCP Run',
    position: [448, 0],
    parameters: {{
      serverTransport: 'sse',
      endpointUrl: 'https://mcp-cars2you-readonly.cars2you.com.br/sse',
      authentication: 'bearerAuth',
      tool: {{ __rl: true, mode: 'id', value: 'run_query', cachedResultName: 'run_query' }},
      inputMode: 'json',
      jsonInput: expr("{{{{ JSON.stringify({{ sql: $json.sql, database: $json.database }}) }}}}"),
      options: {{ timeout: 120000 }}
    }},
    credentials: {{ httpBearerAuth: newCredential('MCP Cars2You Readonly - BD SQL', 'Cc8CxzVDwvA3EysZ') }}
  }},
  output: [{{}}]
}});

const montarHtml = node({{
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {{
    name: 'Montar HTML',
    position: [672, 0],
    parameters: {{ jsCode: {js(montar_html)} }}
  }},
  output: [{{}}]
}});

const anexarHtml = node({{
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {{
    name: 'Anexar HTML',
    position: [896, 0],
    parameters: {{ jsCode: {js(anexar)} }}
  }},
  output: [{{}}]
}});

const enviar = node({{
  type: 'n8n-nodes-base.microsoftOutlook',
  version: 2,
  config: {{
    name: 'Enviar para Thomas',
    position: [1120, 0],
    parameters: {{
      toRecipients: {js(', '.join(DESTINOS))},
      subject: expr("{{{{ 'Análise de Base de Clientes - 6 canais - ' + $now.toFormat('dd/MM/yyyy') }}}}"),
      bodyContent: {js(corpo)},
      additionalFields: {{ attachments: {{ attachments: [{{ binaryPropertyName: 'html' }}] }} }}
    }},
    credentials: {{ microsoftOutlookOAuth2Api: newCredential('Microsoft Outlook Power BI/Automações', 'G3MiTRT9jTVPx6Wn') }}
  }},
  output: [{{}}]
}});

export default workflow('analise-base-geral-thomas', 'Análise de Base de Clientes - 6 canais (Thomas)')
  .add(rodar)
  .to(templateTopo)
  .to(templateScript)
  .to(montarQueries)
  .to(mcpRun)
  .to(montarHtml)
  .to(anexarHtml)
  .to(enviar)
  .add(diario)
  .to(templateTopo);
"""
open(os.path.join(AQUI, 'analise-base-geral.wf.ts'), 'w', encoding='utf-8', newline='\n').write(ts)
print('analise-base-geral.wf.ts', len(ts), 'bytes')
