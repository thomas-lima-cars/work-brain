# -*- coding: utf-8 -*-
"""Registra em dominios.md o que a sonda 50346 mediu.

Tres dominios que estavam na lista de "ainda sem decodificar" e um horizonte
de historico que ninguem tinha notado e que muda o que da pra prometer.

GRAVACAO ATOMICA: `io.open(P, "w")` trunca na abertura. Hoje mesmo isso
zerou o README do rel-veiculos quando uma excecao caiu no meio da escrita.

    python _dominios_sonda_50346.py
"""
import io
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

P = os.path.join("C:\\", "Users", "thoma", "Documents", "work-brain",
                 "context", "banco-de-dados", "dominios.md")
s = io.open(P, encoding="utf-8").read()
orig = s

ancora = "## Ainda sem decodificar"
if s.count(ancora) != 1:
    raise SystemExit("ANCORA AMBIGUA OU AUSENTE: '%s' (%d)" % (ancora, s.count(ancora)))

secao = """## `vehicle_precautionary_reports.situation` — o laudo cautelar

Medido na sonda **50346** (2026-09-11). VARCHAR, cinco valores, legíveis:

| situation | laudos | leitura |
|---|---:|---|
| `nao_informado` | 69.580 | laudo existe mas não traz resultado — **é a maioria, 78%** |
| `aprovado` | 10.922 | limpo |
| `aprovado_com_apontamento` | 4.619 | passou com ressalva |
| `reprovado` | 2.995 | não passou |
| *(vazio ou nulo)* | 850 | |

⚠️ **`nao_informado` não é ausência de laudo — é laudo sem veredito.** São
coisas diferentes e as duas existem: 95,8% dos veículos ofertados têm linha em
`vehicle_precautionary_reports`, mas quase quatro em cada cinco dessas linhas
não dizem o resultado. Qualquer "% por status de laudo" que trate
`nao_informado` como "sem laudo" mistura as duas e mente.

Uma linha por veículo: `n` e `COUNT(DISTINCT vehicle_id)` batem nos cinco
valores, então não há histórico de laudos por veículo — é o estado atual.

## `transactions.situation` — a compra

Medido na sonda **50346**. Só **três** valores, e o significado **não** foi
decidido:

| situation | transações | lojas compradoras |
|---:|---:|---:|
| 2 | 9.183 | 808 |
| 1 | 2.411 | 644 |
| 3 | 1.861 | 435 |

Não confundir com `advertisement_negotiations.status`, que tem 12 valores e
significado documentado. São tabelas diferentes com colunas homônimas.

🚨 **Antes de usar "comprou" em qualquer regra, decidir quais desses três
contam.** A diferença é grande: 808 lojas no valor 2 contra 435 no valor 3.

## ⏳ O banco só tem cerca de UM ANO de histórico

Medido na sonda **50346**, e é a descoberta que mais restringe o que dá pra
prometer:

| tabela | registro mais antigo |
|---|---|
| `access_logs` | 2025-08-31 |
| `vehicle_precautionary_reports` | 2025-08-31 |
| `transactions` | 2025-09-02 |

A coincidência de duas tabelas começarem no **mesmo dia** aponta migração ou
política de retenção, não início de operação — `user_access` vai a 2022 para as
mesmas lojas.

🚨 **Consequência dura: "nunca acessou" e "nunca comprou" não são verificáveis.**
O que o banco sabe dizer é "não acessou desde 31/08/2025". Qualquer
segmentação que tenha uma faixa "nunca" está, na prática, medindo "não nos
últimos 12 meses" — e precisa dizer isso na tela, senão promete uma certeza
que o dado não tem.

`user_access` (via `user_shops`) alcança 2022 e é a saída quando a pergunta
for mesmo "nunca". Custa um join a mais e não tem `shop_id` direto.

## Contato de loja: o e-mail praticamente não existe

Medido na sonda **50346**, nas 1.298 lojas com oferta nos últimos 6 meses dos
seis canais:

| coluna de `shops` | preenchida |
|---|---:|
| `comercial_number` | 1.029 (79,3%) |
| `whatsapp_number` | 1.026 (79,0%) |
| `privative_number` | 116 (8,9%) |
| `comercial_email` | **75 (5,8%)** |
| `privative_email` | **62 (4,8%)** |

⚠️ Telefone é coluna utilizável; **e-mail não é**. Uma coluna de e-mail no
relatório sairia vazia em 19 de cada 20 linhas. Se o e-mail for necessário, a
fonte provável é `users` via `user_shops`, que ainda não foi medida.

🔴 **`privative_*` é contato pessoal, não da empresa.** Em relatório que vai
pro SharePoint do time, o defensável é `comercial_*` e `whatsapp_number`.

## `advertisements.fipe_price` é a coluna de FIPE que está preenchida

Medido na sonda **50346**, sobre as 104.305 ofertas da janela de 6 meses:

| coluna | preenchida |
|---|---:|
| `versions.code_fipe` | 89.944 (86,2%) |
| `advertisements.fipe_price` | 89.327 (85,6%) |
| `vehicles.fipe_price` | 66.514 (63,8%) |

**Não existe tabela de preço FIPE por código.** `code_fipe` é só o código; o
valor vive denormalizado nas outras duas, e elas divergem entre si em 633
ofertas. Para cálculo de deságio, usar `advertisements.fipe_price` — é a do
anúncio, tem 22 pontos a mais de cobertura, e é contemporânea da oferta.

🚨 **Há lixo nos extremos.** Deságio calculado sobre a última oferta vai de
**−1.586%** a **+94%**: existe oferta 16 vezes acima da FIPE registrada. Média
simples por loja é destruída por um caso desses — qualquer agregação precisa
de corte de outlier declarado.

"""

s = s.replace(ancora, secao + ancora, 1)

tmp = P + ".tmp"
with io.open(tmp, "w", encoding="utf-8") as f:
    f.write(s)
os.replace(tmp, P)

print("dominios.md: %d -> %d chars" % (len(orig), len(s)))
