# Crons — o que roda automaticamente

> Preenchido em 2026-09-03 a partir do inventário em `n8n-ambiente-cars2you.md` e dos docs
> em `n8n-flows/`. ⚠️ **Não validado contra o n8n ao vivo** — confirmar com
> `search_workflows({ projectId: "yAo7DiqDfz6XfXyv", limit: 200 })` antes de confiar.
>
> O relógio do n8n é **São Paulo**; o banco é **UTC**. Cron em hora de SP, sem conversão.

## Agendados

| Cron | Workflow | Frequência | Gera | Falha → como avisa |
|---|---|---|---|---|
| Auditoria de Estoque por Loja | `vxyzWHfrcIR2gdsd` | Diário 08h | HTML por e-mail (Outlook) p/ lista fixa | ❓ sem alerta |
| Gatilho Fim de Evento IGA | `Vx8DTLJmho0OvSKJ` | `0 */10 16-19 * * 1-5` + sáb 12-15h | Dispara Relatório + Remanescentes + Planilha IGA | ❓ sem alerta |
| Gatilho Fim de Evento C6 | `PYCbGrJqV1a0u9hP` | `0 */10 16-23 * * 1-6` | Dispara relatório C6 | ❓ sem alerta |
| Pulso de Eventos no Ar | `20LeyMLjrAKeKVeS` | A cada 2h, 8h-20h, seg-sáb | Status no WhatsApp (Evolution) | ❓ sem alerta |
| IGA — Controle de cadastros diários | `DVpaCz02psdgKb5J` | Diário 08h | E-mail com cadastros do dia anterior | ❓ sem alerta |
| Lance Fácil BTB — cadastros diários | `oJPNgFxQZXQLDa06` | Diário | E-mail | ❓ sem alerta |
| Lance Fácil BTB Associados — cadastros diários | `K8XX09IOxufdhilb` | Diário | E-mail | ❓ sem alerta |
| C6 Lojista — Análise de base de cadastros | `2ECmLRceNEgCCYyb` | Semanal | Análise grupo 10 / loja 594 | ❓ sem alerta |
| IGA — Análise de base de cadastros | `mgDSyxuO0Mzjkrfy` | Semanal | Análise grupo 10 / loja 594 | ❓ sem alerta |

## Disparo manual (não agendado, de propósito)

| Workflow | Quem dispara | Quando |
|---|---|---|
| Lista LM (HTML) `8YnGmVUvl6BmrKKb` | Time de montagem | Depois de subir os carros no evento do dia (decisão do Caio, 25/08) |
| Proposta LM (Formulário) `BvqnJZoex3Y7ekL6` | Lojista | Ao dar lance |
| Cockpit Comprador IGA `dgxa0pkeFhQVqJ5X` | Comprador | Via formulário + allowlist |

## Inativos / a arquivar

`Qk9ldFifIWgGWIhr`, `jztu08zVhdkLHPxH`, `BmEuC16mnTEWc2FN` (TEMP C6, **ainda ativos**) e
`RuDVQk6pjR36TMat` (Testes, já inativo). Ver cobrança de higiene em `../estado-atual.md`.

⚠️ `GgjVZlU04wvJzLbK` (cópia da Auditoria, projeto pessoal do Thomas) está **inativa** com
`MODO='producao'` e gatilho 08h. Ativar sem trocar pra `'teste'` duplica o e-mail pra lista completa.

## Débito conhecido

O princípio do README diz "falha silenciosa é proibida", mas **nenhum** dos crons acima tem
alerta de falha documentado. Vale definir um canal único (WhatsApp ou e-mail) pro `onError`.
