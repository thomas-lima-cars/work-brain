# Relatório de aderência — veículos em evento × lojas compradoras

Workflow n8n **`8fiTFsjWG9RQinz8`** — "RELATORIO Veiculos em evento - lojas mais aderentes".

Para cada veículo em evento, ordena as lojas por **chance de comprar aquele carro**, a
partir do perfil de compra dos últimos 6 meses. E o inverso: clicando numa loja, ordena
os veículos. Saída é um HTML único, com os dados embutidos e um glossário embarcado.

## O que entra na base

Uma linha por **veículo**, com o status da **última negociação** dele na janela.

**A ordem importa e é fácil de inverter sem perceber:** primeiro se acha a última
negociação (`MAX(an.id)` agrupado por `vehicle_id`, sem olhar status), *depois* se olha o
status dela. O contrário faria um carro vendido hoje reaparecer como disponível pela
negociação de ontem, que ficou em "Sem Ofertas". Há uma prova travando isso.

Entram cinco dos doze status (domínio completo em
[`dominios.md`](../../../context/banco-de-dados/dominios.md)):

| entra | | fica de fora | |
|---|---|---|---|
| `1` | Ativo — evento aberto | `9`, `13` | há **oferta viva na mesa** |
| `11` | Sem Ofertas | `2`, `3`, `7` | venda |
| `14` | Vendedor Rejeitou | `8`, `10` | suspenso, cancelado |
| `15` | Comprador Rejeitou | | |
| `18` | Venda Cancelada | | |

Os quatro últimos são **sobra**: o carro passou pelo evento e não foi vendido. É o
estoque que faz sentido reofertar, e vem marcado com o nome do status na tela.

### O link do anúncio

Cada veículo leva o link do anúncio na plataforma, no padrão decidido na reunião de 25/08
e conferido caractere por caractere contra os exemplos do Guilherme (o raciocínio inteiro
está em [`lista-lm-propostas.md`](../../n8n-flows/lista-lm-propostas.md)):

```
cars2you.com.br/anuncio/veiculo/{marca}/{modelo}/{versão}/{uuid}
```

Tudo minúsculo, `encodeURIComponent` em cada trecho (espaço vira `%20`, **não** hífen) e o
uuid **sem hífens**. São quatro pedaços, não um — `advertisements` não tem coluna de URL.

**Regra dura, herdada da lista LM: faltando um pedaço, o link não é entregue.** Melhor sem
botão que botão que cai em lugar nenhum. Hoje ninguém cai nesse ramo (medido: 1.879 de
1.879 anúncios têm os quatro), mas ele existe para quando cair.

⚠️ **Ter anúncio não é o mesmo que poder receber proposta.** O relatório inclui de
propósito veículo de evento encerrado e de status "Sem Ofertas", então parte dos links
abre anúncio que não aceita mais lance. Aqui isso é o certo — é relatório de aderência,
não lista de compra — e por isso o status aparece ao lado do link.

## A janela de eventos, e a armadilha do fuso

Hoje o recorte é **aberto** (pedido em 2026-09-10): piso fixo em `PISO_FIXO = '2026-09-09'`
e **teto nenhum** (`HORAS_ADIANTE = 0`). Isso cobre "tudo que finalizou a partir do dia 09
mais o que não finalizou" numa condição só — encerrado recente tem fim no passado próximo,
não encerrado tem fim no futuro, e os dois satisfazem `finish_date_event >= piso`.

Medido antes de valer (sonda 50068): **47 eventos, 1.060 veículos**, contra 735 do run
49984. Sem teto entra uma cauda longa — Mega Feirão da Virada (fim 12/12), Banco GM, OMNI,
VWFS, Apeop, Clube FMP, e um "Em preparação Net Carros" que termina em **2027**. Entram de
propósito: "não finalizados" não tem teto. O filtro de **evento** na página é a saída para
isolar uma edição.

Os outros dois modos continuam de pé e provados: `PISO_FIXO = ''` volta o piso para a
meia-noite de hoje; `HORAS_ADIANTE > 0` faz o teto voltar a existir. E preenchendo
`EVENTOS_IDS` o recorte vira uma lista fixa, as datas não valem, e o cabeçalho passa a
dizer isso em vez de anunciar uma janela que não vale.

⚠️ **O piso e o teto são calculados no nó e viajam como literal.** O banco responde
`NOW()`/`CURDATE()` em UTC mas grava as datas dos eventos em hora de Brasília, então às
21h daqui o banco já aponta para o dia seguinte e "hoje" perde o dia inteiro. Não troque
por `NOW()`. O detalhe está em [`dominios.md`](../../../context/banco-de-dados/dominios.md).

