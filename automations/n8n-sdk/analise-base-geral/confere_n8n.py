"""Confere o workflow salvo no n8n contra os arquivos locais (nó a nó, byte a byte).
Uso: python confere_n8n.py <get_workflow_details.json>
"""
import json, os, sys

sys.stdout.reconfigure(encoding='utf-8')
AQUI = os.path.dirname(os.path.abspath(__file__))
ler = lambda n: open(os.path.join(AQUI, n), encoding='utf-8').read()

sys.path.insert(0, AQUI)
import gen_wf  # noqa: E402  (regera o .wf.ts de passagem; e o mesmo conteudo)
esperado = {
    'Template Topo': gen_wf.no_tpl(gen_wf.tpl_topo),
    'Template Script': gen_wf.no_tpl(gen_wf.tpl_script),
    'Montar Queries': gen_wf.montar_queries,
    'Montar HTML': gen_wf.montar_html,
}
w = json.load(open(sys.argv[1], encoding='utf-8'))['workflow']
ok = True
for n in w['nodes']:
    c = n['parameters'].get('jsCode')
    if n['name'] in esperado:
        a = esperado[n['name']]
        igual = c == a
        ok &= igual
        print(n['name'], len(c), len(a), 'IGUAL' if igual else 'DIFERENTE')
        if not igual:
            i = next((i for i in range(min(len(a), len(c))) if a[i] != c[i]), min(len(a), len(c)))
            print('  1a diferenca em', i, repr(a[max(0, i - 40):i + 40]), '|', repr(c[max(0, i - 40):i + 40]))
# E-mail: destinatarios e texto saem do gen_wf.py tambem
for n in w['nodes']:
    if n['type'].endswith('microsoftOutlook'):
        pr = n['parameters']
        d_ok = pr.get('toRecipients') == ', '.join(gen_wf.DESTINOS)
        t_ok = pr.get('bodyContent') == gen_wf.corpo
        ok &= d_ok and t_ok
        print(n['name'], 'destinos', 'IGUAL' if d_ok else 'DIFERENTE: ' + str(pr.get('toRecipients')), '| texto', 'IGUAL' if t_ok else 'DIFERENTE')
faltam = set(esperado) - {n['name'] for n in w['nodes']}
if faltam:
    ok = False
    print('nos que faltam no n8n:', sorted(faltam))
print('conexoes:', list(w['connections'].keys()))
print('ativo:', w['active'])
sys.exit(0 if ok else 1)
