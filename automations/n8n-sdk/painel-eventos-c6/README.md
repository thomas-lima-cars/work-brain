# Painel de Eventos C6

> Eventos do Canal de vendas C6 Auto: o que foi publicado, o que recebeu
> oferta, o que vendeu, quem ofertou e arrematou, e quais lojas novas
> entraram no canal. Ranking de lojas e de representantes comerciais por pontuação.

Workflow n8n **`VelPJDX8USP9WIeT`** — "Painel de Eventos C6", no projeto
**pessoal do Thomas** (a pedido, "pessoal por enquanto"). Criado em
2026-09-24. Gatilho manual. Publica em
`Painel de Eventos C6/painel-eventos-c6.html` no site N8N do SharePoint.

```
Rodar → Baixar Representantes → Ler Representantes → Montar Consultas → MCP Consultas
      → Montar Painel → Virar Arquivo → Subir no SharePoint
```

## As regras (decididas pelo Thomas em 2026-09-24)

| | |
|---|---|
| **Recorte** | Eventos que alvejam o **whitelabel 43** (Canal de vendas C6 Auto) com fim de **30 dias atrás em diante** — abertos, agendados e encerrados recentes. Seletor por evento na tela |
| **Vendido / arremate** | Negociação em status **2, 3 ou 7**. Arrematante = loja da oferta vencedora (`offer_actual_id`) |
| **Pontuação** | **1 ponto por veículo ofertado + 10 por arremate**, por evento. Vários lances no mesmo carro valem 1 ponto |
| **Loja nova** | Loja do WL 43 com `shops.created_at` dentro da janela do evento (início das ofertas → fim) |
| **Representante** | `USUARIO_GP` da planilha de lojas ativas do C6, cruzada pelo CNPJ da loja. CNPJ fora da planilha ou sem representante → **"Sem Representante"**. Desde 24/09 — antes era o key account, vazio no canal inteiro. Ver a seção abaixo |

O recorte é por **whitelabel**, não pela loja vendedora como no relatório de
evento de produção (`ehsqQo6hiPDRf58I`, trava em `shop_id = 104754`). A loja
vendedora viaja como coluna e o painel avisa se aparecer outra que não a
104754. Hoje todos os eventos do WL 43 são dela.

## Consultar o mínimo: cinco chamadas, uma linha cada

Pedido explícito: consultar o banco o mínimo necessário, puxando as tabelas
de forma completa e processando no n8n. Cada consulta devolve **uma linha
só**, com a tabela inteira empacotada:

```sql
SELECT COUNT(*) AS total, JSON_ARRAYAGG(JSON_ARRAY(<colunas>)) AS linhas FROM ...
```

O teto de 50 linhas do MCP deixa de existir e não há paginação. É o padrão
do nó SQL Lotes do relatório de evento C6 em produção. O `total` sai da mesma
varredura: se o pacote chegar menor, o Montar Painel **derruba o run** em vez
de publicar meia tabela (há prova sabotando uma linha).

| consulta | o que traz |
|---|---|
| `eventos` | id, nome, status, início, fim, canais |
| `veiculos` | uma linha por negociação: status, vencedora, VMV, FIPE, placa, chassi, marca/modelo/versão, anos, km, laudo |
| `ofertas` | todo lance das negociações do recorte |
| `lojas` | quem ofertou ∪ lojas do WL 43 cadastradas na janela, com o CNPJ (chave do cruzamento — não chega ao HTML) |
| `ult_anterior` | última oferta de cada loja antes de cada evento em que ofertou |

Linhas, tamanho de cada pacote e tempo — por consulta e do run inteiro no
n8n — estão em
[`indicadores.md`](../../../context/banco-de-dados/projetos/c6/indicadores.md).
O maior pacote passou inteiro pelo MCP no primeiro run, e o run todo leva
segundos, não os minutos do Radar. O teto de tamanho do MCP **não é
conhecido**: se o recorte crescer muito (janela maior, evento gigante), a
guarda do `total` é quem avisa — o run cai em vez de publicar meia tabela.

Toda agregação — contagens, pontuação, ranking, deságio, farol, estado do
evento, lojas novas — é feita no JavaScript, a partir dessas cinco tabelas.
Nenhuma consulta foi fundida com outra.

