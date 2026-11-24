# Republicações Dealers — indicadores medidos

> **Fonte única** dos números do Estudo de Republicações Dealers
> (`automations/estudo-republicacoes-dealers/`). Os outros arquivos linkam aqui.
> Definições e escolhas no README da pasta.

## Rodadas semanais (desde 23/11) — o HTML do SharePoint

O estudo é refeito toda segunda (tarefa do Windows, ver o README da pasta), então os números da página
andam. Aqui fica só o resumo de cada rodada, como o `analisa.py` imprime no `rodadas.log`; a análise
detalhada abaixo é a da coleta das 10h43.

| coleta | carros | devolvidos | erro operacional (sim. / rep. / os dois) | agendadas fora (C2Y / Dealers) |
|---|---:|---:|---|---|
| 2026-11-23 15h22 (1º envio à pasta Estudos) | 1.472 | 292 | 225 (128 / 112 / 15) | 206 / 30 |

## Coleta de 2026-11-23 10h43 (`extrai.py` + `analisa.py` de 23/11, conexão direta nas duas bases) — a da análise detalhada

Mesmo recorte da coleta de 18/11 (abaixo), com a placa e o `updated_at` da negociação, e **sem as
publicações agendadas** (início das ofertas depois da coleta), a pedido do Thomas em 23/11.

### O casamento

- 25.977 veículos com negociação em 2026 na Cars2You e 15.233 na Dealers (eram 25.016 e 15.089).
- **1.732 carros** casaram (1.675 pelo chassi, 57 pela placa). Sem as contas de teste, fora de
  2026 e sem as agendadas, **ficam 1.466** (eram 1.401); saíram 266. Placa em todos; em 6 a placa
  difere entre as bases (antiga numa, Mercosul na outra).
- **Agendadas fora: 226 publicações da Cars2You** (eventos de 24 a 29/11, sobretudo Banco
  Volkswagen) e nenhuma da Dealers. Com elas, eram 1.632 carros e 486 Dealers → Cars2You.

### Ordem, intervalo e venda

| | carros | Cars2You → Dealers | Dealers → Cars2You | mesmo dia | intervalo mediano | nas duas ao mesmo tempo |
|---|---:|---:|---:|---:|---:|---:|
| Todas | 1.466 | 1.137 | 320 | 9 | 20 dias (CD 20, DC 27) | 127 |
| Leves | 1.214 | 993 | 212 | 9 | 20 dias (CD 20, DC 18) | 107 |
| Pesados | 252 | 144 | 108 | 0 | 24,5 dias (CD 19, DC 31,5) | 20 |

| | vendidos na Cars2You | vendidos na Dealers | nas duas | com oferta na Cars2You | com oferta na Dealers | venda ÷ FIPE Cars2You | venda ÷ FIPE Dealers |
|---|---:|---:|---:|---:|---:|---:|---:|
| Todas | 94 | 906 | 12 | 657 | 1.169 | 69,8% | 64,0% |
| Leves | 72 | 793 | 11 | 540 | 990 | 72,0% | 64,6% |
| Pesados | 22 | 113 | 1 | 117 | 179 | 55,3% | 58,1% |

| ordem | vendidos na 1ª | vendidos na 2ª |
|---|---:|---:|
| Cars2You → Dealers (1.137) | 43 | **789** |
| Dealers → Cars2You (320) | 111 | 50 |

"Nas duas ao mesmo tempo" usa desde 23/11 a regra do erro operacional (estrita, cancelada sai do
ar no `updated_at`): 127, contra 158 da regra de 18/11.

### Idas e voltas, devolvidos e erro operacional

| passagens | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 10 | 11 | 12 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| carros | 1.188 | 191 | 34 | 35 | 7 | 6 | 2 | 1 | 1 | 1 |

| | carros | devolvidos | erro operacional | no ar nas duas ao mesmo tempo | republicado com a outra vendida ou em análise |
|---|---:|---:|---:|---:|---:|
| Todas | 1.466 | **278** (19%) | **224** (15%) | 127 | 112 |
| Leves | 1.214 | 178 | 184 | 107 | 92 |
| Pesados | 252 | **100** (40%) | 40 | 20 | 20 |

