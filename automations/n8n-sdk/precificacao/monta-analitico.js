/* PÁGINA 2 — o analítico: uma linha por venda.
 * Uso: node monta-analitico.js [analitico-51358.json] [saida.html]
 *
 * 4.582 vendas x 39 colunas. O dado vai embarcado como {colunas, linhas} —
 * matriz, não lista de objetos: repetir 39 nomes de chave 4.582 vezes dobraria
 * o arquivo sem acrescentar nada.
 *
 * Tudo client-side e sem CDN: a página circula por e-mail e SharePoint, onde
 * script externo não carrega.
 *
 * O deságio NÃO vem do banco — é calculado aqui, 1 − venda/FIPE, a partir das
 * duas colunas cruas. Assim a derivada é visível e conferível na própria tela.
 */
const fs = require('fs');
const path = require('path');
const HERE = __dirname;

const entrada = process.argv[2] || path.join(HERE, 'analitico-51358.json');
const saida = process.argv[3] || path.join(HERE, 'analitico-veiculos.html');
const D = JSON.parse(fs.readFileSync(entrada, 'utf8'));

const num = (x) => Number(x).toLocaleString('pt-BR');
const pct = (x) => (x * 100).toFixed(1).replace('.', ',') + '%';

/* as colunas que aparecem de cara. O resto entra pelo seletor. */
const PADRAO = ['grupo', 'ano_modelo', 'km', 'patio_uf', 'loja', 'comprador_loja_id',
  'valor_fipe_anuncio', 'venda', 'desagio'];

/* como cada coluna se formata e se alinha */
const TIPO = {
  venda: 'moeda', valor_fipe_anuncio: 'moeda', valor_fipe_veiculo: 'moeda',
  valor_ref_vendedor: 'moeda', vmv: 'moeda', valor_molicar_veiculo: 'moeda',
  valor_molicar_anuncio: 'moeda', valor_varejo: 'moeda',
  km: 'int', ano_modelo: 'int', ano_fabricacao: 'int', portas: 'int',
  fipe_qtd_versoes: 'int', veiculo_id: 'int', negociacao_id: 'int',
  loja_id: 'int', comprador_loja_id: 'int', whitelabel_id: 'int',
  situacao_codigo: 'int', status_negociacao: 'int',
  data_venda: 'data', veiculo_criado_em: 'data', veiculo_atualizado_em: 'data',
  desagio: 'pct'
};

/* filtros: as colunas que viram seletor */
const FILTROS = ['grupo', 'marca', 'categoria', 'patio_uf', 'cor', 'cambio', 'combustivel'];

