/* ============================================================================
   Prova dos modelos de painel.

       node design/_prova_modelos.js

   `node --check` NÃO valida JS de navegador — ele só olha sintaxe, e o erro
   que derruba um painel é `querySelector` devolvendo null. Aqui o script
   embutido roda de verdade contra um DOM de mentira.

   E a prova confere se o arquivo é NOVO. Já aconteceu neste repo: o gerador
   falhou, o HTML anterior continuou em disco, e a prova validou o arquivo
   errado com nota máxima (sessão 18/09).
   ========================================================================== */

const fs = require('fs');
const path = require('path');

const AQUI = __dirname;
const MOD = path.join(AQUI, 'modelos');

let erros = 0, testes = 0;
const ok = (cond, msg) => {
  testes++;
  if (cond) { console.log('  ✓ ' + msg); }
  else { console.log('  ✗ ' + msg); erros++; }
};

/* ---------------------------------------------------------------------------
   0. Frescor — o arquivo é mais novo que tudo que o gera?
   ------------------------------------------------------------------------- */
console.log('\n■ Frescor');
const FONTES = [
  path.join(MOD, '_fonte', 'dashboard.html'),
  path.join(AQUI, 'tokens', 'tema.css'),
  path.join(AQUI, 'marca', 'cars2you', 'logo-cars2you-preto.svg'),
  path.join(AQUI, 'marca', 'cars2you', 'logo-cars2you-branco.svg'),
  path.join(AQUI, 'marca', 'cars2you', 'logo-c2y-preto.svg'),
  path.join(AQUI, 'marca', 'cars2you', 'logo-c2y-branco.svg'),
];
const maisNova = Math.max(...FONTES.map(f => fs.statSync(f).mtimeMs));

for (const nome of ['dashboard-claro.html', 'dashboard-escuro.html']) {
  const p = path.join(MOD, nome);
  ok(fs.existsSync(p), nome + ' existe');
  ok(fs.statSync(p).mtimeMs >= maisNova,
     nome + ' é mais novo que a fonte (senão: o gerador falhou e sobrou o antigo)');
}

/* ---------------------------------------------------------------------------
   O KIT que vai para o time
   ---------------------------------------------------------------------------
   `kit-de-painel.md` é o arquivo único que sai daqui para quem NÃO tem este
   repositório. Ele carrega o tema inteiro dentro de si, e é por isso que
   precisa de prova: um kit velho não quebra nada aqui e nada lá — ele só
   ensina em silêncio um tema que já não existe.
   ------------------------------------------------------------------------- */
console.log('\n■ Kit do time');
const KIT = path.join(AQUI, 'kit-de-painel.md');
const MOLDE_KIT = path.join(AQUI, '_fonte-kit.md');
ok(fs.existsSync(KIT), 'kit-de-painel.md existe');

/* O kit carrega o tema E as quatro artes da marca, então o frescor tem que
   olhar as três coisas. Trocar um SVG e não regerar deixaria o time montando
   painel com a marca antiga — e nada nesta pasta quebraria. */
const KIT_ARTES = require('./monta-kit.js').ARTES;
const maisNovaKit = Math.max(
  fs.statSync(path.join(AQUI, 'tokens', 'tema.css')).mtimeMs,
  fs.statSync(MOLDE_KIT).mtimeMs,
  ...KIT_ARTES.map(([, , arq]) =>
    fs.statSync(path.join(AQUI, 'marca', 'cars2you', arq)).mtimeMs));
ok(fs.statSync(KIT).mtimeMs >= maisNovaKit,
   'o kit é mais novo que o tema, o molde e as artes (senão: alguém mexeu e não regerou)');

/* As artes viajam dentro do kit, e é isso que o torna colável sem caçar
   arquivo. Comparar o base64 INTEIRO, não o nome: a cor mora dentro do SVG. */
const kitTxt = fs.readFileSync(KIT, 'utf8');
const uriArte = require('./monta-kit.js').uriArte;
for (const [tema, largura, arq] of KIT_ARTES) {
  ok(kitTxt.includes(uriArte(arq)),
     'o kit carrega ' + arq + ' (' + tema + ' / ' + largura + ')');
}
ok((kitTxt.match(/data:image\/svg\+xml;base64,/g) || []).length === KIT_ARTES.length,
   'e são exatamente ' + KIT_ARTES.length + ' artes, sem sobra nem falta');
