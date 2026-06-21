import re, glob, os

base = '.'

with open('index.html') as f:
    html = f.read()

js_files = glob.glob(os.path.join('js', '**', '*.js'), recursive=True)
js_content = ''
for f in js_files:
    with open(f) as fh:
        js_content += fh.read()

with open('css/styles.css') as f:
    css = f.read()

# 2. getElementById cross-reference
print('=== getElementById CROSS-REFERENCE ===')
js_ids = set()
for m in re.finditer(r'''getElementById\(['"]([^'"]+)['"]''', js_content):
    js_ids.add(m.group(1))

html_ids = set(re.findall(r'id="([^"]+)"', html))

missing = js_ids - html_ids
if missing:
    print(f'  MISSING ({len(missing)}): IDs used in JS but NOT in HTML:')
    for m in sorted(missing):
        print(f'    - {m}')
else:
    print('  All JS getElementById IDs found in HTML OK')

# 3. Check for inline onclick in JS
print()
print('=== INLINE onclick IN JS ===')
for f in sorted(js_files):
    with open(f) as fh:
        content = fh.read()
    matches = re.findall(r'onclick\s*=', content)
    if matches:
        print(f'  {f}: {len(matches)} inline onclick found')

# 4. Check .onchange = / .onclick = patterns
print()
print('=== .onchange/.onclick = ASSIGNMENTS ===')
for f in sorted(js_files):
    with open(f) as fh:
        content = fh.read()
    matches = re.findall(r'\.(onchange|onclick|oninput|onload|onerror)\s*=', content)
    if matches:
        print(f'  {f}: {matches}')

# 5. Check for search inputs without debounce
print()
print('=== SEARCH INPUTS (input event listeners) ===')
for f in sorted(js_files):
    with open(f) as fh:
        content = fh.read()
    if 'addEventListener' in content and "'input'" in content:
        has_debounce = 'setTimeout' in content or 'debounce' in content
        print(f'  {f}: has input listener, debounce={has_debounce}')

# 6. Check structuredClone usage
print()
print('=== structuredClone ===')
for f in sorted(js_files):
    with open(f) as fh:
        content = fh.read()
    if 'structuredClone' in content:
        has_polyfill = 'typeof structuredClone' in content or 'undefined' in content
        print(f'  {f}: uses structuredClone, polyfill={has_polyfill}')

# 7. Check localStorage usage
print()
print('=== localStorage ===')
for f in sorted(js_files):
    with open(f) as fh:
        content = fh.read()
    if 'localStorage' in content:
        has_try = 'try' in content and 'catch' in content
        print(f'  {f}: uses localStorage, try/catch={has_try}')

# 8. Check for ARIA roles
print()
print('=== ARIA ROLES ===')
aria_count = len(re.findall(r'role=', html))
print(f'  ARIA roles in HTML: {aria_count}')

# 9. Check for prefers-reduced-motion in CSS
print()
print('=== prefers-reduced-motion ===')
print(f'  Found: {"yes" if "prefers-reduced-motion" in css else "NO - MISSING"}')

# 10. Check outline:none without focus-visible
print()
print('=== outline:none WITHOUT focus-visible ===')
outline_matches = re.findall(r'outline:\s*none', css)
focus_visible = 'focus-visible' in css
print(f'  outline:none occurrences: {len(outline_matches)}, focus-visible present: {focus_visible}')

# 11. Check for alert() usage
print()
print('=== alert() usage ===')
for f in sorted(js_files):
    with open(f) as fh:
        content = fh.read()
    alerts = re.findall(r'alert\s*\(', content)
    if alerts:
        print(f'  {f}: {len(alerts)} alert() calls')

# 12. Check for beforeunload
print()
print('=== beforeunload ===')
found_beforeunload = False
for f in sorted(js_files):
    with open(f) as fh:
        content = fh.read()
    if 'beforeunload' in content:
        print(f'  {f}: has beforeunload OK')
        found_beforeunload = True
if not found_beforeunload:
    print('  NO beforeunload found - data loss risk')

# 13. Check for GSAP usage
print()
print('=== GSAP usage ===')
for f in sorted(js_files):
    with open(f) as fh:
        content = fh.read()
    if 'gsap' in content:
        gsap_calls = len(re.findall(r'gsap\.\w+\(', content))
        print(f'  {f}: {gsap_calls} gsap calls')

# 14. Check for unconditional display on wizard steps in CSS
print()
print('=== UNCONDITIONAL DISPLAY ON WIZARD STEPS ===')
for line_no, line in enumerate(css.split('\n'), 1):
    if re.search(r'#step-\w+', line) and 'display' in line and '.active' not in line:
        print(f'  POTENTIAL BUG: line {line_no} - {line.strip()[:100]}')

# 15. Check CSS classes used in JS but not defined
print()
print('=== CSS CLASSES USED IN JS (classList.add) ===')
js_classes = set()
for m in re.finditer(r'''classList\.(?:add|remove|toggle)\s*\(\s*['"]([^'"]+)['"]''', js_content):
    js_classes.add(m.group(1))
css_classes = set(re.findall(r'\.([a-zA-Z][\w-]*)\s*\{', css))
missing_css = js_classes - css_classes
# Filter out common compound classes
missing_css = {c for c in missing_css if not c.startswith('data-') and c not in ('active', 'completed', 'hidden')}
if missing_css:
    print(f'  MISSING CSS ({len(missing_css)}):')
    for c in sorted(missing_css):
        print(f'    - .{c}')
else:
    print('  All JS classList classes found in CSS OK')

# 16. Check for escapeHtml/renderHtml usage
print()
print('=== XSS / escapeHtml CHECK ===')
for f in sorted(js_files):
    with open(f) as fh:
        content = fh.read()
    innerhtml_count = len(re.findall(r'innerHTML\s*=', content))
    escape_count = len(re.findall(r'escapeHtml|renderHtml|decodeHtml', content))
    if innerhtml_count > 0:
        print(f'  {f}: {innerhtml_count} innerHTML assignments, {escape_count} escape calls')

print()
print('=== Structural checks complete ===')
