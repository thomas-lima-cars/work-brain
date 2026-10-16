"""Indicadores do LAUDO CAUTELAR, lidos do texto do PDF.

    python laudo_sinais.py <arquivo.txt>      mostra o que casou, com o trecho

Usado por `monta-painel-dados.py`. O texto sai de
`laudos/coleta-textos-vendas.py` (pdftotext -layout).

── POR QUE DICIONARIO, E NAO UM PARSER POR LAYOUT ──────────────────────────
Medido em 14/10: na amostra ha pelo menos dez modelos de laudo (Auditec em
tres variantes, Alesca, Carvist, Plenaver, Plena Visao, Auto 100%, os dois da
Dealers...). Um parser por layout quebra a cada vistoriadora nova. O que todos
tem em comum e a FRASE: "longarina dianteira esquerda: avariado", "caixa de
ar direita amassada", "veiculo liga nao". O dicionario procura PECA + ESTADO
dentro da mesma clausula -- o mesmo metodo dos sinais do texto livre.

── A CLAUSULA ───────────────────────────────────────────────────────────────
O pdftotext -layout poe duas colunas do laudo na mesma linha, separadas por
2+ espacos. Partir a linha nesses espacos (e em ; , | e " - ") isola cada item
do checklist. Sem isso, "LONGARINA: OK   CAPO: AMASSADO" daria longarina
amassada. ⚠️ Por isso `norm` NAO pode colapsar espacos -- a primeira versao
colapsava, e "estofado bom  lateral traseira danificado" virou interior ruim.
Celula que e so um valor ("Nao", "Danificado Reparavel") cola na anterior:
e o rotulo dela que ficou do lado.

── O QUE NAO PODE CONTAR ────────────────────────────────────────────────────
1. Rodape juridico: "nao verificamos funcionamento de ... airbag", "eventos
   como enchentes". Linhas assim saem antes de tudo (RODAPE).
2. Negacao: "nao apresenta danos estruturais", "nao indica ocorrencia de
   roubo". Cada sinal de problema tem bloqueio proprio.
3. Rotulo de campo sem valor: "Chassi Remarcado?", "Historico de sinistro:".
4. Falso amigo: "para-LAMA" nao e alagamento; "rodas de LIGA leve: nao" nao e
   motor que nao liga. Aconteceu na primeira passada.

── O VEREDITO DO TEXTO FICOU DE FORA ────────────────────────────────────────
Tentado em 14/10 e abandonado: "aprovado" aparece por ITEM ("estrutura
assoalho aprovado"), e "resultado" mora no rodape juridico. O veredito vem do
banco (`vehicle_precautionary_reports.situation`), que e a aba 1.

Rotulo de PLENAVER em tabela (rotulo numa linha, valor na de baixo) nao e
lido: o alinhamento por coluna do pdftotext nao e exato, e a tentativa de
parear por posicao gerou "chassi remarcado ulacao".
"""

import re
import sys
import unicodedata


