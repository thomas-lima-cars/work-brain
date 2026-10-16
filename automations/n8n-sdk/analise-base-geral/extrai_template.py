"""Tira o template do HTML 'Versão A' (Downloads): troca o dado e os textos que
mudam a cada geração por marcadores. O resto do arquivo fica byte a byte.
Uso: python extrai_template.py "<Versão A.html>" "<saida template.html>" "<saida constantes.json>"
"""
import json, sys
src, out_tpl, out_const = sys.argv[1:4]
s = open(src, encoding='utf-8').read()

i = s.find('var D = ') + len('var D = ')
D, fim = json.JSONDecoder().raw_decode(s[i:])
s = s[:i] + '/*__DADOS__*/' + s[i + fim:]

def troca(velho, novo, vezes):
    global s
    assert s.count(velho) == vezes, (velho, s.count(velho))
    s = s.replace(velho, novo)

troca('Gerado em 04/09/2026', 'Dados até {{DATA}}', 1)
troca('6 canais &middot; 21.772 clientes', '{{N_CANAIS}} canais &middot; {{TOTAL}} clientes', 1)
troca('21.772 clientes', '{{TOTAL}} clientes', 1)
troca('dados do sistema em 04/09/2026', 'dados do sistema até {{DATA}}', 1)
a = s.index('<select id="fwl">')
b = s.index('</select>', a) + len('</select>')
s = s[:a] + '<select id="fwl">{{OPCOES}}</select>' + s[b:]

open(out_tpl, 'w', encoding='utf-8', newline='').write(s)
json.dump({'SITU': D['SITU'], 'TIPS': D['TIPS'], 'nomes': D['nomes']},
          open(out_const, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('template', len(s), 'bytes; marcadores ok')
