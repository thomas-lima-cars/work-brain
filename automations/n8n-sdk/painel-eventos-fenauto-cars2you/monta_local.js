/* Regera o painel de uma coleta já feita, sem n8n e sem banco.

     node monta_local.js [dados-local.json] [saida-local.html]

   Mexeu só na tela? Segundos, não um run. Roda o próprio montar-painel.js
   (não uma cópia dele) com um $() de mentira alimentado pela coleta.

   Sem argumento, usa dados-local.json desta pasta (a semana de hoje,
   `python coleta_local.py`). Para a semana de prova:
   node monta_local.js dados-prova.json saida-prova.html */

const fs = require('fs');
const path = require('path');
const { roda } = require('./_roda_no');

const entrada = path.resolve(__dirname, process.argv[2] || 'dados-local.json');
const saida = process.argv[3] || 'saida-local.html';
const d = JSON.parse(fs.readFileSync(entrada, 'utf8'));
const out = roda('montar-painel.js', { 'Montar Consultas': d.consultas, 'MCP Consultas': d.mcp });
fs.writeFileSync(path.resolve(__dirname, saida), out[0].json.html, 'utf8');
const r = out[0].json.resumo;
console.log('✓ %s · %d KB · %d eventos · %d veículos · %d lojas ofertantes · %d aviso(s) · coleta: %s',
  saida, Math.round(r.bytes_html / 1024), r.eventos, r.veiculos, r.kpi.ofertantes, r.avisos.length,
  path.relative(__dirname, entrada));
