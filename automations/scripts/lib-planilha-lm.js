/*
 * Leitura e normalizacao da planilha de estoque da LM.
 *
 * Modulo compartilhado entre gerar-lista-lm.js (monta o HTML) e
 * colher-status-laudo.js (le os laudos). Os dois tem que enxergar a planilha
 * exatamente igual — se cada um tivesse a sua copia do leitor, uma mudanca de
 * layout da LM consertaria um e deixaria o outro quebrado em silencio.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

// ---------------------------------------------------------------- planilha ---

function lerXlsx(caminho) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lm-'));
  // usa o unzip do Git Bash / sistema; xlsx e um zip
  execFileSync('unzip', ['-o', '-q', caminho, '-d', tmp]);

  const decodificar = (s) => s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&amp;/g, '&');

  const textos = [];
  const caminhoStrings = path.join(tmp, 'xl', 'sharedStrings.xml');
  if (fs.existsSync(caminhoStrings)) {
    const bruto = fs.readFileSync(caminhoStrings, 'utf8');
    for (const si of bruto.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
      let t = '';
      for (const m of si[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)) t += m[1];
      textos.push(decodificar(t));
    }
  }

  const arquivosAba = fs.readdirSync(path.join(tmp, 'xl', 'worksheets'))
    .filter((f) => f.endsWith('.xml'));
  const aba = fs.readFileSync(path.join(tmp, 'xl', 'worksheets', arquivosAba[0]), 'utf8');

  const linhas = [];
  for (const lin of aba.matchAll(/<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
    const celulas = {};
    // casa celula vazia (<c ... />) e celula com valor (<c ...>...</c>)
    for (const c of lin[2].matchAll(/<c r="([A-Z]+)\d+"([^>/]*)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const coluna = c[1];
      const atributos = c[2] || '';
      const interno = c[3] || '';
      const v = interno.match(/<v>([\s\S]*?)<\/v>/);
      let valor = v ? v[1] : '';
      if (/t="s"/.test(atributos)) {
        valor = textos[Number(valor)] ?? '';
      } else if (/t="inlineStr"/.test(atributos)) {
        const is = interno.match(/<t[^>]*>([\s\S]*?)<\/t>/);
        valor = is ? decodificar(is[1]) : '';
      }
      valor = String(valor).trim();
      if (valor !== '') celulas[coluna] = valor;
    }
    if (Object.keys(celulas).length) linhas.push(celulas);
  }

  fs.rmSync(tmp, { recursive: true, force: true });

  const cabecalho = linhas[0];
  const colunas = Object.keys(cabecalho);
  return linhas.slice(1).map((c) => {
    const o = {};
    for (const k of colunas) o[cabecalho[k]] = c[k] ?? '';
    return o;
  });
}

// ------------------------------------------------------- mapa de colunas ---

// A LM muda a grafia do cabecalho entre remessas ("KM Desm" -> "KM",
// "Valor FIPE" -> "Valor Fipe", "Nome Patio" -> "Nome Pátio"). Em vez de
// perseguir cada renomeacao, o cabecalho e comparado sem acento, sem
// pontuacao e sem caixa. Cada campo do codigo tem um nome canonico.
const ALIASES = {
  placa: ['placa'],
  modelo: ['modelo'],
  anoModelo: ['ano modelo', 'anomodelo', 'ano'],
  km: ['km', 'km desm', 'km desmobilizacao'],
  cor: ['cor'],
  classif: ['classif', 'classificacao'],
  chassi: ['chassi', 'chassis'],
  codFipe: ['cod fipe', 'codigo fipe'],
  vmv: ['vmv'],
  valorFipe: ['valor fipe', 'fipe'],
  vmvSobreFipe: ['vmv fipe'],
  inicialSugerido: ['inicial sugerido'],
  patio: ['nome patio', 'patio'],
  endereco: ['endereco'],
  cidade: ['cidade'],
  uf: ['uf'],
  curva: ['curva'],
  statusLaudo: ['status laudo'],
  chave: ['chave'],
  kmLaudo: ['km laudo'],
  link: ['link', 'link laudo'],
  plataforma: ['plataforma']
};

// Sem essas o arquivo nao pode ser gerado. `curva` esta aqui porque e o que
// identifica sucata (Venda Inviavel) — perder a coluna em silencio faria a
// sucata sair na lista sem aviso nenhum.
const OBRIGATORIAS = ['placa', 'modelo', 'anoModelo', 'km', 'cor', 'classif',
  'codFipe', 'valorFipe', 'patio', 'cidade', 'uf', 'curva',
  'statusLaudo', 'chave', 'link'];

/*
 * `vmv` saiu das obrigatorias em 25/08: a LM simplesmente parou de mandar a
 * coluna naquela remessa. Matar a geracao por causa dela deixaria a operacao sem
 * lista num dia em que todo o resto do dado estava bom.
 *
 * Ausencia dela nao e inofensiva — e o preco de venda — entao o chamador tem que
 * tratar: o gerador herda o ultimo VMV conhecido do estado entre remessas e
 * declara a idade. Nunca derivar da FIPE, que seria inventar valor de venda.
 */