ok(!kitTxt.includes('COLE_A_EXTENSA') && !kitTxt.includes('COLE_A_CURTA'),
   'nenhum marcador de "cole a sua logo aqui" sobrou');

const kit = fs.readFileSync(KIT, 'utf8');
const temaBruto = fs.readFileSync(path.join(AQUI, 'tokens', 'tema.css'), 'utf8');

/* O kit carrega o tema com UMA classe de mudança: os comentários que apontam
   para pastas deste repositório viram instrução que quem recebe consegue
   seguir. A tabela é a do `monta-kit.js` — reaplicá-la aqui e exigir
   igualdade é o que prova que NADA ALÉM dela divergiu. Sem isto, o kit podia
   carregar um tema editado à mão e a prova não veria. */
const TROCAS_KIT = require('./monta-kit.js').TROCAS;
const esperado = TROCAS_KIT.reduce((s, [de, por]) => s.split(de).join(por), temaBruto);
ok(kit.includes(esperado),
   'o kit carrega o tema.css inteiro, com apenas as trocas de caminho declaradas');
ok(!esperado.includes('design/'),
   'e nenhum caminho deste repositório sobrou no tema do kit');
ok(!kit.includes('_' + '_TEMA_CSS_' + '_'),
   'o marcador foi substituído (marcador vivo no alvo = geração pela metade)');

/* Autossuficiência: quem recebe o kit não tem este repositório, então
   caminho daqui de dentro é instrução que a pessoa não consegue seguir. */
const CAMINHOS = ['design/tokens', 'design/modelos', 'design/paletas',
                  'design/marca', 'design/_contraste.js', 'design/_prova_modelos.js',
                  'automations/'];
for (const c of CAMINHOS) {
  ok(!kit.includes(c),
     'o kit não manda ninguém abrir `' + c + '` — pasta que quem recebe não tem');
}

/* ---------------------------------------------------------------------------
   O laboratório fica CONTIDO no modelo de teste
   ---------------------------------------------------------------------------
   `dashboard-teste.html` leva duas coisas a mais, as duas temporárias: a fonte
   DM Sans embutida (+48 KB) e um `<select>` pra trocar de fonte ao vivo. Os
   dois modelos de verdade não podem ver nenhuma das duas — os três saem do
   MESMO molde, e uma linha no lugar errado do `monta-modelos.js` vaza o
   laboratório para os painéis em uso, calada, porque o arquivo continua
   abrindo e parecendo certo.

   O terceiro item desta prova era o tema `vidro`. Ele foi aprovado em 22/09 e
   virou o tema claro: deixou de ser candidato, e a assertiva saiu. */
for (const nome of ['dashboard-claro.html', 'dashboard-escuro.html']) {
  const h = fs.readFileSync(path.join(MOD, nome), 'utf8');
  ok(!h.includes('f-fonte'),
     nome + ' NÃO leva o seletor de fonte');
  ok(!h.includes('font/woff2'),
     nome + ' NÃO leva fonte embutida (são +48 KB por arquivo)');
}

/* ---------------------------------------------------------------------------
   Contraste — WCAG 2.1, relação entre duas cores
   ------------------------------------------------------------------------- */
const lum = hex => {
  const c = [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16) / 255)
    .map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contraste = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

/* Os pares que o CSS comenta. Se alguém trocar um token, o valor some da
   folha e o teste cai — forçando refazer a conta em vez de confiar no
   comentário, que não se atualiza sozinho. */
console.log('\n■ Contraste (WCAG AA: 4,5 para texto, 3,0 para traço e texto grande)');
const CSS = fs.readFileSync(path.join(AQUI, 'tokens', 'tema.css'), 'utf8');
/* ⚠️ O fundo de referência do claro MUDOU em 22/09. Era `#FFFFFF`, o cartão
   branco chapado. Agora o cartão tem degradê, e o pior caso é o canto
   superior esquerdo dele — #E3E8EC, o branco translúcido resolvido sobre o
   campo. É lá que ficam o chip e o título de cada cartão.

   Medir contra branco continuaria "passando" e esconderia o problema real:
   o `--positivo` antigo dava 5,16 no branco e 4,22 no canto, abaixo de AA,
   exatamente onde o KPI escreve "▲ 4,2% vs. período anterior". */
