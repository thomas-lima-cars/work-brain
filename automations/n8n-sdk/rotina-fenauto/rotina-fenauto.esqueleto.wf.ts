import { workflow, node, trigger, newCredential, expr } from '@n8n/workflow-sdk';

const rodar = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'Rodar', position: [0, 0] }
});

/* a agenda (Thomas, 09/11): de hora em hora, das 9h as 18h, segunda a sabado.
   O fuso do workflow e America/Sao_Paulo (setWorkflowSettings, no n8n) */
const agenda = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {
    name: 'De hora em hora, 9h às 18h, seg a sáb',
    position: [0, -208],
    parameters: { rule: { interval: [{ field: 'cronExpression', expression: '0 9-18 * * 1-6' }] } }
  }
});

/* ── ramo C6 ── */
const c6_pecas_tema = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Peças do Tema C6',
    position: [224, 0],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `return [{ json: { marcador: true } }];` }
  }
});

const c6_pecas_pagina = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Peças da Página C6',
    position: [448, 0],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `return [{ json: { marcador: true } }];` }
  }
});

const c6_montar_consultas = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Montar Consultas C6',
    position: [672, 0],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `return [{ json: { marcador: true } }];` }
  }
});

const c6_mcp = node({
  type: '@n8n/n8n-nodes-langchain.mcpClient',
  version: 1.1,
  config: {
    name: 'MCP Consultas C6',
    position: [896, 0],
    parameters: {
      serverTransport: 'sse',
      endpointUrl: 'https://mcp-cars2you-readonly.cars2you.com.br/sse',
      authentication: 'bearerAuth',
      tool: { __rl: true, mode: 'id', value: 'run_query', cachedResultName: 'run_query' },
      inputMode: 'json',
      jsonInput: expr('{{ JSON.stringify({ sql: $json.sql, database: $json.database }) }}'),
      options: { timeout: 60000 }
    },
    credentials: { httpBearerAuth: newCredential('MCP Cars2You Readonly - BD SQL', 'Cc8CxzVDwvA3EysZ') }
  }
});

const c6_montar_painel = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Montar Painel C6',
    position: [1120, 0],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `return [{ json: { marcador: true } }];` }
  }
});

const c6_virar_arquivo = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Virar Arquivo C6',
    position: [1344, 0],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `return [{ json: { marcador: true } }];` }
  }
});

const c6_subir = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Subir no SharePoint C6',
    position: [1568, 0],
    parameters: {
      method: 'PUT',
      url: expr('{{ "https://automakers.sharepoint.com/sites/N8N/_api/v2.0/drives/b!WIoPIE-Ra0WlwvYnLSod44VOGNL5_GRNoDqrqsWDT53xop-CS7vvT4Ura4LiRKaM/root:/" + $json.caminho + ":/content" }}'),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'microsoftSharePointOAuth2Api',
      sendBody: true,
      contentType: 'binaryData',
      inputDataFieldName: 'data',
      options: { timeout: 180000 }
    },
    credentials: { microsoftSharePointOAuth2Api: newCredential('Microsoft SharePoint Conta PowerBI/Automações', 'AOTm9J6pFcF0DS6g') }
  }
});

/* ── ramo IGA ── */
const iga_pecas_tema = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Peças do Tema IGA',
    position: [224, 256],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `return [{ json: { marcador: true } }];` }
  }
});

const iga_pecas_pagina = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Peças da Página IGA',
    position: [448, 256],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `return [{ json: { marcador: true } }];` }
  }
});

const iga_montar_consultas = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Montar Consultas IGA',
    position: [672, 256],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `return [{ json: { marcador: true } }];` }
  }
});

const iga_mcp = node({
  type: '@n8n/n8n-nodes-langchain.mcpClient',
  version: 1.1,
  config: {
    name: 'MCP Consultas IGA',
    position: [896, 256],
    parameters: {
      serverTransport: 'sse',
      endpointUrl: 'https://mcp-cars2you-readonly.cars2you.com.br/sse',
      authentication: 'bearerAuth',
      tool: { __rl: true, mode: 'id', value: 'run_query', cachedResultName: 'run_query' },
      inputMode: 'json',
      jsonInput: expr('{{ JSON.stringify({ sql: $json.sql, database: $json.database }) }}'),
      options: { timeout: 60000 }
    },
    credentials: { httpBearerAuth: newCredential('MCP Cars2You Readonly - BD SQL', 'Cc8CxzVDwvA3EysZ') }
  }
});

