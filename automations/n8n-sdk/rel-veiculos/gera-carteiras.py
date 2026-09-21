# -*- coding: utf-8 -*-
"""
Le a planilha de carteiras e escreve `carteiras.json`.

    python automations/n8n-sdk/rel-veiculos/gera-carteiras.py <planilha.xlsx>

Entra:  a planilha que a area comercial mantem, com uma aba por consultor
        mais a aba "Todos os Clientes".
Sai:    carteiras.json — SO o que o cruzamento precisa: CNPJ, razao social
        e o consultor. Telefone, score, ticket medio e o historico de
        contato ficam de fora de proposito: eles nao entram no relatorio,
        e o que nao entra nao precisa ser copiado pro repo.

── POR QUE A ABA "Todos os Clientes" E A FONTE ────────────────────────────
As abas por consultor tem 37-39 colunas e um dicionario de contato que so
interessa a quem trabalha a carteira. A aba consolidada tem a coluna
`Consultor Responsavel`, e foi conferida: a soma das abas individuais bate
exatamente com ela (1.436 linhas em 2026-09). Se um dia parar de bater,
este script FALHA — divergencia silenciosa entre as duas visoes seria pior
que nao gerar nada.

── O NOME NAO E NORMALIZADO AQUI ──────────────────────────────────────────
A razao social sai crua. Quem normaliza e o `_aplica-carteiras.js`, usando
a MESMA funcao que viaja pro n8n dentro do `montar-html.js`. Normalizar
aqui criaria uma segunda implementacao em outra linguagem, e duas
implementacoes escritas juntas erram juntas.
"""
import collections
import datetime
import json
import os
import re
import sys

try:
    import openpyxl
except ImportError:
    sys.exit('falta openpyxl: python -m pip install openpyxl')

AQUI = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.join(AQUI, 'carteiras.json')

ABA_TODOS = 'Todos os Clientes'
COL_CNPJ = 'CNPJ'
COL_RAZAO = 'Razao Social'
COL_CONSULTOR = 'Consultor Responsavel'


def so_digitos(v):
    return re.sub(r'\D', '', str(v or ''))


def le_aba(ws):
    linhas = list(ws.iter_rows(values_only=True))
    if not linhas:
        return [], []
    return linhas[0], linhas[1:]


def main():
    if len(sys.argv) < 2:
        sys.exit('uso: gera-carteiras.py <planilha.xlsx>')
    caminho = sys.argv[1]
    wb = openpyxl.load_workbook(caminho, read_only=True, data_only=True)

    if ABA_TODOS not in wb.sheetnames:
        sys.exit('a planilha nao tem a aba "%s" — sem ela nao ha coluna de '
                 'consultor responsavel' % ABA_TODOS)

    cab, linhas = le_aba(wb[ABA_TODOS])
    for c in (COL_CNPJ, COL_RAZAO, COL_CONSULTOR):
        if c not in cab:
            sys.exit('a aba "%s" nao tem a coluna "%s"' % (ABA_TODOS, c))
    i_cnpj, i_razao, i_cons = cab.index(COL_CNPJ), cab.index(COL_RAZAO), cab.index(COL_CONSULTOR)

    clientes = []
    vistos = {}
    sem_consultor = 0
    cnpj_torto = []
    for n, r in enumerate(linhas, start=2):
        cnpj = so_digitos(r[i_cnpj])
        razao = (str(r[i_razao]).strip() if r[i_razao] else '')
        cons = (str(r[i_cons]).strip() if r[i_cons] else '')
        if not cons:
            sem_consultor += 1
            continue
        if len(cnpj) != 14:
            cnpj_torto.append((n, r[i_cnpj]))
            cnpj = ''
        if cnpj:
            if cnpj in vistos:
                sys.exit('CNPJ %s aparece duas vezes (linhas %d e %d) com '
                         'consultores %s e %s — a planilha precisa decidir de '
                         'quem e o cliente antes de virar filtro'
                         % (cnpj, vistos[cnpj], n, clientes[0], cons))
            vistos[cnpj] = n
        clientes.append({'cnpj': cnpj, 'razao': razao, 'consultor': cons})

    # ── a conferencia que da sentido a usar a aba consolidada ──────────────
    por_aba = collections.Counter()
    for nome in wb.sheetnames:
        if nome == ABA_TODOS:
            continue
        _, ls = le_aba(wb[nome])
        por_aba[nome] = len([x for x in ls if any(v is not None for v in x)])
    por_cons = collections.Counter(c['consultor'] for c in clientes)

    divergencia = []
    for nome, qt in sorted(por_aba.items()):
        if por_cons.get(nome, 0) != qt:
            divergencia.append('%s: aba tem %d, consolidada diz %d'
                               % (nome, qt, por_cons.get(nome, 0)))
    if divergencia:
        sys.exit('as abas por consultor nao batem com a "%s":\n  %s\n'
                 'gerar assim colocaria loja na carteira errada.'
                 % (ABA_TODOS, '\n  '.join(divergencia)))

    doc = {
        'gerado_em': datetime.date.today().isoformat(),
        'origem': os.path.basename(caminho),
        'aba': ABA_TODOS,
        'consultores': sorted(por_cons),
        'clientes': clientes,
    }
    with open(SAIDA, 'w', encoding='utf-8') as f:
        json.dump(doc, f, ensure_ascii=False, indent=1)

    print('OK  %s' % SAIDA)
    print('    %d clientes, %d consultores' % (len(clientes), len(por_cons)))
    for k in sorted(por_cons):
        print('      %-18s %4d' % (k, por_cons[k]))
    if sem_consultor:
        print('    %d linha(s) sem consultor — ficaram de fora' % sem_consultor)
    if cnpj_torto:
        print('    %d CNPJ fora do formato de 14 digitos — essas linhas so '
              'casam por nome:' % len(cnpj_torto))
        for n, v in cnpj_torto[:5]:
            print('      linha %d: %r' % (n, v))
    print('')
    print('Agora injete no no: node automations/n8n-sdk/rel-veiculos/_aplica-carteiras.js')


if __name__ == '__main__':
    main()
