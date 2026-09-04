# `prototipo-safra/` — protótipo Safra de Cadastro + multi-whitelabel

> **Fonte externa.** Trabalho do **Everton**, importado de `Downloads/prototipo-safra` em 2026-09-03.
> Os dois docs dele (`HANDOFF-PROTOTIPO-SAFRA.md`, `INSTRUCOES-REPLICAR.md`) estão **verbatim**,
> como recebidos. Este README é do Thomas e contém o que foi **verificado na máquina dele**.
>
> Frente: [`subjects/c6`](../../subjects/c6/03-historico.md) · Prazo da entrega: **2026-09-04**.

## O que é

Evolução do relatório "Análise de Base de Clientes — Canal de Vendas C6 Auto" (workflow n8n
`2ECmLRceNEgCCYyb`), feita como **protótipo HTML client-side**. O workflow de produção
**não foi alterado** — só usado como ponte pra puxar dados do banco.

| Arquivo | O que é |
|---|---|
| `build_proto.py` | O gerador. É o "código-fonte" do protótipo: lê o baseline + os JSONs e cospe o HTML |
| `relatorio-c6-original-baseline.html` | Relatório C6 original, entrada do gerador |
| `relatorio-c6-PROTO-safra-atual.html` | O protótipo — saída do gerador |
| `dados/*.json` | Snapshot de **2026-09-03** dos dados agregados (sem PII) |
| `HANDOFF-PROTOTIPO-SAFRA.md` | Handoff do Everton — contexto, queries SQL verbatim, roteiro do que falta |
| `INSTRUCOES-REPLICAR.md` | Como regenerar o HTML em outra máquina |

## ✅ Verificado por mim em 2026-09-03

1. **O builder reproduz byte-a-byte.** Rodei `build_proto.py` num diretório limpo com Python 3.14.6:
   MD5 do output = MD5 do HTML de referência (`7a15b3a9f14ca231cd7269f3ec576e3d`).
   Não precisa de banco, n8n, credencial nem internet.
2. **Os dados batem com a tabela de referência** do handoff (§7):

   | Recorte | total | compradores | volume |
   |---|---|---|---|
   | Todos (distinto, 78 meses) | 29.002 | 2.105 | R$ 2,50 bi |
   | WL43 — C6 Auto | 2.921 | 240 | R$ 146.746.209,69 |
   | WL7 — Marketplace | 14.741 | 1.447 | R$ 1,96 bi |

   `coorte_wl` = 516 linhas / 58 whitelabels · `wl_list` = 58 · `recencia` = 59 chaves.
3. **Validação cruzada independente:** o volume do WL43 (`146.746.209,69`) é **exatamente** o campo
   `volume` do nó `Montar HTML` da execução **48290** do workflow original. Dois caminhos
   independentes, mesmo número — os dados são reais.
4. **A cópia no n8n está segura:** `Enviar Relatorio por Email` com `disabled: true`,
   workflow inativo, `activeVersionId: null`.

## ⚠️ Correções aos docs do Everton

- **§10 está obsoleto.** Manda "ajustar `SP` no `build_proto.py`" — o script **já é portátil**
  (`HERE = os.path.dirname(os.path.abspath(__file__))`). Não edite nada. O `INSTRUCOES-REPLICAR.md`
  está correto; quem seguir o §10 vai caçar um problema que não existe.
- **O `versionId` da cópia divergiu.** O §4 manda restaurar para `5a79c7dc-a6ae-43ba-9bb2-459f1b6e8f6d`;
  em 2026-09-03 20:55 UTC a cópia estava em `b577db1f-2a84-4122-b588-a3ade94281e6`. Inspecionei e o
  conteúdo parece limpo, mas **confirmar com o Everton antes do primeiro pull** em vez de restaurar
  às cegas pra uma versão possivelmente mais antiga.

## As 11 execuções com erro da cópia NÃO são falha

É o padrão **swap-run-restore** (§4): troca o `Montar Queries` por uma query-sonda, desabilita o
`Montar HTML`, roda, lê o `MCP Run`, restaura. O erro no `Anexar HTML` (`Buffer.from(undefined)`)
é **esperado e inofensivo** — é o preço de usar o n8n como ponte, que é a **única** via pro banco
(n8n Cloud está fora da VPC). Não confundir com falha real (ex.: `context deadline exceeded`).

## Estado

| Item | Estado |
|---|---|
| Bloco "Safra de Cadastro" — coorte por mês de cadastro, KPIs + Situação + Funil reativos | ✅ |
| Seletor de Whitelabel (58 + "Todos" distinto), cross-filter bidirecional WL↔Ano↔Mês | ✅ |
| Recência WL-reativa | ✅ — é o **molde** pra replicar nas outras |
| UF · Top 10 (×4) · Destaques · Evolução (9 gráficos) | 🚧 faltam |

## 🔥 A decisão em aberto

O próprio autor recomenda reavaliar: **continuar client-side** ou **portar pro n8n**
(parametrizar `whitelabel_id` no `Montar Queries`, hoje `43` fixo). Portando, **todas as seções e
abas** saem no escopo nativamente, sem reescrever nada no cliente nem embarcar 58 WLs no HTML.

Minha leitura: **portar sai mais barato que fazer as 4 seções restantes** — a Evolução só (9 gráficos
Chart.js com destroy/recreate por troca de WL) rivaliza com o port inteiro. O risco do port está
concentrado em editar o `Montar HTML` de 87 KB: gerar programaticamente, com gate de verificação,
e cuidado com o `·` (U+00B7) e o emoji 🏆.

## ❓ Gap que nenhum artefato cobre

A ata de 02/09 pede *"do recorte: quantos já alugaram, quantos já compraram, quantos nunca alugaram"*.
O bloco de safra entrega **total / compraram / não compraram** por coorte. **`aluguel` não existe**
em nenhum dos artefatos — nem no workflow, nem na skill do Gui, nem neste protótipo.
Ou há uma tabela de locação que ninguém mapeou, ou "alugar" significa outra coisa no vocabulário
da reunião. **Resolver isso vale mais que qualquer seção nova.**

## Privacidade

Os JSONs têm **números agregados, sem PII**. Repo é privado — ok. Se algum dia virar público,
tirar `dados/` fora.
