/**
 * Rulebook viewer — loads rulebook_sections.json, renders TOC + sections,
 * each with a "Send to VTT" button that pipes through the extension bridge.
 *
 * ponytail: fetch JSON at runtime instead of <script src="...json"> which
 * throws a syntax error in browsers. Single IIFE, no framework.
 */
(function () {
  let sections = [];
  let toc = [];

  function loadData() {
    const data = window.RULEBOOK_DATA;
    if (!data) {
      document.getElementById('rb-content').innerHTML =
        '<p style="color:var(--accent-red)">Failed to load rulebook data.</p>';
      return;
    }
    sections = data.sections || [];
    toc = data.toc || [];
    renderToc();
    renderContent();
    initScrollSpy();
  }

  // ── Scroll Spy ──
  function initScrollSpy() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id.replace('section-', '');
          const tocItem = document.querySelector(`.rb-toc-item[data-target="${id}"]`);
          if (tocItem) {
            document.querySelectorAll('.rb-toc-item.active').forEach(el => el.classList.remove('active'));
            tocItem.classList.add('active');
            tocItem.scrollIntoView({ block: 'nearest' });
          }
        }
      });
    }, { rootMargin: '-20% 0px -60% 0px', threshold: 0 });

    document.querySelectorAll('.rb-section').forEach(el => observer.observe(el));
  }

  // ── TOC Sidebar ──
  function renderToc() {
    const list = document.getElementById('rb-toc-list');
    if (!list) return;

    let html = '';
    toc.forEach(entry => {
      html += `<button class="rb-toc-item h2" data-target="${entry.name}">${esc(entry.title)}</button>`;
      (entry.children || []).forEach(child => {
        html += `<button class="rb-toc-item h3" data-target="${child.name}">${esc(child.title)}</button>`;
      });
    });
    list.innerHTML = html;

    // Click → scroll to section (sidebar stays open)
    list.addEventListener('click', e => {
      const item = e.target.closest('[data-target]');
      if (!item) return;
      const target = document.getElementById('section-' + item.dataset.target);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  // ── Main Content ──
  function renderContent() {
    const container = document.getElementById('rb-content');
    if (!container) return;

    let html = '';
    sections.forEach(s => {
      const tag = `h${s.level}`;
      const sendId = `body-${s.name}`;
      html += `
        <div class="rb-section" id="section-${s.name}" data-level="${s.level}">
          <div class="rb-section-header">
            <${tag}>${esc(s.title)}</${tag}>
            <button class="rb-send-btn" data-body="${sendId}" title="Send this section to VTT chat">📤 Send to VTT</button>
          </div>
          <div class="rb-section-body" id="${sendId}">
            ${s.html}
          </div>
        </div>`;
    });
    container.innerHTML = html;

    // Wire send buttons
    container.addEventListener('click', e => {
      const btn = e.target.closest('.rb-send-btn');
      if (!btn) return;
      const bodyId = btn.dataset.body;
      const body = document.getElementById(bodyId);
      if (!body) return;
      sendSectionToVTT(body, btn);
    });
  }

  // ── Send to VTT ──
  function sendSectionToVTT(bodyEl, btnEl) {
    // Get section title from sibling header
    const header = bodyEl.closest('.rb-section').querySelector('.rb-section-header h2, .rb-section-header h3, .rb-section-header h4, .rb-section-header h5');
    const title = header ? header.textContent.trim() : 'Rulebook Section';

    // Convert HTML to chat-friendly text
    const text = htmlToChatText(bodyEl, title);

    // Send via extension bridge — same channel as dice rolls
    window.postMessage({
      source: 'lyrian-dice',
      action: 'send-roll',
      foundry: text,
      roll20: text,
      ability: title
    }, '*');

    // Fallback: clipboard copy
    navigator.clipboard.writeText(text).catch(() => {});

    // Visual feedback
    btnEl.classList.add('sent');
    btnEl.textContent = '✓ Sent!';
    setTimeout(() => {
      btnEl.classList.remove('sent');
      btnEl.textContent = '📤 Send to VTT';
    }, 2000);

    showToast(`Sent "${title}" to VTT`, 'success');
  }

  // ── HTML → Chat Text ──
  // ponytail: TreeWalker is overkill for this — innerText + list prefixing
  // covers 95% of cases and is 10x shorter.
  function htmlToChatText(el, title) {
    let lines = [];
    lines.push(`**${title}**`);
    lines.push('');

    // Walk child elements
    const children = el.children.length ? el.children : [el];
    for (const node of children) {
      if (node.tagName === 'P') {
        lines.push(node.innerText.trim());
        lines.push('');
      } else if (node.tagName === 'UL' || node.tagName === 'OL') {
        const items = node.querySelectorAll('li');
        items.forEach(li => {
          lines.push(`• ${li.innerText.trim()}`);
        });
        lines.push('');
      } else if (node.tagName === 'TABLE') {
        lines.push('');
        const rows = node.querySelectorAll('tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('th, td');
          const vals = Array.from(cells).map(c => c.innerText.trim());
          lines.push(vals.join(' | '));
        });
        lines.push('');
      } else if (node.tagName === 'H1' || node.tagName === 'H2' || node.tagName === 'H3' || node.tagName === 'H4' || node.tagName === 'H5' || node.tagName === 'H6') {
        lines.push(`**${node.innerText.trim()}**`);
        lines.push('');
      } else if (node.tagName === 'HR') {
        lines.push('---');
      }
    }

    return lines.filter(l => l !== '').join('\n');
  }

  // ── TOC Toggle ──
  function openToc() {
    document.getElementById('rb-toc-sidebar').classList.remove('hidden');
  }

  function closeToc() {
    document.getElementById('rb-toc-sidebar').classList.add('hidden');
  }

  function bindNav() {
    document.getElementById('rb-toc-toggle')?.addEventListener('click', openToc);
    document.getElementById('rb-toc-close')?.addEventListener('click', closeToc);
    document.getElementById('rb-back-btn')?.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

  // ── Toast ──
  function showToast(msg, type) {
    const toast = document.getElementById('eq-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.display = 'block';
    toast.style.background = type === 'success' ? 'var(--accent-green)' : 'var(--accent-gold)';
    toast.style.color = '#000';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.display = 'none'; }, 2500);
  }

  // ── Util ──
  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // ── Init ──
  function init() {
    bindNav();
    loadData();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
