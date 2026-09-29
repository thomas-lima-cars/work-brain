/* ============================================================================
   Monta os dois modelos de painel a partir de UMA fonte.

       node design/modelos/monta-modelos.js

   Entra:  _fonte/dashboard.html + ../tokens/tema.css + ../marca/cars2you/*.svg
   Sai:    dashboard-claro.html + dashboard-escuro.html (+ o laboratório de
           fonte e dashboard-escuro-c6.html, com a camada do C6)

   ── POR QUE GERAR EM VEZ DE MANTER OS DOIS NA MÃO ─────────────────────────
   Dois arquivos irmãos editados à mão divergem — e sempre o mesmo jeito: o
   que a pessoa usa mais fica certo, o outro apodrece calado. Aqui os dois
   saem do mesmo molde, e a diferença entre eles é UMA linha: o data-tema.

   Mesma lógica que fez `conexao.py` virar multi-base em vez de virar dois
   arquivos (sessão 18/09).

   ── POR QUE EMBUTIR TUDO ──────────────────────────────────────────────────
   CSS e logos entram dentro do HTML. O painel abre do SharePoint, de um
   anexo, de um pendrive, com a VPN caída. Zero requisição de rede — e tem
   prova disso em _prova_modelos.js.
   ========================================================================== */

const fs = require('fs');
const path = require('path');

const AQUI = __dirname;
const DESIGN = path.resolve(AQUI, '..');

const ler = p => fs.readFileSync(p, 'utf8');

const CSS = ler(path.join(DESIGN, 'tokens', 'tema.css'));
const JS_TESTE = ler(path.join(AQUI, '_fonte', 'controles-teste.js'));
const FONTE = ler(path.join(AQUI, '_fonte', 'dashboard.html'));

/* SVG desde 22/09, no lugar do PNG de 300 × 56. Vetor resolve de uma vez as
   três queixas que o README da marca listava: escadeamento em HiDPI e na
   impressão, a arte encostando na borda do canvas, e a branca que era um PNG
   recortado embrulhado numa tag <svg>.

   Base64 e não o SVG cru no `src`: o arquivo tem `#` (nas cores) e aspas, que
   numa data URI sem codificar quebram o atributo. Base64 custa ~33% de bytes
   e não depende de acertar escape nenhum — e são 4 KB, não 400. */
const uriDe = (marca, arquivo) => 'data:image/svg+xml;base64,' +
  fs.readFileSync(path.join(DESIGN, 'marca', marca, arquivo)).toString('base64');
const uri = arquivo => uriDe('cars2you', arquivo);

/* Quatro artes: duas larguras × duas cores.
     extensa  a marca escrita por extenso — 933 × 168 (5,55:1), para a web
     curta    o "c2y" — 990 × 454 (2,18:1), para o telefone
   As duas caixas foram MEDIDAS com `getBBox`, não lidas do atributo: cinco
   dos seis arquivos vieram sem `viewBox`, e sem ele o SVG não escala com
   `height`. O `viewBox` que está neles hoje saiu dessa medição.

   "preto" é `#3A4552` — exatamente o `--texto`/`--acento` do tema claro. Por
   isso a versão azul fica de fora por enquanto (decisão de 22/09). */
const LOGO_CLARO_EXTENSA = uri('logo-cars2you-preto.svg');
const LOGO_CLARO_CURTA = uri('logo-c2y-preto.svg');
const LOGO_ESCURO_EXTENSA = uri('logo-cars2you-branco.svg');
const LOGO_ESCURO_CURTA = uri('logo-c2y-branco.svg');

/* ⏳ TEMPORARIO — a DM Sans, candidata a fonte, no modelo de laboratorio.
   Mesmo arranjo dos logos: o arquivo mora em design/fontes/ e vira data URI
   aqui, porque a regra 9 nao admite requisicao de rede. Variavel, entao um
   arquivo so cobre 400, 600, 650 e 700 -- e o que ainda nao foi usado.
   Se a fonte for aprovada, este bloco sai do extra e entra no CSS de
   verdade; se nao, sai junto com a pasta design/fontes/. */
