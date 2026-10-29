/* ═══════════════════════════════════════════════════════════════════════════
   NÓ "Virar Arquivo" — o HTML do painel vira binário para o upload

   O mesmo do Painel de Eventos C6, que veio do Radar de Estoque
   (rel-veiculos/virar-arquivo.js), onde cada decisão abaixo foi paga:

   - Code node e não "Convert to File": o "toBinary" espera base64 e, com
     HTML em texto, gera arquivo de 14 bytes com status de sucesso (Lista LM,
     25/08). Aqui o binário é montado à mão e CONFERIDO na volta.
   - BOM na frente: o SharePoint descarta o charset do mimeType ao guardar, e
     sem BOM o acento abre corrompido (Radar, 21/09).
   - Nome fixo, sem data: o PUT no mesmo caminho substitui, e o link fica
     estável para mandar uma vez ao time.
   - Upload por PATH cria a pasta. Trocar PASTA depois abre pasta nova e deixa
     a antiga parada — o Radar já tem duas órfãs por isso. Escolher uma vez.
   ═══════════════════════════════════════════════════════════════════════════ */

const FUSO_MIN = -180;
const PASTA = 'Painel de Eventos Cars2You';
const PREFIXO = 'painel-eventos-cars2you';
/* piso de sanidade: a coleta de 28/10 deu 2,6 MB, e o tema sozinho tem
   12 KB. Abaixo de 500 KB o Montar Painel perdeu a maior parte do dado. */
const MIN_BYTES = 500 * 1024;

const fonte = $input.first().json;
const html = fonte.html;
if (typeof html !== 'string') {
  throw new Error('Virar Arquivo: o Montar Painel nao entregou "html" como texto (veio ' + typeof html + ').');
}

const BOM = String.fromCharCode(0xFEFF);
const comBom = html.indexOf(BOM) === 0 ? html : BOM + html;
const bytesHtml = Buffer.byteLength(html, 'utf8');
const bytesFonte = Buffer.byteLength(comBom, 'utf8');
if (bytesHtml < MIN_BYTES) {
  throw new Error('Virar Arquivo: o HTML tem ' + bytesHtml + ' bytes, abaixo do piso de ' + MIN_BYTES +
    '. Melhor falhar do que publicar painel vazio.');
}

const b64 = Buffer.from(comBom, 'utf8').toString('base64');
const bytesVolta = Buffer.from(b64, 'base64').length;
if (bytesVolta !== bytesFonte) {
  throw new Error('Virar Arquivo: o base64 voltou com ' + bytesVolta + ' bytes e a fonte tem ' +
    bytesFonte + '. A conversao comeu conteudo.');
}

const agora = new Date(Date.now() + FUSO_MIN * 60000);
const nomeArquivo = PREFIXO + '.html';
const caminho = [PASTA, nomeArquivo].map((p) => encodeURIComponent(p)).join('/');

return [{
  json: {
    pasta: PASTA, nomeArquivo: nomeArquivo, caminho: caminho, bytes: bytesFonte,
    gerado_em: agora.toISOString().slice(0, 16).replace('T', ' '),
    resumo: fonte.resumo
  },
  binary: {
    data: { data: b64, mimeType: 'text/html; charset=utf-8', fileName: nomeArquivo, fileExtension: 'html' }
  }
}];
