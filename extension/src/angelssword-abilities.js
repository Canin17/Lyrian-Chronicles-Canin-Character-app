// ponytail: Abilities page — inject Send to VTT buttons on each mat-expansion-panel.
(function () {
  if (!location.href.includes('/abilities')) return;

  function injectCSS() {
    if (document.getElementById('as-ab-style')) return;
    var s = document.createElement('style');
    s.id = 'as-ab-style';
    s.textContent =
      '.as-ab-send{display:inline-flex!important;align-items:center!important;cursor:pointer!important;color:#dee2e6!important;background:#212529!important;border:1px solid #495057!important;border-radius:6px!important;font:500 .75rem/1.25rem "Roboto Slab",serif!important;padding:4px 12px!important;white-space:nowrap!important;margin-left:8px!important;height:28px!important;align-self:start!important;}' +
      '.as-ab-send:hover{background:#343a40!important;}' +
      '.as-ab-send.fail{color:#f00!important;border-color:#f00!important;}';
    document.head.appendChild(s);
  }

  function extractPanel(panel) {
    // ponytail: title is in the expansion panel header: span.fs-5.fw-bold
    var titleEl = panel.querySelector('.mat-expansion-panel-header .fs-5.fw-bold');
    if (!titleEl) return null;
    var title = titleEl.textContent.trim().replace(/^○\s*/, ''); // strip circle bullet

    // ponytail: card content may be collapsed (visibility:hidden) but still in DOM
    // query deep inside the panel for the card content
    var content = panel.querySelector('.mat-mdc-card-content, .mat-card-content');
    if (!content) return null;
    var rows = content.querySelectorAll('li');
    if (!rows.length) return null;

    var keywords = [];
    var sections = [];
    rows.forEach(function(row) {
      var t = row.querySelector('.title');
      var v = row.querySelector('.flex-fill');
      if (!t || !v) return;
      var label = t.textContent.trim();
      var val = v.textContent.trim();
      if (label === 'Keywords') {
        var chips = row.querySelectorAll('mat-chip, mat-mdc-chip');
        if (chips.length) {
          chips.forEach(function(ch) { var ct = ch.textContent.trim(); if (ct) keywords.push(ct); });
        } else if (val && val !== '--') {
          keywords.push(val);
        }
      } else {
        sections.push({ label: label, value: val });
      }
    });

    return { title: title, keywords: keywords, sections: sections };
  }

  function injectButtons() {
    var panels = document.querySelectorAll('mat-expansion-panel');
    if (!panels.length) return;
    injectCSS();

    panels.forEach(function(panel) {
      if (panel.querySelector('.as-ab-send')) return;
      var data = extractPanel(panel);
      if (!data || !data.title || !data.sections.length) return;

      var btn = document.createElement('span');
      btn.className = 'as-ab-send';
      btn.textContent = '\uD83D\uDCE4 Send to VTT';

      btn.addEventListener('click', function() {
        // ponytail: map sections to fixed headers; keywords in body, not chips
        var map = {};
        data.sections.forEach(function(s) { map[s.label.toLowerCase()] = s.value; });
        var parts = [];
        if (data.keywords.length) parts.push('**Keywords**\n' + data.keywords.join(', '));
        if (map['range']) parts.push('**Range**\n' + map['range']);
        if (map['description']) parts.push('**Description**\n' + map['description']);
        if (map['ap cost']) parts.push('**AP Cost**\n' + map['ap cost']);
        // ponytail: empty lines between sections — roll20-content.js styles them as dividers
        var text = parts.join('\n\n\n');
        window.postMessage({ source: 'lyrian-dice', action: 'send-roll', foundry: text, roll20: text, ability: data.title, keywords: data.keywords }, '*');
        navigator.clipboard.writeText(text).then(function() {
          btn.textContent = '\u2713';
        }).catch(function() {
          btn.textContent = '\u26A0';
          btn.className = 'as-ab-send fail';
        });
        setTimeout(function() { btn.textContent = '\uD83D\uDCE4 Send to VTT'; btn.className = 'as-ab-send'; }, 2000);
      });

      // ponytail: append button to the panel header's .mat-content span (next to title)
      var headerContent = panel.querySelector('.mat-expansion-panel-header .mat-content');
      if (headerContent) headerContent.appendChild(btn);
      else panel.querySelector('.mat-expansion-panel-header').appendChild(btn);
    });
  }

  var poll = setInterval(function() {
    if (document.querySelectorAll('mat-expansion-panel').length) {
      clearInterval(poll);
      injectButtons();
      setInterval(function() {
        if (document.querySelectorAll('mat-expansion-panel').length) injectButtons();
      }, 500);
    }
  }, 200);
})();
