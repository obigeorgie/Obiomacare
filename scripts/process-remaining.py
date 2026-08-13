#!/usr/bin/env python3
"""Process remaining emoji files"""
import os, re, subprocess, json

# Find all HTML files with remaining emojis
emoji_pattern = re.compile(
    r'[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF'
    r'\U0001F1E0-\U0001F1FF\U00002702-\U000027B0\U000024C2-\U0001F251'
    r'\U0001F900-\U0001F9FF\U0001FA00-\U0001FA6F\U0001FA70-\U0001FAFF'
    r'\U00002600-\U000026FF\U00002500-\U00002BEF]+', re.UNICODE
)

remaining = []
for root, dirs, files in os.walk('.'):
    dirs[:] = [d for d in dirs if d not in ('node_modules','.git','video-temp','video','downloads','design-tokens')]
    for f in files:
        if not f.endswith('.html'): continue
        path = os.path.join(root, f)
        try:
            with open(path, 'r', encoding='utf-8', errors='ignore') as fh:
                content = fh.read()
        except: continue
        emojis = emoji_pattern.findall(content)
        if emojis:
            remaining.append(path)

print(f"Found {len(remaining)} files with remaining emojis")
for path in remaining:
    result = subprocess.run(
        ['node', '/root/.openclaw/workspace/obioma-care/scripts/replace-emojis.js', path],
        capture_output=True, text=True
    )
    print(f"  {os.path.basename(path)}: {result.stdout.strip().split(chr(10))[-1] if result.stdout else 'done'}")

print("\n✅ All remaining files processed")
