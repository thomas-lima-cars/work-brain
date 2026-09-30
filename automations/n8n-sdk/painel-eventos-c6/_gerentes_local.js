/* Gera o que o nó "Ler Nomes" entrega: a tabela de dados "Carteira C6 -
   Gerentes" do n8n (Usuario, Papel, Nome, Email, Qtd_Lojas).

     node _gerentes_local.js   -> dados-gerentes-local.json

   Reproduz a tabela pela regra que ela segue (conferido nas 280 linhas em
   30/09): Nome = cada trecho do usuário com a inicial maiúscula, pontos
   viram espaço (RAFAEL.CONTESSOTO -> Rafael Contessoto, F.SILVA -> F Silva);
   um por usuário distinto da carteira, 249 GN e 30 GP, mais a linha de
   teste do Caio. Os nomes reais só se conferem no run, pelo
   resumo.representantes.nomes. Fica fora do git (dados-*.json). */
const fs = require('fs');
const path = require('path');

const cart = JSON.parse(fs.readFileSync(path.join(__dirname, 'dados-carteira-local.json'), 'utf8'))
  .map((i) => i.json).filter((l) => /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(l.Base_Data));
const titulo = (u) => u.split('.').map((p) => p.charAt(0) + p.slice(1).toLowerCase()).join(' ');
const linhas = [];
[['GN', 'GN_Usuario'], ['GP', 'GP_Usuario']].forEach(([papel, col]) => {
  const conta = {};
  cart.forEach((l) => { const u = l[col].trim(); if (u) conta[u] = (conta[u] || 0) + 1; });
  Object.keys(conta).sort().forEach((u) => linhas.push({ Usuario: u, Papel: papel, Nome: titulo(u), Email: '', Qtd_Lojas: conta[u] }));
});
linhas.push({ Usuario: 'CAIO.LEDESMA', Papel: 'GN', Nome: 'Caio Ledesma (TESTE)', Email: '', Qtd_Lojas: 1 });
const itens = linhas.map((l, i) => ({ json: Object.assign(l, { id: i + 1 }) }));
fs.writeFileSync(path.join(__dirname, 'dados-gerentes-local.json'), JSON.stringify(itens), 'utf8');
console.log('gravado: dados-gerentes-local.json · %d linhas (%d GN, %d GP)', itens.length,
  linhas.filter((l) => l.Papel === 'GN').length, linhas.filter((l) => l.Papel === 'GP').length);
