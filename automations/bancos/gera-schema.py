"""Gera o schema do banco a partir do `information_schema`.

  python automations/bancos/gera-schema.py [--base cars2you] [--saida <arquivo>]

Padrao: escreve `context/banco-de-dados/plataforma/schema-gerado.md`.

── POR QUE ESTE SCRIPT EXISTE ───────────────────────────────────────────────
O `schema.md` de 09/09 foi montado a mao, cruzando um .txt e um PDF exportados
do banco. Ele documenta **149 tabelas** e o banco tem **193** -- 44 nunca
entraram, e ninguem soube por nove dias, porque nao havia contra o que
conferir. Alem disso, 4 nomes de tabela vieram truncados pelo diagrama e 79
colunas ficaram escondidas atras de um rotulo "N more...".

Nada disso e culpa do cruzamento: a fonte ja veio incompleta. Com conexao
direta, a fonte passa a ser o proprio banco.

── O QUE ESTE ARQUIVO NAO SUBSTITUI ─────────────────────────────────────────
O `schema.md` escrito a mao tem o que o `information_schema` NAO sabe:
descricao em portugues de cada tabela, o agrupamento por dominio, e as notas
de leitura. Isso e conhecimento humano e nao se gera.

Por isso a saida vai para `schema-gerado.md`, ao lado, e nao por cima. O
gerado e a verdade sobre ESTRUTURA; o escrito e a verdade sobre SIGNIFICADO.
Quem for unificar os dois precisa preservar as descricoes.
"""

import sys
from datetime import date
from pathlib import Path

AQUI = Path(__file__).resolve().parent
sys.path.insert(0, str(AQUI))
sys.stdout.reconfigure(encoding="utf-8")
from conexao import conectar  # noqa: E402

REPO = AQUI.parents[1]
BASE = "cars2you"
SAIDA = REPO / "context" / "banco-de-dados" / "plataforma" / "schema-gerado.md"
for i, a in enumerate(sys.argv):
    if a == "--base" and i + 1 < len(sys.argv):
        BASE = sys.argv[i + 1].lower()
    if a == "--saida" and i + 1 < len(sys.argv):
        SAIDA = Path(sys.argv[i + 1])

# Colunas que nunca devem aparecer nem como NOME numa doc que circula. O nome
# da coluna nao e PII, mas listar `last_owner_document` ao lado de
# `last_owner_name` e um mapa de onde procurar. Ficam contadas, nao nomeadas.
PII = ("plate", "chassi", "chassis", "renavam", "last_owner", "document",
       "cpf", "cnpj", "password", "token", "secret")


def sensivel(nome):
    n = nome.lower()
    return any(p in n for p in PII)


