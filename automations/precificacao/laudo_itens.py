"""Estado de cada ITEM no laudo cautelar: presente, ausente ou danificado.

    python laudo_itens.py <arquivo.txt>     mostra o estado de cada item, com o trecho

Usado por `monta-painel-dados.py` (aba "Laudo item a item" do painel).
Reaproveita a divisao em clausulas de `laudo_sinais.py` -- a mesma que ja
separa as duas colunas do checklist e cola "Nao" no rotulo ao lado.

── COMO O ESTADO E LIDO ─────────────────────────────────────────────────────
A clausula precisa citar o item; o estado sai das palavras DELA:
    danificado  danificado, avariado, quebrado, ruim, nao funciona, troca, sem carga...
    ausente     falta, ausente, nao possui, "sem estepe"
    presente    presente, possui, sim, ok, bom, sem danos, funcionando, meia vida
"Meia vida" e presente: pneu usavel. Na primeira passada contava como
danificado e punha 222 estepes no grupo errado.
Ordem de precedencia: danificado > ausente > presente. "Sem danos" e testado
ANTES de "sem": senao "porta: sem danos" viraria porta ausente.

Se o mesmo item aparece varias vezes no laudo, fica o PIOR estado (danificado
> ausente > presente): um laudo que diz "estepe presente" no checklist e
"estepe furado" na observacao tem estepe danificado.

"Nao informado", "nao verificado", "inacessivel", "nao aplicavel" nao sao
estado: a clausula e ignorada.

Itens de FUNCIONAMENTO (motor, cambio, ar-condicionado, vidros eletricos):
"nao" sozinho e "nao funciona", entao conta como danificado -- "veiculo liga:
nao" e motor que nao liga, nao motor ausente. "Nao possui" continua ausente
(ar-condicionado: nao possui).
"""

import re
import sys

from laudo_sinais import clausulas

NEUTRO = re.compile(r"nao informad|nao verificad|inacessivel|nao aplicavel|nao se aplica"
                    r"|nao testad|nao realizad|nao foram testad|\?$")
SEM_DANO = re.compile(r"sem danos?|sem avarias?|nao apresenta (danos?|avarias?)")
DANIFICADO = re.compile(
    r"danificad|avariad|quebrad|amassad|trincad|riscad|ralad|rasgad|\bruins?\b|pessim"
    r"|nao funciona|inoperant|queimad|furad|soltand|\bsolt[oa]s?\b|torto|reparavel|reparad"
    r"|necessari\w* (a )?troca|necessita (de )?troca|desgastad|careca|vencid|oxidad"
    r"|corroid|mal estado|defeito|vazament|travad|nao engata|nao liga|sem carga")
AUSENTE = re.compile(r"\bfalta\b|faltando|ausente|nao possui|nao tem\b|\bsem\b|inexistent"
                     r"|nao localizad|nao consta")
PRESENTE = re.compile(r"presente|\bpossui\b|\bsim\b|\bok\b|\bbom\b|\bboa\b|otimo|original"
                      r"|funciona|preservad|\bnormal\b|\bnov[oa]\b|integr[oa]|em bom estado"
                      r"|\bliga\b|\bengata\b|meia vida")

