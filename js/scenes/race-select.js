/**
 * Lyrian Chronicles - Race Selection Scene
 * Handles primary race and ancestry (subrace) selection with images
 */

/* exported RaceSelectScene */
const RaceSelectScene = (function() {
  let selectedRace = null;
  let selectedAncestry = null;
  let imageTimeouts = []; // Track image load timeouts for cleanup

  /**
   * Decode HTML entities for textContent display.
   * Data files contain &nbsp;, &mdash;, etc. which should display as actual characters.
   */
  function decodeHtmlEntities(str) {
    if (typeof str !== 'string') return '';
    const textarea = document.createElement('textarea');
    textarea.innerHTML = str;
    const result = textarea.value;
    textarea.innerHTML = ''; // Clear to prevent script execution
    return result;
  }

  function init() {
    renderRaces();
  }

  /**
   * Generate Angel's Sword website URL for a primary race.
   */
  function getRaceUrl(race) {
    const slugMap = {
      'Chimera': 'chimera',
      'Demon': 'demon',
      'Fae': 'fae',
      'Human': 'human',
      'Youkai': 'youkai'
    };
    const slug = slugMap[race.name];
    return slug ? `https://rpg.angelssword.com/game/0.13.0/races/primary/${slug}` : null;
  }

  /**
   * Generate Angel's Sword website URL for an ancestry (subrace).
   * Demon clans (house-*) don't have individual pages, so link to primary Demon page.
   */
  function getAncestryUrl(anc) {
    if (!anc.ancestryId) return null;
    // Demon clans don't have individual pages on the website
    if (anc.ancestryId.startsWith('house-')) {
      return 'https://rpg.angelssword.com/game/0.13.0/races/primary/demon';
    }
    return `https://rpg.angelssword.com/game/0.13.0/races/secondary/${anc.ancestryId}`;
  }

  function renderRaces() {
    const container = document.getElementById('race-cards');
    if (!container) return;
    container.innerHTML = '';

    RACE_DATA.forEach((race) => {
      const card = document.createElement('div');
      card.className = 'card race-card';
      card.dataset.race = race.id;

      // Image
      let imgEl;
      if (race.image) {
        imgEl = document.createElement('img');
        imgEl.className = 'race-card-image';
        imgEl.alt = race.name;
        // No loading='lazy' — eager load so the timeout below doesn't fire prematurely.
        let loaded = false;
        imgEl.onload = () => {
          loaded = true;
          if (!imgEl.naturalWidth || !imgEl.naturalHeight) {
            imgEl.style.display = 'none';
            const fallback = document.createElement('div');
            fallback.className = 'race-card-image no-image';
            fallback.textContent = race.name.charAt(0);
            imgEl.parentNode.replaceChild(fallback, imgEl);
          }
        };
        imgEl.onerror = () => {
          loaded = true;
          imgEl.style.display = 'none';
          const fallback = document.createElement('div');
          fallback.className = 'race-card-image no-image';
          fallback.textContent = race.name.charAt(0);
          imgEl.parentNode.replaceChild(fallback, imgEl);
        };
        // 8s fallback timeout (increased from 3s for slow CDN / connection limits)
        const timeoutId = setTimeout(() => {
          if (!loaded && imgEl.parentNode) {
            imgEl.style.display = 'none';
            const fallback = document.createElement('div');
            fallback.className = 'race-card-image no-image';
            fallback.textContent = race.name.charAt(0);
            imgEl.parentNode.replaceChild(fallback, imgEl);
          }
        }, 8000);
        imageTimeouts.push(timeoutId);
        imgEl.src = race.image;
      } else {
        imgEl = document.createElement('div');
        imgEl.className = 'race-card-image no-image';
        imgEl.textContent = race.name.charAt(0);
      }

      // Content
      const content = document.createElement('div');
      content.className = 'race-card-content';

      const name = document.createElement('h3');
      name.textContent = race.name;

      const type = document.createElement('span');
      type.className = 'race-type';
      type.textContent = 'Primary Race';

      const desc = document.createElement('p');
      desc.className = 'race-desc';
      desc.textContent = decodeHtmlEntities(race.description ? race.description.substring(0, 120) + '...' : '');

      const details = document.createElement('a');
      details.className = 'race-details-btn';
      details.href = getRaceUrl(race);
      details.target = '_blank';
      details.rel = 'noopener noreferrer';
      details.textContent = 'See details';
      details.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      content.appendChild(name);
      content.appendChild(type);
      content.appendChild(desc);
      content.appendChild(details);

      card.appendChild(imgEl);
      card.appendChild(content);

      card.addEventListener('click', () => selectRace(race));

      container.appendChild(card);
    });

    // Animate cards
    if (window.gsap) {
      gsap.fromTo(container.querySelectorAll('.race-card'),
        { autoAlpha: 0, y: 30 },
        { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.1, ease: 'power2.out' }
      );
    }
  }

  function selectRace(race) {
    selectedRace = race;
    selectedAncestry = null;

    // Update card selection
    document.querySelectorAll('#race-cards .card').forEach((card) => {
      card.classList.toggle('selected', card.dataset.race === race.id);
    });

    // Show ancestry section
    const ancestrySection = document.getElementById('race-ancestry-section');
    if (ancestrySection) ancestrySection.classList.remove('hidden');

    // Render ancestries for this race
    renderAncestries(race);

    // Update summary
    updateRaceSummary();

    // Animate ancestry section
    if (window.gsap) {
      gsap.fromTo(ancestrySection, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.4 });
    }
  }

  function renderAncestries(race) {
    const ancestries = ANCESTRY_MAP[race.name] || [];
    const instruction = document.getElementById('ancestry-instruction');
    const container = document.getElementById('ancestry-cards');
    const heading = document.getElementById('ancestry-heading');
    if (!container) return;
    container.innerHTML = '';

    // Update heading based on race
    if (heading) {
      if (race.name === 'Demon') {
        heading.textContent = 'House';
      } else {
        heading.textContent = 'Ancestry (Subrace)';
      }
    }

    if (ancestries.length === 0) {
      if (instruction) {
        instruction.textContent = `No subraces available for ${race.name}. Your selection is complete.`;
        instruction.classList.remove('hidden');
      }
      container.classList.add('hidden');
      // Enable next button since no ancestry needed
      const nextBtn = document.getElementById('btn-race-next');
      if (nextBtn) nextBtn.disabled = false;
      return;
    }

    if (instruction) {
      instruction.textContent = `Choose an ancestry (subrace) for your ${race.name} for additional traits.`;
      instruction.classList.remove('hidden');
    }
    container.classList.remove('hidden');

    ancestries.forEach((anc) => {
      const card = document.createElement('div');
      card.className = 'card ancestry-card';
      card.dataset.ancestry = anc.ancestryId;

      // Image
      let imgEl;
      if (anc.image) {
        imgEl = document.createElement('img');
        imgEl.className = 'ancestry-card-image';
        imgEl.alt = anc.name;
        // No loading='lazy' — eager load so the timeout below doesn't fire prematurely.
        let loaded = false;
        imgEl.onload = () => {
          loaded = true;
          if (!imgEl.naturalWidth || !imgEl.naturalHeight) {
            imgEl.style.display = 'none';
            const fallback = document.createElement('div');
            fallback.className = 'ancestry-card-image no-image';
            fallback.textContent = anc.name.charAt(0);
            imgEl.parentNode.replaceChild(fallback, imgEl);
          }
        };
        imgEl.onerror = () => {
          loaded = true;
          imgEl.style.display = 'none';
          const fallback = document.createElement('div');
          fallback.className = 'ancestry-card-image no-image';
          fallback.textContent = anc.name.charAt(0);
          imgEl.parentNode.replaceChild(fallback, imgEl);
        };
        // 8s fallback timeout (increased from 3s for slow CDN / connection limits)
        const timeoutId = setTimeout(() => {
          if (!loaded && imgEl.parentNode) {
            imgEl.style.display = 'none';
            const fallback = document.createElement('div');
            fallback.className = 'ancestry-card-image no-image';
            fallback.textContent = anc.name.charAt(0);
            imgEl.parentNode.replaceChild(fallback, imgEl);
          }
        }, 8000);
        imageTimeouts.push(timeoutId);
        imgEl.src = anc.image;
      } else {
        imgEl = document.createElement('div');
        imgEl.className = 'ancestry-card-image no-image';
        imgEl.textContent = anc.name.charAt(0);
      }

      const name = document.createElement('h4');
      name.textContent = anc.name;

      const desc = document.createElement('p');
      desc.className = 'ancestry-desc';
      desc.textContent = decodeHtmlEntities(anc.description ? anc.description.substring(0, 100) + '...' : '');

      const details = document.createElement('a');
      details.className = 'race-details-btn';
      details.href = getAncestryUrl(anc);
      details.target = '_blank';
      details.rel = 'noopener noreferrer';
      details.textContent = 'See details';
      details.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      card.appendChild(imgEl);
      card.appendChild(name);
      card.appendChild(desc);
      card.appendChild(details);

      card.addEventListener('click', () => selectAncestry(anc));

      container.appendChild(card);
    });

    // Disable next until ancestry selected
    const nextBtn = document.getElementById('btn-race-next');
    if (nextBtn) nextBtn.disabled = true;
  }

  function selectAncestry(anc) {
    selectedAncestry = anc;

    // Update card selection
    document.querySelectorAll('.ancestry-card').forEach((card) => {
      card.classList.toggle('selected', card.dataset.ancestry === anc.ancestryId);
    });

    // Enable next button
    const nextBtn = document.getElementById('btn-race-next');
    if (nextBtn) nextBtn.disabled = false;

    // Update summary
    updateRaceSummary();
  }

  function updateRaceSummary() {
    const summary = document.getElementById('race-summary');
    if (!selectedRace && !selectedAncestry) {
      summary.classList.add('hidden');
      return;
    }

    let html = '<h4>Selected Race</h4>';

    // Primary race info
    if (selectedRace) {
      html += `<div class="summary-row"><span class="summary-label">Race</span><span class="summary-value">${window.escapeHtml(selectedRace.name)}</span></div>`;
      if (selectedRace.attributes) {
        html += `<div class="summary-row"><span class="summary-label">Race Attributes</span><span class="summary-value">${window.renderHtml(selectedRace.attributes)}</span></div>`;
      }
      if (selectedRace.proficiencies && selectedRace.proficiencies.length) {
        const profList = Array.isArray(selectedRace.proficiencies)
          ? selectedRace.proficiencies.map(p => window.escapeHtml(p)).join(', ')
          : selectedRace.proficiencies;
        html += `<div class="summary-row"><span class="summary-label">Proficiencies</span><span class="summary-value">${profList}</span></div>`;
      }
    }

    // Ancestry (subrace) or House info
    const isDemon = selectedRace && selectedRace.name === 'Demon';
    const ancestryLabel = isDemon ? 'House' : 'Ancestry';
    if (selectedAncestry) {
      html += `<div class="summary-row" style="margin-top: 0.5rem; border-top: 1px solid var(--border-color); padding-top: 0.5rem;"><span class="summary-label">${ancestryLabel}</span><span class="summary-value">${window.escapeHtml(selectedAncestry.name)}</span></div>`;
      if (selectedAncestry.attributes) {
        html += `<div class="summary-row"><span class="summary-label">${ancestryLabel} Traits</span><span class="summary-value">${window.renderHtml(selectedAncestry.attributes)}</span></div>`;
        // Render each trait as a clickable dropdown
        const traits = typeof selectedAncestry.attributes === 'string'
          ? selectedAncestry.attributes.split(',').map(t => t.trim()).filter(Boolean)
          : [];
        traits.forEach(trait => {
          const descDb = typeof TRAIT_DESCRIPTIONS !== 'undefined' ? TRAIT_DESCRIPTIONS : {};
          const desc = descDb[trait];
          const descText = desc ? window.renderHtml(desc) : '<em>No description available.</em>';
          html += `<details class="trait-dropdown">
            <summary class="trait-dropdown-summary">${window.escapeHtml(trait)}</summary>
            <div class="trait-dropdown-content">${descText}</div>
          </details>`;
        });
      }
      if (selectedAncestry.proficiencies && selectedAncestry.proficiencies.length) {
        const profList = Array.isArray(selectedAncestry.proficiencies)
          ? selectedAncestry.proficiencies.map(p => window.escapeHtml(p)).join(', ')
          : selectedAncestry.proficiencies;
        html += `<div class="summary-row"><span class="summary-label">Proficiencies</span><span class="summary-value">${profList}</span></div>`;
      }
    } else if (selectedRace) {
      // No ancestry available or needed — show a note
      const ancestries = ANCESTRY_MAP[selectedRace.name] || [];
      if (ancestries.length === 0) {
        html += `<div class="summary-row" style="margin-top: 0.5rem; border-top: 1px solid var(--border-color); padding-top: 0.5rem;"><span class="summary-label">${ancestryLabel}</span><span class="summary-value" style="color: var(--text-muted); font-style: italic;">None available</span></div>`;
      }
    }

    summary.innerHTML = html;
    summary.classList.remove('hidden');
  }

  function showRaceDetails(race) {
    const overlay = document.getElementById('class-modal-overlay');
    const content = document.getElementById('class-modal-content');
    if (!overlay || !content) return;

    let html = `<div class="modal-header">
      <h3>${window.escapeHtml(race.name)}</h3>
      <button class="modal-close" type="button">&times;</button>
    </div>
    <div class="modal-body">
      <p>${window.renderHtml(race.description)}</p>
      ${race.attributes ? `<div style="margin-top: 1rem;"><strong>Attributes:</strong> ${window.renderHtml(race.attributes)}</div>` : ''}
      ${race.traits ? `<div style="margin-top: 0.5rem;"><strong>Traits:</strong> ${window.renderHtml(race.traits)}</div>` : ''}
    </div>`;

    content.innerHTML = html;
    overlay.classList.remove('hidden');

    // Bind close button
    const closeBtn = content.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        overlay.classList.add('hidden');
      });
    }

    // Bind overlay background click to close
    const closeOnOverlay = (e) => {
      if (e.target === overlay) {
        overlay.classList.add('hidden');
        overlay.removeEventListener('click', closeOnOverlay);
      }
    };
    overlay.addEventListener('click', closeOnOverlay);
  }

  function getSelection() {
    return { race: selectedRace, ancestry: selectedAncestry };
  }

  function reset() {
    // Clear pending image timeouts
    imageTimeouts.forEach(id => clearTimeout(id));
    imageTimeouts = [];

    selectedRace = null;
    selectedAncestry = null;
    const raceCards = document.getElementById('race-cards');
    if (raceCards) raceCards.innerHTML = '';
    const ancestrySection = document.getElementById('race-ancestry-section');
    if (ancestrySection) ancestrySection.classList.add('hidden');
    const summary = document.getElementById('race-summary');
    if (summary) {
      summary.classList.add('hidden');
      summary.innerHTML = '';
    }
    const nextBtn = document.getElementById('btn-race-next');
    if (nextBtn) nextBtn.disabled = true;
    renderRaces();
  }

  /**
   * Restore a previously saved race/ancestry selection.
   * Called when navigating back to this step or loading from localStorage.
   */
  function restoreState(raceData, ancestryData) {
    if (!raceData) return;

    // Look up race from RACE_DATA by id or name
    const race = RACE_DATA.find(r => r.id === raceData.id || r.name === raceData.name);
    if (!race) return;

    // Select the race (this renders ancestries)
    selectRace(race);

    // If ancestry was saved, select it after ancestries are rendered
    if (ancestryData) {
      const anc = (ANCESTRY_MAP[race.name] || []).find(a =>
        a.id === ancestryData.id || a.ancestryId === ancestryData.ancestryId || a.name === ancestryData.name
      );
      if (anc) {
        // renderAncestries() is synchronous, so cards are already in DOM
        selectAncestry(anc);
      }
    }
  }

  return { init, getSelection, reset, restoreState };
})();
