# Decisão — regras da projeção de vendas 2027

**Data:** 2026-10-29/30 · **Quem decidiu:** Thomas · **Pedido de:** Fernando Tuunelis
(ata em `memory/inputs/meetings/2026-10-29-projecao-2027.md`)

A planilha mora em `automations/projecao-vendas-2027/`; o README de lá tem as regras em vigor.
Este arquivo guarda o caminho até elas.

## As seis respostas (29/10)

| # | Pergunta | Decisão |
|---|---|---|
| 1 | "Vendidos" é Qtde de Vendas ou Vendas Confirmadas? | **Vendas Confirmadas** (é a que gera receita) |
| 2 | Só até a coluna Y? | **Incluir as colunas de caixa** (depois da Y) na base |
| 3 | Como juntar nomes de comitente que mudaram? | Mesclar **só** se for o mesmo relatório operacional, o mesmo produto e se os nomes **nunca aparecem no mesmo mês** |
| 4 | Comitente que entrou no meio do ano? | Estimar pela proporção média sobre os outros do bloco, marcado — **revertido em 29/10, ver abaixo** |
| 5 | Coeficiente vale o ano todo? | Sim, **editável mês a mês** |
| 6 | 2027 usa a tarifa atual? | **Sim** (subiu em mar/abr-26: R$ 799 → R$ 990 por placa; R$ 2.000 → R$ 2.500 nos pesados) |

## O que mudou depois

- **Estimativa retirada (29/10).** Com ela, a receita 2027 zerada saía ~R$ 1,1 mi acima de 2026,
  quase toda da SCANIA (Trucks2you, entrou em jul vendendo caminhão a 3%). Primeiro ficou marcada
  para o Tuunelis decidir; depois o Thomas tirou: **mês sem valor em 2026 fica sem projeção**.
- **# Incremento publicados (29/10):** volume bruto por mês, além do %. É a única forma de criar
  publicação em mês vazio de 2026; esse volume vende pelo êxito do Total 2026 do comitente.
- **Receita por comitente segue a regra que ele pratica:** Repasse é R$ fixo (palavra do Tuunelis);
  Itaú VD, Itaú VD Pesados e Scania (Trucks2you) são % do valor de venda e usam a receita por venda
  do mesmo mês de 2026. Detectado pelos dados.
- **Formato (29–30/10):** um bloco por comitente com as colunas da tabela de origem, 2026 em cima e
  2027 embaixo, premissas na linha; no topo, comparação anual por comitente que recolhe até o total.
  Só Projeção 2027 e Base à vista.

## Consequências

- Com premissas zeradas, 2027 repete 2026 em volume; a receita sobe só pela tarifa.
- Comitente novo em 2026 (KINTO, SCANIA, CNH…) só existe em 2027 a partir do mês em que entrou,
  a menos que o Tuunelis ponha volume bruto.
- Out–dez/26 entram quando os fechamentos chegarem: rodar o script de novo (ou linhas na Base).
