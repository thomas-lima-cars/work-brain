# Como chegar nos bancos — e o que cada caminho permite

> Existem **dois caminhos**, com garantias diferentes. Escolher errado custa
> tempo: a sonda do estudo de precificação foi paginada em 96 chamadas porque
> nasceu no caminho que corta em 50 linhas.

## Os dois caminhos

| | MCP (dentro do n8n) | Conexão direta (Python) |
|---|---|---|
| Onde roda | nó `MCP Exec` de um workflow | `automations/bancos/` |
| Endpoint | `mcp-cars2you-readonly.cars2you.com.br/sse` | RDS, por host |
| Bases | **só Cars2You** | Cars2You e Dealers |
| Parâmetros | `{sql, database}` — **não tem campo de host** | host, porta, schema |
| Teto de linhas | **50 por chamada, silencioso** | nenhum |
| Função de janela | **rejeitada pelo validador** | permitida |
| `information_schema` | **bloqueado** | acessível |
| Prazo | 60s | 30s de conexão |
| Para quê | o que roda em **produção** | **análise** |

Os dois convivem. O MCP não é inferior — é o que está integrado aos workflows
que rodam sozinhos. A conexão direta é para investigar.

## Conexão direta

```bash
python automations/bancos/consulta.py --testar --base cars2you
python automations/bancos/consulta.py "SELECT ..." --base dealers --limite 50
python automations/bancos/consulta.py --arquivo x.sql --base cars2you --json saida.json
```

| base | schema | usuário | credencial |
|---|---|---|---|
| `cars2you` | `cars2you_production` | `bi_read_cars2you` | `~/.cars2you-db.env` |
| `dealers` | `wl_dlc_prd` | `bi_read_wl_dlc_prd` | `~/.dealers-dlc.env` |

MySQL **8.4.8** nos dois.

### As credenciais nunca moram no repo

Três barreiras, porque `.gitignore` sozinho não segura — um `git add -f` ou um
rename derruba:

1. `.gitignore` cobre os arquivos de credencial
2. **`conexao.py` recusa** ler credencial de dentro do repo
3. A senha nunca é impressa, **nem dentro de mensagem de erro** — o
   `mysql-connector` às vezes ecoa a senha na exceção

Prefixo de variável diferente por base (`C2Y_`, `DLC_`) para um arquivo não
poder ser usado no lugar do outro por engano.

### Só leitura

O runner aceita `SELECT`, `SHOW`, `DESCRIBE`, `EXPLAIN` e `WITH`. Barra
multi-statement e seis padrões que fazem estrago **dentro** de um `SELECT`:
`INTO OUTFILE`, `FOR UPDATE`, `LOCK IN SHARE`, `LOAD_FILE()`, `BENCHMARK()`,
`SLEEP()`. A sessão ainda entra em `TRANSACTION READ ONLY`.

**Não existe lista de palavras proibidas**, de propósito: procurar
`update`/`create` soltos barra `updated_at` e `created_at` — que aparecem em
quase todo SELECT do padrão Laravel — e mesmo assim não pega `INTO OUTFILE`.
Prova: 17 casos em `automations/bancos/_prova_guarda.py`.

## ⚠️ Armadilhas de acesso

- 🔌 **Depende de VPN.** Os hosts resolvem para IP privado. Em 18/09 as duas
  bases caíram **ao mesmo tempo** e voltaram juntas. **Se as duas falham
  juntas, é rede — não perca tempo investigando o host.**
- 🕐 **A primeira conexão do dia pode estourar o prazo** e a seguinte fechar em
  2s. O socket cru conecta em 0,3s: é o handshake do connector em conexão fria.
  Por isso o timeout é 30s, não 20.
- 🕐 **O banco responde em UTC; os eventos são horário de Brasília.** Recorte de
  data tem que ser calculado fora do SQL e ir como **literal**.
