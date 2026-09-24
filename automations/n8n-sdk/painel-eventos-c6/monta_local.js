/* Regera o painel de uma coleta já feita, sem n8n e sem banco.

     node monta_local.js [dados-local.json] [saida-local.html]

   Mexeu só na tela? Segundos, não um run. Roda o próprio montar-painel.js
   (não uma cópia dele) com um $() de mentira alimentado pela coleta. */

const fs = require('fs');
const path = require('path');
const { roda } = require('./_roda_no');

const entrada = process.argv[2] || 'dados-local.json';
const saida = process.argv[3] || 'saida-local.html';
const d = JSON.parse(fs.readFileSync(path.resolve(__dirname, entrada), 'utf8'));
const planilha = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'dados-planilha-local.json'), 'utf8'));
const out = roda('montar-painel.js',
  { 'Montar Consultas': d.consultas, 'MCP Consultas': d.mcp, 'Ler Representantes': planilha });
fs.writeFileSync(path.resolve(__dirname, saida), out[0].json.html, 'utf8');
const r = out[0].json.resumo;
console.log('✓ %s · %d KB · %d eventos · %d veículos · %d lojas ofertantes · %d aviso(s)',
  saida, Math.round(r.bytes_html / 1024), r.eventos, r.veiculos, r.kpi.ofertantes, r.avisos.length);