Também **não** há filtro de `e.status`: evento encerrado fica com `status = 0`, e exigir
`1` excluiria justamente o que a janela quer trazer. Quem protege é o status da
negociação — evento cancelado deixa as suas em `10`, que não está na lista.

## Os canais que entram (recorte de 2026-09-11)

A base **não** é a plataforma inteira. Só entram eventos e lojas destes seis whitelabels:

| id | canal |
|---|---|
| 4 | Trucks2you |
| 7 | Marketplace Cars2You |
| 43 | Canal de vendas C6 Auto |
| 48 | Colaboradores C6 |
| 62 | Lance Fácil BTB |
| 65 | Lance Fácil BTB Associados |

**Por id, não por nome** — renomear um canal no banco quebraria um filtro por nome em
silêncio. Os seis ids foram **confirmados pelo Thomas em 2026-09-11**; antes disso, 48 e 65
vinham da documentação do brain, que os declara inferidos, e não apareciam na janela para
conferir pelo dado.

🚨 **Id errado não dá erro de SQL.** `IN (4,7,43,99,62,65)` roda liso e devolve uma base
menor, com um canal faltando — e o relatório fica plausível, que é o pior tipo de defeito.
Por isso a fase 1 pergunta ao banco o nome de cada id (`q_wl_nomes`) e o `Montar HTML`
confere contra o nome esperado, declarando falha na tela se divergir.

O filtro vale em **quatro** lugares, e faltar um não dá erro — dá base errada:

1. `SELECAO` — só entra evento que alveja ao menos um dos seis
2. `q_evento_wl` — o veículo só carrega canais permitidos
3. `q_evwl_total` — o gabarito conta a mesma coisa que a consulta, senão a conferência de
   completude acusa falso positivo
4. `q_lojas_total` **e** `q_lojas` — com o **mesmo** filtro, porque um dimensiona a
   paginação do outro; divergir gera página vazia (que custa um agregado inteiro) ou
   coleta incompleta

`WHITELABELS = []` desliga o recorte.

## A regra de elegibilidade

Um par (veículo, loja) **só existe** se as duas condições valerem:

1. **Mesma UF** — a do veículo é a do **pátio** onde ele está (`shop_stocks`), não a do
   endereço da loja vendedora; a da compradora vem do endereço dela.
2. **Whitelabel do evento** — `event_whitelabels` é 1:N, então é `loja.whitelabel_id ∈
   conjunto`, não igualdade simples.

🚨 **A UF do veículo mudou de fonte em 2026-09-10, e não é cosmético: 68% dos veículos têm
pátio numa UF diferente da UF cadastral de quem vende** (sonda 50068, cobertura de 100%
pelos dois caminhos até `shop_stocks`). Como UF é metade desta regra, a base de pares é
**outra** — comparar um run novo com o 49984 não faz sentido.

Fora disso não existe aderência baixa: **o par não existe**. É por isso que o ranking de
cada veículo é curto — ele só disputa dentro da própria praça e do próprio canal.

## A fórmula

Cinco componentes, cada um com uma **aderência** (0..1) e um **peso** (0..1):

| componente | aderência | peso |
|---|---|---|
| preço, idade, km | `1 / (1 + |valor − média| / desvio)` | `1 / (1 + desvio / média)` ← o CV |
| modelo, categoria | 1 se bate com o item mais ofertado | o % de ofertas da loja naquele item |

```
score = Σ(peso × aderência) / Σ(peso) × confiança
```

O peso sair do coeficiente de variação é o miolo do pedido: **loja de faixa apertada é
previsível**, então acertar o número dela vale muito; loja que compra de tudo tem CV alto
e o peso cai sozinho.

**`confiança = min(1, veículos / 5)`** é adição minha, não estava no pedido — evita que
loja com 1 carro de histórico lidere por sorte. **`CORRESP_MIN = 50`** corta o par abaixo
de 50: ele não entra no HTML, não conta nos KPIs, não aparece em nenhuma direção. O corte
é sobre o **score**, não sobre a aderência bruta, senão passaria justamente a loja que a
confiança existe para segurar.

## As duas fases, e por que existem

O MCP `run_query` tem três limites medidos (ver o [README do SDK](../README.md)): sem
window function, resposta cortada em 50 linhas, deadline de 60s. E `OFFSET` reexecuta o
agregado inteiro — **página vazia custa o mesmo que página cheia**.

A primeira versão chutou 60 páginas para 26 necessárias: 170 chamadas desperdiçadas.
Daí o desenho atual:

