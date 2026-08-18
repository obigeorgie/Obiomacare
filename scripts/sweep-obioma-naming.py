#!/usr/bin/env python3
"""Naming sweep: refer to the service as 'Obioma' — never 'ObiomaCare'/'Obioma Care'.

Sweeps landing/, content/ sources + public/ (incl. no-source committed files)
+ worker email strings. Domain 'obiomacare.com' is left untouched (URL).
Idempotent. Usage: python3 scripts/sweep-obioma-naming.py
"""
import os, re, glob

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PATTERNS = [("ObiomaCare", "Obioma"), ("Obioma Care", "Obioma")]

def sweep_path(root, exts=(".html", ".js")):
    changed_files = 0
    total_subs = 0
    for f in glob.glob(os.path.join(root, "**", "*"), recursive=True):
        if not os.path.isfile(f): continue
        if not f.endswith(exts): continue
        try:
            body = open(f, encoding="utf-8").read()
        except Exception:
            continue
        new = body
        for old, repl in PATTERNS:
            new = new.replace(old, repl)
        if new != body:
            open(f, "w", encoding="utf-8").write(new)
            n = sum(body.count(old) for old, _ in PATTERNS)
            changed_files += 1
            total_subs += n
            print(f"  {os.path.relpath(f, BASE)}: {n} replaced")
    return changed_files, total_subs

cf, cs = 0, 0
for root in [os.path.join(BASE, "landing"), os.path.join(BASE, "content"), os.path.join(BASE, "public")]:
    a, b = sweep_path(root)
    cf += a; cs += b
# worker email strings (user-facing FROM defaults)
for f in ["workers-site/api-checklist.js", "workers-site/api-events.js", "workers-site/email-copy.js"]:
    p = os.path.join(BASE, f)
    body = open(p, encoding="utf-8").read()
    new = body
    for old, repl in PATTERNS:
        new = new.replace(old, repl)
    if new != body:
        open(p, "w", encoding="utf-8").write(new)
        cf += 1; cs += sum(body.count(old) for old, _ in PATTERNS)
        print(f"  {f}: replaced")

print(f"\nSweep done: {cf} files changed, {cs} substitutions")
