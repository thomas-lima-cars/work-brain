---
name: analise-base-cliente-c6-lojista
description: >
  Gera a análise completa da base de clientes do whitelabel 43 (Canal de Vendas C6 Auto,
  também chamado "C6 Lojista") da Cars2You — visão geral, cadastros por situação, funil
  (login → oferta → compra), recência de inatividade, evolução mensal, cadastros por dia
  com tendência, distribuição geográfica por UF, rankings de top clientes e cruzamento
  acesso/oferta/compra. É uma variante fixa (whitelabel_id sempre 43) da skill genérica
  "analise-base-clientes", com uma regra de negócio própria: ofertas, compras, rankings e
  UF de compradores NÃO são restritos à loja vendedora do WL43 — contam em qualquer loja
  da plataforma, porque os clientes desta base compram tanto na loja "C6 Bank Lojista"
  (WL43) quanto na loja "C6 Bank" (WL7/Itaú-IGA), mesma marca C6 em whitelabels diferentes.
  Use esta skill sempre que o usuário pedir "análise da base C6 lojista", "análise de
  clientes do C6 Auto", "base de clientes do whitelabel 43", "análise C6 sem restrição de
  loja", ou pedir para refazer/atualizar esse relatório específico — mesmo que ele só diga
  "roda de novo a análise do C6" ou "atualiza o relatório do C6 lojista". Não use para
  outros whitelabels (esses usam a skill genérica "analise-base-clientes") nem para análise
  de um cliente único (isso é "cockpit-comprador").
---

Você é um especialista em dados da plataforma Cars2You. Esta skill é uma variante **fixa**
da skill genérica `analise-base-clientes`, escopada permanentemente ao **whitelabel 43**
("Canal de Vendas C6 Auto" / "C6 Lojista") — não pergunte por whitelabel_id, ele já está
definido nas queries desta skill.

## Por que esta skill existe (não pular)

Ao gerar a análise padrão do WL43 pela primeira vez, o escopo de oferta/compra foi
restrito às lojas do próprio whitelabel (`a.shop_id IN (SELECT id FROM shops WHERE
whitelabel_id = 43)`), como a skill genérica faz por padrão. Investigando o Top 1 de
compradores, descobrimos que ele tinha **400 compras reais** na plataforma, mas só 143
apareciam no relatório — porque ele compra tanto na loja "C6 Bank Lojista" (shop 104754,
WL43) quanto na loja "C6 Bank" (shop 9034, que pertence ao **whitelabel 7**, Itaú/IGA).
Mesma marca C6, duas lojas em dois whitelabels diferentes — e a restrição por whitelabel
estava descartando mais da metade do comportamento real desses clientes.

Por isso, nesta skill (e só nela — a skill genérica continua restringindo por padrão,
o que é correto para whitelabels sem esse padrão de lojas irmãs em outro WL): **toda
métrica que descreve o comportamento do cliente entre lojas (ofertar, comprar, ranking,
UF de compra) roda sem filtro de `shop_id` por whitelabel — qualquer loja da plataforma
conta.** Ver `references/regras-negocio.md` § 0 para o detalhe completo e o exemplo real.

A única coisa que **não** muda: métricas do lado da oferta/anúncio do próprio WL43 (média
de ofertas recebidas por anúncio publicado, checagem de cluster) continuam olhando só para
o inventário das lojas do WL43 — isso não é comportamento do cliente, é característica do
anúncio publicado por aquele whitelabel especificamente.

## Arquivos desta skill

| Arquivo | Conteúdo | Quando ler |
|---|---|---|
| `references/regras-negocio.md` | Regra de negócio própria desta skill (§0) + todas as regras herdadas da skill genérica | Antes de qualquer query |
| `references/queries.md` | Queries BC-01 a BC-18, já com whitelabel_id=43 fixo e sem filtro de shop_id nas de oferta/compra/ranking/UF-compra | Antes de rodar qualquer query |
| `references/preenchimento.md` | Como montar cores, logo, linhas de tabela, cruzamento (★) e insights | Ao montar o HTML |
| `references/checklist.md` | Validação final antes de entregar | Após montar o HTML |
| `assets/template_base_clientes.html` | Template HTML com placeholders `{{...}}` e arrays JS para os gráficos | Copiar e preencher |

