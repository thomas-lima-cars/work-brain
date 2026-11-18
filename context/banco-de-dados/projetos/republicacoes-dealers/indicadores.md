# Republicações Dealers — indicadores medidos

> **Fonte única** dos números do Estudo de Republicações Dealers
> (`automations/estudo-republicacoes-dealers/`). Os outros arquivos linkam aqui.
> Definições e escolhas no README da pasta.

## Coleta de 2026-11-18 12h53 (`extrai.py` + `analisa.py`, conexão direta nas duas bases)

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
