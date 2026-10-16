"""Confere o workflow salvo no n8n contra os arquivos locais (nó a nó, byte a byte).
Uso: python confere_n8n.py <get_workflow_details.json>
"""
import json, os, sys

sys.stdout.reconfigure(encoding='utf-8')
AQUI = os.path.dirname(os.path.abspath(__file__))
ler = lambda n: open(os.path.join(AQUI, n), encoding='utf-8').read()

esperado = {
    'Montar Queries': ler('montar-queries.js'),
    'Montar HTML': (ler('montar-html.js')
                    .replace('__TEMPLATE_JSON__', json.dumps(ler('template.html'), ensure_ascii=False))
                    .replace('__CONST_JSON__', json.dumps(json.loads(ler('constantes.json')), ensure_ascii=False))),
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
print('conexoes:', list(w['connections'].keys()))
print('ativo:', w['active'])
sys.exit(0 if ok else 1)