const c = D.coleta;
const dados = JSON.stringify({ colunas: D.colunas, linhas: D.linhas })
  .split('<').join('\\u003c');

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Analítico dos veículos — ${num(c.colhidas)} vendas</title>
<style>
:root{color-scheme:light dark;
 --surface:#fcfcfb;--card:#fff;--line:#e6e5e0;--ink:#0b0b0b;--ink2:#52514e;--ink3:#87857e;
 --blue:#2a78d6;--blue-l:#cde2fb;--amber:#eda100;--campo:#fff}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
 --surface:#161615;--card:#1f1f1e;--line:#33332f;--ink:#fff;--ink2:#c3c2b7;--ink3:#8d8b82;
 --blue:#3987e5;--blue-l:#184f95;--amber:#c98500;--campo:#111}}
:root[data-theme="dark"]{--surface:#161615;--card:#1f1f1e;--line:#33332f;--ink:#fff;
 --ink2:#c3c2b7;--ink3:#8d8b82;--blue:#3987e5;--blue-l:#184f95;--amber:#c98500;--campo:#111}
*{box-sizing:border-box}
body{margin:0;background:var(--surface);color:var(--ink);
 font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
 -webkit-font-smoothing:antialiased}
.wrap{max-width:1500px;margin:0 auto;padding-block:28px 56px;padding-left:20px;padding-right:20px}
h1{font-size:24px;margin:0 0 6px;letter-spacing:-.01em;line-height:1.2}
.sub{color:var(--ink2);margin:0}
.meta{color:var(--ink3);font-size:13px;margin:6px 0 0}
.rule{height:3px;background:var(--amber);border-radius:2px;margin:14px 0 0}
.nav{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}
.nav a{font-size:13px;color:var(--blue);text-decoration:none;border:1px solid var(--line);
 border-radius:99px;padding:4px 12px}
.nav a:hover{border-color:var(--blue)}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:20px 0 0}
.tile{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px 14px}
.tile .v{font-size:22px;font-weight:650;letter-spacing:-.02em;line-height:1.1;
 font-variant-numeric:tabular-nums}
.tile .k{color:var(--ink3);font-size:11px;text-transform:uppercase;letter-spacing:.04em;margin-top:3px}
.barra{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:18px 0 0;
 background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px 14px}
select,input{font:inherit;font-size:13px;color:var(--ink);background:var(--campo);
 border:1px solid var(--line);border-radius:7px;padding:6px 9px;max-width:100%}
input[type=search]{min-width:200px}
select{max-width:230px}
button{font:inherit;font-size:13px;color:var(--ink);background:var(--card);cursor:pointer;
 border:1px solid var(--line);border-radius:7px;padding:6px 12px}
button:hover{border-color:var(--blue);color:var(--blue)}
button.on{border-color:var(--blue);color:var(--blue)}
.cnt{color:var(--ink3);font-size:13px;margin-left:auto;font-variant-numeric:tabular-nums}
.cols{margin:10px 0 0;display:none;flex-wrap:wrap;gap:6px}
.cols.aberto{display:flex}
.cols label{font-size:12px;color:var(--ink2);border:1px solid var(--line);border-radius:99px;
 padding:3px 10px;cursor:pointer;user-select:none}
.cols label.on{border-color:var(--blue);color:var(--blue)}
.cols input{display:none}
.tabela{margin-top:14px;overflow:auto;max-height:70vh;border:1px solid var(--line);
 border-radius:10px;background:var(--card)}
table{border-collapse:separate;border-spacing:0;font-size:12.5px;width:100%}
th{position:sticky;top:0;z-index:1;background:var(--card);text-align:left;font-weight:600;
 color:var(--ink3);font-size:10.5px;text-transform:uppercase;letter-spacing:.04em;
 padding:9px 10px;border-bottom:1px solid var(--line);white-space:nowrap;cursor:pointer;
 user-select:none}
th:hover{color:var(--blue)}
th .seta{opacity:.5;font-size:9px}
td{padding:6px 10px;border-bottom:1px solid var(--line);white-space:nowrap}
tbody tr:hover td{background:color-mix(in srgb,var(--blue) 7%,transparent)}
.n{text-align:right;font-variant-numeric:tabular-nums}
.des{position:relative;text-align:right;font-variant-numeric:tabular-nums;font-weight:600}
.des i{position:absolute;left:6px;top:50%;transform:translateY(-50%);height:8px;
 background:var(--blue-l);border-radius:0 3px 3px 0;display:block}
.des b{position:relative}
.pag{display:flex;gap:8px;align-items:center;margin-top:12px;flex-wrap:wrap}
.vazio{padding:30px;text-align:center;color:var(--ink3)}
.box{background:var(--card);border:1px solid var(--line);border-left:3px solid var(--amber);
 border-radius:8px;padding:14px 16px;margin:20px 0 0}
.box p{margin:0 0 8px}.box p:last-child{margin:0}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.92em;
 background:color-mix(in srgb,var(--ink) 7%,transparent);padding:1px 5px;border-radius:4px}
footer{margin-top:40px;padding-top:18px;border-top:1px solid var(--line);color:var(--ink3);font-size:12.5px}
</style></head>
<body><div class="wrap">

<h1>Analítico dos veículos</h1>
<p class="sub">Uma linha por venda — ${num(c.colhidas)} vendas dos 20 modelos mais vendidos, sem motos e pesados</p>
<p class="meta">${D.rotulo || 'Execução 51358'} ·
${c.periodo[0].slice(0, 10).split('-').reverse().join('/')} a
${c.periodo[1].slice(0, 10).split('-').reverse().join('/')} ·
coleta conferida contra gabarito (${num(c.esperadas)}), ${c.duplicadas} duplicadas</p>
<div class="rule"></div>
<p class="nav"><a href="colunas-desagio.html">→ Avaliação coluna a coluna</a>
<a href="graficos-modelo.html">→ Gráficos: km, idade, UF e laudo</a></p>

