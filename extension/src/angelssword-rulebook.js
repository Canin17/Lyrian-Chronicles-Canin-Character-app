// ponytail: SPA — poll for article, MutationObserver for Angular re-renders
(function () {
  if (!location.href.includes('/rulebook')) return;

  var injected = false;
  var reinjecting = false;
  var sidebarEl = null;
  var reopenBtn = null;
  var tocList = null;
  var styleEl = null;
  var articleObserver = null;

  function slugify(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  function cleanupInjected() {
    // ponytail: actually remove injected rows and restore hidden headings
    document.querySelectorAll('[id^="as-section-"]').forEach(function (el) { el.remove(); });
    var article = document.querySelector('article');
    if (article) {
      article.querySelectorAll('h2, h3, h4, h5, h6').forEach(function (h) {
        if (h._asRbHidden) {
          h.style.cssText = '';
          delete h._asRbHidden;
        }
      });
    }
    injected = false;
  }

  // ponytail: inject CSS once — it stays in head, Angular doesn't touch it
  function injectCSS() {
    if (styleEl) return;
    styleEl = document.createElement('style');
    styleEl.textContent =
      '.as-rb-send{display:inline-block!important;cursor:pointer!important;color:#dee2e6!important;background:#212529!important;border:1px solid #495057!important;border-radius:6px!important;font:500 .75rem/1.25rem "Roboto Slab",serif!important;padding:4px 12px!important;white-space:nowrap!important;}' +
      '.as-rb-send:hover{background:#343a40!important;}' +
      '.as-rb-send.fail{color:#f00!important;border-color:#f00!important;}' +
      '#as-rb-sidebar{position:fixed;top:0;left:0;width:300px;height:100vh;background:#212529;border-right:1px solid #495057;z-index:9999;display:flex;flex-direction:column;font-family:"Roboto Slab",serif;}' +
      '.as-rb-toc{display:block;cursor:pointer;padding:6px 16px;font-family:"Roboto Slab",serif;transition:color .15s,border-left-color .15s;border-left:3px solid transparent;}' +
      '.as-rb-toc:hover{color:#ffd700!important;border-left-color:#ffd700!important;}' +
      '.as-rb-toc.active{color:#ffd700!important;border-left-color:#ffd700!important;}' +
      '#as-rb-reopen{position:fixed;top:12px;right:16px;z-index:9998;cursor:pointer;background:#212529;border:1px solid #495057;border-radius:6px;color:#dee2e6;padding:6px 10px;font-size:1rem;font-family:"Roboto Slab",serif;}' +
      '#as-rb-close{cursor:pointer;color:#adb5bd;font-size:1.2rem;background:none;border:none;}';
    document.head.appendChild(styleEl);
  }

  // ponytail: build sidebar once — lives in body, Angular can't touch it
  function buildSidebar() {
    if (sidebarEl) return;

    sidebarEl = document.createElement('div');
    sidebarEl.id = 'as-rb-sidebar';

    var header = document.createElement('div');
    header.style.cssText = 'padding:16px;border-bottom:1px solid #495057;display:flex;justify-content:space-between;align-items:center;';
    header.innerHTML = '<h3 style="color:#dee2e6;margin:0;font-size:1.1rem;font-weight:500;">Table of Contents</h3>';
    var closeBtn = document.createElement('span');
    closeBtn.id = 'as-rb-close';
    closeBtn.textContent = '\u00D7';
    closeBtn.addEventListener('click', function () { toggleToc(false); });
    header.appendChild(closeBtn);
    sidebarEl.appendChild(header);

    tocList = document.createElement('div');
    tocList.style.cssText = 'flex:1;overflow-y:auto;padding:8px 0;';
    sidebarEl.appendChild(tocList);
    document.body.appendChild(sidebarEl);

    reopenBtn = document.createElement('span');
    reopenBtn.id = 'as-rb-reopen';
    reopenBtn.textContent = '\uD83D\uDCD6';
    reopenBtn.title = 'Toggle TOC';
    reopenBtn.addEventListener('click', function () { toggleToc(sidebarEl.style.display === 'none'); });
    document.body.appendChild(reopenBtn);

    // ponytail: don't push content — native sidebar already accounts for layout
    // our sidebar is fixed-position overlay, no margin needed
  }

  function toggleToc(show) {
    if (!sidebarEl || !reopenBtn) return;
    sidebarEl.style.display = show ? 'flex' : 'none';
  }

  // ponytail: live lookup — elements in article get destroyed by Angular,
  // so we find them at click time, not at build time
  function scrollTo(slug) {
    var target = document.getElementById('as-section-' + slug);
    if (!target) return;
    var scrollContainer = document.getElementById('content');
    if (scrollContainer) {
      var top = target.getBoundingClientRect().top - scrollContainer.getBoundingClientRect().top + scrollContainer.scrollTop - 60;
      scrollContainer.scrollTo({ top: top, behavior: 'smooth' });
    }
  }

  // ponytail: populate TOC from current article headings
  function populateToc() {
    if (!tocList) return;
    var article = document.querySelector('article');
    if (!article) return;
    var children = Array.from(article.children);
    var headings = children.filter(function (el) { return el.tagName && el.tagName.match(/^H[2-6]$/); });

    var toc = [];
    var currentH2 = null;
    headings.forEach(function (h) {
      var level = parseInt(h.tagName[1]);
      var title = h.textContent.trim();
      if (level === 2) {
        currentH2 = { title: title, name: slugify(title), children: [] };
        toc.push(currentH2);
      } else if (level === 3 && currentH2) {
        currentH2.children.push({ title: title, name: slugify(title) });
      }
    });

    tocList.innerHTML = '';
    toc.forEach(function (entry) {
      var h2 = document.createElement('span');
      h2.className = 'as-rb-toc';
      h2.textContent = entry.title;
      h2.setAttribute('data-slug', entry.name);
      h2.style.cssText = 'color:#dee2e6;font-weight:500;font-size:.875rem;';
      h2.addEventListener('click', function () { scrollTo(entry.name); });
      tocList.appendChild(h2);
      entry.children.forEach(function (child) {
        var h3 = document.createElement('span');
        h3.className = 'as-rb-toc';
        h3.textContent = child.title;
        h3.setAttribute('data-slug', child.name);
        h3.style.cssText = 'color:#adb5bd;font-size:.8rem;padding:4px 16px 4px 32px;';
        h3.addEventListener('click', function () { scrollTo(child.name); });
        tocList.appendChild(h3);
      });
    });
  }

  // ponytail: inject send buttons + row wrappers into article.
  // Angular destroys these, so we re-run this whenever article changes.
  function injectSendButtons() {
    var article = document.querySelector('article');
    if (!article) return;

    // Remove old injected rows (Angular may have kept some)
    document.querySelectorAll('[id^="as-section-"]').forEach(function (el) { el.remove(); });
    // Restore any headings we hid that Angular kept
    article.querySelectorAll('h2, h3, h4, h5, h6').forEach(function (h) {
      if (h._asRbHidden) {
        h.style.cssText = '';
        delete h._asRbHidden;
      }
    });

    var children = Array.from(article.children);
    var headings = children.filter(function (el) { return el.tagName && el.tagName.match(/^H[2-6]$/); });

    headings.forEach(function (h) {
      var title = h.textContent.trim();
      var slug = slugify(title);

      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:8px;';
      row.id = 'as-section-' + slug;
      row.style.scrollMarginTop = '60px';

      row.appendChild(h.cloneNode(true));

      // Hide original — preserve for anchors
      h.style.cssText = 'visibility:hidden;height:0;overflow:hidden;margin:0;padding:0;';
      h._asRbHidden = true;

      var btn = document.createElement('span');
      btn.className = 'as-rb-send';
      btn.textContent = '\uD83D\uDCE4 Send to VTT';

      // ponytail: re-query article at click time — closure capture is stale after Angular re-render
      btn.addEventListener('click', function () {
        var curArticle = document.querySelector('article');
        if (!curArticle) return;
        var allChildren = Array.from(curArticle.children);
        var headingIdx = allChildren.indexOf(h);
        if (headingIdx === -1) { headingIdx = 0; } // ponytail: fallback if Angular replaced h
        var nextHeading = allChildren.slice(headingIdx + 1).find(function (el) { return el.tagName && el.tagName.match(/^H[2-6]$/); });
        var endIdx = nextHeading ? allChildren.indexOf(nextHeading) : allChildren.length;
        var bodyEls = allChildren.slice(headingIdx + 1, endIdx);

        var temp = document.createElement('div');
        bodyEls.forEach(function (el) { temp.innerHTML += el.outerHTML; });
        var lines = [''];
        var nodes = temp.children.length ? temp.children : [temp];
        for (var i = 0; i < nodes.length; i++) {
          var n = nodes[i];
          if (n.tagName === 'P') { lines.push(n.innerText.trim()); lines.push(''); }
          else if (n.tagName === 'UL' || n.tagName === 'OL') {
            var items = n.querySelectorAll('li');
            for (var j = 0; j < items.length; j++) lines.push('\u2022 ' + items[j].innerText.trim());
            lines.push('');
          } else if (n.tagName === 'TABLE') {
            lines.push('');
            var trows = n.querySelectorAll('tr');
            for (var k = 0; k < trows.length; k++) {
              var cells = trows[k].querySelectorAll('th, td');
              var vals = [];
              for (var c = 0; c < cells.length; c++) vals.push(cells[c].innerText.trim());
              lines.push(vals.join(' | '));
              if (k === 0 && cells[0] && cells[0].tagName === 'TH') {
                lines.push(vals.map(function () { return '---'; }).join(' | '));
              }
            }
            lines.push('');
          } else if (n.tagName && n.tagName.match(/^H[1-6]$/)) { lines.push('**' + n.innerText.trim() + '**'); lines.push(''); }
          else if (n.tagName === 'HR') lines.push('---');
        }
        var text = lines.filter(function (l) { return l !== ''; }).join('\n');
        window.postMessage({ source: 'lyrian-dice', action: 'send-roll', foundry: text, roll20: text }, '*');
        navigator.clipboard.writeText(text).then(function () {
          btn.textContent = '\u2713';
        }).catch(function () {
          btn.textContent = '\u26A0';
          btn.className = 'as-rb-send fail';
          btn.title = 'Copy failed (clipboard blocked)';
        });
        setTimeout(function () { btn.textContent = '\uD83D\uDCE4 Send to VTT'; btn.className = 'as-rb-send'; btn.title = ''; }, 2000);
      });

      row.appendChild(btn);
      article.insertBefore(row, h);
    });
  }

  // ponytail: scroll spy — highlight current TOC entry
  var currentSlug = null;
  function updateActiveToc(slug) {
    if (slug === currentSlug) return;
    if (currentSlug) {
      var prev = tocList.querySelector('[data-slug="' + currentSlug + '"]');
      if (prev) prev.classList.remove('active');
    }
    var curr = tocList.querySelector('[data-slug="' + slug + '"]');
    if (curr) {
      currentSlug = slug;
      curr.classList.add('active');
    }
  }

  function inject() {
    if (injected) return;
    var article = document.querySelector('article');
    if (!article) return;
    injected = true;

    injectCSS();
    buildSidebar();
    populateToc();
    injectSendButtons();

    // ponytail: disconnect observer before re-injecting to prevent feedback loop
    if (articleObserver) articleObserver.disconnect();
    // ponytail: reconnect
    function onArticleChange(mutations) {
      var childrenChanged = mutations.some(function (m) { return m.addedNodes.length || m.removedNodes.length; });
      if (childrenChanged) {
        if (articleObserver) articleObserver.disconnect();
        injectSendButtons();
        populateToc();
        articleObserver = new MutationObserver(onArticleChange);
        var a = document.querySelector('article');
        if (a) articleObserver.observe(a, { childList: true, subtree: false });
      }
    }
    articleObserver = new MutationObserver(onArticleChange);
    articleObserver.observe(article, { childList: true, subtree: false });

    // ponytail: scroll spy — find nearest tracked section on scroll
    var scrollContainer = document.getElementById('content');
    if (scrollContainer) {
      // ponytail: only track slugs that actually exist in TOC
      var trackedSlugs = {};
      tocList.querySelectorAll('[data-slug]').forEach(function (el) { trackedSlugs[el.getAttribute('data-slug')] = true; });

      scrollContainer.addEventListener('scroll', function () {
        var sections = document.querySelectorAll('[id^="as-section-"]');
        var best = null;
        for (var i = 0; i < sections.length; i++) {
          var slug = sections[i].id.replace('as-section-', '');
          if (!trackedSlugs[slug]) continue; // ponytail: skip H4-H6
          var rect = sections[i].getBoundingClientRect();
          if (rect.top <= 100) best = slug;
        }
        if (best) updateActiveToc(best);
      }, { passive: true });
    }
  }

  // ponytail: Angular Material doesn't fire childList mutations reliably — poll instead
  var poll = setInterval(function () {
    if (document.querySelector('article')) {
      clearInterval(poll);
      inject();
    }
  }, 200);

  // ponytail: SPA nav — full cleanup and re-inject
  window.addEventListener('popstate', function () {
    if (injected) {
      if (articleObserver) articleObserver.disconnect();
      // ponytail: remove style BEFORE nulling the ref
      if (styleEl && styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
      cleanupInjected();
      sidebarEl = null;
      reopenBtn = null;
      tocList = null;
      styleEl = null;
      // ponytail: remove sidebar/reopen from DOM on nav away
      if (document.getElementById('as-rb-sidebar')) document.getElementById('as-rb-sidebar').remove();
      if (document.getElementById('as-rb-reopen')) document.getElementById('as-rb-reopen').remove();
      // ponytail: restore mainContent margin
      var mc = document.querySelector('article');
      if (mc && mc.parentElement) mc.parentElement.style.marginLeft = '';
      if (location.href.includes('/rulebook')) {
        // ponytail: re-poll for article on nav
        var poll = setInterval(function () {
          if (document.querySelector('article')) {
            clearInterval(poll);
            inject();
          }
        }, 200);
      }
    }
  });
})();