## Fluxo de execução

### 1. Ler as regras de negócio
Ler `references/regras-negocio.md` **antes de qualquer query**, especialmente § 0 (a regra
própria desta skill). Pular esta leitura reintroduz o erro de subestimar o comportamento
do cliente ao restringir por loja do WL43.

### 2. Checar disponibilidade de cluster
Rodar [BC-13] antes de decidir se a seção de cluster entra no relatório (essa checagem
continua restrita ao inventário do WL43 — ver regra acima).

### 3. Executar as queries em ordem
Ler `references/queries.md` e rodar BC-01 a BC-18 na ordem recomendada (igual à skill
genérica — ver ali). Não há parâmetros para substituir: todas as queries já vêm com
whitelabel_id=43 fixo.

### 4. Buscar identidade visual
Cores em `whitelabel_themes` e logo em `whitelabel_images`, `whitelabel_id = 43`. Não é o
caso de exceção da loja 594 (IGA) — o WL43 usa a identidade própria do C6 Auto.

### 5. Preencher o template
Copiar `assets/template_base_clientes.html`, substituir os placeholders `{{...}}` e os
arrays JS dos gráficos, seguindo `references/preenchimento.md`. Remover a seção de cluster
inteira se BC-13 indicar ausência de cluster representativo. Nas seções de oferta/compra/
ranking/UF, deixar claro nos `sec-note`/`kpi-sub` que a métrica considera qualquer loja da
plataforma (não é um callout de escopo proibido pela regra de ouro 9 — é uma nota factual
curta, necessária aqui porque diverge do padrão da skill genérica).

### 6. Validar
Rodar o checklist de `references/checklist.md`, com atenção especial ao item novo sobre
a ausência de filtro de shop_id nas queries de oferta/compra.

### 7. Entregar
Salvar como `analise_base_c6lojista_{DATA}.html` na raiz do repositório e enviar ao
usuário.

## Regras de ouro (nunca violar)

Herdadas da skill genérica `analise-base-clientes` — ver `references/regras-negocio.md`
para o detalhe de cada uma:

```
1.  Compra = INNER JOIN offers o ON o.id = an.offer_actual_id, status IN (2,3,7).
2.  Valor financeiro = offers.price, NUNCA advertisement_negotiations.value_actual.
3.  Ofertas = sempre via INNER JOIN advertisement_negotiations (nunca o.advertisement_id
    direto) — bug de join órfão.
4.  Whitelabel do cliente (quem entra na base) = sempre via user_whitelabels,
    whitelabel_id = 43 fixo.
5.  Sempre excluir internal_user = 1 de todas as contagens e rankings.
6.  Login = user_access, nunca access_logs.
7.  NUNCA comparar esta base com outra base/cliente/whitelabel de sessões anteriores.
8.  Cluster: omitir a seção inteira se não representativo (ver BC-13).
9.  Sem callout de "escopo deste recorte" — mas a nota factual de "qualquer loja" nas
    seções de oferta/compra é necessária aqui e não conta como esse tipo de callout.
10. Ranking de "mais acesso" = por dias distintos ativos, nunca contagem bruta.
11. Rankings de compradores mostram sempre histórico total E ano corrente.
12. Identidade visual = cores/logo reais do whitelabel_themes/whitelabel_images (WL 43).
```

**Regra própria desta skill (não existe na skill genérica):**

```
0.  Oferta/compra/ranking/UF de compra do cliente NÃO são restritos à loja do WL43 —
    contam em qualquer loja da plataforma (o cliente pode comprar em "C6 Bank Lojista"
    WL43 e/ou "C6 Bank" WL7). Só a base de clientes (quem entra na análise) e as métricas
    de inventário/anúncio do próprio WL43 (BC-10, BC-13/14) continuam escopadas ao WL43.
```
