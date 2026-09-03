#!/usr/bin/env node
/*
 * Gerador da lista HTML de estoque ativo LM.
 *
 * Uso:  node gerar-lista-lm.js "<caminho do .xlsx>" [pasta de saida] [--tipo=leve]
 *
 * Le a planilha que a LM manda para a operacao, normaliza os dados e escreve
 * UM ARQUIVO POR CLASSIFICACAO (leves e pesados separados — decisao do Tuunelis
 * em 20/08: "sao publicos diferentes, eles tem regras diferentes"). Cada carro
 * e uma linha, com "Ver laudo" (abre em outra aba) e "Enviar proposta" (abre o
 * formulario n8n com os dados do carro em campos ocultos).
 *
 * Fluxo n8n de destino: 🟦 Proposta LM (Formulário) — BvqnJZoex3Y7ekL6
 *
 * ┌─ REGRAS DURAS ─────────────────────────────────────────────────────────┐
 * │ 1. CHASSI NUNCA SAI NO ARQUIVO. A planilha traz a coluna; ela e lida    │
 * │    apenas para conferencia e o HTML e auditado no fim — se um chassi    │
 * │    vazar, o gerador MORRE em vez de entregar a lista.                   │
 * │ 2. O valor inicial vem da coluna VMV. A coluna "INICIAL SUGERIDO" e     │
 * │    ignorada de proposito (ver comentario em valorInicialDe).            │
 * │ 3. Se a LM renomear/remover coluna, o gerador morre barulhento em vez   │
 * │    de sair uma lista silenciosamente incompleta.                        │
 * └────────────────────────────────────────────────────────────────────────┘
 */

const fs = require('fs');
const path = require('path');
const {
  lerPlanilha, lerXlsx, consertarLink, limpo, semAcento, PROIBIDOS
} = require('./lib-planilha-lm');

const URL_FORMULARIO = 'https://cars2you.app.n8n.cloud/form/proposta-lm';

/*
 * VERSAO DO TEMPLATE. Sobe a cada mudanca no arquivo entregue (Caio, 21/08:
 * "toda vez que a gente mudar uma coisa no arquivo, preciso que vc coloque
 * versionamento"). Vai no nome do arquivo e na capa, para que duas listas do
 * mesmo dia nunca sejam confundidas.
 *
 *   v1 (20/08) — primeira versao com design executivo e regra de % da FIPE
 *   v2 (21/08) — valor inicial pelo VMV · leves e pesados em arquivos separados
 *                · filtro por botao · chassi proibido · link de laudo consertado
 *                · estado entre remessas · 3 big numbers · status colhido do laudo
 *   v3 (21/08) — data do disparo no lugar da data da remessa (com --data para
 *                forcar) · rotulo "Sem acesso ao resultado"
 *
 * NAO CONFUNDIR com o sufixo _r2/_r3 do nome do arquivo: aquele conta quantas
 * vezes a MESMA remessa foi gerada; este conta a versao do template.
 */
const VERSAO_TEMPLATE = 'v3';

// Estado entre remessas: a LM manda a lista todo dia e o estoque e vivo — entra
// carro, sai carro, carro permanece. Esse arquivo e o que permite dizer "novo
// hoje" e "X dias na lista". E a versao local do que vira Data Table no n8n.
const ARQUIVO_ESTADO = path.join(__dirname, '..', 'estado', 'estoque-lm.json');

// Status de laudo colhido pelo colher-status-laudo.js, para os veiculos em que a
// LM deixou a coluna vazia. E o veredito que o PROPRIO laudo publica — nunca
// inferencia (ver REGRA DURA no colher-status-laudo.js).
const ARQUIVO_STATUS_LAUDO = path.join(__dirname, '..', 'estado', 'status-laudo.json');

function lerStatusColhido() {
  if (!fs.existsSync(ARQUIVO_STATUS_LAUDO)) return {};
  try {
    const c = JSON.parse(fs.readFileSync(ARQUIVO_STATUS_LAUDO, 'utf8'));
    return (c && c.placas) || {};
  } catch (e) {
    console.error('cache de status de laudo corrompido: ' + e.message);
    process.exit(1);
  }
}

// ------------------------------------------------------------ normalizacao ---

