# Estudo de Republicações Dealers

O mesmo carro publicado na **Cars2You** e na **Dealers** em 2026: em que ordem,
com que intervalo, e o resultado em cada base (ofertas, última oferta, status,
venda, % sobre a FIPE e a Molicar), por comitente e com filtro de leves e pesados.

Pedido do Thomas em 2026-11-18. HTML estático, sem workflow, no padrão do Estudo de
Vendas IGA. Números em
[`context/banco-de-dados/projetos/republicacoes-dealers/indicadores.md`](../../context/banco-de-dados/projetos/republicacoes-dealers/indicadores.md).

## Como rodar (VPN ligada)

```bash
python automations/estudo-republicacoes-dealers/extrai.py --descobre   # colunas de placa/chassi e categorias, nada gravado
python automations/estudo-republicacoes-dealers/extrai.py              # dados-brutos.json (~10 s)
python -I automations/estudo-republicacoes-dealers/analisa.py          # resultados.json (uma linha por carro)
node automations/estudo-republicacoes-dealers/monta-estudo.js          # estudo-republicacoes-dealers.html (~620 KB)
```

Os três arquivos gerados ficam **fora do git** (`.gitignore`): têm nome de comitente,
de evento e id de veículo. O HTML abre no navegador interno pelo servidor
`previa-radar` (porta 8777), porque passa de 600 KB.

## Como o carro é casado

- **Chassi** (17 caracteres, só letras e números); quando um dos lados não tem
  chassi, **placa** (7 caracteres, Mercosul convertida ao formato antigo: o 5º
  caractere A..J vira 0..9).
- Placa e chassi são **embaralhados dentro do SQL** (`SHA2` com um sal aleatório
  desta rodada). Nenhum dos dois chega ao Python (regra de PII do
  `qualidade.md`), e os hashes não são gravados.
- Valor de chassi ou placa em mais de **3 veículos da mesma base** é cadastro lixo
  e não casa. Mesma placa com chassi diferente não é o mesmo carro.
- Os carros saem de um grafo: um carro pode ter mais de um `vehicles.id` na
  mesma base.

## Escolhas (minhas, 18/11 — confirmar com o Thomas)

- **Publicação** = uma negociação; o dia é o início das ofertas do evento (sem
  evento, o da negociação). **2026** = início de 01/01 a 31/12/2026; há início em
  2027 e 2028, data lixo, que fica fora.
- **Ordem e intervalo** saem da **primeira publicação de 2026** em cada base;
  publicação anterior a 2026 não muda a ordem. Mesmo dia = ordem própria.
- **Conta de teste** (`teste|tutorial` no nome do comitente) sai antes de tudo,
  nas duas bases.
- **Comitente unificado** = o dono do carro, por padrão no nome (`DONOS` em
  `analisa.py`). Quando a Cars2You publicou por **canal de revenda** (Outlet
  Netcarros, Multifrota), vale o nome da Dealers.
- **Categoria**: Pesados se algum lado diz Pesados (grupo 2 ou categoria 23);
  Leves, moto inclusa, se algum lado diz Leves. Na Dealers a moto está num grupo
  próprio, "Motos" (12).
- **Venda** = última publicação de 2026 da base em status 2, 3 ou 7; valor = a
  oferta vencedora. **Última oferta** = a mais recente recebida na base.
- **FIPE** = a do anúncio; sem ela, a do cadastro do veículo; sem as duas, a da
  outra base. **Molicar** só na Cars2You. **VMV** fora: na Dealers é sentinela.
- **"Como estava na primeira base"** = status da última publicação da 1ª base que
  começou antes da estreia na 2ª.

## Arquivos

| arquivo | o que faz |
|---|---|
| `extrai.py` | passo 1 (veículos de 2026 com hash de placa/chassi, nas duas bases), casamento, passo 2 (toda negociação dos casados) |
| `analisa.py` | uma linha por carro, com os dois lados; todas as escolhas acima são constantes daqui |
| `estudo.template.html` | a página; todo cálculo mora nela, refeito a cada filtro |
| `monta-estudo.js` | compacta o JSON, embute `tema.css` e as logos da Cars2You, método e glossário |

## Histórico

- **2026-11-18** — primeira versão: 1.401 carros, tema escuro, filtros de
  categoria, ordem e comitente, tabelas por ordem, por comitente e carro a carro.
- **2026-11-18 (tarde)** — pedido do Thomas: filtro de período (de/até, pelo dia
  da republicação = estreia na 2ª base; o gráfico mostra só os meses do período),
  saem as tabelas "Ofertas e preço, lado a lado" e "Status da última publicação de
  2026", e a tabela de veículos fica enxuta (valores em R$ mil, títulos curtos,
  comitente e modelo cortados com o nome inteiro na dica): de ~25 colunas largas
  para 1.444 px.
