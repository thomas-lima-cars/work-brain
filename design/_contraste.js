/* ============================================================================
   Contraste entre duas cores — WCAG 2.1.

       node design/_contraste.js "#487DEA" "#FFFFFF"
       node design/_contraste.js "#487DEA"            (compara com os 2 fundos)

   Existe pra medir ANTES de fixar a cor. O olho erra muito nessa conta: o
   #487DEA parece perfeitamente legível sobre branco e dá 3,89:1 — reprova.
   ========================================================================== */

const FUNDOS = { 'claro (cartão #FFFFFF)': '#FFFFFF', 'escuro (fundo #0B0D12)': '#0B0D12' };

const norm = s => {
  const h = String(s).trim().replace(/^#/, '');
  const c = h.length === 3 ? h.split('').map(x => x + x).join('') : h;
  if (!/^[0-9a-fA-F]{6}$/.test(c)) {
    console.error('Cor inválida: ' + s + '  (use #RRGGBB)');
    process.exit(2);
  }
  return '#' + c.toUpperCase();
};

const lum = hex => {
  const c = [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16) / 255)
    .map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};

const contraste = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const veredito = r => [
  r >= 7   ? 'AAA texto     ' : '—             ',
  r >= 4.5 ? 'AA texto      ' : '—             ',
  r >= 3   ? 'AA texto grande / traço de UI' : 'reprova em tudo',
].join(' · ');

const [, , cor, fundo] = process.argv;
if (!cor) {
  console.log('uso: node design/_contraste.js "#RRGGBB" ["#RRGGBB"]');
  process.exit(1);
}

const c = norm(cor);
const pares = fundo ? { [norm(fundo)]: norm(fundo) } : FUNDOS;

console.log('');
for (const [nome, f] of Object.entries(pares)) {
  const r = contraste(c, f);
  console.log('  %s sobre %s   %s:1', c, nome.padEnd(22), r.toFixed(2).padStart(6));
  console.log('      %s\n', veredito(r));
}
console.log('  AA: 4,5:1 texto normal · 3,0:1 texto ≥ 18,66px negrito ou ≥ 24px, e traço de UI');