| | o que faz |
|---|---|
| **Fase 1** (`montar-fase1.js`) | uma chamada: conta veículos e lojas, resolve os eventos, calcula a janela |
| **Fase 2** (`montar-fase2.js`) | pagina **exatamente** `ceil(n/50)`, nem uma página a mais |
| **Montar HTML** (`montar-html.js`) | ingere, calcula os pares, compara com o gabarito e desenha |

⚠️ Cada nó **reconstrói o seu `META`**. Campo que a fase 1 publica e a fase 2 esquece de
repassar chega `undefined` no fim — em silêncio. Já aconteceu duas vezes; hoje há prova
travando a ponte.

## A tela

Duas telas no mesmo arquivo, alternadas pelo botão do cabeçalho:

- **Relatório** — barra de filtros acima de tudo, faixa de seis KPIs, e as duas tabelas
  lado a lado com filtro cruzado. Clicar num veículo reordena as lojas; clicar numa loja
  reordena os veículos e abre o **extrato** dela.
- **Glossário** (`#glossario`) — 17 verbetes. A tabela de status é gerada a partir do
  dicionário publicado no dado, então mudar `STATUS_OK` muda a documentação junto.

**Whitelabel, UF e evento** valem para a página inteira, KPIs inclusive, e os três
dropdowns se recontam entre si. As duas **buscas** só filtram a tabela onde estão.

O que o filtro **não** alcança, e está escrito na tela: o perfil de compra da loja e o
fator de confiança vêm do histórico de 6 meses da loja inteira. Como a aderência é
calculada contra esse perfil, o score de cada par também não muda com o filtro — o filtro
escolhe quais pares aparecem, não os recalcula.

## As ferramentas, e o buraco que cada uma tapa

| script | existe porque |
|---|---|
| `prova-local.js` | 70+ provas da fórmula, da elegibilidade, do corte, do fuso e da ponte entre fases — sem tocar no banco |
| `_smoke_dom.js` | **o JS do navegador viaja como string dentro do nó** — `node --check` nunca olha pra ele. Dois bugs chegaram ao Thomas por essa fresta. Roda o app contra um DOM de mentira e **interage**: percorre os três dropdowns, cruza um com o outro, abre o glossário, clica em limpar |
| `monta_html_de_dados.js` | regera o HTML de um `dados-*.json` já coletado. Mexeu só na tela? segundos, não os 9 min do run. Recorta a seção entre `RENDER:INICIO`/`RENDER:FIM` do próprio nó, então não há cópia paralela pra desatualizar |
| `_extrai_execucao.py` | o nó devolve ~9 MB; resultado desse tamanho não cabe na conversa e o harness salva em arquivo. Materializa `saida-<id>.html` e `dados-<id>.json` |
| `_confere_run.js` | **o código do nó é transcrito à mão pra dentro do n8n.** Um caractere trocado não quebra a sintaxe — envenena os números. Recalcula todos os pares publicados e revalida a elegibilidade |
| `_previa_corte.js` | aplica o corte de correspondência num JSON já coletado, pra ver a tela nova sem gastar um run |
| `monta_html_de_dados.js` | ⚠️ Tudo o que a tela usa tem que morar **dentro** de `RENDER:INICIO`/`RENDER:FIM`. Em 2026-09-11 a `descreveRecorte()` nasceu fora e quebrou a regeneração — o trecho extraído não a enxergava. Se algo estourar aqui, é quase sempre isso |
| `_confere_transcricao.py` | compara **byte a byte** o que está no n8n com o arquivo local. Existe porque em 2026-09-10 as 248 sequências de escape de aspa do `montar-html.js` foram **dobradas em duas transcrições seguidas** — 568 barras invertidas em vez de 320, JS do cliente sem compilar, mesma classe de erro que derrubou a execução 49963. Achar isso depois de um run de nove minutos é caro; achar antes custa uma chamada |
| `build_wf.py` | gera o `.wf.ts` a partir dos `.js` |

Ciclo depois de mexer:

```bash
node prova-local.js && node monta_html_de_dados.js dados-<id>.json && node _confere_run.js dados-<id>.json
```

E **depois de sincronizar com o n8n, antes de rodar** — a etapa que faltava:

```bash
python _confere_transcricao.py <dump-do-get_workflow_details.txt>
```

### A logo no cabeçalho

Cabeçalho em **#1523A0** (a cor da marca), com o tom também nos detalhes — barra de score,
links, a barra do título e o KPI de veículos. O token é `--mar`; `--ac` passou a ser ele.

A logo entra como **data URI**: o relatório é arquivo único, e referenciar um arquivo
externo quebraria assim que alguém encaminhasse o HTML. Mas **não** como o `.jpg` original
de 6.216 bytes — viraria ~8.300 caracteres de base64 transcritos à mão para o nó, e base64
longo é exatamente o tipo de coisa que se transcreve errado.