<div class="tiles" id="tiles"></div>

<div class="barra">
  <input type="search" id="busca" placeholder="buscar em tudo…" autocomplete="off">
  <span id="selects"></span>
  <button id="limpar">limpar</button>
  <button id="btcols">colunas…</button>
  <button id="csv">baixar CSV</button>
  <span class="cnt" id="cnt"></span>
</div>
<div class="cols" id="cols"></div>

<div class="tabela"><table>
  <thead><tr id="cab"></tr></thead>
  <tbody id="corpo"></tbody>
</table><div class="vazio" id="vazio" hidden>Nenhuma venda com esses filtros.</div></div>

<div class="pag">
  <button id="ant">← anterior</button>
  <span class="cnt" id="pgt" style="margin:0"></span>
  <button id="prox">próxima →</button>
</div>

<div class="box">
<p><b>O deságio é calculado aqui, não vem do banco:</b> <code>1 − venda ÷ valor_fipe_anuncio</code>.
As duas colunas cruas estão na tabela, então a conta é conferível linha a linha.</p>
<p><b>Placa e chassi não estão aqui de propósito.</b> São PII e identificam exatamente uma
linha cada — valor analítico zero. O identificador que ficou é o <code>veiculo_id</code>.</p>
<p><b>O corte de outlier já está aplicado:</b> só entram vendas com razão entre 0,20 e 1,20
da FIPE. Fora disso há dado quebrado — venda registrada a 107× a tabela.</p>
</div>

<footer>
Gerado por <code>monta-analitico.js</code> a partir de <code>${path.basename(entrada)}</code> ·
${D.origem || 'workflow <code>a6fNNTUYYayehNIn</code>, execução 51358.'}<br>
⚠️ Contém nome real de loja e dado comercial de cliente. Repo privado — pensar antes de repassar.
</footer>
</div>