const CANTO = '#E3E8EC';
const PARES = [
  ['#3A4552', CANTO, 4.5, 'texto no canto escuro do cartão'],
  ['#55626F', CANTO, 4.5, 'texto secundário no canto escuro'],
  /* O cabeçalho perdeu o fundo em 22/09: o subtítulo do topo é o único texto
     do painel que cai direto no CAMPO. Se alguém escurecer o campo ou clarear
     o secundário, é aqui que aparece. */
  ['#55626F', '#D8E1E9', 4.5, 'texto secundário sobre o campo nu (subtítulo do topo)'],
  ['#6F7D89', CANTO, 3.0, 'de-ênfase no canto escuro (piso de traço, não de texto)'],
  ['#487DEA', CANTO, 3.0, 'azul da marca como TRAÇO no claro (reprova em texto)'],
  ['#7F1112', CANTO, 4.5, 'negativo no claro'],
  ['#0C6E4B', CANTO, 4.5, 'positivo derivado no claro'],
  ['#6F4047', CANTO, 4.5, 'atenção no claro'],
  ['#FFFFFF', '#3A4552', 4.5, 'ícone vazado dentro do chip'],
  ['#EDEFF5', '#0B0D12', 4.5, 'texto sobre fundo escuro'],
  ['#A4ABBF', '#0B0D12', 4.5, 'texto secundário sobre fundo escuro'],
  ['#487DEA', '#0B0D12', 3.0, 'acento no escuro'],
  ['#EF5B60', '#0B0D12', 3.0, 'negativo no escuro'],
  ['#35C08A', '#0B0D12', 3.0, 'positivo no escuro'],
];
for (const [fg, bg, min, oque] of PARES) {
  const r = contraste(fg, bg);
  ok(r >= min, oque + ' — ' + r.toFixed(2) + ':1 (mínimo ' + min.toFixed(1) + ')');
  ok(CSS.includes(fg), '  ' + fg + ' ainda está em tema.css');
}
/* O contrário também importa: o azul da marca NÃO serve de texto no escuro. */
ok(contraste('#1523A0', '#0B0D12') < 3,
   'azul da marca reprova no fundo escuro (é por isso que o escuro troca o acento)');

/* ---------------------------------------------------------------------------
   Altura em caixa inline — erro que só o navegador mostra
   ---------------------------------------------------------------------------
   `.nome` e `.barra` são <span>. Sem `display:block`, `height` não vale e a
   barra do ranking sai com 0px: invisível, e nenhum teste de DOM percebe,
   porque o elemento ESTÁ lá. Aconteceu em 18/09.
   ------------------------------------------------------------------------- */
console.log('\n■ Regras que dependem de caixa de bloco');
for (const sel of ['.rank .nome', '.rank .barra']) {
  const regra = CSS.match(new RegExp(
    sel.replace(/[.]/g, '\\.') + '\\s*\\{([^}]*)\\}'));
  ok(regra && /display\s*:\s*block/.test(regra[1]),
     sel + ' declara display:block (é <span>; sem isso, height não vale)');
}

/* ---------------------------------------------------------------------------
   Hierarquia — o KPI não é a manchete
   ---------------------------------------------------------------------------
   Decisão do Thomas em 18/09: o número grande chama o olho primeiro e é o dado
   menos interessante da página — um total sem recorte. Quem explica é o
   gráfico e a tabela.

   Isso é o tipo de ajuste que volta sozinho na próxima mexida de CSS, e
   ninguém percebe. Por isso vira prova.
   ------------------------------------------------------------------------- */
console.log('\n■ Hierarquia visual');
const regra = sel => {
  const m = CSS.match(new RegExp('^' + sel.replace(/[.]/g, '\\.') +
                                 '\\s*\\{([^}]*)\\}', 'm'));
  return m ? m[1] : '';
};
const px = (bloco, prop) => {
  const m = bloco.match(new RegExp(prop + '\\s*:\\s*([0-9.]+)px'));
  return m ? parseFloat(m[1]) : NaN;
};

