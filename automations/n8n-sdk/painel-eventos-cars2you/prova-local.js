/* Provas do Painel de Eventos Cars2You, sobre a coleta local.

     node prova-local.js

   O _confere_banco.py confere o painel contra o BANCO (SQL escrito de novo).
   Aqui o painel é conferido contra o CRU que ele mesmo recebeu, e contra as
   regras: o que derruba o run, o que vira aviso, o que não pode vazar, a
   ordem dos blocos, e cada conta refeita sem as máscaras de dias. */

const fs = require('fs');
const path = require('path');
const { roda, nosLocais } = require('./_roda_no');
const injetor = require('./_aplica-modelo');
const { enxuga } = require('./_enxuga');

const AQUI = __dirname;
const semCR = (s) => s.split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
const ler = (f) => semCR(fs.readFileSync(path.join(AQUI, f), 'utf8'));
const dados = JSON.parse(fs.readFileSync(path.join(AQUI, 'dados-local.json'), 'utf8'));
const copia = (x) => JSON.parse(JSON.stringify(x));

let ok = 0;
const falhas = [];
function prova(nome, fn) {
  try { fn(); ok++; } catch (e) { falhas.push(nome + ' — ' + e.message); }
}
const igual = (a, b, o) => { if (a !== b) throw new Error((o || '') + ': ' + JSON.stringify(a) + ' ≠ ' + JSON.stringify(b)); };
const verdade = (x, o) => { if (!x) throw new Error(o || 'falso'); };
const cai = (fn, trecho) => {
  try { fn(); } catch (e) { if (trecho && e.message.indexOf(trecho) < 0) throw new Error('caiu por outro motivo: ' + e.message); return; }
  throw new Error('não caiu');
};

const quase = (a, b, o) => { if (a === null || b === null ? a !== b : Math.abs(a - b) > 1e-9) throw new Error(o + ': ' + a + ' ≠ ' + b); };
const monta = (d, arq, semMetas) => roda(arq || 'montar-painel.js', nosLocais(d, semMetas))[0].json;
const OUT = monta(dados);
const html = OUT.html;
const R0 = OUT.resumo;

/* a página como ela roda: o dado e o calcula() de dentro do <script> */
const ini = html.indexOf('<script>') + 8;
const D = JSON.parse(html.slice(html.lastIndexOf('APP(') + 4, html.lastIndexOf(',{"claro"')));
const calcula = new Function(html.slice(ini, html.indexOf('function APP(', ini)) + ' return calcula;')();
const C = (F) => calcula(D, F || {});
const T0 = C();
const bit = (m, d) => ((m >>> d) & 1) === 1;

/* ── 1. a fonte ───────────────────────────────────────────────────────── */
['montar-consultas.js', 'abas-metas.js', 'montar-painel.js', 'virar-arquivo.js'].forEach((f) => {
  prova(f + ': sem barra invertida, crase nem cifrão-chave', () => {
    const s = ler(f);
    verdade(s.indexOf(String.fromCharCode(92)) < 0, 'barra invertida');
    verdade(s.indexOf('`') < 0, 'crase');
    verdade(s.indexOf('${') < 0, 'cifrão-chave');
  });
  prova(f + ': n8n/ é o nó enxuto de hoje', () => igual(ler(path.join('n8n', f)), enxuga(ler(f)), 'enxuto desatualizado'));
});
prova('bloco TEMA igual ao que o injetor produziria', () => verdade(ler('montar-painel.js').indexOf(injetor.blocoTema) >= 0));
prova('bloco LOGOS igual ao que o injetor produziria', () => verdade(ler('montar-painel.js').indexOf(injetor.blocoLogos) >= 0));
/* o script da página leva calcula() e APP() pelo toString(), com os
   comentários junto, e o enxuto não tem: o que tem que ser igual é o resto */
const ENX = monta(dados, 'n8n/montar-painel.js');
const semBytes = (r) => JSON.stringify(Object.assign({}, r, { bytes_html: 0 }));
const dadoDe = (h) => h.slice(h.lastIndexOf('APP(') + 4);
prova('nó enxuto: mesmo resumo', () => igual(semBytes(ENX.resumo), semBytes(R0)));
prova('nó enxuto: mesma marcação fora do script', () => igual(ENX.html.split('<script>')[0], html.split('<script>')[0]));
prova('nó enxuto: mesmo dado embutido', () => { igual(dadoDe(ENX.html), dadoDe(html)); verdade(dadoDe(html).length > 1e6); });
/* o Montar Painel DIVIDIDO para o n8n (_divide.js): Peças do Tema + Peças da
   Página + o resto — o mesmo HTML e o mesmo resumo do nó inteiro, e cada
   pedaço abaixo do teto de uma chamada da API */
prova('dividido: os três nós do n8n dão o mesmo HTML e o mesmo resumo do Montar Painel inteiro', () => {
  const tema = roda('n8n/pecas-tema.js', {});
  const pag = roda('n8n/pecas-pagina.js', {});
  const div = roda('n8n/montar-painel-n8n.js', Object.assign(nosLocais(dados), { 'Peças do Tema': tema, 'Peças da Página': pag }))[0].json;
  igual(div.html, ENX.html, 'html');
  igual(semBytes(div.resumo), semBytes(ENX.resumo), 'resumo');
  ['pecas-tema.js', 'pecas-pagina.js', 'montar-painel-n8n.js'].forEach((f) => {
    const t = ler(path.join('n8n', f));
    verdade(Buffer.byteLength(t) <= 56 * 1024, f + ' acima de 56 KB');
    verdade(t.indexOf(String.fromCharCode(92)) < 0 && t.indexOf('`') < 0 && t.indexOf('${') < 0, f + ': caractere que quebra o literal');
  });
});

/* ── 2. as consultas ──────────────────────────────────────────────────── */
const itens = roda('montar-consultas.js');
const meta = itens[0].json.meta;
prova('uma consulta por parte de cada tabela', () => {
  const n = Object.keys(meta.partes).reduce((s, k) => s + meta.partes[k], 0);
  igual(itens.length, n, 'itens');
});
prova('toda consulta é um pacote só (COUNT + JSON_ARRAYAGG), sem função de janela', () => itens.forEach((i) => {
  verdade(i.json.sql.indexOf('SELECT COUNT(*) AS total, JSON_ARRAYAGG(JSON_ARRAY(') === 0, i.json.queryName);
  verdade(i.json.sql.toUpperCase().indexOf('OVER(') < 0 && i.json.sql.toUpperCase().indexOf('OVER (') < 0, i.json.queryName);
}));
prova('o recorte usa os seis canais, 30 dias e o piso em hora de Brasília', () => {
  igual(meta.wls.join(','), '4,7,43,48,62,65');
  igual(meta.dias, 30);
  verdade(itens.every((i) => i.json.sql.indexOf("finish_date_event >= '" + meta.piso + "'") >= 0 || ['canais', 'logins', 'lojas'].indexOf(i.json.tabela) >= 0 ||
    i.json.tabela.indexOf('mes_') === 0),
    'piso fora de alguma consulta de evento');
  verdade(itens.every((i) => i.json.sql.indexOf('NOW()') < 0 && i.json.sql.indexOf('CURDATE()') < 0), 'NOW/CURDATE no SQL');
});
prova('as partes cortam pelo resto do id e cobrem 0..n-1', () => Object.keys(meta.partes).forEach((k) => {
  const n = meta.partes[k];
  /* as do mensal cortam por mês: provadas no bloco 6 */
  if (n === 1 || k.indexOf('mes_') === 0) return;
  for (let p = 0; p < n; p++) {
    const it = itens.find((i) => i.json.queryName === k + '_p' + p);
    verdade(it && it.json.sql.indexOf(', ' + n + ') = ' + p) >= 0, k + '_p' + p);
  }
}));

/* ── 3. o que derruba o run, e o que vira aviso ───────────────────────── */
prova('pacote com uma linha a menos derruba o run', () => {
  const d = copia(dados);
  const i = d.consultas.findIndex((x) => x.json.queryName === 'negs_p3');
  const sc = d.mcp[i].json.structuredContent;
  const li = JSON.parse(sc.rows[0][1]);
  li.pop();
  sc.rows[0][1] = JSON.stringify(li);
  cai(() => monta(d), 'Pacote incompleto');
});
prova('parte que falta derruba o run', () => {
  const d = copia(dados);
  const i = d.consultas.findIndex((x) => x.json.queryName === 'acessos_p2');
  d.consultas.splice(i, 1);
  d.mcp.splice(i, 1);
  cai(() => monta(d), 'acessos chegou em');
});
prova('resposta a menos do MCP derruba o run', () => {
  const d = copia(dados);
  d.mcp.pop();
  cai(() => monta(d), 'respostas para');
});
[['ausente', []], ['com erro do HTTP', [{ json: { error: { message: '404' } } }]],
 ['truncada', [{ json: { consultores: ['A'], cnpj: { '11111111000111': 0 }, gerado_em: '2026-10-28' } }]]].forEach((c) => {
  prova('carteira ' + c[0] + ': o painel sai sem o filtro de responsável, com aviso', () => {
    const d = copia(dados);
    d.carteira = c[1];
    const o = monta(d);
    verdade(o.resumo.carteira.sem_carteira, 'sem_carteira vazio');
    verdade(o.resumo.avisos.some((a) => a.indexOf('sem o filtro de responsável') >= 0), 'aviso');
    const Dd = JSON.parse(o.html.slice(o.html.lastIndexOf('APP(') + 4, o.html.lastIndexOf(',{"claro"')));
    igual(Dd.consultores.length, 0, 'consultores');
    verdade(Dd.lojas.every((l) => l[2] === -1), 'loja com responsável');
  });
});
prova('carteira velha (mais de 7 dias) sai com aviso da idade', () => {
  verdade(R0.avisos.some((a) => a.indexOf('carteira comercial de') === 0 && a.indexOf(' dias') > 0), 'sem aviso de idade');
});

/* ── 4. o HTML ────────────────────────────────────────────────────────── */
prova('abre no ESCURO, com título e nome da página', () => {
  verdade(html.indexOf('<html lang="pt-BR" data-tema="escuro">') >= 0);
  verdade(html.indexOf('<title>Painel de Eventos — Cars2You</title>') >= 0);
  verdade(html.indexOf('<h1>Painel de Eventos</h1>') >= 0);
});
prova('offline: nenhuma folha, fonte ou script de fora', () => {
  verdade(html.indexOf('<link') < 0, '<link');
  verdade(html.indexOf('src="http') < 0, 'src externo');
  verdade(html.indexOf('@import') < 0, '@import');
});
prova('CNPJ não vaza para a página', () => {
  const raw = [];
  dados.consultas.forEach((q, i) => {
    if (q.json.tabela !== 'lojas') return;
    JSON.parse(dados.mcp[i].json.structuredContent.rows[0][1]).forEach((l) => { if (l[3]) raw.push(String(l[3])); });
  });
  verdade(raw.length > 1000, 'poucos CNPJ na coleta');
  const vaza = raw.filter((c) => c.length >= 11 && html.indexOf(c) >= 0);
  igual(vaza.length, 0, 'CNPJ na página');
});
prova('ordem dos blocos: cartões, veículos ativos, lojistas, tabela, glossário, rodapé', () => {
  const pos = ['aria-label="Eventos ativos no dia"', 'id="g-ativos"', 'id="g-lojistas"', 'id="th-veic"', 'id="gloss"', 'class="rodape"']
    .map((m) => html.indexOf(m));
  verdade(pos.every((p, i) => p > 0 && (!i || p > pos[i - 1])), JSON.stringify(pos));
});
prova('gaveta na ordem do pedido: whitelabel, comitente, evento, responsável, data', () => {
  const pos = ['id="f-wl"', 'id="f-comit"', 'id="f-ev"', 'id="f-resp"', 'id="f-de"', 'id="f-ate"', 'id="limpar"'].map((m) => html.indexOf(m));
  verdade(pos.every((p, i) => p > 0 && (!i || p > pos[i - 1])), JSON.stringify(pos));
});
prova('indicador e Todos/Novos moram no topo, antes dos big numbers, nessa ordem', () => {
  const corpo = html.split('<script>')[0].split('<body>')[1];
  const ind = corpo.indexOf('class="barra-ind"');
  const kpis = corpo.indexOf('aria-label="Eventos ativos no dia"');
  const a = corpo.indexOf('id="seg-kpi"');
  const b = corpo.indexOf('id="seg-modo"');
  verdade(ind > 0 && a > ind && b > a && b < kpis, 'topo');
  verdade(corpo.indexOf('ctrl-graf') < 0, 'sobrou controle no gráfico');
  igual(corpo.split('id="seg-kpi"').length + corpo.split('id="seg-modo"').length, 4, 'um seletor de cada');
});
prova('glossário fora de qualquer <section>', () => {
  const antes = html.slice(0, html.indexOf('id="gloss"'));
  igual(antes.split('<section').length, antes.split('</section>').length, 'sections');
});
prova('todo termo do glossário é de regra vigente (sem "antes era")', () => {
  verdade(D.glossario.length >= 20);
  verdade(D.glossario.every((g) => g[1].toLowerCase().indexOf('antes era') < 0 && g[1].indexOf('desde ') < 0));
});

