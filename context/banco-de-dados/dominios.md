# Domínios e armadilhas — medidos no banco, não supostos

> Complemento do [`schema.md`](schema.md). Lá estão as colunas e os tipos; aqui está o que
> os valores **significam** e onde a leitura ingênua erra. Tudo nesta página foi medido
> por consulta, com a execução anotada. Nada foi inferido do nome da coluna.
>
> **Última medição:** 2026-09-09

## `advertisement_negotiations.status`

**Domínio completo, informado pelo Thomas em 2026-09-09.** Antes disto só se
sabia, por medição, que `1` era o disponível e que `2/3/7` apareciam em
negociação fechada — o resto era buraco.

| status | significado | leitura para relatório |
|---:|---|---|
| **1** | Ativo | **disponível** — é o que o relatório de aderência usa |
| 2 | Aguardando Pagamento | vendido, em liquidação |
| 3 | Aguardando Confirmação de Pagamento | vendido, em liquidação |
| **7** | Vendido | vendido |
| 8 | Suspenso | fora do ar |
| 9 | Em Análise Comprador | negociação viva |
| 10 | Cancelado | morto |
| **11** | **Sem Ofertas** | **sobrou do evento: ninguém deu lance** |
| 13 | Em Análise Vendedor | negociação viva — há oferta na mesa |
| 14 | Vendedor Rejeitou | sobrou: o vendedor recusou a oferta |
| 15 | Comprador Rejeitou | sobrou: o comprador desistiu |
| 18 | Venda Cancelada | sobrou: a venda caiu depois de fechada |

**A distinção que importa** ao montar base de "veículo ainda disponível":

- `1` é o único estado *dentro* de evento aberto.
- `11`, `14`, `15` e `18` são **sobra**: o veículo passou pelo evento e não
  foi vendido. É o candidato natural a reoferta.
- `9` e `13` **não** são sobra — existe oferta em análise. Tratar como
  disponível seria ranquear loja para carro que já tem negócio na mesa.
- `2`, `3` e `7` são venda; `10` e `18` diferem: `10` cancela a negociação,
  `18` cancela uma venda que já tinha fechado.

⚠️ Medição de 2026-09-09 nos eventos ativos daquele momento: `1` = 908
negociações, e o resto somava 17. Os estados de sobra só aparecem em volume
**depois** que o evento fecha.

## Eventos encerrados: `events.status` vira 0

Medido na sonda 49961. Os nove eventos que encerraram em 2026-09-09 (Bradesco,
cinco feirões LM, C6 Auto, Outlet Netcarros e Venda Direta IGA) estão **todos**
com `events.status = 0`, nenhum deletado, somando 846 negociações — e **zero**
delas em `status = 1`.

Duas consequências para quem monta recorte de evento:

1. `e.status = 1` significa **evento aberto**. Filtrar por ele exclui, por
   construção, tudo que já encerrou. É o mesmo `0` do "Preparação Repasse".
2. Ampliar a janela de datas **não basta** para trazer evento encerrado de
   volta: mesmo sem o filtro de status do evento, `an.status = 1` devolve
   zero. Para ver a sobra é preciso aceitar `11`, `14`, `15` e `18`.

No evento C6 Auto de 09/09, as 29 negociações ficaram em `11` (22 veículos,
sem ofertas) e `13` (7, em análise do vendedor).

## ⚠️ O relógio do banco está em UTC; as datas dos eventos, em Brasília

**Medido na sonda `a6fNNTUYYayehNIn`, execução 49954.** A consulta
`SELECT NOW(), CURDATE()` devolveu:

```
agora = 2026-09-10 01:51:56     hoje = 2026-09-10
```

...quando em São Paulo eram **22:51 do dia 9**. Mas `events.finish_date_event`
guarda hora **local**, sem fuso: o evento "Venda Direta IGA" fecha
`2026-09-10 16:00`, e o IGA fecha às 16h de Brasília. Os nomes dos eventos
("— 10/09/26") também batem com a data da coluna, não com a UTC.

**Consequência:** comparar `finish_date_event` com `NOW()` compara maçã com
laranja, e o recorte fica 3 horas adiantado. Das 21h à meia-noite de Brasília,
`CURDATE()` já aponta para o dia seguinte — então "eventos de hoje" perde o
dia inteiro, em silêncio.

Foi exatamente assim que um pedido de "incluir os eventos que encerraram
hoje" voltou vazio: a janela abria na meia-noite errada.

**O jeito que funciona:** calcular o piso e o teto fora do SQL, em hora de
Brasília, e mandá-los como literal:

```sql
AND e.finish_date_event >= '2026-09-09 00:00:00'
AND e.finish_date_event <= '2026-09-11 22:54:00'
```

