# 🗄️ Banco de dados — conhecimento acumulado

> **Leia daqui antes de abrir o banco.** O que já foi medido, decidido ou
> descoberto está escrito — consultar de novo custa tempo e a resposta não muda.
>
> Organizado em dois níveis: **plataforma** (vale para qualquer projeto) e
> **projetos** (o que é de um estudo só).

## Por onde começar, pelo que você quer

| a pergunta é… | leia |
|---|---|
| "que tabela guarda X?" | [`plataforma/schema.md`](plataforma/schema.md) |
| "o que significa `status = 11`?" | [`plataforma/dominios.md`](plataforma/dominios.md) |
| "como eu consulto?" | [`plataforma/acessos.md`](plataforma/acessos.md) |
| "esse campo é confiável?" | [`plataforma/qualidade.md`](plataforma/qualidade.md) |
| "como escrevo esse join?" | [`plataforma/receitas.md`](plataforma/receitas.md) |
| "o que é uma venda, um deságio?" | [`projetos/precificacao/definicoes.md`](projetos/precificacao/definicoes.md) |
| "quanto deu tal número?" | [`projetos/precificacao/indicadores.md`](projetos/precificacao/indicadores.md) |
| "que palavra do anúncio pesa?" | [`projetos/precificacao/palavras-chave.md`](projetos/precificacao/palavras-chave.md) |

## 🔴 A regra que sustenta este espaço

**Número medido mora em UM arquivo só. Os outros linkam, não repetem.**

Existe por causa de 17/09: a afirmação "a Dealers é um superconjunto com versão
mais nova" foi escrita em **cinco arquivos**. Quando a medição mostrou que
estava errada, corrigir exigiu caçar com `grep` — e bastaria esquecer um para o
brain seguir afirmando o falso.

Todo número traz **data e como foi medido**. Número sem data não serve: a base
se move.

## Plataforma

O que vale para as duas bases e para qualquer projeto.

| arquivo | o que tem |
|---|---|
| [`schema.md`](plataforma/schema.md) | 149 blocos: descrição, colunas, FKs, índices. Índice por domínio no topo |
| [`dominios.md`](plataforma/dominios.md) | O que os valores significam — `status` de negociação, duplicidade de catálogo, fan-out de whitelabel |
| [`acessos.md`](plataforma/acessos.md) | Os dois caminhos (MCP e conexão direta), limites de cada um, credenciais |
| [`qualidade.md`](plataforma/qualidade.md) | O que mente: coluna que não é o que o nome diz, catálogo duplicado, data lixo, PII |
| [`receitas.md`](plataforma/receitas.md) | Fragmentos de SQL conferidos, e os erros que já custaram refação |
| [`tabelas-nao-documentadas.md`](plataforma/tabelas-nao-documentadas.md) | 🔴 As 44 tabelas que existem no banco e não estão no `schema.md` |
| [`colunas-ocultas.md`](plataforma/colunas-ocultas.md) | As 79 colunas que o diagrama escondeu em 4 tabelas |

## Projetos

| projeto | o que tem |
|---|---|
| [`precificacao/`](projetos/precificacao/) | Definições de venda e deságio, indicadores medidos, dicionário do texto livre |
| [`c6/`](projetos/c6/) | _(a preencher — hoje o conhecimento está em `subjects/c6/` e `automations/n8n-sdk/`)_ |
| [`rel-veiculos/`](projetos/rel-veiculos/) | _(a preencher — hoje em `automations/n8n-sdk/rel-veiculos/README.md`)_ |

## ⚠️ O estado da documentação

| | |
|---|---:|
| Tabelas no `schema.md` | **149** |
| Tabelas no banco (18/09) | **193** |

**Faltam 44**, desde a importação de 09/09 — não é erro do cruzamento, as
fontes exportadas à mão já vieram incompletas. Lista em
[`tabelas-nao-documentadas.md`](plataforma/tabelas-nao-documentadas.md).

➡️ **O caminho é gerar o `schema.md` do banco, não importar.** Agora existe
conexão: `python automations/bancos/gera-schema.py`.

## As duas bases são o mesmo esquema

Comparadas ao vivo em 18/09: **193 tabelas cada**, 192 em comum. Das 192, só
`notifications` difere em coluna (`resent_by_id` e `resent_from_id`, só na
Cars2You). 2.075 colunas contra 2.074.

As diferenças entre elas estão no **conteúdo**, não na estrutura — e essas
estão em [`qualidade.md`](plataforma/qualidade.md).

## Fontes originais

`_fontes/Banco_cars.txt` (descrição, relacionamentos, índices — sem colunas) e
`_fontes/Diagrama_cars.pdf` (colunas e tipos — sem índices nem descrições).
O `schema.md` é o cruzamento dos dois. Preservados para rastreabilidade.
