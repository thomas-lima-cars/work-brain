/* Converte a planilha local no que o nó "Ler Representantes" entrega desde
   30/09: a tabela de dados "Carteira C6 - Lojas" do n8n.

     node _carteira_local.js   -> dados-carteira-local.json

   A tabela é a mesma base da planilha (conferido em 30/09: 30.718 linhas
   iguais, GN vazio em 19.321 nas duas) mais UMA linha de teste do Caio. A
   conversão reproduz as duas coisas: nomes de coluna da tabela, toda
   coluna presente (vazio = ''), id/createdAt/updatedAt, e a linha de teste
   no fim — é ela que prova que linha sem Base_Data válida fica de fora.

   Tem CNPJ de loja: o arquivo gerado fica fora do git (dados-*.json). */
const fs = require('fs');
const path = require('path');

const origem = path.join(__dirname, 'dados-planilha-local.json');
const plan = JSON.parse(fs.readFileSync(origem, 'utf8'));
const txt = (v) => (v === undefined || v === null ? '' : String(v));
const quando = '2026-09-29T18:54:08.406Z';
const itens = plan.map((it, i) => ({
  json: {
    CNPJ: txt(it.json.NR_CNPJ), Cod_Loja: txt(it.json.CD_LOJA),
    GN_Usuario: txt(it.json.USUARIO_GN), GP_Usuario: txt(it.json.USUARIO_GP),
    Rede: txt(it.json.NM_REDE), Regional: txt(it.json.NM_REGIONAL), Filial: txt(it.json.NM_FILIAL),
    Base_Data: '2026-08-17', id: i + 1, createdAt: quando, updatedAt: quando
  }
}));
itens.push({
  json: {
    CNPJ: '22131844000104', Cod_Loja: 'TESTE', GN_Usuario: 'CAIO.LEDESMA', GP_Usuario: '',
    Rede: 'TESTE CARS2YOU', Regional: 'TESTE', Filial: 'LOJA TESTE CAIO',
    Base_Data: 'TESTE - apagar antes de produção', id: itens.length + 1,
    createdAt: '2026-09-29T20:17:40.036Z', updatedAt: '2026-09-29T20:17:40.036Z'
  }
});
const destino = path.join(__dirname, 'dados-carteira-local.json');
fs.writeFileSync(destino, JSON.stringify(itens), 'utf8');
console.log('gravado: dados-carteira-local.json · %d linhas', itens.length);
