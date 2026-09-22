/* ═══════════════════════════════════════════════════════════════════════════
   NÓ "Virar Arquivo" — o mapa vira binário para o upload

   Fica entre `Tratar Carteira` e `Publicar`.

   Mesmo motivo do nó homônimo no Radar, e a mesma lição paga na Lista LM em
   25/08: o `Convert to File` em modo `toBinary` espera BASE64 na origem.
   Recebendo texto puro ele gerou um arquivo de 14 bytes, com
   `status: success` e sem erro nenhum.

   Aqui o binário é montado à mão e a conversão é CONFERIDA por igualdade de
   bytes, não por limiar.

   ─── SEM BOM, ao contrário do relatório ───────────────────────────────────

   O HTML do Radar leva BOM porque é servido e aberto por navegador, e o
   SharePoint descarta o charset ao guardar (medido em 21/09). Aqui é o
   oposto: quem lê este arquivo é o `JSON.parse` do nó do Radar, e **BOM
   quebra `JSON.parse`** — o caractere U+FEFF antes da chave inicial não é
   espaço em branco para o parser.

   O caminho do arquivo é sempre o MESMO, então o PUT substitui: existe uma
   carteira publicada, não um acervo. Histórico, se um dia fizer falta, é o
   versionamento da biblioteca do SharePoint.
   ═══════════════════════════════════════════════════════════════════════════ */

const PASTA = 'Radar de Estoque/_dados';
const ARQUIVO = 'carteira-comercial.json';

/* Piso de sanidade: o mapa de 2026-09, com 1.436 clientes, deu ~64 KB.
   Arquivo de 2 KB é mapa vazio com invólucro — e publicar isso substitui a
   carteira boa. Mesmo raciocínio do MIN_BYTES do Radar. */
const MIN_BYTES = 8 * 1024;

const fonte = $input.first().json;

if (!fonte || !fonte.carteira) {
  throw new Error('Virar Arquivo: o Tratar Carteira nao entregou `carteira`. Sem mapa nao ha o que publicar.');
}

const texto = JSON.stringify(fonte.carteira);
const bytesFonte = Buffer.byteLength(texto, 'utf8');

if (bytesFonte < MIN_BYTES) {
  throw new Error('Virar Arquivo: o mapa serializado tem ' + bytesFonte +
    ' bytes, abaixo do piso de ' + MIN_BYTES + '. Publicar isso substituiria ' +
    'a carteira boa por uma vazia.');
}

/* ── o binario, e a conferencia de ida e volta ───────────────────────── */
const buffer = Buffer.from(texto, 'utf8');
const b64 = buffer.toString('base64');
const volta = Buffer.from(b64, 'base64');

if (volta.length !== bytesFonte) {
  throw new Error('Virar Arquivo: o base64 decodificou para ' + volta.length +
    ' bytes mas a fonte tem ' + bytesFonte + '. A conversao comeu conteudo.');
}

/* E o que voltou tem que ser JSON valido. Custa milissegundos e fecha a
   unica porta que a igualdade de bytes deixa aberta: arquivo integro que o
   consumidor nao consegue ler. */
try {
  JSON.parse(volta.toString('utf8'));
} catch (e) {
  throw new Error('Virar Arquivo: o conteudo nao volta como JSON valido — ' + e.message);
}

/* Cada trecho do caminho codificado a parte: a pasta tem espaco, e barra
   codificada quebraria o caminho. Mesmo tratamento do Radar. */
const caminho = PASTA.split('/').concat([ARQUIVO])
  .map((p) => encodeURIComponent(p)).join('/');

return [{
  json: {
    pasta: PASTA,
    nomeArquivo: ARQUIVO,
    caminho: caminho,
    bytes: bytesFonte,
    gerado_em: fonte.carteira.gerado_em,
    resumo: fonte.resumo
  },
  binary: {
    data: {
      data: b64,
      mimeType: 'application/json; charset=utf-8',
      fileName: ARQUIVO,
      fileExtension: 'json'
    }
  }
}];