<script id="dados" type="application/json">${dados}</script>
<script>
(function () {
  var D = JSON.parse(document.getElementById('dados').textContent);
  var COLS = D.colunas.slice();
  var TIPO = ${JSON.stringify(TIPO)};
  var PADRAO = ${JSON.stringify(PADRAO)};
  var FILTROS = ${JSON.stringify(FILTROS)};
  var iVenda = COLS.indexOf('venda'), iFipe = COLS.indexOf('valor_fipe_anuncio');

  /* o deságio entra como coluna derivada, calculada aqui */
  COLS.push('desagio');
  var LINHAS = D.linhas.map(function (l) {
    var v = Number(l[iVenda]), f = Number(l[iFipe]);
    var r = l.slice();
    r.push(f > 0 && v > 0 ? 1 - v / f : null);
    return r;
  });
  var iDes = COLS.length - 1;

  var brN = function (x) { return Number(x).toLocaleString('pt-BR'); };
  var fmt = function (v, col) {
    if (v === null || v === undefined || v === '') return '—';
    var t = TIPO[col];
    if (t === 'moeda') return 'R$ ' + Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
    if (t === 'int') return brN(v);
    if (t === 'pct') return (v * 100).toFixed(1).replace('.', ',') + '%';
    if (t === 'data') return String(v).slice(0, 10).split('-').reverse().join('/');
    return String(v);
  };
  var numerica = function (col) {
    var t = TIPO[col];
    return t === 'moeda' || t === 'int' || t === 'pct';
  };

  /* ── estado ───────────────────────────────────────────────────────── */
  var visiveis = PADRAO.filter(function (c) { return COLS.indexOf(c) >= 0; });
  var filtro = {}, busca = '', ordem = { col: 'desagio', desc: true }, pagina = 0;
  var PORPAG = 100;

  /* ── filtros: um select por coluna, com os valores que existem ────── */
  var selects = document.getElementById('selects');
  FILTROS.forEach(function (col) {
    var i = COLS.indexOf(col);
    if (i < 0) return;
    var vals = {};
    LINHAS.forEach(function (l) { if (l[i] !== null && l[i] !== '') vals[l[i]] = (vals[l[i]] || 0) + 1; });
    var ks = Object.keys(vals).sort();
    if (ks.length < 2 || ks.length > 400) return;
    var s = document.createElement('select');
    s.innerHTML = '<option value="">' + col + ' (todos)</option>' +
      ks.map(function (k) {
        return '<option value="' + k.replace(/"/g, '&quot;') + '">' + k + ' (' + vals[k] + ')</option>';
      }).join('');
    s.onchange = function () { filtro[col] = s.value; pagina = 0; desenha(); };
    s.dataset.col = col;
    selects.appendChild(s);
  });

  /* ── seletor de colunas ───────────────────────────────────────────── */
  var cols = document.getElementById('cols');
  cols.innerHTML = COLS.map(function (c) {
    var on = visiveis.indexOf(c) >= 0;
    return '<label class="' + (on ? 'on' : '') + '"><input type="checkbox" value="' + c + '"' +
      (on ? ' checked' : '') + '>' + c + '</label>';
  }).join('');
  cols.onclick = function (e) {
    var inp = e.target.closest('label');
    if (!inp) return;
    setTimeout(function () {
      var cb = inp.querySelector('input');
      inp.classList.toggle('on', cb.checked);
      visiveis = Array.prototype.slice.call(cols.querySelectorAll('input:checked'))
        .map(function (x) { return x.value; });
      desenha();
    }, 0);
  };
  document.getElementById('btcols').onclick = function () {
    cols.classList.toggle('aberto');
    this.classList.toggle('on', cols.classList.contains('aberto'));
  };

  document.getElementById('busca').oninput = function () {
    busca = this.value.toLowerCase().trim(); pagina = 0; desenha();
  };
  document.getElementById('limpar').onclick = function () {
    filtro = {}; busca = ''; pagina = 0;
    document.getElementById('busca').value = '';
    Array.prototype.forEach.call(selects.querySelectorAll('select'), function (s) { s.value = ''; });
    desenha();
  };
  document.getElementById('ant').onclick = function () { if (pagina > 0) { pagina--; desenha(); } };
  document.getElementById('prox').onclick = function () { pagina++; desenha(); };

  /* ── o filtro aplicado ────────────────────────────────────────────── */
  function filtrar() {
    return LINHAS.filter(function (l) {
      for (var col in filtro) {
        if (!filtro[col]) continue;
        if (String(l[COLS.indexOf(col)]) !== filtro[col]) return false;
      }
      if (busca) {
        var achou = false;
        for (var i = 0; i < l.length; i++) {
          if (l[i] !== null && String(l[i]).toLowerCase().indexOf(busca) >= 0) { achou = true; break; }
        }
        if (!achou) return false;
      }
      return true;
    });
  }

  function desenha() {
    var f = filtrar();
    var io = COLS.indexOf(ordem.col);
    if (io >= 0) {
      var nu = numerica(ordem.col);
      f.sort(function (a, b) {
        var x = a[io], y = b[io];
        if (x === null || x === undefined || x === '') return 1;
        if (y === null || y === undefined || y === '') return -1;
        var d = nu ? Number(x) - Number(y) : String(x).localeCompare(String(y), 'pt-BR');
        return ordem.desc ? -d : d;
      });
    }

    /* cartões: sempre sobre o que está filtrado, nunca sobre o total */
    var des = f.map(function (l) { return l[iDes]; }).filter(function (x) { return x !== null; });
    var md = des.length ? des.reduce(function (a, b) { return a + b; }, 0) / des.length : 0;
    var vv = f.reduce(function (s, l) { return s + (Number(l[iVenda]) || 0); }, 0);
    var fp = f.reduce(function (s, l) { return s + (Number(l[iFipe]) || 0); }, 0);
    document.getElementById('tiles').innerHTML =
      tile(brN(f.length), 'vendas na seleção') +
      tile((md * 100).toFixed(1).replace('.', ',') + '%', 'deságio médio') +
      tile('R$ ' + Math.round(vv).toLocaleString('pt-BR'), 'total vendido') +
      tile('R$ ' + Math.round(fp).toLocaleString('pt-BR'), 'total FIPE') +
      tile(brN(new Set(f.map(function (l) { return l[COLS.indexOf('grupo')]; })).size), 'modelos');

    document.getElementById('cnt').textContent =
      brN(f.length) + ' de ' + brN(LINHAS.length) + ' vendas';

    document.getElementById('cab').innerHTML = visiveis.map(function (c) {
      var at = ordem.col === c;
      return '<th data-c="' + c + '" class="' + (numerica(c) ? 'n' : '') + '">' + c +
        (at ? ' <span class="seta">' + (ordem.desc ? '▼' : '▲') + '</span>' : '') + '</th>';
    }).join('');

    var maxDes = Math.max.apply(null, des.concat([0.01]));
    var ini = pagina * PORPAG;
    if (ini >= f.length) { pagina = Math.max(0, Math.ceil(f.length / PORPAG) - 1); ini = pagina * PORPAG; }
    var pag = f.slice(ini, ini + PORPAG);

    document.getElementById('corpo').innerHTML = pag.map(function (l) {
      return '<tr>' + visiveis.map(function (c) {
        var i = COLS.indexOf(c), v = l[i];
        if (c === 'desagio') {
          var w = v === null ? 0 : Math.max(0, v / maxDes) * 100;
          return '<td class="des"><i style="width:' + w.toFixed(1) + '%"></i><b>' +
            fmt(v, c) + '</b></td>';
        }
        return '<td class="' + (numerica(c) ? 'n' : '') + '">' + fmt(v, c) + '</td>';
      }).join('') + '</tr>';
    }).join('');

    document.getElementById('vazio').hidden = f.length > 0;
    document.getElementById('pgt').textContent = f.length
      ? (brN(ini + 1) + '–' + brN(Math.min(ini + PORPAG, f.length)) + ' de ' + brN(f.length))
      : '';
    document.getElementById('ant').disabled = pagina === 0;
    document.getElementById('prox').disabled = ini + PORPAG >= f.length;

    Array.prototype.forEach.call(document.querySelectorAll('#cab th'), function (th) {
      th.onclick = function () {
        var c = th.dataset.c;
        if (ordem.col === c) ordem.desc = !ordem.desc;
        else { ordem.col = c; ordem.desc = true; }
        desenha();
      };
    });
  }
  function tile(v, k) {
    return '<div class="tile"><div class="v">' + v + '</div><div class="k">' + k + '</div></div>';
  }

  /* ── CSV do que está filtrado, não da base inteira ────────────────── */
  document.getElementById('csv').onclick = function () {
    var f = filtrar();
    var esc = function (v) {
      if (v === null || v === undefined) return '';
      var s = String(v);
      return /[";\\n]/.test(s) ? '"' + s.split('"').join('""') + '"' : s;
    };
    var linhas = [visiveis.join(';')].concat(f.map(function (l) {
      return visiveis.map(function (c) {
        var v = l[COLS.indexOf(c)];
        /* decimal com virgula: o Excel em pt-BR nao le ponto */
        if (c === 'desagio' && v !== null) return String((v * 100).toFixed(2)).replace('.', ',');
        if (numerica(c) && v !== null && v !== '') return String(v).replace('.', ',');
        return esc(v);
      }).join(';');
    }));
    var blob = new Blob(['\\ufeff' + linhas.join('\\r\\n')], { type: 'text/csv;charset=utf-8;' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'analitico-veiculos-' + f.length + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  desenha();
})();
</script>
</body></html>`;

fs.writeFileSync(saida, html, 'utf8');
console.log('\n  ' + path.basename(saida) + ' — ' + (html.length / 1048576).toFixed(1) + ' MB');
console.log('  ' + num(D.linhas.length) + ' linhas x ' + D.colunas.length + ' colunas' +
  ' (+ deságio derivado na tela)\n');