/* ── 5. as contas, refeitas do cru ────────────────────────────────────── */
prova('máscaras sem bit depois de hoje', () => {
  const lim = Math.pow(2, D.hoje + 1);
  verdade(D.acessos.every((a) => a[2] >= 0 && a[2] < lim), 'acessos');
  verdade(D.ofertas.every((o) => o[4] >= 0 && o[4] < lim), 'ofertas');
  verdade(D.logins.every((g) => g[2] > 0 && g[2] < lim), 'logins');
});
prova('veículos ativos por dia refeitos sem máscara (todos os dias)', () => {
  for (let d = 0; d <= D.hoje; d++) {
    const vs = {};
    D.negs.forEach((n) => { const e = D.eventos[n[0]]; if (e.d0 <= d && d <= e.d1) vs[n[1]] = 1; });
    igual(T0.dias[d].ativos, Object.keys(vs).length, 'dia ' + d);
    const nv = Object.keys(vs).filter((v) => D.veics[v][5] === d).length;
    igual(T0.dias[d].novos, nv, 'novos dia ' + d);
  }
});
prova('cada dia: novos ≤ ativos, e acesso/oferta/venda ≤ a base deles', () => T0.dias.forEach((g) => {
  verdade(g.novos <= g.ativos && g.acesso <= g.ativos && g.oferta <= g.ativos && g.venda <= g.ativos, 'dia ' + g.d);
  verdade(g.acesso_n <= g.novos && g.oferta_n <= g.novos && g.venda_n <= g.novos, 'novos dia ' + g.d);
  verdade(g.venda <= g.oferta, 'venda sem oferta no dia ' + g.d);
}));
prova('ofertaram e logaram no período refeitos do cru', () => {
  const of = {};
  D.ofertas.forEach((o) => { if (o[4]) of[o[1]] = 1; });
  igual(T0.tot_lojistas.ofertaram, Object.keys(of).length, 'ofertaram');
  const lg = {};
  D.logins.forEach((g) => { lg[g[0]] = 1; });
  igual(T0.tot_lojistas.logaram, Object.keys(lg).length, 'logaram');
});
/* os status em funil (Thomas, 06/11): Com oferta contém VMV atingido, que
   contém Vendidos; sem oferta (sem cartão) + com oferta = veículos; e os
   veículos do cartão são os ativos do gráfico no mesmo dia — em TODO dia */
const funil = (k, o) => {
  igual(k.sem_oferta + k.com_oferta, k.veiculos, o + ' sem oferta + com oferta');
  verdade(k.vendidos <= k.vmv && k.vmv <= k.com_oferta, o + ' vendidos <= VMV <= com oferta');
  verdade(k.removidos <= k.veiculos, o + ' removidos');
};
prova('cartões: o funil fecha, e as partes de cada cartão somam o cartão', () =>
  [{}, { ate: '22' }, { wl: '4' }, { ate: '10', wl: '7' }].forEach((F) => {
    const k = C(F).kpi;
    const o = JSON.stringify(F);
    funil(k, o);
    igual(k.co_abertos + k.co_analise + k.co_encerrados, k.com_oferta, o + ' partes do com oferta');
    igual(k.vm_abertos + k.vm_analise + k.vm_encerrados, k.vmv, o + ' partes do VMV');
    igual(k.aguardando + k.vendido, k.vendidos, o + ' partes dos vendidos');
    igual(k.rem_cancelado + k.rem_suspenso, k.removidos, o + ' partes dos removidos');
  }));
prova('cartões: os veículos do dia são os ativos do gráfico, em todo dia da janela', () => {
  for (let d = 0; d <= D.hoje; d++) {
    const R = C({ ate: String(d) });
    igual(R.kpi.veiculos, R.dias[R.dias.length - 1].ativos, 'dia ' + d);
    funil(R.kpi, 'dia ' + d);
  }
});
prova('cartões = gráfico: com oferta e vendidos são os do último ponto, em todo dia, com canal, comitente e evento', () => {
  const fs = [{}, { wl: '4' }, { wl: '7' }, { comit: String(T0.por_comit[0].comit) }, { ev: String(T0.por_evento[0].ev) }];
  fs.forEach((F) => {
    for (let d = 0; d <= D.hoje; d++) {
      const R = C(Object.assign({ ate: String(d) }, F));
      const g = R.dias[R.dias.length - 1];
      igual(R.kpi.com_oferta, g.oferta, JSON.stringify(F) + ' dia ' + d + ' com oferta');
      igual(R.kpi.vendidos, g.venda, JSON.stringify(F) + ' dia ' + d + ' vendidos');
    }
  });
});
prova('cartões: o funil refeito do cru, sem o calcula', () => [D.hoje, 22, 10].forEach((ref) => {
  const melhor = {};
  D.negs.forEach((n, i) => {
    const e = D.eventos[n[0]];
    if (!(e.d0 <= ref && ref <= e.d1)) return;
    const j = melhor[n[1]];
    if (j === undefined || e.fim > D.eventos[D.negs[j][0]].fim || (e.fim === D.eventos[D.negs[j][0]].fim && i > j)) melhor[n[1]] = i;
  });
  /* lance até o dia: o de antes do piso vem sem bit e conta */
  const maior = {};
  D.ofertas.forEach((o) => {
    if (o[4] && (o[4] % Math.pow(2, ref + 1)) === 0) return;
    maior[o[0]] = Math.max(maior[o[0]] === undefined ? -1 : maior[o[0]], o[3]);
  });
  const diaVenda = {};
  D.vendas.forEach((s) => { diaVenda[s[0]] = s[3]; });
  const c = { sem_oferta: 0, com_oferta: 0, vmv: 0, vendidos: 0, removidos: 0 };
  Object.keys(melhor).forEach((v) => {
    const i = melhor[v];
    const n = D.negs[i];
    const vendeu = [2, 3, 7].indexOf(n[3]) >= 0 && !(diaVenda[i] > ref);
    if (vendeu) c.vendidos++;
    if (n[3] === 8 || n[3] === 10) c.removidos++;
    if (maior[i] === undefined && !vendeu) { c.sem_oferta++; return; }
    c.com_oferta++;
    if (vendeu || (n[4] !== null && maior[i] >= n[4])) c.vmv++;
  });
  const k = C({ ate: String(ref) }).kpi;
  Object.keys(c).forEach((f) => igual(k[f], c[f], 'dia ' + ref + ' ' + f));
}));
prova('gráfico: o acumulado no evento refeito do cru, sem o calcula', () => [D.hoje, 22, 10, 0].forEach((d) => {
  const ate = Math.pow(2, d + 1);
  const ult = {};
  D.negs.forEach((n, i) => {
    const e = D.eventos[n[0]];
    if (!(e.d0 <= d && d <= e.d1)) return;
    const j = ult[n[1]];
    if (j === undefined || e.fim > D.eventos[D.negs[j][0]].fim || (e.fim === D.eventos[D.negs[j][0]].fim && i > j)) ult[n[1]] = i;
  });
  const ac = {};
  const of = {};
  const ve = {};
  D.acessos.forEach((a) => { if (a[2] % ate) ac[a[0]] = 1; });
  D.ofertas.forEach((o) => { if (!o[4] || o[4] % ate) of[o[0]] = 1; });
  D.vendas.forEach((s) => { if (s[3] <= d) { ve[s[0]] = 1; of[s[0]] = 1; } });
  const c = { acesso: 0, oferta: 0, venda: 0 };
  Object.keys(ult).forEach((v) => {
    const i = ult[v];
    if (ac[i]) c.acesso++;
    if (of[i]) c.oferta++;
    if (ve[i]) c.venda++;
  });
  const g = T0.dias[d];
  Object.keys(c).forEach((f) => igual(g[f], c[f], 'dia ' + d + ' ' + f));
}));
const CAMPOS_K = ['eventos', 'veiculos', 'sem_oferta', 'com_oferta', 'co_abertos', 'co_analise', 'co_encerrados',
  'vmv', 'vm_abertos', 'vm_analise', 'vm_encerrados', 'vendidos', 'aguardando', 'vendido', 'valor',
  'removidos', 'rem_cancelado', 'rem_suspenso'];
prova('comitentes: cada cartão é igual aos cartões do topo com aquele comitente filtrado', () => {
  verdade(T0.por_comit.length >= 5, 'poucos comitentes hoje: ' + T0.por_comit.length);
  T0.por_comit.forEach((c) => {
    const k = C({ comit: String(c.comit) }).kpi;
    CAMPOS_K.forEach((f) => igual(c[f], k[f], D.comitentes[c.comit] + ' ' + f));
  });
});
prova('comitentes: num dia passado e com filtro de canal, também', () => [[{ ate: '22' }], [{ wl: '4' }], [{ ate: '10', wl: '7' }]].forEach((p) => {
  const base = C(p[0]);
  verdade(base.por_comit.length > 0, JSON.stringify(p[0]));
  base.por_comit.forEach((c) => {
    const k = C(Object.assign({ comit: String(c.comit) }, p[0])).kpi;
    CAMPOS_K.forEach((f) => igual(c[f], k[f], JSON.stringify(p[0]) + ' ' + D.comitentes[c.comit] + ' ' + f));
  });
}));
const CAMPOS_DIA = ['ativos', 'novos', 'acesso', 'oferta', 'venda', 'acesso_n', 'oferta_n', 'venda_n'];
const ultimos = (r) => [r.dias[r.dias.length - 1], r.dias.length > 1 ? r.dias[r.dias.length - 2] : null];
prova('rosca: o indicador do dia e do dia anterior de cada comitente são os do gráfico filtrado por ele', () =>
  [{}, { ate: '22' }, { resp: '0' }, { wl: '7', de: '10' }].forEach((F) => {
    C(F).por_comit.forEach((c) => {
      const u = ultimos(C(Object.assign({ comit: String(c.comit) }, F)));
      CAMPOS_DIA.forEach((f) => {
        igual(c.dia[f], u[0][f], JSON.stringify(F) + ' ' + D.comitentes[c.comit] + ' ' + f);
        igual(c.dia_ant[f], u[1][f], JSON.stringify(F) + ' ' + D.comitentes[c.comit] + ' anterior ' + f);
      });
    });
  }));
prova('semana: cada ponto da linha do cartão é o dia do gráfico filtrado pelo comitente', () =>
  [{}, { ate: '22' }, { resp: '0' }, { ate: '3' }, { cat: 'P' }].forEach((F) => {
    C(F).por_comit.forEach((c) => {
      igual(c.hist.length, 7, 'sete pontos');
      const ref = F.ate === undefined ? D.hoje : Number(F.ate);
      /* o gráfico com De = 0 cobre os 13 dias; dia antes da janela é null */
      const r = C(Object.assign({}, F, { comit: String(c.comit), de: '0' }));
      c.hist.forEach((g, i) => {
        const d = ref - 6 + i;
        if (d < 0) { igual(g, null, 'antes da janela'); return; }
        igual(g.d, d, 'dia');
        CAMPOS_DIA.concat(['mt']).forEach((f) => igual(g[f], r.dias[d][f], JSON.stringify(F) + ' ' + D.comitentes[c.comit] + ' dia ' + d + ' ' + f));
      });
      igual(c.dia, c.hist[6], 'o dia é o último da linha');
      igual(c.dia_ant, c.hist[5], 'o anterior é o penúltimo');
    });
  }));
prova('categoria: as quatro somam o total, no gráfico e nos cartões do dia', () => {
  const cats = ['L', 'P', 'E', 'N'];
  [D.hoje, 22, 5].forEach((d) => CAMPOS_DIA.concat(['mt']).forEach((f) => {
    let soma = 0;
    cats.forEach((k) => { soma += C({ cat: k }).dias[d][f]; });
    igual(soma, T0.dias[d][f], 'dia ' + d + ' ' + f);
  }));
  ['veiculos', 'com_oferta', 'vmv', 'vendidos', 'removidos'].forEach((f) => {
    let soma = 0;
    cats.forEach((k) => { soma += C({ cat: k }).kpi[f]; });
    igual(soma, T0.kpi[f], 'cartão ' + f);
  });
});
prova('categoria: o filtro só deixa veículos dela, nos cartões, nos comitentes e na tabela', () => ['P', 'N'].forEach((k) => {
  const R = C({ cat: k });
  R.veiculos.forEach((v) => igual(D.veics[v.v][7], k, 'tabela'));
  R.por_comit.forEach((c) => igual(c.veiculos, C({ cat: k, comit: String(c.comit) }).kpi.veiculos, D.comitentes[c.comit]));
}));
prova('indicador nasce em Com oferta', () => {
  verdade(html.indexOf('data-v="oferta" aria-pressed="true"') > 0, 'botão');
  verdade(html.indexOf("let kpi = 'oferta'") > 0, 'estado');
});
prova('lista de eventos: cada linha é igual aos cartões do topo com aquele evento filtrado', () =>
  [{}, { ate: '22' }, { wl: '4' }].forEach((F) => {
    const lista = C(F).por_evento;
    verdade(lista.length > 0, JSON.stringify(F));
    lista.forEach((c) => {
      const r = C(Object.assign({ ev: String(c.ev) }, F));
      CAMPOS_K.forEach((f) => igual(c[f], r.kpi[f], JSON.stringify(F) + ' ' + D.eventos[c.ev].nome + ' ' + f));
      const u = ultimos(r);
      CAMPOS_DIA.forEach((f) => {
        igual(c.dia[f], u[0][f], D.eventos[c.ev].nome + ' ' + f);
        igual(c.dia_ant[f], u[1][f], D.eventos[c.ev].nome + ' anterior ' + f);
      });
    });
  }));