15 carros têm os dois erros. Com a coleta de 18/11, sem o `updated_at` (a cancelada ficava no ar
até o fim do evento), eram 157 simultâneos em 1.401 carros; as duas coletas não têm a mesma base,
então a diferença não é só do `updated_at`.

### Tempo de venda (data da venda − 1ª publicação de 2026 no mesmo banco)

| | vendas | mediana | 1º quartil | 3º quartil | vendidos em até 7 dias |
|---|---:|---:|---:|---:|---:|
| Dealers, todas | 906 | **2,5 dias** | 1 | 18 | 62% |
| Cars2You, todas | 94 | **7 dias** | 2 | 16 | 52% |
| Dealers, leves | 793 | 2 dias | 1 | 13 | 66% |
| Dealers, pesados | 113 | **44 dias** | 5,5 | 104 | 31% |
| Cars2You, leves | 72 | 6 dias | 2 | 14 | 54% |
| Cars2You, pesados | 22 | 8 dias | 1,75 | 22 | 45% |

As duas bases juntas: 1.000 vendas, mediana de 3 dias. Nenhuma venda com data antes da 1ª
publicação no banco. O pesado demora na Dealers (mediana de 44 dias), e não na Cars2You.

### Média × mediana (23/11 — a página mostrou a média por um momento e voltou à MEDIANA, pedido do Thomas)

Distribuição que o boxplot dos cartões mostra (quartis por interpolação linear, todos os filtros abertos):

| | carros | mín. | 1º quartil | mediana | 3º quartil | 90% | máx. | média |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Intervalo, todas | 1.457 | 1 | 12 | 20 | 34 | 71 | 278 | 31,2 |
| Intervalo, Cars2You → Dealers | 1.137 | 1 | 12 | 20 | 32 | 66,4 | 278 | 27,9 |
| Intervalo, Dealers → Cars2You | 320 | 1 | 12 | 27 | 43,5 | 111,1 | 264 | 42,9 |
| Tempo de venda, as duas | 1.000 | 0 | 1 | 3 | 18 | 51,1 | 293 | 18,9 |
| Tempo de venda, Dealers | 906 | 0 | 1 | 2,5 | 18 | 52 | 293 | 19,2 |
| Tempo de venda, Cars2You | 94 | 0 | 2 | 7 | 16 | 35,1 | 158 | 16,2 |

Além do bigode (Tukey, 1,5 × a caixa): 115 vendas no tempo de venda das duas bases (107 na Dealers, 9 na Cars2You).

Mesma coleta e mesmo recorte; % da FIPE com o corte de 0,20 a 1,20 nos dois.

| indicador | n | mediana | **média** |
|---|---:|---:|---:|
| Intervalo entre as bases, todas | 1.457 | 20 dias | **31,2 dias** |
| Intervalo, Cars2You → Dealers | 1.137 | 20 dias | 27,9 dias |
| Intervalo, Dealers → Cars2You | 320 | 27 dias | 42,9 dias |
| Tempo de venda, as duas | 1.000 | 3 dias | **18,9 dias** |
| Tempo de venda, Dealers | 906 | 2,5 dias | **19,2 dias** |
| Tempo de venda, Cars2You | 94 | 7 dias | **16,2 dias** |
| Tempo de venda, Dealers leves | 793 | 2 dias | 11,2 dias |
| Tempo de venda, Dealers pesados | 113 | 44 dias | 75,6 dias |
| Venda ÷ FIPE, as duas | 967 | 64,5% | 64,0% |
| Venda ÷ FIPE, Dealers | 878 | 64,0% | 63,8% |
| Venda ÷ FIPE, Cars2You | 89 | 69,8% | 66,2% |
| Última oferta ÷ FIPE, Dealers | 1.116 | 63,7% | 63,3% |
| Última oferta ÷ FIPE, Cars2You | 616 | 62,4% | 62,7% |
| Última oferta Dealers − Cars2You, carro a carro | 506 | +1,4 p.p. | +1,0 p.p. |

- **Os prazos mudam muito**: a distribuição tem cauda longa (metade das vendas da Dealers sai
  em até 2,5 dias, um quarto leva mais de 18; nos pesados, 3º quartil de 104 dias). A média
  passa a contar essa cauda.
