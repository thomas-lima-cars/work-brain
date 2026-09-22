/* servidor estatico minimo para olhar o HTML do Radar no navegador */
const http = require('http');
const fs = require('fs');
const path = require('path');
const RAIZ = path.join(__dirname, '..');
http.createServer((req, res) => {
  const nome = decodeURIComponent(req.url.split('?')[0].split('#')[0]).replace(/^\//, '') || 'automations/n8n-sdk/rel-veiculos/_tmp-base.html';
  const alvo = path.join(RAIZ, nome);
  if (!alvo.startsWith(RAIZ)) { res.writeHead(403); return res.end('fora'); }
  fs.readFile(alvo, (e, b) => {
    if (e) { res.writeHead(404); return res.end('nao achei ' + nome); }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(b);
  });
}).listen(8777, () => console.log('previa em http://localhost:8777'));
