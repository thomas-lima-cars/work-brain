"""Ponte para importar o dicionario de sinais de `analisa-sinais.py`.

O arquivo original tem hifen no nome e nao e importavel por `import`. Em vez
de copiar o dicionario para ca -- que criaria DUAS fontes da verdade, livres
para divergir em silencio -- este modulo carrega o original e reexporta
`SINAIS` e `norm`.

Quem edita o dicionario continua editando `analisa-sinais.py`, e so.
"""

import importlib.util
from pathlib import Path

_ORIG = Path(__file__).resolve().parent / "analisa-sinais.py"
if not _ORIG.exists():
    raise ImportError("nao achei %s -- o dicionario de sinais mora la" % _ORIG)

_spec = importlib.util.spec_from_file_location("_analisa_sinais", _ORIG)
_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mod)

SINAIS = _mod.SINAIS
norm = _mod.norm
PECAS = _mod.PECAS

__all__ = ["SINAIS", "norm", "PECAS"]
