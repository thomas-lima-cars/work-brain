import { workflow, node, trigger, newCredential, expr } from '@n8n/workflow-sdk';

/* Receber Estudos (23/11): o HTML de um estudo que roda no PC do Thomas (porque precisa da Dealers,
   que o n8n nao alcanca) chega por POST e vai para a pasta Estudos do SharePoint (site N8N).

   - Quem chama: automations/estudo-republicacoes-dealers/roda-semanal.ps1, toda segunda.
   - Seguranca: o cabecalho x-estudo-token precisa bater (onlyRunIf). Pedido sem token recebe 200 vazio e
     nao cria execucao. O cliente nao escolhe o caminho: so os estudos da lista ESTUDOS, com nome fixo.
   - __TOKEN__ e trocado na hora do envio pelo TOKEN de ~/.estudos-n8n.env (o token nao mora no repo). */

const receber = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.2,
  config: {
    name: 'Receber HTML',
    position: [0, 0],
    parameters: {
      httpMethod: 'POST',
      path: 'estudos-receber',
      authentication: 'none',
      responseMode: 'lastNode',
      responseData: 'firstEntryJson',
      options: {
        binaryPropertyName: 'data',
        onlyRunIf: "={{ $json.headers['x-estudo-token'] === '__TOKEN__' }}"
      }
    }
  }
});

const conferir = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Conferir Arquivo',
    position: [224, 0],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `/* so estes estudos entram, cada um com o nome fixo na pasta Estudos */
const ESTUDOS = {
  'republicacoes-dealers': 'estudo-republicacoes-dealers.html'
};
const it = $input.first();
const estudo = String((it.json.query || {}).estudo || '');
const nome = ESTUDOS[estudo];
if (!nome) throw new Error('estudo desconhecido: ' + estudo);
if (!it.binary || !it.binary.data) throw new Error('o pedido chegou sem arquivo (Content-Type application/octet-stream?)');
const buf = await this.helpers.getBinaryDataBuffer(0, 'data');
if (buf.length < 200 * 1024) throw new Error('arquivo pequeno demais para o estudo: ' + buf.length + ' bytes');
const ini = buf.subarray(0, 4096).toString('utf8').toLowerCase();
if (!ini.includes('<html') && !ini.includes('<!doctype html')) throw new Error('o arquivo nao e um HTML');
const bin = Object.assign({}, it.binary.data, { fileName: nome, mimeType: 'text/html' });
return [{ json: { estudo, nome, caminho: 'Estudos/' + nome, bytes: buf.length }, binary: { data: bin } }];
` }
  }
});

const subir = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Subir no SharePoint',
    position: [448, 0],
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

const resposta = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Resposta',
    position: [672, 0],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: `const r = $input.first().json;
const c = $('Conferir Arquivo').first().json;
return [{ json: { ok: true, estudo: c.estudo, caminho: c.caminho, enviados: c.bytes, gravados: r.size, url: r.webUrl, gravado_em: r.lastModifiedDateTime } }];
` }
  }
});

export default workflow('receber-estudos', 'Receber Estudos')
  .add(receber)
  .to(conferir)
  .to(subir)
  .to(resposta);
