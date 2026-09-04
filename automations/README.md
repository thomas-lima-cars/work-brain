# `automations/` — integrações, flows e scripts

Automações **reais** que já rodam ou já foram construídas. Importado de
`Downloads/automations` em 2026-09-03.

## O que tem aqui

| Pasta | Conteúdo |
|---|---|
| `n8n-ambiente-cars2you.md` | **Estado do ambiente n8n**: instância, projetos, credenciais, inventário dos 25 workflows, procedimento de cópia via MCP |
| `n8n-flows/` | Documentação dos flows n8n (IGA/Itaú, C6, Lista LM, Pulso Eventos) — IDs de nó, decisões, pegadinhas |
| `n8n-code/` | Código que vive dentro de nós Code do n8n |
| `n8n-sdk/` | Workflows como código (`@n8n/workflow-sdk`) — base pra copiar/versionar via MCP |
| `prototipo-safra/` | 🔥 **Protótipo do relatório C6** (safra/coorte + multi-whitelabel). Trabalho do Everton, verificado. Entrega 04/09 |
| `scripts/` | Scripts Node autônomos (gerar lista LM, colher status de laudo, planilha) |
| `estado/` | Estado persistido entre execuções (JSON) — dedup e idempotência |
| `assets/` | Imagens usadas nos HTMLs gerados |
| `crons.md` | O que roda quando (⚠️ ainda não preenchido) |

## Fontes a integrar (quando chegar a hora)

### Outlook
- **Opção A:** MCP do Microsoft 365 (mais limpo, depende de aprovação corporativa)
- **Opção B:** Script Python via Microsoft Graph API (autenticação OAuth)
- **Opção C:** n8n com nó "Microsoft Outlook" (cron diário, output → `memory/inputs/outlook/<data>.md`)

### Jira
- **Opção A:** MCP do Atlassian
- **Opção B:** Script via Jira REST API (filtro JQL `assignee = currentUser() AND updated >= -1d`)
- **Opção C:** n8n com nó Jira

### WhatsApp
- **Opção A (igual botscorp/brain):** Evolution API + n8n + Supabase + resumo diário commitado
- **Opção B simples:** export manual periódico → IA estrutura
- **Cuidado:** TOS do WhatsApp e cuidados com PII

### Transcrições de reunião
- **Opção A:** Watcher (Python ou n8n) numa pasta local onde caem as transcrições do Teams/ferramenta — gera markdown automaticamente
- **Opção B manual:** copia/cola transcrição em sessão do Claude e pede pra estruturar via `_template.md`

## Princípios

- **Idempotência:** rodar 2x não duplica.
- **Falha silenciosa é proibida:** se a integração quebrar, você precisa saber.
- **Resumo > raw:** automação gera **markdown legível**, não dump bruto.
- **Privacidade:** nada commitado contém credencial ou PII desnecessária.
