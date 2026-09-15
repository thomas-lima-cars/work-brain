# Cars2You — Histórico

> Linha do tempo. Base pra detectar contradição entre o que foi dito antes e agora.

## 2026-09-03
- Frente criada no onboarding do work-brain.
- Classificada como frente **quente**.

## 2026-09-03 (tarde)
- Segue **quente**, agora com conteúdo: a frente concentra a camada de automação e
  relatórios que serve todas as outras, além dos whitelabels próprios 4 (Trucks2you) e
  7 (Marketplace Cars2You).
- **Importado o ambiente n8n inteiro** pro brain: 25 workflows inventariados, 6 credenciais,
  9 crons, procedimento de cópia de workflow via MCP. Ver `automations/`.
- Pendente meu: **Pulso de Eventos no Ar** (`20LeyMLjrAKeKVeS`) — encurtar a mensagem e
  pôr bolinha colorida no início. Alinhar com o **Doni**.
- Governança em aberto (ata 02/09): onde hospedar os relatórios (hoje na cloud/máquina do
  Caio), inventário + nomenclatura + status, e medir uso por time — marketing hoje não usa.
- **Débito estrutural:** nenhum dos 9 crons tem alerta de falha, contra o próprio princípio
  "falha silenciosa é proibida".

## 2026-09-09

- **Esquema do banco importado pro brain.** 144 tabelas, 1.474 colunas, 239 FKs, em
  `context/banco-de-dados/`. Fundido de duas fontes (o `.txt` e o diagrama) porque nenhuma
  bastava: 49 colunas de 4 tabelas só existem numa delas, e a coluna "Referenciada por"
  não existe em nenhuma — foi derivada invertendo as FKs. **Consultar antes de escrever SQL.**
- **Documentados os limites do MCP `run_query`** (`automations/n8n-sdk/README.md`), que
  eram conhecimento tribal: sem window function, resposta cortada em **50 linhas**, deadline
  de 60s. Explica o `RX_PAGE = 50` que existia sem justificativa no código antigo.
- **Dois relatórios novos**, ambos no padrão de duas fases (conta primeiro, pagina o exato):
  - `lojas-ofertas` (`LZL3mxfbMIz4avyx`) — perfil de compra das 1.300 lojas em 6 meses.
  - `rel-veiculos` (`8fiTFsjWG9RQinz8`) — aderência veículo × loja para eventos fechando
    nas próximas 48h. Execução 49846: 366 veículos, 613 lojas, 60.295 pares, 8,4 min.
- **Domínio de `advertisement_negotiations.status` decodificado** por medição, não por
  suposição: `1` = em aberto, `2/3/7` = vendido. Sem esse filtro a contagem de disponíveis
  inflava ~5%. Ver `context/banco-de-dados/dominios.md`.
- **Duas armadilhas de dados achadas de quebra**, na mesma página: o catálogo `models` tem
  nomes duplicados em duas faixas de id (Amarok, Fiorino, Strada), e somar por whitelabel
  infla 1,17× porque `event_whitelabels` é 1:N.