prova('lista de eventos: segue o comitente escolhido, e não some ao escolher um evento', () => {
  const c = T0.por_comit[0].comit;
  const r = C({ comit: String(c) });
  verdade(r.por_evento.length > 0 && r.por_evento.every((e) => D.eventos[e.ev].comits.indexOf(c) >= 0), 'só os eventos dele');
  r.por_evento.forEach((e) => {
    const k = C({ comit: String(c), ev: String(e.ev) }).kpi;
    CAMPOS_K.forEach((f) => igual(e[f], k[f], D.eventos[e.ev].nome + ' ' + f));
  });
  igual(JSON.stringify(C({ ev: String(T0.por_evento[0].ev) }).por_evento), JSON.stringify(T0.por_evento), 'filtro de evento');
});
prova('lista de eventos: retrátil, o <details> é o cartão e nasce fechado', () => {
  const corpo = html.split('<script>')[0];
  verdade(corpo.indexOf('<details class="cartao gloss lista-ev" id="dobra-ev"><summary class="cartao-topo">') > 0, 'details');
  verdade(corpo.indexOf('id="dobra-ev" open') < 0, 'nasce aberto');
  verdade(corpo.indexOf('id="g-ev"') > corpo.indexOf('id="dobra-ev"'), 'a lista mora dentro');
});
prova('lista de eventos: só eventos ativos no dia, e todos eles', () => {
  const ativos = D.eventos.map((e, i) => (e.d0 <= D.hoje && D.hoje <= e.d1 ? i : -1)).filter((i) => i >= 0);
  igual(T0.por_evento.length, T0.kpi.eventos, 'quantos');
  verdade(T0.por_evento.every((e) => ativos.indexOf(e.ev) >= 0), 'evento fora do dia');
});
prova('comitentes: escolher um não muda a lista (o escolhido não some, os outros ficam)', () => {
  const c = T0.por_comit[0].comit;
  igual(JSON.stringify(C({ comit: String(c) }).por_comit), JSON.stringify(T0.por_comit));
});
prova('comitentes: só quem tem evento ativo no dia, do maior para o menor', () => {
  verdade(T0.por_comit.every((c) => c.veiculos > 0 && c.eventos > 0), 'cartão vazio');
  verdade(T0.por_comit.every((c, i) => !i || T0.por_comit[i - 1].veiculos >= c.veiculos), 'ordem');
});
prova('comitentes: logo abaixo dos big numbers, a lista de eventos, e então o gráfico', () => {
  const a = html.indexOf('aria-label="Eventos ativos no dia"');
  const b = html.indexOf('id="g-comit"');
  const c = html.indexOf('id="g-ev"');
  verdade(a > 0 && b > a && c > b && html.indexOf('id="g-ativos"') > c);
  /* só a marcação: o script da página tem o texto do cartão (regra 12) */
  verdade(html.split('<script>')[0].indexOf('class="cartao comit') < 0, 'cartão pronto no HTML: tem que nascer do dado');
  verdade(html.indexOf('.g-comit{display:grid;gap:var(--gap);grid-template-columns:repeat(3,minmax(0,1fr))}') >= 0, 'três por linha');
});
prova('cartões: os veículos dos eventos de hoje são os ativos do último dia',() => igual(T0.kpi.veiculos, T0.dias[D.hoje].ativos));
prova('o responsável reparte as lojas: a soma dos consultores + não distribuído dá o total', () => {
  ['logaram', 'acessaram', 'ofertaram', 'compraram'].forEach((k) => {
    let s = C({ resp: 'nd' }).tot_lojistas[k];
    D.consultores.forEach((c, i) => { s += C({ resp: String(i) }).tot_lojistas[k]; });
    igual(s, T0.tot_lojistas[k], k);
  });
});
prova('o responsável não mexe nos cartões nem nas barras', () => {
  const r = C({ resp: '0' });
  igual(JSON.stringify(r.kpi), JSON.stringify(T0.kpi), 'kpi');
  igual(r.dias.map((g) => g.ativos + '/' + g.novos).join(), T0.dias.map((g) => g.ativos + '/' + g.novos).join(), 'barras');
});
prova('De = Até = d repete o dia d do período inteiro', () => [0, 7, 15, 22, D.hoje].forEach((d) => {
  const r = C({ de: String(d), ate: String(d) });
  ['logaram', 'acessaram', 'ofertaram', 'compraram'].forEach((k) => igual(r.tot_lojistas[k], T0.lojistas[d][k], k + ' dia ' + d));
  ['ativos', 'novos', 'acesso', 'oferta', 'venda'].forEach((k) => igual(r.dias[0][k], T0.dias[d][k], k + ' dia ' + d));
}));
prova('De > Até é o mesmo período invertido', () => igual(JSON.stringify(C({ de: '20', ate: '10' }).dias), JSON.stringify(C({ de: '10', ate: '20' }).dias)));
prova('filtro de evento: os veículos do período são os veículos do evento', () => [0, 5, 40, 120, D.eventos.length - 1].forEach((i) => {
  const vs = {};
  D.negs.forEach((n) => { if (n[0] === i) vs[n[1]] = 1; });
  igual(C({ ev: String(i) }).veiculos_periodo, Object.keys(vs).length, 'evento ' + D.eventos[i].nome);
}));
prova('filtro de canal: só veículos de eventos que alvejam o canal', () => D.canais.forEach((c) => {
  const vs = {};
  D.negs.forEach((n) => { if (D.eventos[n[0]].wls.indexOf(c[0]) >= 0) vs[n[1]] = 1; });
  igual(C({ wl: String(c[0]) }).veiculos_periodo, Object.keys(vs).length, 'canal ' + c[0]);
}));
prova('filtro de comitente: os veículos são os que ele anuncia', () => D.comitentes.forEach((c, i) => {
  const vs = {};
  D.negs.forEach((n) => { if (n[2] === i) vs[n[1]] = 1; });
  igual(C({ comit: String(i) }).veiculos_periodo, Object.keys(vs).length, c);
}));
prova('tabela: uma linha por veículo do período', () => {
  igual(T0.veiculos.length, T0.veiculos_periodo);
  const vistos = {};
  T0.veiculos.forEach((r) => { verdade(!vistos[r.v], 'repetido'); vistos[r.v] = 1; });
});
prova('tabela: lances e maior oferta refeitos do cru', () => {
  const lances = {};
  const maior = {};
  D.ofertas.forEach((o) => {
    const v = D.negs[o[0]][1];
    lances[v] = (lances[v] || 0) + o[2];
    maior[v] = Math.max(maior[v] || 0, o[3]);
  });
  T0.veiculos.forEach((r) => {
    igual(r.lances, lances[r.v] || 0, 'lances ' + r.v);
    igual(r.maior, maior[r.v] === undefined ? null : maior[r.v], 'maior ' + r.v);
  });
});
prova('venda só em 2, 3 ou 7, e o comprador é a loja da oferta vencedora', () => {
  T0.veiculos.forEach((r) => { if (r.comprador !== null) verdade([2, 3, 7].indexOf(r.status) >= 0, 'status ' + r.status); });
  const vendidos = T0.veiculos.filter((r) => r.comprador !== null).length;
  verdade(vendidos > 100, 'poucas vendas na tabela: ' + vendidos);
});

/* ── 6. a aba Mensal (Thomas, 06/11) ─────────────────────────────────── */
const calculaMes = new Function(html.slice(ini, html.indexOf('function APP(', ini)) + ' return calculaMes;')();
const CM = (F) => calculaMes(D, F || {});
const M0 = CM();
const MD = D.mes;
const NM = MD.meses.length;
prova('mensal: 12 meses seguidos, terminando no mês de agora', () => {
  igual(NM, 12, 'meses');
  igual(MD.meses[NM - 1], D.agora.slice(0, 7), 'último mês');
  for (let m = 1; m < NM; m++) {
    const a = MD.meses[m - 1];
    const prox = Number(a.slice(5, 7)) === 12 ? (Number(a.slice(0, 4)) + 1) + '-01' : a.slice(0, 5) + String(Number(a.slice(5, 7)) + 1).padStart(2, '0');
    igual(MD.meses[m], prox, 'mês ' + m);
  }
});
prova('mensal: uma consulta por mês em mes_ev e mes_dia, três por mês em mes_lojd, com os limites do mês e o índice na 1ª coluna', () =>
  [['mes_ev', 1], ['mes_dia', 1], ['mes_lojd', 3]].forEach((q) => {
    const t = q[0];
    igual(meta.partes[t], 12 * q[1], t);
    for (let p = 0; p < 12 * q[1]; p++) {
      const it = itens.find((i) => i.json.queryName === t + '_p' + p);
      verdade(it, t + '_p' + p);
      const m = Math.floor(p / q[1]);
      const ini0 = meta.meses[m] + '-01 00:00:00';
      verdade(it.json.sql.indexOf("finish_date_event >= '" + ini0 + "'") >= 0, t + '_p' + p + ' sem o início do mês');
      verdade(it.json.sql.indexOf('JSON_ARRAY(' + m + ', ') >= 0, t + '_p' + p + ' sem o índice do mês');
      igual(it.json.cols[0], 'm', t + ' 1ª coluna');
      if (q[1] > 1) verdade(it.json.sql.indexOf('MOD(e.id, ' + q[1] + ') = ' + (p % q[1])) >= 0, t + '_p' + p + ' sem a parte');
    }
  }));
prova('mensal: evento com mais de 31 dias de ofertas fica fora de toda consulta do mensal', () =>
  itens.filter((i) => ['mes_ev', 'mes_dia', 'mes_lojd', 'mes_eventos', 'mes_comitentes'].indexOf(i.json.tabela) >= 0).forEach((i) =>
    verdade(i.json.sql.indexOf('DATEDIFF(e.finish_date_event, e.start_date_offer) <= 31') >= 0, i.json.queryName)));
/* o cru de uma tabela, juntando as partes */
const cruDe = (t) => {
  const out = [];
  dados.consultas.forEach((q, i) => {
    if (q.json.tabela === t) JSON.parse(dados.mcp[i].json.structuredContent.rows[0][1]).forEach((r) => out.push(r));
  });
  return out;
};
const CRU_EVT = cruDe('mes_eventos').sort((a, b) => (a[4] < b[4] ? 1 : a[4] > b[4] ? -1 : Number(b[0]) - Number(a[0])));
/* os eventos ativos de volta (Thomas, 19/11): nenhuma consulta corta por
   status do evento; a situação vem no mes_eventos e a página filtra */
prova('mensal: eventos ativos de volta — nenhuma consulta corta pelo status do evento, e a situação vem no mes_eventos', () => {
  itens.forEach((i) => verdade(i.json.sql.indexOf('e.status = 0') < 0, i.json.queryName));
  verdade(itens.find((i) => i.json.tabela === 'mes_eventos').json.cols.indexOf('st') > 0, 'situação no mes_eventos');
  const fins = MD.eventos.filter((e) => e[7]).length;
  verdade(fins > 0 && fins < MD.eventos.length, 'ativos e finalizados na lista: ' + fins + ' de ' + MD.eventos.length);
  /* finalizado = status 0 e o fim já passou, refeito do cru */
  igual(CRU_EVT.length, MD.eventos.length, 'eventos');
  MD.eventos.forEach((e, i) => {
    const r = CRU_EVT[i];
    igual(e[0], String(r[1]).trim(), 'o evento ' + i);
    /* o "agora" da coleta, como a página: o meta.agora_br é o de hoje e
       desanda quando um evento fecha depois da coleta (24/11, KOVI 20/11) */
    igual(e[7], Number(r[2]) === 0 && r[4] < D.agora ? 1 : 0, 'situação de ' + e[0]);
  });
});
/* os status do sistema no mensal (Thomas, 17/11): cinco grupos que não se
   cruzam e somam os veículos, cada um a soma das partes do pé do cartão */
