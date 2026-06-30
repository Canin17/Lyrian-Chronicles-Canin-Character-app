/**
 * Lyrian Chronicles - Combat Companion
 * Single-player resource/ability tracker. Rules per rulebook v0.13.0.
 */
/* exported CombatScene */
const CombatScene = (function() {
  'use strict';

  // ponytail: combat.html doesn't load app.js, so these must be self-contained
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
  }
  function renderHtml(str) {
    if (typeof str !== 'string') return '';
    let escaped = str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
    const safe = ['nbsp','mdash','ndash','lsquo','rsquo','ldquo','rdquo','hellip','copy','reg','trade','bull','middot','rarr','larr','times','plusmn','frac12','frac14','frac34','sup1','sup2','sup3','circ','prime','Prime','laquo','raquo'];
    safe.forEach(e => { escaped = escaped.replace(new RegExp('&amp;' + e + ';', 'g'), '&' + e + ';'); });
    return escaped;
  }

  let character = null;
  let derived = {};

  // Rules-accurate combat state
  const state = {
    hp: 0, maxHp: 0, tempHp: 0,
    ap: 4, maxAp: 4,             // AP: max 4 (Heroic), refills at start of each turn
    rp: 0, maxRp: 0,             // RP: 2 + AGI, gained only at combat start
    mana: 0, maxMana: 0,         // Mana: never auto-refresh
    round: 1,
    exhausted: {},               // { abilityName: true } — cleared on New Turn
    conditions: []               // [{ name, icon, duration }]
  };

  let combatAbilities = [];
  let activeFilter = 'all';
  let searchQuery = '';

  // Basic actions — always available, never exhausted (per rulebook)
  const BASIC_ACTIONS = [
    { name: 'Light Attack',  ap: 1, desc: 'A quick weapon attack.' },
    { name: 'Heavy Attack',  ap: 2, desc: 'A powerful weapon attack.' },
    { name: 'Precise Attack',ap: 2, desc: 'An accurate weapon attack.' },
    { name: 'Move',          ap: 1, desc: 'Move up to your speed (1 AP per move).' },
    { name: 'Defend',        ap: 1, desc: 'Take a defensive stance.' },
    { name: 'Dodge',         rp: 1, desc: 'Reactive evasion (uses RP).' },
    { name: 'Block',         rp: 1, desc: 'Reactive block (uses RP).' }
  ];

  const CONDITION_PRESETS = [
    {name:'Poisoned',icon:'🤢'},{name:'Bleeding',icon:'🩸'},{name:'Stunned',icon:'💫'},
    {name:'Burning',icon:'🔥'},{name:'Frozen',icon:'🧊'},{name:'Rooted',icon:'⛓️'},
    {name:'Blinded',icon:'🙈'},{name:'Prone',icon:'🧎'},{name:'Frightened',icon:'😱'},
    {name:'Charmed',icon:'💗'},{name:'Slowed',icon:'🐌'},{name:'Downed',icon:'💤'}
  ];

  const FILTER_TABS = [
    {id:'all',label:'All'},{id:'active',label:'Active'},{id:'passive',label:'Passive'},
    {id:'spells',label:'Spells'},{id:'reactions',label:'Reactions'}
  ];

  function init() {
    loadCharacter();
    bindEvents();              // always bind — back button works even with no character
    if (!character || !character.stats) {
      const el = document.getElementById('combat-char-name');
      if (el) el.textContent = 'No character — open the Creator first';
      return;
    }
    derived = calculateDerivedStats(character.stats);
    startEncounter();          // initialize all resources to encounter-start values
    buildAbilityList();
    renderAll();
    console.log('[Combat] Ready for', character.name || 'Unnamed');
  }

  // ponytail: file:// opaque origins clear window.name on navigation.
  // URL hash is the transport — survives same-tab nav, refresh, bookmarks.
  // localStorage kept as fallback for http:// deployments.
  const STORAGE_KEY = 'lyrian-chronicles-character';

  function loadCharacter() {
    // 1) URL hash — primary for file:// (survives nav, refresh, bookmarks)
    const hash = window.location.hash;
    if (hash && hash.startsWith('#')) {
      try {
        const raw = decodeURIComponent(hash.slice(1));
        character = JSON.parse(raw);
        if (character && (character.name || character.race || character.cls)) {
          // clear hash so back button doesn't re-parse
          history.replaceState(null, '', window.location.pathname);
          console.log('[Combat] Loaded from URL hash:', character.name || 'Unnamed',
            '(', Object.keys(character).length, 'keys)');
          return;
        }
      } catch (e) {
        console.error('[Combat] URL hash parse failed:', e.message);
      }
    }

    // 2) localStorage — fallback for http:// deployments
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && (data.name || data.race || data.cls)) {
          character = data;
          console.log('[Combat] Loaded from localStorage:', character.name || 'Unnamed',
            '(', Object.keys(character).length, 'keys)');
          return;
        }
      }
    } catch (e) {
      console.error('[Combat] localStorage read failed:', e.message);
    }

    console.warn('[Combat] No character data found. Return to the Creator and click "Enter Combat".');
  }

  // ── RULES-ACCURATE RESOURCE TRANSITIONS ──────────────────────────────────

  // Start of combat: AP→max, RP→max(2+AGI), Mana→pool, round=1, clear exhaustion
  function startEncounter() {
    state.maxHp = derived.hp || 20;
    state.hp = state.maxHp;
    state.tempHp = 0;
    state.maxAp = 4;                 // Heroic
    state.ap = state.maxAp;
    state.maxRp = derived.rp || 2;   // 2 + AGI
    state.rp = state.maxRp;
    state.maxMana = derived.mana || 6;
    state.mana = state.maxMana;
    state.round = 1;
    state.exhausted = {};
    // conditions persist across "New Turn" but cleared on a fresh encounter
    state.conditions = [];
  }

  // Start of a new turn: AP→max, clear exhaustion, tick conditions. RP & Mana UNCHANGED.
  function newTurn() {
    state.ap = state.maxAp;
    state.exhausted = {};
    state.round += 1;
    tickConditions();
    renderAll();
    pulseAp();
    showToast(`New turn — AP refilled (RP & Mana unchanged)`, 'info');
  }

  function tickConditions() {
    state.conditions = state.conditions
      .map(c => c.duration > 0 ? { ...c, duration: c.duration - 1 } : c)
      .filter(c => c.duration !== 0); // duration 0 here means "expired this tick"; <0 never set
  }

  function buildAbilityList() {
    const raw = getAllCharacterAbilities(character);
    combatAbilities = raw.map(a => {
      const db = ABILITIES_DB[a.name] || {};
      const keywords = db.keywords || [];
      return {
        name: a.name,
        source: a.source, sourceName: a.sourceName,
        description: a.description || db.description || '',
        range: db.range || '',
        apCost: db.apCost ? parseInt(db.apCost) : 0,
        manaCost: db.manaCost ? parseInt(db.manaCost) : 0,
        rpCost: db.rpCost ? parseInt(db.rpCost) : 0,
        keywords,
        type: db.type || 'true',
        isRapid: keywords.some(k => /rapid/i.test(k)) // Rapid = exempt from once-per-round
      };
    });
    // De-dupe by name (aggregation may repeat)
    const seen = new Set();
    combatAbilities = combatAbilities.filter(a => seen.has(a.name) ? false : seen.add(a.name));
  }

  function renderAll() {
    renderHeader(); renderDashboard(); renderTurnControls();
    renderBasics(); renderConditions(); renderFilters();
    renderAbilityGrid(); renderConclusion();
    // GSAP entrance
    if (window.gsap) {
      gsap.fromTo('.combat-dashboard',{y:-16,autoAlpha:0},{y:0,autoAlpha:1,duration:.4,ease:'power2.out'});
      gsap.fromTo('.ab-card',{y:18,autoAlpha:0},{y:0,autoAlpha:1,duration:.3,stagger:.015,delay:.15,ease:'power2.out'});
    }
  }

  function renderHeader() {
    const n = document.getElementById('combat-char-name');
    const s = document.getElementById('combat-char-sub');
    if (n) n.textContent = character.name || 'Unnamed';
    if (s) {
      const cls = (character.cls && character.cls.all || [])
        .map(c => `${c.class.name} L${c.level}`).join(' / ');
      const race = character.race ? character.race.name : '';
      s.textContent = [race, cls].filter(Boolean).join(' · ');
    }
  }

  function renderDashboard() {
    const d = document.getElementById('combat-dashboard');
    if (!d) return;
    const hpPct = state.maxHp ? (state.hp / state.maxHp) * 100 : 0;
    const tempPct = state.maxHp ? Math.min((state.tempHp / state.maxHp) * 100, 100) : 0;

    d.innerHTML = `
      <!-- HP block -->
      <div class="dash-hp">
        <div class="dash-hp-label">HP</div>
        <div class="dash-hp-bar">
          <div class="dash-hp-fill" id="hp-fill" style="width:${hpPct}%"></div>
          <div class="dash-hp-temp" id="hp-temp" style="width:${tempPct}%"></div>
          <span class="dash-hp-text">${state.hp} / ${state.maxHp}${state.tempHp ? ' (+' + state.tempHp + ' Temp)' : ''}</span>
        </div>
        <div class="dash-hp-quick">
          <button data-hp="-10">−10</button><button data-hp="-5">−5</button><button data-hp="-1">−1</button>
          <input type="number" id="hp-custom" placeholder="±n" class="dash-hp-input">
          <button data-hp="+1">+1</button><button data-hp="+5">+5</button><button data-hp="+10">+10</button>
          <button data-hp="temp" class="dash-temp-btn">+Temp</button>
        </div>
      </div>

      <!-- AP / RP / Mana -->
      <div class="dash-resources">
        <div class="dash-res dash-ap">
          <div class="dash-res-head"><span class="dash-res-name">AP</span><span class="dash-res-num">${state.ap}/${state.maxAp}</span></div>
          <div class="dash-pips" id="ap-pips">${pipRow('ap', state.ap, state.maxAp)}</div>
          <div class="dash-res-note">Refills each turn</div>
        </div>
        <div class="dash-res dash-rp">
          <div class="dash-res-head"><span class="dash-res-name">RP</span><span class="dash-res-num">${state.rp}/${state.maxRp}</span></div>
          <div class="dash-pips" id="rp-pips">${pipRow('rp', state.rp, state.maxRp)}</div>
          <div class="dash-res-note dash-scarce">Only refills at encounter start</div>
        </div>
        <div class="dash-res dash-mana">
          <div class="dash-res-head"><span class="dash-res-name">Mana</span></div>
          <div class="dash-mana-control">
            <button data-mana="-1">−</button>
            <span class="dash-mana-num">${state.mana}<span class="dash-mana-max">/${state.maxMana}</span></span>
            <button data-mana="+1">+</button>
          </div>
          <div class="dash-res-note dash-scarce">Precious — no auto-refresh</div>
        </div>
      </div>
    `;
  }

  function pipRow(type, current, max) {
    let s = '';
    for (let i = 0; i < max; i++) {
      const filled = i < current;
      s += `<span class="dash-pip pip-${type} ${filled ? 'filled' : 'empty'}" data-pip="${type}" data-idx="${i}" role="button" tabindex="0" aria-label="${type.toUpperCase()} ${i+1} ${filled?'filled':'empty'}"></span>`;
    }
    return s;
  }

  function pulseAp() {
    if (!window.gsap) return;
    gsap.fromTo('#ap-pips .dash-pip.filled',
      { scale: 0.3, autoAlpha: 0.4 },
      { scale: 1, autoAlpha: 1, duration: 0.4, stagger: 0.06, ease: 'back.out(2)' });
  }

  function renderTurnControls() {
    const c = document.getElementById('combat-turn-controls'); if (!c) return;
    c.innerHTML = `
      <span class="turn-round">Round ${state.round}</span>
      <button id="btn-new-turn" class="btn-primary turn-btn">↻ New Turn</button>
      <button id="btn-new-encounter" class="btn-secondary turn-btn">⚔ New Encounter</button>
      <button id="btn-conclusion" class="btn-secondary turn-btn">🏁 Encounter Conclusion</button>
    `;
  }

  function renderBasics() {
    const c = document.getElementById('combat-basics'); if (!c) return;
    c.innerHTML = `
      <div class="combat-section-label">Basic Actions <span class="combat-section-hint">always available · never exhausted</span></div>
      <div class="basics-row">
        ${BASIC_ACTIONS.map(b => {
          const cost = b.ap ? `${b.ap} AP` : `${b.rp} RP`;
          const can = b.ap ? state.ap >= b.ap : state.rp >= b.rp;
          return `<button class="basic-btn ${can?'':'basic-disabled'}" data-basic="${b.name}" title="${escapeHtml(b.desc)}">
            <span class="basic-name">${b.name}</span><span class="basic-cost ${b.ap?'cost-ap':'cost-rp'}">${cost}</span>
          </button>`;
        }).join('')}
      </div>`;
  }

  function renderConditions() {
    const c = document.getElementById('combat-conditions'); if (!c) return;
    const chips = state.conditions.map((cond,i)=>`
      <span class="cond-chip" data-cond-idx="${i}" title="Click to remove">
        ${cond.icon} ${escapeHtml(cond.name)}${cond.duration>0?` <em>${cond.duration}r</em>`:''}
      </span>`).join('');
    c.innerHTML = `
      <div class="combat-section-label">Conditions</div>
      <div class="cond-row">
        ${chips || '<span class="cond-empty">None</span>'}
        <div class="cond-add">
          <select id="cond-select">${CONDITION_PRESETS.map(p=>`<option value="${p.name}">${p.icon} ${p.name}</option>`).join('')}</select>
          <input type="number" id="cond-dur" placeholder="rounds" min="0" class="cond-dur-input">
          <button id="cond-add-btn">+ Add</button>
        </div>
      </div>`;
  }

  function renderFilters() {
    const c = document.getElementById('combat-filters'); if (!c) return;
    c.innerHTML = `
      <div class="filter-group"><label>Show:</label><div class="filter-buttons">
        ${FILTER_TABS.map(t=>`<button class="filter-btn ${activeFilter===t.id?'active':''}" data-cf="${t.id}">${t.label}</button>`).join('')}
      </div></div>
      <div class="filter-group"><label>Search:</label>
        <input type="text" id="combat-search" placeholder="Search abilities..." value="${escapeHtml(searchQuery)}"></div>`;
  }

  function passesFilter(a) {
    if (activeFilter==='active'   && a.type!=='true') return false;
    if (activeFilter==='passive'  && a.type!=='key')  return false;
    if (activeFilter==='spells'   && !a.keywords.some(k=>/spell/i.test(k))) return false;
    if (activeFilter==='reactions'&& !(a.rpCost>0 || a.keywords.some(k=>/rapid|reaction/i.test(k)))) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!a.name.toLowerCase().includes(q) && !a.description.toLowerCase().includes(q)) return false;
    }
    return true;
  }

  function abilityStatus(a) {
    if (a.type === 'key') return 'passive';
    const affordable = state.ap>=a.apCost && state.mana>=a.manaCost && state.rp>=a.rpCost;
    // Exhaustion: non-Rapid actives used this round are locked until next turn
    const exhausted = !a.isRapid && state.exhausted[a.name];
    if (exhausted) return 'exhausted';
    if (!affordable) return 'cantafford';
    return 'available';
  }

  function renderAbilityGrid() {
    const g = document.getElementById('combat-ability-grid'); if (!g) return;
    const list = combatAbilities.filter(passesFilter);
    g.innerHTML = list.length ? list.map(renderAbilityCard).join('')
      : '<div class="combat-empty">No abilities match.</div>';
  }

  function renderAbilityCard(a) {
    const status = abilityStatus(a);
    const costs = [];
    if (a.apCost)   costs.push(`<span class="cost-ap">${a.apCost} AP</span>`);
    if (a.manaCost) costs.push(`<span class="cost-mp">${a.manaCost} Mana</span>`);
    if (a.rpCost)   costs.push(`<span class="cost-rp">${a.rpCost} RP</span>`);
    const badge = a.type==='key' ? 'Passive' : a.isRapid ? 'Rapid' : (a.keywords.some(k=>/spell/i.test(k))?'Spell':'Active');
    const canUse = status === 'available';
    return `
      <div class="ab-card ab-${status}" data-ability="${escapeHtml(a.name)}" role="button" tabindex="0">
        <div class="ab-card-top">
          <span class="ab-badge ${a.isRapid?'ab-badge-rapid':''}">${badge}</span>
          ${status==='exhausted' ? '<span class="ab-lock" title="Used this round">🔒 used</span>' : ''}
        </div>
        <h4 class="ab-name">${renderHtml(a.name)}</h4>
        ${costs.length ? `<div class="ab-cost">${costs.join(' · ')}</div>` : '<div class="ab-cost ab-nocost">No cost</div>'}
        <p class="ab-desc">${renderHtml(a.description.slice(0,90))}${a.description.length>90?'…':''}</p>
        <div class="ab-actions">
          ${canUse ? `<button class="ab-use" data-use="${escapeHtml(a.name)}">Use</button>` : ''}
          <button class="ab-info" data-info="${escapeHtml(a.name)}">Details</button>
        </div>
      </div>`;
  }

  function useAbility(name) {
    const a = combatAbilities.find(x => x.name === name); if (!a) return;
    if (abilityStatus(a) !== 'available') return;
    state.ap -= a.apCost; state.mana -= a.manaCost; state.rp -= a.rpCost;
    if (!a.isRapid) state.exhausted[a.name] = true; // once-per-round lock
    renderDashboard(); renderBasics(); renderAbilityGrid();
    const costStr = [a.apCost&&`${a.apCost}AP`, a.manaCost&&`${a.manaCost}Mana`, a.rpCost&&`${a.rpCost}RP`].filter(Boolean).join(' ');
    showToast(`Used ${a.name}${costStr?' ('+costStr+')':''}`, 'success');
  }

  function showAbilityDetail(name) {
    const a = combatAbilities.find(x => x.name === name); if (!a) return;
    const overlay = document.getElementById('combat-modal-overlay');
    const box = document.getElementById('combat-modal-content'); if (!overlay||!box) return;
    const costs = [a.apCost&&`${a.apCost} AP`, a.manaCost&&`${a.manaCost} Mana`, a.rpCost&&`${a.rpCost} RP`].filter(Boolean).join(', ');
    box.innerHTML = `
      <div class="cm-head"><h3>${renderHtml(a.name)}</h3><button id="cm-close" class="modal-close-btn">✕</button></div>
      <div class="cm-body">
        <div class="cm-row"><span class="cm-l">Type</span>${a.type==='key'?'Passive':'Active'}${a.isRapid?' · Rapid (not once-per-round)':''}</div>
        ${a.range?`<div class="cm-row"><span class="cm-l">Range</span>${renderHtml(a.range)}</div>`:''}
        ${costs?`<div class="cm-row"><span class="cm-l">Cost</span>${costs}</div>`:''}
        ${a.sourceName?`<div class="cm-row"><span class="cm-l">Source</span>${renderHtml(a.sourceName)}</div>`:''}
        ${a.keywords.length?`<div class="cm-row"><span class="cm-l">Keywords</span>${a.keywords.map(k=>`<span class="kw-tag">${renderHtml(k)}</span>`).join(' ')}</div>`:''}
        <div class="cm-section"><span class="cm-l">Description</span><p class="cm-desc">${renderHtml(a.description||'—')}</p></div>
      </div>`;
    overlay.classList.remove('hidden');
    document.getElementById('cm-close')?.addEventListener('click', ()=>overlay.classList.add('hidden'));
    overlay.addEventListener('click', ev=>{ if(ev.target===overlay) overlay.classList.add('hidden'); }, {once:true});
  }

  function renderConclusion() {
    const c = document.getElementById('combat-conclusion'); if (!c) return;
    c.innerHTML = `
      <div class="cm-head"><h3>🏁 Encounter Conclusion</h3><span class="combat-section-hint">pick one action</span></div>
      <div class="concl-actions">
        <button data-concl="draw-mana">Draw Mana <em>+1 Mana</em></button>
        <button data-concl="second-wind">Second Wind <em>Heal 4d4</em></button>
        <button data-concl="treat">Treat Conditions <em>remove 1 effect</em></button>
      </div>
      <p class="concl-note">Per rulebook: RP and Mana do not refresh between turns — only here (Draw Mana) or on a New Encounter.</p>`;
  }

  function handleHp(cmd) {
    if (cmd === 'temp') {
      const v = parseInt(document.getElementById('hp-custom')?.value) || 0;
      if (v > 0) { state.tempHp = Math.max(state.tempHp, v); renderDashboard(); }
      return;
    }
    let amt;
    if (cmd === '+1'||cmd==='+5'||cmd==='+10'||cmd==='-1'||cmd==='-5'||cmd==='-10') amt = parseInt(cmd);
    else amt = parseInt(document.getElementById('hp-custom')?.value) || 0;
    if (!amt) return;
    if (amt < 0) applyDamage(-amt); else applyHeal(amt);
  }

  function applyDamage(amt) {
    if (state.tempHp > 0) { const a = Math.min(state.tempHp, amt); state.tempHp -= a; amt -= a; }
    state.hp = Math.max(-state.maxHp, state.hp - amt); // allow negative for Mortal Wound awareness
    renderDashboard();
    if (window.gsap) gsap.fromTo('#hp-fill', { filter:'brightness(2.2)' }, { filter:'brightness(1)', duration:.5 });
    if (state.hp <= 0) showToast(state.hp <= -state.maxHp ? 'Mortal Wound!' : 'Downed (0 HP)', 'error');
  }
  function applyHeal(amt) { state.hp = Math.min(state.maxHp, state.hp + amt); renderDashboard(); }

  function showToast(msg, type) {
    const t = document.getElementById('eq-toast'); if (!t) return;
    t.textContent = msg; t.style.display = 'block';
    t.className = 'eq-toast toast-' + (type || 'info');
    clearTimeout(t._to); t._to = setTimeout(() => t.style.display = 'none', 2600);
  }

  function bindEvents() {
    document.getElementById('combat-back-btn')?.addEventListener('click', () => location.href = 'index.html');

    const dash = document.getElementById('combat-dashboard');
    dash?.addEventListener('click', (e) => {
      const hpBtn = e.target.closest('[data-hp]');
      if (hpBtn) return handleHp(hpBtn.dataset.hp);
      const manaBtn = e.target.closest('[data-mana]');
      if (manaBtn) {
        const delta = parseInt(manaBtn.dataset.mana);
        state.mana = Math.max(0, Math.min(state.maxMana, state.mana + delta));
        renderDashboard();
        return;
      }
      const pip = e.target.closest('[data-pip]');
      if (pip) {
        const type = pip.dataset.pip, idx = parseInt(pip.dataset.idx);
        // click filled-or-lower → spend down to idx; click empty → restore up to idx+1
        state[type] = idx < state[type] ? idx : Math.min(idx + 1, type === 'ap' ? state.maxAp : state.maxRp);
        renderDashboard(); renderAbilityGrid(); renderBasics();
        return;
      }
    });

    const tc = document.getElementById('combat-turn-controls');
    tc?.addEventListener('click', e => {
      if (e.target.id === 'btn-new-turn') newTurn();
      else if (e.target.id === 'btn-new-encounter') {
        startEncounter(); renderAll(); pulseAp();
        showToast('New encounter — AP, RP, and Mana restored', 'success');
      }
      else if (e.target.id === 'btn-conclusion') {
        const p = document.getElementById('combat-conclusion');
        p?.classList.toggle('hidden');
      }
    });

    document.getElementById('combat-basics')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-basic]'); if (!btn) return;
      const b = BASIC_ACTIONS.find(x => x.name === btn.dataset.basic); if (!b) return;
      if (b.ap) { if (state.ap < b.ap) return showToast('Not enough AP', 'error'); state.ap -= b.ap; }
      else      { if (state.rp < b.rp) return showToast('Not enough RP', 'error'); state.rp -= b.rp; }
      renderDashboard(); renderBasics(); renderAbilityGrid();
      if (window.gsap) gsap.fromTo(btn, { scale:.92 }, { scale:1, duration:.25, ease:'back.out(2)' });
    });

    const cc = document.getElementById('combat-conditions');
    cc?.addEventListener('click', e => {
      if (e.target.id === 'cond-add-btn') {
        const sel = document.getElementById('cond-select');
        const preset = CONDITION_PRESETS.find(p=>p.name===sel.value); if(!preset) return;
        const dur = parseInt(document.getElementById('cond-dur').value) || 0;
        // no-stacking: replace same-name, keep the longer duration
        const existing = state.conditions.find(x=>x.name===preset.name);
        if (existing) existing.duration = Math.max(existing.duration, dur);
        else state.conditions.push({ name:preset.name, icon:preset.icon, duration:dur });
        renderConditions();
        return;
      }
      const chip = e.target.closest('[data-cond-idx]');
      if (chip) { state.conditions.splice(parseInt(chip.dataset.condIdx),1); renderConditions(); }
    });

    const filt = document.getElementById('combat-filters');
    filt?.addEventListener('click', e => { const b=e.target.closest('[data-cf]'); if(b){activeFilter=b.dataset.cf;renderFilters();renderAbilityGrid();}});
    filt?.addEventListener('input', e => { if(e.target.id==='combat-search'){searchQuery=e.target.value;renderAbilityGrid();}});
    const grid = document.getElementById('combat-ability-grid');
    grid?.addEventListener('click', e => {
      const use=e.target.closest('[data-use]'); if(use) return useAbility(use.dataset.use);
      const info=e.target.closest('[data-info]'); const card=e.target.closest('[data-ability]');
      if(info) return showAbilityDetail(info.dataset.info);
      if(card) return showAbilityDetail(card.dataset.ability);
    });

    document.getElementById('combat-conclusion')?.addEventListener('click', e => {
      const b = e.target.closest('[data-concl]'); if (!b) return;
      if (b.dataset.concl==='draw-mana') { state.mana=Math.min(state.maxMana,state.mana+1); renderDashboard(); showToast('Drew 1 Mana','success'); }
      else if (b.dataset.concl==='second-wind') {
        let total=0; for(let i=0;i<4;i++) total+=1+Math.floor(Math.random()*4); // 4d4
        applyHeal(total); showToast(`Second Wind: healed ${total} (4d4)`,'success');
      }
      else if (b.dataset.concl==='treat') {
        if (state.conditions.length){ const removed=state.conditions.shift(); showToast(`Treated: ${removed.name}`,'success'); renderConditions(); }
        else showToast('No conditions to treat','info');
      }
    });
  }

  return { init };
})();

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', CombatScene.init);
else CombatScene.init();