def norm(t):
    t = unicodedata.normalize("NFD", str(t or "").lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    # "para-brisa" e "para-choques" viram "para brisa": o hifen entre letras
    # fazia o termo escapar do dicionario (medido nos laudos da Alesca)
    t = re.sub(r"(?<=[a-z])-(?=[a-z])", " ", t)
    return t.replace("\t", "    ")


RODAPE = re.compile(
    r"responsabiliz|nao verificamos|nao e de sua responsabilidade|validas apenas"
    r"|nao realizad[ao] (o )?teste|estado em que se encontra|companhias de seguro"
    r"|independe da aceitacao|nao havendo qualquer|valide esse laudo|qr ?code"
    r"|termos e condicoes|nao gere o pdf|natureza similar|excluid[ao] do parecer"
    r"|nao sofrem influencia|criterio de avaliacao")

# celula que e so valor: cola na anterior
VALOR = re.compile(
    r"^(sim|nao|nao possui|possui|bom|boa|ruim|regular|falta|presente|ausente|ok"
    r"|ok original|original|funciona\w*|nao funciona\w*|danificad\w*( reparavel)?"
    r"|sem danos|necessari\w* a troca|preservad\w*|avariad\w*|reparad\w*|amassad\w*"
    r"|quebrad\w*|trincad\w*|riscad\w*|meia vida|novo|nova)$")

ESTR = (r"(longarina|coluna\b|caixa de ar|torre|corta ?fogo|assoalho|painel dianteiro"
        r"|painel traseiro|caixa de estepe|travessa|soleira|monobloco|avental)")
DANO = (r"(avariad|danificad|amassad|reparad|recuperad|substituid|soldad|\bsolda"
        r"|corros|trincad|torto|empenad|desalinhad|enrugad|cortad|fora do padr"
        r"|nao conforme|irregular|retrabalh|perfurad|podre|ferrugem|deformad|sinais de reparo)")
REPARO = r"(reparad\w*(?! reparavel)|recuperad|substituid|soldad|\bsolda|retrabalh|sinais de reparo)"
SEM_DANO = (r"nao apresenta|sem (avaria|dano|sinal|reparo)|ausencia de|dentro dos padroes|etiqueta"
            r"|gravac|para instalar")

LATARIA = (r"(capo|paralama|para ?lama|\bporta\b|para ?choque|parachoque|lateral|tampa"
           r"|\bteto\b|retrovisor|folha|grade|porta ?malas|portamalas|saia|spoiler)")
DANO_LAT = (r"(avariad|danificad|amassad|quebrad|riscad|ralad|repintur|trincad|furad"
            r"|arranhad|soltand|solt[oa]\b|faltand|ausente|corros|ferrug)")

S = []


def sinal(grupo, rotulo, rx, bloqueio=None, nota=None, destaque=None):
    S.append({"grupo": grupo, "rotulo": rotulo, "rx": rx, "bloqueio": bloqueio,
              "nota": nota, "_rx": re.compile(rx),
              "_bl": re.compile(bloqueio) if bloqueio else None})


# ── Estrutura ────────────────────────────────────────────────────────────
G = "Estrutura"
sinal(G, "Dano estrutural (qualquer peça)", ESTR + r".*" + DANO + "|" + DANO + r".*" + ESTR,
      SEM_DANO)
sinal(G, "Estrutura com reparo (solda, recuperada, substituída)",
      ESTR + r".*" + REPARO + "|" + REPARO + r".*" + ESTR, SEM_DANO + r"|necessit")
sinal(G, "Longarina", r"longarina.*" + DANO, SEM_DANO + r"|para instalar engate",
      nota="'perfurada para instalar engate' não conta")
sinal(G, "Coluna", r"coluna\b.*" + DANO, SEM_DANO + r"|direcao")
sinal(G, "Caixa de ar", r"caixa de ar.*" + DANO, SEM_DANO)
sinal(G, "Torre do amortecedor", r"torre.*" + DANO, SEM_DANO)
sinal(G, "Assoalho / painel / corta-fogo",
      r"(assoalho|corta ?fogo|painel (dianteiro|traseiro)|caixa de estepe).*" + DANO,
      SEM_DANO + r"|instrumento")
sinal(G, "Corrosão / ferrugem", r"corros|ferrug|podre",
      r"\bsem\b|nao apresenta|ausencia|anticorros|\bnao\b|gravac|numerac",
      nota="corrosão na base da gravação do chassi fica fora: é identificação, não estrutura")

# ── Identificação e histórico ────────────────────────────────────────────
G = "Identificação e histórico"
sinal(G, "Chassi ou motor remarcado / divergente",
      r"(chassi|motor|numeracao|remarcac)[^?]*(remarcad\w* \w|adulterad|divergen|fora dos padroes"
      r"|ilegivel|suprimid|nao confere|corroid|regravad|lixad)",
      r"\?|remarcacao: normal|dentro dos padroes|\bnao\b|\bsem\b|nenhum|normal|aprovado|etiqueta|compartimento")
sinal(G, "Gravação de vidro não original",
      r"(gravac|vidro).*(nao original|divergen|ausente|regravad|sem gravac|removid|nao confere)",
      r"todas as gravacoes sao originais|\?")
sinal(G, "Histórico de leilão",
      r"leil(ao|oes|oad)\w*:? (sim|consta|possui|positivo)|(consta|possui|indica|historico de)"
      r" (passagem por )?leil(ao|oes)\b(?!:? ?$)",
      r"\bnao\b|nada consta|sem (historico|registro)|motivo|nenhum|\?")
sinal(G, "Sinistro, monta ou roubo/furto",
      r"(indicio|vestigio|registro|historico)s? de sinistr\w* ?:? ?(sim|consta|positiv|identificad)"
      r"|sinistr\w*:? (sim|consta|positiv|identificad|ativo)|perda total|media monta|grande monta"
      r"|recuperad[oa] de (roubo|furto)|roubo/furto: (sim|ativo|consta)",
      r"\bnao\b|nada consta|\bsem\b|negativ|nenhum|pequena monta|\?")
sinal(G, "Alagamento / enchente", r"alagad|alagament|enchente|submers",
      r"\bnao\b|\bsem\b|\?|evento|possiveis|eventuais")

# ── Funcionamento ────────────────────────────────────────────────────────
G = "Funcionamento"
sinal(G, "Motor não funciona / não liga",
      r"(motor|veiculo liga|partida)\b.*(nao funciona|nao liga|inoperant|travad|fundid"
      r"|nao da partida|sem funcionamento)|veiculo liga:? nao\b|\bnao liga\b|motor:? nao\b",
      r"numer|gravac|etiqueta|compartimento|cofre|\bvis\b|liga leve|ventoinha|comp\.|base da"
      r"|nao testad|bateria",
      nota="'não testado / sem carga de bateria' não conta: não diz que o motor falha")
sinal(G, "Câmbio não funciona / não engata",
      r"cambio\b.*(nao funciona|nao engata|inoperant|travad|com defeito|nao funcionando)"
      r"|cambio engata:? nao\b|cambio:? nao funciona",
      r"numer|automatico|obstruid|gravac")
sinal(G, "Sem chave",
      r"(chave principal|veiculo com chave|tipo de chave|chave original):? (falta|ausente|nao possui"
      r"|nao)\b|\bsem chaves?\b",
      r"reserva|chave de roda")
sinal(G, "Ar-condicionado não funciona",
      r"ar ?condicionado:? (nao funciona\w*|inoperant|com defeito|nao gela)")
sinal(G, "Farol, lanterna ou vidro elétrico não funciona",
      r"(farol|farois|lanterna|vidros? eletric)[^:]{0,40}:? (nao funciona\w*|queimad|inoperant)", r"pintura")
sinal(G, "Luz de alerta no painel",
      r"(luz|luzes|lampada)\w* (de )?(injecao|alerta|anomalia|airbag|abs|motor)[^:]{0,20}(acesa|ligada)"
      r"|painel com (luz|luzes|alerta)",
      r"\bnao\b|\bsem\b|apagad")

# ── Conservação ──────────────────────────────────────────────────────────
G = "Conservação"
sinal(G, "Repintura com massa", r"repintura com massa|excesso de massa|massa plastica",
      r"\bsem massa\b|nao apresenta")
sinal(G, "Pneus para trocar",
      r"pneu[^:]{0,40}:? (necessari\w* (a )?troca|necessita (de )?troca|ruim|ruins|careca|gast\w*"
      r"|desgastad\w*|furad|murch|vazi|avariad|danificad|meia vida|substituir)",
      r"estepe")
sinal(G, "Sem estepe", r"estepe:? (falta|ausente|nao possui|nao)\b|sem estepe", r"caixa de estepe")
sinal(G, "Vidro trincado ou quebrado",
      r"(vidro|para ?brisa|parabrisa|vigia)[^:]{0,40}:? (trincad|quebrad|estilhac|rachad|avariad"
      r"|danificad|furad)", r"gravac")
sinal(G, "Farol ou lanterna quebrado",
      r"(farol|farois|lanterna)[^:]{0,40}:? (quebrad|trincad|danificad|avariad|ausente|falta|solt)")
sinal(G, "Interior ruim ou sujo",
      r"(condicoes do interior|interior|estofad\w*|bancos?|forro|tapete|revestiment\w*|painel interno)"
      r":? (ruim|rasgad|sujo|danificad|mofo|avariad|desgastad|manchad|queimad|solt|regular / sujo|pessim)")
sinal(G, "Airbag acionado ou ausente", r"airbag:? (acionad|deflagrad|ausente|falta|estourad)")


def clausulas(texto):
    """Linhas -> celulas (2+ espacos) -> clausulas (; | , ' - ')."""
    out = []
    for l in norm(texto).splitlines():
        if RODAPE.search(l):
            continue
        cels = []
        for cel in re.split(r"\s{2,}", l):
            cel = re.sub(r"\s+", " ", cel).strip(" .-*")
            if not cel:
                continue
            if cels and VALOR.match(cel.strip(" :")):
                cels[-1] = cels[-1].rstrip(" :") + ": " + cel
            else:
                cels.append(cel)
        for cel in cels:
            for c in re.split(r";|\||,(?!\d)| - |^- ", cel):
                c = c.strip(" .-*")
                if len(c) > 2:
                    out.append(c)
    return out


def lataria(cls):
    """Pecas de lataria com dano, sem repetir a mesma peca (aproximado)."""
    pecas = set()
    for c in cls:
        if re.search(LATARIA, c) and re.search(DANO_LAT, c) and not re.search(
                r"nao apresenta|sem (avaria|dano)|gravac|etiqueta|sem danos", c):
            m = re.search(LATARIA + r"[a-z ]{0,30}?(dianteir\w*|traseir\w*)?[a-z ]{0,12}?"
                          r"(direit\w*|esquerd\w*)?", c)
            pecas.add(re.sub(r"\s+", " ", m.group(0)) if m else c[:20])
    return len(pecas)


def faixa_lataria(n):
    if n is None:
        return "z ilegível"
    if n == 0:
        return "a nenhuma"
    if n <= 2:
        return "b 1 a 2 peças"
    if n <= 5:
        return "c 3 a 5 peças"
    if n <= 9:
        return "d 6 a 9 peças"
    return "e 10 ou mais"


def ler(texto):
    """-> {legivel, sinais:{rotulo: trecho}, lataria}"""
    if len(texto.strip()) < 200:
        return {"legivel": False, "sinais": {}, "lataria": None}
    cls = clausulas(texto)
    achou = {}
    for s in S:
        for c in cls:
            if s["_rx"].search(c) and not (s["_bl"] and s["_bl"].search(c)):
                achou[s["rotulo"]] = c[:160]
                break
    return {"legivel": True, "sinais": achou, "lataria": lataria(cls)}


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    r = ler(open(sys.argv[1], encoding="utf-8", errors="replace").read())
    print("lataria:", r["lataria"])
    for k, v in r["sinais"].items():
        print("  %-48s %s" % (k, v))