const fonteKpi = px(regra('.kpi-val'), 'font-size');
ok(fonteKpi <= 26,
   'o número do KPI tem ' + fonteKpi + 'px (teto 26 — acima disso ele vira manchete)');

/* ── a troca de arte é do CSS, e o DOM de mentira não tem media query ───────
   O smoke roda contra um DOM falso, que não avalia `@media`. Então quem prova
   a troca por largura é o TEXTO da folha: a curta nasce escondida, e dentro do
   bloco de 620px as duas inverte. Sem isto, apagar uma das duas linhas deixaria
   o painel com as DUAS artes na barra — e nada acusaria. */
ok(/\.logo-curta\s*\{\s*display:none\s*\}/.test(CSS),
   'a arte curta nasce escondida (a extensa é o padrão, na web)');
const bloco620 = (CSS.match(/@media \(max-width:620px\)\{([\s\S]*?)\n\}/) || [, ''])[1];
ok(/\.logo-extensa\{\s*display:none\s*\}/.test(bloco620),
   'abaixo de 620px a extensa sai');
ok(/\.logo-curta\{\s*display:block;\s*height:\d+px\s*\}/.test(bloco620),
   'e a curta entra, com altura própria');
ok(/^\.marca\{[^}]*justify-self:start/m.test(CSS),
   'o .marca é quem se alinha na coluna, não o .logo (senão a grade ganha um filho)');

const padGlobal = px(regra('.cartao'), 'padding');
const padKpi = px(regra('.g4 .cartao'), 'padding');
ok(padKpi < padGlobal,
   'a faixa de KPI é mais apertada que os outros cartões (' +
   padKpi + 'px vs ' + padGlobal + 'px)');
ok(padGlobal === 18,
   'os cartões de gráfico, ranking e tabela mantêm o respiro (' + padGlobal + 'px)');

/* Tira comentário de bloco e de linha, pra assertiva sobre código não
   tropeçar em texto explicativo. Só as duas formas que o molde usa. */
const semComentarios = js => js
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/^[ \t]*\/\/.*$/gm, '');

/* ---------------------------------------------------------------------------
   DOM de mentira — o mínimo que o script do painel encosta
   ------------------------------------------------------------------------- */
function domFalso() {
  const feito = { html: {}, texto: {}, ouvintes: 0 };
  const cria = sel => ({
    _sel: sel,
    dataset: {},
    set innerHTML(v) { feito.html[sel] = v; },
    get innerHTML() { return feito.html[sel] || ''; },
    set textContent(v) { feito.texto[sel] = v; },
    get textContent() { return feito.texto[sel] || ''; },
    set src(v) { feito.texto[sel + '@src'] = v; },
    get src() { return feito.texto[sel + '@src'] || ''; },
    /* `setAttribute` entrou quando o botão de tema virou só ícone: sem texto
       visível, o nome dele passou a vir de `aria-label`. O smoke estourou na
       hora — que é o trabalho dele. */
    _attrs: {},
    setAttribute(k, v) { this._attrs[k] = String(v); },
    getAttribute(k) { return this._attrs[k] ?? null; },
    addEventListener() { feito.ouvintes++; },
  });
  const cache = {};
  const doc = {
    documentElement: { dataset: { tema: 'claro' } },
    querySelector(sel) {
      if (!(sel in cache)) cache[sel] = cria(sel);
      return cache[sel];
    },
  };
  return { doc, feito, cache };
}

/* ---------------------------------------------------------------------------
   1..N — cada modelo
   ------------------------------------------------------------------------- */
