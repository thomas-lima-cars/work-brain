# -*- coding: utf-8 -*-
"""Monta o no "Montar HTML" do lote 2 a partir das partes em gerador/.

Por que em partes: o gerador de producao tem 87 KB num arquivo so e por isso
nao passa pela API do MCP nem cabe numa revisao. Aqui cada peca e um arquivo
com um proposito, e este script concatena com prova.

  gerador/10-dados.js    ingestao do MCP -> objeto DADOS        (roda no n8n)
  gerador/20-css.css     CSS verbatim do relatorio de producao  (vai pro HTML)
  gerador/30-shell.html  esqueleto com marcadores               (vai pro HTML)
  gerador/40-app.js      o renderizador reativo                 (roda no browser)

Saida: montar-html-lote2.js — o jsCode do no.
"""
import io, os, json, sys, hashlib
sys.stdout.reconfigure(encoding="utf-8")

HERE = os.path.dirname(os.path.abspath(__file__))
G = os.path.join(HERE, "gerador")

def le(nome):
    p = os.path.join(G, nome)
    s = io.open(p, encoding="utf-8").read()
    print("  %-18s %7d chars  md5 %s" % (nome, len(s), hashlib.md5(s.encode()).hexdigest()[:12]))
    return s

print("partes:")
dados = le("10-dados.js")
css = le("20-css.css")
shell = le("30-shell.html")
app = le("40-app.js")

# ── provas das partes, antes de juntar ─────────────────────────────────────
print("\nprovas das partes:")

for marcador in ["/*__CSS__*/", "/*__DADOS__*/", "/*__APP__*/"]:
    assert shell.count(marcador) == 1, "marcador %s nao aparece exatamente 1x no shell" % marcador
print("  ok  os 3 marcadores do shell estao presentes, 1x cada")

# todo id que o app procura tem de existir no shell — senao a secao morre calada
import re
ids_app = set(re.findall(r"el\('([a-zA-Z_0-9]+)'\)", app))
ids_shell = set(re.findall(r'id="([a-zA-Z_0-9]+)"', shell))
faltando = sorted(ids_app - ids_shell)
assert not faltando, "o app procura ids que o shell nao tem: %s" % faltando
print("  ok  os %d ids que o app busca existem no shell" % len(ids_app))

# os graficos: todo canvas do shell tem de ser desenhado, e vice-versa.
# Pega QUALQUER literal 'ch_*' no app — tres deles (ch_nr_*) sao desenhados
# dentro de um laco, entao o nome nao aparece colado na chamada de barra().
ids_chart = set(re.findall(r"'(ch_[a-z_0-9]+)'", app))
canvas = set(re.findall(r'<canvas id="([a-z_0-9]+)"', shell))
assert ids_chart <= canvas, "graficos sem canvas: %s" % sorted(ids_chart - canvas)
orfaos = sorted(canvas - ids_chart)
assert not orfaos, "canvas que ninguem desenha: %s" % orfaos
print("  ok  %d graficos, cada um com seu canvas e nenhum canvas orfao" % len(ids_chart))

# o app nao pode ler nada de DADOS que a ingestao nao produza
chaves_app = set(re.findall(r'\bD\.([a-zA-Z_][a-zA-Z_0-9]*)', app))
chaves_dados = set(re.findall(r'^\s*([a-zA-Z_][a-zA-Z_0-9]*)\s*:', dados, re.M))
chaves_dados |= set(re.findall(r'DADOS\.([a-zA-Z_][a-zA-Z_0-9]*)\s*=', dados))
faltam = sorted(chaves_app - chaves_dados)
assert not faltam, "o app le DADOS.%s, que a ingestao nao monta" % faltam
print("  ok  as %d chaves de DADOS que o app le sao produzidas pela ingestao" % len(chaves_app))

# ── montagem ───────────────────────────────────────────────────────────────
MONTAGEM = '''

/* ══════════════════════════════════════════════════════════════════════
   GERADOR LOTE 2 — PARTE 4/4: MONTAGEM DO HTML

   O esqueleto e o aplicativo viajam como literal e sao colados nos
   marcadores. Nada de valor e assado no HTML: o unico dado que entra e o
   JSON de DADOS, e quem desenha e o aplicativo. E isso que faz o filtro
   alcancar a pagina inteira em vez de 18 valores.

   O CSS (12 KB) NAO esta aqui — mora no no "Montar CSS", anterior a este.
   Motivo: o `update_workflow` do MCP so aceita o jsCode inline, e um no
   grande demais simplesmente nao passa (foi o que aposentou o gerador de
   87 KB de producao). Separar o CSS, que e estatico e nunca muda junto com
   a logica, devolve 12 KB de folga pro no que de fato evolui.
   ══════════════════════════════════════════════════════════════════════ */

const CSS = $('Montar CSS').first().json.css;
const APP = $('Montar App').first().json.app;
if (!CSS || CSS.length < 1000) throw new Error('Montar CSS devolveu vazio ou truncado');
if (!APP || APP.length < 5000) throw new Error('Montar App devolveu vazio ou truncado');
const SHELL = __SHELL_LIT__;

/* JSON.stringify pode gerar "</script>" dentro de uma string de dado (nome de
   loja com HTML, por exemplo) e fechar a tag antes da hora. O escape de "<"
   resolve sem mexer no valor: \\u003c volta a "<" no JSON.parse do navegador. */
const dadosJson = JSON.stringify(DADOS).split('<').join('\\\\u003c');

let html = SHELL
  .replace('/*__CSS__*/', CSS)
  .replace('/*__DADOS__*/', dadosJson)
  .replace('/*__APP__*/', APP);

/* data de geracao no cabecalho, sem depender do fuso do container */
const _d = new Date();
const _p = function (x) { return String(x).padStart(2, '0'); };
html = html.replace('<span id="geradoEm"></span>',
  '<span id="geradoEm">' + _p(_d.getDate()) + '/' + _p(_d.getMonth() + 1) + '/' + _d.getFullYear() + '</span>');

/* provas de que o HTML saiu inteiro. Falham aqui, no n8n, e nao na caixa de
   entrada de seis pessoas. */
if (html.indexOf('/*__') >= 0) throw new Error('marcador nao substituido no HTML final');
if (html.indexOf('__DADOS__') < 0) throw new Error('DADOS nao foi embarcado');
if (DADOS.coorte.length === 0) throw new Error('coorte vazia — o relatorio nao teria base');

return [{ json: {
  html: html,
  _meta: {
    bytes: html.length,
    whitelabels: DADOS.meta.wls.length,
    safras: DADOS.coorte.length,
    avisos: DADOS.avisos
  }
} }];
'''

