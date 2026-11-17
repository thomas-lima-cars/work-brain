const FUSO_MIN = -180;
const MESES = 12;
const agora = new Date(Date.now() + FUSO_MIN * 60000);
const pad = (n) => String(n).padStart(2, '0');
const arq = $input.first();
const binario = arq && arq.binary && arq.binary.data ? arq.binary : null;
const itens = [];
for (let k = MESES - 1; k >= 0; k--) {
  const a = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth() - k, 1));
  const aba = a.getUTCFullYear() + '-' + pad(a.getUTCMonth() + 1);
  itens.push(binario ? { json: { aba: aba }, binary: binario } : { json: { aba: aba, sem_arquivo: true } });
}
return itens;
