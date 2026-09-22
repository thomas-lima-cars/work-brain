/* ═══════════════════════════════════════════════════════════════════════════
   NÓ "Virar Arquivo" — transforma o HTML do relatório em binário para o upload

   Fica entre `Montar HTML` e `Subir no SharePoint`.

   ─── POR QUE UM CODE NODE E NÃO O `Convert to File` ───────────────────────

   🔴 Lição paga na Lista LM em 25/08: o `Convert to File` em modo `toBinary`
   espera BASE64 na propriedade de origem. Recebendo HTML em texto puro ele
   gerou um arquivo de **14 bytes** — e com `status: success`, sem erro
   nenhum. O e-mail saiu com anexo quebrado e ninguém percebeu na hora.

   Aqui o binário é montado à mão e CONFERIDO. Duas guardas, as duas capazes
   de falhar de verdade:

     1. o `html` tem que existir e ter pelo menos MIN_BYTES;
     2. o base64 tem que decodificar de volta para EXATAMENTE o mesmo número
        de bytes do texto de origem.

   A segunda é a que pega o modo de falha real — conversão que come conteúdo.
   Não é limiar chutado: é igualdade.

   ─── O NOME DO ARQUIVO, E O FUSO DE NOVO ──────────────────────────────────

   ⚠️ `new Date()` no nó responde em UTC. Às 21h de Brasília o UTC já virou o
   dia seguinte, e o arquivo sairia datado de amanhã. Mesma armadilha que já
   mordeu a janela de eventos — por isso o mesmo FUSO_MIN do `Montar Fase 1`.

   ⚠️ **UM arquivo só, sem data no nome** (decisão do Thomas, 21/09). O PUT
   no mesmo caminho SUBSTITUI, então todo run reescreve o mesmo
   `radar-de-estoque.html`. Antes o nome levava a data e nascia um arquivo
   por dia; em duas semanas isso é um acervo que ninguém poda, e a pergunta
   que o relatório responde é sobre os **próximos 7 dias** — relatório de
   terça passada não tem leitor.

   O ganho que o nome datado não dava: **o link é estável**. Dá para marcar
   como favorito, mandar uma vez para o time e embutir em outro lugar sem
   que quebre no dia seguinte.

   O custo é não haver histórico nenhum do lado do workflow. Se um dia
   fizer falta, o lugar certo é o **versionamento da biblioteca do
   SharePoint** — que guarda as versões anteriores do mesmo arquivo e é
   configuração da biblioteca, não coisa que este nó controle.

   A data não sumiu: ela continua DENTRO do relatório (cabeçalho e
   `gerado_em`) e sai aqui no json, que é por onde o FUSO_MIN segue vivo e
   exercitado pelas provas.

   💡 Rodando só para mexer na tela? Desabilite o `Subir no SharePoint` no
   canvas (um clique) para não republicar a cada teste.
   ═══════════════════════════════════════════════════════════════════════════ */

const FUSO_MIN = -180;          /* America/Sao_Paulo, sem horário de verão */
/* Com acento, como se escreve em portugues. O caminho segue valido porque
   cada trecho passa por encodeURIComponent, que produz percent-encoding
   UTF-8: "Relatórios" vira "Relat%C3%B3rios". O SharePoint decodifica e
   guarda o nome acentuado -- o `name` que a API devolve confirma. */
/* ── O NOME DA PUBLICACAO ──────────────────────────────────────────────
   Este e o TERCEIRO nome. Os dois anteriores viraram pasta orfa no
   SharePoint, e o motivo e o mesmo das duas vezes: o upload e por PATH, e
   path CRIA a pasta. Trocar a constante nao move nada — abre pasta nova e
   deixa a antiga parada com o que ja estava publicado.

     1. `Relatorios Aderencia Veiculos`  (ASCII, 11/09 — eu escrevi sem
        acento por habito de nome de arquivo)
     2. `Relatórios Aderência Veículos`  (acentuado, a partir de 15/09)
     3. `Radar de Estoque`               (o nome do projeto, 18/09)

   As duas primeiras foram marcadas para exclusao pelo Thomas em 18/09. Se
   este nome mudar de novo, o acervo se reparte outra vez: a troca so fica
   completa quando o conteudo antigo for movido e a pasta velha, removida. */
const PASTA = 'Radar de Estoque';
const PREFIXO = 'radar-de-estoque';
const MIN_BYTES = 100 * 1024;   /* piso de sanidade: o menor run real deu 662 KB */

const fonte = $input.first().json;
const html = fonte.html;

/* ── guarda 1: veio relatório? ─────────────────────────────────────────── */
if (typeof html !== 'string') {
  throw new Error('Virar Arquivo: o Montar HTML não entregou `html` como texto (veio ' +
    typeof html + '). Sem isso não há o que subir.');
}