- Aberto: 4 lojas com cara de conta interna (Porto Seguro, Itaú Unibanco, dois "Teste
  Cars2you") aparecem no ranking de compra com perfil real. Esperando o Thomas confirmar.

## 2026-09-10 (madrugada)

- **A base do `rel-veiculos` mudou de regra**, a pedido do Thomas: uma linha por
  **veículo**, com o status da **última negociação** dele — não uma linha por negociação.
  Os feirões LM são diários e reciclam estoque, então contar por negociação duplicava
  carro. A ordem importa: acha a última negociação primeiro, olha o status **depois**.
- **Correspondência mínima de 50%.** Par abaixo disso deixa de existir no relatório.
  Tira 77% dos pares e derruba o arquivo de 4,5 MB para 1,4 MB.
- **Duas armadilhas do banco documentadas** em `context/banco-de-dados/dominios.md`:
  o relógio responde em **UTC** enquanto as datas dos eventos estão em **hora de
  Brasília** (às 21h daqui o banco já virou o dia), e evento encerrado fica com
  `events.status = 0` — exigir `status = 1` exclui por construção o que já fechou.
- **Rodado para os nove eventos que encerraram em 09/09:** 735 veículos que sobraram,
  praticamente todos em "Sem Ofertas". É o estoque para reoferta, com o ranking de
  lojas de perfil parecido para cada um.
- **A tela foi refeita**: layout claro em cartões, filtros de whitelabel, UF e evento
  valendo na página inteira (KPIs inclusive), e um **glossário** em tela própria com 17
  verbetes. O que o filtro não alcança está escrito na tela — o perfil da loja vem do
  histórico de 6 meses dela inteira, então o score não muda com o filtro.
- Pendente: `EVENTOS_IDS` segue preenchido no nó (volta para a janela de 48h esvaziando
  a lista), e as 4 contas com cara de interna continuam no ranking sem confirmação.

## 2026-09-10 (tarde/noite)

- **A UF do veículo mudou de fonte: passou a ser a do PÁTIO** (`shop_stocks`), não a do
  endereço da loja vendedora. Medido antes de valer (sonda 50068): cobertura de 100%
  pelos dois caminhos e **68% dos veículos em UF diferente** da UF cadastral de quem
  vende. Como UF é metade da regra de elegibilidade, isso não reordena o ranking — refaz
  quem pode casar com quem. Os veículos passaram de 2 para **25 UFs distintas**.
- **Link do anúncio na base**, no padrão já decidido em 25/08 e conferido contra os
  exemplos do Gui: `cars2you.com.br/anuncio/veiculo/{marca}/{modelo}/{versão}/{uuid}`.
  Regra dura herdada da lista LM: faltando um pedaço, não entrega link.
- **Janela aberta**: piso fixo em 09/09 e teto nenhum, cobrindo "finalizados a partir do
  dia 09 mais os não finalizados". `EVENTOS_IDS` esvaziado.
- **Status da documentação não existe.** O `information_schema` é bloqueado pelo MCP
  (limite novo, medido) — contornado com `SELECT *` numa linha, que revela as colunas
  pelo cabeçalho. `advertisement_negotiations` tem 37 colunas, todas de preço, oferta,
  prazo e disputa. Fechado pelo lado da negociação; se existe, está em outro lugar.
- **As barras invertidas foram eliminadas na raiz.** As 248 sequências de escape de aspa
  do `montar-html.js` foram dobradas em **duas** transcrições seguidas — o JS do cliente
  nem compilava. A correção não foi "ter mais cuidado": foi trocar o material (crase nos
  elementos de array, `·`/`—`/`↗` como caractere). De 320 barras para 4. E nasceu o
  `_confere_transcricao.py`, que compara o nó com o arquivo local byte a byte.
- **Bug pré-existente exposto:** a `leitura()` da fase 2 tinha `return` dentro do laço e
  lia só a página 0. Com nove eventos os 71 pares de whitelabel cabiam em 50 linhas;
  com 47 eventos sumiam 21 pares, em silêncio.
- Run **50106**: 50 eventos, 1.123 veículos, 728 lojas, 33.718 correspondências.

## 2026-09-11

- **Base restrita a seis whitelabels**, por pedido e com ids confirmados pelo Thomas:
  4 (Trucks2you), 7 (Marketplace), 43 (C6 Auto), 48 (Colaboradores C6), 62 (Lance Fácil
  BTB), 65 (BTB Associados). O filtro vale em quatro lugares; faltar um não dá erro, dá
  base errada. Como id trocado roda liso e só devolve base menor, a fase 1 pergunta ao
  banco o nome de cada id e o relatório confere contra o esperado.
- **Identidade visual**: cabeçalho em #1523A0 com a logo, o tom nos detalhes, título
  centralizado. A logo entra como PNG de duas cores de 570 bytes (o .jpg original viraria
  8.300 caracteres de base64 transcritos à mão) — o fundo dela é #1523A0 medido pixel a
  pixel, então encaixa sem emenda.
- **Acentuação e maiúsculas** em todo o texto visível, KPI de correspondências removido,
  "Quem pode casar com quem" virou **Regras de elegibilidade**.
- **"Sem correspondência" deixou de ser um balde só.** São três causas com decisões
  opostas: canal sem loja compradora (impossível por construção), sem loja na UF, e
  cortado pelo mínimo de 50% — só o último responde ao limiar. No run 50106 eram ~108 /
  ~52 / ~99; com o recorte de canal, o primeiro grupo zerou.
- **Dois truncamentos silenciosos achados e corrigidos**, ambos consequência do recorte
  de canal: as quatro consultas de perfil varriam o universo inteiro com paginação do
  universo filtrado (1.300 = 26 × 50, três lojas sem perfil), e as duas de moda passaram
  a ter folga com conferência de cobertura por loja distinta.
- Pendências que seguem: distribuição do HTML (foi a ~4 MB), as 4 contas com cara de
  interna, e o corte de 50% — 133 veículos mudariam se ele baixasse.

## 2026-09-14/15 — Estudo de precificação: o que move o deságio

Nasceu de um pedido de `SELECT` em `vehicles` e virou um estudo com 13 sondas
(execuções 51069 a 51368) e quatro páginas em
`automations/n8n-sdk/precificacao/`. Deságio = 1 − venda/FIPE.

**O recorte mudou duas vezes**, e cada mudança destravou medida:
- de **código FIPE** para **modelo** (marca + nome normalizados, porque `models`
  reparte o mesmo modelo em ≥50 nomes com ids diferentes);
- e depois para os **20 modelos mais vendidos, sem motos e pesados** — 4.582
  vendas, 50,4% da base elegível.

Com código FIPE, idade rendia 2,6 p.p. de amplitude porque o ano quase não varia
dentro do grupo. Por modelo, virou **9,2 p.p.**, e quilometragem foi de 7,4 para
**15,0 p.p.**, monótona de ponta a ponta.

🔴 **O maior efeito do estudo inteiro está num campo de texto.** `REPASSE`
(1.045 vendas, 35,7% de deságio) contra `TRADICIONAL` (1.123, 28,7%) — **7,0
p.p., t = 40,7**, maior que quilometragem, cluster ou comprador. Não descreve o
veículo: **classifica a operação**. É uma coluna vivendo dentro do `TEXT` de
`vehicles.description`, digitado à mão. Enquanto estiver ali, fica invisível
para qualquer relatório que não tokenize o campo.

🔴 **O status da documentação também está lá dentro** — `Documento Pronto` contra
`DOCUMENTO EM REGULARIZAÇÃO`, 4,3 p.p. Em 13/09 a resposta tinha sido "esse
campo não existe no banco"; existia, em texto.

**Ranking das colunas** (R² controlado por modelo): comprador 41,6% · km 18,1% ·
cluster 18,1% · versão 13,1% · código FIPE 12,5% · pátio 9,7%. Atributo de
catálogo — marca, categoria, carroceria — colapsa para ~zero sob controle.

**Definições que precisaram ser decididas, não supostas:** venda é a **última**
linha válida de `advertisement_negotiations` em status 2/3/7 (correção do
Thomas; a definição anterior inflava 2,6%); valor é `offers.price` via
`offer_actual_id`; "última" sai por `MAX(an.id)` e não por data, porque
`finish_date_offer` tem registro em 1969 e em 2030.

**Qualidade de dado:** o código **Agile 004362-1** tem 39 de 44 vendas com `km
NULL`, `ano_modelo 2010` e **VMV igual ao preço de venda** — até R$ 503 mil para
FIPE de R$ 28 mil. Não são lances fora da curva; são registros de outra natureza
dentro da base de vendas. E o **VMV foi reabilitado**: 91% são plausíveis, com
moda em 0,5–0,8× a FIPE, o que **sustenta a regra "VMV = FIPE × 0,75"** da doc
do C6, nunca antes conferida — o problema é uma cauda de 7,6% acima de 3×.
Confirmado também que **34% das vendas fecham abaixo do VMV**.

Pendências: levar REPASSE/TRADICIONAL a quem decide o modelo de dados; confirmar
`motor nao funciona` (t = 4,1, abaixo do corte de Bonferroni); entender por que
`ipva pago` aparece com **mais** deságio; e um modelo multivariado, já que km,
idade e versão andam juntas.