montagem = MONTAGEM.replace("__SHELL_LIT__", json.dumps(shell, ensure_ascii=False))

out_js = dados + montagem

# ── provas do resultado ────────────────────────────────────────────────────
print("\nprovas do no montado:")
for lit in ["__SHELL_LIT__", "__APP_LIT__"]:
    assert lit not in out_js, "placeholder %s sobrou" % lit
print("  ok  nenhum placeholder sobrou")
assert out_js.count("$('Montar Queries')") >= 1 and out_js.count("$('MCP Run')") >= 1, \
    "o no perdeu o contrato de entrada da arquitetura B"
print("  ok  contrato de entrada preservado ($('Montar Queries') e $('MCP Run'))")

# ── no separado do CSS ─────────────────────────────────────────────────────
CABECALHO_CSS = '''/* NO "Montar CSS" — so devolve o CSS do relatorio.

   Existe por um motivo de transmissao, nao de arquitetura: o jsCode viaja
   INLINE pela API do MCP, e no grande demais simplesmente nao passa — foi o
   que aposentou o gerador de 87 KB de producao. O CSS e estatico e nunca muda
   junto com a logica, entao tira-lo daqui devolve 12 KB de folga pro no que
   de fato evolui.

   Conteudo verbatim do relatorio de producao. */
'''
NO_CSS = CABECALHO_CSS + "return [{ json: { css: " + json.dumps(css, ensure_ascii=False) + " } }];\n"
CABECALHO_APP = '''/* NO "Montar App" — so devolve o aplicativo que roda no navegador.

   Mesmo motivo do "Montar CSS": o jsCode viaja INLINE pela API do MCP e no
   grande demais nao passa. Separando CSS e app, o no que de fato evolui
   (ingestao + montagem) fica em ~25 KB em vez de 84 KB.

   ATENCAO: o que esta aqui NAO roda no n8n. E o texto do <script> que vai
   dentro do HTML e executa no navegador de quem abre o relatorio. */
'''
# O app entra como FUNCAO, nao como string JSON.
#
# Por que: guardado como string, o codigo ja vem escapado uma vez (\n, \") e
# transmiti-lo pela API do MCP exigiria escapar por cima — escape duplo em
# 45 KB e onde se erra sem perceber, e o erro so aparece no navegador de quem
# abre o relatorio. Como funcao, o codigo fica como codigo: legivel no editor
# do n8n, e `toString()` devolve o fonte na hora de montar o HTML.
#
# O app ja e uma IIFE `(function () {...})();` — a casca externa sai aqui e
# volta na concatenacao, pra toString() nao devolver a chamada junto.
# O arquivo comeca com um bloco de comentario e SO DEPOIS abre a IIFE.
# O comentario fica de fora da funcao — nao precisa viajar dentro do HTML.
ABRE = "(function () {"
# A PRIMEIRA ocorrencia e a IIFE de topo; ha outras no meio do codigo.
assert ABRE in app, "nao achei a IIFE de topo no app"
i = app.index(ABRE)
comentario_app = app[:i].rstrip()
corpo = app[i:].strip()
assert corpo.endswith("})();"), "o app nao termina como IIFE"
miolo = corpo[len(ABRE):-len("})();")]

NO_APP = (CABECALHO_APP + comentario_app + "\n" +
    "const APP_FN = function () {" + miolo + "};\n\n" +
    "/* toString() devolve o fonte da funcao; a casca da IIFE volta aqui. */\n" +
    "const app = '(' + APP_FN.toString() + ')();';\n" +
    "if (app.length < 20000) throw new Error('app truncado: ' + app.length + ' chars');\n" +
    "return [{ json: { app: app } }];\n")
out_app = os.path.join(HERE, "montar-app.js")
io.open(out_app, "w", encoding="utf-8", newline="").write(NO_APP)
print("\ngravado: %s" % os.path.basename(out_app))
print("%d chars (%.1f KB)" % (len(NO_APP), len(NO_APP) / 1024))

out_css = os.path.join(HERE, "montar-css.js")
io.open(out_css, "w", encoding="utf-8", newline="").write(NO_CSS)
print("\ngravado: %s" % os.path.basename(out_css))
print("%d chars (%.1f KB)" % (len(NO_CSS), len(NO_CSS) / 1024))

out = os.path.join(HERE, "montar-html-lote2.js")
io.open(out, "w", encoding="utf-8", newline="").write(out_js)
md5 = hashlib.md5(out_js.encode()).hexdigest()
print("\ngravado: %s" % os.path.basename(out))
print("%d chars (%.1f KB) — md5 %s" % (len(out_js), len(out_js) / 1024, md5))
print("\ncomparacao: o Montar HTML de producao tem 87.296 chars e NAO passa pela API.")
print("            este tem %d — %.0f%% do tamanho." % (len(out_js), 100.0 * len(out_js) / 87296))
