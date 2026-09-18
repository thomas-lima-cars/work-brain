"""Prova a guarda de SQL. Nao conecta em nada -- roda offline.

  python automations/bancos/_prova_guarda.py

Os casos que PASSAM valem tanto quanto os que barram: uma guarda que barra
tudo e inutil, e uma que pega `updated_at` barra quase todo SELECT do padrao
Laravel.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from consulta import validar  # noqa: E402

CASOS = (
    # (sql, deve_passar, descricao)
    ("SELECT id, updated_at, created_at FROM users", True, "colunas updated_at/created_at"),
    ("select * from x where nome = 'drop table y'", True, "palavra perigosa dentro de string"),
    ("SELECT REPLACE (col, 'a', 'b') FROM t", True, "REPLACE como funcao, com espaco"),
    ("WITH c AS (SELECT 1) SELECT * FROM c", True, "CTE"),
    ("SHOW TABLES", True, "SHOW"),
    ("SELECT * FROM t LIMIT 10 OFFSET 5", True, "OFFSET contem 'set'"),
    ("SELECT * FROM t WHERE obs LIKE '%for update%'", True, "frase perigosa dentro de string"),
    ("UPDATE users SET nome = 'x'", False, "UPDATE de verdade"),
    ("DELETE FROM t", False, "DELETE"),
    ("SELECT 1; DROP TABLE t", False, "multi-statement"),
    ("SELECT 1 -- ok\n; DELETE FROM t", False, "escrita atras de comentario de linha"),
    ("SELECT 1 /* x */ ; TRUNCATE t", False, "escrita atras de comentario de bloco"),
    ("SELECT * FROM t INTO OUTFILE '/tmp/x'", False, "grava arquivo no servidor"),
    ("SELECT * FROM t FOR UPDATE", False, "lock de escrita"),
    ("SELECT LOAD_FILE('/etc/passwd')", False, "le arquivo do servidor"),
    ("SELECT SLEEP(30)", False, "segura a conexao"),
    ("", False, "vazia"),
)


def main():
    falhas = 0
    for sql, deve, desc in CASOS:
        try:
            validar(sql)
            passou, motivo = True, ""
        except SystemExit as e:
            passou, motivo = False, str(e).split("\n")[0]
        ok = passou == deve
        falhas += 0 if ok else 1
        print(("ok   " if ok else "FALHA"),
              ("passa" if deve else "barra").ljust(6),
              desc.ljust(38),
              ("" if passou else "-> " + motivo[:52]))

    # A SQL que vai ao servidor tem que ser a ORIGINAL. A versao limpa teve as
    # strings trocadas por '' e rodaria uma consulta diferente da pedida.
    original = "SELECT * FROM x WHERE nome = 'Joao'"
    devolvida = validar(original)
    if devolvida != original:
        falhas += 1
        print("FALHA devolveu SQL adulterada: " + devolvida)
    else:
        print("ok    devolve a SQL original, com as strings intactas")

    print("\nFALHAS: " + str(falhas))
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.exit(main())
