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
['montar-consultas.js', 'montar-painel.js', 'virar-arquivo.js'].forEach((f) => {
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
prova('mensal: uma consulta por mês em mes_veic e mes_loj, com os limites do mês e o índice na 1ª coluna', () =>
  ['mes_veic', 'mes_loj'].forEach((t) => {
    igual(meta.partes[t], 12, t);
    for (let p = 0; p < 12; p++) {
      const it = itens.find((i) => i.json.queryName === t + '_p' + p);
      verdade(it, t + '_p' + p);
      const ini0 = meta.meses[p] + '-01 00:00:00';
      verdade(it.json.sql.indexOf("finish_date_event >= '" + ini0 + "'") >= 0, t + '_p' + p + ' sem o início do mês');
      verdade(it.json.sql.indexOf('JSON_ARRAY(' + p + ', ') >= 0, t + '_p' + p + ' sem o índice do mês');
      igual(it.json.cols[0], 'm', t + ' 1ª coluna');
    }
  }));
prova('mensal: evento com mais de 31 dias de ofertas fica fora de toda consulta do mensal', () =>
  itens.filter((i) => ['mes_veic', 'mes_loj', 'mes_eventos', 'mes_comitentes'].indexOf(i.json.tabela) >= 0).forEach((i) =>
    verdade(i.json.sql.indexOf('DATEDIFF(e.finish_date_event, e.start_date_offer) <= 31') >= 0, i.json.queryName)));
prova('mensal: em todo mês o funil fecha, o gráfico é o status, e os novos cabem neles', () => M0.meses.forEach((g) => {
  funil(g, g.rot);
  igual(g.oferta, g.com_oferta, g.rot + ' gráfico com oferta = cartão');
  igual(g.venda, g.vendidos, g.rot + ' gráfico vendidos = cartão');
  verdade(g.novos <= g.veiculos && g.acesso <= g.veiculos && g.oferta <= g.veiculos && g.venda <= g.veiculos, g.rot + ' base');
  verdade(g.acesso_n <= g.novos && g.oferta_n <= g.novos && g.venda_n <= g.novos, g.rot + ' novos');
  verdade(g.veiculos > 0 && g.eventos > 0, g.rot + ' vazio');
}));
prova('mensal: os veículos do mês são a soma do cru do mes_veic', () => {
  const soma = MD.meses.map(() => 0);
  dados.consultas.forEach((q, i) => {
    if (q.json.tabela !== 'mes_veic') return;
    JSON.parse(dados.mcp[i].json.structuredContent.rows[0][1]).forEach((r) => { soma[Number(r[0])] += Number(r[3]); });
  });
  M0.meses.forEach((g, m) => igual(g.veiculos, soma[m], g.rot));
});
prova('mensal: cada veículo num grupo só — os comitentes somam o total, e cada canal é a soma dos grupos dele', () => {
  const porCom = MD.meses.map(() => 0);
  MD.comitentes.forEach((n, c) => CM({ comit: String(c) }).meses.forEach((g, m) => { porCom[m] += g.veiculos; }));
  const semCom = MD.meses.map(() => 0);
  MD.grupos.forEach((g) => { if (g[1] < 0) semCom[g[0]] += g[3]; });
  M0.meses.forEach((g, m) => igual(porCom[m] + semCom[m], g.veiculos, g.rot + ' comitentes'));
  D.canais.forEach((c) => {
    const bit = 1 << MD.wls.indexOf(c[0]);
    CM({ wl: String(c[0]) }).meses.forEach((g, m) => {
      const s = MD.grupos.filter((x) => x[0] === m && (x[2] & bit)).reduce((t, x) => t + x[3], 0);
      igual(g.veiculos, s, 'canal ' + c[0] + ' ' + g.rot);
    });
  });
});
prova('mensal: o cartão do comitente é o mês com aquele comitente filtrado, em três meses e com canal', () =>
  [{}, { mes: '10' }, { mes: '3', wl: '7' }].forEach((F) => {
    const r = CM(F);
    verdade(r.por_comit.length > 0, JSON.stringify(F));
    r.por_comit.forEach((c) => {
      const k = CM(Object.assign({ comit: String(c.comit) }, F)).kpi;
      ['veiculos', 'novos', 'acesso', 'oferta', 'venda', 'sem_oferta', 'com_oferta', 'vmv', 'vendidos', 'removidos', 'valor', 'eventos'].forEach((f) =>
        igual(c[f], k[f], JSON.stringify(F) + ' ' + MD.comitentes[c.comit] + ' ' + f));
      igual(c.hist.length, 12, 'área de 12 meses');
      igual(c.hist[11], c.dia, 'o último ponto da área é o mês');
      igual(c.dia_ant, r.ref > 0 ? c.hist[10] : null, 'o anterior');
    });
  }));
prova('mensal: eventos do mês refeitos da lista de eventos', () => M0.meses.forEach((g, m) => {
  igual(g.eventos, MD.eventos.filter((e) => e[0] <= m && m <= e[1]).length, g.rot);
}));
prova('mensal: lojistas de cada recorte são a linha pronta do banco', () => {
  const linha = (m, wl, c) => MD.loj.find((r) => r[0] === m && r[1] === wl && r[2] === c);
  M0.meses.forEach((g, m) => {
    const r = linha(m, 0, -1);
    verdade(r, 'sem a linha do total em ' + g.rot);
    igual(g.lojistas.acessaram, r[3], g.rot);
    igual(g.lojistas.compraram, r[5], g.rot);
  });
  CM({ wl: '7' }).meses.forEach((g, m) => igual(g.lojistas.ofertaram, (linha(m, 7, -1) || [0, 0, 0, 0, 0, 0])[4], 'canal 7 ' + g.rot));
  const c0 = M0.por_comit[0].comit;
  CM({ comit: String(c0) }).meses.forEach((g, m) => igual(g.lojistas.acessaram, (linha(m, 0, c0) || [0, 0, 0, 0])[3], 'comitente ' + g.rot));
});
prova('mensal: grupo cujo funil não fecha derruba o run', () => {
  const d = copia(dados);
  const i = d.consultas.findIndex((x) => x.json.queryName === 'mes_veic_p5');
  const sc = d.mcp[i].json.structuredContent;
  const li = JSON.parse(sc.rows[0][1]);
  li[0][12] = Number(li[0][12]) + 1;
  sc.rows[0][1] = JSON.stringify(li);
  cai(() => monta(d), 'funil nao fecha');
});
prova('mensal: mês sem parte derruba o run', () => {
  const d = copia(dados);
  const i = d.consultas.findIndex((x) => x.json.queryName === 'mes_loj_p7');
  d.consultas.splice(i, 1);
  d.mcp.splice(i, 1);
  cai(() => monta(d), 'mes_loj chegou em');
});
prova('mensal: o mês com buraco no access_logs vira aviso, e mês completo não', () => {
  const inc = MD.dias_acesso.filter((x) => x[0] < x[1]);
  verdade(inc.length > 0, 'a coleta de 06/11 tem fevereiro com 5 dias');
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
prova('mensal: as abas, os blocos e os filtros dele na página', () => {
  verdade(html.indexOf('id="seg-aba"') > 0 && html.indexOf('data-v="mes"') > 0, 'abas');
  verdade(html.indexOf('<div id="v-mes" hidden>') > 0 && html.indexOf('<div class="filtros" id="fil-mes" hidden>') > 0, 'nasce no diário');
  ['g-comit-m', 'g-ativos-m', 'g-lojistas-m', 'f-m-wl', 'f-m-comit', 'f-m-mes'].forEach((id) => verdade(html.indexOf('id="' + id + '"') > 0, id));
  verdade(html.indexOf('function calculaMes(') > 0, 'calculaMes no script');
  verdade(D.glossario.some((g) => g[0] === 'Visão Mensal'), 'glossário');
});

/* ── as metas (Thomas, 06/11) ────────────────────────────────────────────
   A planilha metas-painel-eventos.xlsx, lida pelo le_metas.py como o n8n lê.
   A meta de um recorte é a média das metas dos veículos dele: cada veículo
   leva a do comitente da negociação escolhida e da sua categoria */
const ML = JSON.parse(fs.readFileSync(path.join(AQUI, 'metas-local.json'), 'utf8'));
const CAT_NOME = { L: 'Leves', P: 'Pesados', E: 'Equipamentos', N: 'Não informada' };
const ORDEM = ['L', 'P', 'E', 'N'];
/* a aba como o gera_metas.py a desenha, lida aqui por POSIÇÃO FIXA (o painel
   procura a linha; aqui a posição é a do desenho, para os dois se conferirem):
   a área começa em B2; linha 2 = medidas; linha 3 = cabeçalho; dados da 4 */
const tabela = (no) => {
  const L = ML[no].map((i) => i.json.row);
  return L.slice(2).filter((r) => r.some((x) => x !== null)).map((r) => {
    const o = { id: r[0], nome: r[1], m: {} };
    ORDEM.forEach((c, i) => { if (r[2 + i] !== null || r[6 + i] !== null) o.m[c] = [r[2 + i], r[6 + i]]; });
    return o;
  });
};
/* da planilha, pelo NOME do comitente (o índice da página não leva o id) */
const daPlanilha = (no) => {
  const o = {};
  tabela(no).forEach((t) => Object.keys(t.m).forEach((c) => { o[String(t.nome).trim() + '|' + CAT_NOME[c]] = t.m[c]; }));
  return o;
};
const quase = (a, b, o) => { if (a === null || b === null ? a !== b : Math.abs(a - b) > 1e-9) throw new Error(o + ': ' + a + ' ≠ ' + b); };
prova('metas: a planilha veio inteira para a página, no comitente e na categoria certos', () => {
  [['Metas Diárias', D.metas.dia, D.comitentes], ['Metas Mensais', D.metas.mes, MD.comitentes]].forEach((p) => {
    const pl = daPlanilha(p[0]);
    Object.keys(p[1]).forEach((k) => {
      const c = k.split('|');
      const x = pl[p[2][Number(c[0])] + '|' + CAT_NOME[c[1]]];
      verdade(x, p[0] + ': ' + k + ' sem linha na planilha');
      quase(p[1][k][0], x[0], p[0] + ' ' + k + ' oferta');
      quase(p[1][k][1], x[1], p[0] + ' ' + k + ' vendidos');
    });
    verdade(Object.keys(p[1]).length > 10, p[0] + ': poucas metas na página');
  });
});
prova('metas: o desenho — margem, medidas mescladas na linha 2, cabeçalho na 3; sem teste; toda linha com meta, as duas de cada categoria juntas', () => {
  ['Metas Diárias', 'Metas Mensais'].forEach((no) => {
    const L = ML[no].map((i) => i.json.row);
    igual(JSON.stringify(L[0]), JSON.stringify([null, null, '% Com Oferta', null, null, null, '% Vendido', null, null, null]), no + ' linha 2');
    igual(JSON.stringify(L[1]), JSON.stringify(['ID comitente', 'Comitente'].concat(ORDEM.map((c) => CAT_NOME[c]), ORDEM.map((c) => CAT_NOME[c]))), no + ' linha 3');
    const T = tabela(no);
    verdade(T.length > 10, no + ': poucos comitentes');
    T.forEach((t) => {
      const o = no + ' ' + t.nome;
      verdade(String(t.nome).toLowerCase().indexOf('teste') < 0, o + ': comitente de teste');
      verdade(Object.keys(t.m).length > 0, o + ': linha sem meta');
      Object.keys(t.m).forEach((c) => {
        const a = t.m[c][0];
        const b = t.m[c][1];
        verdade(a !== null && b !== null, o + ' ' + c + ': uma meta sem a outra');
        verdade(a >= 0 && a <= 1 && b >= 0 && b <= 1, o + ' ' + c + ': fora de 0 a 100%');
      });
    });
  });
});
prova('metas: a planilha travada — só as metas e as linhas novas destravadas, inserir linha e filtrar liberados, sem grade; metas pintadas, só o contorno', () => {
  const r = require('child_process').spawnSync('python', ['-c', [
    'import json, openpyxl',
    "wb = openpyxl.load_workbook('metas-painel-eventos.xlsx')",
    'o = {}',
    'for ws in wb:',
    '    n = sum(1 for r in ws.iter_rows(min_row=4, min_col=2, max_col=2, values_only=True) if r[0] is not None)',
    "    o[ws.title] = dict(sheet=ws.protection.sheet, ins=ws.protection.insertRows, filtro=ws.protection.autoFilter, del_col=ws.protection.deleteColumns, grade=ws.sheet_view.showGridLines,",
    "        id_trava=ws.cell(4, 2).protection.locked, meta_livre=not ws.cell(4, 4).protection.locked, cab_trava=ws.cell(3, 4).protection.locked,",
    "        nova_livre=not ws.cell(4 + n, 2).protection.locked and not ws.cell(4 + n, 4).protection.locked, valid=len(ws.data_validations.dataValidation),",
    "        pinta=[ws.cell(4, 4).fill.fgColor.rgb[-6:], ws.cell(4, 8).fill.fgColor.rgb[-6:], ws.cell(4 + n + 5, 7).fill.fgColor.rgb[-6:]],",
    "        internas=sum(1 for r in range(5, ws.max_row) for c in range(3, 11) for s in (ws.cell(r, c).border.left, ws.cell(r, c).border.top) if s is not None and s.style),",
    "        contorno=[(ws.cell(5, 2).border.left or 0) and ws.cell(5, 2).border.left.style, (ws.cell(5, 11).border.right or 0) and ws.cell(5, 11).border.right.style,",
    "                  (ws.cell(ws.max_row, 6).border.bottom or 0) and ws.cell(ws.max_row, 6).border.bottom.style])",
    'print(json.dumps(o))'].join(String.fromCharCode(10))], { cwd: AQUI, encoding: 'utf8' });
  const o = JSON.parse(r.stdout);
  Object.keys(o).forEach((t) => {
    const x = o[t];
    verdade(x.sheet && x.ins === false && x.filtro === false && x.del_col !== false, t + ': proteção ' + JSON.stringify(x));
    verdade(x.id_trava && x.meta_livre && x.cab_trava && x.nova_livre, t + ': o que trava ' + JSON.stringify(x));
    verdade(x.grade === false, t + ': linhas de grade');
    igual(x.valid, 2, t + ': validação de meta e de ID');
    igual(JSON.stringify(x.pinta), JSON.stringify(['F1F8EC', 'EEF5FB', 'F1F8EC']), t + ': metas pintadas (oferta verde, vendido azul, linhas novas também)');
    igual(x.internas, 0, t + ': linhas internas');
    igual(JSON.stringify(x.contorno), JSON.stringify(['thin', 'thin', 'thin']), t + ': contorno');
  });
});
prova('metas: todo veículo tem categoria, das quatro (motos em Leves)', () => {
  D.veics.forEach((v, i) => verdade(['L', 'P', 'E', 'N'].indexOf(v[7]) >= 0, 'veículo ' + i));
  MD.grupos.forEach((g) => verdade(['L', 'P', 'E', 'N'].indexOf(g[17]) >= 0, 'grupo do mês'));
  ['Metas Diárias', 'Metas Mensais'].forEach((no) => ML[no].forEach((i) => i.json.row.forEach((x) => verdade(x !== 'Motos', no + ': coluna de Motos'))));
});
/* a meta do dia refeita sem o calcula: a mesma "última negociação" da prova do acumulado */
const metaDoDia = (d, comit) => {
  const ult = {};
  D.negs.forEach((n, i) => {
    const e = D.eventos[n[0]];
    if (!(e.d0 <= d && d <= e.d1) || (comit !== undefined && n[2] !== comit)) return;
    const j = ult[n[1]];
    if (j === undefined || e.fim > D.eventos[D.negs[j][0]].fim || (e.fim === D.eventos[D.negs[j][0]].fim && i > j)) ult[n[1]] = i;
  });
  const s = { n: 0, mt: 0, mo: 0, mv: 0 };
  Object.keys(ult).forEach((v) => {
    s.n++;
    const mm = D.metas.dia[D.negs[ult[v]][2] + '|' + D.veics[v][7]];
    if (mm) { s.mt++; s.mo += mm[0]; s.mv += mm[1]; }
  });
  return s;
};
prova('metas: a do gráfico em cada dia refeita do cru, sem o calcula', () => [D.hoje, 22, 10, 0].forEach((d) => {
  const s = metaDoDia(d);
  const g = T0.dias[d];
  igual(g.mt, s.mt, 'dia ' + d + ' veículos com meta');
  quase(g.mo, s.mo, 'dia ' + d + ' oferta');
  quase(g.mv, s.mv, 'dia ' + d + ' vendidos');
  verdade(s.mt > 0.9 * s.n, 'dia ' + d + ': a planilha cobre só ' + s.mt + ' de ' + s.n);
}));
prova('metas: a da rosca de cada comitente é a do gráfico filtrado por ele', () => T0.por_comit.forEach((c) => {
  const g = C({ comit: String(c.comit) }).dias[D.hoje];
  igual(c.dia.mt, g.mt, D.comitentes[c.comit] + ' veículos com meta');
  quase(c.dia.mo, g.mo, D.comitentes[c.comit] + ' oferta');
  quase(c.dia.mv, g.mv, D.comitentes[c.comit] + ' vendidos');
}));
prova('metas: comitente sozinho tem a meta da planilha (média das categorias dele, pelos veículos)', () => T0.por_comit.forEach((c) => {
  const s = metaDoDia(D.hoje, c.comit);
  igual(c.dia.mt, s.mt, D.comitentes[c.comit]);
  quase(c.dia.mo, s.mo, D.comitentes[c.comit]);
}));
prova('metas: a do mês é a média das metas dos grupos, pesada pelos veículos, refeita do cru', () => M0.meses.forEach((g, m) => {
  const s = { mt: 0, mo: 0, mv: 0 };
  MD.grupos.forEach((r) => {
    if (r[0] !== m) return;
    const mm = D.metas.mes[r[1] + '|' + r[17]];
    if (mm) { s.mt += r[3]; s.mo += r[3] * mm[0]; s.mv += r[3] * mm[1]; }
  });
  igual(g.mt, s.mt, MD.meses[m] + ' veículos com meta');
  quase(g.mo, s.mo, MD.meses[m] + ' oferta');
  quase(g.mv, s.mv, MD.meses[m] + ' vendidos');
}));
prova('metas: no mês, o comitente é o total com ele filtrado', () => [10, 11].forEach((m) => CM({ mes: String(m) }).por_comit.forEach((c) => {
  const k = CM({ mes: String(m), comit: String(c.comit) }).kpi;
  igual(c.mt, k.mt, 'mês ' + m + ' ' + MD.comitentes[c.comit]);
  quase(c.mo, k.mo, 'mês ' + m + ' ' + MD.comitentes[c.comit]);
})));
const comMetas = (dia, mes) => roda('montar-painel.js', Object.assign(nosLocais(dados, true),
  dia ? { 'Metas Diárias': dia } : {}, mes ? { 'Metas Mensais': mes } : {}))[0].json;
const dadoPag = (h) => JSON.parse(h.slice(h.lastIndexOf('APP(') + 4, h.lastIndexOf(',{"claro"')));
prova('metas: sem a planilha o painel sai, sem meta e com os dois avisos', () => {
  const o = monta(dados, null, true);
  const d = dadoPag(o.html);
  igual(Object.keys(d.metas.dia).length + Object.keys(d.metas.mes).length, 0, 'metas sem planilha');
  verdade(o.resumo.avisos.some((a) => a.indexOf('aba Média diária') >= 0), 'aviso do diário');
  verdade(o.resumo.avisos.some((a) => a.indexOf('aba Média mensal') >= 0), 'aviso do mensal');
  verdade(!R0.avisos.some((a) => a.indexOf('planilha de metas') >= 0), 'aviso com a planilha boa');
});
prova('metas: lê "25%", "25,5", 25 e 0,25; meta ilegível ou sozinha fica sem meta e avisa; aba fora do formato avisa', () => {
  const base = ML['Metas Diárias'].slice(0, 8).map((i) => copia(i));
  /* linhas 0 e 1 são medidas e cabeçalho; os dados vêm da 2 */
  const primeira = (r) => ORDEM.findIndex((c, i) => r[2 + i] !== null);
  const valores = ['25%', '25,5', 25, 0.25, 'abc'];
  base.slice(2, 7).forEach((i, j) => { i.json.row[2 + primeira(i.json.row)] = valores[j]; });
  base[7].json.row[6 + primeira(base[7].json.row)] = null;
  const o = comMetas(base, null);
  const d = dadoPag(o.html);
  const esperado = [0.25, 0.255, 0.25, 0.25];
  base.slice(2, 6).forEach((i, j) => {
    const c = d.comitentes.indexOf(String(i.json.row[1]).trim());
    if (c >= 0) quase(d.metas.dia[c + '|' + ORDEM[primeira(i.json.row)]][0], esperado[j], 'linha ' + j);
  });
  verdade(o.resumo.avisos.some((a) => a.indexOf('2 meta(s) da aba Média diária') >= 0), 'aviso: a ilegível e a sozinha');
  /* a margem a mais (área começando em A1) não muda nada: a leitura acha a linha */
  const comMargem = ML['Metas Diárias'].map((i) => ({ json: { row: [null].concat(i.json.row) } }));
  const dm = dadoPag(comMetas([{ json: { row: [] } }].concat(comMargem), null).html);
  igual(JSON.stringify(dm.metas.dia), JSON.stringify(D.metas.dia), 'área deslocada');
  const velha = comMetas([{ json: { 'ID comitente': 1, 'Comitente': 'x', 'Categoria': 'Leves', 'Meta % com oferta': 0.3 } }], null);
  verdade(velha.resumo.avisos.some((a) => a.indexOf('não veio') >= 0 || a.indexOf('fora do formato') >= 0), 'aviso do formato antigo');
  const semMedida = ML['Metas Diárias'].map((i, k) => (k === 0 ? { json: { row: [] } } : copia(i)));
  verdade(comMetas(semMedida, null).resumo.avisos.some((a) => a.indexOf('fora do formato') >= 0), 'aviso sem a linha das medidas');
});
prova('metas: na página, os cartões de Com oferta e Vendidos têm a linha da meta, e o gráfico a legenda', () => {
  ['k-co-meta', 'k-vd-meta', 'km-co-meta', 'km-vd-meta', 'leg-meta', 'leg-meta-m'].forEach((id) => verdade(html.indexOf('id="' + id + '"') > 0, id));
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
