/* ══════════════════════════════════════════════════════════════════════
   SONDA "Eventos ativos" — nó de leitura

   Sem HTML: esta sonda existe pra decidir, não pra apresentar. Devolve os
   4 conjuntos crus + o diagnóstico de cada query, com a mesma disciplina
   das outras (erro legível, teto de 50 linhas lido do `truncated`).
   ══════════════════════════════════════════════════════════════════════ */

const pedidos = $('Montar Queries').all().map((i) => i.json);
const outs = $('MCP Exec').all();
const PAGE = pedidos.length ? pedidos[0].page : 50;

function erroTexto(e) {
  if (!e) return null;
  if (typeof e === 'string') return e.slice(0, 300);
  if (e.message) return String(e.message).slice(0, 300);
  if (e.error) return erroTexto(e.error);
  try { return JSON.stringify(e).slice(0, 300); } catch (x) { return String(e).slice(0, 300); }
}

const dados = {};
const diag = {};
for (let i = 0; i < pedidos.length; i++) {
  const nome = pedidos[i].queryName;
  if (!dados[nome]) dados[nome] = [];
  if (!diag[nome]) diag[nome] = { queryName: nome, chamadas: 0, linhas: 0, vazias: 0, truncadas: 0, erro: null };
  diag[nome].chamadas++;
  const o = outs[i] ? outs[i].json : null;
  const sc = o ? (o.structuredContent || o) : null;
  const err = o ? (o.error || (sc && sc.error)) : null;
  if (err && !diag[nome].erro) diag[nome].erro = erroTexto(err);
  if (sc && sc.truncated) diag[nome].truncadas++;
  const cols = sc && sc.columns ? sc.columns : [];
  const rows = sc && sc.rows ? sc.rows : [];
  if (!rows.length) { diag[nome].vazias++; continue; }
  diag[nome].linhas += rows.length;
  for (let r = 0; r < rows.length; r++) {
    const obj = {};
    for (let c = 0; c < cols.length; c++) obj[cols[c]] = rows[r][c];
    dados[nome].push(obj);
  }
}

const diagnostico = Object.keys(diag).map((k) => {
  const d = diag[k];
  d.veredito = d.erro ? 'ERRO'
    : (d.truncadas ? 'RESPOSTA CORTADA'
      : (d.linhas === 0 ? 'ZERO LINHAS' : 'ok'));
  return d;
});

/* soma dos whitelabels x total real mede a inflação do fan-out.
   Saída genérica: devolve TODOS os conjuntos coletados sob `dados`.
   Antes eu listava chave por chave, e cada query nova exigia republicar
   este nó. Agora não. As chaves derivadas (relógio, inflação) continuam
   no topo porque são leitura, não dado cru. */
const somaWl = (dados.q_wl_uf || []).reduce((s, r) => s + Number(r.veiculos || 0), 0);
const total = (dados.q_total || [])[0] || {};

return [{
  json: {
    gerado_em: new Date().toISOString(),
    page: PAGE,
    queries: Object.keys(dados),
    diagnostico: diagnostico,
    relogio: (dados.q_relogio || [])[0] || null,
    total_sem_fatiar: total,
    soma_por_whitelabel: somaWl,
    inflacao_do_fanout: total.veiculos ? Math.round((somaWl / Number(total.veiculos)) * 100) / 100 : null,
    dados: dados
  }
}];