# (item, regex do item, bloqueio, opcoes)
#   f = item de FUNCIONAMENTO: "nao" sozinho e danificado
#   g = item com GRAVACAO de chassi: "original"/"ausente" falam da gravacao no
#       vidro, nao da peca, e nao valem como estado (secao "Gravacao dos
#       vidros" da Alesca: "PARA-BRISA: ORIGINAL", "PORTA DIANTEIRA: ORIGINAL").
#       Na primeira passada, 645 portas e 715 para-brisas "presentes" eram isso.
ITENS = [
    ("Estepe", r"estepe", r"caixa de estepe|chave de roda|macaco|triangulo", ""),
    ("Chave principal", r"chave principal|veiculo com chave|tipo de chave|chave original|\bchaves?\b",
     r"reserva|de roda|chaveiro|\bmanuais\b", ""),
    ("Chave reserva", r"chave reserva", None, ""),
    ("Manual", r"\bmanua(l|is)\b", r"cambio|transmiss|mecanic|chave", ""),
    ("Triângulo", r"triangulo", r"estepe|macaco", ""),
    ("Macaco", r"\bmacaco\b", r"estepe|triangulo", ""),
    ("Chave de roda", r"chave de roda", r"estepe|macaco", ""),
    ("Documento (CRLV)", r"\bcrlv\b|documento do veiculo", None, ""),
    ("Rádio / multimídia", r"\bradio\b|multimidia", None, ""),
    ("Bateria", r"bateria", None, ""),
    ("Pneus", r"\bpneus?\b", r"estepe", ""),
    ("Rodas", r"\brodas?\b", r"chave de roda|caixa de roda|liga leve|estepe", ""),
    ("Faróis", r"\bfarol\b|\bfarois\b", r"milha|neblina", ""),
    ("Lanternas", r"lanterna", None, ""),
    ("Retrovisores", r"retrovisor", None, ""),
    ("Para-brisa", r"para ?brisa|parabrisa", r"gravac|limpador|\bvin\b|etiqueta", "g"),
    ("Vidros", r"\bvidros?\b",
     r"gravac|eletric|\bvin\b|para ?brisa|etiqueta|blindad|delaminad|limpador|desembac", "g"),
    ("Bancos / estofado", r"\bbancos?\b|estofad",
     r"tipo de estofado|couro|banco (itau|bradesco|c6|volkswagen|do brasil|santander|safra)|bancari", ""),
    ("Tapetes", r"tapete", None, ""),
    ("Para-choques", r"para ?choque|parachoque", None, ""),
    ("Capô", r"\bcapo\b", None, ""),
    ("Portas", r"\bportas?\b",
     r"porta ?malas|portamalas|numero de portas|gravac|vidro|quadro|\bvin\b|etiqueta|batente", "g"),
    ("Motor (funcionamento)", r"\bmotor\b|veiculo liga|\bpartida\b",
     r"numer|gravac|etiqueta|compartimento|comp\.|cofre|base da|\bbin\b|\bvis\b|n[oº] do motor"
     r"|motoriza|bloco", "fg"),
    # "fg": "comp. do motor: original" e a etiqueta do compartimento, e
    # "original" nao diz se o motor funciona -- 171 laudos na segunda passada
    ("Câmbio (funcionamento)", r"\bcambio\b",
     r"automatic|manual|numer|n[oº] do cambio|gravac|tipo de|\bbin\b|obstruid", "fg"),
    ("Ar-condicionado", r"ar ?condicionado", None, "f"),
    ("Vidros elétricos", r"vidros? eletric", None, "f"),
]
_ITENS = [(n, re.compile(r), re.compile(b) if b else None, o) for n, r, b, o in ITENS]
ORDEM = {"presente": 0, "ausente": 1, "danificado": 2}
ESTADOS = ("presente", "ausente", "danificado")


def estado(clausula, opcoes):
    funcionamento = "f" in opcoes
    if NEUTRO.search(clausula):
        return None
    if "g" in opcoes and re.search(r":\s*(nao )?(original|ausente)\b", clausula):
        return None
    if DANIFICADO.search(clausula):
        return "danificado"
    if SEM_DANO.search(clausula):
        return "presente"
    if AUSENTE.search(clausula):
        if funcionamento and not re.search(r"nao possui|\bfalta\b|ausente|nao tem\b", clausula):
            return "danificado"
        return "ausente"
    if funcionamento and re.search(r"\bnao\b", clausula):
        return "danificado"
    if PRESENTE.search(clausula):
        return "presente"
    return None


def ler(texto):
    """-> {item: (estado, trecho)} -- so os itens que o laudo cita com estado"""
    if len(texto.strip()) < 200:
        return None
    out = {}
    partes = []
    for c in clausulas(texto):
        # alem do que laudo_sinais ja parte: barra com espaco e fim de frase.
        # Sem isso, "avariado/ veiculo sem chaves / porta travada" dava chave
        # travada, e "caixa de ar amassada. crlv nao apresentado", crlv amassado.
        partes += [x.strip() for x in re.split(r"\s/|/\s|\.\s", c) if len(x.strip()) > 2]
    for c in partes:
        for nome, rx, bl, func in _ITENS:
            if not rx.search(c) or (bl and bl.search(c)):
                continue
            e = estado(c, func)
            if e and (nome not in out or ORDEM[e] > ORDEM[out[nome][0]]):
                out[nome] = (e, c[:160])
    return out


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    r = ler(open(sys.argv[1], encoding="utf-8", errors="replace").read())
    for k, (e, t) in sorted((r or {}).items()):
        print("  %-24s %-11s %s" % (k, e, t))
