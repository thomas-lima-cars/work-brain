# Banco da Dealers (whitelabel DLC) — acesso direto

> ⚠️ **Isto não é o caminho da Cars2You.** São dois acessos diferentes, a
> bancos diferentes, com garantias diferentes. Não misturar.

| | Cars2You | Dealers |
|---|---|---|
| Caminho | workflow n8n → nó MCP → endpoint readonly | Python → `mysql-connector` → RDS |
| Host | fixo no serviço MCP, sem parâmetro | `wl-dlc-prd-mysql-default...us-east-1.rds.amazonaws.com:3306` |
| Somente-leitura | por desenho do serviço | **depende da credencial** + guardas daqui |
| Teto de linhas | 50, silencioso | `--limite`, com aviso quando estoura |
| Janelas / CTE | ⚠️ `ROW_NUMBER()` é rejeitada pelo validador | permitido |

O nó MCP só aceita `{sql, database}` — **não tem campo de host**
([n8n-ambiente:120](../n8n-ambiente-cars2you.md)). Por isso a Dealers não cabia
lá e ganhou este caminho próprio.

## Credenciais

Moram **fora do repo**, em `~/.dealers-dlc.env` (ou no caminho de `DLC_ENV`):

```bash
cp automations/bancos/.env.exemplo ~/.dealers-dlc.env
```

Três barreiras, porque `.gitignore` sozinho não é garantia — um `git add -f`
ou um rename derruba:

1. `.gitignore` cobre `.dealers-dlc.env` e `automations/bancos/.env*`
2. `conexao.py` **recusa** ler credencial de dentro do repo
3. A senha nunca é impressa, nem dentro de mensagem de erro (`mascarar()`) —
   a lib às vezes ecoa a senha na exceção de conexão

## Uso

```bash
python automations/bancos/consulta.py --testar
```

```bash
python automations/bancos/consulta.py "SELECT ..." --limite 50
```

```bash
python automations/bancos/consulta.py --arquivo consultas/x.sql --json dados-x.json
```

`dados-*.json` desta pasta está no `.gitignore` — mesma regra do `n8n-sdk`:
coleta com dado real de cliente não é versionada.

## A guarda de leitura

O comando precisa começar com `SELECT`, `SHOW`, `DESCRIBE`, `EXPLAIN` ou
`WITH`; multi-statement é barrado; e mais seis padrões que fazem estrago
**dentro** de um `SELECT`: `INTO OUTFILE`, `FOR UPDATE`, `LOCK IN SHARE`,
`LOAD_FILE()`, `BENCHMARK()`, `SLEEP()`.

**Não há lista de palavras proibidas**, e isso é deliberado. Procurar
`update`/`create` soltos erra dos dois lados: pega `updated_at` e `created_at`
(falso positivo em quase todo SELECT do padrão Laravel) e `REPLACE()` como
função de string, e ao mesmo tempo não pega o que de fato faz estrago.

Comentários e strings são removidos antes da análise — `WHERE obs LIKE
'%for update%'` passa, `SELECT 1 -- ok` seguido de `; DELETE` não. A SQL que
vai ao servidor é a **original**, não a limpa.

Prova: 17 casos em `_prova_guarda.py`.

## Ressalvas

- 🔴 **Use credencial somente-leitura.** A sessão é posta em
  `TRANSACTION READ ONLY`, mas isso é cinto e suspensório — um usuário com
  permissão de escrita ainda é um usuário com permissão de escrita.
- 🔴 **É produção de outro tenant.** Credencial em uso: `bi_read_wl_dlc_prd`,
  MySQL **8.4.8**, schema `wl_dlc_prd`, **193 tabelas**.
- ✅ **Correção de 17/09 — o esquema É o mesmo.** Eu afirmei aqui que nada de
  `context/banco-de-dados/` valeria. Errado: **as 149 tabelas da Cars2You existem
  na Dealers com o mesmo nome** (`advertisements`, `advertisement_negotiations`,
  `offers`, `vehicles`...). É a mesma plataforma.
- ✅ **Segunda correção, 17/09 (madrugada) — as duas bases são IDÊNTICAS.** Eu tinha
  escrito aqui que a Dealers era um superconjunto com 48 tabelas a mais e versão mais
  nova. **Errado.** Com a conexão direta à Cars2You foi possível comparar os dois bancos
  ao vivo: **193 tabelas cada**, iguais exceto por uma de cada lado —
  `base_cars2you` × `base_dealersclub`.
  As 44 tabelas que eu atribuí à Dealers (WhatsApp, Vozis, `shop_automations`…)
  existem na Cars2You também. **O que está incompleto é a nossa documentação:**
  o `schema.md` tem 149 de 193.
- O host resolve para **IP privado** (`10.0.1.123`) — só alcança de dentro da
  VPC ou via VPN. De fora, o TCP nem abre.
- `@dealersclub` segue como domínio *excluído* (conta interna) nas queries do C6 —
  isso é sobre a base da Cars2You e continua valendo.
- ❓ **O objetivo deste acesso ainda não foi declarado.** `context/empresa.md` e
  `produtos.md` foram atualizados em 17/09 pra registrar que a Dealers saiu do
  "fora do radar", mas sem pasta em `subjects/` e sem escopo definido.
