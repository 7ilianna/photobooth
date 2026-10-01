"""Rebuild styles.css from tools/styles.template.css.

The template uses @@TOKENS@@ for the lace, ribbon and ornament drawings, which
lace_svgs.py turns into data URIs. Run from the repo root:  python3 tools/build_css.py
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import lace_svgs  # noqa: E402

css = open(os.path.join(HERE, 'styles.template.css')).read()
tokens = lace_svgs.tokens()
tokens['CURSORS'] = open(os.path.join(HERE, 'cursor-vars.txt')).read().rstrip('\n')
for key, value in tokens.items():
    css = css.replace('@@' + key + '@@', value)
open(os.path.join(HERE, '..', 'styles.css'), 'w').write(css)
print('styles.css rebuilt')