### O cálculo mora numa função só

`calcula(D, sel)` monta KPIs, rankings e tabelas para o recorte escolhido
(`'todos'` ou um evento). Ela roda **no nó** — para o `resumo` que as provas
conferem — e **na página**, pelo `toString()`. Não há uma conta no servidor e
outra no navegador para divergirem.

## A tela

Topo com a logo do C6, título, seletor de evento e troca de tema. Quatro
KPIs (publicados, com oferta, lojas ofertantes, novos lojistas), ranking de
lojas e de representantes, tabela de eventos (clicável — seleciona o evento),
veículos, lojas ofertantes, lojas novas no canal, glossário e rodapé.

| coluna pedida | de onde sai |
|---|---|
| Modelo | marca + modelo + versão, com ano fab./modelo |
| Placa, chassi | `vehicles.plate`, `vehicles.chassi` — pedido explícito; nada de documento de pessoa entra |
| Link do anúncio | `{host}/anuncio/veiculo/{marca}/{modelo}/{versão}/{uuid}`, host `compraveiculos.cars2you.com.br` (vitrine do C6), padrão do Radar |
| Quantidade de ofertas | lances na negociação daquele evento |
| Última oferta | lance de maior `id`, com a hora |
| VMV | `an.min_sale_price` |
| FIPE | `advertisements.fipe_price` (a do anúncio — ver `definicoes.md`) |
| Deságio | `1 − valor ÷ FIPE`; valor = venda se vendeu, senão a última oferta. Marcado fora de 20%–120% da FIPE |
| Laudo cautelar | `vehicle_precautionary_reports.situation` — "sem veredito" ≠ "sem laudo" |
| Data de cadastro da loja | `shops.created_at` |
| Última oferta antes do evento | `MAX(offers.created_at)` da loja com `created_at < início do evento`, em qualquer evento da plataforma |

### Design

O tema é o do brain (`design/tokens/tema.css`) com a **camada do C6** por cima
(`design/tokens/tema-c6.css`): só token de cor, os azuis trocados por cinzas
com base no `#242424`. Logos em `design/marca/c6/`, uma por tema, recortadas
pela caixa medida com `getBBox`. Paleta e contraste em
`design/paletas/c6.json`.

Diferenças do modelo, de propósito:
- **tabelas densas alinhadas à esquerda, números à direita** (regra 8, exceção);
- **no telefone o seletor de evento desce para linha própria** — ao lado do
  título ele comia 143 dos 375px e o topo ia a 140px de altura. É o mesmo
  defeito que o `estado-atual.md` registra no modelo (decisão em aberto).

## O representante comercial (2026-09-24)

A pedido do Thomas, o responsável pela loja deixou de ser o key account (vazio
no canal inteiro) e passou a ser o **representante da planilha de lojas
ativas do C6** — coluna `USUARIO_GP`, cruzada pelo CNPJ.

| | |
|---|---|
| Onde mora | `Painel de Eventos C6/_dados/LojasAtivas_C6.xlsx`, site N8N. Quem atualiza **substitui o arquivo no mesmo caminho** |
| Como é lida | `Baixar Representantes` (HTTP, arquivo) → `Ler Representantes` (Extract from File, **primeira aba**, tudo como texto). Em série, antes das consultas: em ramo paralelo o nó roda tarde demais (Radar, run 52930) |
| Chave | CNPJ, só dígitos, completado a 14. `shops.cnpj` entra na consulta de lojas e **não chega ao HTML** |
| Fora da planilha / sem representante | "Sem Representante" |
| CNPJ com mais de um representante | fica o que aparece em **mais linhas**; empate → "Sem Representante". Os dois viram aviso |
| Planilha ausente, truncada ou sem as colunas | **o run cai** — publicar todo mundo "Sem Representante" seria uma tela plausível e errada |

A aba não é fixada pelo nome porque o nome é o de um job do BigQuery
(`bquxjob_…`) e muda a cada exportação. O perfil da planilha de 24/09 está em
[`indicadores.md`](../../../context/banco-de-dados/projetos/c6/indicadores.md).

