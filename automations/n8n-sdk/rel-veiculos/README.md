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

## A janela de eventos, e a armadilha do fuso

Vai da **meia-noite de hoje em Brasília** até `HORAS_ADIANTE` à frente — evento que já
encerrou hoje continua na base. Preenchendo `EVENTOS_IDS` o recorte vira uma lista fixa e
as datas não valem; é o modo usado para olhar edições específicas.

⚠️ **O piso e o teto são calculados no nó e viajam como literal.** O banco responde
`NOW()`/`CURDATE()` em UTC mas grava as datas dos eventos em hora de Brasília, então às
21h daqui o banco já aponta para o dia seguinte e "hoje" perde o dia inteiro. Não troque
por `NOW()`. O detalhe está em [`dominios.md`](../../../context/banco-de-dados/dominios.md).

Também **não** há filtro de `e.status`: evento encerrado fica com `status = 0`, e exigir
`1` excluiria justamente o que a janela quer trazer. Quem protege é o status da
negociação — evento cancelado deixa as suas em `10`, que não está na lista.

## A regra de elegibilidade

Um par (veículo, loja) **só existe** se as duas condições valerem:

1. **Mesma UF** — a do veículo vem da loja vendedora; a da compradora, do endereço dela.
2. **Whitelabel do evento** — `event_whitelabels` é 1:N, então é `loja.whitelabel_id ∈
   conjunto`, não igualdade simples.

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
| `build_wf.py` | gera o `.wf.ts` a partir dos `.js` |

Ciclo depois de mexer:

```bash
node prova-local.js && node monta_html_de_dados.js dados-<id>.json && node _confere_run.js dados-<id>.json
```

Os arquivos `_*.py` são os patches aplicados, um por mudança. Ficam versionados porque
cada um explica **por que** a mudança foi feita — é o registro do raciocínio, não código
que roda de novo.

## Estado

Última execução: **49984** (2026-09-10), apontada para os nove eventos que encerraram em
09/09. 735 veículos, 251 lojas, 14.507 correspondências, 1,4 MB.

⚠️ **`EVENTOS_IDS` está preenchido no nó.** Rodar agora devolve o mesmo recorte do dia 9;
para voltar à janela móvel de 48h, esvazie a lista.

**Ressalvas abertas:**

- **Contas internas no ranking.** Porto Seguro, Itaú Unibanco e duas "Teste Cars2you",
  todas em SP/Marketplace. Falta o Thomas confirmar que são internas pra excluir.
- **Duplicidade no catálogo `models`.** Nomes iguais em faixas de id diferentes fazem
  "Strada × Strada" dar aderência zero no componente de modelo. Impacto medido: 4 pares
  em 14.507. Documentado em [`dominios.md`](../../../context/banco-de-dados/dominios.md).
