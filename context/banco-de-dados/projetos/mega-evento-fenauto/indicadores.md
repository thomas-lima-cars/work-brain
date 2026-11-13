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

## Lojistas Fenauto 2026 por região (versão IGA) — coleta de 2026-11-11, 1º dia da feira

O cartão conta **só as lojas cadastradas pela campanha "Fenauto 2026 IGA"** (Thomas, 11/11:
"considere somente Fenauto 2026"), pela UF de `shop_addresses` (normalização em
`plataforma/dominios.md`, "A UF do endereço da loja"). Medido com `coleta_local.py` e
conferido loja a loja contra o banco (mesmas 18 lojas, mesmas 9 UFs).

**18 lojistas em 9 UFs, todos com UF; nenhuma loja apagada.**

| região | lojistas | % | acessaram o evento | UFs |
|---|---:|---:|---:|---|
| Sudeste | 11 | 61% | 8 | SP 6 · ES 3 · MG 2 |
| Nordeste | 3 | 17% | 1 | PB 1 · RN 1 · SE 1 |
| Sul | 2 | 11% | 1 | RS 2 |
| Centro-Oeste | 1 | 6% | 1 | GO 1 |
| Norte | 1 | 6% | 0 | AP 1 |

A consulta de lojas com a UF e a campanha do ano: 36 lojas, 3,4 KB, 0,37 s (no mês de prova,
322 lojas, 31,8 KB, 0,59 s).

## Cliente da Fenauto por operação — coletas de 2026-11-11, à tarde

Regra de 11/11 nos três painéis: loja nova = cadastro pela campanha **"Fenauto <ano> <operação>"**
num dia de evento daquela operação ("Fenauto 2026 C6" no C6, "Fenauto 2026 IGA" no IGA; no
Cars2You, cada evento pela campanha da operação dele, com o filtro Operação Todas · C6 · Itaú).

- **"Fenauto 2026 C6" ainda não tem nenhum perfil** (medido às 14h e nas coletas da tarde): o
  Eventos Fenauto C6 e o recorte C6 do Cars2You mostram 0 novos.
- **"Fenauto 2026 IGA": 42 lojas**, todas cadastradas em 11/11, novas nos 3 eventos do IGA
  (24377–24379). Painel IGA: 42 novas e 42 no cartão de regiões. Cars2You, semana de 09 a
  15/11: Itaú 42, C6 0, Todas 42.
- Semana de prova do Cars2You (17/11/2025): Itaú 221 das 226 da "Fenauto 2025 IGA" (5 se
  cadastraram de 22 a 24/11, fora dos dias do 22223); o evento do C6 (22231), que antes
  contava as mesmas 221, agora tem 0.

## Novos lojistas pelo grupo (regra de 12/11) — medição direta de 2026-11-12, ~11h

Regra de 12/11 nos três painéis, que substitui a do formulário:

- **Nova**: loja cadastrada a partir de 10/11, com usuário externo no grupo da operação. O IGA usa o 148; o C6 usa o 69 e o 146 (`plataforma/dominios.md`).
- **Antiga sem compra que voltou**: loja do grupo sem compra de 10/05 a 09/11 que acessou a plataforma a partir de 10/11.
- **Fora**: compradores antigos, usuários internos, contas do banco e cadastros de teste.

A medição foi por conexão direta, numa consulta de 18 s.

| operação | novas | voltaram | total | compradoras antigas (fora) |
|---|---:|---:|---:|---:|
| IGA (148) | 83 | 37 | **120** | 26 |
| C6 (69, 146) | 7 | 69 | **76** | 121 |

- **IGA**: as 83 novas são todas do WL 7. Por dia de cadastro, foram 77 em 11/11 e 6 em 12/11. Das 83, 72 trazem o formulário "Fenauto 2026 IGA". Das 37 que voltaram, o primeiro acesso foi em 10/11 para 2, em 11/11 para 30 e em 12/11 para 5.
- **C6**: as 7 novas são do WL 43, cadastradas 1 em 10/11, 5 em 11/11 e 1 em 12/11. Das 69 que voltaram, o primeiro acesso foi em 10/11 para 47, em 11/11 para 18 e em 12/11 para 4.

No n8n, a rodada 69057 (12/11, 11:40) publicou com a regra nova:

| painel | total | por evento |
|---|---:|---|
| Eventos Fenauto C6 | 77 | 24384: 77; 24368: 48 |
| Mega Evento Fenauto (IGA) | 124 | 24377: 110; 24378: 124; 24379: 124 |
| Mega Evento Fenauto (Cars2You) | 201 | os mesmos números por evento |

Os 48 do 24368 são só as entradas de 10/11, porque o evento termina nesse dia. No 24377, que termina em 11/11, entram as entradas até 11/11.

### Novos e reativados separados — coletas locais de 2026-11-12, à tarde

Desde a tarde de 12/11, os painéis mostram as lojas novas e as reativadas em cartões separados. Reativada é a loja antiga que voltou. Os números abaixo vêm de `coleta_local.py` e `monta_local.js`, pela conexão direta.

| painel | hora | novos | reativados | soma |
|---|---|---:|---:|---:|
| Mega Evento Fenauto (IGA), todos os eventos | 12:43 | 103 | 45 | 148 |
| Eventos Fenauto C6 | à tarde | 7 | 69 | 76 |

No IGA, com o Data em 11/11: 77 novos e 32 reativados.

Vendidos do IGA às 12:43: **4** vendidos, 3 compradores e R$ 398.200. Uma das vendas é a 516768: a oferta vencedora foi lançada por um usuário interno e não tem loja. Antes da correção, o cartão mostrava 3 vendidos.

A rodada 69102 do n8n (12/11, 16:23) foi a primeira publicada com novos e reativados separados.

| painel | novos | reativados | vendidos | compradores | valor vendido |
|---|---:|---:|---:|---:|---:|
| Eventos Fenauto C6 | 7 | 76 | 15 | 12 | R$ 617.600 |
| Mega Evento Fenauto (IGA) | 147 | 57 | 12 | 9 | R$ 1.586.400 |
| Mega Evento Fenauto (Cars2You) | 154 | 133 | 27 | 21 | R$ 2.204.000 |

Por evento, em novos / reativados / vendidos:

| evento | novos | reativados | vendidos |
|---|---:|---:|---:|
| 24384 | 7 | 76 | 2 |
| 24368 | 1 | 47 | 13 |
| 24379 | 147 | 57 | 0 |
| 24378 | 147 | 57 | 8 |
| 24377 | 77 | 35 | 4 |

No IGA e no Cars2You há o aviso de 4 lances sem loja compradora.

### Um veículo só — rodada 69115 do n8n (12/11, 16:53)

Desde esta rodada, o carro que volta em outro evento conta uma vez. Cada evento abre uma negociação nova para o carro.

| painel | negociações | veículos publicados |
|---|---:|---:|
| C6 | 120 | 106 |
| IGA | 39 | 32 |
| Cars2You | 159 | 138 |

No IGA, 7 carros sem venda no 24377 voltaram no 24378; um deles vendeu lá. Por evento, nada muda: 24377 tem 11 veículos, 24378 tem 18 e 24379 tem 10.

