/*
 * Extrai do gerar-lista-lm.js o nucleo PURO (sem fs, sem unzip, sem process) e
 * escreve o jsCode do Code node que monta a lista dentro do n8n.
 *
 * Extrai por REMOCAO, nao por selecao: remover as pecas de entrada e saida e
 * mais seguro do que escolher faixas de linha, que quebram a cada edicao do
 * gerador. Se aparecer funcao nova pura, ela vem junto automaticamente.
 */
const fs = require('fs');
const path = require('path');

const RAIZ = 'C:/Users/CaioLedesma/work-brain/automations';
const fonte = fs.readFileSync(path.join(RAIZ, 'scripts', 'gerar-lista-lm.js'), 'utf8');
const lib = fs.readFileSync(path.join(RAIZ, 'scripts', 'lib-planilha-lm.js'), 'utf8');
const logo = fs.readFileSync(path.join(RAIZ, 'assets', 'logo-c2y-branco.png')).toString('base64');

// tudo que toca disco, processo ou a planilha crua sai
const FORA = [
  'lerStatusColhido', 'logoEmbutido', 'normalizar', 'lerEstado', 'aplicarEstado',
  'salvarEstado', 'aplicarCruzamento', 'proximoArquivo', 'main'
];

const linhas = fonte.split('\n');

// acha o bloco de uma declaracao de topo: da linha do `function X(`/`const X =`
// ate a linha anterior a proxima declaracao de topo
function bloco(nome) {
  const inicio = linhas.findIndex((l) =>
    l.startsWith('function ' + nome + '(') || l.startsWith('const ' + nome + ' ='));
  if (inicio === -1) return null;
  let fim = linhas.length;
  for (let i = inicio + 1; i < linhas.length; i++) {
    if (/^(function |const |\/\*|\/\/ ---)/.test(linhas[i])) { fim = i; break; }
  }
  // recua sobre comentario que pertence ao proximo bloco
  while (fim > inicio && /^\s*(\/\/|\*|\/\*)/.test(linhas[fim - 1])) fim--;
  return { inicio, fim };
}

const remover = new Set();
for (const nome of FORA) {
  const b = bloco(nome);
  if (!b) { console.log('  (nao achei ' + nome + ')'); continue; }
  for (let i = b.inicio; i < b.fim; i++) remover.add(i);
}

// o require da lib e as constantes de caminho tambem saem
linhas.forEach((l, i) => {
  if (l.startsWith('#!')) remover.add(i);
  if (/^const (fs|path) = require/.test(l)) remover.add(i);
  if (/^} = require\('\.\/lib-planilha-lm'\);/.test(l)) remover.add(i);
  if (/^const \{$/.test(l) && /lerPlanilha/.test(linhas[i + 1] || '')) { remover.add(i); remover.add(i + 1); }
  if (/^const ARQUIVO_(ESTADO|STATUS_LAUDO) =/.test(l)) remover.add(i);
  if (/^main\(\);?$/.test(l)) remover.add(i);
});

const corpo = linhas.filter((_, i) => !remover.has(i)).join('\n');

// as tres funcoes da lib que o nucleo usa entram inline
const pegarDaLib = (nome) => {
  const ls = lib.split('\n');
  const ini = ls.findIndex((l) => l.startsWith('function ' + nome + '(') || l.startsWith('const ' + nome + ' ='));
  if (ini === -1) throw new Error('nao achei ' + nome + ' na lib');
  let fim = ls.length;
  for (let i = ini + 1; i < ls.length; i++) {
    if (/^(function |const |\/\*|\/\/ ---)/.test(ls[i])) { fim = i; break; }
  }
  return ls.slice(ini, fim).join('\n').trimEnd();
};

const cabeca = `// ===================== Lista LM (HTML) — nucleo do gerador =====================
// Gerado a partir de automations/scripts/gerar-lista-lm.js por extrair-nucleo.js.
// NAO EDITAR AQUI: editar o gerador local e reextrair, senao as duas versoes do
// HTML divergem e ninguem descobre qual esta certa.
//
// O que mudou em relacao ao gerador local:
//   - entrada e a Data Table Estoque LM, nao o .xlsx (some o unzip e o fs);
//   - dias na lista, remessas e VMV anterior vem da tabela, nao do arquivo de
//     estado (a tabela ja e a memoria entre remessas);
//   - o logo vai embutido em base64, porque nao ha disco para ler.

const VAZIOS = new Set(['', 'N/D', 'ND', '#N/A', '#N/D', 'NULL', '-']);
const PROIBIDOS = ['chassi'];
const LOGO_BASE64 = 'data:image/png;base64,${logo}';
function logoEmbutido() { return LOGO_BASE64; }

${pegarDaLib('semAcento')}
${pegarDaLib('limpo')}
`;

