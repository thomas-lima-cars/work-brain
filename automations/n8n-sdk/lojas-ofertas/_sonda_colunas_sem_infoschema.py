# -*- coding: utf-8 -*-
"""Troca as tres consultas que o MCP recusou por um caminho que ele aceita.

A sonda 50068 mediu um limite NOVO do MCP: o information_schema e bloqueado
("access to system schema is not allowed"). Isso derrubou as tres consultas
que iam abrir as 49 colunas que o diagrama colapsou -- e era por elas que eu
ia responder se existe status de documentacao.

O contorno que eu devia ter usado de saida: `SELECT *` numa linha. A resposta
do MCP vem com o cabecalho, entao as colunas aparecem sem eu precisar de
catalogo nenhum.

PRIVACIDADE -- por que a lista de tabelas e curta:
`SELECT *` devolve VALOR, nao so nome de coluna. Em `vehicles` e
`vehicle_extra_fields` isso significa placa, chassi, renavam e documento do
ultimo proprietario num dump de execucao que fica em disco. Nao vale o preco:
status de documentacao por negociacao moraria em
`advertisement_negotiations`, e o dominio do whitelabel em `whitelabels`.
Essas duas mais `advertisements` (ids e precos) nao carregam PII de pessoa.

    python _sonda_colunas_sem_infoschema.py
"""
import io
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "sonda-eventos-queries.js")
s = io.open(P, encoding="utf-8").read()
orig = s

ini = s.index("/* 12. as colunas que o diagrama colapsou")
fim = s.index("/* \xe2\x94\x80\xe2\x94\x80 o PATIO".decode("utf-8") if False else "/* ── o PATIO")

NOVO = u"""/* 12-14. RIP information_schema: a sonda 50068 provou que o MCP bloqueia
   ("access to system schema is not allowed"). O contorno e `SELECT *` numa
   linha -- o cabecalho da resposta ENTREGA os nomes das colunas.

   A lista de tabelas e curta de proposito. `SELECT *` devolve valor, e em
   `vehicles`/`vehicle_extra_fields` isso e placa, chassi, renavam e
   documento do ultimo proprietario indo pra um dump em disco. Status de
   documentacao por negociacao moraria em advertisement_negotiations; o
   dominio do whitelabel, em whitelabels. Nenhuma das tres abaixo tem PII
   de pessoa fisica. */
push('q_cols_neg',
  "SELECT * FROM advertisement_negotiations WHERE deleted_at IS NULL" +
  " ORDER BY id DESC", 1);

push('q_cols_wl', "SELECT * FROM whitelabels ORDER BY id", 1);

push('q_cols_anuncio',
  "SELECT * FROM advertisements WHERE deleted_at IS NULL ORDER BY id DESC", 1);

"""

s = s[:ini] + NOVO + s[fim:]

# e o link: marca/modelo/versao preenchidos na janela nova?
anc = u"const comJanela = Q.filter"
LINK = u"""/* 20. o link precisa de QUATRO pedacos, nao de um. O padrao esta decidido
   desde 25/08 e conferido contra os exemplos do Gui (ver
   n8n-flows/lista-lm-propostas.md): 
   cars2you.com.br/anuncio/veiculo/{marca}/{modelo}/{versao}/{uuid}
   Sem um dos tres nomes o link nao pode ser entregue -- melhor sem botao
   que botao que cai em lugar nenhum. Isso mede quantos ficariam sem. */
push('q_link_partes',
  "SELECT COUNT(DISTINCT a.vehicle_id) AS veiculos," +
  " SUM(CASE WHEN TRIM(COALESCE(b.name, '')) = '' THEN 1 ELSE 0 END) AS sem_marca," +
  " SUM(CASE WHEN TRIM(COALESCE(m.name, '')) = '' THEN 1 ELSE 0 END) AS sem_modelo," +
  " SUM(CASE WHEN TRIM(COALESCE(ve.name, '')) = '' THEN 1 ELSE 0 END) AS sem_versao," +
  " SUM(CASE WHEN TRIM(COALESCE(a.uuid, '')) = '' THEN 1 ELSE 0 END) AS sem_uuid," +
  " SUM(CASE WHEN TRIM(COALESCE(b.name,'')) <> '' AND TRIM(COALESCE(m.name,'')) <> ''" +
  " AND TRIM(COALESCE(ve.name,'')) <> '' AND TRIM(COALESCE(a.uuid,'')) <> ''" +
  " THEN 1 ELSE 0 END) AS link_completo" +
  " FROM advertisement_negotiations an" +
  " INNER JOIN events e ON e.id = an.event_id AND" + JAN_NOVA +
  " INNER JOIN advertisements a ON a.id = an.advertisement_id AND a.deleted_at IS NULL" +
  " INNER JOIN vehicles v ON v.id = a.vehicle_id AND v.deleted_at IS NULL" +
  " LEFT JOIN brands b ON b.id = v.brand_id" +
  " LEFT JOIN models m ON m.id = v.model_id" +
  " LEFT JOIN versions ve ON ve.id = v.version_id" +
  " WHERE an.deleted_at IS NULL", 1);

"""
s = s.replace(anc, LINK + anc, 1)

io.open(P, "w", encoding="utf-8").write(s)
print("mudou: " + str(s != orig))
print("fora: q_colunas, q_col_doc, q_tab_doc (information_schema bloqueado)")
print("dentro: q_cols_neg, q_cols_wl, q_cols_anuncio, q_link_partes")
