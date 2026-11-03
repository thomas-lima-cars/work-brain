# Projeção de vendas 2027

Pedido do Tuunelis (reunião com Carlos Mattera, Everton, Caio e Thomas, 29/10 —
`memory/inputs/meetings/2026-10-29-projecao-2027.md`): consolidar a aba geral dos fechamentos
mensais de 2026 e montar a matriz de 2027 em Excel, com coeficiente de crescimento por comitente.
Prazo: sexta 30/10. HTML de leitura e rotina automática ficam para depois. Como as regras chegaram
onde estão: `memory/decisions/2026-10-29-regras-projecao-2027.md`.

## Arquivos

| arquivo | o que faz |
|---|---|
| `consolida.py` | Lê a aba geral de cada fechamento (colunas casadas pelo nome; caixa pela ordem dos 3 grupos) e confere contra Total e RESULTADO GERAL |
| `monta_projecao.py` | Mescla comitentes, monta a planilha inteira (fórmulas) |
| `confere_planilha.py` | Depois de recalcular no Excel: erros, conferência, 2026 = Base, 2027 = 2026 com premissas zeradas, Resumo, teste de sensibilidade |
| `projecao-vendas-2027.xlsx` | A entrega |

À vista só **Projeção 2027** e **Base**; Leia-me, Resumo 2027, De-para e Conferência ficam ocultas.
No topo da Projeção, a comparação anual por comitente (2026 / 2027 / variação, comitente mesclado,
recolhe e deixa só o total geral). Coluna A e linha 1 em branco, de margem.

Abas da entrega: **Base** (o consolidado, uma aba só, com as colunas de caixa) · **Projeção 2027**
(um bloco por comitente no formato da tabela de origem — mesmas colunas; jan–dez/26 realizados,
Total 2026, premissa do ano, jan–dez/27 projetados em fundo verde, Total 2027 e variação; cada mês de 2027
parte da linha do mesmo mês de 2026 × (1 + % de incremento) + volume bruto do mês, com variação do
êxito e receita por venda)
· **Resumo 2027** (o mesmo formato por bloco e no total) · **De-para** · **Conferência**.

Os fechamentos ficam em `Downloads/Relatórios_de_fechamento_2026` (fora do repo).

## Rodar

```bash
python monta_projecao.py "C:/Users/thoma/Downloads/Relatórios_de_fechamento_2026" projecao-vendas-2027.xlsx
```

Depois recalcular no Excel (o `recalc.py` do LibreOffice não roda neste Windows) e rodar
`confere_planilha.py`. O teste de sensibilidade: `--enderecos <arquivo>` lista as células a mexer
(+10% no ano de todos, +5 p.p. de êxito no 1º, −50% em mar no 2º, volume bruto no 3º e num
comitente sem jan/26), o Excel aplica numa cópia e recalcula, e `confere_planilha.py <original> <copia>`
confere o efeito.

Com premissas zeradas, 2027 = mesmo mês de 2026 em todas as colunas, menos a Receita Bruta (tarifa
atual, regra 6) e a linha de ajustes da Dealers em ago (ofertas e recusas sem publicados).

## Números (fonte única; medidos em 30/10 sobre os fechamentos de jan–set/26)

Somados da aba Base e conferidos contra o RESULTADO GERAL de cada fechamento (diferença zero):

| | jan–set/26 |
|---|---|
| Linhas na Base (comitente × bloco × mês) | 243 |
| Comitentes depois da mesclagem | 41 |
| Qtde Publicadas | 38.761 |
| Vendas Confirmadas | 20.633 |
| Receita Bruta | R$ 9.027.336 |

Com premissas zeradas, 2027 projeta os mesmos publicados e vendas, e **R$ 9.223.321** de receita
(+2,2%, só pela tarifa atual). Toda linha: Receita Bruta = vendas do mês contabilizadas + não
contabilizadas (caixa), conferido nas 243.

## Regras (Thomas, 29/10)

1. Vendidos = Vendas Confirmadas.
2. Colunas de caixa entram (na aba Base).
3. Mescla dois nomes só se forem do mesmo bloco, do mesmo produto e nunca aparecerem no mesmo mês.
   "icarros club" = "Cars2you" (e "Cars2you" = "WL" na Venda Direta): o mesmo comitente aparece com
   os dois rótulos em meses diferentes.
4. Mês sem valor em 2026 fica sem projeção em 2027. A estimativa por proporção média (comitente que
   entrou no meio do ano) existiu e foi retirada pelo Thomas em 29/10. Só o volume bruto cria
   publicação nesses meses; ele vende pelo êxito do Total 2026 do comitente.
5. % de incremento e volume bruto (qtd por mês) valem o ano, editáveis mês a mês.
6. Tarifa atual em 2027. Repasse é R$ fixo por venda (Tuunelis); nos outros blocos a regra sai dos
   dados — Itaú VD, Itaú VD Pesados e Scania (Trucks2you) cobram % do valor de venda, então usam a
   receita por venda do mesmo mês de 2026.