const adaptador = `
// ---------------------------------------------------------------- adaptador ---
/*
 * Converte as linhas da Data Table Estoque LM nos objetos que o montarHtml
 * espera. E o unico ponto que conhece o formato da tabela — o resto do nucleo
 * e igual ao gerador local.
 *
 * Nada de calcular dias ou remessas aqui: a tabela ja guarda isso, gravado pelo
 * fluxo do estoque. Recalcular abriria a porta para dois numeros diferentes
 * para a mesma coisa.
 */
function carrosDaTabela(linhas) {
  return linhas.map(function (t) {
    const fipe = Number(t.Valor_FIPE) || 0;
    const vmv = Number(t.VMV) || 0;
    const km = Number(t.KM) || 0;
    const status = limpo(t.Status_Laudo).toUpperCase();
    const anterior = Number(t.VMV_Anterior) || 0;
    return {
      statusOrigem: limpo(t.Status_Laudo_Origem),
      statusFornecedor: limpo(t.Vistoriadora),
      fabricante: fabricanteDe(t.Modelo),
      valorInicial: vmv,
      percentualAplicado: null,
      vmvOrigem: limpo(t.VMV_Origem),
      placa: limpo(t.Placa).toUpperCase(),
      modelo: limparModelo(t.Modelo) || 'Modelo nao informado',
      ano: normalizarAno(t.Ano_Modelo, t.Modelo),
      km: km > 0 ? km : null,
      cor: titulo(t.Cor),
      classificacao: limpo(t.Classificacao),
      codigoFipe: limpo(t.Cod_Fipe),
      fipe: fipe,
      cidade: titulo(t.Cidade),
      uf: limpo(t.UF).toUpperCase(),
      regiao: UF_REGIAO[limpo(t.UF).toUpperCase()] || 'Sem regiao',
      patio: titulo(t.Patio),
      endereco: limpo(t.Endereco),
      curva: limpo(t.Curva),
      sucata: /invi/i.test(limpo(t.Curva)),
      badge: BADGES[status] || null,
      chave: normalizarChave(t.Chave),
      laudo: limpo(t.Link_Laudo),
      plataforma: limpo(t.Plataforma),
      dias: t.Dias_Na_Lista === null || t.Dias_Na_Lista === undefined ? null : Number(t.Dias_Na_Lista),
      // Nao usar o contador Remessas: ele foi subcontado pelas gravacoes
      // parciais antigas. Primeira aparicao igual a remessa atual e robusto.
      novo: limpo(t.Primeira_Vez) !== '' && limpo(t.Primeira_Vez) === limpo(t.Ultima_Vez),
      quedaVmv: (anterior > 0 && vmv > 0 && vmv < anterior) ? (anterior - vmv) : 0,
      linkAnuncio: limpo(t.Link_Anuncio),
      cruzamento: limpo(t.Cruzamento),
      evento: limpo(t.Evento)
    };
  }).filter(function (c) { return c.placa; });
}

// ------------------------------------------------------------------ entrada ---
const linhasTabela = $input.all().map(function (i) { return i.json; });
const cfg = $('Config da Lista').first().json;

const TIPO = limpo(cfg.tipo) || 'Leve';
const remessa = limpo(cfg.remessa);
const etiquetaLista = limpo(cfg.etiqueta);
const dataTitulo = limpo(cfg.data_titulo);

const ativos = linhasTabela.filter(function (t) { return t.Ativo === true; });

/*
 * Entra na lista so quem esta NO AR com link de anuncio. Ter anuncio nao e o
 * mesmo que poder receber proposta: em analise do comprador o carro esta preso
 * numa negociacao, e em sobra o link aponta para o evento ja encerrado.
 */
const doTipo = ativos.filter(function (t) {
  return limpo(t.Classificacao).toUpperCase() === TIPO.toUpperCase();
});
const aptos = doTipo.filter(function (t) {
  return limpo(t.Cruzamento) === 'No ar' && limpo(t.Link_Anuncio);
});
const fora = doTipo.filter(function (t) {
  return !(limpo(t.Cruzamento) === 'No ar' && limpo(t.Link_Anuncio));
});

const motivos = {};
for (const t of fora) {
  const m = limpo(t.Cruzamento) || 'sem cruzamento';
  const k = limpo(t.Link_Anuncio) ? m : m + ' (sem link)';
  motivos[k] = (motivos[k] || 0) + 1;
}

if (!aptos.length) {
  throw new Error('Nenhum ' + TIPO + ' no ar com link de anuncio. '
    + 'Provavel causa: o evento do dia ainda nao foi montado, ou ja encerrou. '
    + 'Situacao dos ' + doTipo.length + ' ' + TIPO + ' ativos: ' + JSON.stringify(motivos));
}

const carros = carrosDaTabela(aptos);

// resumo do estoque ativo por tipo, para o cabecalho dizer de onde a lista saiu
const porTipo = {};
for (const t of ativos) { const k = limpo(t.Classificacao) || 'Sem classificacao'; porTipo[k] = (porTipo[k] || 0) + 1; }
const resumoTipos = Object.keys(porTipo)
  .sort(function (a, b) { return porTipo[b] - porTipo[a]; })
  .map(function (k) { return porTipo[k] + ' ' + k.toLowerCase() + (porTipo[k] > 1 ? 's' : ''); })
  .join(' · ');

/*
 * Aviso de janela. O estoque no ar muda ao longo do dia: pela manha o evento
 * esta montado e quase tudo esta publicado; depois que ele encerra, os carros
 * voltam para sobra ou entram em analise. Uma lista com fracao pequena do
 * estoque quase sempre significa que rodou fora da janela.
 *
 * Avisa, nao trava: em dia de pouco volume a lista curta e legitima, e travar
 * deixaria a operacao sem lista sem ninguem entender por que.
 */
const fatia = doTipo.length ? Math.round((aptos.length / doTipo.length) * 100) : 0;
const alerta = fatia < 50
  ? 'Só ' + fatia + '% dos ' + TIPO.toLowerCase() + 's ativos estão no ar ('
    + aptos.length + ' de ' + doTipo.length + '). Conferir se o evento do dia já foi montado.'
  : '';

/*
 * O montarHtml le exatamente { etiquetaLista, dataTitulo, rotuloTipo,
 * resumoTipos, movimento }. Passar nome diferente nao da erro — chega como
 * undefined e a peca simplesmente nao aparece. Foi o que fez o selo "novo
 * hoje" desaparecer: sem 'movimento' o mostrarNovo era sempre falso.
 */
const html = montarHtml(carros, {
  etiquetaLista: etiquetaLista,
  dataTitulo: dataTitulo,
  rotuloTipo: TIPO,
  resumoTipos: resumoTipos,
  movimento: { primeiraRodada: false }
});

// REGRA DURA: chassi nunca sai no arquivo. A tabela nao guarda chassi, mas a
// checagem fica como rede — se alguem adicionar a coluna, a lista para de sair.
for (const t of aptos) {
  const c = limpo(t.Chassi);
  if (c && c.length >= 8 && html.indexOf(c) > -1) {
    throw new Error('ABORTADO: chassi vazou no HTML (' + c + ').');
  }
}

const nomeArquivo = 'lista_estoque_LM_' + TIPO.toLowerCase() + 's_'
  + etiquetaLista.replace(/-/g, '') + '.html';

console.log('lista ' + TIPO + ': ' + aptos.length + ' no ar de ' + doTipo.length
  + ' ativos (' + fatia + '%) | fora: ' + JSON.stringify(motivos));

return [{ json: {
  arquivo: nomeArquivo,
  html: html,
  tipo: TIPO,
  no_ar: aptos.length,
  ativos_do_tipo: doTipo.length,
  fatia: fatia,
  alerta: alerta,
  motivos_fora: motivos,
  remessa: remessa,
  data_titulo: dataTitulo
} }];
`;

const jsCode = cabeca + corpo.replace(/process\.exit\(1\);/g, "throw new Error('abortado');") + adaptador;
const destino = path.join(__dirname, 'nucleo-lista-lm.js');
fs.writeFileSync(destino, jsCode, 'utf8');

const crypto = require('crypto');
console.log('escrito: ' + destino);
console.log('tamanho: ' + jsCode.length + ' chars (' + Math.round(jsCode.length / 1024) + ' KB)');
console.log('sha256 : ' + crypto.createHash('sha256').update(jsCode).digest('hex'));
console.log('ainda tem fs/path/require? ' +
  (/\b(fs|path)\.\w|require\(/.test(jsCode) ? 'SIM — revisar' : 'nao'));
console.log('ainda tem process.exit? ' + (/process\.exit/.test(jsCode) ? 'SIM — revisar' : 'nao'));
