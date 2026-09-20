/* ============================================================================
   Monta os dois modelos de painel a partir de UMA fonte.

       node design/modelos/monta-modelos.js

   Entra:  _fonte/dashboard.html + ../tokens/tema.css + ../marca/cars2you/*.png
   Sai:    dashboard-claro.html + dashboard-escuro.html

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
const FONTE = ler(path.join(AQUI, '_fonte', 'dashboard.html'));

const uri = arquivo => 'data:image/png;base64,' +
  fs.readFileSync(path.join(DESIGN, 'marca', 'cars2you', arquivo)).toString('base64');

const LOGO_CLARO = uri('logo-azul.png');    // fundo claro pede tinta escura
const LOGO_ESCURO = uri('logo-branca.png');

/* `.replace` com string troca `$&`, `$1` e afins por pedaço do casamento.
   Base64 não tem `$`, mas a forma de função não custa nada e não depende
   disso continuar verdade. O painel de precificação já apanhou disso. */
const troca = (txt, de, por) => txt.split(de).join(por);

const TEMAS = [
  { tema: 'claro',  arquivo: 'dashboard-claro.html',
    titulo: 'Modelo de painel — tema claro' },
  { tema: 'escuro', arquivo: 'dashboard-escuro.html',
    titulo: 'Modelo de painel — tema escuro' },
];

let falhou = false;

for (const t of TEMAS) {
  let html = FONTE;
  html = troca(html, '/*__CSS__*/', CSS);
  html = troca(html, '__LOGO_CLARO__', LOGO_CLARO);
  html = troca(html, '__LOGO_ESCURO__', LOGO_ESCURO);
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
