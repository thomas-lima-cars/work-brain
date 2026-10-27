// Monta as logos FENAUTO + Cars2You a partir do traço e da logo extensa.
// Nome pelo fundo (marca/README): claro = PRETA (26/10), escuro = branca; a azul fica guardada.
const fs = require("fs"), path = require("path");
const [traco, c2yPreto, destino] = process.argv.slice(2);
const fen = fs.readFileSync(traco, "utf8").trim();
// só os <path> da logo extensa, sem o fill
const c2y = [...fs.readFileSync(c2yPreto, "utf8").matchAll(/<path d="([^"]+)"/g)].map(m => m[1]);

// PRETO_C2Y: o "preto" da Cars2You (#3A4552), usado só na azul guardada.
// PRETO: #242424, a tinta do C6 e o --texto do tema claro dele — a preta toda nele (26/10)
const ROXO = "#403172", PRETO_C2Y = "#3A4552", PRETO = "#242424", BRANCO = "#FFFFFF";
const FW = 1076, Y0 = 8.1, FH = 184.9; // tinta da FENAUTO medida com getBBox (a imagem tem 8 px de folga em cima)
const CW = 430, ESC = CW / 933;     // Cars2You com 40% da largura
const CH = 168 * ESC, VAO = 36;
const CX = (FW - CW) / 2, CY = Y0 + FH + VAO, H = +(CY + CH - Y0).toFixed(1);

const svg = (tintaFen, tintaC2y, titulo) =>
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${Y0} ${FW} ${H}" width="${FW}" height="${H}" role="img" aria-label="${titulo}">
<title>${titulo}</title>
<path fill="${tintaFen}" fill-rule="evenodd" d="${fen}"/>
<g fill="${tintaC2y}" transform="translate(${CX.toFixed(2)} ${CY.toFixed(2)}) scale(${ESC.toFixed(5)}) translate(-20 -14)">
${c2y.map(d => `<path d="${d}"/>`).join("\n")}
</g>
</svg>
`;
const so = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${Y0} ${FW} ${FH}" width="${FW}" height="${FH}" role="img" aria-label="FENAUTO">
<title>FENAUTO</title>
<path fill="${ROXO}" fill-rule="evenodd" d="${fen}"/>
</svg>
`;
const w = (n, t) => fs.writeFileSync(path.join(destino, n), t.replace(/\r/g, ""));
w("logo-fenauto-original.svg", so);
w("logo-fenauto-claro.svg", svg(PRETO, PRETO, "FENAUTO com Cars2You"));
w("logo-fenauto-azul.svg", svg(ROXO, PRETO_C2Y, "FENAUTO com Cars2You"));
w("logo-fenauto-escuro.svg", svg(BRANCO, BRANCO, "FENAUTO com Cars2You"));
console.log("viewBox 0 0", FW, H, "| c2y", CW, "x", CH.toFixed(1), "em", CX, CY);
