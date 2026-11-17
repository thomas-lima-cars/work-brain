/* ══════════════════════════════════════════════════════════════════════
   Abas das Metas — Painel de Eventos Cars2You (Thomas, 17/11)

   A planilha de metas tem UMA ABA POR MÊS, de nome "AAAA-MM" (2026-11), com
   a meta mensal e a diária na mesma aba. O Extract From File lê uma aba por
   item: este nó faz um item por mês dos 12 do Mensal — o mês corrente e os
   11 anteriores, em hora de Brasília, os mesmos do Montar Consultas —, cada
   um com o arquivo baixado pelo Ler Metas e o nome da aba em json.aba. O nó
   Metas lê a aba pela expressão {{ $json.aba }}, e o Montar Painel sabe de
   que aba veio cada linha pelo pairedItem.

   Sem o arquivo (o download falhou), os itens saem sem ele: o Metas erra
   em cada um (onError continua) e o painel sai sem meta, com aviso.
   ══════════════════════════════════════════════════════════════════════ */
const FUSO_MIN = -180;          /* America/Sao_Paulo, sem horário de verão */
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