const iga_montar_painel = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Montar Painel IGA',
    position: [1120, 256],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `return [{ json: { marcador: true } }];` }
  }
});

const iga_virar_arquivo = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Virar Arquivo IGA',
    position: [1344, 256],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `return [{ json: { marcador: true } }];` }
  }
});

const iga_subir = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Subir no SharePoint IGA',
    position: [1568, 256],
    parameters: {
      method: 'PUT',
      url: expr('{{ "https://automakers.sharepoint.com/sites/N8N/_api/v2.0/drives/b!WIoPIE-Ra0WlwvYnLSod44VOGNL5_GRNoDqrqsWDT53xop-CS7vvT4Ura4LiRKaM/root:/" + $json.caminho + ":/content" }}'),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'microsoftSharePointOAuth2Api',
      sendBody: true,
      contentType: 'binaryData',
      inputDataFieldName: 'data',
      options: { timeout: 180000 }
    },
    credentials: { microsoftSharePointOAuth2Api: newCredential('Microsoft SharePoint Conta PowerBI/Automações', 'AOTm9J6pFcF0DS6g') }
  }
});

/* ── ramo Cars2You ── */
const cars2you_pecas_tema = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Peças do Tema Cars2You',
    position: [224, 512],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `return [{ json: { marcador: true } }];` }
  }
});

const cars2you_pecas_pagina = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Peças da Página Cars2You',
    position: [448, 512],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `return [{ json: { marcador: true } }];` }
  }
});

const cars2you_montar_consultas = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Montar Consultas Cars2You',
    position: [672, 512],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `return [{ json: { marcador: true } }];` }
  }
});

const cars2you_mcp = node({
  type: '@n8n/n8n-nodes-langchain.mcpClient',
  version: 1.1,
  config: {
    name: 'MCP Consultas Cars2You',
    position: [896, 512],
    parameters: {
      serverTransport: 'sse',
      endpointUrl: 'https://mcp-cars2you-readonly.cars2you.com.br/sse',
      authentication: 'bearerAuth',
      tool: { __rl: true, mode: 'id', value: 'run_query', cachedResultName: 'run_query' },
      inputMode: 'json',
      jsonInput: expr('{{ JSON.stringify({ sql: $json.sql, database: $json.database }) }}'),
      options: { timeout: 60000 }
    },
    credentials: { httpBearerAuth: newCredential('MCP Cars2You Readonly - BD SQL', 'Cc8CxzVDwvA3EysZ') }
  }
});

const cars2you_montar_painel = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Montar Painel Cars2You',
    position: [1120, 512],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `return [{ json: { marcador: true } }];` }
  }
});

const cars2you_virar_arquivo = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Virar Arquivo Cars2You',
    position: [1344, 512],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `return [{ json: { marcador: true } }];` }
  }
});

const cars2you_subir = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Subir no SharePoint Cars2You',
    position: [1568, 512],
    parameters: {
      method: 'PUT',
      url: expr('{{ "https://automakers.sharepoint.com/sites/N8N/_api/v2.0/drives/b!WIoPIE-Ra0WlwvYnLSod44VOGNL5_GRNoDqrqsWDT53xop-CS7vvT4Ura4LiRKaM/root:/" + $json.caminho + ":/content" }}'),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'microsoftSharePointOAuth2Api',
      sendBody: true,
      contentType: 'binaryData',
      inputDataFieldName: 'data',
      options: { timeout: 180000 }
    },
    credentials: { microsoftSharePointOAuth2Api: newCredential('Microsoft SharePoint Conta PowerBI/Automações', 'AOTm9J6pFcF0DS6g') }
  }
});

export default workflow('rotina-fenauto', 'Rotina Fenauto')
  .add(rodar)
  .to(c6_pecas_tema)
  .to(c6_pecas_pagina)
  .to(c6_montar_consultas)
  .to(c6_mcp)
  .to(c6_montar_painel)
  .to(c6_virar_arquivo)
  .to(c6_subir)
  .to(iga_pecas_tema)
  .to(iga_pecas_pagina)
  .to(iga_montar_consultas)
  .to(iga_mcp)
  .to(iga_montar_painel)
  .to(iga_virar_arquivo)
  .to(iga_subir)
  .to(cars2you_pecas_tema)
  .to(cars2you_pecas_pagina)
  .to(cars2you_montar_consultas)
  .to(cars2you_mcp)
  .to(cars2you_montar_painel)
  .to(cars2you_virar_arquivo)
  .to(cars2you_subir)
  .add(agenda)
  .to(c6_pecas_tema);