Como a logo é de **duas cores por desenho** e aparece a 26px, ela vai como PNG paletizado
de 128px construído por limiar de luminância: **570 bytes, 760 caracteres**. Treze vezes
menor, sem artefato de JPEG na borda do glifo, e conferível por sha1.

⚠️ A quantização automática do Pillow (`quantize(colors=2)`) escolheu **dois azuis e perdeu
o branco**. Por isso a paleta é construída à mão. Ver `_marca_c2y.py`.

O fundo da logo é `#1523A0` medido pixel a pixel — idêntico ao do cabeçalho, então ela
encaixa sem emenda e o que se vê é só o wordmark.

### Por que o `montar-html.js` não tem mais barra invertida

O JS do navegador viaja como **string** dentro do nó, e o nó viaja pro n8n como **string
JSON transcrita à mão**. Barra invertida é onde este projeto erra. A correção não foi
"transcrever com mais cuidado" — foi tirar o material: elemento de array que emitia aspa
simples de atributo HTML passou a usar **crase** (dentro de template literal a aspa não
precisa de escape), e `·`/`—`/`↗` viraram os caracteres `·`, `—` e `↗`.

Sobraram **4 barras** no arquivo inteiro, que dá para conferir no olho. A prova local mede
isso e falha se subir. Provado equivalente: o HTML gerado antes e depois é idêntico byte a
byte, normalizando só os relógios e essa troca de escape.

Os arquivos `_*.py` são os patches aplicados, um por mudança. Ficam versionados porque
cada um explica **por que** a mudança foi feita — é o registro do raciocínio, não código
que roda de novo.

## Estado

Última execução: **50106** (2026-09-10), janela aberta desde 09/09. **8min33s.**

| | 49984 (nove eventos) | 50106 (janela aberta) |
|---|---|---|
| eventos | 9 | **50** |
| veículos | 735 | **1.123** |
| lojas elegíveis | 251 | **728** |
| correspondências | 14.507 | **33.718** |
| UFs distintas dos veículos | 2 | **25** |
| veículos sem par | 21 | **259** |
| HTML | 1,4 MB | **3,3 MB** |

Coletados 1.123 de 1.123 esperados — completude fechada. Todos os 1.123 com link.

### "Sem correspondência" são três coisas, não uma

O run 50106 mostrou 259 veículos (23%) sem par, e o relatório declarava isso numa frase
só — "ou não há loja na mesma UF e whitelabel, ou nenhuma passou da correspondência
mínima". São **três populações com causas opostas**:

| causa | o que significa | baixar o corte resolve? |
|---|---|---|
| **canal sem loja** | o evento alveja um **canal de pessoa física** (colaborador, associado, clube). Não existe loja compradora como categoria — o par é impossível por construção. | **não** |
| **sem loja na UF** | há loja no canal, mas nenhuma na UF do pátio | **não** |
| **cortado pelo mínimo** | havia loja elegível e nenhuma alcançou os 50% | **sim** |

Para o primeiro grupo a frase antiga **enganava**: sugeria que se procurou e não se achou
nada bom, quando a busca era impossível. E quem lia "23% sem correspondência" concluía que
o corte estava alto — mas o corte só alcança o terceiro grupo.

Agora cada veículo publica `elegiveis` (lojas que passaram na regra **antes** do corte) e
`canal_sem_loja`; as falhas declaram as três separadamente; o KPI **sem correspondência**
conta só quem *podia* ter par, e os impossíveis ganham KPI próprio, em cinza — número que
não é culpa de ninguém não deve aparecer em vermelho ao lado dos que são.

🚨 **As duas colunas não são comparáveis.** A UF do veículo mudou de fonte (loja → pátio),
e 68% dos veículos mudam de UF com isso: o salto de 2 para **25 UFs distintas** é essa
mudança aparecendo. Não é "o relatório cresceu"; é outra base de pares.

⚠️ **O HTML foi a 3,3 MB.** Anexo de e-mail desse tamanho é arriscado — mesma questão já
aberta no C6 (que estava em 1,27 MB). SharePoint + link é a alternativa que já existe na
casa, como o IGA faz.

**Ressalvas abertas:**

- **Contas internas no ranking.** Porto Seguro, Itaú Unibanco e duas "Teste Cars2you",
  todas em SP/Marketplace. Falta o Thomas confirmar que são internas pra excluir.
- **Duplicidade no catálogo `models`.** Nomes iguais em faixas de id diferentes fazem
  "Strada × Strada" dar aderência zero no componente de modelo. Impacto medido: 4 pares
  em 14.507. Documentado em [`dominios.md`](../../../context/banco-de-dados/dominios.md).