Ver `automations/n8n-sdk/rel-veiculos/montar-fase1.js`, que faz a aritmética
sobre o epoch e lê com `getUTC*` — assim o fuso do processo (também UTC) não
interfere.

⚠️ Não sei se **todas** as colunas de data do banco seguem essa convenção. O
que está medido é `events.finish_date_event` e `events.start_date_display`.
Para outras tabelas, medir antes de comparar com `NOW()`.

## O catálogo `models` tem nomes duplicados em duas faixas de id

Encontrado ao conferir a execução **49846** do relatório de aderência: veículo "Strada" e
loja cujo modelo mais ofertado é "Strada", casando por id, davam **zero**.

| modelo | ids encontrados |
|---|---|
| Amarok | 1089 e 2000000427 |
| Fiorino | 893 e 2000000460 |
| Strada | 601 e 2000000428 |

A faixa `2000000xxx` tem cara de catálogo importado de outra fonte, convivendo com o
original. **Consequência prática:** comparar modelo por `model_id` devolve "não bate" para
carros que são o mesmo modelo. Comparar por nome resolve esses casos, mas junta versões
que talvez devessem ficar separadas — não há resposta óbvia, é decisão de negócio.

Tamanho medido: **8 de 60.295 pares** naquele relatório (0,01%), valendo ~12 pontos de
score cada. Irrelevante no agregado, mas é duplicação real de catálogo.

⚠️ Os três só apareceram porque estavam entre os veículos daquele relatório. **O catálogo
inteiro não foi varrido** — pode haver muito mais. `categories` não apresentou o problema.

## Somar por whitelabel infla o número

`event_whitelabels` é 1:N — um evento alveja vários whitelabels, e o mesmo veículo conta
em cada um. Medido em 2026-09-09: a soma por whitelabel deu **305** contra **261** veículos
reais. Inflação de **1,17×**.

O sintoma é visível a olho nu quando aparece: Banco GM, Apeop, Clube FMP e Canal de vendas
Omni mostravam **exatamente 21 veículos, 3 eventos, 1 loja** cada — o mesmo lote de 21
carros de uma loja só, exposto em quatro canais.

**Regra:** para total de veículos, conte sem fatiar por whitelabel. A fatia por whitelabel
serve para ler distribuição, nunca para somar.

## A UF do veículo é a do PÁTIO, não a do endereço da loja

**Medido na sonda `a6fNNTUYYayehNIn`, execução 50068** (2026-09-10), sobre 1.879
negociações de eventos que encerram a partir de 09/09.

O carro não está no escritório da loja: está num **pátio**, que é o que
`shop_stocks` guarda — "estoques de uma loja, que podem ser locais físicos
diferentes", com `state` e `city` próprios. Há dois caminhos até ele,
`advertisements.shop_stock_id` e `vehicles.shop_stock_id`, e **os dois estão
preenchidos em 100% dos casos** (1.879 de 1.879, com UF preenchida em todos).

| Medida | Valor |
|---|---|
| negociações na janela | 1.879 |
| pátio pelo anúncio / pelo veículo | 1.879 / 1.879 |
| pátio com UF | 1.879 |
| **UF do pátio ≠ UF do endereço da loja** | **1.278 (68%)** |

🚨 **68% divergem.** Como a elegibilidade exige mesma UF, trocar a fonte não é
cosmético: **refaz quem pode casar com quem**. Relatório que use a UF da loja
vendedora está respondendo sobre outra praça.

As 25 UFs do pátio já vêm como sigla limpa de duas letras, sem vazios — SP 970
(em 40 pátios), MG 147, BA 146, RJ 110, PR 98, MT 62, GO 55, RS 49, CE 37, e
cauda. Normalizar (`UF_CASE`) é desnecessário ali; a validação contra a lista
das 27 vale como guarda contra sujeira futura, não como caminho.

## As 5 colunas ocultas de `advertisement_negotiations`

O diagrama do banco documenta 32 colunas; a tabela tem **37**. Como o
`information_schema` é bloqueado pelo MCP (ver `automations/n8n-sdk/README.md`),
saíram por `SELECT *` numa linha, na execução 50069. As cinco que faltavam:

`close_seller_analysis_even_if_vmv_reached`, `receive_proposal_above_from_realtime`,
`show_client_name`, `reason`, `seller_at`.

🔴 **Não existe status de documentação aqui.** As 37 colunas são todas de preço,
oferta, prazo e disputa. Somado ao fato de que toda coluna `document` do esquema
documentado é CPF/CNPJ, o caso está fechado por esse lado.

