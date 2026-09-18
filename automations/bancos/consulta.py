"""Roda SQL de LEITURA no banco da Dealers.

  python consulta.py --testar
  python consulta.py "SELECT ..." [--limite 200] [--json saida.json]
  python consulta.py --arquivo consultas/algo.sql

A guarda de leitura e deliberada: este e um banco de PRODUCAO de outro tenant,
e eu gero SQL exploratoria o tempo todo. Escrita passa longe daqui.
"""

import argparse
import json
import re
import sys
from pathlib import Path

# O modulo de conexao virou compartilhado em 17/09, quando a Cars2You ganhou
# acesso direto tambem. Duas copias divergiriam.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from conexao import conectar, ler_env, caminho_env  # noqa: E402

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

INICIO_OK = ("select", "show", "describe", "desc", "explain", "with")

# Nao existe lista de palavras proibidas aqui, de proposito. Procurar
# "update"/"create" soltos erra dos dois lados: pega updated_at e created_at
# (falso positivo em quase todo SELECT do padrao Laravel) e REPLACE() como
# funcao de string, e ao mesmo tempo NAO pega o que de fato faz estrago dentro
# de um SELECT. Como o comando ja e obrigado a comecar com leitura e
# multi-statement ja e barrado, o risco real que sobra e este:
PERIGOS = (
    (r"\binto\s+(out|dump)file\b", "SELECT ... INTO OUTFILE grava arquivo no servidor"),
    (r"\bfor\s+update\b", "FOR UPDATE poe lock de escrita nas linhas"),
    (r"\block\s+in\s+share\b", "LOCK IN SHARE MODE poe lock nas linhas"),
    (r"\bload_file\s*\(", "LOAD_FILE() le arquivo do servidor"),
    (r"\bbenchmark\s*\(", "BENCHMARK() queima CPU do servidor"),
    (r"\bsleep\s*\(", "SLEEP() segura a conexao aberta"),
)


def limpar(sql):
    """Tira comentarios e strings pra analisar so a estrutura do comando."""
    s = re.sub(r"/\*.*?\*/", " ", sql, flags=re.S)
    s = re.sub(r"--[^\n]*", " ", s)
    s = re.sub(r"#[^\n]*", " ", s)
    s = re.sub(r"'(?:[^'\\]|\\.)*'", "''", s)
    s = re.sub(r'"(?:[^"\\]|\\.)*"', '""', s)
    return s


def validar(sql):
    nu = limpar(sql).strip().rstrip(";").strip()
    if not nu:
        raise SystemExit("SQL vazia.")

    if ";" in nu:
        raise SystemExit(
            "RECUSADO: mais de um comando. Uma consulta por vez -- multi-statement\n"
            "e como uma escrita entra escondida atras de um SELECT."
        )

    baixo = nu.lower()
    if not baixo.startswith(INICIO_OK):
        raise SystemExit(
            "RECUSADO: so leitura (" + ", ".join(x.upper() for x in INICIO_OK) + ").\n"
            "Comeca com: " + nu.split()[0]
        )

    for padrao, porque in PERIGOS:
        if re.search(padrao, baixo):
            raise SystemExit("RECUSADO: " + porque)

    # Devolve a SQL ORIGINAL, nao a limpa -- a limpa teve as strings trocadas
    # por '' e rodaria uma consulta diferente da que foi pedida.
    return sql.strip().rstrip(";").strip()


def tabela(colunas, linhas):
    if not linhas:
        return "(0 linhas)"
    larg = [len(c) for c in colunas]
    corpo = []
    for ln in linhas:
        cels = ["" if v is None else str(v) for v in ln]
        corpo.append(cels)
        for i, c in enumerate(cels):
            larg[i] = max(larg[i], len(c))
    larg = [min(w, 48) for w in larg]

    def fmt(cels):
        return " | ".join(
            (c[:45] + "..." if len(c) > larg[i] else c).ljust(larg[i])
            for i, c in enumerate(cels)
        )

    out = [fmt(colunas), "-+-".join("-" * w for w in larg)]
    out.extend(fmt(c) for c in corpo)
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("sql", nargs="?")
    ap.add_argument("--arquivo", help="le a SQL de um arquivo")
    ap.add_argument("--limite", type=int, default=200)
    ap.add_argument("--json", dest="saida_json")
    ap.add_argument("--testar", action="store_true",
                    help="so conecta e descreve o servidor")
    ap.add_argument("--base", default="dealers",
                    help="dealers (padrao) ou cars2you")
    a = ap.parse_args()

    if a.testar:
        env = ler_env(a.base)
        print("Base: " + a.base)
        print("Arquivo de credenciais: " + str(caminho_env(a.base)))
        print("Host: " + env["HOST"] + ":" + env["PORT"])
        print("Usuario: " + env["USER"] + "  |  Schema: " + env["DB"])
        cx = conectar(a.base, env)
        cur = cx.cursor()
        cur.execute("SELECT VERSION(), DATABASE(), CURRENT_USER()")
        v, d, u = cur.fetchone()
        print("\nConectado.")
        print("  versao   : " + str(v))
        print("  schema   : " + str(d))
        print("  usuario  : " + str(u))
        cur.execute("SHOW TABLES")
        tabs = [r[0] for r in cur.fetchall()]
        print("  tabelas  : " + str(len(tabs)))
        if tabs:
            print("\nPrimeiras 20: " + ", ".join(tabs[:20]))
        cur.close()
        cx.close()
        return

    sql = Path(a.arquivo).read_text(encoding="utf-8") if a.arquivo else a.sql
    if not sql:
        raise SystemExit("Passe a SQL como argumento ou use --arquivo.")

    sql = validar(sql)
    cx = conectar(a.base)
    cur = cx.cursor()
    cur.execute(sql)
    colunas = [c[0] for c in cur.description] if cur.description else []
    linhas = cur.fetchmany(a.limite)
    sobrou = cur.fetchone() is not None  # tem mais alem do limite?
    cur.close()
    cx.close()

    if a.saida_json:
        registros = [
            dict(zip(colunas, [None if v is None else str(v) for v in ln]))
            for ln in linhas
        ]
        Path(a.saida_json).write_text(
            json.dumps(registros, ensure_ascii=False, indent=2), encoding="utf-8")
        print("Gravado: " + a.saida_json + "  (" + str(len(registros)) + " linhas)")
    else:
        print(tabela(colunas, linhas))

    print("\n" + str(len(linhas)) + " linha(s)"
          + ("  -- LIMITE ATINGIDO, ha mais no servidor" if sobrou else ""))


if __name__ == "__main__":
    main()