const statusMes = (g, o) => {
  igual(g.st_ativo + g.analise + g.vendidos + g.nao_vendidos + g.removidos, g.veiculos, o + ' os cinco status somam os veículos');
  igual(g.an_comprador + g.an_vendedor, g.analise, o + ' partes do em análise');
  igual(g.aguardando + g.vendido, g.vendidos, o + ' partes dos vendidos');
  igual(g.sem_ofertas + g.rejeitados + g.venda_cancelada + g.outros, g.nao_vendidos, o + ' partes dos não vendidos');
  igual(g.suspensos + g.cancelados, g.removidos, o + ' partes dos removidos');
  verdade(g.vendidos <= g.com_oferta && g.com_oferta <= g.veiculos, o + ' vendidos <= com oferta <= veículos');
};
prova('mensal: em todo mês os status somam, o gráfico é o cartão, e os novos cabem neles', () => M0.meses.forEach((g) => {
  statusMes(g, g.rot);
  igual(g.oferta, g.com_oferta, g.rot + ' gráfico com oferta = cartão');
  igual(g.venda, g.vendidos, g.rot + ' gráfico vendidos = cartão');
  verdade(g.novos <= g.veiculos && g.acesso <= g.veiculos && g.oferta <= g.veiculos && g.venda <= g.veiculos, g.rot + ' base');
  verdade(g.acesso_n <= g.novos && g.oferta_n <= g.novos && g.venda_n <= g.novos, g.rot + ' novos');
  verdade(g.veiculos > 0 && g.eventos > 0, g.rot + ' vazio');
}));
/* a posição de uma coluna na linha crua (a 1ª é o mês) */
const colDe = (t, nome) => itens.find((i) => i.json.tabela === t).json.cols.indexOf(nome);
const CRU_EV = cruDe('mes_ev');
prova('mensal: os veículos do mês são a soma do cru do mes_ev, pelo dono', () => {
  const soma = MD.meses.map(() => 0);
  CRU_EV.forEach((r) => { soma[Number(r[0])] += Number(r[colDe('mes_ev', 'd_veic')]); });
  M0.meses.forEach((g, m) => igual(g.veiculos, soma[m], g.rot));
});
prova('mensal: cada veículo num dono só — os comitentes somam o total, e cada canal é a soma dos eventos dele', () => {
  const porCom = MD.meses.map(() => 0);
  MD.comitentes.forEach((n, c) => CM({ comit: String(c) }).meses.forEach((g, m) => { porCom[m] += g.veiculos; }));
  const semCom = MD.meses.map(() => 0);
  MD.ev.forEach((r) => { if (r[2] < 0) semCom[r[0]] += r[5][0]; });
  M0.meses.forEach((g, m) => igual(porCom[m] + semCom[m], g.veiculos, g.rot + ' comitentes'));
  D.canais.forEach((c) => {
    CM({ wl: String(c[0]) }).meses.forEach((g, m) => {
      const s = MD.ev.filter((x) => x[0] === m && MD.eventos[x[1]][5].indexOf(c[0]) >= 0).reduce((t, x) => t + x[5][0], 0);
      igual(g.veiculos, s, 'canal ' + c[0] + ' ' + g.rot);
    });
  });
  /* o dono é um evento só: nenhum veículo do evento a mais que os dele */
  MD.ev.forEach((r) => verdade(r[5][0] <= r[4][0], 'dono acima do evento'));
});
prova('mensal: Total = Ativos + Finalizados em todo mês (veículos, status, valor e lojistas cabem)', () => {
  const at = CM({ sit: 'at' });
  const fi = CM({ sit: 'fin' });
  M0.meses.forEach((g, m) => {
    ['veiculos', 'novos', 'acesso', 'oferta', 'venda', 'st_ativo', 'analise', 'vendidos', 'nao_vendidos', 'removidos', 'valor', 'eventos'].forEach((f) =>
      igual(at.meses[m][f] + fi.meses[m][f], g[f], g.rot + ' ' + f));
    ['acessaram', 'ofertaram', 'compraram'].forEach((f) => verdade(Math.max(at.meses[m].lojistas[f], fi.meses[m].lojistas[f]) <= g.lojistas[f] &&
      g.lojistas[f] <= at.meses[m].lojistas[f] + fi.meses[m].lojistas[f], g.rot + ' lojistas ' + f));
  });
  /* hoje, os veículos dos eventos ativos do mês são os do cartão do Diário */
  /* o Diário com a regra do Mensal (25/11): a negociação removida não existe */
  igual(at.kpi.veiculos, C({ sem_rem: true }).kpi.veiculos, 'ativos do mês corrente = veículos dos eventos de hoje no Diário sem removidas');
});
prova('mensal: o cartão do comitente é o mês com aquele comitente filtrado, em três meses, com canal e com situação', () =>
  [{}, { mes: '10' }, { mes: '3', wl: '7' }, { sit: 'at' }].forEach((F) => {
    const r = CM(F);
    verdade(r.por_comit.length > 0, JSON.stringify(F));
    r.por_comit.forEach((c) => {
      const k = CM(Object.assign({ comit: String(c.comit) }, F)).kpi;
      ['veiculos', 'novos', 'acesso', 'oferta', 'venda', 'com_oferta', 'st_ativo', 'an_comprador', 'an_vendedor', 'aguardando', 'vendido',
        'sem_ofertas', 'rejeitados', 'venda_cancelada', 'outros', 'suspensos', 'cancelados', 'analise', 'vendidos', 'nao_vendidos',
        'removidos', 'valor', 'eventos'].forEach((f) =>
        igual(c[f], k[f], JSON.stringify(F) + ' ' + MD.comitentes[c.comit] + ' ' + f));
      igual(c.hist.length, 12, 'área de 12 meses');
      igual(c.hist[11], c.dia, 'o último ponto da área é o mês');
      igual(c.dia_ant, r.ref > 0 ? c.hist[10] : null, 'o anterior');
    });
  }));
prova('mensal: eventos do mês refeitos da lista de eventos, com situação e datas', () => {
  M0.meses.forEach((g, m) => igual(g.eventos, MD.eventos.filter((e) => e[3] <= m && m <= e[4]).length, g.rot));
  const d0 = MD.meses[11] + '-05';
  const d1 = MD.meses[11] + '-12';
  [[{ ini_de: d0 }, (e) => e[1].slice(0, 10) >= d0], [{ ini_ate: d1 }, (e) => e[1].slice(0, 10) <= d1],
    [{ fim_de: d0, fim_ate: d1 }, (e) => e[2].slice(0, 10) >= d0 && e[2].slice(0, 10) <= d1],
    [{ sit: 'fin', ini_de: d0 }, (e) => e[7] && e[1].slice(0, 10) >= d0]].forEach((p) => {
    const r = CM(p[0]);
    r.meses.forEach((g, m) => igual(g.eventos, MD.eventos.filter((e) => e[3] <= m && m <= e[4] && p[1](e)).length, JSON.stringify(p[0]) + ' ' + g.rot));
    /* e os veículos são os dos eventos que passam (pelo dono) */
    igual(r.kpi.veiculos, MD.ev.filter((x) => x[0] === 11 && p[1](MD.eventos[x[1]])).reduce((t, x) => t + x[5][0], 0), JSON.stringify(p[0]) + ' veículos');
  });
});
/* os lojistas: as lojas dos eventos que passam, juntadas — refeitas do cru
   (o texto "loja.acessou.ofertou.comprou" de cada evento) */
const CRU_LOJ = cruDe('mes_lojd');
const lojasDe = (m, passa) => {
  const t = { ac: {}, of: {}, co: {} };
  CRU_LOJ.forEach((r) => {
    if (Number(r[0]) !== m) return;
    const e = evIdxM[r[1]];
    if (!passa(e)) return;
    r[2].forEach((s) => {
      const q = String(s).split('.');
      if (parseInt(q[1] || '0', 36)) t.ac[q[0]] = 1;
      if (parseInt(q[2] || '0', 36)) t.of[q[0]] = 1;
      if (parseInt(q[3] || '0', 36)) t.co[q[0]] = 1;
    });
  });
  return [Object.keys(t.ac).length, Object.keys(t.of).length, Object.keys(t.co).length];
};
/* do id do evento (cru) para o índice da página: a ordem da página é o fim
   mais recente primeiro, e o id maior no empate */
const evIdxM = {};
CRU_EVT.forEach((r, i) => { evIdxM[r[0]] = i; });
prova('mensal: lojistas de cada recorte refeitos do cru — as lojas dos eventos que passam', () => {
  M0.meses.forEach((g, m) => {
    const x = lojasDe(m, () => true);
    igual(g.lojistas.acessaram, x[0], g.rot + ' acessaram');
    igual(g.lojistas.ofertaram, x[1], g.rot + ' ofertaram');
    igual(g.lojistas.compraram, x[2], g.rot + ' compraram');
  });
  CM({ wl: '7' }).meses.forEach((g, m) => igual(g.lojistas.ofertaram, lojasDe(m, (e) => MD.eventos[e][5].indexOf(7) >= 0)[1], 'canal 7 ' + g.rot));
  const c0 = M0.por_comit[0].comit;
  CM({ comit: String(c0) }).meses.forEach((g, m) => igual(g.lojistas.acessaram, lojasDe(m, (e) => MD.eventos[e][6].indexOf(c0) >= 0)[0], 'comitente ' + g.rot));
  CM({ sit: 'at' }).meses.forEach((g, m) => igual(g.lojistas.acessaram, lojasDe(m, (e) => !MD.eventos[e][7])[0], 'ativos ' + g.rot));
});
const mexeMes = (fn) => {
  const d = copia(dados);
  const i = d.consultas.findIndex((x) => x.json.queryName === 'mes_ev_p5');
  const sc = d.mcp[i].json.structuredContent;
  const li = JSON.parse(sc.rows[0][1]);
  fn(li);
  sc.rows[0][1] = JSON.stringify(li);
  return d;
};
const cm = (nome) => colDe('mes_ev', nome);
prova('mensal: linha cujos status não somam os veículos derruba o run', () => {
  cai(() => monta(mexeMes((li) => { li[0][cm('d_s1')] = Number(li[0][cm('d_s1')]) + 1; })), 'status nao fecham');
  cai(() => monta(mexeMes((li) => { li[0][cm('o_s1')] = Number(li[0][cm('o_s1')]) + 1; })), 'status nao fecham');
  /* vendidos diferentes dos status 2, 3 e 7 também */
  cai(() => monta(mexeMes((li) => {
    const r = li.find((x) => Number(x[cm('d_s11')]) > 0);
    r[cm('d_s11')] = Number(r[cm('d_s11')]) - 1;
    r[cm('d_s7')] = Number(r[cm('d_s7')]) + 1;
  })), 'status nao fecham');
  /* e o dono com mais veículos que o evento */
  cai(() => monta(mexeMes((li) => {
    const r = li.find((x) => Number(x[cm('d_veic')]) === Number(x[cm('o_veic')]) && Number(x[cm('d_s11')]) > 0);
    r[cm('d_veic')] = Number(r[cm('d_veic')]) + 1;
    r[cm('d_s11')] = Number(r[cm('d_s11')]) + 1;
    r[cm('o_veic')] = Number(r[cm('o_veic')]);
  })), 'e dono de mais veiculos');
});
prova('mensal: status fora do domínio vira aviso e conta em Não vendidos, como outros', () => {
  let alvo;
  const d = mexeMes((li) => {
    alvo = li.find((x) => Number(x[cm('d_s11')]) > 0 && Number(x[cm('o_s11')]) > 0);
    ['d_', 'o_'].forEach((p) => {
      alvo[cm(p + 's11')] = Number(alvo[cm(p + 's11')]) - 1;
      alvo[cm(p + 'sx')] = Number(alvo[cm(p + 'sx')]) + 1;
    });
  });
  const o = monta(d);
  verdade(o.resumo.avisos.some((a) => a.indexOf('1 veículo(s)-mês do mensal com status fora do domínio') === 0), 'sem o aviso');
  const g = o.resumo.meses[Number(alvo[0])];
  const g0 = R0.meses[Number(alvo[0])];
  igual(g.outros, 1, 'outros');
  igual(g.nao_vendidos, g0.nao_vendidos, 'não vendidos');
  verdade(!R0.avisos.some((a) => a.indexOf('fora do domínio') >= 0), 'aviso sem motivo na coleta');
});
prova('mensal: os status do Montar Consultas são os do Montar Painel, uma coluna por status em cada bloco', () => {
  const cols = itens.find((i) => i.json.tabela === 'mes_ev').json.cols;
  igual(JSON.stringify(MD.status), JSON.stringify([1, 2, 3, 7, 8, 9, 10, 11, 13, 14, 15, 18]), 'domínio');
  ['o_', 'd_'].forEach((p) => {
    MD.status.forEach((s) => verdade(cols.indexOf(p + 's' + s) > 0, 'coluna ' + p + 's' + s));
    verdade(cols.indexOf(p + 'sx') > 0, 'coluna ' + p + 'sx');
  });
});
prova('mensal: cada status do mês é a soma do cru do mes_ev, pelo dono', () => {
  const soma = MD.meses.map(() => ({}));
  CRU_EV.forEach((r) => {
    MD.status.concat(['x']).forEach((s) => { const k = 's' + s; soma[Number(r[0])][k] = (soma[Number(r[0])][k] || 0) + Number(r[cm('d_' + k)]); });
  });
  M0.meses.forEach((g, m) => {
    const t = soma[m];
    const v = (k) => t[k] || 0;
    igual(g.st_ativo, v('s1'), g.rot + ' ativos');
    igual(g.an_comprador, v('s9'), g.rot + ' em análise do comprador');
    igual(g.an_vendedor, v('s13'), g.rot + ' em análise do vendedor');
    igual(g.aguardando, v('s2') + v('s3'), g.rot + ' aguardando');
    igual(g.vendido, v('s7'), g.rot + ' vendido');
    igual(g.sem_ofertas, v('s11'), g.rot + ' sem ofertas');
    igual(g.rejeitados, v('s14') + v('s15'), g.rot + ' rejeitados');
    igual(g.venda_cancelada, v('s18'), g.rot + ' venda cancelada');
    igual(g.suspensos, v('s8'), g.rot + ' suspensos');
    igual(g.cancelados, v('s10'), g.rot + ' cancelados');
    igual(g.outros, v('sx'), g.rot + ' outros');
  });
});
prova('mensal: os seis cartões do topo, na ordem, sem VMV atingido, sem Com oferta, sem Removidos e com o Valor vendido (25/11)', () => {
  const ids = ['km-ev', 'km-at', 'km-an', 'km-vd', 'km-vr', 'km-nv'];
  const pos = ids.map((id) => html.indexOf('id="' + id + '"'));
  pos.forEach((p, j) => verdade(p > 0 && (j === 0 || p > pos[j - 1]), 'ordem em ' + ids[j]));
  verdade(html.indexOf('id="km-vm"') < 0, 'VMV atingido no mensal');
  verdade(html.indexOf('km-co') < 0, 'cartão Com oferta no mensal');
  verdade(html.indexOf('km-rm') < 0, 'cartão Removidos no mensal');
  verdade(html.indexOf('km-vd-rs') < 0, 'valor no pé do Vendidos');
  ['km-an-comp', 'km-an-vend', 'km-vd-ag', 'km-vd-vd', 'km-vr-pc', 'km-vr-dif', 'km-vr-ant', 'km-nv-sem', 'km-nv-rej', 'km-nv-vc', 'km-nv-out']
    .forEach((id) => verdade(html.indexOf('id="' + id + '"') > 0, id));
  verdade(html.indexOf('class="g4 g6" aria-label="Eventos e status no mês"') > 0, 'grade de seis');
});
/* removidos fora do Mensal (Thomas, 25/11): o SQL das três consultas do mês
   corta o 8 e o 10, e nenhum mês, comitente ou evento conta removido */