- **A comparação do tempo de venda se inverte**: pela mediana a Dealers vende mais rápido
  (2,5 contra 7 dias); pela média, mais devagar (19,2 contra 16,2), por causa dos pesados.
- **Os % da FIPE quase não mudam** (até 0,5 p.p.), porque o corte de 20% a 120% já tira os
  extremos. A exceção é a venda ÷ FIPE na Cars2You, 3,6 p.p. abaixo (só 89 vendas).

## Coleta de 2026-11-18 12h53 (`extrai.py` + `analisa.py`, conexão direta nas duas bases) — histórico

Recorte: publicações (negociações) com início das ofertas de 01/01 a 31/12/2026,
sem conta de teste, sem o evento-balde 266 da Cars2You.

### O casamento

| | Cars2You | Dealers |
|---|---:|---:|
| veículos com negociação em 2026 | 25.016 | 15.089 |
| sem chassi válido (17 caracteres) | 329 | 288 |
| sem placa válida | 4 | 0 |
| valores de chassi / placa em mais de 3 veículos (lixo, fora) | 19 / 21 | 1 / 0 |

- **1.502 carros** casaram nas duas bases (1.447 pelo chassi, 55 pela placa); 1 par
  com a mesma placa e chassi diferente ficou fora.
- Um carro pode ter mais de um `vehicles.id` na mesma base: os 1.502 são 1.760 ids na
  Cars2You e 1.535 na Dealers.
- Sem as negociações de conta de teste (69 na Cars2You, 53 na Dealers) e com a janela
  fechada em 31/12/2026, **ficam 1.401 carros**. Saíram 101.

### Ordem, intervalo e venda

| | carros | Cars2You → Dealers | Dealers → Cars2You | mesmo dia | intervalo mediano | nas duas ao mesmo tempo |
|---|---:|---:|---:|---:|---:|---:|
| Todas | 1.401 | 1.067 | 325 | 9 | 21 dias (CD 20, DC 26) | 158 |
| Leves | 1.148 | 929 | 210 | 9 | 20 dias (CD 20, DC 20) | 142 |
| Pesados | 253 | 138 | 115 | 0 | 25 dias (CD 19, DC 31) | 16 |

| | vendidos na Cars2You | vendidos na Dealers | nas duas | com oferta na Cars2You | com oferta na Dealers | venda ÷ FIPE Cars2You | venda ÷ FIPE Dealers |
|---|---:|---:|---:|---:|---:|---:|---:|
| Todas | 90 | 899 | 12 | 639 | 1.135 | 71,4% | 64,2% |
| Leves | 68 | 786 | 11 | 524 | 960 | 72,2% | 64,9% |
| Pesados | 22 | 113 | 1 | 115 | 175 | 55,3% | 58,0% |

Venda ÷ FIPE = mediana, com o corte de 0,20 a 1,20 (`precificacao/definicoes.md`); a FIPE
é a do anúncio da própria base, e sem ela a da outra base.

**Vendidos na 1ª e na 2ª base, pela ordem:**

| ordem | vendidos na 1ª | vendidos na 2ª |
|---|---:|---:|
| Cars2You → Dealers (1.067) | 40 | **778** |
| Dealers → Cars2You (325) | 115 | 50 |

- O fluxo dominante é **Cars2You → Dealers**: 76% dos carros, e 73% deles venderam na
  Dealers.
- Quando foi à segunda base, a publicação da primeira estava, em 58%, em **Sem
  ofertas** (809 de 1.392), 18% Cancelado e 11% Vendedor rejeitou. Em 68 carros a
  primeira estava **vendida ou aguardando pagamento**.
- Comitentes (nome unificado): C6 Bank 554 carros, Banco Volkswagen 469, Banco Toyota
  120, GM Financial 66, LM Transportes 60, Bradesco 43, Santander 25, Mercado Pago 20.
- Cobertura por carro: FIPE em algum anúncio de 2026 em 1.276 na Cars2You e 1.114 na
  Dealers (mais 4 pela FIPE do cadastro); Molicar em 939 na Cars2You, nenhum na Dealers.
