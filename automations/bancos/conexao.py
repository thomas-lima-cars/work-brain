"""Conexao direta com os bancos MySQL das operacoes.

  from conexao import conectar
  cx = conectar("dealers")      # ou "cars2you"

Generaliza o modulo que nasceu so para a Dealers em 17/09. Duas bases, mesmo
codigo: duplicar o arquivo criaria duas versoes livres para divergir, e a
correcao de uma nao chegaria na outra.

── NAO E O CAMINHO DO MCP ───────────────────────────────────────────────────
A Cars2You ja tem acesso por MCP (`mcp-cars2you-readonly.cars2you.com.br`),
usado de dentro dos workflows n8n. Aquele nó aceita `{sql, database}` e nao tem
campo de host; alem disso corta em 50 linhas por chamada e rejeita funcao de
janela. Este caminho e direto: sem teto, sem paginacao, com information_schema.
Os dois convivem -- o MCP para o que roda em producao no n8n, este para
analise.

── AS CREDENCIAIS NUNCA MORAM NO REPO ───────────────────────────────────────
Cada base tem seu arquivo em ~/. O prefixo das variaveis muda por base, para
que um arquivo nao possa ser usado no lugar do outro por engano:

  dealers   ~/.dealers-dlc.env    DLC_HOST DLC_PORT DLC_USER DLC_PASS DLC_DB
  cars2you  ~/.cars2you-db.env    C2Y_HOST C2Y_PORT C2Y_USER C2Y_PASS C2Y_DB

Sobrescrever o caminho: DLC_ENV / C2Y_ENV.
"""

import os
import sys
from pathlib import Path

BASES = {
    "dealers": {
        "prefixo": "DLC",
        "arquivo": ".dealers-dlc.env",
        "modelo": "automations/bancos/.env-dealers.exemplo",
        "rotulo": "Dealers (wl_dlc_prd)",
    },
    "cars2you": {
        "prefixo": "C2Y",
        "arquivo": ".cars2you-db.env",
        "modelo": "automations/bancos/.env-cars2you.exemplo",
        "rotulo": "Cars2You (cars2you_production)",
    },
}

# Repo deste brain. Credencial aqui dentro e erro de operacao, nao de gosto:
# o historico do git nao se apaga depois.
REPO = Path(__file__).resolve().parents[2]


def _cfg(base):
    b = str(base or "").lower()
    if b not in BASES:
        raise SystemExit("base desconhecida: %r. Use: %s"
                         % (base, ", ".join(sorted(BASES))))
    return BASES[b]


def caminho_env(base):
    c = _cfg(base)
    padrao = Path.home() / c["arquivo"]
    return Path(os.environ.get(c["prefixo"] + "_ENV", padrao)).expanduser()


def mascarar(texto, segredo):
    """Tira o segredo de qualquer texto antes de ele chegar na tela."""
    if segredo and len(segredo) > 0:
        return texto.replace(segredo, "***")
    return texto


def ler_env(base, caminho=None):
    """Le o arquivo de credenciais da base. Devolve dict com chaves HOST,
    PORT, USER, PASS, DB -- sem o prefixo. Nao loga valores."""
    c = _cfg(base)
    p = caminho or caminho_env(base)

    if not p.exists():
        raise SystemExit(
            "Credenciais de %s nao encontradas: %s\n"
            "Crie a partir do modelo:\n  cp %s %s"
            % (c["rotulo"], p, c["modelo"], p)
        )

    # Guarda: credencial dentro do repo vaza pro git mais cedo ou mais tarde.
    try:
        p.resolve().relative_to(REPO)
        raise SystemExit(
            "RECUSADO: " + str(p) + " esta dentro do repo.\n"
            "Mova para fora (ex.: ~/" + c["arquivo"] + "). O .gitignore ajuda,\n"
            "mas nao e garantia -- um 'git add -f' ou um rename derruba."
        )
    except ValueError:
        pass  # fora do repo: e o que queremos

    bruto = {}
    for linha in p.read_text(encoding="utf-8").splitlines():
        linha = linha.strip()
        if not linha or linha.startswith("#") or "=" not in linha:
            continue
        chave, _, valor = linha.partition("=")
        bruto[chave.strip()] = valor.strip().strip('"').strip("'")

    dados, faltando = {}, []
    for curto in ("HOST", "PORT", "USER", "PASS", "DB"):
        nome = c["prefixo"] + "_" + curto
        v = bruto.get(nome, "")
        if not v:
            faltando.append(nome)
        elif v.startswith("<") and v.endswith(">"):
            faltando.append(nome + " (ainda com o placeholder do modelo)")
        else:
            dados[curto] = v

    if faltando:
        raise SystemExit("Faltam campos em %s: %s" % (p, ", ".join(faltando)))

    # Um arquivo com o prefixo da OUTRA base passaria vazio e o erro seria
    # "faltam campos", que nao explica nada. Este aviso explica.
    outro = [x["prefixo"] for k, x in BASES.items() if k != str(base).lower()]
    if faltando and any(k.startswith(o) for k in bruto for o in outro):
        raise SystemExit("O arquivo %s tem variaveis de outra base." % p)

    return dados


def conectar(base, env=None, somente_leitura=True):
    """Abre a conexao. somente_leitura poe a SESSAO em read only.

    Cinto e suspensorio: o certo e a credencial ja ser de um usuario readonly.
    Mas a sessao read only barra escrita acidental mesmo se a credencial tiver
    permissao demais.
    """
    try:
        import mysql.connector
    except ImportError:
        raise SystemExit(
            "mysql-connector nao instalado. Rode:\n"
            "  python -m pip install mysql-connector-python"
        )

    env = env or ler_env(base)
    senha = env["PASS"]

    try:
        cx = mysql.connector.connect(
            host=env["HOST"], port=int(env["PORT"]), user=env["USER"],
            password=senha, database=env["DB"],
            # 30s, nao 20: a PRIMEIRA conexao do dia estourou 20s em 17/09 e a
            # seguinte fechou em 2,0s. Socket cru conecta em 0,3s -- e o
            # handshake do connector que demora na conexao fria, nao a rede.
            connection_timeout=30,
            charset="utf8mb4", use_pure=True,
        )
    except Exception as e:
        # A lib as vezes ecoa a senha na mensagem. Nao deixa passar.
        raise SystemExit("Falha ao conectar em %s: %s"
                         % (_cfg(base)["rotulo"], mascarar(str(e), senha)))

    if somente_leitura:
        try:
            cur = cx.cursor()
            cur.execute("SET SESSION TRANSACTION READ ONLY")
            cur.close()
        except Exception:
            # Usuario readonly de verdade as vezes nao pode nem isso. Segue --
            # a guarda de SQL em consulta.py ainda vale.
            pass

    return cx