prova('mensal: removidos fora — o SQL corta 8 e 10, e nenhum mês, comitente ou evento tem removido', () => {
  ['mes_ev', 'mes_dia', 'mes_lojd'].forEach((t) => itens.filter((i) => i.json.tabela === t).forEach((i) =>
    verdade(i.json.sql.indexOf('NOT IN (8,10)') > 0, i.json.queryName + ' sem o corte')));
  M0.meses.forEach((g) => igual(g.removidos, 0, g.rot + ' removidos'));
  [{ sit: 'at' }, { sit: 'fin' }, { mes: '10' }].forEach((F) => {
    const r = CM(F);
    r.por_comit.forEach((c) => igual(c.removidos, 0, JSON.stringify(F) + ' ' + MD.comitentes[c.comit]));
    r.eventos.forEach((o) => igual(o.removidos, 0, JSON.stringify(F) + ' evento ' + MD.eventos[o.ev][0]));
  });
});
prova('mensal: mês sem parte derruba o run', () => {
  const d = copia(dados);
  const i = d.consultas.findIndex((x) => x.json.queryName === 'mes_lojd_p7');
  d.consultas.splice(i, 1);
  d.mcp.splice(i, 1);
  cai(() => monta(d), 'mes_lojd chegou em');
});
prova('mensal: o mês com buraco no access_logs vira aviso, e mês completo não', () => {
  const inc = MD.dias_acesso.filter((x) => x[0] < x[1]);
  verdade(inc.length > 0, 'a coleta tem fevereiro com 5 dias');
  verdade(R0.avisos.some((a) => a.indexOf('access_logs') >= 0), 'sem aviso');
  const d = copia(dados);
  const mt = d.consultas[0].json.meta;
  const i = d.consultas.findIndex((x) => x.json.queryName === 'mes_dias_acesso');
  const sc = d.mcp[i].json.structuredContent;
  sc.rows[0][1] = JSON.stringify(mt.meses.map((r, m) => [r, m === 11 ? Number(mt.agora_br.slice(8, 10))
    : new Date(Date.UTC(Number(r.slice(0, 4)), Number(r.slice(5, 7)), 0)).getUTCDate()]));
  sc.rows[0][0] = 12;
  verdade(!monta(d).resumo.avisos.some((a) => a.indexOf('access_logs') >= 0), 'aviso com todo mês completo');
});
prova('mensal: o Diário escondido, a situação no topo e os blocos e filtros do Mensal na página', () => {
  /* 24/11: sem as abas; o Diário segue no HTML, escondido, e a página nasce no Mensal */
  verdade(html.indexOf('id="seg-aba"') < 0, 'as abas saíram');
  verdade(html.indexOf('<div id="v-dia" hidden>') > 0 && html.indexOf('<div class="filtros" id="fil-dia" hidden>') > 0, 'Diário escondido');
  verdade(html.indexOf('<div id="v-mes">') > 0 && html.indexOf('<div class="filtros" id="fil-mes">') > 0, 'nasce no Mensal');
  ['g-comit-m', 'g-ev-m', 'cab-ev-m', 'aj-m', 'g-ativos-m', 'g-lojistas-m', 'seg-vis-at', 'seg-vis-lj', 'f-m-wl', 'f-m-comit', 'f-m-cat', 'f-m-mes', 'f-m-ev', 'seg-sit',
    'f-m-ini-de', 'f-m-ini-ate', 'f-m-fim-de', 'f-m-fim-ate', 'th-veic-m', 'tb-veic-m', 'busca-m', 'exporta-m', 'mais-veic-m'].forEach((id) => verdade(html.indexOf('id="' + id + '"') > 0, id));
  /* a ordem: cartões por comitente, tabela de eventos, os dois gráficos, a tabela de veículos */
  const pos = ['g-comit-m', 'g-ev-m', 'g-ativos-m', 'g-lojistas-m', 'tb-veic-m'].map((id) => html.indexOf('id="' + id + '"'));
  pos.forEach((p, j) => verdade(j === 0 || p > pos[j - 1], 'ordem em ' + j));
  verdade(html.indexOf('<details class="cartao gloss lista-ev" id="dobra-ev-m" open>') > 0, 'a tabela do mês nasce aberta');
  /* situação no topo, antes da gaveta: Ativos, Finalizados, Todos, nasce em Ativos */
  const sit = html.indexOf('id="seg-sit"');
  verdade(sit > 0 && sit < html.indexOf('</header>'), 'a situação no cabeçalho');
  verdade(html.indexOf('data-v="at" aria-pressed="true">Ativos</button><button type="button" data-v="fin" aria-pressed="false">Finalizados</button>' +
    '<button type="button" data-v="" aria-pressed="false">Todos</button>') > 0, 'botões da situação');
  verdade(html.indexOf('>Total</button>') < 0, 'sem Total');
  verdade(html.indexOf('type="date" id="f-m-ini-de"') > 0, 'datas como campo de data');
  ['function calculaMes(', 'function evPassaF(', 'function calculaVeicMes('].forEach((f) => verdade(html.indexOf(f) > 0, f + ' no script'));
  ['Visão Mensal', 'Situação do evento', 'Início e fim do evento', 'Tabela de eventos do mês', 'Meta do evento', 'Dias do mês', 'Tabela de veículos do mês'].forEach((t) =>
    verdade(D.glossario.some((g) => g[0] === t), 'glossário: ' + t));
  verdade(!D.glossario.some((g) => g[0] === 'Meta ajustada' || g[0] === 'Responsável' || g[0] === 'Lista de eventos'), 'glossário sem a meta ajustada e sem os termos só do Diário');
  verdade(D.glossario.every((g) => g[1].indexOf('{') < 0), 'marca sem trocar no glossário');
});

/* ── o Mensal por evento (19/11) ──────────────────────────────────────── */
const P0M = Date.UTC(Number(D.piso_dia.slice(0, 4)), Number(D.piso_dia.slice(5, 7)) - 1, Number(D.piso_dia.slice(8, 10)));
prova('mensal: os dias do mês corrente são os do Diário, dia a dia, sem filtro e com canal, comitente, categoria e evento', () => {
  const evDia = (i) => {
    /* o mesmo evento nas duas listas, pelo nome e o início */
    const e = MD.eventos[i];
    return D.eventos.findIndex((x) => x.nome === e[0] && x.ini === e[1]);
  };
  const evM = MD.eventos.findIndex((e, i) => e[3] <= 11 && e[4] >= 11 && !e[7] && evDia(i) >= 0);
  const c0 = M0.por_comit[0].comit;
  [[{}, {}], [{ wl: '43' }, { wl: '43' }], [{ cat: 'P' }, { cat: 'P' }],
    [{ comit: String(D.comitentes.indexOf(MD.comitentes[c0])) }, { comit: String(c0) }],
    [{ ev: String(evDia(evM)) }, { ev: String(evM) }]].forEach((p) => {
    const R = C(Object.assign({ sem_rem: true }, p[0]));
    const RM = CM(p[1]);
    let n = 0;
    R.dias.forEach((g) => {
      const dt = new Date(P0M + g.d * 86400000);
      if (dt.toISOString().slice(0, 7) !== MD.meses[11]) return;
      const h = RM.dias[dt.getUTCDate() - 1];
      n++;
      ['ativos', 'acesso', 'oferta', 'venda', 'mt'].forEach((f) =>
        igual(h[f], g[f], JSON.stringify(p[1]) + ' ' + dt.toISOString().slice(0, 10) + ' ' + f));
      /* os novos (25/11): a estreia do Mensal ignora a negociação removida e
         a do Diário não, então o veículo que estreou numa removida é novo no
         Mensal no dia em que volta, e no Diário não é. O Mensal só pode ter A
         MAIS, e pouco (1 em 180 em 24/11, coleta de 25/11) */
      ['novos', 'acesso_n', 'oferta_n', 'venda_n'].forEach((f) =>
        verdade(h[f] >= g[f] && h[f] - g[f] <= Math.max(2, 0.02 * g[f]),
          JSON.stringify(p[1]) + ' ' + dt.toISOString().slice(0, 10) + ' ' + f + ': ' + h[f] + ' no Mensal, ' + g[f] + ' no Diário'));
      quase(h.mo, g.mo, JSON.stringify(p[1]) + ' meta');
    });
    igual(n, RM.dias.length, 'todos os dias do mês até hoje');
  });
});
prova('mensal: os dias têm o tamanho do mês (até hoje no corrente), e cada um cabe no mês', () => [11, 10, 1].forEach((m) => {
  const r = CM({ mes: String(m) });
  const ult = MD.ult[m];
  igual(r.dias.length, Number(ult.slice(8, 10)), MD.meses[m] + ' dias');
  igual(r.lojistas_dias.length, r.dias.length, MD.meses[m] + ' dias dos lojistas');
  r.dias.forEach((g) => verdade(g.ativos <= r.kpi.veiculos && g.novos <= g.ativos && g.venda <= g.oferta && g.oferta <= g.ativos, MD.meses[m] + ' dia ' + g.k));
  r.lojistas_dias.forEach((g) => ['acessaram', 'ofertaram', 'compraram'].forEach((f) => verdade(g[f] <= r.kpi.lojistas[f], MD.meses[m] + ' lojistas ' + f)));
  /* os novos dos dias somam os novos do mês (todo novo estreia num dia do mês) */
  igual(r.dias.reduce((t, g) => t + g.novos, 0), r.kpi.novos, MD.meses[m] + ' novos');
}));
prova('mensal: as quatro categorias somam o total também dia a dia', () => {
  const tot = CM({ mes: '10' }).dias;
  const soma = tot.map(() => 0);
  ['L', 'P', 'E', 'N'].forEach((k) => CM({ mes: '10', cat: k }).dias.forEach((g, j) => { soma[j] += g.ativos; }));
  tot.forEach((g, j) => igual(soma[j], g.ativos, 'dia ' + (j + 1)));
});
prova('mensal: evento escolhido = a linha dele na tabela de eventos, e a tabela ignora o próprio filtro', () => {
  const lista = M0.eventos;
  verdade(lista.length > 50, 'poucos eventos na tabela');
  lista.filter((x, j) => j % 17 === 0).forEach((c) => {
    const r = CM({ ev: String(c.ev) });
    ['veiculos', 'novos', 'acesso', 'oferta', 'venda', 'st_ativo', 'analise', 'vendidos', 'nao_vendidos', 'removidos', 'valor', 'mt'].forEach((f) =>
      igual(r.kpi[f], c[f], MD.eventos[c.ev][0] + ' ' + f));
    igual(r.eventos.length, lista.length, 'a tabela com o evento escolhido');
    statusMes(c, MD.eventos[c.ev][0]);
  });
  /* só eventos ativos em algum dia do mês, e todos eles */
  igual(lista.length, MD.eventos.filter((e) => e[3] <= 11 && 11 <= e[4]).length, 'eventos do mês');
  /* o comitente estreita a tabela aos eventos dele */
  const c0 = M0.por_comit[0].comit;
  CM({ comit: String(c0) }).eventos.forEach((c) => verdade(MD.eventos[c.ev][6].indexOf(c0) >= 0, 'evento de outro comitente'));
  /* ativos antes dos finalizados */
  const pf = lista.findIndex((c) => c.fin);
  verdade(pf < 0 || lista.slice(pf).every((c) => c.fin), 'ativos primeiro');
});
/* a meta do evento refeita do cru: por grupo (canais do evento, comitente,
   categoria) com os donos do mês; se cada ativo bater a ajustada, o grupo
   fecha o mês na meta */
