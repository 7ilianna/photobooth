"""Rebuild styles.css from tools/styles.template.css.

The template uses @@TOKENS@@ for the ribbon and ornament drawings. Small ones become
data URIs; larger ones (from flourish.py) are written to assets/ornaments/. Run from the repo root:  python3 tools/build_css.py
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import lace_svgs  # noqa: E402

css = open(os.path.join(HERE, 'styles.template.css')).read()
tokens = lace_svgs.tokens()
orn_dir = os.path.join(HERE, '..', 'assets', 'ornaments')
os.makedirs(orn_dir, exist_ok=True)
for key, (fname, svg) in lace_svgs.ornament_files().items():
    open(os.path.join(orn_dir, fname), 'w').write(svg)
    tokens[key] = f'url("assets/ornaments/{fname}")'
tokens['CURSORS'] = open(os.path.join(HERE, 'cursor-vars.txt')).read().rstrip('\n')
for key, value in tokens.items():
    css = css.replace('@@' + key + '@@', value)
open(os.path.join(HERE, '..', 'styles.css'), 'w').write(css)
print('styles.css rebuilt')
