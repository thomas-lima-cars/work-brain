"""Gera analise-base-geral.wf.ts a partir dos .js e do template.
Os nos Code entram como string; o template e as constantes sao injetados no
Montar HTML no lugar dos marcadores __TEMPLATE_JSON__ e __CONST_JSON__.
Uso: python gen_wf.py
"""
import json, os

AQUI = os.path.dirname(os.path.abspath(__file__))
ler = lambda n: open(os.path.join(AQUI, n), encoding='utf-8').read()
js = lambda s: json.dumps(s, ensure_ascii=False)

montar_queries = ler('montar-queries.js')
montar_html = (ler('montar-html.js')
               .replace('__TEMPLATE_JSON__', json.dumps(ler('template.html'), ensure_ascii=False))
               .replace('__CONST_JSON__', json.dumps(json.loads(ler('constantes.json')), ensure_ascii=False)))

anexar = (
    "const html = $json.html;\n"
    "const buff = Buffer.from(html, 'utf8');\n"
    "const now = new Date();\n"
    "const p = (n) => String(n).padStart(2,'0');\n"
    "const fileName = 'Analise_base_geral_clientes_' + now.getFullYear() + '-' + p(now.getMonth()+1) + '-' + p(now.getDate()) + '.html';\n"
    "return { json: {}, binary: { html: { data: buff.toString('base64'), mimeType: 'text/html', fileName: fileName, fileExtension: 'html' } } };"
)

corpo = ("=Olá,\n\nSegue em anexo a Análise de Base de Clientes (6 canais: Marketplace Cars2You, "
         "Colaboradores C6, Canal de vendas C6 Auto, Trucks2you e Lance Fácil BTB), com KPIs, funil, "
         "recência, evolução mensal, coortes de cadastro, distribuição geográfica e ranking de compradores. "
         "Abra o arquivo no navegador e use o seletor de canal no topo.\n\nAutomação Cars2You")

ts = f"""import {{ workflow, node, trigger, newCredential, expr }} from '@n8n/workflow-sdk';

const rodar = trigger({{
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: {{ name: 'Rodar', position: [0, 0] }},
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
      toRecipients: 'thomas.lima@cars2you.com.br',
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
  .to(montarQueries)
  .to(mcpRun)
  .to(montarHtml)
  .to(anexarHtml)
  .to(enviar);
"""
open(os.path.join(AQUI, 'analise-base-geral.wf.ts'), 'w', encoding='utf-8', newline='\n').write(ts)
print('analise-base-geral.wf.ts', len(ts), 'bytes')