const metaVeicP = (mp, wls, c, ct) => {
  let n = 0;
  let o = 0;
  let v = 0;
  wls.forEach((w) => { const x = (mp || {})[w + '|' + c + '|' + ct]; if (x) { n++; o += x[0]; v += x[1]; } });
  return n ? [o / n, v / n] : ((mp || {})['0|' + c + '|' + ct] || null);
};
/* 24/11 (de tarde): a META DO EVENTO — o que os ativos precisam fazer para
   o mês fechar na meta, com o volume do mês e o realizado nos finalizados.
   Substitui a "meta ajustada" (e a compensação só pelos que terminaram
   antes de cada evento abrir, da manhã de 24/11) */
const pesa = (a) => (a[1] ? a[0] / a[1] : null);
prova('mensal: meta do evento refeita do cru — fecha a meta do mês, só nos ativos, nos cartões, nos comitentes e na tabela', () => [11, 10].forEach((m) => {
  const r = CM({ mes: String(m) });
  const E = MD.eventos;
  const G = {};
  MD.ev.forEach((x) => {
    if (x[0] !== m || !x[5][0]) return;
    const e = E[x[1]];
    const k = e[5].join(',') + '|' + x[2] + '|' + x[3];
    const g = G[k] || (G[k] = { n: 0, at: 0, of: 0, ve: 0, mm: metaVeicP(D.metas.mes[m], e[5], x[2], x[3]) });
    g.n += x[5][0];
    if (e[7]) { g.of += x[5][3]; g.ve += x[5][4]; } else g.at += x[5][0];
  });
  const val = (x, q) => {
    const g = G[E[x[1]][5].join(',') + '|' + x[2] + '|' + x[3]];
    if (!g || !g.mm || !g.at || E[x[1]][7]) return null;
    return Math.max(0, Math.min(1, (g.mm[q] * g.n - (q ? g.ve : g.of)) / g.at));
  };
  /* a conta fecha: realizado nos finalizados + meta do evento × veículos dos ativos = meta do mês × veículos do mês */
  let fecha = 0;
  Object.keys(G).forEach((k) => {
    const g = G[k];
    if (!g.mm || !g.at) return;
    const cru = (g.mm[0] * g.n - g.of) / g.at;
    if (cru > 0 && cru < 1) { quase(Math.round((g.of + cru * g.at) * 1e6) / 1e6, Math.round(g.mm[0] * g.n * 1e6) / 1e6, k + ' fecha'); fecha++; }
  });
  /* os cartões e os comitentes: pelos donos dos ativos; a tabela: pelos veículos de cada evento */
  const tot = [[0, 0], [0, 0]];
  const porC = {};
  const lista = [[0, 0], [0, 0]];
  const noMes = {};
  r.eventos.forEach((c) => { noMes[c.ev] = 1; });
  MD.ev.forEach((x) => {
    if (x[0] !== m) return;
    [0, 1].forEach((q) => {
      const v = val(x, q);
      if (v === null) return;
      if (x[5][0]) {
        tot[q][0] += v * x[5][0]; tot[q][1] += x[5][0];
        const pc = porC[x[2]] || (porC[x[2]] = [[0, 0], [0, 0]]);
        pc[q][0] += v * x[5][0]; pc[q][1] += x[5][0];
      }
      if (noMes[x[1]] && x[4][0]) { lista[q][0] += v * x[4][0]; lista[q][1] += x[4][0]; }
    });
  });
  quase(r.meta_ev.oferta, pesa(tot[0]), 'cartões oferta');
  quase(r.meta_ev.venda, pesa(tot[1]), 'cartões venda');
  quase(r.meta_ev_lista.oferta, pesa(lista[0]), 'etiqueta da tabela oferta');
  r.por_comit.forEach((c) => quase(c.meta_ev.venda, porC[c.comit] ? pesa(porC[c.comit][1]) : null, MD.comitentes[c.comit]));
  let com = 0;
  r.eventos.forEach((c) => {
    const s = [[0, 0], [0, 0]];
    MD.ev.forEach((x) => {
      if (x[0] !== m || x[1] !== c.ev || !x[4][0]) return;
      [0, 1].forEach((q) => { const v = val(x, q); if (v !== null) { s[q][0] += v * x[4][0]; s[q][1] += x[4][0]; } });
    });
    quase(c.meta_ev.oferta, pesa(s[0]), E[c.ev][0] + ' oferta');
    quase(c.meta_ev.venda, pesa(s[1]), E[c.ev][0] + ' venda');
    if (c.fin) igual(c.meta_ev.oferta, null, E[c.ev][0] + ': finalizado sem meta do evento');
    if (c.meta_ev.oferta !== null) com++;
  });
  if (m === 11) verdade(com > 5 && fecha > 3, 'poucos eventos com meta do evento: ' + com + ', grupos que fecham ' + fecha);
  /* com Ativos, os cartões têm a mesma meta do evento (os finalizados não entram nela) */
  quase(CM({ mes: String(m), sit: 'at' }).meta_ev.oferta, r.meta_ev.oferta, 'Ativos = Todos');
  /* os filtros não mexem na do evento */
  const c1 = r.eventos.find((c) => c.meta_ev.oferta !== null);
  if (c1) quase(CM({ mes: String(m), sit: 'at', wl: String(E[c1.ev][5][0]) }).eventos.find((c) => c.ev === c1.ev).meta_ev.oferta, c1.meta_ev.oferta, 'com filtros');
}));

/* ── a tabela de veículos do Mensal (24/11): a do Diário com os filtros do
   Mensal — os veículos dela são os do cartão do mês, recorte a recorte */
const calculaVeicMes = new Function(html.slice(ini, html.indexOf('function APP(', ini)) + ' return calculaVeicMes;')();
const VM = (F) => calculaVeicMes(D, F || {});
prova('mensal: tabela de veículos do mês corrente = os veículos do cartão, em Todos, Ativos, Finalizados, canal, comitente, categoria e evento', () => {
  const c0 = M0.por_comit[0].comit;
  const ev = M0.eventos.find((c) => !c.fin && c.veiculos > 3);
  const casos = [{}, { sit: 'at' }, { sit: 'fin' }, { wl: '43' }, { sit: 'at', wl: '7' }, { comit: String(c0) }, { cat: 'P' }, { sit: 'fin', cat: 'L' },
    { ev: String(ev.ev) }, { fim_de: MD.meses[11] + '-10' }];
  const difs = [];
  casos.forEach((F) => {
    const t = VM(F);
    igual(t.parcial, false, 'o mês corrente cabe na janela');
    const n = CM(F).kpi.veiculos;
    if (t.linhas.length !== n) difs.push(JSON.stringify(F) + ': tabela ' + t.linhas.length + ', cartão ' + n);
  });
  verdade(!difs.length, difs.join(' · '));
  /* cada veículo uma vez */
  const vs = VM({}).linhas.map((x) => x.v);
  igual(new Set(vs).size, vs.length, 'veículo repetido');
  /* removido fora da tabela também (25/11) */
  verdade(VM({}).linhas.every((x) => x.status !== 8 && x.status !== 10), 'removido na tabela de veículos');
});
prova('mensal: tabela de veículos — o mês anterior só na parte da janela, os mais antigos vazios', () => {
  const a = VM({ mes: '10' });
  verdade(a.parcial && a.de === 0 && a.ate >= a.de && a.linhas.length > 0, 'outubro na parte da janela');
  const v = VM({ mes: '8' });
  verdade(v.de > v.ate && v.linhas.length === 0, 'agosto fora da janela');
  /* evento fora da lista do Diário: tabela vazia, sem erro */
  const fora = MD.eventos.findIndex((e, i) => D.ev_mes.indexOf(i) < 0 && e[4] === 11);
  if (fora >= 0) igual(VM({ ev: String(fora) }).linhas.length, 0, 'evento fora da janela');
});
prova('mensal: os eventos e os comitentes do Diário casam com os do Mensal pelo nome', () => {
  D.ev_mes.forEach((j, i) => { if (j >= 0) { igual(MD.eventos[j][0], D.eventos[i].nome, 'evento ' + i); igual(MD.eventos[j][1], D.eventos[i].ini, 'início ' + i); } });
  D.com_mes.forEach((j, i) => { if (j >= 0) igual(MD.comitentes[j], D.comitentes[i], 'comitente ' + i); });
  verdade(D.ev_mes.filter((j) => j >= 0).length > 0.9 * D.eventos.length, 'poucos eventos casados');
});
prova('página: o Exportar e a tabela do Mensal no script, sem barra invertida nem quebra de linha escrita', () => {
  ['exporta-m', 'veiculos-', 'text/csv', 'fromCharCode(65279)'].forEach((t) => verdade(html.indexOf(t) > 0, t));
});

/* ── as metas (Thomas, 06/11; refeitas em 17/11 e em 19/11) ──────────────
   A planilha metas-painel-eventos.xlsx, lida pelo le_metas.py como o n8n lê:
   uma aba por mês ("2026-11"), só a meta MENSAL (19/11: a diária saiu), uma
   linha por whitelabel e comitente, só Leves e Pesados. O painel usa a aba
   do mês de referência (no Diário, a do mês de cada dia); mês sem aba usa a
   mais recente anterior. A meta de um recorte é a média das metas dos
   veículos dele: cada veículo leva a do canal do evento, do comitente da
   negociação escolhida e da sua categoria */
const ML = JSON.parse(fs.readFileSync(path.join(AQUI, 'metas-local.json'), 'utf8'));
const CAT_NOME = { L: 'Leves', P: 'Pesados' };
const ORDEM = ['L', 'P'];
/* as colunas da aba como o gera_metas.py a desenha, a partir de B (a área
   usada): Whitelabel, ID, Comitente, e [medida, categoria] de cada meta */
const COLS_META = [];
[0, 1].forEach((k) => ORDEM.forEach((c) => COLS_META.push([k, c])));
const NFIX = 3;
/* as linhas de uma aba, pelo pairedItem, como o Montar Painel junta */
const linhasDe = (aba, ml) => {
  const M = ml || ML;
  const k = M['Abas das Metas'].findIndex((i) => i.json.aba === aba);
  return M.Metas.filter((i) => i.pairedItem && i.pairedItem.item === k && Array.isArray(i.json.row)).map((i) => i.json.row);
};
const canalP = (x) => { const m = String(x || '').match(/^[0-9]+/); return m ? Number(m[0]) : null; };
/* a aba lida aqui por POSIÇÃO FIXA (o painel procura as linhas; aqui a
   posição é a do desenho, para os dois se conferirem): a área começa em B2;
   linha 2 = Meta mensal; 3 = medidas; 4 = cabeçalho; dados da 5 */
const tabela = (aba) => linhasDe(aba).slice(3).filter((r) => r.some((x) => x !== null)).map((r) => {
  const o = { wl: canalP(r[0]), id: r[1], nome: r[2], mes: {} };
  ORDEM.forEach((c) => {
    const a = r[NFIX + COLS_META.findIndex((x) => x[0] === 0 && x[1] === c)];
    const b = r[NFIX + COLS_META.findIndex((x) => x[0] === 1 && x[1] === c)];
    if (a !== null || b !== null) o.mes[c] = [a, b];
  });
  return o;
});
/* da aba, pelo canal e o NOME do comitente (o índice da página não leva o id) */
const daAba = (aba) => {
  const o = {};
  tabela(aba).forEach((t) => Object.keys(t.mes).forEach((c) => { o[t.wl + '|' + String(t.nome).trim() + '|' + CAT_NOME[c]] = t.mes[c]; }));
  return o;
};
/* o mês do dia d (índice em MD.meses), como o calcula faz */
const P0P = Date.UTC(Number(D.piso_dia.slice(0, 4)), Number(D.piso_dia.slice(5, 7)) - 1, Number(D.piso_dia.slice(8, 10)));
const mesDoDiaP = (d) => MD.meses.indexOf(new Date(P0P + d * 86400000).toISOString().slice(0, 7));