const DESEJAVEIS = ['vmv'];

// Campos que sao lidos da planilha mas NUNCA podem chegar ao HTML.
const PROIBIDOS = ['chassi'];

const semAcento = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '');
const chaveCabecalho = (s) => semAcento(s).toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ').trim();

function mapearColunas(linhas) {
  const brutas = Object.keys(linhas[0] || {});
  const porChave = new Map();
  for (const b of brutas) porChave.set(chaveCabecalho(b), b);

  const mapa = {};       // canonico -> nome bruto na planilha
  for (const [canonico, apelidos] of Object.entries(ALIASES)) {
    for (const a of apelidos) {
      if (porChave.has(a)) { mapa[canonico] = porChave.get(a); break; }
    }
  }

  const faltando = OBRIGATORIAS.filter((c) => !mapa[c]);
  if (faltando.length) {
    console.error('A planilha nao tem as colunas esperadas: ' + faltando.join(', '));
    console.error('Colunas encontradas: ' + brutas.join(' | '));
    console.error('A LM provavelmente mudou o layout — conferir antes de gerar a lista.');
    process.exit(1);
  }

  const ausentesDesejaveis = DESEJAVEIS.filter((c) => !mapa[c]);
  for (const c of ausentesDesejaveis) {
    console.error('ATENCAO: a planilha nao trouxe a coluna "' + c + '".');
  }

  const naoUsadas = brutas.filter((b) => !Object.values(mapa).includes(b));
  return { mapa, naoUsadas, ausentesDesejaveis };
}

// devolve as linhas com as chaves canonicas
function renomear(linhas, mapa) {
  return linhas.map((l) => {
    const o = {};
    for (const [canonico, bruto] of Object.entries(mapa)) o[canonico] = l[bruto] ?? '';
    return o;
  });
}

// atalho: le a planilha e ja devolve as linhas canonicas
function lerPlanilha(caminho) {
  const brutas = lerXlsx(caminho);
  const { mapa, naoUsadas, ausentesDesejaveis } = mapearColunas(brutas);
  return { linhas: renomear(brutas, mapa), naoUsadas, ausentesDesejaveis };
}

// ------------------------------------------------------------- normalizacao ---

const VAZIOS = new Set(['', 'N/D', 'ND', '#N/A', '#N/D', 'NULL', '-']);
const limpo = (v) => {
  const s = String(v ?? '').trim().replace(/\s{2,}/g, ' ');
  return VAZIOS.has(s.toUpperCase()) ? '' : s;
};

/*
 * A exportacao da LM corrompe pontos em virgula. Aconteceu na coluna Curva em
 * 19/08 e na coluna Link em 20/08. Sem esse conserto o botao "Ver laudo" — a
 * feature principal da lista — simplesmente nao abre.
 *
 * A corrupcao pega TODO o endereco, nao so o dominio:
 *   https://carvist,vistonline,com,br/sistema/laudo/imprimirPDFFrotaCautelar,php?id=...
 * Medido na remessa de 20/08 (748 links): 123 com virgula no host, ZERO com
 * virgula so no caminho e ZERO com virgula na query. Por isso o gatilho e a
 * virgula no host, e o conserto vale de la ate o "?" — a query fica intacta,
 * que e onde uma virgula poderia ser legitima.
 */
function consertarLink(bruto) {
  const s = limpo(bruto);
  if (!s) return { url: '', consertado: false };
  const m = s.match(/^(https?:\/\/)([^/?#]+)([^?]*)([\s\S]*)$/i);
  if (!m || !m[2].includes(',')) return { url: s, consertado: false };
  return {
    url: m[1] + m[2].replace(/,/g, '.') + m[3].replace(/,/g, '.') + m[4],
    consertado: true
  };
}

// Os tres rotulos que a LM usa na coluna Status Laudo. Qualquer status colhido
// de laudo tem que cair em um destes — nunca inventar rotulo novo.
const STATUS_LM = ['APROVADO', 'C/ APONTAMENTO', 'REPROVADO'];

module.exports = {
  lerXlsx,
  lerPlanilha,
  mapearColunas,
  renomear,
  consertarLink,
  limpo,
  semAcento,
  VAZIOS,
  ALIASES,
  OBRIGATORIAS,
  DESEJAVEIS,
  PROIBIDOS,
  STATUS_LM
};
