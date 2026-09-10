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
