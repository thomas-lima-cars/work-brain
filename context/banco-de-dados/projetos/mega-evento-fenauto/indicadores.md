# Mega Evento Fenauto (Cars2You e IGA) — números medidos

> 🔴 **Fonte única** dos números dos painéis `automations/n8n-sdk/painel-eventos-fenauto-cars2you/`
> e `automations/n8n-sdk/painel-eventos-fenauto-iga/` (o segundo, só com os eventos do IGA:
> seção no fim).
> O README da pasta linka aqui. Regras do painel no README; o que é a campanha no banco em
> [`plataforma/dominios.md`](../../plataforma/dominios.md#user_profilesregister_form--a-campanha-do-cadastro).

## A semana de 02 a 08/11/2026 — coleta de 2026-11-03 10:45

`python coleta_local.py`, conexão direta (VPN), o SQL do Montar Consultas. Cada consulta em menos de 0,5 s.

| | |
|---|---:|
| eventos | **2**, os dois do C6, nenhum do IGA |
| 24326 "Evento Exclusivo C6 Auto – 04/11/26" (31/10 13:00 → 04/11 16:00, em andamento) | 75 veículos, 1 lance, 73 lojas acessaram |
| 24329 "Evento Exclusivo C6 Auto – 06/11/26" (04/11 18:00 → 06/11 16:00, agendado) | 7 veículos |
| veículos / anúncios acessados | 82 / 60 |
| lojas na consulta | 73 |
| lojas novas (campanha da Fenauto) | **0** — não há cadastro da campanha em 2026 |
| HTML | 154 KB |

## A semana da Fenauto 2025 (17 a 23/11/2025) — a coleta de prova, 2026-11-03

`python coleta_local.py --prova`. Pacote maior: `ofertas`, 109,7 KB (abaixo dos ~130 KB que o MCP já provou).

| evento | operação | período | publicados | lances | vendidos | lojas acessaram | novas |
|---|---|---|---:|---:|---:|---:|---:|
| 22212 | C6 | 14/11 12:30 → 17/11 16:00 | 8 | 29 | 1 | 75 | 0 |
| 22229 | IGA | 18/11 14:00 → 16:00 | 77 | 399 | 23 | 73 | 0 |
| 22227 | C6 | 18/11 17:30 → 19/11 16:00 | 0 | 0 | 0 | 0 | 131 |
| 22228 | C6 | 18/11 19:00 → 19/11 16:00 | 0 | 0 | 0 | 13 | 131 |
| 22231 "FENAUTO 2025" | C6 | 19/11 09:00 → 21/11 16:00 | 54 | 262 | 18 | 141 | 221 |
| 22223 "VD IGA exclusivo Fenauto" | IGA | 19/11 10:00 → 21/11 16:00 | 24 | 175 | 20 | 177 | 221 |
| 22235 | IGA | 19/11 10:00 → 16:00 | 61 | 422 | 23 | 141 | 131 |
| 22241 | IGA | 20/11 14:00 → 16:00 | 52 | 60 | 14 | 46 | 77 |
| 22237 | IGA | 21/11 14:00 → 16:00 | 6 | 0 | 0 | 17 | 13 |
| 22242 | IGA | 21/11 14:00 → 16:00 | 35 | 1 | 1 | 34 | 13 |
| 22248 | IGA | 22/11 11:00 → 12:00 | 83 | 454 | 32 | 71 | 2 |
| **semana** | | | **400** | **1.802** | **132** | **481** | **223** |

Os publicados de cada evento batem com uma consulta à parte feita antes do nó
rodar (contagem de negociações não apagadas). A prova confere os 11.

- Vendido R$ 7.262.410; 158 ofertantes; 82 compradores.
- **2 lances sem loja compradora** (`buyer_shop_id` nulo, 20/11/2025, negociações 387111 e 388049): fora das contas, viram aviso.
- **Campanha "Fenauto 2025 IGA": 226 lojas** (227 usuários), perfis de 19 a 24/11/2025.
  **223 são novas** na semana; as 3 de fora se cadastraram em 23 e 24/11, dias sem evento.
  **11** das 226 lojas existiam antes (2020–2023, e uma em 09/2025): entram porque vale a data do perfil.
- Funil das novas: 223 cadastradas → 223 aprovadas → 103 acessaram → 16 ofertaram → 7 compraram.
- HTML: 560 KB.

## Versão IGA (só eventos do IGA) — coletas de 2026-11-05

O painel `painel-eventos-fenauto-iga/` corta os eventos que alvejam o whitelabel 43 (C6).
`python coleta_local.py` e `--prova`, conexão direta (VPN). Cada consulta em menos de 0,8 s.

**A semana da Fenauto 2025 (17 a 23/11/2025), 2026-11-05:** os **7** eventos do IGA da tabela
acima, com os mesmos publicados, lances, vendidos, lojas que acessaram e novas, evento a evento
(22229, 22223, 22235, 22241, 22237, 22242, 22248). Os 4 do C6 (22212, 22227, 22228, 22231) ficam fora.

| | |
|---|---:|
| publicados / vendidos / com VMV atingido | 338 / 113 / 132 |
| lances / ofertantes / compradores | 1.511 / 119 / 65 |
| vendido | R$ 6.384.310 (37,0% da soma dos VMV publicados) |
| recuperação / FIPE · / VMV | 76,9% · 105,6% |
| lojas que acessaram | 327 |
| novas | **223**, as mesmas da versão com o C6: o 22223 cobre 19 a 21/11 |
| funil das novas | 223 → 223 aprovadas → 103 acessaram → 16 ofertaram → 7 compraram |
| aviso | os mesmos 2 lances sem loja compradora |
| HTML | 474 KB |

**A semana de 02 a 08/11/2026, coleta de 2026-11-05 17:15:** **2** eventos do IGA (os 2 do C6
da coleta de 03/11 ficam fora).

| evento | período | estado às 17:15 | publicados | lances | vendidos | lojas acessaram |
|---|---|---|---:|---:|---:|---:|
| 24350 "Venda Direta IGA - Misto - 05/11/26" | 05/11 14:00 → 16:00 | encerrado | 53 | 23 | 11 | 55 |
| 24363 "Venda Direta IGA - Misto - 06/11/26" | 06/11 14:00 → 16:00 | agendado | 60 | 0 | 0 | 0 |
| **semana** | | | **113** | **23** | **11** | **55** |

Vendido R$ 317.100; 13 ofertantes; 10 compradores. **Nenhuma loja nova**: ainda não há
cadastro da campanha em 2026. HTML: 177 KB.