/* ── o BOM, e por que ele é necessário mesmo com o <meta charset> ───────
   Medido em 21/09: o relatório publicado abria como
   "Radar de Estoque â€” Cars2You". Os bytes do arquivo estavam CERTOS --
   travessão gravado como e2 80 94, `<meta charset="utf-8">` no lugar, zero
   duplo-encode. Quem errava era a leitura: alguém interpretando UTF-8 como
   CP1252.

   O `mimeType` abaixo declara `charset=utf-8`, mas isso NÃO sobrevive ao
   SharePoint: a resposta do upload devolve `"mimeType":"text/html"`, sem
   charset. Ou seja, a nossa declaração morre no armazenamento, e o que o
   navegador recebe depende do que o servidor resolver dizer.

   O BOM resolve porque está acima dos dois na ordem de detecção do HTML:
   BOM > charset do cabeçalho HTTP > <meta charset> do documento. Custa 3
   bytes e vale para o arquivo servido pelo SharePoint, baixado para o
   disco, aberto no editor ou anexado num e-mail -- todos os caminhos, e
   não só o que eu testei.

   `String.fromCharCode(0xFEFF)` e não a sequência de escape: este arquivo
   viaja pro n8n como string e não pode ganhar barra invertida. Mesmo
   motivo do `String.fromCharCode(10)` no texto do lojista. */
const BOM = String.fromCharCode(0xFEFF);
const comBom = html.indexOf(BOM) === 0 ? html : BOM + html;

/* Duas contagens, e a diferença importa. O piso pergunta "o relatório
   perdeu conteúdo?", que é sobre o HTML; o BOM é embalagem e não pode
   empurrar um arquivo raquítico para cima do piso. Já o `bytes` publicado
   e a conferência de ida e volta falam do ARQUIVO, esse com BOM. Medir os
   dois com a mesma régua deixaria o piso 3 bytes frouxo -- pouco, e
   errado do jeito que não dá para perceber depois. */
const bytesHtml = Buffer.byteLength(html, 'utf8');
const bytesFonte = Buffer.byteLength(comBom, 'utf8');

if (bytesHtml < MIN_BYTES) {
  throw new Error('Virar Arquivo: o HTML tem ' + bytesHtml + ' bytes, abaixo do piso de ' +
    MIN_BYTES + '. Relatório desse tamanho é sintoma de conteúdo perdido, não de dia fraco ' +
    '— melhor falhar do que publicar arquivo vazio.');
}

/* ── o binário, e a conferência de ida e volta ─────────────────────────── */
const buffer = Buffer.from(comBom, 'utf8');
const b64 = buffer.toString('base64');
const bytesVolta = Buffer.from(b64, 'base64').length;

if (bytesVolta !== bytesFonte) {
  throw new Error('Virar Arquivo: o base64 decodificou para ' + bytesVolta +
    ' bytes mas a fonte tem ' + bytesFonte + '. A conversão comeu conteúdo.');
}

/* ── nome e caminho ────────────────────────────────────────────────────── */
const agora = new Date(Date.now() + FUSO_MIN * 60000);
const dia = agora.toISOString().slice(0, 10);        /* YYYY-MM-DD, hora de Brasília */
/* Sem a data: um arquivo só, sobrescrito a cada run. O `dia` continua sendo
   calculado porque viaja no json abaixo -- e é ele que mantém a lição do
   fuso viva e testada, em vez de virar comentário sobre código que sumiu. */
const nomeArquivo = PREFIXO + '.html';

/* Cada trecho codificado à parte, como no `linkAnuncio()`: a pasta tem
   espaços, e barra codificada quebraria o caminho. */
const caminho = [PASTA, nomeArquivo].map((p) => encodeURIComponent(p)).join('/');

return [{
  json: {
    pasta: PASTA,
    nomeArquivo: nomeArquivo,
    caminho: caminho,
    bytes: bytesFonte,
    /* a data saiu do nome do arquivo e vive aqui: sem ela, quem lê a saída
       do nó não sabe de quando é a publicação sem abrir 4 MB de HTML */
    gerado_em: dia,
    /* carregados adiante para quem for citar o relatório (e-mail, WhatsApp) */
    resumo: fonte.resumo,
    falhas: fonte.falhas,
    problemas: fonte.problemas
  },
  binary: {
    data: {
      data: b64,
      /* O CHARSET E OBRIGATORIO AQUI, nao e detalhe.
         Servidor que entrega `Content-Type: text/html` sem charset faz o
         cabecalho HTTP ter precedencia sobre o `<meta charset="utf-8">` do
         proprio documento -- e o navegador escolhe o padrao dele. Num
         relatorio inteiro em portugues, o resultado e acento corrompido em
         cada linha.
         Ele NAO basta sozinho: o SharePoint descarta o charset ao guardar,
         e por isso o BOM acima existe. Os dois juntos. */
      mimeType: 'text/html; charset=utf-8',
      fileName: nomeArquivo,
      fileExtension: 'html'
    }
  }
}];