`advertisements` tem **12** colunas e **nenhuma de URL** — o link do anúncio tem
que ser composto (padrão em `automations/n8n-flows/lista-lm-propostas.md`).
`whitelabels` tem **43**, incluindo `url`, `configurated_url`, `url_webapp` e
`authorized_domains`: o domínio de cada canal existe, se um dia o link precisar
levar o lojista ao canal dele em vez do marketplace.

## `vehicle_precautionary_reports.situation` — o laudo cautelar

Medido na sonda **50346** (2026-09-11). VARCHAR, cinco valores, legíveis:

| situation | laudos | leitura |
|---|---:|---|
| `nao_informado` | 69.580 | laudo existe mas não traz resultado — **é a maioria, 78%** |
| `aprovado` | 10.922 | limpo |
| `aprovado_com_apontamento` | 4.619 | passou com ressalva |
| `reprovado` | 2.995 | não passou |
| *(vazio ou nulo)* | 850 | |

⚠️ **`nao_informado` não é ausência de laudo — é laudo sem veredito.** São
coisas diferentes e as duas existem: 95,8% dos veículos ofertados têm linha em
`vehicle_precautionary_reports`, mas quase quatro em cada cinco dessas linhas
não dizem o resultado. Qualquer "% por status de laudo" que trate
`nao_informado` como "sem laudo" mistura as duas e mente.

Uma linha por veículo: `n` e `COUNT(DISTINCT vehicle_id)` batem nos cinco
valores, então não há histórico de laudos por veículo — é o estado atual.

## `transactions.situation` — a compra

Medido na sonda **50346**. Só **três** valores, e o significado **não** foi
decidido:

| situation | transações | lojas compradoras |
|---:|---:|---:|
| 2 | 9.183 | 808 |
| 1 | 2.411 | 644 |
| 3 | 1.861 | 435 |

Não confundir com `advertisement_negotiations.status`, que tem 12 valores e
significado documentado. São tabelas diferentes com colunas homônimas.

🚨 **Antes de usar "comprou" em qualquer regra, decidir quais desses três
contam.** A diferença é grande: 808 lojas no valor 2 contra 435 no valor 3.

## ⏳ Três tabelas só têm cerca de UM ANO de histórico — mas `offers` não

Medido na sonda **50346**, e é a descoberta que mais restringe o que dá pra
prometer:

| tabela | registro mais antigo |
|---|---|
| `access_logs` | 2025-08-31 |
| `vehicle_precautionary_reports` | 2025-08-31 |
| `transactions` | 2025-09-02 |

A coincidência de duas tabelas começarem no **mesmo dia** aponta migração ou
política de retenção, não início de operação — `user_access` vai a 2022 para as
mesmas lojas.

⚠️ **Corrigido em 2026-09-11 (sonda 50347): isto vale para essas três
tabelas, NÃO para o banco todo.** `offers` começa em **2020-06-24**, com
749.109 ofertas. A generalização anterior ("o banco só tem um ano") estava
errada e mudava uma conclusão prática:

| pergunta | verificável? |
|---|---|
| "nunca **ofertou**" | ✅ sim — `offers` cobre 6 anos |
| "nunca **acessou**" | ❌ não — só "não desde 31/08/2025" |
| "nunca **comprou**" | ❌ não — `transactions` só desde 02/09/2025 |

🚨 Qualquer segmentação com faixa "nunca acessou" está medindo "não nos
últimos 12 meses" e precisa dizer isso na tela, senão promete uma certeza que
o dado não tem.

`user_access` (via `user_shops`) alcança 2022 e é a saída quando a pergunta
for mesmo "nunca". Custa um join a mais e não tem `shop_id` direto.

## Contato de loja: o e-mail praticamente não existe

Medido na sonda **50346**, nas 1.298 lojas com oferta nos últimos 6 meses dos
seis canais:

| coluna de `shops` | preenchida |
|---|---:|
| `comercial_number` | 1.029 (79,3%) |
| `whatsapp_number` | 1.026 (79,0%) |
| `privative_number` | 116 (8,9%) |
| `comercial_email` | **75 (5,8%)** |
| `privative_email` | **62 (4,8%)** |

⚠️ Telefone é coluna utilizável; **e-mail em `shops` não é**.

✅ **O e-mail existe — em `users`, via `user_shops`** (medido na sonda 50347):

| medida | valor |
|---|---:|
| lojas da base com usuário vinculado | 1.291 de 1.298 |
| lojas com pelo menos um e-mail | **1.291 (99,5%)** |
| usuários vinculados | 1.534 |
| usuários com e-mail | 1.534 (100%) |

**5,8% em `shops` contra 99,5% em `users`.** A fonte do e-mail de loja é
`users`, sem dúvida.

⚠️ 1,19 usuário por loja — a maioria tem um só, mas parte tem vários, então
"o e-mail da loja" exige regra de desempate. `user_shops.function` **não
serve**: está nulo em 15.994 dos 20.634 vínculos. Usar **menor `user_id`**,
pelo mesmo motivo que a moda usa `MIN(item_id)`: é determinístico entre runs.

