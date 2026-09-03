# Produtos / clientes que eu toco

> Uma linha por frente. Cada uma tem pasta em `subjects/<slug>/`.
> Detalhe do que é e da fase atual mora no `01-contexto.md` de cada frente.
>
> Atualizado em 2026-09-03 com o que o import do contexto n8n revelou.

| Frente | Slug em `subjects/` | O que é | Fase atual |
|---|---|---|---|
| **Cars2You** | `cars2you` | Marketplace próprio (whitelabels 4 Trucks2you e 7 Marketplace) + a camada de automação/relatórios que atende todas as frentes | Automações em produção; Pulso de Eventos em ajuste |
| **Bradesco** | `bradesco` | _(a preencher — nada apareceu no contexto n8n)_ | _(a preencher)_ |
| **C6** | `c6` | Evento Exclusivo C6 Auto (shop 104754) — whitelabels 43 (Canal C6 Auto) e 48 (Colaboradores C6). Evento quase diário. | 🔥 Relatório evoluindo p/ 100% da base — prazo 04/09 |
| **Itaú** | `itau` | Operação **IGA** — evento ~1x/semana, fecha 16h. 8 workflows em produção (relatório, remanescentes, planilha, cockpit comprador). | Em produção e estável |
| **LM** | `lm` | Fornecedor que manda planilha de estoque ativo quase diariamente → vira Lista LM (HTML) + Proposta LM (formulário). ❓ **Sigla ainda não decifrada.** | Em produção; lance migrou p/ dentro da plataforma (25/08) |
| **Lance Fácil BTB** | — _(sem pasta ainda)_ | Whitelabels 62 (BTB) e 65 (BTB Associados). Tem 2 workflows de controle de cadastros. | ❓ **Não é frente declarada** — decidir se abre pasta ou vive em `outros` |
| **Outros** | `outros` | Coringa: o que não se encaixa nas frentes acima | — |

## Fora do radar

Citados no briefing original mas **não** são frentes do Thomas: Win Leiões, Dealers Club,
Tuunelis, VEIC.

⚠️ **Correção 2026-09-03:** "IGA" estava listado aqui como fora do radar. IGA **é** a
operação Itaú — mesma coisa que a frente `itau`, não um terceiro.
