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
python automations/estudo-republicacoes-dealers/monta-excel.py         # estudo-republicacoes-dealers.xlsx, o analítico (~3,4 MB)
```

Os três arquivos gerados ficam **fora do git** (`.gitignore`): têm nome de comitente,
de evento e id de veículo. O HTML abre no navegador interno pelo servidor
`previa-radar` (porta 8777), porque passa de 600 KB.

## Atualização semanal (23/11)

Pedido do Thomas: subir no n8n, toda segunda às 0h, com saída numa pasta de estudos no
SharePoint. O n8n Cloud não alcança a Dealers (fora da VPC; o MCP só tem a Cars2You),
então **o estudo roda no PC do Thomas e só a entrega passa pelo n8n**:

- **Tarefa do Windows** "Estudo de Republicacoes Dealers": toda segunda 0h, com o
  usuário logado; se o PC estiver desligado, roda quando ligar. Criada por
  `agenda-tarefa.ps1` (rodar de novo atualiza).
- **`roda-semanal.ps1`**: testa as duas bases a cada 15 min por até 12 h (à 0h a VPN
  costuma estar desligada; o estudo sai quando ela subir), roda os três passos e envia
  o HTML ao workflow **Receber Estudos** (`bbbITLpsU9wc9rAR`, ver
  [`n8n-sdk/receber-estudos/`](../n8n-sdk/receber-estudos/README.md)), que grava em
  `Documentos Compartilhados/Estudos/estudo-republicacoes-dealers.html` (site N8N).
  Endereço e token em `~/.estudos-n8n.env`, fora do repo.
- Log em `rodadas.log` (fora do git). Código de saída: 0 ok, 2 sem `.estudos-n8n.env`,
  3 VPN não subiu em 12 h, 4 um passo falhou, 5 HTML não gerado, 6 envio falhou,
  7 o n8n não confirmou. Em qualquer erro o HTML do SharePoint fica o da semana anterior.
- ⚠️ **Ninguém é avisado da falha**: olhar o `rodadas.log` ou a data do arquivo na pasta.
- ⚠️ **A placa vai junto**: no SharePoint ela fica à vista de quem abre a pasta
  Estudos (a exceção do `qualidade.md` era para arquivo fora do git).

## Como o carro é casado

- **Chassi** (17 caracteres, só letras e números); quando um dos lados não tem
  chassi, **placa** (7 caracteres, Mercosul convertida ao formato antigo: o 5º
  caractere A..J vira 0..9).
- Placa e chassi são **embaralhados dentro do SQL** (`SHA2` com um sal aleatório
  desta rodada) para o casamento, e os hashes não são gravados. O chassi nunca chega
  ao Python. **A placa dos carros casados sai no passo 2 desde 23/11**, a pedido do
  Thomas, para a tabela de veículos: exceção declarada à regra de PII do
  `qualidade.md`. Ela só vive nos três arquivos gerados, que ficam fora do git.
- Valor de chassi ou placa em mais de **3 veículos da mesma base** é cadastro lixo
  e não casa. Mesma placa com chassi diferente não é o mesmo carro.
- Os carros saem de um grafo: um carro pode ter mais de um `vehicles.id` na
  mesma base.

## Escolhas (minhas, 18/11 — confirmar com o Thomas)

- **Publicação** = uma negociação; o dia é o início das ofertas do evento (sem
  evento, o da negociação). **2026** = início de 01/01/2026 até a hora da coleta:
  a **publicação agendada** (evento que ainda não abriu) fica fora (Thomas, 23/11);
  há início em 2027 e 2028, data lixo, que também fica fora.
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

## Idas e voltas, devolvidos e erro operacional (23/11)

- **Passagem** = publicações de 2026 seguidas na mesma base, em ordem de início. A
  dica (no Modelo ou em Passagens) é uma tabela vertical **com uma linha por
  passagem**, em ordem: linha nova só quando o carro foi transferido de banco. Cada
  linha: banco, início e fim, **dias publicados**, publicações, status da última (com
  a contagem e o último evento embaixo), ofertas somadas, maior oferta, última oferta
  (da publicação mais recente com oferta), % FIPE, venda e data da venda, FIPE. No
  alto, o total de dias publicados em cada banco. Aparece ao passar o mouse ou focar;
  o clique fixa (serve no celular), Esc ou clique fora fecha.
- (minha) **Dias publicados** = dias de calendário em que alguma publicação da passagem
  estava no ar, contando o dia do início e o do fim; dias sobrepostos contam uma vez.
  Um evento de 27 a 28/08 conta 2 dias.
- **Devolvido** (definição do Thomas) = voltou à base de origem depois de passar pela
  outra: três passagens ou mais.
- **Erro operacional** = (a) **no ar nas duas ao mesmo tempo**: janelas que se cruzam,
  sem contar uma terminar na hora em que a outra começa; ou (b) **republicado com a
  outra base vendida ou em análise**: a última publicação da outra base que começou
  antes está em Vendido, Aguardando pagamento ou confirmação, ou Em análise. O status
  é o de hoje.
- (minha) **A publicação cancelada sai do ar no `updated_at` da negociação**, quando ele
  vem antes do fim do evento: o banco não guarda a hora do cancelamento. Sem essa
  coluna (coleta de 18/11), ela fica no ar até o fim do evento. Com a regra antiga,
  sem contar as canceladas, os simultâneos caíam de 158 para 95.
- "Nas duas ao mesmo tempo" (KPI, achados e tabela Por ordem) passou a usar a mesma
  regra do erro (a).
- **Data da venda** = dia da oferta vencedora da publicação vendida (sem ela, o fim do
  evento).

## Arquivos

| arquivo | o que faz |
|---|---|
| `extrai.py` | passo 1 (veículos de 2026 com hash de placa/chassi, nas duas bases), casamento, passo 2 (toda negociação dos casados) |
| `analisa.py` | uma linha por carro, com os dois lados; todas as escolhas acima são constantes daqui |
| `estudo.template.html` | a página; todo cálculo mora nela, refeito a cada filtro |
| `monta-estudo.js` | compacta o JSON, embute `tema.css` e as logos da Cars2You, método e glossário |
| `monta-excel.py` | o **analítico em Excel** (`estudo-republicacoes-dealers.xlsx`, fora do git): Resumo e Por comitente em fórmulas sobre a aba Veículos (um carro por linha, os dois lados), Passagens, Publicações e Método. Depois de gerar, abrir e salvar no Excel para gravar os valores |
| `roda-semanal.ps1` | a rodada semanal: espera a VPN, roda os três passos e envia ao n8n |
| `agenda-tarefa.ps1` | cria ou atualiza a tarefa do Windows de segunda 0h |

## Histórico

- **2026-11-18** — primeira versão: 1.401 carros, tema escuro, filtros de
  categoria, ordem e comitente, tabelas por ordem, por comitente e carro a carro.
- **2026-11-18 (tarde)** — pedido do Thomas: filtro de período (de/até, pelo dia
  da republicação = estreia na 2ª base; o gráfico mostra só os meses do período),
  saem as tabelas "Ofertas e preço, lado a lado" e "Status da última publicação de
  2026", e a tabela de veículos fica enxuta (valores em R$ mil, títulos curtos,
  comitente e modelo cortados com o nome inteiro na dica): de ~25 colunas largas
  para 1.444 px.
- **2026-11-19** — pedido do Thomas: a tabela de veículos centraliza o conteúdo e
  quebra linha no comitente e no modelo em vez de cortar, para o texto aparecer
  inteiro (as linhas ficam mais altas; a dica do modelo segue com os detalhes).
  No mesmo dia, as tabelas Por ordem e Por comitente (grupo 2) passaram a quebrar o
  título da coluna quando a tela não comporta a tabela: numa tela de ~1.000 px elas
  cabem sem rolar de lado (961 e 946 px); no celular ainda rolam dentro da caixa.
- **2026-11-23** — pedido do Thomas: a tabela de veículos ganhou **Placa**, **Data
  venda** de cada base, **Passagens** (rota C → D → C com a dica de cada ida e volta),
  **Devolvido** e **Erro op.** (Simultâneo, Vendido / análise ou Os dois, com o motivo na
  dica), e um filtro Todos · Devolvidos · Erro operacional ao lado da busca, que agora
  acha placa também. Um achado novo resume os dois marcadores. A tabela passou de
  1.444 para ~1.880 px e rola de lado dentro da caixa. Coleta nova no mesmo dia, com a
  placa e o `updated_at`. Depois, pedido do Thomas: **sem as publicações agendadas**
  (226 da Cars2You, eventos de 24 a 29/11), o que deixa 1.466 carros, e a dica de
  Passagens virou uma tabela (banco, início e fim, status e data da venda) — ver
  indicadores. Por fim, a tabela **Por ordem** ficou no formato da Por comitente:
  ordenável, colunas por base (vendidos, venda ÷ FIPE e última oferta ÷ FIPE na
  Cars2You e na Dealers) em vez de 1ª/2ª, contagens em vez de %. Saíram as colunas
  "Nas duas ao mesmo tempo" e "Com oferta" (o primeiro segue no KPI e nos achados).
  Depois, pedido do Thomas: a **tabela de veículos virou resumo** (Placa, Comitente,
  Modelo, Ano, Cat., Ordem, Interv., Passagens, **Vendido** = base e dia da venda,
  Devolvido, Erro op.; ~1.370 px, sem rolar de lado numa tela larga) e o comparativo
  Cars2You × Dealers foi para a **dica**, que abre no Modelo ou em Passagens: comitente
  de cada base, 1ª publicação, publicações, ofertas, maior e última oferta, última ÷
  FIPE, status, venda, data e venda ÷ FIPE, FIPE, Molicar e último evento; embaixo, a
  tabela de passagens e o motivo do erro operacional. Rolar dentro da dica não a fecha.
  Por último, a **dica virou uma tabela vertical com todas as publicações de 2026 das
  duas bases, em ordem de início** (banco, evento, início, fim, dias, status, ofertas,
  maior e última oferta, % FIPE, venda, data da venda, FIPE; linha forte em cada troca
  de base; comitente de cada base no cabeçalho). O comparativo lado a lado e a tabela
  de passagens saíram da dica. `analisa.py` grava as publicações por carro (`pubs`,
  datas em dias desde 01/01/2026, evento por índice em `eventos`): 21.049
  publicações, 1.778 eventos, e o HTML passou de ~0,9 para ~1,96 MB. Em seguida, a
  dica foi **resumida por passagem** (linha nova só na transferência), com os dias
  publicados em cada banco; o resumo é calculado na página a partir das `pubs`.
  Depois, um quinto cartão no topo, **Tempo de venda** (mediana da data da venda menos
  a 1ª publicação de 2026 no mesmo banco, nas duas juntas e em cada uma; grade
  `.g4.g5`, que quebra em 3, 2 e 1 colunas), e a mesma conta na dica, por banco, com
  as duas datas. E a tabela de veículos ganhou a coluna **1ª publicação** (a 1ª de
  2026, no banco em que o carro estreou; a dica diz qual banco e a data no outro).
  Por fim, **médias no lugar das medianas em toda a página** (cartões, achados, gráfico
  de intervalo, tabelas Por ordem e Por comitente), pedido do Thomas. Os prazos mudam
  muito (tempo de venda de 3 para 18,9 dias, e a Dealers passa de mais rápida a mais
  lenta); os % da FIPE quase nada. Comparação em indicadores. **No mesmo dia a
  página voltou para MEDIANA** (Thomas), e os cartões de Intervalo e de Tempo de
  venda ganharam uma **dica com boxplot** (mouse, foco ou clique no cartão; ícone no
  canto): uma caixa por grupo (todas e cada ordem; as duas bases e cada banco),
  quartis por interpolação linear, bigodes de Tukey (1,5 × a caixa), média em
  losango, o eixo até o maior bigode e os carros além dele contados à direita; embaixo,
  a tabela com carros, mínimo, quartis, mediana, 90%, máximo e média. Segue os filtros.
  Depois: **Venda ÷ FIPE em média** (cartão, achado de preço e as tabelas Por ordem e
  Por comitente; a última oferta ÷ FIPE segue em mediana), e os **cabeçalhos da tabela
  de veículos filtram**: uma linha de filtros embaixo dos títulos (texto em Placa e
  Modelo; lista em Comitente, Passagens, Ano, Cat., 1ª publicação por mês, Interv. por
  faixa, Status, Vendido, Devolvido e Erro op.), presa ao rolar, combinada com a busca,
  com "Limpar filtros da tabela" e o contador "N carros de M". O marcador Todos ·
  Devolvidos · Erro operacional saiu (os cabeçalhos fazem o mesmo). Depois: a tabela de veículos ganhou **Status** (o da publicação mais recente
  do carro nas duas bases, com o banco embaixo e o evento e as datas na dica), perdeu a
  coluna Ordem (segue no filtro, na dica e na 1ª publicação) e Passagens veio para logo
  depois do Modelo.
- **2026-11-23 (noite)** — pedido do Thomas: **atualização semanal**, segunda 0h, no
  SharePoint (`Estudos/`). Como o n8n não alcança a Dealers, roda no PC (tarefa do Windows +
  `roda-semanal.ps1`) e entrega pelo workflow Receber Estudos (`bbbITLpsU9wc9rAR`). Primeiro
  envio em 23/11 (1.472 carros, 2,0 MB); próxima rodada 30/11 0h.
- **2026-11-24** — pedido do Thomas: **analítico em Excel** (`monta-excel.py`), da coleta de 23/11 15h22: 1.472 carros, 3.428 passagens, 21.273 publicações. Resumo e Por comitente são fórmulas (medianas em fórmula de matriz) e conferem com o cálculo do HTML; recalculado pelo Excel, sem erro.