def main():
    cx = conectar(BASE)
    cur = cx.cursor()
    cur.execute("SELECT DATABASE(), VERSION()")
    schema, versao = cur.fetchone()

    cur.execute("""SELECT table_name, table_comment
                     FROM information_schema.tables
                    WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'
                    ORDER BY table_name""")
    tabelas = cur.fetchall()

    cur.execute("""SELECT table_name, column_name, column_type, is_nullable,
                          column_key, column_default, extra
                     FROM information_schema.columns
                    WHERE table_schema = DATABASE()
                    ORDER BY table_name, ordinal_position""")
    cols = {}
    for t, c, tipo, nulo, chave, padrao, extra in cur.fetchall():
        cols.setdefault(t, []).append((c, tipo, nulo, chave, padrao, extra))

    cur.execute("""SELECT table_name, column_name,
                          referenced_table_name, referenced_column_name
                     FROM information_schema.key_column_usage
                    WHERE table_schema = DATABASE()
                      AND referenced_table_name IS NOT NULL
                    ORDER BY table_name, column_name""")
    fks, referenciada = {}, {}
    for t, c, rt, rc in cur.fetchall():
        fks.setdefault(t, []).append((c, rt, rc))
        referenciada.setdefault(rt, []).append(t)

    contagem = {}
    for t, _ in tabelas:
        cur.execute("SELECT COUNT(*) FROM `%s`" % t)
        contagem[t] = cur.fetchone()[0]
    cur.close()
    cx.close()

    n_cols = sum(len(v) for v in cols.values())
    n_fks = sum(len(v) for v in fks.values())
    ocultas = sum(1 for t in cols for c, *_ in cols[t] if sensivel(c))

    L = ["# Schema gerado — %s\n" % schema]
    L.append("""> 🤖 **Gerado por `automations/bancos/gera-schema.py`** em %s, direto do
> `information_schema` de `%s` (MySQL %s).
>
> **Não editar à mão** — rode o script de novo.
>
> ⚠️ Este arquivo é a verdade sobre **estrutura**. O
> [`schema.md`](schema.md), escrito à mão, é a verdade sobre **significado**:
> descrição de cada tabela em português, agrupamento por domínio e notas de
> leitura, que o `information_schema` não sabe. Os dois convivem.
>
> 🔒 **%d nomes de coluna sensíveis** (placa, chassi, renavam, documento, senha,
> token) foram **contados e não nomeados** — listá-los seria um mapa de onde
> procurar. Ver a política em [`qualidade.md`](qualidade.md).
""" % (date.today().isoformat(), schema, versao, ocultas))

    L.append("\n## Números\n")
    L.append("| | |\n|---|---:|")
    L.append("| Tabelas | **%d** |" % len(tabelas))
    L.append("| Colunas | %s |" % "{:,}".format(n_cols).replace(",", "."))
    L.append("| Chaves estrangeiras | %s |" % "{:,}".format(n_fks).replace(",", "."))
    vazias = sum(1 for t in contagem if contagem[t] == 0)
    L.append("| Tabelas vazias | %d |" % vazias)

    L.append("\n## As 15 maiores\n")
    L.append("| tabela | linhas | colunas |\n|---|---:|---:|")
    for t in sorted(contagem, key=lambda x: -contagem[x])[:15]:
        L.append("| `%s` | %s | %d |" % (
            t, "{:,}".format(contagem[t]).replace(",", "."), len(cols.get(t, []))))

    L.append("\n## Tabelas\n")
    for t, comentario in tabelas:
        L.append("\n### %s\n" % t)
        linha = "%s linhas · %d colunas" % (
            "{:,}".format(contagem[t]).replace(",", "."), len(cols.get(t, [])))
        if comentario:
            linha = comentario + " · " + linha
        L.append("_%s_\n" % linha)

        L.append("```")
        for c, tipo, nulo, chave, padrao, extra in cols.get(t, []):
            if sensivel(c):
                L.append("%-42s (coluna sensível — nome omitido)" % "···")
                continue
            marca = " PK" if chave == "PRI" else (" UNI" if chave == "UNI" else "")
            nn = "" if nulo == "YES" else " NOT NULL"
            L.append("%-42s %s%s%s%s" % (c, tipo, nn, marca,
                                         " " + extra if extra else ""))
        L.append("```")

        if fks.get(t):
            L.append("\n**Aponta para:** " + " · ".join(
                "`%s` → `%s.%s`" % (c, rt, rc) for c, rt, rc in fks[t]))
        if referenciada.get(t):
            quem = sorted(set(referenciada[t]))
            L.append("\n**Referenciada por (%d):** %s" % (
                len(quem), " · ".join("`%s`" % x for x in quem)))

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text("\n".join(L) + "\n", encoding="utf-8")
    print("%s · %d tabelas · %s colunas · %d FKs · %d nomes sensíveis omitidos"
          % (SAIDA.name, len(tabelas), "{:,}".format(n_cols).replace(",", "."),
             n_fks, ocultas))
    print("%.0f KB" % (SAIDA.stat().st_size / 1024))


if __name__ == "__main__":
    main()