🔴 **`privative_*` é contato pessoal, não da empresa.** Em relatório que vai
pro SharePoint do time, o defensável é `comercial_*` e `whatsapp_number`.

## `advertisements.fipe_price` é a coluna de FIPE que está preenchida

Medido na sonda **50346**, sobre as 104.305 ofertas da janela de 6 meses:

| coluna | preenchida |
|---|---:|
| `versions.code_fipe` | 89.944 (86,2%) |
| `advertisements.fipe_price` | 89.327 (85,6%) |
| `vehicles.fipe_price` | 66.514 (63,8%) |

**Não existe tabela de preço FIPE por código.** `code_fipe` é só o código; o
valor vive denormalizado nas outras duas, e elas divergem entre si em 633
ofertas. Para cálculo de deságio, usar `advertisements.fipe_price` — é a do
anúncio, tem 22 pontos a mais de cobertura, e é contemporânea da oferta.

🚨 **Há lixo nos extremos.** Deságio calculado sobre a última oferta vai de
**−1.586%** a **+94%**: existe oferta 16 vezes acima da FIPE registrada. Média
simples por loja é destruída por um caso desses — qualquer agregação precisa
de corte de outlier declarado.

## `shops.situation` — seis valores, e só um opera

Medido na sonda **50347**, nas 21.188 lojas dos seis canais:

| situation | lojas | com oferta em 6M |
|---:|---:|---:|
| **3** | 17.250 | **1.285** |
| 1 | 3.419 | 0 |
| 2 | 442 | 0 |
| 5 | 37 | 5 |
| 6 | 24 | 8 |
| 4 | 16 | 0 |

`3` é o estado operante: 99% das lojas que ofertam estão nele. `1`, `2` e `4`
somam **3.877 lojas com zero oferta** — provavelmente cadastro em andamento ou
encerrado. `5` e `6` são residuais mas **ofertam**, então não são inócuos.

⚠️ "Lojas ativas" não tem definição única no banco. Se a intenção for
`situation = 3`, dizer isso explicitamente — e lembrar que 13 lojas da base
(5 + 8) ficariam de fora.

## `user_shops.function` — medido, e não serve para escolher contato

Medido na sonda **50347**. 13 valores em 20.634 vínculos, mas **15.994 (77%)
são `NULL`**. Curiosidade útil: a função `23` tem 958 vínculos e apenas **9**
usuários com e-mail, contra quase 100% nas outras — é outro tipo de usuário.

Conclusão prática: **não dá para usar `function` como "este é o contato da
loja"**. Para escolher um e-mail entre vários, usar menor `user_id`.

## Segmentação de loja por recência: a base avaliada não segmenta

Medido na sonda **50347** com a regra de sete faixas do Thomas, trocando
"comprou" por "ofertou".

| # | categoria | na base (1.298) | no universo (21.188) |
|---:|---|---:|---:|
| 1 | Diamante — ofertou ≤ 30d | 665 (51,2%) | 665 (3,1%) |
| 2 | Ouro — ofertou ≤ 6 meses | 617 (47,5%) | 617 (2,9%) |
| 3 | Prata — já ofertou, acessou ≤ 90d | 9 | 379 |
| 4 | Recuperação — já ofertou, sem acesso | 7 | 1.343 |
| 5 | Lead Quente — acessou, nunca ofertou | 0 | 1.432 |
| 6 | Lead Morno — sem acesso, nunca ofertou | 0 | 1.417 |
| 7 | Lead Frio — nunca acessou nem ofertou | 0 | 15.335 (72,4%) |

🚨 **Na base do relatório a segmentação é degenerada: 98,8% cai em 1 ou 2.**
E é por construção — a base *é* "lojas que ofertaram nos últimos 6 meses",
então nenhuma pode ser "nunca ofertou". Um campo com dois valores possíveis
não segmenta nada.

⚠️ As 16 lojas em 3 e 4 **não são exceção real**: são artefato de unidade. A
base usa 6 meses de calendário (184 dias nesta janela) e a faixa 2 usa
`INTERVAL 180 DAY`. Os 4 dias de diferença produzem as 16. Ao implementar,
usar a **mesma** definição nos dois lugares.

Os sete só existem sobre o universo inteiro de lojas — é lá que a
segmentação tem para onde variar.

## Ainda sem decodificar

- `situation` e `status` de `advertisements`, `offers`, `vehicles`, `shop_stocks`
- `events.situation` — aparece como 1, 3 e 4 nos eventos observados; o 4 sai
  em evento encerrado e no "Preparação Repasse", mas não foi confirmado