for (const [nome, temaEsperado, logoExtensa, logoCurta] of [
  ['dashboard-claro.html', 'claro',
   'logo-cars2you-preto.svg', 'logo-c2y-preto.svg'],
  ['dashboard-escuro.html', 'escuro',
   'logo-cars2you-branco.svg', 'logo-c2y-branco.svg'],
]) {
  console.log('\n■ ' + nome);
  const html = fs.readFileSync(path.join(MOD, nome), 'utf8');

  ok(!/__[A-Z_]+__/.test(html), 'nenhum marcador do molde sobrou');
  ok(new RegExp('<html[^>]*data-tema="' + temaEsperado + '"').test(html),
     'nasce no tema ' + temaEsperado);

  // --- offline: nada pode sair pra rede ---
  ok(!/<link\b/i.test(html), 'sem <link> (folha externa)');
  ok(!/<script[^>]+\bsrc=/i.test(html), 'sem <script src>');
  ok(!/@import/i.test(html), 'sem @import');
  ok(!/https?:\/\//i.test(html.replace(/xmlns="[^"]*"/g, '')),
     'sem URL http(s) — xmlns do SVG não conta, é identificador');
  const urlsExternas = (html.match(/url\((?!['"]?(?:#|data:))[^)]*\)/gi) || []);
  ok(urlsExternas.length === 0,
     'nenhum url() de fora' + (urlsExternas.length ? ' — achei ' + urlsExternas[0] : ''));

  // --- embutidos ---
  /* SVG desde 22/09. São QUATRO artes: duas larguras × duas cores. O tema
     escolhe a cor (JS), a largura da tela escolhe a arte (CSS). */
  ok(html.includes('data:image/svg+xml;base64,'), 'logos em data URI');
  ok(!html.includes('data:image/png;base64,'),
     'e nenhum logo em PNG sobrou — vetor não escadeia em HiDPI nem na impressão');
  ok((html.match(/data:image\/svg\+xml;base64,/g) || []).length === 4,
     'as QUATRO artes entram: extensa e curta, em claro e escuro');

  /* A grade do topo tem TRÊS colunas, então o topo precisa ter TRÊS filhos.
     As duas artes moram dentro do `.marca` justamente por isso: soltas,
     virariam um quarto filho e o título sairia do centro. Esta prova é a que
     morde se alguém "simplificar" tirando o invólucro. */
  const topoIn = html.match(/<div class="topo-in">([\s\S]*?)\n  <\/div>/);
  ok(!!topoIn, 'o .topo-in existe');
  if (topoIn) {
    const filhos = (topoIn[1].match(/^    <(?!\/)[a-z]/gm) || []).length;
    ok(filhos === 3,
       'o .topo-in tem 3 filhos diretos, um por coluna da grade (achei ' + filhos + ')');
  }
  ok(/<span class="marca">/.test(html),
     'as duas artes vivem dentro do .marca');
  /* --- o glossário é bloco de primeiro nível, não rodapé de outro cartão --- */
  const iGloss = html.indexOf('<details class="cartao gloss"');
  ok(iGloss > 0, 'o glossário existe como cartão próprio');
  if (iGloss > 0) {
    const antes = html.slice(0, iGloss);
    const abertas = (antes.match(/<section\b/g) || []).length;
    const fechadas = (antes.match(/<\/section>/g) || []).length;
    ok(abertas === fechadas,
       'ele está FORA de qualquer <section> — não é rodapé da tabela');
    ok(html.indexOf('<p class="rodape"') > iGloss,
       'e é o último bloco antes do rodapé');
  }
  /* Sem tirar os comentários, isto casa com o COMENTÁRIO que explica a
     mudança — ele fica justamente entre a tabela e o glossário. Terceira vez
     nesta sessão que uma assertiva tropeça em texto explicativo: prova sobre
     marcação tem que rodar em marcação. */
  const semComentarioHtml = t => t.replace(/<!--[\s\S]*?-->/g, ' ');
  const secTabela = semComentarioHtml(
    html.slice(html.indexOf('<h2>Detalhe</h2>'), iGloss));
  ok(!secTabela.includes('gloss'),
     'o cartão da tabela não tem mais nada de glossário dentro');

  ok(html.includes('Tema dos painéis'), 'tema.css embutido');
  ok(html.includes('[data-tema="escuro"]'), 'os dois temas vão no arquivo');

  // --- o script roda? ---
  const blocos = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  ok(blocos.length === 1, 'um bloco de script');

  const { doc, feito, cache } = domFalso();
  doc.documentElement.dataset.tema = temaEsperado;

  /* localStorage com o tema CONTRÁRIO já gravado. O painel tem que ignorar:
     arquivo chamado "claro" não pode abrir escuro por causa de uma
     preferência que o leitor deixou noutra página. */
  const arm = { 'tema-painel': temaEsperado === 'claro' ? 'escuro' : 'claro' };
  const fakeStorage = {
    getItem: k => (k in arm ? arm[k] : null),
    setItem: (k, v) => { arm[k] = String(v); },
  };
  let estourou = null;
  try {
    new Function('document', 'localStorage', blocos[0])(doc, fakeStorage);
  } catch (e) { estourou = e; }
  ok(!estourou, 'o script roda sem estourar' + (estourou ? ' — ' + estourou.message : ''));

  if (!estourou) {
    ok(cache['[data-kpi="veiculos"]'].textContent === '1.879', 'KPI preenchido');
    const g = feito.html['#graf-linha'] || '';
    ok(g.includes('class="serie"'), 'gráfico desenhou a linha');
    ok((g.match(/<circle/g) || []).length === 12, 'um ponto por mês (12)');

    /* A regra de leitura: rótulo no ponto por padrão, e aí o eixo Y sai
       inteiro. Os dois juntos dizem a mesma coisa duas vezes. */
    ok((g.match(/class="rotulo"/g) || []).length === 12,
       'rótulo de dados em todos os 12 pontos (padrão da casa)');
    ok(!g.includes('linha-grade'),
       'sem linha de grade quando há rótulo — seria o mesmo valor duas vezes');
    ok(!/class="eixo"[^>]*text-anchor="end"/.test(g),
       'sem escala no eixo Y quando há rótulo');
    ok((g.match(/class="eixo"/g) || []).length === 12,
       'o eixo X fica: ele diz QUANDO, não quanto');
    ok(g.includes('>1.879<') || g.includes('>523<'),
       'o rótulo sai formatado em pt-BR');
    ok((g.match(/NaN|Infinity|undefined/g) || []).length === 0,
       'nenhum NaN/Infinity/undefined no caminho do SVG');
    ok(((feito.html['#rank'] || '').match(/<li>/g) || []).length === 6, '6 linhas no ranking');
    ok(((feito.html['#tab'] || '').match(/<tr>/g) || []).length === 6, '6 linhas na tabela');

    /* Glossário — peça FIXA de todo painel, e bloco PRÓPRIO.
       Ele vivia dentro do cartão da tabela, posição que dizia "isto explica a
       tabela". Explica a página. Quem copiar o modelo e apagar a tabela não
       pode perder o glossário junto. */
    const gl = feito.html['#gloss-lista'] || '';
    ok((gl.match(/<dt>/g) || []).length === 3,
       'glossário montado a partir de DADOS.glossario (3 termos)');
    ok((gl.match(/<dd>/g) || []).length === 3, 'cada termo tem definição');
    ok(cache['#gloss-n'].textContent === '3 termos',
       'a contagem de termos sai do dado, não do HTML');
    ok(cache['#logo'].src.startsWith('data:image/svg+xml;base64,'),
       'a arte extensa foi aplicada no <img>');
    ok(cache['#logo-curta'].src.startsWith('data:image/svg+xml;base64,'),
       'a arte curta também — as duas nascem preenchidas, e o CSS é que esconde uma');
    ok(cache['#logo'].src !== cache['#logo-curta'].src,
       'e são artes DIFERENTES (o mesmo src nas duas = marcador trocado errado)');
    ok(feito.ouvintes === 1, 'o botão de tema está ligado');

    /* Botão só de ícone: quem não enxerga o ícone precisa do nome em algum
       lugar, senão o leitor de tela anuncia apenas "botão". */
    const bt = cache['#b-tema'];
    ok(/^<svg[\s\S]*<\/svg>$/.test(bt.innerHTML.trim()),
       'o botão de tema tem só o ícone, sem texto');
    ok(/^Mudar para o tema (claro|escuro)$/.test(bt.getAttribute('aria-label') || ''),
       'e um aria-label que diz para onde ele leva: "' +
       bt.getAttribute('aria-label') + '"');
    ok(!/☀|☾|Tema (claro|escuro)</.test(bt.innerHTML),
       'nada de ☀/☾ como caractere — viram emoji colorido em parte dos sistemas');
    ok(doc.documentElement.dataset.tema === temaEsperado,
       'abre no tema do arquivo, ignorando preferência gravada de fora');
    /* Duas tentativas furadas antes desta, e as duas reprovavam o COMENTÁRIO
       que explica por que não usar localStorage:
         /localStorage/           → casava com a palavra no comentário;
         /localStorage\s*(\.|\[)/ → casava com o PONTO FINAL da frase.
       Assertiva sobre código tem que rodar em código. */
    ok(!/localStorage/.test(semComentarios(blocos[0])),
       'não grava preferência — painel por link abre igual pra todo mundo');
  }

  /* --- a EXCEÇÃO: série contínua e densa volta pro eixo -----------------
     O caso comum se prova sozinho ao abrir a página; o de exceção não
     aparece nunca, e é justamente o que quebra calado quando alguém mexer
     no `cabeRotulo`. Aqui o script do painel roda de novo, num DOM limpo,
     e desenha duas séries feitas à mão. */
  if (!estourou) {
    const alt = domFalso();
    alt.doc.documentElement.dataset.tema = temaEsperado;
    const banco = {};
    const ensaio = blocos[0] + `
      ;(function(){
        const densa = Array.from({length:48}, (_, i) =>
          ({rot:'d'+i, v: 1000 + (i % 7) * 137}));
        banco.densa = desenhaLinha(document.querySelector('#denso'), densa);
        banco.htmlDensa = document.querySelector('#denso').innerHTML;

        const rala = [{rot:'jan',v:12},{rot:'fev',v:31},{rot:'mar',v:19}];
        banco.rala = desenhaLinha(document.querySelector('#ralo'), rala);
        banco.htmlRala = document.querySelector('#ralo').innerHTML;

        // forçar a mão tem que vencer a decisão automática
        banco.forcado = desenhaLinha(document.querySelector('#forcado'), densa,
                                     {rotulos:true});
      })();`;
    let erroEnsaio = null;
    try {
      new Function('document', 'localStorage', 'banco', ensaio)(
        alt.doc, { getItem: () => null, setItem: () => {} }, banco);
    } catch (e) { erroEnsaio = e; }
    ok(!erroEnsaio, 'o ensaio das duas séries roda' +
       (erroEnsaio ? ' — ' + erroEnsaio.message : ''));

    if (!erroEnsaio) {
      ok(banco.densa === false,
         '48 pontos: o rótulo não cabe, então volta o eixo Y (a exceção)');
      ok(banco.htmlDensa.includes('linha-grade'),
         '  ...e a linha de grade volta com ele');
      ok(!banco.htmlDensa.includes('class="rotulo"'),
         '  ...sem rótulo, que colidiria');
      ok(banco.rala === true, '3 pontos: cabe rótulo, o eixo Y sai');
      ok(banco.htmlRala.includes('class="rotulo"'), '  ...e o rótulo aparece');
      ok(!banco.htmlRala.includes('linha-grade'), '  ...sem linha de grade');
      ok(banco.forcado === true,
         'rotulos:true vence a decisão automática (a escolha é de quem monta)');
    }
  }

  // --- o logo certo pro fundo certo ---
  const b64 = arquivo => 'data:image/svg+xml;base64,' + fs.readFileSync(
    path.join(AQUI, 'marca', 'cars2you', arquivo)).toString('base64');
  /* Compara o arquivo INTEIRO, nao so o nome: a cor mora dentro do SVG, e um
     `fill` trocado passaria por qualquer prova que olhasse o caminho. */
  ok(!estourou && cache['#logo'].src === b64(logoExtensa),
     'usa ' + logoExtensa + ' no tema ' + temaEsperado);
  ok(!estourou && cache['#logo-curta'].src === b64(logoCurta),
     'e ' + logoCurta + ' na arte curta');
}

/* ---------------------------------------------------------------------------
   Fecho
   ------------------------------------------------------------------------- */
console.log('\n' + (erros ? '✗ ' + erros + ' de ' + testes + ' falharam'
                          : '✓ ' + testes + ' provas passaram'));
process.exit(erros ? 1 : 0);
