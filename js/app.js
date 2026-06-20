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
  window.escapeHtml = function(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
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
    pureHuman: false,
    slowStarter: false,
    starterIp: '',
    mirane: true,
    oldArmorCalc: false,
    spiritCore: 0
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
        resetAll();
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
        break;
      case 1: // Race
        const raceSel = RaceSelectScene.getSelection();
        character.race = raceSel.race;
        character.ancestry = raceSel.ancestry;
        character.pureHuman = document.getElementById('pure-human')?.checked || false;
        character.slowStarter = document.getElementById('slow-starter')?.checked || false;
        character.starterIp = (document.getElementById('starter-ip')?.value || '').trim();
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
        break;
      case 1: // Race - data already in scene state, no reload needed
        const pureHumanEl = document.getElementById('pure-human');
        if (pureHumanEl) pureHumanEl.checked = character.pureHuman || false;
        const slowStarterEl = document.getElementById('slow-starter');
        if (slowStarterEl) slowStarterEl.checked = character.slowStarter || false;
        const starterIpEl = document.getElementById('starter-ip');
        if (starterIpEl) starterIpEl.value = character.starterIp || '';
        break;
      case 2: // Class - refresh grid to reflect updated race
        ClassSelectScene.refresh();
        break;
      case 3: // Breakthroughs - refresh grid to reflect updated class/race
        BreakthroughScene.refresh();
        break;
      case 4: // Stats - set race data for racial bonuses
        if (character.race) {
          StatsScene.setRaceData(character.race.name);
        }
        StatsScene.init();
        break;
      case 5: // Skills - update with character data for multi-source calculation
        SkillsStepScene.setCharacterData({
          race: character.race,
          ancestry: character.ancestry,
          cls: character.cls,
          breakthroughs: character.breakthroughs
        });
        break;
      case 6: // Summary
        SummaryScene.render(character);
        break;
    }
  }

  // ===========================================================================
  // RESET
  // ===========================================================================
  function resetAll() {
    // Clear character data
    character.name = '';
    character.background = '';
    character.race = null;
    character.ancestry = null;
    character.cls = null;
    character.breakthroughs = [];
    character.stats = {};
    character.skills = [];
    character.gender = '';
    character.age = '';
    character.height = '';
    character.weight = '';
    character.worships = '';
    character.clim = 3000;
    character.pureHuman = false;
    character.slowStarter = false;
    character.starterIp = '';
    character.mirane = true;
    character.oldArmorCalc = false;
    character.spiritCore = 0;

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
    const pureHumanInput = document.getElementById('pure-human');
    if (pureHumanInput) pureHumanInput.checked = false;
    const slowStarterInput = document.getElementById('slow-starter');
    if (slowStarterInput) slowStarterInput.checked = false;
    const starterIpInput = document.getElementById('starter-ip');
    if (starterIpInput) starterIpInput.value = '';

    // Re-initialize PixiJS background BEFORE showing intro (avoid flash)
    if (window.PIXI) {
      BackgroundScene.init();
    }

    // Go to intro
    showIntro();
  }

  // ===========================================================================
  // CHARACTER DATA ACCESSOR (for scenes to check eligibility)
  // ===========================================================================
  window.getCharacterData = function() {
    // Save latest data before returning
    saveCurrentStepData();
    return {
      race: character.race,
      ancestry: character.ancestry,
      cls: character.cls,
      breakthroughs: character.breakthroughs
    };
  };

  // ===========================================================================
  // BOOT
  // ===========================================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