const uriFonte = arquivo => 'data:font/woff2;base64,' +
  fs.readFileSync(path.join(DESIGN, 'fontes', arquivo)).toString('base64');

const CSS_DM_SANS =
  "@font-face{font-family:'DM Sans';font-style:normal;font-weight:100 1000;" +
  "font-display:swap;src:url(" + uriFonte('dm-sans-latin-variavel.woff2') +
  ") format('woff2')}";

/* `.replace` com string troca `$&`, `$1` e afins por pedaço do casamento.
   Base64 não tem `$`, mas a forma de função não custa nada e não depende
   disso continuar verdade. O painel de precificação já apanhou disso. */
const troca = (txt, de, por) => txt.split(de).join(por);

const TEMAS = [
  { tema: 'claro',  arquivo: 'dashboard-claro.html',
    titulo: 'Modelo de painel — tema claro' },
  { tema: 'escuro', arquivo: 'dashboard-escuro.html',
    titulo: 'Modelo de painel — tema escuro' },
  /* LABORATORIO DE FONTE. Mesmo molde e mesmo tema dos outros dois: o que
     ele tem a mais e a DM Sans embutida e um <select> pra trocar de fonte
     ao vivo. Escolher fonte por lista de nomes nao funciona.
     O tema vidro saiu daqui em 22/09: virou o claro de verdade. */
  { tema: 'claro',  arquivo: 'dashboard-teste.html',
    titulo: 'Modelo de painel — laboratório de fonte',
    extra: CSS_DM_SANS, extraJs: JS_TESTE },
  /* C6, escuro com detalhes em amarelo #FFC000 (pedido do Thomas, 28/09).
     Mesmo molde: a diferença é a camada de cor do C6 depois do tema.css
     (regra 10e) e a marca do C6 — uma arte por tema, sem versão curta, então
     a curta é a mesma. Quem abrir e trocar para o claro vê o C6 claro. */
  { tema: 'escuro', arquivo: 'dashboard-escuro-c6.html',
    titulo: 'Modelo de painel — C6, tema escuro',
    extra: ler(path.join(DESIGN, 'tokens', 'tema-c6.css')),
    logos: {
      claro: uriDe('c6', 'logo-c6-preto.svg'), escuro: uriDe('c6', 'logo-c6-branco.svg')
    },
    alt: 'C6 Bank' },
];

let falhou = false;

for (const t of TEMAS) {
  let html = FONTE;
  html = troca(html, '/*__CSS__*/', CSS + (t.extra || ''));
  html = troca(html, '/*__EXTRA__*/', t.extraJs || '');
  const lg = t.logos || null;
  html = troca(html, '__LOGO_CLARO_EXTENSA__', lg ? lg.claro : LOGO_CLARO_EXTENSA);
  html = troca(html, '__LOGO_CLARO_CURTA__', lg ? lg.claro : LOGO_CLARO_CURTA);
  html = troca(html, '__LOGO_ESCURO_EXTENSA__', lg ? lg.escuro : LOGO_ESCURO_EXTENSA);
  html = troca(html, '__LOGO_ESCURO_CURTA__', lg ? lg.escuro : LOGO_ESCURO_CURTA);
  if (t.alt) html = troca(html, 'alt="Cars2You"', 'alt="' + t.alt + '"');
  html = troca(html, '__TITULO__', t.titulo);
  html = troca(html, '__TEMA__', t.tema);

  // Guarda: marcador que sobrou é erro de digitação no molde, e o arquivo
  // sai parecendo certo. Falhar aqui é barato; descobrir na reunião, não.
  const sobrou = html.match(/__[A-Z_]+__|\/\*__[A-Z_]+__\*\//g);
  if (sobrou) {
    console.error('✗ ' + t.arquivo + ' — marcador não substituído: ' +
                  [...new Set(sobrou)].join(', '));
    falhou = true;
    continue;
  }

  const destino = path.join(AQUI, t.arquivo);
  fs.writeFileSync(destino, html, 'utf8');
  console.log('✓ %s · %d KB', t.arquivo, Math.round(html.length / 1024));
}

if (falhou) process.exit(1);
console.log('\nConfira com: node design/_prova_modelos.js');
