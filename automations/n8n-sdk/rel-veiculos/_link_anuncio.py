# -*- coding: utf-8 -*-
r"""Cada veiculo ganha link pro anuncio na plataforma.

O padrao NAO e /anuncio/<uuid>. Esta decidido desde a reuniao de 25/08 e
conferido caractere por caractere contra os quatro exemplos do Guilherme
(automations/n8n-flows/lista-lm-propostas.md):

    cars2you.com.br/anuncio/veiculo/{marca}/{modelo}/{versao}/{uuid}

tudo minusculo, encodeURIComponent em cada trecho (espaco vira %20, NAO
hifen) e o uuid sem hifens.

REGRA DURA, herdada da lista LM: faltando um dos quatro pedacos, o link NAO
e entregue. Melhor sem botao que botao que cai em lugar nenhum -- e la isso
foi um erro que passou na primeira implementacao, com o filtro em "tem link"
em vez de "esta no ar". Medido aqui (sonda 50068, q_link_partes):
link_completo = 1.879 de 1.879, zero sem marca, modelo, versao ou uuid.
Ou seja: hoje ninguem cai no ramo do null. Ele existe pra quando cair.

Uma ressalva que fica registrada em vez de escondida: o link leva ao anuncio,
e ter anuncio nao e o mesmo que poder receber proposta. O relatorio inclui de
proposito veiculo de evento encerrado e status como 'Sem Ofertas' (a coluna
"sobra"), entao parte dos links vai abrir anuncio que nao aceita mais lance.
Aqui isso e o certo -- o relatorio e de aderencia, nao lista de compra -- mas
o status ja aparece do lado do link pro lojista nao se enganar.

O <a> leva stopPropagation porque a linha inteira e clicavel pra selecionar o
veiculo: sem isso, clicar no link tambem mexeria na selecao por baixo.

ESTE ARQUIVO E ESCRITO COM A FERRAMENTA DE ARQUIVO, NAO COM HEREDOC. Medido
em 2026-09-10: o heredoc do bash come uma barra invertida MESMO entre quotes
('FIM'), e os padroes daqui dependem de `\\u00b7` com duas barras exatas.

    python _link_anuncio.py
"""
import io
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(AQUI, "montar-html.js")
s = io.open(P, encoding="utf-8").read()
orig = s

# guarda contra o proprio bug que motivou esta nota: se as barras nao
# sobreviverem ate aqui, o patch para em vez de "nao encontrar" em silencio
_sonda = r""" \\u00b7 """
if _sonda.count("\\") != 2:
    raise SystemExit("as barras invertidas nao sobreviveram: " + repr(_sonda))


def troca(velho, novo, rotulo):
    global s
    if velho not in s:
        raise SystemExit("NAO ENCONTRADO: " + rotulo)
    s = s.replace(velho, novo, 1)
    print("  ok  " + rotulo)


# 1) o veiculo carrega versao e link
troca(
r"""  const wls = Object.keys(eventoWl[String(evid)] || {}).map(Number);
  veiculos.push({""",
r"""  const wls = Object.keys(eventoWl[String(evid)] || {}).map(Number);
  veiculos.push({
    versao: r.versao || null,
    link: linkAnuncio(r.marca, r.modelo, r.versao, r.anuncio_uuid),""",
"veiculo carrega versao e link")

# 2) a funcao, inserida antes do bloco que empilha os veiculos
alvo = "  const wls = Object.keys(eventoWl[String(evid)] || {}).map(Number);"
i = s.index(alvo)
ini_bloco = s.rindex("\n", 0, s.rindex("\n", 0, i))
FUNC = r"""

/* cars2you.com.br/anuncio/veiculo/{marca}/{modelo}/{versao}/{uuid}
   Padrao da reuniao de 25/08, conferido contra os exemplos do Gui. Tudo
   minusculo, encodeURIComponent por trecho (espaco vira %20, nao hifen),
   uuid sem hifens.

   Faltando UM pedaco, devolve null e o relatorio nao mostra botao. Melhor
   sem botao que botao que cai em lugar nenhum. */
function linkAnuncio(marca, modelo, versao, uuid) {
  const t = (x) => String(x == null ? '' : x).trim();
  const partes = [t(marca), t(modelo), t(versao)];
  const id = t(uuid).split('-').join('');
  if (!id || partes.some((p) => !p)) return null;
  return 'https://cars2you.com.br/anuncio/veiculo/' +
    partes.map((p) => encodeURIComponent(p.toLowerCase())).join('/') +
    '/' + id;
}
"""
s = s[:ini_bloco] + FUNC + s[ini_bloco:]
print("  ok  funcao linkAnuncio inserida")

# 3) estilo do link
troca(
r"""  'tr.ctxr .uf{color:var(--tx);font-weight:600;letter-spacing:.3px}',""",
r"""  'tr.ctxr .uf{color:var(--tx);font-weight:600;letter-spacing:.3px}',
  'a.lk{color:var(--ac);text-decoration:none;border-bottom:1px dotted var(--ac)}',
  'a.lk:hover{border-bottom-style:solid}',""",
"estilo a.lk")

# 4) o link na linha de contexto (nivel 1), ao lado de UF e evento
troca(
r"""  '(r.v.sobra?" <span class=\'tag w\'>"+esc(r.v.status_nome)+"</span>":"")+"</td></tr>"+',""",
r"""  '(r.v.sobra?" <span class=\'tag w\'>"+esc(r.v.status_nome)+"</span>":"")+',
  /* stopPropagation: a linha toda seleciona o veiculo, e clicar no link nao
     deve mexer na selecao por baixo */
  '(r.v.link?" \\u00b7 <a class=\'lk\' href=\'"+esc(r.v.link)+"\' target=\'_blank\' rel=\'noopener\' onclick=\'event.stopPropagation()\'>anuncio \\u2197</a>":"")+"</td></tr>"+',""",
"link na linha de contexto")

# 5) e no cabecalho do detalhe do veiculo
troca(
r"""esc(v.uf)+" \\u00b7 "+esc(v.evento)+"<br>""",
r"""esc(v.uf)+" \\u00b7 "+esc(v.evento)+(v.link?" \\u00b7 <a class=\'lk\' href=\'"+esc(v.link)+"\' target=\'_blank\' rel=\'noopener\'>abrir anuncio \\u2197</a>":"")+"<br>""",
"link no detalhe do veiculo")

io.open(P, "w", encoding="utf-8").write(s)
print("mudou: " + str(s != orig))
