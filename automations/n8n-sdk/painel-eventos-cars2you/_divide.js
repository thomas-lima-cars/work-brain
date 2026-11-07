/* Divide o Montar Painel enxuto em três nós Code, para caber no n8n.

     node _divide.js        (depois do _enxuga.js montar-painel.js)

   Por quê (06/11): o workflow inteiro tem 164 KB (~97 mil tokens) e a API do
   n8n só recebe o código inline — nenhuma chamada carrega isso de uma vez
   sem trocar caractere. Dividido, cada nó fica abaixo de ~55 KB e é enviado
   numa chamada própria, com o md5 conferido depois.

     Peças do Tema    o CSS do tema, as logos, o CSS do painel e os ícones
                      (texto puro: só entram no HTML)
     Peças da Página  a função APP da página (só entra no HTML pelo texto,
                      APP.toString())
     Montar Painel    o resto, que lê as duas pelo nome

   A FONTE não muda: montar-painel.js segue um arquivo só, e as provas rodam
   o montar-painel.js inteiro e também os três pedaços, e exigem o mesmo
   resumo e o mesmo HTML (prova-local.js, "dividido"). */

const fs = require('fs');
const path = require('path');

const N8N = path.join(__dirname, 'n8n');
const s = fs.readFileSync(path.join(N8N, 'montar-painel.js'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
const NL = String.fromCharCode(10);

const corta = (ini, fim) => {
  const a = s.indexOf(ini);
  const b = s.indexOf(fim, a + 1);
  if (a < 0 || b < 0 || s.indexOf(ini, a + 1) >= 0) throw new Error('marcador ausente ou repetido: ' + ini + ' / ' + fim);
  return [a, b];
};
/* as três fatias, pelos marcadores de início de linha */
const T = corta(NL === s[0] ? NL + 'const CSS_TEMA = [' : 'const CSS_TEMA = [', NL + 'const WL_VITRINE_C6 = ');
const A = corta(NL + 'function APP(D, LOGO) {', NL + 'const nomesCanais = ');
const C = corta(NL + 'const CSS_PAINEL = [', NL + 'const chip = ');
if (!(T[1] < A[0] && A[1] < C[0])) throw new Error('as fatias fora da ordem esperada');
const fatia = (x) => s.slice(x[0], x[1] + 1).replace(/^\n/, '');

const tema = fatia(T) + fatia(C) +
  'return [{ json: { CSS_TEMA: CSS_TEMA, LOGO: LOGO, CSS_PAINEL: CSS_PAINEL, ICONE: ICONE } }];' + NL;
const pagina = fatia(A) + 'return [{ json: { APP: APP.toString() } }];' + NL;

let painel = "const PECAS = $('Peças do Tema').first().json;" + NL +
  'const CSS_TEMA = PECAS.CSS_TEMA;' + NL + 'const LOGO = PECAS.LOGO;' + NL +
  s.slice(T[1] + 1, A[0] + 1) +
  s.slice(A[1] + 1, C[0] + 1) +
  'const CSS_PAINEL = PECAS.CSS_PAINEL;' + NL + 'const ICONE = PECAS.ICONE;' + NL +
  s.slice(C[1] + 1);
const USO = 'APP.toString()';
if (painel.split(USO).length !== 2) throw new Error('esperado um ' + USO + ' no Montar Painel');
painel = painel.replace(USO, "$('Peças da Página').first().json.APP");

const TETO = 56 * 1024;
[['pecas-tema.js', tema], ['pecas-pagina.js', pagina], ['montar-painel-n8n.js', painel]].forEach((p) => {
  if (Buffer.byteLength(p[1]) > TETO) throw new Error(p[0] + ' passou de ' + TETO + ' bytes: ' + Buffer.byteLength(p[1]));
  fs.writeFileSync(path.join(N8N, p[0]), p[1], 'utf8');
  console.log('✓ n8n/%s · %d bytes', p[0], Buffer.byteLength(p[1]));
});