`resumo.representantes`, na saída do Montar Painel, conta por qual caminho
cada loja passou (`unico`, `maioria`, `empate`, `fora_planilha`,
`vazio_planilha`, `sem_cnpj`). Sem isso, "a planilha não tem a loja" e "o CNPJ
não veio do banco" dariam a mesma tela.

## Ciclo de trabalho

```bash
python coleta_local.py                     # coleta real pela conexão direta (VPN) → dados-local.json
node _aplica-modelo.js                     # tema + logos para dentro do Montar Painel
for f in montar-consultas.js montar-painel.js virar-arquivo.js; do node _enxuga.js $f; done
python _planilha_local.py                  # planilha no formato do n8n → dados-planilha-local.json
node prova-local.js                        # 102 provas
node monta_local.js                        # regera saida-local.html sem n8n
python build_wf.py                         # painel-eventos-c6.wf.ts
```

E **depois de sincronizar com o n8n, antes de rodar**:

```bash
python _confere_transcricao.py <dump-do-get_workflow_details>
```

| arquivo | o que é |
|---|---|
| `montar-consultas.js`, `montar-painel.js`, `virar-arquivo.js` | os três nós Code, **com** comentário — a fonte |
| `n8n/*.js` | os mesmos, **sem** comentário de bloco (`_enxuga.js`). É o que vai pro n8n. Derivado: não editar |
| `_aplica-modelo.js` | injeta `tema.css` + `tema-c6.css` e as duas logos nos blocos `TEMA`/`LOGOS` |
| `_roda_no.js` | roda um nó Code fora do n8n, com `$()` de mentira |
| `coleta_local.py` | roda o SQL exato do nó pela conexão direta e grava no formato do MCP |
| `_planilha_local.py` | converte a planilha no que o nó Ler Representantes entrega (tudo texto, célula vazia omitida) |
| `prova-local.js` | 102 provas — as de antes mais o cruzamento de representante caso a caso, CNPJ que não vaza, e planilha ausente/truncada/sem coluna derrubando o run — sem barra invertida, blocos frescos, soma dos eventos = total, cruzamento com medição independente, pontuação recalculada do cru, HTML offline e sem PII de pessoa, BOM, pacote sabotado derruba o run, nó enxuto = nó original |
| `_confere_transcricao.py` | compara o código no n8n com `n8n/*.js`, byte a byte |
| `build_wf.py` | gera o `.wf.ts` |

`dados-*.json` e `saida-*.html` ficam fora do git (`.gitignore`): têm nome real
de loja e placa.

### Por que o código vai cru e sem comentário

O nó do painel tem 52 KB e é transmitido à API **por extenso**. Pela
`update_workflow` ele iria dentro de JSON, com cada aspa dupla escapada à mão
— centenas de atributos HTML. Pela criação a partir de código ele vai cru,
dentro de um literal de template, e o gerador barra as três coisas que
quebrariam o literal (barra invertida, crase, `${`). Tirar o comentário cortou
7 KB da transmissão sem mudar comportamento: a prova confere que o nó enxuto
calcula o mesmo resumo, gera a mesma marcação e embute o mesmo dado.

Primeira sincronização (24/09): os três nós **idênticos byte a byte**.

## Pendências

- 🔴 **Subir a planilha no SharePoint.** O workflow lê
  `Painel de Eventos C6/_dados/LojasAtivas_C6.xlsx` no site N8N. Sem ela o run
  cai no primeiro nó — de propósito.
- 🔵 **Primeira publicação no SharePoint** — o upload está **desligado** até o
  run de validação com a planilha. Depois de ligado, quem dispara é o Thomas.
- 🔵 **Sem cron.** Manual, como o Radar. Se for rodar sozinho, o C6 fecha 16h
  ou 20h com prorrogação de até ~1h20 depois do fim oficial.
- ❓ **Evento 23995 "Evento Exclusivo C6 Auto – Setembro"** — 1 hora de
  duração (30/09 17:13–18:13), 8 veículos, `situation = 1`. Tem cara de teste
  ou preparação. Entra no painel como Agendado.
- 🔵 Mudar a pasta ou o nome do arquivo depois **abre pasta nova** e deixa a
  antiga órfã (upload por path) — o Radar já tem duas assim.