// A planilha mistura numero cru do xlsx ("38620.9700999") com texto formatado
// em pt-BR ("38.620,97"). Os dois tem que virar o mesmo numero.
function numero(v) {
  const s = limpo(v);
  if (!s) return 0;
  if (s.includes(',')) return Number(s.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
  return Number(s.replace(/[^\d.-]/g, '')) || 0;
}

const SIGLAS = new Set(['CD', 'CS', 'DC', 'TDI', 'TSI', 'GDI', 'CRDI', 'LTZ', 'LT', 'LS',
  'SE', 'SEL', 'XL', 'XLS', 'GL', 'GLS', 'MT', 'AT', 'CVT', 'TB', 'HD', 'ABS', 'AC',
  'GNV', 'SUV', 'HR', 'HRV', 'ZEN', 'S', 'E', 'LM', 'PA', 'VW', 'GM']);

// conectivos ficam em minuscula ("São Bernardo do Campo", não "DO Campo")
const CONECTIVOS = new Set(['DE', 'DO', 'DA', 'DOS', 'DAS', 'E', 'EM', 'NO', 'NA', 'AO']);

function titulo(texto) {
  const s = limpo(texto);
  if (!s) return '';
  const letras = s.replace(/[^A-Za-zÀ-ÿ]/g, '');
  const maiusculas = s.replace(/[^A-ZÀ-Þ]/g, '').length;
  // so mexe em quem veio praticamente todo em caixa alta
  if (!letras || maiusculas / letras.length < 0.7) return s;
  return s.split(' ').map((p, i) => {
    const cru = p.toUpperCase();
    if (SIGLAS.has(cru)) return cru;
    if (i > 0 && CONECTIVOS.has(cru)) return cru.toLowerCase();
    if (/^\d/.test(p)) return p.replace(/X/gi, 'x');
    // palavra sem vogal e sigla (VJB, SGP, PG, BR) — mantem em caixa alta
    if (!/[AEIOUÀ-ÿ]/i.test(p.replace(/[^A-Za-zÀ-ÿ]/g, ''))) return cru;
    if (p.length <= 2) return cru;
    return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
  }).join(' ');
}

function normalizarAno(anoBruto, modelo) {
  const a = limpo(anoBruto);
  if (/^\d{2}\/\d{2}$/.test(a)) return a;
  if (/^\d{4}$/.test(a)) {
    // a planilha as vezes traz so um ano solto; o par ano/modelo costuma
    // aparecer no proprio Modelo. Sem isso, mostra o ano cru — nao inventa par.
    const noModelo = limpo(modelo).match(/(\d{2}\/\d{2})\s*$/);
    return noModelo ? noModelo[1] : a;
  }
  return a;
}

function limparModelo(modelo) {
  // o modelo frequentemente repete o ano no fim; tira pra nao duplicar na tela
  return titulo(limpo(modelo).replace(/\s*\d{2}\/\d{2}\s*$/, ''));
}

// rotulo = pastilha na linha do carro; rotuloLongo = eixo do grafico de condicao
const BADGES = {
  APROVADO: { rotulo: 'aprovado', rotuloLongo: 'Aprovado', classe: 'ok' },
  REPROVADO: { rotulo: 'reprovado', rotuloLongo: 'Reprovado', classe: 'ruim' },
  'C/ APONTAMENTO': { rotulo: 'com apontamento', rotuloLongo: 'Com apontamento', classe: 'atencao' }
};

function normalizarChave(chave) {
  const c = limpo(chave).toUpperCase();
  if (!c) return '';
  if (c.startsWith('C/')) return 'Com chave reserva';
  if (c.startsWith('S/')) return 'Sem chave reserva';
  return titulo(chave);
}

// Regra de precificacao aposentada em 21/08. Ficou aqui inteira, desligada por
// flag, porque foi acordada com a Thais e pode voltar: o valor inicial era um
// percentual da FIPE conforme a condicao do laudo.
//   avariado 45% · aprovado 75% · com apontamento 72% · reprovado 70%
// Para religar: USAR_REGRA_PERCENTUAL_FIPE = true.
const USAR_REGRA_PERCENTUAL_FIPE = false;
const PERCENTUAL_INICIAL = [
  [/AVARIAD/, 0.45],
  [/^APROVADO/, 0.75],
  [/APONTAMENTO/, 0.72],
  [/^REPROVADO/, 0.70]
];

function percentualInicial(statusLaudo) {
  const s = limpo(statusLaudo).toUpperCase();
  if (!s) return null;
  for (const [padrao, pct] of PERCENTUAL_INICIAL) if (padrao.test(s)) return pct;
  return null;
}

/*
 * O valor inicial vem da coluna VMV (decisao do Caio, 21/08).
 *
 * A planilha tem uma segunda coluna chamada "INICIAL SUGERIDO" e ela e
 * IGNORADA DE PROPOSITO. Motivo, medido na remessa de 20/08 (748 carros):
 *   - VMV e INICIAL SUGERIDO divergem em 595 de 595 linhas onde ambas existem
 *   - em 467 casos o INICIAL SUGERIDO e exatamente igual ao Valor Fipe (100%
 *     da FIPE, imprestavel como preco de oferta)
 *   - INICIAL SUGERIDO esta vazio em 152 linhas; VMV, em apenas 1
 * Se alguem conferir o HTML contra a planilha, a diferenca e intencional.
 */
function valorInicialDe(r, fipe, herdado) {
  const vmv = Math.round(numero(r.vmv));
  if (vmv > 0) return { valor: vmv, percentual: null, origem: 'remessa' };
  /*
   * A LM parou de mandar a coluna VMV em 25/08. Sem preco a lista nao serve ao
   * lojista, entao entra o ultimo VMV conhecido daquela placa, guardado no
   * estado entre remessas — sempre DECLARADO como herdado, porque preco velho
   * passando por atual e pior do que preco nenhum.
   *
   * Nao se deriva da FIPE: seria inventar valor de venda.
   */
  if (herdado > 0) return { valor: herdado, percentual: null, origem: 'herdado' };
  if (!USAR_REGRA_PERCENTUAL_FIPE) return { valor: 0, percentual: null };
  const pct = percentualInicial(r.statusLaudo);
  return { valor: pct && fipe ? Math.round(fipe * pct) : 0, percentual: pct };
}

// A planilha nao tem coluna de fabricante — so o modelo. Estas sao as familias
// que a LM manda hoje; o que nao casar cai em "Nao identificado", nunca e chutado.
const FABRICANTES = [
  [/^(saveiro|amarok|t-cross|tcross|voyage|virtus|gol|polo|nivus|jetta|up|fox|tiguan|taos|delivery|constellation|worker|cavalo|17\.|9\.|24\.|25\.|vw)/i, 'Volkswagen'],
  [/^(kwid|kardian|duster|oroch|logan|sandero|stepway|captur|master)/i, 'Renault'],
  [/^(s10|spin|tracker|onix|prisma|cruze|montana|cobalt|joy|equinox)/i, 'Chevrolet'],
  [/^(hilux|corolla|yaris|etios|sw4|rav4)/i, 'Toyota'],
  [/^(l200|triton|pajero|outlander|eclipse|asx)/i, 'Mitsubishi'],
  [/^(fiorino|strada|toro|argo|mobi|cronos|uno|palio|ducato|doblo|siena)/i, 'Fiat'],
  [/^(ranger|ka|ecosport|fiesta|focus|cargo|f-?\d)/i, 'Ford'],
  [/^(q[3-8]|a[1-8]\b)/i, 'Audi'],
  [/^(hr\b|hb20|creta|tucson|santa|accent)/i, 'Hyundai'],
  [/^(frontier|kicks|versa|march|sentra)/i, 'Nissan'],
  [/^(c[3-4]\b|aircross|jumper|berlingo)/i, 'Citroën'],
  [/^(208|2008|partner|boxer|expert|3008)/i, 'Peugeot'],
  [/^(semi\s*reboque|reboque|rodotrem|bitrem|carreta|implemento|prancha|ba[uú]\b)/i, 'Implemento rodoviário']
];

function fabricanteDe(modelo) {
  const m = limpo(modelo);
  for (const [padrao, marca] of FABRICANTES) if (padrao.test(m)) return marca;
  return 'Nao identificado';
}

// "Venda Inviável" na coluna Curva = carro que virou sucata. Entra na lista
// (decisao do Caio, 21/08), mas identificado, nunca disfarcado de carro normal.
const ehSucata = (curva) => /VENDA\s*INVI/i.test(semAcento(limpo(curva)));

const REGIOES = {
  Norte: ['AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'TO'],
  Nordeste: ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'],
  'Centro-Oeste': ['DF', 'GO', 'MT', 'MS'],
  Sudeste: ['ES', 'MG', 'RJ', 'SP'],
  Sul: ['PR', 'RS', 'SC']
};
const UF_REGIAO = {};
for (const [regiao, ufs] of Object.entries(REGIOES)) for (const uf of ufs) UF_REGIAO[uf] = regiao;

// o logo branco vai embutido em base64 — o HTML tem que continuar autossuficiente
function logoEmbutido() {
  const caminho = path.join(__dirname, '..', 'assets', 'logo-c2y-branco.png');
  if (!fs.existsSync(caminho)) return '';
  return 'data:image/png;base64,' + fs.readFileSync(caminho).toString('base64');
}

function normalizar(linhas) {
  let linksConsertados = 0;
  let statusDoLaudo = 0;
  let vmvHerdados = 0;
  const colhido = lerStatusColhido();
  // o estado guarda o ultimo VMV por placa; e a fonte da heranca de preco
  const anterior = lerEstado().placas || {};
  const carros = linhas.map((r) => {
    const fipe = Math.round(numero(r.valorFipe));
    const modelo = limparModelo(r.modelo) || 'Modelo nao informado';
    const km = limpo(r.km) || limpo(r.kmLaudo);
    const placa = limpo(r.placa).toUpperCase();
    // a coluna da LM manda; se ela vier vazia, entra o veredito lido no laudo
    const daLM = limpo(r.statusLaudo).toUpperCase();
    const doLaudo = (!daLM && colhido[placa]) ? colhido[placa] : null;
    if (doLaudo) statusDoLaudo += 1;
    const statusLaudo = daLM || (doLaudo ? String(doLaudo.status).toUpperCase() : '');
    const guardado = anterior[placa] ? Number(anterior[placa].vmv) || 0 : 0;
    const inicial = valorInicialDe(r, fipe, guardado);
    if (inicial.origem === 'herdado') vmvHerdados += 1;
    const laudo = consertarLink(r.link);
    if (laudo.consertado) linksConsertados += 1;
    return {
      statusOrigem: daLM ? 'LM' : (doLaudo ? 'laudo' : ''),
      statusFornecedor: doLaudo ? doLaudo.fornecedor : '',
      fabricante: fabricanteDe(r.modelo),
      valorInicial: inicial.valor,
      percentualAplicado: inicial.percentual,
      vmvOrigem: inicial.origem || '',
      placa,
      modelo,
      ano: normalizarAno(r.anoModelo, r.modelo),
      km: /^\d+$/.test(km) ? Number(km) : null,
      cor: titulo(r.cor),
      classificacao: limpo(r.classif),
      codigoFipe: limpo(r.codFipe),
      fipe,
      cidade: titulo(r.cidade),
      uf: limpo(r.uf).toUpperCase(),
      regiao: UF_REGIAO[limpo(r.uf).toUpperCase()] || 'Sem regiao',
      patio: titulo(r.patio),
      endereco: limpo(r.endereco),
      curva: limpo(r.curva),
      sucata: ehSucata(r.curva),
      badge: BADGES[statusLaudo] || null,
      chave: normalizarChave(r.chave),
      laudo: laudo.url,
      plataforma: limpo(r.plataforma),
      // estado entre remessas, preenchido depois por aplicarEstado()
      dias: null,
      novo: false,
      quedaVmv: 0,
      // cruzamento com a plataforma, preenchido depois por aplicarCruzamento()
      linkAnuncio: '',
      cruzamento: '',
      evento: ''
    };
  }).filter((c) => c.placa);
  return { carros, linksConsertados, statusDoLaudo, vmvHerdados };
}

// -------------------------------------------------------------- estado ---

function lerEstado() {
  if (!fs.existsSync(ARQUIVO_ESTADO)) return { placas: {} };
  try {
    const e = JSON.parse(fs.readFileSync(ARQUIVO_ESTADO, 'utf8'));
    return e && e.placas ? e : { placas: {} };
  } catch (erro) {
    console.error('estado corrompido em ' + ARQUIVO_ESTADO + ' — ' + erro.message);
    process.exit(1);
  }
}

const diasEntre = (aIso, bIso) =>
  Math.round((Date.parse(bIso + 'T00:00:00Z') - Date.parse(aIso + 'T00:00:00Z')) / 86400000);

/*
 * Cruza a remessa de hoje com o que ja estava no estado e devolve o resumo do
 * movimento. Idempotente: rodar duas vezes a mesma remessa nao mexe em
 * `primeira` nem inventa dias, porque a data da remessa e a chave.
 */
function aplicarEstado(carros, dataRemessa) {
  const estado = lerEstado();
  const vistas = new Set();
  let novos = 0;
  const quedas = [];

  for (const c of carros) {
    vistas.add(c.placa);
    const anterior = estado.placas[c.placa];
    if (anterior) {
      const primeira = anterior.primeira < dataRemessa ? anterior.primeira : dataRemessa;
      // queda de preco so vale contra uma remessa anterior de verdade
      if (anterior.ultima < dataRemessa && anterior.vmv > 0 && c.valorInicial > 0
          && c.valorInicial < anterior.vmv) {
        c.quedaVmv = anterior.vmv - c.valorInicial;
        quedas.push(c);
      }
      c.dias = Math.max(0, diasEntre(primeira, dataRemessa));
      c.novo = c.dias === 0;
      estado.placas[c.placa] = {
        primeira,
        ultima: anterior.ultima > dataRemessa ? anterior.ultima : dataRemessa,
        vmv: c.valorInicial || anterior.vmv,
        remessas: anterior.ultima === dataRemessa ? anterior.remessas : anterior.remessas + 1
      };
    } else {
      c.dias = 0;
      c.novo = true;
      novos += 1;
      estado.placas[c.placa] = {
        primeira: dataRemessa, ultima: dataRemessa, vmv: c.valorInicial, remessas: 1
      };
    }
  }

  // sairam = estavam na ultima remessa conhecida e nao vieram nesta
  const anteriores = Object.entries(estado.placas)
    .filter(([, v]) => v.ultima < dataRemessa);
  const ultimaAnterior = anteriores.reduce((max, [, v]) => (v.ultima > max ? v.ultima : max), '');
  const sairam = ultimaAnterior
    ? anteriores.filter(([p, v]) => v.ultima === ultimaAnterior && !vistas.has(p)).length
    : 0;

  estado.atualizado = dataRemessa;
  fs.mkdirSync(path.dirname(ARQUIVO_ESTADO), { recursive: true });
  fs.writeFileSync(ARQUIVO_ESTADO, JSON.stringify(estado, null, 1), 'utf8');

  return {
    novos,
    permanecem: carros.length - novos,
    sairam,
    quedas,
    primeiraRodada: !ultimaAnterior && novos === carros.length
  };
}

// Faixas do filtro "dias na lista". Sao excludentes e cobrem tudo.
const FAIXAS_DIAS = [
  { valor: 'novo', rotulo: 'Novo hoje', teste: (d) => d === 0 },
  { valor: 'ate7', rotulo: 'Até 7 dias', teste: (d) => d >= 1 && d <= 7 },
  { valor: 'ate30', rotulo: '8 a 30 dias', teste: (d) => d >= 8 && d <= 30 },
  { valor: 'mais30', rotulo: 'Mais de 30 dias', teste: (d) => d > 30 }
];

const faixaDe = (dias) => (FAIXAS_DIAS.find((f) => f.teste(dias || 0)) || FAIXAS_DIAS[0]).valor;

// -------------------------------------------------------------------- html ---

const escapar = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// vira valor de atributo/filtro: "Semi Reboque" -> "semi-reboque"
const slug = (s) => semAcento(s)
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'sem';

const moeda = (n) => 'R$ ' + n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
const milhar = (n) => n.toLocaleString('pt-BR');

/*
 * Le o Excel do cruzamento (o anexo que o fluxo Estoque LM manda de manha) e
 * enriquece cada carro com o link do anuncio, a situacao na plataforma e o
 * feirao em que esta.
 *
 * Sao dois arquivos de proposito. A planilha da LM tem o que descreve o carro
 * (km, ano, cor, patio, cidade); o Excel do cruzamento tem o que a plataforma
 * sabe (uuid, link, situacao, evento). Nenhum dos dois basta sozinho, e juntar
 * tudo num arquivo so deixaria a lista de trabalho da Rai ilegivel.
 *
 * Casa por placa, sem hifen e em caixa alta — as duas pontas normalizam igual.
 */
function aplicarCruzamento(carros, arquivo) {
  const brutas = lerXlsx(arquivo);
  if (!brutas.length) {
    console.error('o arquivo de cruzamento esta vazio: ' + arquivo);
    process.exit(1);
  }

  const cabecalhos = Object.keys(brutas[0]);
  const achar = (...nomes) => {
    const chave = (s) => semAcento(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    for (const n of nomes) {
      const c = cabecalhos.find((h) => chave(h) === chave(n));
      if (c) return c;
    }
    return null;
  };
  const colPlaca = achar('Placa');
  const colLink = achar('Link do anuncio');
  const colSituacao = achar('Situacao');
  const colEvento = achar('Feirao / evento', 'Evento');
  if (!colPlaca || !colLink) {
    console.error('o arquivo de cruzamento nao tem as colunas Placa e "Link do anuncio".');
    console.error('cabecalhos encontrados: ' + cabecalhos.join(' | '));
    console.error('e o anexo do e-mail do fluxo Estoque LM que vale aqui, nao a planilha da LM.');
    process.exit(1);
  }

  const porPlaca = new Map();
  for (const r of brutas) {
    const p = limpo(r[colPlaca]).toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (p && !porPlaca.has(p)) porPlaca.set(p, r);
  }

  let casados = 0;
  let semRegistro = 0;
  for (const c of carros) {
    const r = porPlaca.get(c.placa);
    if (!r) { semRegistro += 1; continue; }
    casados += 1;
    c.linkAnuncio = limpo(r[colLink]);
    c.cruzamento = colSituacao ? limpo(r[colSituacao]) : '';
    c.evento = colEvento ? limpo(r[colEvento]) : '';
  }
  return { casados, semRegistro, linhas: porPlaca.size };
}

function linkProposta(carro, etiquetaLista) {
  /*
   * Quando o carro tem anuncio na plataforma, o botao vai para LA — decisao da
   * reuniao de 25/08. O lojista loga uma vez e da o lance dentro do sistema, o
   * que registra a concorrencia e dispensa digitar CNPJ e WhatsApp a cada carro.
   * O formulario do n8n continua existindo como plano B para carro sem anuncio.
   */
  if (carro.linkAnuncio) return carro.linkAnuncio;

  // O formulario mostra o veiculo em dois campos separados, porque nao da para
  // estilizar parte de um textarea: `veiculo` leva o modelo em destaque e
  // `detalhe` leva a identificacao em texto discreto. Ambos sao textarea, entao
  // nome longo quebra linha em vez de ser cortado.
  // NADA de chassi aqui — ver REGRAS DURAS no topo do arquivo.
  const linha1 = [
    'Placa ' + carro.placa,
    carro.ano,
    carro.km === null ? null : milhar(carro.km) + ' km',
    carro.uf
  ].filter(Boolean).join(' · ');
  const detalhe = linha1 + (carro.fipe ? '\nFIPE de referência: ' + moeda(carro.fipe) : '');

  const q = new URLSearchParams({
    placa: carro.placa,
    modelo: carro.modelo,
    ano: carro.ano,
    km: carro.km === null ? '' : String(carro.km),
    fipe: carro.fipe ? String(carro.fipe) : '',
    uf: carro.uf,
    lista: etiquetaLista,
    inicial: carro.valorInicial ? String(carro.valorInicial) : '',
    veiculo: carro.modelo,
    detalhe: detalhe,
    valor_inicial: carro.valorInicial ? moeda(carro.valorInicial) : 'Sob consulta'
  });
  return URL_FORMULARIO + '?' + q.toString();
}

function detalhe(rotulo, valor) {
  if (!valor) return '';
  return '<div class="d"><span>' + escapar(rotulo) + '</span>' + escapar(valor) + '</div>';
}

function montarLinha(carro, indice, etiquetaLista, novidade) {
  const idPainel = 'det' + indice;
  const resumo = [carro.ano, carro.km === null ? null : milhar(carro.km) + ' km', carro.cor]
    .filter(Boolean).join(' · ');
  const local = [carro.cidade, carro.uf].filter(Boolean).join('/');

  const badge = carro.badge
    ? '<span class="badge ' + carro.badge.classe + '">' + carro.badge.rotulo + '</span>'
    : '';
  // "novo hoje" e o gancho comercial do pitch ("menos de 24 horas no ar"), mas
  // so vale quando distingue: numa lista em que TODO carro e novo (primeira
  // remessa) o selo em 639 de 639 linhas e ruido, nao informacao.
  const badgeNovo = (carro.novo && novidade.mostrarNovo)
    ? '<span class="badge novo">novo hoje</span>' : '';
  const badgeSucata = carro.sucata ? '<span class="badge sucata">sucata</span>' : '';

  const preco = carro.fipe
    ? '<span class="fipe">FIPE <b>' + moeda(carro.fipe) + '</b></span>'
    : '<span class="fipe sem">FIPE nao informada</span>';

  // o valor inicial e o preco de oferta — quando existe, e o numero que importa
  const pctFipe = carro.fipe ? Math.round((carro.valorInicial / carro.fipe) * 100) : null;
  const inicial = carro.valorInicial
    ? '<span class="inicial">Inicial <b>' + moeda(carro.valorInicial) + '</b>'
      // acima de 100% da FIPE nao e desconto — nao pode sair pintado de verde
      + (pctFipe === null ? '' : ' <i' + (pctFipe > 100 ? ' class="acima"' : '') + '>('
        + pctFipe + '% FIPE)</i>')
      + '</span>'
    : '';

  const botaoLaudo = carro.laudo
    ? '<a class="btn" href="' + escapar(carro.laudo) + '" target="_blank" rel="noopener">Ver laudo</a>'
    : '<span class="btn desativado">Sem laudo</span>';

  const patioCompleto = [carro.patio, carro.endereco].filter(Boolean).join(' — ');
  // sem remessa anterior no estado nao existe "tempo na lista" pra informar
  const tempo = (!novidade.temHistorico || carro.dias === null) ? ''
    : (carro.dias === 0 ? 'Entrou hoje' : carro.dias + ' dia(s)');

  return [
    '<article class="carro" data-busca="' + escapar((carro.placa + ' ' + carro.modelo + ' ' + local).toLowerCase()) + '"'
      + ' data-uf="' + escapar(carro.uf) + '"'
      + ' data-laudo="' + (carro.badge ? carro.badge.classe : 'sem') + '"'
      + ' data-dias="' + faixaDe(carro.dias) + '"'
      + ' data-sucata="' + (carro.sucata ? 'sim' : 'nao') + '">',
    '  <div class="topo">',
    '    <div class="ident">',
    '      <div class="linha1"><span class="placa">' + escapar(carro.placa) + '</span><span class="modelo">' + escapar(carro.modelo) + '</span>' + badgeNovo + badgeSucata + badge + '</div>',
    '      <div class="linha2">' + escapar(resumo) + (local ? '<span class="local">' + escapar(local) + '</span>' : '') + inicial + preco + '</div>',
    '    </div>',
    '    <div class="acoes">',
    '      ' + botaoLaudo,
    '      <a class="btn primario" href="' + escapar(linkProposta(carro, etiquetaLista)) + '" target="_blank" rel="noopener">Enviar proposta</a>',
    '      <button class="btn seta" type="button" aria-expanded="false" aria-controls="' + idPainel + '" aria-label="Mais informacoes de ' + escapar(carro.placa) + '"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>',
    '    </div>',
    '  </div>',
    '  <div class="detalhes" id="' + idPainel + '" hidden>',
    '    ' + detalhe('Valor inicial', carro.valorInicial
      ? moeda(carro.valorInicial) + (carro.percentualAplicado ? ' (' + Math.round(carro.percentualAplicado * 100) + '% da FIPE)' : '')
      : 'sob consulta'),
    '    ' + detalhe('Status do laudo', carro.badge
      ? carro.badge.rotuloLongo + (carro.statusOrigem === 'laudo' ? ' (lido no laudo)' : '')
      : 'nao informado'),
    '    ' + detalhe('Codigo FIPE', carro.codigoFipe),
    '    ' + detalhe('Chave reserva', carro.chave),
    '    ' + detalhe('Patio', patioCompleto),
    '    ' + detalhe('Ano/modelo', carro.ano),
    '    ' + detalhe('Tempo na lista', tempo),
    '    ' + (carro.sucata ? detalhe('Situacao', 'Venda inviavel (sucata)') : ''),
    '    ' + (carro.quedaVmv > 0 ? detalhe('Queda de preco', moeda(carro.quedaVmv) + ' desde a remessa anterior') : ''),
    '  </div>',
    '</article>'
  ].join('\n');
}

// ------------------------------------------------------------------ visoes ---

// agrega por uma chave, somando quantidade e FIPE, e devolve ordenado por volume
function agregar(carros, chave, rotuloVazio) {
  const mapa = new Map();
  for (const c of carros) {
    const k = (typeof chave === 'function' ? chave(c) : c[chave]) || rotuloVazio;
    const atual = mapa.get(k) || { rotulo: k, quantidade: 0, fipe: 0 };
    atual.quantidade += 1;
    atual.fipe += c.fipe;
    mapa.set(k, atual);
  }
  return [...mapa.values()].sort((a, b) => b.quantidade - a.quantidade
    || a.rotulo.localeCompare(b.rotulo, 'pt-BR'));
}

// barras horizontais em CSS puro — sem SVG, sem lib, legivel em qualquer visualizador
function grafico(titulo, itens, opcoes) {
  const o = opcoes || {};
  const limite = o.limite || itens.length;
  const mostrados = itens.slice(0, limite);
  const resto = itens.length - mostrados.length;
  const maior = Math.max(...mostrados.map((i) => i.quantidade), 1);

  const linhas = mostrados.map((i) => {
    const largura = Math.max(2, Math.round((i.quantidade / maior) * 100));
    const cor = (o.cores && o.cores[i.rotulo]) ? 'background:' + o.cores[i.rotulo] + ';' : '';
    return '<li>'
      + '<div class="rot"><span title="' + escapar(i.rotulo) + '">' + escapar(i.rotulo) + '</span>'
      + '<b>' + i.quantidade + '</b></div>'
      + '<div class="trilha"><i style="' + cor + 'width:' + largura + '%"></i></div>'
      + '</li>';
  }).join('');

  return '<section class="grafico' + (o.classe ? ' ' + o.classe : '') + '">'
    + '<h3>' + escapar(titulo) + '</h3>'
    + '<ol class="barras">' + linhas + '</ol>'
    + (resto > 0 ? '<p class="resto">+ ' + resto + ' ' + (o.unidade || 'itens') + ' fora do top ' + limite + '</p>' : '')
    + '</section>';
}

// Rotulo trocado pelo Caio em 21/08. A LM tem laudo de todos os carros — o que
// falta e o resultado chegar na planilha. "Sem acesso ao resultado" e honesto;
// "sem resultado" sugeria que o laudo nao existe.
const SEM_RESULTADO = 'Sem acesso ao resultado';

const CORES_CONDICAO = {
  'Aprovado': '#16a34a',
  'Com apontamento': '#d97706',
  'Reprovado': '#dc2626',
  [SEM_RESULTADO]: '#94a3b8'
};

function bigNumber(rotulo, valor, nota, destaque) {
  return '<div class="bn' + (destaque ? ' destaque' : '') + '">'
    + '<b>' + valor + '</b>'
    + '<span>' + escapar(rotulo) + '</span>'
    + (nota ? '<em>' + escapar(nota) + '</em>' : '')
    + '</div>';
}

// grupo de filtro em botao. O Tuunelis provou em 20/08 que <select> nao funciona
// na previa do WhatsApp ("o filtro nao funciona nao, ele funciona o botao").
// So renderiza o grupo se ele tiver pelo menos duas opcoes com carro dentro —
// filtro de uma opcao so ocupa espaco e nao filtra nada.
function grupoFiltro(rotulo, grupo, opcoes) {
  const validas = opcoes.filter((o) => o.total > 0);
  if (validas.length < 2) return '';
  const chips = validas.map((o) => '<button type="button" class="chip" data-grupo="' + grupo
    + '" data-valor="' + escapar(o.valor) + '" aria-pressed="false">'
    + escapar(o.rotulo) + '<b>' + o.total + '</b></button>').join('');
  return '<div class="grupoFiltro"><p class="rotFiltro">' + escapar(rotulo) + '</p>'
    + '<div class="chips">' + chips + '</div></div>';
}

function montarHtml(carros, contexto) {
  const { etiquetaLista, dataTitulo, rotuloTipo, resumoTipos, movimento } = contexto;
  const logo = logoEmbutido();
  const ufs = [...new Set(carros.map((c) => c.uf).filter(Boolean))].sort();
  const semPreco = carros.filter((c) => !c.fipe).length;
  const semUf = carros.filter((c) => !c.uf).length;
  const modelos = new Set(carros.map((c) => c.modelo));

  // "novo" e "tempo na lista" sao contados SEMPRE sobre esta lista, nunca sobre
  // a remessa inteira — leves e pesados saem em arquivos separados e um nao
  // pode exibir o numero do outro.
  const novosNaLista = carros.filter((c) => c.novo).length;
  const novidade = {
    temHistorico: !!(movimento && !movimento.primeiraRodada),
    mostrarNovo: !!(movimento && !movimento.primeiraRodada
      && novosNaLista > 0 && novosNaLista < carros.length)
  };

  // ---- filtros por botao
  const porLaudo = (classe) => carros.filter((c) => (c.badge ? c.badge.classe : 'sem') === classe).length;
  const filtros = [
    grupoFiltro('Estado', 'uf', ufs
      .map((uf) => ({ valor: uf, rotulo: uf, total: carros.filter((c) => c.uf === uf).length }))
      .sort((a, b) => b.total - a.total || a.valor.localeCompare(b.valor))),
    grupoFiltro('Status do laudo', 'laudo', [
      { valor: 'ok', rotulo: 'Aprovado', total: porLaudo('ok') },
      { valor: 'atencao', rotulo: 'Com apontamento', total: porLaudo('atencao') },
      { valor: 'ruim', rotulo: 'Reprovado', total: porLaudo('ruim') },
      { valor: 'sem', rotulo: SEM_RESULTADO, total: porLaudo('sem') }
    ]),
    grupoFiltro('Tempo na lista', 'dias', FAIXAS_DIAS.map((f) => ({
      valor: f.valor, rotulo: f.rotulo, total: carros.filter((c) => faixaDe(c.dias) === f.valor).length
    }))),
    // sucata e um recorte de uma opcao, entao vem em par com "restante" pra
    // passar pela regra das duas opcoes e continuar sendo um filtro util
    grupoFiltro('Situação', 'sucata', [
      { valor: 'nao', rotulo: 'Venda normal', total: carros.filter((c) => !c.sucata).length },
      { valor: 'sim', rotulo: 'Venda inviável (sucata)', total: carros.filter((c) => c.sucata).length }
    ])
  ].filter(Boolean).join('');

  const css = [
    ':root{--tinta:#172033;--tinta2:#5b6b84;--tinta3:#94a3b8;--borda:#dbe4f0;--borda2:#e9eff7;--fundo:#f6f8fb;--cartao:#fff;--acento:#2563eb;--acentoF:#1d4ed8;--acentoS:#eaf2ff;--escuro:#0f172a}',
    '*{box-sizing:border-box}',
    'body{margin:0;background:var(--fundo);color:var(--tinta);font:15px/1.6 Roboto,"Helvetica Neue",-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;-webkit-text-size-adjust:100%;-webkit-font-smoothing:antialiased}',
    '.envelope{max-width:1180px;margin:0 auto;padding:0 24px}',
    'body>.envelope{padding-bottom:64px}',

    '.capa{background:linear-gradient(135deg,#0f172a 0%,#172033 46%,#1e3a5f 100%);color:#fff;padding:44px 0 62px}',
    '.capaTopo{display:flex;align-items:flex-start;justify-content:space-between;gap:28px}',
    '.capaTexto{min-width:0}',
    '.capa .logo{flex:0 0 auto;width:150px;height:auto;margin-top:4px;opacity:.96}',
    '.capa .olho{margin:0 0 12px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#7fb0e8;font-weight:800}',
    '.capa h1{margin:0;font-size:38px;font-weight:800;letter-spacing:-.025em;line-height:1.08}',
    '.capa .sub{margin:14px 0 0;font-size:14.5px;color:#b9cbe0;max-width:760px;line-height:1.65}',
    '.capa .data{margin:20px 0 0;padding-top:18px;border-top:1px solid rgba(255,255,255,.16);font-size:13px;color:#7fb0e8;font-weight:700;letter-spacing:.06em;text-transform:uppercase;font-variant-numeric:tabular-nums;display:flex;align-items:center;gap:10px}',
    '.capa .versao{background:rgba(127,176,232,.16);border:1px solid rgba(127,176,232,.38);border-radius:999px;padding:2px 9px;font-size:11px;letter-spacing:.08em}',

    '.bns{display:grid;grid-template-columns:repeat(auto-fit,minmax(168px,1fr));gap:12px;margin:-34px 0 26px}',
    // tres colunas exatas no desktop, para os big numbers ocuparem a largura toda
    '@media(min-width:1000px){.bns{grid-template-columns:repeat(3,1fr)}}',
    '.bn{background:var(--cartao);border:1px solid var(--borda);border-radius:16px;padding:18px 20px;box-shadow:0 8px 26px rgba(15,23,42,.06)}',
    '.bn.destaque{border-color:#c7dbf7;background:linear-gradient(180deg,#fff 0%,var(--acentoS) 100%)}',
    '.bn span{display:block;font-size:10.5px;font-weight:800;letter-spacing:.11em;text-transform:uppercase;color:var(--tinta2)}',
    '.bn b{display:block;margin-top:9px;font-size:26px;font-weight:800;letter-spacing:-.03em;font-variant-numeric:tabular-nums;line-height:1.1}',
    '.bn em{display:block;margin-top:6px;font-size:11.5px;color:var(--tinta3);font-style:normal;line-height:1.45}',

    // faixa de regiao: e o "por regiao" que o Tuunelis pediu no topo
    '.regioes{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 22px}',
    '.reg{flex:1 1 150px;background:var(--cartao);border:1px solid var(--borda2);border-radius:14px;padding:12px 15px}',
    '.reg b{display:block;font-size:19px;font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:-.02em}',
    '.reg span{display:block;margin-top:2px;font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.09em;color:var(--tinta2)}',
    '.reg em{display:block;margin-top:4px;font-size:11px;color:var(--tinta3);font-style:normal;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',

    '.secao{background:var(--cartao);border:1px solid var(--borda);border-radius:20px;margin-bottom:16px;box-shadow:0 8px 26px rgba(15,23,42,.05)}',
    '.secao>summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:14px;padding:20px 24px}',
    '.secao>summary::-webkit-details-marker{display:none}',
    '.secao>summary .tit{flex:0 0 auto;font-size:17px;font-weight:800;letter-spacing:-.015em}',
    '.secao>summary .dica{flex:1;font-size:13px;font-weight:400;color:var(--tinta3)}',
    '.secao>summary .chev{flex:0 0 auto;color:var(--acento);transition:transform .18s;background:var(--acentoS);border-radius:999px;padding:5px;box-sizing:content-box}',
    '.secao[open]>summary .chev{transform:rotate(180deg)}',
    '.secao[open]>summary{border-bottom:1px solid var(--borda2)}',
    '.corpo{padding:22px 24px 26px}',
    '.rotuloSecao{margin:0 0 14px;font-size:11px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:var(--acento)}',
    '.intro{margin:0 0 16px;font-size:13.5px;color:var(--tinta2)}',

    // sem align-items:start de proposito: com stretch o cartao de modelos (que
    // ocupa as duas linhas) termina na mesma altura da pilha do lado, e a base
    // dos graficos fica alinhada (Caio, 21/08)
    '.graficos{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:14px}',
    // acima de 1000px o grid vira fixo de 3 colunas para o posicionamento
    // explicito valer; abaixo disso volta a fluir sozinho
    '@media(min-width:1000px){.graficos{grid-template-columns:repeat(3,1fr)}.graficos .g-alto{grid-column:1;grid-row:1/span 2}.graficos .g-meio{grid-column:2;grid-row:2}}',
    // min-width:0 aqui e no rotulo e obrigatorio: sem isso o min-content do texto
    // longo (nome de patio) estoura a coluna e a pagina ganha rolagem horizontal
    '.grafico{background:var(--cartao);border:1px solid var(--borda2);border-radius:16px;padding:18px 20px;min-width:0}',
    '.grafico h3{margin:0 0 15px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.11em;color:var(--tinta2)}',
    '.barras{list-style:none;margin:0;padding:0}',
    '.barras li+li{margin-top:11px}',
    '.rot{display:flex;justify-content:space-between;align-items:baseline;gap:12px;font-size:13px;margin-bottom:5px;min-width:0}',
    '.rot span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}',
    '.rot b{flex:0 0 auto;font-weight:700;font-variant-numeric:tabular-nums;color:var(--tinta2);font-size:11.5px}',
    '.trilha{background:#eef2f7;border-radius:999px;height:8px;overflow:hidden}',
    '.trilha i{display:block;height:100%;background:var(--acento);border-radius:999px}',
    '.resto{margin:14px 0 0;padding-top:12px;border-top:1px solid var(--borda2);font-size:11.5px;color:var(--tinta3)}',


    // filtros: botao, nao <select> — <select> nao abre na previa do WhatsApp
    '.filtros{margin:0 0 16px}',
    '.filtros input{font:inherit;font-size:14px;padding:11px 14px;border:1px solid var(--borda);border-radius:10px;background:var(--cartao);color:inherit;width:100%;margin-bottom:12px}',
    '.filtros input:focus{outline:none;border-color:var(--acento);box-shadow:0 0 0 3px var(--acentoS)}',
    '.grupoFiltro+.grupoFiltro{margin-top:10px}',
    '.rotFiltro{margin:0 0 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.11em;color:var(--tinta3)}',
    '.chips{display:flex;flex-wrap:wrap;gap:6px}',
    '.chip{font:inherit;font-size:12.5px;font-weight:600;padding:7px 13px;border-radius:999px;border:1px solid var(--borda);background:var(--cartao);color:var(--tinta2);cursor:pointer;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;transition:border-color .15s,background .15s,color .15s}',
    '.chip b{font-size:10.5px;font-weight:800;color:var(--tinta3);font-variant-numeric:tabular-nums}',
    '.chip:hover{border-color:#9fb6d4;background:#f8fbff}',
    '.chip[aria-pressed="true"]{background:var(--acento);border-color:var(--acento);color:#fff}',
    '.chip[aria-pressed="true"] b{color:rgba(255,255,255,.72)}',
    '#limpar{display:none;margin-top:10px;font:inherit;font-size:12px;font-weight:700;color:var(--acento);background:none;border:0;padding:0;cursor:pointer;text-decoration:underline}',

    '#contador{color:var(--tinta2);font-size:12.5px;font-weight:600;margin:0 0 12px}',
    '.lista{border:1px solid var(--borda2);border-radius:16px;overflow:hidden}',
    '.carro{border-bottom:1px solid var(--borda2);padding:12px 16px}',
    '.carro.ultimo{border-bottom:0}',
    '.carro:hover{background:#fafcff}',
    '.topo{display:flex;align-items:center;gap:12px}',
    '.ident{flex:1;min-width:0}',
    '.linha1{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}',
    '.placa{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:13.5px;font-weight:700;letter-spacing:.06em;background:#f1f5fa;border-radius:5px;padding:2px 7px}',
    '.modelo{font-size:14.5px;font-weight:600}',
    '.linha2{color:var(--tinta2);font-size:12.5px;margin-top:4px;display:flex;gap:12px;flex-wrap:wrap}',
    '.local::before{content:"";display:inline-block;width:4px;height:4px;border-radius:50%;background:var(--tinta3);vertical-align:middle;margin-right:6px}',
    '.fipe b{color:var(--tinta);font-weight:700}',
    '.fipe.sem{color:var(--tinta3);font-style:italic}',
    '.inicial{color:#166534;font-weight:500}',
    '.inicial b{font-weight:800;font-variant-numeric:tabular-nums}',
    '.inicial i{font-style:normal;font-size:11px;color:#4d7c5a}',
    '.inicial i.acima{color:#b45309;font-weight:700}',
    '.badge{font-size:10.5px;font-weight:700;padding:3px 9px;border-radius:999px;white-space:nowrap;border:1px solid transparent;text-transform:uppercase;letter-spacing:.04em}',
    '.badge.ok{background:#e9f8ef;color:#166534;border-color:#c7ecd5}',
    '.badge.ruim{background:#fdeced;color:#991b1b;border-color:#f6cdd0}',
    '.badge.atencao{background:#fdf4e3;color:#92400e;border-color:#f5e0b8}',
    '.badge.novo{background:var(--acento);color:#fff;border-color:var(--acento)}',
    '.badge.sucata{background:#f1f5fa;color:#475569;border-color:#dbe4f0}',
    '.acoes{display:flex;gap:7px;align-items:center;flex:0 0 auto}',
    '.btn{font:inherit;font-size:12.5px;font-weight:600;padding:8px 15px;border-radius:999px;border:1px solid var(--borda);background:var(--cartao);color:var(--tinta);text-decoration:none;cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center;gap:6px;transition:border-color .18s,background .18s}',
    '.btn:hover{border-color:#9fb6d4;background:#f8fbff}',
    '.btn.primario{background:var(--acento);border-color:var(--acento);color:#fff;box-shadow:0 4px 14px rgba(37,99,235,.22)}',
    '.btn.primario:hover{background:var(--acentoF);border-color:var(--acentoF)}',
    '.btn.desativado{color:var(--tinta3);cursor:default;border-style:dashed}',
    '.btn.seta{padding:8px 10px;color:var(--tinta2)}',
    '.btn.seta svg{transition:transform .15s}',
    '.btn.seta[aria-expanded="true"] svg{transform:rotate(180deg)}',
    '.detalhes{border-top:1px dashed var(--borda);margin-top:12px;padding-top:12px;display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px 18px}',
    // sem esta regra o display:grid acima vence o atributo hidden e o painel nunca fecha
    '.detalhes[hidden]{display:none}',
    '.d{font-size:13px;font-weight:500}',
    '.d span{display:block;color:var(--tinta3);font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:1px}',
    '#vazio{display:none;text-align:center;color:var(--tinta2);padding:36px 0;font-size:14px}',
    'footer{margin-top:30px;padding-top:22px;border-top:1px solid var(--borda);color:var(--tinta3);font-size:11.5px;text-align:center;line-height:1.8}',
    '@media(max-width:640px){.envelope{padding:0 14px}body>.envelope{padding-bottom:48px}.capa{padding:30px 0 52px}.capa h1{font-size:26px}.capa .sub{font-size:13.5px}.corpo{padding:16px}.secao{border-radius:16px}.secao>summary{padding:16px 18px;gap:10px}.secao>summary .tit{font-size:15.5px}.secao>summary .dica{display:none}.graficos{grid-template-columns:1fr}.bns{grid-template-columns:repeat(auto-fit,minmax(144px,1fr));margin:-28px 0 20px}.bn{padding:15px 16px}.bn b{font-size:21px}.reg{flex:1 1 calc(50% - 4px)}.lista{border-radius:12px}.carro{padding:12px}.topo{flex-direction:column;align-items:stretch;gap:10px}.acoes{width:100%}.btn{flex:1;justify-content:center;padding:9px 10px;min-height:40px}.btn.seta{flex:0 0 auto;padding:9px 13px}.chip{font-size:12px;padding:8px 12px}}'
  ].join('\n');

  const js = [
    '(function(){',
    '  var busca=document.getElementById("busca");',
    '  var contador=document.getElementById("contador"),vazio=document.getElementById("vazio");',
    '  var limpar=document.getElementById("limpar");',
    '  var carros=[].slice.call(document.querySelectorAll(".carro"));',
    '  var ativo={uf:"",laudo:"",dias:"",sucata:""};',
    '  function filtrar(){',
    '    var t=busca?busca.value.trim().toLowerCase():"",visiveis=0,ultimo=null;',
    '    carros.forEach(function(c){',
    '      var ok=(!t||c.dataset.busca.indexOf(t)>-1)',
    '        &&(!ativo.uf||c.dataset.uf===ativo.uf)',
    '        &&(!ativo.laudo||c.dataset.laudo===ativo.laudo)',
    '        &&(!ativo.dias||c.dataset.dias===ativo.dias)',
    '        &&(!ativo.sucata||c.dataset.sucata===ativo.sucata);',
    '      c.style.display=ok?"":"none";c.classList.remove("ultimo");if(ok){visiveis++;ultimo=c;}',
    '    });',
    '    if(ultimo)ultimo.classList.add("ultimo");',
    '    contador.textContent=visiveis===carros.length?carros.length+" veiculos":visiveis+" de "+carros.length+" veiculos";',
    '    vazio.style.display=visiveis?"none":"block";',
    '    var algum=!!(t||ativo.uf||ativo.laudo||ativo.dias||ativo.sucata);',
    '    if(limpar)limpar.style.display=algum?"inline":"none";',
    '  }',
    '  if(busca){busca.addEventListener("input",filtrar);}',
    '  document.addEventListener("click",function(e){',
    '    var chip=e.target.closest?e.target.closest(".chip"):null;',
    '    if(chip){',
    '      var g=chip.getAttribute("data-grupo"),v=chip.getAttribute("data-valor");',
    // clicar no chip que ja esta ligado desliga — nao ha "todos" pra clicar
    '      ativo[g]=(ativo[g]===v)?"":v;',
    '      [].slice.call(document.querySelectorAll(\'.chip[data-grupo="\'+g+\'"]\')).forEach(function(o){',
    '        o.setAttribute("aria-pressed",String(o.getAttribute("data-valor")===ativo[g]));',
    '      });',
    '      filtrar();return;',
    '    }',
    '    if(e.target.id==="limpar"){',
    '      ativo={uf:"",laudo:"",dias:"",sucata:""};if(busca)busca.value="";',
    '      [].slice.call(document.querySelectorAll(".chip")).forEach(function(o){o.setAttribute("aria-pressed","false");});',
    '      filtrar();return;',
    '    }',
    '    var b=e.target.closest?e.target.closest(".btn.seta"):null;if(!b)return;',
    '    var p=document.getElementById(b.getAttribute("aria-controls"));',
    '    var aberto=!p.hidden;p.hidden=aberto;b.setAttribute("aria-expanded",String(!aberto));',
    '  });',
    '  filtrar();',
    '})();'
  ].join('\n');

  // Exatamente 3 big numbers (Caio, 21/08): total, UFs e modelos. "Marcas" saiu
  // nesta rodada; preco total do lote, valor de referencia e preco medio sairam
  // por ordem do Tuunelis; o % de laudo saiu porque a coluna nao chega 100%
  // populada ("so pode colocar isso se estiver 100% populado").
  const bigNumbers = [
    bigNumber('veículos na lista', String(carros.length),
      novidade.mostrarNovo ? novosNaLista + ' novos nesta remessa' : null),
    bigNumber('UFs de origem', String(ufs.length), semUf ? semUf + ' sem UF informada' : null),
    bigNumber('modelos diferentes', String(modelos.size))
  ].join('');

  // "colocar por regiao" (Tuunelis) — fica fora do bloco recolhivel, no topo
  const porRegiao = agregar(carros, 'regiao', 'Sem regiao').map((r) => {
    const ufsDaRegiao = [...new Set(carros.filter((c) => c.regiao === r.rotulo)
      .map((c) => c.uf).filter(Boolean))].sort();
    return '<div class="reg"><b>' + r.quantidade + '</b><span>' + escapar(r.rotulo) + '</span>'
      + '<em>' + escapar(ufsDaRegiao.join(' · ')) + '</em></div>';
  }).join('');

  const condicoes = agregar(carros, (c) => (c.badge ? c.badge.rotuloLongo : SEM_RESULTADO), SEM_RESULTADO);

  // A secao de fabricante saiu inteira por ordem do Tuunelis ("aqui nao faz
  // muito sentido nao... tira todo essa secao"). A contagem de marcas virou
  // big number, entao a deteccao de fabricante continua sendo usada.
  // Posicionamento pedido pelo Caio (21/08): modelos com 15 itens ocupando a
  // coluna da esquerda inteira (duas linhas), e condicao na coluna do meio da
  // segunda linha — onde ficava o "Valor inicial x FIPE", que saiu.
  const visoes = [
    grafico('Concentração dos modelos', agregar(carros, 'modelo', 'Modelo nao informado'), { limite: 15, unidade: 'modelos', classe: 'g-alto' }),
    grafico('Distribuição por UF (origem)', agregar(carros, 'uf', 'Sem UF'), { limite: 10, unidade: 'estados' }),
    grafico('Distribuição por pátio', agregar(carros, 'patio', 'Patio nao informado'), { limite: 10, unidade: 'pátios' }),
    grafico('Distribuição por condição', condicoes, { cores: CORES_CONDICAO, unidade: 'condições', classe: 'g-meio' })
  ];
  const graficos = visoes.join('\n');

  const seta = '<svg class="chev" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">'
    + '<path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  return [
    '<!doctype html>',
    '<html lang="pt-BR">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<title>Estoque ativo LM ' + escapar(rotuloTipo) + ' ' + VERSAO_TEMPLATE + ' — ' + escapar(dataTitulo) + '</title>',
    '<style>' + css + '</style>',
    '</head>',
    '<body>',
    '<header class="capa">',
    '  <div class="envelope">',
    '    <div class="capaTopo">',
    '      <div class="capaTexto">',
    '        <p class="olho">Cars2You · Grupo Auto2You</p>',
    '        <h1>Veículos Disponíveis · ' + escapar(rotuloTipo) + '</h1>',
    '        <p class="sub">Oferta de lote — estoque ativo LM · veículos com laudo de vistoria disponível, '
      + 'retirada nos pátios de origem' + (resumoTipos ? ' · ' + escapar(resumoTipos) : '') + '</p>',
    '      </div>',
    (logo ? '      <img class="logo" src="' + logo + '" alt="Cars2You" width="225" height="42">' : ''),
    '    </div>',
    '    <p class="data">' + escapar(dataTitulo) + '<span class="versao">' + VERSAO_TEMPLATE + '</span></p>',
    '  </div>',
    '</header>',
    '<div class="envelope">',

    '<div class="bns">' + bigNumbers + '</div>',
    '<div class="regioes">' + porRegiao + '</div>',

    '<details class="secao" open>',
    '  <summary><span class="tit">Dados e analytics</span>'
      + '<span class="dica">composição da carteira em ' + visoes.length + ' visões</span>' + seta + '</summary>',
    '  <div class="corpo">',
    '    <p class="rotuloSecao">Composição da carteira</p>',
    '    <div class="graficos">' + graficos + '</div>',
    '  </div>',
    '</details>',

    '<details class="secao" open>',
    '  <summary><span class="tit">Lista de veículos</span>'
      + '<span class="dica">' + carros.length + ' veículos, com laudo e proposta</span>' + seta + '</summary>',
    '  <div class="corpo">',
    // quando o botao leva para a plataforma, o lojista precisa saber que vai
    // logar — surpresa no clique derruba proposta
    '    <p class="intro">Clique na seta de cada linha para ver mais dados, em <b>Ver laudo</b> para abrir o laudo cautelar e em <b>Enviar proposta</b> para '
      + (carros.some((c) => c.linkAnuncio)
        ? 'dar seu lance na plataforma. No primeiro carro o sistema pede seu login; dos seguintes em diante ele abre direto.'
        : 'mandar sua oferta.') + '</p>',
    '    <div class="filtros">',
    '      <input id="busca" type="search" placeholder="Buscar por placa, modelo ou cidade" aria-label="Buscar veiculo">',
    filtros,
    '      <button type="button" id="limpar">limpar filtros</button>',
    '    </div>',
    '    <p id="contador"></p>',
    '    <div class="lista">',
    carros.map((c, i) => montarLinha(c, i, etiquetaLista, novidade)).join('\n'),
    '    </div>',
    '    <p id="vazio">Nenhum veiculo encontrado com esse filtro.</p>',
    '  </div>',
    '</details>',

    '<footer>',
    '  Cars2You' + (semPreco ? ' · ' + semPreco + ' veículo(s) sem valor FIPE na origem' : ''),
    '  <br>Valores de referência FIPE, sujeitos a confirmação. Disponibilidade sujeita a alteração.',
    '</footer>',
    '</div>',
    '<script>' + js + '</script>',
    '</body>',
    '</html>'
  ].join('\n');
}

// ---------------------------------------------------------------- execucao ---

// Nunca sobrescreve um arquivo existente: a segunda geracao da MESMA remessa
// sai como _r2, a terceira como _r3, e assim por diante. Cada uma fica no disco
// porque a lista pode ter sido disparada antes do ajuste.
// O _r conta rodadas de geracao; a versao do template e o VERSAO_TEMPLATE.
function proximoArquivo(pasta, base, extensao) {
  const primeiro = path.join(pasta, base + extensao);
  if (!fs.existsSync(primeiro)) return primeiro;
  for (let rodada = 2; rodada <= 99; rodada++) {
    const candidato = path.join(pasta, base + '_r' + rodada + extensao);
    if (!fs.existsSync(candidato)) return candidato;
  }
  console.error('ja existem 99 rodadas de ' + base + ' em ' + pasta + ' — limpar antes de gerar de novo.');
  process.exit(1);
}

/*
 * Auditoria final: o chassi de nenhum carro pode aparecer no HTML entregue.
 * A conferencia e feita contra os valores reais da planilha (nao contra um
 * padrao de VIN) pra nao dar falso positivo nos tokens dos links de laudo.
 */
function auditarProibidos(html, linhas) {
  for (const campo of PROIBIDOS) {
    for (const l of linhas) {
      const valor = limpo(l[campo]);
      if (valor.length >= 8 && html.includes(valor)) {
        console.error('ABORTADO: o campo proibido "' + campo + '" vazou no HTML (valor ' + valor + ').');
        console.error('Ver REGRAS DURAS no topo de gerar-lista-lm.js — chassi nunca sai no arquivo.');
        process.exit(1);
      }
    }
  }
}

function main() {
  const args = process.argv.slice(2);
  const flags = args.filter((a) => a.startsWith('--'));
  const posicionais = args.filter((a) => !a.startsWith('--'));
  const entrada = posicionais[0];
  if (!entrada) {
    console.error('uso: node gerar-lista-lm.js "<planilha.xlsx>" [pasta de saida] [--tipo=leve] [--data=DD/MM/AAAA]');
    console.error('     [--cruzamento="<excel do fluxo>.xlsx"]  botao vai pro anuncio na plataforma');
    console.error('     [--incluir-sem-anuncio]                 mantem na lista quem nao tem anuncio');
    process.exit(1);
  }
  const saida = posicionais[1] || process.cwd();
  const tipoPedido = (flags.find((f) => f.startsWith('--tipo=')) || '').split('=')[1] || '';

  const { linhas, naoUsadas, ausentesDesejaveis } = lerPlanilha(entrada);
  const { carros, linksConsertados, statusDoLaudo, vmvHerdados } = normalizar(linhas);
  if (!carros.length) {
    console.error('nenhum veiculo encontrado na planilha');
    process.exit(1);
  }

  /*
   * A data do arquivo e a data do DISPARO, nao a da remessa (Caio, 21/08:
   * "ajustei as datas para o dia de hoje"). Motivo: a planilha chega com o nome
   * de um dia e a lista sai no outro, e o lojista tem que ver a data em que
   * recebeu — o nome do arquivo da LM nao e mais consultado.
   * Para gerar com outra data: --data=DD/MM/AAAA
   */
  const pedida = (flags.find((f) => f.startsWith('--data=')) || '').split('=')[1] || '';
  const partes = pedida ? pedida.split('/') : [];
  const casaData = partes.length === 3
    && /^[0-9]{2}$/.test(partes[0])
    && /^[0-9]{2}$/.test(partes[1])
    && /^[0-9]{4}$/.test(partes[2]);
  if (pedida && !casaData) {
    console.error('--data tem que ser DD/MM/AAAA — recebi "' + pedida + '"');
    process.exit(1);
  }
  const hoje = new Date();
  const dia = casaData ? partes[0] : String(hoje.getDate()).padStart(2, '0');
  const mes = casaData ? partes[1] : String(hoje.getMonth() + 1).padStart(2, '0');
  const ano = casaData ? partes[2] : String(hoje.getFullYear());

  const etiquetaLista = dia + '-' + mes + '-' + ano;
  const dataTitulo = dia + '/' + mes + '/' + ano;
  const dataRemessa = ano + '-' + mes + '-' + dia;

  // ---- avisos sobre a planilha (nunca silenciosos)
  console.log('planilha: ' + path.basename(entrada) + ' — ' + carros.length + ' veiculos');
  console.log('data da lista: ' + dataTitulo + (casaData ? '  (informada em --data)' : '  (hoje)'));
  if (naoUsadas.length) console.log('colunas ignoradas: ' + naoUsadas.join(' | '));
  if (linksConsertados) {
    console.log('ATENCAO: ' + linksConsertados + ' link(s) de laudo vinham corrompidos (ponto virou virgula) e foram consertados.');
    console.log('  a corrupcao esta na exportacao da LM — pedir correcao na origem.');
  }
  if (statusDoLaudo) {
    console.log('status de laudo preenchido a partir do proprio laudo: ' + statusDoLaudo + ' veiculo(s)');
  }
  if (ausentesDesejaveis && ausentesDesejaveis.length) {
    console.log('ATENCAO: a remessa nao trouxe ' + ausentesDesejaveis.join(', ') + '.');
    console.log('  ' + vmvHerdados + ' veiculo(s) ficaram com o preco herdado da remessa anterior;');
    console.log('  ' + (carros.length - vmvHerdados) + ' sem preco. Confirmar com a LM se a coluna volta.');
  }
  const plataformas = [...new Set(carros.map((c) => c.plataforma).filter(Boolean))];
  const foraDeVenda = carros.filter((c) => c.plataforma && !/dispon/i.test(c.plataforma));
  if (foraDeVenda.length) {
    console.log('ATENCAO: ' + foraDeVenda.length + ' veiculo(s) com Plataforma diferente de "Disponivel pra venda": '
      + plataformas.join(' | ') + ' — conferir se devem entrar na lista.');
  }

  // ---- estado entre remessas (uma vez por rodada, antes de dividir por tipo)
  const movimento = aplicarEstado(carros, dataRemessa);
  console.log('movimento: ' + movimento.novos + ' novos, ' + movimento.permanecem
    + ' permanecem, ' + movimento.sairam + ' sairam desde a remessa anterior'
    + (movimento.primeiraRodada ? '  (primeira rodada — nao ha remessa anterior pra comparar)' : ''));
  if (movimento.quedas.length) {
    console.log('  ' + movimento.quedas.length + ' veiculo(s) com queda de valor inicial desde a ultima remessa');
  }

  /*
   * ---- cruzamento com a plataforma (opcional, mas e o modo novo)
   *
   * Com --cruzamento o botao "Enviar proposta" passa a apontar para o anuncio na
   * plataforma, e por padrao SO entra na lista quem esta no ar. Foi a decisao da
   * reuniao de 25/08: lista e plataforma tem que casar, senao o lojista clica num
   * carro que nao existe no sistema e a proposta cai fora do registro.
   *
   * Sem a flag, o comportamento e o antigo (botao no formulario do n8n).
   */
  let selecao = carros;
  const arqCruzamento = (flags.find((f) => f.startsWith('--cruzamento=')) || '').split('=').slice(1).join('=');
  const incluirSemAnuncio = flags.includes('--incluir-sem-anuncio');

  if (arqCruzamento) {
    if (!fs.existsSync(arqCruzamento)) {
      console.error('arquivo de cruzamento nao encontrado: ' + arqCruzamento);
      process.exit(1);
    }
    const cruz = aplicarCruzamento(carros, arqCruzamento);
    console.log('cruzamento: ' + path.basename(arqCruzamento) + ' — ' + cruz.linhas
      + ' placas no arquivo, ' + cruz.casados + ' casadas com a planilha'
      + (cruz.semRegistro ? ', ' + cruz.semRegistro + ' sem registro no cruzamento' : ''));

    /*
     * Ter link NAO e o mesmo que poder receber proposta. Um carro em analise do
     * comprador tem anuncio, mas esta travado numa negociacao; um que voltou
     * para "Sobra" tem o link do evento passado, ja encerrado. Nos dois casos o
     * lojista clicaria e cairia num anuncio que nao aceita lance.
     *
     * Entra na lista so quem esta NO AR — situacao PUBLISHED, anuncio ATIVO.
     */
    const podeReceber = (c) => c.cruzamento === 'No ar' && !!c.linkAnuncio;
    const temSituacao = carros.some((c) => c.cruzamento);
    if (!temSituacao) {
      console.log('  ATENCAO: o arquivo de cruzamento nao tem a coluna "Situacao".');
      console.log('  Sem ela nao da para saber quem esta no ar; o corte cai so no link do anuncio.');
    }

    const aptos = carros.filter((c) => temSituacao ? podeReceber(c) : !!c.linkAnuncio);
    const fora = carros.filter((c) => !(temSituacao ? podeReceber(c) : !!c.linkAnuncio));
    console.log('  ' + aptos.length + ' aptos a receber proposta, ' + fora.length + ' fora');

    // por que cada um ficou de fora — corte silencioso aqui viraria lista curta
    // sem ninguem entender o motivo
    if (fora.length) {
      const motivos = new Map();
      for (const c of fora) {
        const m = c.cruzamento
          ? (c.linkAnuncio ? c.cruzamento : c.cruzamento + ' (sem link)')
          : 'sem registro no cruzamento';
        motivos.set(m, (motivos.get(m) || 0) + 1);
      }
      const detalhe = [...motivos.entries()].sort((a, b) => b[1] - a[1])
        .map(([m, n]) => n + ' ' + m.toLowerCase()).join(' · ');
      console.log('  fora por: ' + detalhe);
    }

    if (!incluirSemAnuncio) {
      selecao = aptos;
      if (fora.length) {
        console.log('  ' + fora.length + ' veiculo(s) ficaram FORA da lista por nao estarem no ar.');
        console.log('  para incluir mesmo assim (botao cai no formulario): --incluir-sem-anuncio');
      }
    } else {
      console.log('  --incluir-sem-anuncio: os que nao estao no ar entram e o botao cai no formulario.');
      // quem nao esta no ar nao pode levar link de anuncio encerrado
      for (const c of fora) c.linkAnuncio = '';
    }

    if (!selecao.length) {
      console.error('nenhum veiculo com anuncio no ar — nada a gerar.');
      console.error('provavel causa: o time de montagem ainda nao subiu os carros desta remessa.');
      process.exit(1);
    }
  }

  // ---- um arquivo por classificacao (leves e pesados separados)
  const grupos = new Map();
  for (const c of selecao) {
    const rotulo = c.classificacao || 'Sem classificacao';
    if (!grupos.has(rotulo)) grupos.set(rotulo, []);
    grupos.get(rotulo).push(c);
  }
  const resumoTipos = [...grupos.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([r, l]) => l.length + ' ' + r.toLowerCase() + (l.length > 1 ? 's' : ''))
    .join(' · ');

  const selecionados = [...grupos.entries()].filter(([rotulo]) =>
    !tipoPedido || slug(rotulo) === slug(tipoPedido));
  if (!selecionados.length) {
    console.error('nenhum veiculo com Classif. = "' + tipoPedido + '". Valores na planilha: '
      + [...grupos.keys()].join(' | '));
    process.exit(1);
  }

  for (const [rotulo, lista] of selecionados) {
    const html = montarHtml(lista, {
      etiquetaLista,
      dataTitulo,
      rotuloTipo: titulo(rotulo) + (lista.length > 1 ? 's' : ''),
      resumoTipos,
      movimento
    });
    auditarProibidos(html, linhas);
    const arquivo = proximoArquivo(saida,
      'lista_estoque_LM_' + slug(rotulo) + 's_' + VERSAO_TEMPLATE + '_' + dia + mes + ano, '.html');
    fs.writeFileSync(arquivo, html, 'utf8');

    const semFipe = lista.filter((c) => !c.fipe).length;
    const semLaudo = lista.filter((c) => !c.laudo).length;
    const semBadge = lista.filter((c) => !c.badge).length;
    const semMarca = lista.filter((c) => c.fabricante === 'Nao identificado').length;
    const comInicial = lista.filter((c) => c.valorInicial > 0);
    const acimaFipe = lista.filter((c) => c.fipe && c.valorInicial > c.fipe).length;
    const sucata = lista.filter((c) => c.sucata).length;

    console.log('');
    console.log('== ' + rotulo + ' — ' + lista.length + ' veiculos');
    console.log('arquivo: ' + arquivo);
    console.log('valor inicial (coluna VMV): ' + comInicial.length + ' de ' + lista.length
      + (acimaFipe ? '  | ' + acimaFipe + ' acima da FIPE' : ''));
    if (comInicial.length) {
      const somaIni = comInicial.reduce((s, c) => s + c.valorInicial, 0);
      const somaFipeIni = comInicial.filter((c) => c.fipe).reduce((s, c) => s + c.fipe, 0);
      if (somaFipeIni) {
        console.log('  desconto medio ponderado sobre a FIPE: '
          + ((1 - somaIni / somaFipeIni) * 100).toFixed(1) + '%');
      }
    }
    console.log('sem valor FIPE: ' + semFipe + ' | sem link de laudo: ' + semLaudo
      + ' | sem status de laudo: ' + semBadge + ' | marca nao identificada: ' + semMarca);
    console.log('sucata (Venda Inviavel): ' + sucata
      + ' | novos nesta remessa: ' + lista.filter((c) => c.novo).length);
    console.log('estados: ' + [...new Set(lista.map((c) => c.uf).filter(Boolean))].sort().join(', '));
  }
}

main();
