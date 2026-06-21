/**
 * Lyrian Chronicles - Character Creator
 * Main Application Controller
 *
 * Standalone web app for creating Lyrian Chronicles characters.
 * Uses PixiJS for animated background, GSAP for transitions.
 */

(function() {
  'use strict';

  // HTML escape utility to prevent XSS
  // For data that already contains HTML entities (&nbsp;, &mdash;, etc.),
  // use renderHtml() instead — it escapes dangerous chars but preserves
  // a whitelist of safe named entities from the data files.
  window.escapeHtml = function(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
  };

  /**
   * Render a string that may contain pre-existing HTML entities
   * (&nbsp;, &mdash;, &lsquo;, &rsquo;, &ldquo;, &rdquo;, &hellip;, &copy;, &reg;, &trade;, &bull;, &middot;, &ndash;, &rarr;, &larr;).
   * Escapes < > " ' first, then preserves the safe entity list.
   */
  window.renderHtml = function(str) {
    if (typeof str !== 'string') return '';
    // Escape dangerous characters first
    let escaped = str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
    // Restore safe named entities that were double-encoded
    const safeEntities = ['nbsp', 'mdash', 'ndash', 'lsquo', 'rsquo', 'ldquo', 'rdquo', 'hellip', 'copy', 'reg', 'trade', 'bull', 'middot', 'rarr', 'larr', 'times', 'plusmn', 'frac12', 'frac14', 'frac34', 'sup1', 'sup2', 'sup3', 'circ', 'prime', 'Prime', 'laquo', 'raquo'];
    safeEntities.forEach(entity => {
      escaped = escaped.replace(new RegExp('&amp;' + entity + ';', 'g'), '&' + entity + ';');
    });
    return escaped;
  };


  // ===========================================================================
  // CHARACTER DATA STORE
  // ===========================================================================
  const character = {
    name: '',
    background: '',
    race: null,
    ancestry: null,
    cls: null,
    breakthroughs: [],
    stats: {},
    baseStats: {},
    humanChoices: {},
    raceBonuses: {},
    skills: [],
    gender: '',
    age: '',
    height: '',
    weight: '',
    worships: '',
    clim: 3000,
    exp: 1000,
    ip: 3,
    mirane: true,
    oldArmorCalc: false,
    spiritCore: 0,
    speed: 20
  };

  // ===========================================================================
  // WIZARD STEP DEFINITIONS
  // ===========================================================================
  const STEPS = [
    { id: 'step-identity', name: 'Identity' },
    { id: 'step-race', name: 'Race' },
    { id: 'step-class', name: 'Class' },
    { id: 'step-breakthroughs', name: 'Breakthroughs' },
    { id: 'step-stats', name: 'Stats' },
    { id: 'step-skills', name: 'Skills' },
    { id: 'step-summary', name: 'Summary' }
  ];

  let currentStep = -1; // -1 = intro screen

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================
  async function init() {
    console.log('Lyrian Chronicles Character Creator - Initializing...');

    // Initialize PixiJS background (async)
    if (window.PIXI) {
      await BackgroundScene.init();
    }

    // Initialize scenes
    RaceSelectScene.init();
    ClassSelectScene.init();
    BreakthroughScene.init();
    StatsScene.init();
    SkillsStepScene.init();

    // Animate intro title
    animateIntro();

    // Bind events
    bindEvents();

    console.log('Initialization complete!');
  }

  // ===========================================================================
  // INTRO ANIMATION
  // ===========================================================================
  function animateIntro() {
    if (!window.gsap) return;

    const tl = gsap.timeline();

    tl.fromTo('.title-glow',
      { autoAlpha: 0, y: -30, scale: 0.9 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 1.2, ease: 'power3.out' }
    )
    .fromTo('.subtitle',
      { autoAlpha: 0, y: 20 },
      { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' },
      '-=0.6'
    )
    .fromTo('.intro-text',
      { autoAlpha: 0, y: 20 },
      { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' },
      '-=0.4'
    )
    .fromTo('.btn-glow',
      { autoAlpha: 0, scale: 0.8 },
      { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)' },
      '-=0.2'
    );
  }

  // ===========================================================================
  // EVENT BINDING
  // ===========================================================================
  function bindEvents() {
    // Start button
    const startBtn = document.getElementById('btn-start');
    if (startBtn) {
      startBtn.addEventListener('click', () => goToStep(0));
    }

    // Load saved character button
    const loadBtn = document.getElementById('btn-load-saved');
    if (loadBtn) {
      loadBtn.addEventListener('click', () => {
        if (loadFromLocalStorage()) {
          // Navigate to the saved step — loadStepData will restore scene state
          let savedStep = 0;
          try { savedStep = parseInt(localStorage.getItem(STORAGE_KEY + '-step')) || 0; } catch {}
          goToStep(Math.max(0, Math.min(savedStep, STEPS.length - 1)));
        }
      });
    }

    // Check for saved character on init
    try {
      const savedRaw = localStorage.getItem(STORAGE_KEY);
      if (savedRaw) {
        const loadBtn = document.getElementById('btn-load-saved');
        if (loadBtn) loadBtn.style.display = 'inline-block';
      }
    } catch {
      // localStorage unavailable — silently fail
    }

    // Navigation buttons (delegated)
    document.addEventListener('click', (e) => {
      // Next button
      if (e.target.dataset.action === 'next') {
        goToStep(currentStep + 1);
      }

      // Back button
      if (e.target.dataset.action === 'back') {
        if (currentStep > 0) {
          goToStep(currentStep - 1);
        } else {
          // Save step 0 data before going back to intro
          saveCurrentStepData();
          showIntro();
        }
      }

      // Export button
      if (e.target.id === 'btn-export') {
        SummaryScene.exportJSON(character);
      }

      // Export Excel button
      if (e.target.id === 'btn-export-excel') {
        SummaryScene.exportExcel(character);
      }

      // New character button
      if (e.target.id === 'btn-new-char') {
        resetAll(); // Already clears localStorage and hides load button internally
      }

      // Resource stepper buttons (+/-)
      if (e.target.classList.contains('resource-btn')) {
        const targetId = e.target.dataset.target;
        const action = e.target.dataset.action;
        const input = document.getElementById(targetId);
        if (input) {
          const step = parseInt(input.step) || 1;
          let val = parseInt(input.value) || 0;
          val = action === 'increase' ? val + step : Math.max(0, val - step);
          input.value = val;
        }
      }
    });
  }

  // ===========================================================================
  // NAVIGATION
  // ===========================================================================
  let isTransitioning = false;

  function showIntro() {
    // Hide all steps
    STEPS.forEach(step => {
      document.getElementById(step.id).classList.remove('active');
    });

    // Show intro
    document.getElementById('step-intro').classList.add('active');
    document.getElementById('progress-bar').classList.add('hidden');

    currentStep = -1;

    // Show/hide load button based on saved data (safe localStorage access)
    const loadBtn = document.getElementById('btn-load-saved');
    if (loadBtn) {
      try {
        const hasSaved = localStorage.getItem(STORAGE_KEY);
        loadBtn.style.display = hasSaved ? 'inline-block' : 'none';
      } catch {
        loadBtn.style.display = 'none';
      }
    }

    // Animate intro
    if (window.gsap) {
      gsap.fromTo('.intro-content',
        { autoAlpha: 0, scale: 0.95 },
        { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'power2.out' }
      );
    }
  }

  function goToStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= STEPS.length) return;
    if (isTransitioning) return; // Guard against rapid navigation

    // Save current step data before moving
    saveCurrentStepData();

    isTransitioning = true;

    // Hide current step
    if (currentStep >= 0) {
      const currentEl = document.getElementById(STEPS[currentStep].id);
      if (window.gsap) {
        gsap.to(currentEl, {
          opacity: 0,
          x: -30,
          duration: 0.2,
          ease: 'power2.in',
          onComplete: () => {
            currentEl.classList.remove('active');
            isTransitioning = false;
            showStep(stepIndex);
          }
        });
      } else {
        currentEl.classList.remove('active');
        isTransitioning = false;
        showStep(stepIndex);
      }
    } else {
      // Coming from intro
      document.getElementById('step-intro').classList.remove('active');
      isTransitioning = false;
      showStep(stepIndex);
    }
  }

  function showStep(stepIndex) {
    currentStep = stepIndex;

    // Show progress bar
    document.getElementById('progress-bar').classList.remove('hidden');

    // Show step
    const stepEl = document.getElementById(STEPS[stepIndex].id);
    stepEl.classList.add('active');
    // Clear stale inline styles left by the previous outgoing GSAP animation
    // (opacity: 0, x: -30px, visibility: hidden) so the step is fully visible
    stepEl.style.opacity = '';
    stepEl.style.x = '';
    stepEl.style.visibility = '';

    // Animate in - guard against missing .step-panel
    if (window.gsap) {
      const panel = stepEl.querySelector('.step-panel');
      if (panel) {
        gsap.fromTo(panel,
          { autoAlpha: 0, x: 30 },
          { autoAlpha: 1, x: 0, duration: 0.3, ease: 'power2.out' }
        );
      }
    }

    // Update progress
    updateProgress(stepIndex);

    // Load step data
    loadStepData(stepIndex);
  }

  function updateProgress(stepIndex) {
    // Update progress bar fill
    const fill = document.getElementById('progress-fill');
    if (fill) {
      const percent = ((stepIndex + 1) / STEPS.length) * 100;
      fill.style.width = percent + '%';
    }

    // Update step indicators
    document.querySelectorAll('.progress-steps .step').forEach((el, i) => {
      el.classList.remove('active', 'completed');
      if (i === stepIndex) el.classList.add('active');
      if (i < stepIndex) el.classList.add('completed');
    });
  }

  // ===========================================================================
  // DATA MANAGEMENT
  // ===========================================================================
  function saveCurrentStepData() {
    switch (currentStep) {
      case 0: // Identity
        character.name = (document.getElementById('char-name')?.value || '').trim().slice(0, 50);
        character.background = (document.getElementById('char-background')?.value || '').trim();
        character.gender = (document.getElementById('char-gender')?.value || '').trim().slice(0, 30);
        character.age = (document.getElementById('char-age')?.value || '').trim().slice(0, 10);
        character.height = (document.getElementById('char-height')?.value || '').trim().slice(0, 10);
        character.weight = (document.getElementById('char-weight')?.value || '').trim().slice(0, 15);
        character.worships = (document.getElementById('char-worships')?.value || '').trim().slice(0, 50);
        character.clim = parseInt(document.getElementById('char-clim')?.value) || 3000;
        character.exp = parseInt(document.getElementById('char-exp')?.value) || 1000;
        character.ip = parseInt(document.getElementById('char-ip')?.value) || 3;
        break;
      case 1: // Race
        const raceSel = RaceSelectScene.getSelection();
        character.race = raceSel.race;
        character.ancestry = raceSel.ancestry;
        // Calculate base speed from ancestry traits
        character.speed = calculateBaseSpeed(raceSel.ancestry?.name);
        break;
      case 2: // Class
        character.cls = ClassSelectScene.getSelection();
        character.spiritCore = character.cls?.spiritCore ?? 0;
        break;
      case 3: // Breakthroughs
        character.breakthroughs = BreakthroughScene.getSelection();
        break;
      case 4: // Stats
        character.stats = StatsScene.getStats();
        character.baseStats = StatsScene.getBaseStats();
        character.humanChoices = StatsScene.getHumanChoices();
        character.raceBonuses = StatsScene.getRaceBonuses();
        break;
      case 5: // Skills
        character.skills = SkillsStepScene.getSkills();
        break;
    }

    // Auto-save to localStorage after every step save
    saveToLocalStorage();

    // Update beforeunload warning flag
    updateProgressFlag();
  }

  function loadStepData(stepIndex) {
    switch (stepIndex) {
      case 0: // Identity
        if (character.name) {
          const nameEl = document.getElementById('char-name');
          if (nameEl) nameEl.value = character.name;
        }
        if (character.background) {
          const bgEl = document.getElementById('char-background');
          if (bgEl) bgEl.value = character.background;
        }
        const genderEl = document.getElementById('char-gender');
        if (genderEl) genderEl.value = character.gender || '';
        const ageEl = document.getElementById('char-age');
        if (ageEl) ageEl.value = character.age || '';
        const heightEl = document.getElementById('char-height');
        if (heightEl) heightEl.value = character.height || '';
        const weightEl = document.getElementById('char-weight');
        if (weightEl) weightEl.value = character.weight || '';
        const worshipsEl = document.getElementById('char-worships');
        if (worshipsEl) worshipsEl.value = character.worships || '';
        const climEl = document.getElementById('char-clim');
        if (climEl) climEl.value = character.clim ?? 3000;
        const expEl = document.getElementById('char-exp');
        if (expEl) expEl.value = character.exp ?? 1000;
        const ipEl = document.getElementById('char-ip');
        if (ipEl) ipEl.value = character.ip ?? 3;
        break;
      case 1: // Race - restore saved selection
        // Restore race/ancestry selection
        if (character.race) {
          RaceSelectScene.restoreState(character.race, character.ancestry);
        }
        break;
      case 2: // Class - restore saved selection
        if (character.ip !== undefined) {
          ClassSelectScene.setStartingIp(character.ip);
        }
        if (character.exp !== undefined) {
          ClassSelectScene.setStartingExp(character.exp);
        }
        // Restore class selection
        if (character.cls) {
          ClassSelectScene.restoreState(character.cls);
        } else {
          ClassSelectScene.refresh();
        }
        break;
      case 3: // Breakthroughs - restore saved selection
        if (character.breakthroughs && character.breakthroughs.length > 0) {
          BreakthroughScene.restoreState(character.breakthroughs);
        } else {
          BreakthroughScene.refresh();
        }
        break;
      case 4: // Stats - restore saved assignments
        if (character.race) {
          StatsScene.setRaceData(character.race.name);
        }
        // Restore stat assignments instead of resetting
        if (character.baseStats && Object.keys(character.baseStats).length > 0) {
          StatsScene.restoreState(
            character.stats,
            character.baseStats,
            character.humanChoices,
            character.raceBonuses,
            character.race?.name
          );
        } else {
          StatsScene.init();
        }
        break;
      case 5: // Skills - restore saved allocations
        SkillsStepScene.setCharacterData({
          race: character.race,
          ancestry: character.ancestry,
          cls: character.cls,
          breakthroughs: character.breakthroughs
        });
        // Restore skill allocations
        if (character.skills && character.skills.length > 0) {
          SkillsStepScene.restoreState(character.skills);
        }
        break;
      case 6: // Summary
        SummaryScene.render(character);
        break;
    }
  }

  // ===========================================================================
  // RESET
  // ===========================================================================
  async function resetAll() {
    // Clear character data
    character.name = '';
    character.background = '';
    character.race = null;
    character.ancestry = null;
    character.cls = null;
    character.breakthroughs = [];
    character.stats = {};
    character.baseStats = {};
    character.raceBonuses = {};
    character.skills = [];
    character.gender = '';
    character.age = '';
    character.height = '';
    character.weight = '';
    character.worships = '';
    character.clim = 3000;
    character.exp = 1000;
    character.ip = 3;
    character.mirane = true;
    character.oldArmorCalc = false;
    character.spiritCore = 0;
    character.humanChoices = {};
    character.speed = 20;

    // Reset scenes
    RaceSelectScene.reset();
    ClassSelectScene.reset();
    BreakthroughScene.reset();
    StatsScene.reset();
    SkillsStepScene.reset();
    SummaryScene.reset();

    // Destroy PixiJS background
    BackgroundScene.destroy();

    // Reset form fields
    const nameInput = document.getElementById('char-name');
    if (nameInput) nameInput.value = '';
    const bgInput = document.getElementById('char-background');
    if (bgInput) bgInput.value = '';
    const genderInput = document.getElementById('char-gender');
    if (genderInput) genderInput.value = '';
    const ageInput = document.getElementById('char-age');
    if (ageInput) ageInput.value = '';
    const heightInput = document.getElementById('char-height');
    if (heightInput) heightInput.value = '';
    const weightInput = document.getElementById('char-weight');
    if (weightInput) weightInput.value = '';
    const worshipsInput = document.getElementById('char-worships');
    if (worshipsInput) worshipsInput.value = '';
    const climInput = document.getElementById('char-clim');
    if (climInput) climInput.value = '3000';
    const expInput = document.getElementById('char-exp');
    if (expInput) expInput.value = '1000';
    const ipInput = document.getElementById('char-ip');
    if (ipInput) ipInput.value = '3';

    // Re-initialize PixiJS background BEFORE showing intro (avoid flash)
    if (window.PIXI) {
      await BackgroundScene.init();
    }

    // Go to intro
    showIntro();

    // Re-initialize scenes that need event re-binding after reset
    // (reset() clears internal state like previewEventsBound but doesn't re-bind)
    ClassSelectScene.init();
    StatsScene.init();
    SkillsStepScene.init();

    // Clear saved character
    clearLocalStorage();
    const loadBtn = document.getElementById('btn-load-saved');
    if (loadBtn) loadBtn.style.display = 'none';

    // Clear beforeunload warning flag since character is reset
    updateProgressFlag();
  }

  // ===========================================================================
  // CHARACTER DATA ACCESSOR (for scenes to check eligibility)
  // ===========================================================================
  window.getCharacterData = function() {
    return {
      race: character.race ? { ...character.race } : null,
      ancestry: character.ancestry ? { ...character.ancestry } : null,
      cls: character.cls ? structuredClone(character.cls) : null,
      breakthroughs: character.breakthroughs ? [...character.breakthroughs] : []
    };
  };

  // ===========================================================================
  // LOCAL STORAGE PERSISTENCE (auto-save / manual load)
  // ===========================================================================
  const STORAGE_KEY = 'lyrian-chronicles-character';

  function saveToLocalStorage() {
    try {
      const data = {
        ...character,
        _step: currentStep,
        _timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(STORAGE_KEY + '-step', String(currentStep));
    } catch (e) {
      // quota exceeded or private browsing — silently fail
      console.warn('[App] Could not save to localStorage:', e.message);
    }
  }

  function loadFromLocalStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      // Restore character data
      Object.keys(character).forEach(key => {
        if (data[key] !== undefined) {
          character[key] = data[key];
        }
      });
      return true;
    } catch (e) {
      console.warn('[App] Could not load from localStorage:', e.message);
      return false;
    }
  }

  function clearLocalStorage() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY + '-step');
    } catch {
      // ignore
    }
    // Clear in-memory filter guards so re-init can re-bind
    delete window._btFiltersBound;
  }

  // ===========================================================================
  // BEFOREUNLOAD WARNING (prevent accidental tab close with unsaved progress)
  // ===========================================================================
  let hasCharacterProgress = false;
  let beforeunloadBound = false;

  function updateProgressFlag() {
    const name = character.name;
    const hasRace = !!character.race;
    const hasClass = !!character.cls && !!character.cls.primary;
    const hadProgress = hasCharacterProgress;
    hasCharacterProgress = !!(name || hasRace || hasClass);
    if (hasCharacterProgress && !hadProgress && !beforeunloadBound) {
      window.addEventListener('beforeunload', beforeUnloadHandler);
      beforeunloadBound = true;
    } else if (!hasCharacterProgress && hadProgress && beforeunloadBound) {
      window.removeEventListener('beforeunload', beforeUnloadHandler);
      beforeunloadBound = false;
    }
  }

  function beforeUnloadHandler(e) {
    if (hasCharacterProgress) {
      e.preventDefault();
      e.returnValue = ''; // Required for Chrome
    }
  }

  // updateProgressFlag is called from saveCurrentStepData() and resetAll().

  // ===========================================================================
  // BOOT
  // ===========================================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