prova('metas: uma aba por mês, os 12 do Mensal, pedidas ao Extract na ordem dos meses', () => {
  igual(JSON.stringify(ML['Abas das Metas'].map((i) => i.json.aba)), JSON.stringify(MD.meses), 'abas pedidas');
  MD.meses.forEach((m) => verdade(linhasDe(m).length > 10, 'aba ' + m + ' vazia'));
  igual(JSON.stringify(D.metas.abas), JSON.stringify(MD.meses), 'cada mês com a sua aba');
  igual(D.metas.mes.length, 12, 'um mapa do mensal por mês');
  igual(D.metas.dia.length, 12, 'um mapa do diário por mês');
});
prova('metas: o nó Abas das Metas faz um item por mês do Mensal, com o arquivo, ou sem ele e marcado', () => {
  const bin = { data: { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', data: 'xx' } };
  const com = roda('abas-metas.js', null, [{ json: {}, binary: bin }]);
  igual(JSON.stringify(com.map((i) => i.json.aba)), JSON.stringify(meta.meses), 'os meses do Montar Consultas');
  verdade(com.every((i) => i.binary === bin), 'o arquivo em cada item');
  const sem = roda('abas-metas.js', null, [{ json: { error: 'x' } }]);
  igual(sem.length, 12, 'sem o arquivo, ainda 12 itens');
  verdade(sem.every((i) => !i.binary && i.json.sem_arquivo), 'sem o arquivo, marcados');
});
prova('metas: cada aba veio inteira para a página, no mês, no canal, no comitente e na categoria certos — e o Diário usa a mensal', () => {
  [['mes', MD.comitentes], ['dia', D.comitentes]].forEach((p) => MD.meses.forEach((aba, m) => {
    const pl = daAba(aba);
    const pg = D.metas[p[0]][m];
    Object.keys(pg).forEach((k) => {
      const c = k.split('|');
      const x = pl[c[0] + '|' + p[1][Number(c[1])] + '|' + CAT_NOME[c[2]]];
      verdade(x, aba + ' ' + p[0] + ': ' + k + ' sem linha na aba');
      quase(pg[k][0], x[0], aba + ' ' + p[0] + ' ' + k + ' oferta');
      quase(pg[k][1], x[1], aba + ' ' + p[0] + ' ' + k + ' vendidos');
    });
    verdade(Object.keys(pg).length > 10, aba + ' ' + p[0] + ': poucas metas na página');
  }));
  /* todo canal de meta é um dos seis */
  D.metas.mes.forEach((mm) => Object.keys(mm).forEach((k) => verdade(meta.wls.indexOf(Number(k.split('|')[0])) >= 0, 'canal ' + k)));
});
prova('metas: o desenho — margem, Meta mensal na linha 2, medidas na 3, cabeçalho na 4 com o Whitelabel antes do ID; só Leves e Pesados; sem teste; as duas de cada categoria juntas', () => {
  const lin2 = [null, null, null];
  const lin3 = [null, null, null];
  COLS_META.forEach((x, j) => {
    lin2.push(j === 0 ? 'Meta mensal' : null);
    lin3.push(COLS_META.findIndex((y) => y[0] === x[0]) === j ? (x[0] === 0 ? '% Com Oferta' : '% Vendido') : null);
  });
  const lin4 = ['Whitelabel', 'ID comitente', 'Comitente'].concat(COLS_META.map((x) => CAT_NOME[x[1]]));
  MD.meses.forEach((aba) => {
    const L = linhasDe(aba);
    igual(JSON.stringify(L[0]), JSON.stringify(lin2), aba + ' linha 2');
    igual(JSON.stringify(L[1]), JSON.stringify(lin3), aba + ' linha 3');
    igual(JSON.stringify(L[2]), JSON.stringify(lin4), aba + ' linha 4');
    L.forEach((r) => r.forEach((x) => verdade(['Equipamentos', 'Não informada', 'Motos', 'Meta diária'].indexOf(x) < 0, aba + ': ' + x)));
    const T = tabela(aba);
    verdade(T.length > 10, aba + ': poucas linhas');
    const vistas = {};
    T.forEach((t) => {
      const o = aba + ' ' + t.wl + ' ' + t.nome;
      verdade(meta.wls.indexOf(t.wl) >= 0, o + ': canal fora dos seis');
      verdade(!vistas[t.wl + '|' + t.id], o + ': canal e comitente repetidos');
      vistas[t.wl + '|' + t.id] = 1;
      verdade(String(t.nome).toLowerCase().indexOf('teste') < 0, o + ': comitente de teste');
      verdade(Object.keys(t.mes).length > 0, o + ': linha sem meta');
      Object.keys(t.mes).forEach((c) => {
        const a = t.mes[c][0];
        const b = t.mes[c][1];
        verdade(a !== null && b !== null, o + ' ' + c + ': uma meta sem a outra');
        verdade(a >= 0 && a <= 1 && b >= 0 && b <= 1, o + ' ' + c + ': fora de 0 a 100%');
      });
    });
    /* o mesmo comitente em mais de um canal (19/11: meta por canal) */
    verdade(Object.keys(vistas).length > new Set(T.map((t) => t.id)).size, aba + ': nenhum comitente em dois canais');
  });
  /* todas as abas nascem com a mesma média (Thomas, 17/11) */
  MD.meses.forEach((aba) => igual(JSON.stringify(tabela(aba)), JSON.stringify(tabela(MD.meses[0])), aba + ' igual à primeira'));
});
prova('metas: a planilha travada — só as metas e as linhas novas destravadas, inserir linha e filtrar liberados, sem grade; metas pintadas, só o contorno; o canal na lista dos seis', () => {
  const r = require('child_process').spawnSync('python', ['-c', [
    'import json, openpyxl',
    "wb = openpyxl.load_workbook('metas-painel-eventos.xlsx')",
    'o = {}',
    'for ws in wb:',
    '    n = sum(1 for r in ws.iter_rows(min_row=5, min_col=3, max_col=3, values_only=True) if r[0] is not None)',
    "    o[ws.title] = dict(sheet=ws.protection.sheet, ins=ws.protection.insertRows, filtro=ws.protection.autoFilter, del_col=ws.protection.deleteColumns, grade=ws.sheet_view.showGridLines,",
    "        id_trava=ws.cell(5, 3).protection.locked and ws.cell(5, 2).protection.locked, meta_livre=not ws.cell(5, 5).protection.locked, cab_trava=ws.cell(4, 5).protection.locked,",
    "        nova_livre=not ws.cell(5 + n, 2).protection.locked and not ws.cell(5 + n, 8).protection.locked, valid=len(ws.data_validations.dataValidation),",
    "        lista=[v.formula1 for v in ws.data_validations.dataValidation if v.type == 'list'],",
    "        pinta=[ws.cell(5, 5).fill.fgColor.rgb[-6:], ws.cell(5, 7).fill.fgColor.rgb[-6:], ws.cell(5 + n + 5, 6).fill.fgColor.rgb[-6:], ws.cell(5, 8).fill.fgColor.rgb[-6:]],",
    "        internas=sum(1 for r in range(6, ws.max_row) for c in range(3, 9) for s in (ws.cell(r, c).border.left, ws.cell(r, c).border.top) if s is not None and s.style),",
    "        contorno=[(ws.cell(6, 2).border.left or 0) and ws.cell(6, 2).border.left.style, (ws.cell(6, 8).border.right or 0) and ws.cell(6, 8).border.right.style,",
    "                  (ws.cell(ws.max_row, 6).border.bottom or 0) and ws.cell(ws.max_row, 6).border.bottom.style])",
    'print(json.dumps(o))'].join(String.fromCharCode(10))], { cwd: AQUI, encoding: 'utf8' });
  const o = JSON.parse(r.stdout);
  igual(JSON.stringify(Object.keys(o)), JSON.stringify(MD.meses), 'as abas da planilha');
  Object.keys(o).forEach((t) => {
    const x = o[t];
    verdade(x.sheet && x.ins === false && x.filtro === false && x.del_col !== false, t + ': proteção ' + JSON.stringify(x));
    verdade(x.id_trava && x.meta_livre && x.cab_trava && x.nova_livre, t + ': o que trava ' + JSON.stringify(x));
    verdade(x.grade === false, t + ': linhas de grade');
    igual(x.valid, 3, t + ': validação de meta, de ID e do canal');
    igual(x.lista.length, 1, t + ': a lista dos canais');
    meta.wls.forEach((w) => verdade(x.lista[0].indexOf(w + ' - ') >= 0, t + ': canal ' + w + ' fora da lista'));
    igual(JSON.stringify(x.pinta), JSON.stringify(['F1F8EC', 'EEF5FB', 'F1F8EC', 'EEF5FB']), t + ': metas pintadas (oferta verde, vendido azul, linhas novas também)');
    igual(x.internas, 0, t + ': linhas internas');
    igual(JSON.stringify(x.contorno), JSON.stringify(['thin', 'thin', 'thin']), t + ': contorno');
  });
});
prova('metas: todo veículo tem categoria, das quatro (motos em Leves); só Leves e Pesados têm meta', () => {
  D.veics.forEach((v, i) => verdade(['L', 'P', 'E', 'N'].indexOf(v[7]) >= 0, 'veículo ' + i));
  MD.ev.forEach((g) => verdade(['L', 'P', 'E', 'N'].indexOf(g[3]) >= 0, 'linha do mês'));
  ['mes', 'dia'].forEach((q) => D.metas[q].forEach((mm, m) => Object.keys(mm).forEach((k) =>
    verdade(ORDEM.indexOf(k.split('|')[2]) >= 0, q + ' ' + MD.meses[m] + ': meta de ' + k))));
});
/* a meta do dia refeita sem o calcula: a mesma "última negociação" da prova
   do acumulado, com a aba do mês do dia e o canal do evento */
const metaDoDia = (d, comit) => {
  const ult = {};
  D.negs.forEach((n, i) => {
    const e = D.eventos[n[0]];
    if (!(e.d0 <= d && d <= e.d1) || (comit !== undefined && n[2] !== comit)) return;
    const j = ult[n[1]];
    if (j === undefined || e.fim > D.eventos[D.negs[j][0]].fim || (e.fim === D.eventos[D.negs[j][0]].fim && i > j)) ult[n[1]] = i;
  });
  const tab = D.metas.dia[mesDoDiaP(d)] || {};
  const s = { n: 0, mt: 0, mo: 0, mv: 0, lp: 0, lp_mt: 0, en_mt: 0 };
  Object.keys(ult).forEach((v) => {
    s.n++;
    const cat = D.veics[v][7];
    const n = D.negs[ult[v]];
    const mm = metaVeicP(tab, D.eventos[n[0]].wls, n[2], cat);
    if (ORDEM.indexOf(cat) >= 0) s.lp++;
    if (mm) {
      s.mt++; s.mo += mm[0]; s.mv += mm[1];
      if (ORDEM.indexOf(cat) >= 0) s.lp_mt++; else s.en_mt++;
    }
  });
  return s;
};
prova('metas: a do gráfico em cada dia refeita do cru, sem o calcula, com a aba do mês do dia e o canal do evento', () => [D.hoje, 22, 10, 0].forEach((d) => {
  const s = metaDoDia(d);
  const g = T0.dias[d];
  igual(g.mt, s.mt, 'dia ' + d + ' veículos com meta');
  quase(g.mo, s.mo, 'dia ' + d + ' oferta');
  quase(g.mv, s.mv, 'dia ' + d + ' vendidos');
  verdade(s.lp_mt > 0.9 * s.lp, 'dia ' + d + ': a planilha cobre só ' + s.lp_mt + ' de ' + s.lp + ' leves e pesados');
  igual(s.en_mt, 0, 'dia ' + d + ': equipamento ou não informada com meta');
}));
prova('metas: o diário cruza dois meses — os dias de cada um usam a aba dele', () => {
  const ms = {};
  for (let d = 0; d <= D.hoje; d++) ms[mesDoDiaP(d)] = 1;
  verdade(Object.keys(ms).length === 2, 'a janela de 31 dias pega dois meses: ' + Object.keys(ms).join(', '));
  verdade(Object.keys(ms).every((m) => Number(m) >= 0), 'dia fora dos 12 meses');
});
prova('metas: a da rosca de cada comitente é a do gráfico filtrado por ele', () => T0.por_comit.forEach((c) => {
  const g = C({ comit: String(c.comit) }).dias[D.hoje];
  igual(c.dia.mt, g.mt, D.comitentes[c.comit] + ' veículos com meta');
  quase(c.dia.mo, g.mo, D.comitentes[c.comit] + ' oferta');
  quase(c.dia.mv, g.mv, D.comitentes[c.comit] + ' vendidos');
}));
prova('metas: comitente sozinho tem a meta da planilha (média das categorias e dos canais dele, pelos veículos)', () => T0.por_comit.forEach((c) => {
  const s = metaDoDia(D.hoje, c.comit);
  igual(c.dia.mt, s.mt, D.comitentes[c.comit]);
  quase(c.dia.mo, s.mo, D.comitentes[c.comit]);
}));
prova('metas: a do mês é a média das metas dos donos com a aba do mês e o canal do evento, pesada pelos veículos, refeita do cru', () => M0.meses.forEach((g, m) => {
  const s = { mt: 0, mo: 0, mv: 0 };
  MD.ev.forEach((r) => {
    if (r[0] !== m) return;
    const mm = metaVeicP(D.metas.mes[m], MD.eventos[r[1]][5], r[2], r[3]);
    if (mm) { s.mt += r[5][0]; s.mo += r[5][0] * mm[0]; s.mv += r[5][0] * mm[1]; }
  });
  igual(g.mt, s.mt, MD.meses[m] + ' veículos com meta');
  quase(g.mo, s.mo, MD.meses[m] + ' oferta');
  quase(g.mv, s.mv, MD.meses[m] + ' vendidos');
}));
prova('metas: evento de dois canais leva a média das metas dos dois', () => {
  const r = MD.ev.find((x) => MD.eventos[x[1]][5].length > 1 && MD.eventos[x[1]][5].every((w) => D.metas.mes[x[0]][w + '|' + x[2] + '|' + x[3]]));
  verdade(r, 'nenhum evento de dois canais com meta nos dois');
  const ws = MD.eventos[r[1]][5];
  const mm = metaVeicP(D.metas.mes[r[0]], ws, r[2], r[3]);
  quase(mm[0], ws.reduce((t, w) => t + D.metas.mes[r[0]][w + '|' + r[2] + '|' + r[3]][0], 0) / ws.length, 'média dos canais');
});
prova('metas: no mês, o comitente é o total com ele filtrado', () => [10, 11].forEach((m) => CM({ mes: String(m) }).por_comit.forEach((c) => {
  const k = CM({ mes: String(m), comit: String(c.comit) }).kpi;
  igual(c.mt, k.mt, 'mês ' + m + ' ' + MD.comitentes[c.comit]);
  quase(c.mo, k.mo, 'mês ' + m + ' ' + MD.comitentes[c.comit]);
})));
/* o painel com outras metas: "ml" no formato do metas-local.json */
const comMetas = (ml) => roda('montar-painel.js', Object.assign(nosLocais(dados, true), ml || {}))[0].json;
const dadoPag = (h) => JSON.parse(h.slice(h.lastIndexOf('APP(') + 4, h.lastIndexOf(',{"claro"')));
/* uma cópia do metas-local.json com a aba "aba" trocada por "linhas" (null = a aba some, como o item de erro do Extract) */
const trocaAba = (aba, linhas) => {
  const ml = copia(ML);
  const k = ml['Abas das Metas'].findIndex((i) => i.json.aba === aba);
  const outras = ml.Metas.filter((i) => i.pairedItem.item !== k);
  ml.Metas = outras.concat(linhas ? linhas.map((r) => ({ json: { row: r }, pairedItem: { item: k } }))
    : [{ json: { error: "Sheet '" + aba + "' not found" }, pairedItem: { item: k } }]);
  return ml;
};
const ULT = MD.meses[11];
const PEN = MD.meses[10];
prova('metas: sem a planilha o painel sai, sem meta e com o aviso', () => {
  const o = monta(dados, null, true);
  const d = dadoPag(o.html);
  igual(d.metas.mes.concat(d.metas.dia).reduce((t, m) => t + Object.keys(m).length, 0), 0, 'metas sem planilha');
  verdade(o.resumo.avisos.some((a) => a.indexOf('a planilha de metas não veio') === 0), 'aviso');
  verdade(!R0.avisos.some((a) => a.indexOf('planilha de metas') >= 0), 'aviso com a planilha boa');
});
prova('metas: a meta muda com o mês de referência — mudar uma aba muda só aquele mês, no Mensal e nos dias dele', () => {
  const L = linhasDe(PEN).map((r) => r.slice());
  const j = L.findIndex((r, i) => i > 2 && r[3] !== null && r[5] !== null);
  const nome = String(L[j][2]).trim();
  const wl = canalP(L[j][0]);
  L[j][3] = 0.5;   /* % com oferta, Leves */
  L[j][5] = 0.1;   /* % vendido, Leves */
  const d = dadoPag(comMetas(trocaAba(PEN, L)).html);
  const cm2 = MD.comitentes.indexOf(nome);
  const cd = D.comitentes.indexOf(nome);
  const k = (c) => wl + '|' + c + '|L';
  quase(d.metas.mes[10][k(cm2)][0], 0.5, 'mensal no mês da aba');
  quase(d.metas.mes[10][k(cm2)][1], 0.1, 'vendidos no mês da aba');
  quase(d.metas.mes[11][k(cm2)][0], D.metas.mes[11][k(cm2)][0], 'mensal no mês seguinte, sem mudar');
  if (cd >= 0) {
    quase(d.metas.dia[10][k(cd)][0], 0.5, 'o Diário usa a mensal do mês do dia');
    quase(d.metas.dia[11][k(cd)][0], D.metas.dia[11][k(cd)][0], 'diário no mês seguinte, sem mudar');
  }
});
prova('metas: mês sem aba usa a mais recente anterior e avisa; sem nenhuma anterior, fica sem meta', () => {
  const o = comMetas(trocaAba(ULT, null));
  const d = dadoPag(o.html);
  igual(d.metas.abas[11], PEN, 'o mês corrente usa a aba anterior');
  igual(JSON.stringify(d.metas.mes[11]), JSON.stringify(D.metas.mes[10]), 'a meta do mês anterior');
  verdade(o.resumo.avisos.some((a) => a.indexOf(ULT + ' usa ' + PEN) >= 0), 'aviso da aba emprestada');
  const o0 = comMetas(trocaAba(MD.meses[0], null));
  const d0 = dadoPag(o0.html);
  igual(d0.metas.abas[0], '', 'o primeiro mês sem aba anterior');
  igual(Object.keys(d0.metas.mes[0]).length, 0, 'sem meta no primeiro mês');
  verdade(o0.resumo.avisos.some((a) => a.indexOf('sem aba para ' + MD.meses[0]) >= 0), 'aviso do mês sem meta');
});
prova('metas: lê "25%", "25,5", 25 e 0,25; meta ilegível, sozinha ou sem canal fica sem meta e avisa; aba fora do formato avisa', () => {
  const L = linhasDe(ULT).slice(0, 60).map((r) => r.slice());
  /* linhas 0 a 2 são Meta mensal, medidas e cabeçalho; os dados vêm da 3.
     A coluna 3 é % com oferta, Leves; a 5, % vendido, Leves */
  const comLeves = L.slice(3).filter((r) => r[3] !== null && r[5] !== null);
  const valores = ['25%', '25,5', 25, 0.25, 'abc'];
  comLeves.slice(0, 5).forEach((r, j) => { r[3] = valores[j]; });
  comLeves[5][5] = null;
  comLeves[6][0] = 'sem canal';
  const o = comMetas(trocaAba(ULT, L));
  const d = dadoPag(o.html);
  const esperado = [0.25, 0.255, 0.25, 0.25];
  comLeves.slice(0, 4).forEach((r, j) => {
    const c = d.mes.comitentes.indexOf(String(r[2]).trim());
    if (c >= 0) quase(d.metas.mes[11][canalP(r[0]) + '|' + c + '|L'][0], esperado[j], 'linha ' + j);
  });
  verdade(o.resumo.avisos.some((a) => a.indexOf('meta(s) da aba ' + ULT) >= 0 && Number(a.split(' ')[0]) >= 3), 'aviso: a ilegível, a sozinha e a sem canal');
  /* a margem a mais (área começando em A1) não muda nada: a leitura acha a linha */
  const deslocada = [[]].concat(linhasDe(ULT).map((r) => [null].concat(r)));
  const dm = dadoPag(comMetas(trocaAba(ULT, deslocada)).html);
  igual(JSON.stringify(dm.metas.mes[11]), JSON.stringify(D.metas.mes[11]), 'área deslocada, mensal');
  igual(JSON.stringify(dm.metas.dia[11]), JSON.stringify(D.metas.dia[11]), 'área deslocada, diário');
  /* sem a linha das medidas: fora do formato, e o mês usa a aba anterior */
  const semMedida = linhasDe(ULT).map((r, k) => (k === 1 ? [] : r));
  const os = comMetas(trocaAba(ULT, semMedida));
  verdade(os.resumo.avisos.some((a) => a.indexOf('a aba ' + ULT + ' da planilha de metas veio fora do formato') === 0), 'aviso sem a linha das medidas');
  igual(dadoPag(os.html).metas.abas[11], PEN, 'aba fora do formato: usa a anterior');
});
prova('metas: a planilha antiga (sem o Whitelabel, com a Meta diária) vale para todos os canais, sem a diária, e avisa', () => {
  /* o desenho de 17/11: ID, Comitente, a mensal e a diária */
  const L = linhasDe(ULT).map((r, k) => {
    const x = r.slice(1);
    if (k === 0) return x.concat(['Meta diária', null, null, null]);
    if (k === 1) return x.concat(['% Com Oferta', null, '% Vendido', null]);
    if (k === 2) return x.concat(['Leves', 'Pesados', 'Leves', 'Pesados']);
    return x.concat(x[2] === null && x[3] === null ? [null, null, null, null] : [0.99, 0.99, 0.99, 0.99]);
  });
  const o = comMetas(trocaAba(ULT, L));
  const d = dadoPag(o.html);
  const ks = Object.keys(d.metas.mes[11]);
  verdade(ks.length > 10 && ks.every((k) => k.split('|')[0] === '0'), 'canal 0 em toda meta');
  verdade(ks.every((k) => d.metas.mes[11][k][0] !== 0.99), 'a diária ficou de fora');
  verdade(o.resumo.avisos.some((a) => a.indexOf('sem a coluna Whitelabel') >= 0), 'aviso');
  /* e o veículo de qualquer canal leva a meta do canal 0 */
  const r = MD.ev.find((x) => x[0] === 11 && d.metas.mes[11]['0|' + x[2] + '|' + x[3]]);
  verdade(r && metaVeicP(d.metas.mes[11], MD.eventos[r[1]][5], r[2], r[3]), 'meta do canal 0 alcança o veículo');
});
prova('metas: linha sem o pairedItem fica fora e avisa', () => {
  const ml = copia(ML);
  ml.Metas.forEach((i) => { delete i.pairedItem; });
  const o = comMetas(ml);
  verdade(o.resumo.avisos.some((a) => a.indexOf('sem a aba de origem (pairedItem)') >= 0), 'aviso');
  igual(dadoPag(o.html).metas.mes.reduce((t, m) => t + Object.keys(m).length, 0), 0, 'nenhuma meta sem saber a aba');
});
prova('metas: na página, os cartões de Com oferta e Vendidos têm a linha da meta, e o gráfico a legenda', () => {
  ['k-co-meta', 'k-vd-meta', 'km-vd-meta', 'leg-meta', 'leg-meta-m'].forEach((id) => verdade(html.indexOf('id="' + id + '"') > 0, id));
  verdade(html.indexOf('id="k-vm-meta"') < 0 && html.indexOf('id="k-rm-meta"') < 0, 'meta só em Com oferta e Vendidos');
  verdade(D.glossario.some((g) => g[0] === 'Meta'), 'glossário');
});

prova('categoria: no mês, as quatro somam o total, e o comitente segue a categoria', () => {
  [11, 6].forEach((m) => ['veiculos', 'com_oferta', 'vendidos', 'mt', 'mo'].forEach((f) => {
    let soma = 0;
    ['L', 'P', 'E', 'N'].forEach((k) => { soma += CM({ mes: String(m), cat: k }).kpi[f]; });
    quase(soma, CM({ mes: String(m) }).kpi[f], 'mês ' + m + ' ' + f);
  }));
  CM({ cat: 'P' }).por_comit.forEach((c) => igual(c.veiculos, CM({ cat: 'P', comit: String(c.comit) }).kpi.veiculos, MD.comitentes[c.comit]));
});
console.log('%d provas · %d ok%s', ok + falhas.length, ok, falhas.length ? '' : ' ✓');
falhas.forEach((f) => console.log('  ✗ ' + f));
console.log('resumo: %d KB · %d eventos · %d negociações · %d veículos · %d lojas · %d aviso(s)',
  Math.round(R0.bytes_html / 1024), R0.eventos, R0.negociacoes, R0.veiculos, R0.lojas, R0.avisos.length);
process.exit(falhas.length ? 1 : 0);
