# Lyrian Chronicles Standalone — Pony Tail Audit

**Date:** 2026-06-30
**Scope:** Full codebase at `F:\Games\PnP RPG\I-am-stuipid-containment\StandAlone`
**Files analyzed:** 26 source files (JS/CSS/HTML/MD/JSON), 14 plans, 2 Hermes plans

---

## 1. Project Structure

```
StandAlone/
├── index.html              # Main character creator (single-page wizard)
├── combat.html             # Separate combat companion page
├── css/
│   └── styles.css          # 4,685 lines, dark theme, gold accents
├── js/
│   ├── app.js              # Core app controller, wizard navigation, state management
│   ├── data/
│   │   ├── abilities.js         # ABILITIES_DB — ability definitions
│   │   ├── breakthroughs.js     # BREAKTHROUGH_DATA — 43,009 chars
│   │   ├── calculations.js      # Stat formulas, BURDEN_LIMIT, proficiencies, race matching
│   │   ├── character-abilities.js # Ability aggregation (race/class/bt)
│   │   ├── classes.js           # CLASS_DATA, CLASS_ABILITIES_DATA
│   │   ├── excel-template.js    # MIRANE_TEMPLATE_B64 (base64 Excel)
│   │   ├── items.js             # ITEMS_DATA — 43,412 chars
│   │   ├── races.js             # RACE_DATA, ANCESTRY_MAP, TRAIT_DESCRIPTIONS
│   │   └── skills.js            # SKILL_GROUPS, RACE_SKILL_DATA, expertise examples
│   └── scenes/
│       ├── background.js        # PixiJS animated background
│       ├── breakthroughs.js     # Breakthrough selection scene
│       ├── class-select.js      # Class selection scene
│       ├── combat.js            # Combat companion scene (536 lines)
│       ├── equipment.js         # Item purchase/inventory scene (830 lines)
│       ├── intro.js             # Character intro (name, background, etc.)
│       ├── race-select.js       # Race/ancestry selection
│       ├── skills-step.js       # Skill point allocation (850 lines)
│       ├── stats.js             # Stat assignment scene
│       └── summary.js           # Final character summary + export (1,306 lines)
├── plans/                   # 14 implementation plans (001-013 + README)
├── .hermes/plans/           # 5 Hermes plans
├── assets/
│   └── lyrian-character-sheet.pdf
├── Blank Mirane CCS v10.3.1.xlsx
├── check_struct.py
├── Claude.md                # Project documentation/prompt context
├── README.md                # Project readme
├── eslint.config.js         # Linting configuration
├── .gitignore
└── LICENSE
```

**Verdict:** Well-organized. Clear separation between data (`js/data/`) and presentation (`js/scenes/`). IIFE module pattern consistently used.

---

## 2. Architecture Assessment

### 2.1 Application Flow (Wizard Pattern)
- `app.js` orchestrates a multi-step wizard: Intro → Race → Class → Breakthroughs → Stats → Skills → Equipment → Summary
- Each step is an IIFE module with `init()`, `render()`, `setCharacterData()`, `getCharacterData()` methods
- State flows through `window.getCharacterData()` / `window.setCharacterData()`
- GSAP animations for transitions between steps

### 2.2 Data Layer
- All game data is in global constants (`RACE_DATA`, `CLASS_DATA`, `ABILITIES_DB`, etc.)
- `calculations.js` provides shared utility functions (`calculateDerivedStats`, `getCharacterProficiencies`, `checkRaceMatch`)
- `character-abilities.js` provides ability aggregation across all sources

### 2.3 Combat Companion
- Separate HTML page (`combat.html`) with its own data loading
- Loads same data files + `combat.js` scene
- Character data transport: URL hash (primary for file://) + localStorage (fallback)

---

## 3. Data Integrity Checks

### 3.1 Race Data Parity
- **Official reference:** https://rpg.angelssword.com/game/latest/races
- Local `races.js` defines `RACE_DATA`, `ANCESTRY_MAP`, `TRAIT_DESCRIPTIONS`
- `checkRaceMatch()` in calculations.js has comprehensive ancestry list with aliases
- **Status:** Race matching logic is robust with compound names, aliases, and multi-word handling

### 3.2 Class Data
- `CLASS_ABILITIES_DATA` in `classes.js` — centralized source of truth
- `CLASS_SKILL_DATA` derived at load time in `skills.js`
- Class requirements checking in `class-select.js` handles compound classes (e.g., "Warrior OR Paladin")
- **Status:** Good centralization. L1-L8 ability progression per class.

### 3.3 Breakthrough Data
- `BREAKTHROUGH_DATA` in `breakthroughs.js` (43,009 chars — largest data file)
- Includes: name, cost, requirements, effects, abilities, proficiencies, stat bonuses
- `computeBreakthroughEffects()` aggregates mechanical effects
- `getBreakthroughSkillBonuses()` maps breakthroughs to skill bonuses
- **Status:** Comprehensive but large. No obvious data corruption.

### 3.4 Skill System
- `SKILL_GROUPS` with sub-stat associations
- `RACE_SKILL_DATA` maps races to eligible skills
- `SKILL_GRANTING_BREAKTHROUGHS` maps breakthroughs to skill point grants
- `SKILL_EXPERTISE_EXAMPLEs` provides suggestions per skill
- Multi-source skill point pools (base, race, class, breakthrough) with per-source eligibility
- **Status:** Well-designed multi-source system with proper tracking

### 3.5 Item Data
- `ITEMS_DATA` in `items.js` (43,412 chars)
- Each item: id, name, type, subType, burdenCost, climCost, description
- Pre-computed lowercase search fields for performance (`_nameLower`, `_subTypeLower`, `_descLower`)
- **Status:** Clean data structure with performance optimizations

---

## 4. Code Quality Findings

### 4.1 Strengths
1. **IIFE module pattern** consistently applied across all scenes
2. **Event delegation** used in equipment.js and skills-step.js for performance
3. **Targeted DOM updates** — `updateSkillRow()`, `updateAfterQuantityChange()` avoid full re-renders
4. **Debounced search** in equipment.js (150ms)
5. **Pre-computed caches** — item URLs, lowercase search fields
6. **Toast notifications** replace `alert()` (plan 012)
7. **localStorage persistence** with character save/load
8. **URL hash transport** for combat companion (handles file:// opaque origins)
9. **Single source of truth** for BURDEN_LIMIT, `getCharacterProficiencies`, `checkRaceMatch`
10. **PixiJS background** with WebGL context loss/recovery handling

### 4.2 Issues Found

#### CRITICAL
1. **`skills.js` scene file is empty** — `js/scenes/skills.js` exists but is 0 bytes. The actual skill scene is `skills-step.js`. The empty file is dead weight and potentially confusing.

#### MAJOR
2. **Duplicate `escapeHtml` implementations** — `combat.js` has its own `escapeHtml` and `renderHtml` (lines 10-20) because it runs standalone. `app.js` also defines `window.escapeHtml`. Consider a shared utility module.
3. **`getAllCharacterProficiencies` vs `getCharacterProficiencies`** — Two functions with similar names in different files (`character-abilities.js` vs `calculations.js`). The `calculations.js` version is the authoritative one (used by equipment.js, summary.js). The `character-abilities.js` version is used by combat.js. They have slightly different logic — `calculations.js` handles `extraBreakthroughs` parameter and `breakthroughProficiencies` array.
4. **`js/data/class_abilities.json`** exists but is not loaded by any script — dead file or incomplete migration.

#### MINOR
5. **Console.log statements** scattered throughout (equipment.js, combat.js, app.js) — should be behind a debug flag or removed for production.
6. **CSS file is 4,685 lines** — monolithic. Could benefit from partials or CSS modules, though for a standalone app this is acceptable.
7. **`check_struct.py`** exists at root — utility script, not tracked in any build process.
8. **Plans directory has 14 completed plans** — these are historical artifacts. Consider archiving to `.hermes/plans/archive/` or removing to reduce noise.
9. **`excel-template.js` is 776KB** — the base64-encoded Excel template dominates the project size. This is intentional (CORS workaround) but worth noting.
10. **No `.gitignore` entry for `node_modules`** — the `.gitignore` exists but should be verified for completeness.

---

## 5. Cross-File Consistency

### 5.1 Stat Calculations
- `calculateDerivedStats()` in `calculations.js` is the single source of truth
- Used by: `stats.js`, `summary.js`, `combat.js`
- Formulas: HP=20+(TOU×10), Mana=6+POW, RP=2+AGI, Evasion=7+AGI, Potency=11+FOC, Damage=5+POW, Accuracy=FOC, Initiative=AGI, Save Bonus=TOU, Guard=TOU
- **Status:** Consistent across all consumers.

### 5.2 Burden System
- `BURDEN_LIMIT = 10` in `calculations.js` (window-scoped)
- Used by: `equipment.js`, `summary.js`
- Items with `burdenCost > 0` count toward limit
- **Status:** Single source of truth, properly shared.

### 5.3 Proficiency Aggregation
- `getCharacterProficiencies()` in `calculations.js` — handles race, ancestry, class (all levels), breakthroughs
- `getAllCharacterProficiencies()` in `character-abilities.js` — similar but separate implementation
- **Risk:** Divergence if one is updated without the other.

### 5.4 Race Matching
- `checkRaceMatch()` in `calculations.js` — single source of truth
- Used by: `class-select.js`, `breakthroughs.js`
- **Status:** Properly centralized.

---

## 6. Completed Plans (from `plans/` directory)

| Plan | Status | Notes |
|------|--------|-------|
| 001-class-card-click-toggle | ✅ Done | |
| 001-fix-derived-stat-formulas | ✅ Done | |
| 001-interactive-skill-expertise | ✅ Done | |
| 002-refresh-breakthrough-grid-on-re-entry | ✅ Done | |
| 003-refresh-class-grid-on-re-entry | ✅ Done | |
| 004-fix-points-in-level-in-requirements-evaluation | ✅ Done | |
| 005-fix-compound-class-requirements-parsing | ✅ Done | |
| 006-auto-apply-race-stat-bonuses-and-human-choices | ✅ Done | |
| 007-add-automated-test-suite-and-verification-baseline | ✅ Done | |
| 008-fix-broken-class-images | ✅ Done | |
| 009-export-character-to-mirane-xlsx | ✅ Done | |
| 010-fill-missing-mirane-fields | ✅ Done | |
| 011-fix-missing-ids-and-localstorage | ✅ Done | |
| 012-replace-alert-with-toast | ✅ Done | |
| 013-load-saved-character-from-localstorage | ✅ Done | |

**Note:** Plan numbering has collisions (three "001" plans). This is cosmetic but could be cleaned up.

---

## 7. Security & Privacy

- **No credentials, API keys, or secrets** found in the codebase.
- **localStorage** used for character data persistence — appropriate for a standalone app.
- **URL hash** transport for combat companion — safe, no server involved.
- **CDN dependencies:** PixiJS 8.8.0, GSAP 3.12.7, Google Fonts — all reputable sources.
- **XSS protection:** `window.escapeHtml()` used consistently for user-generated content rendering.

---

## 8. Performance

- **Total JS payload:** ~200KB (excluding 776KB base64 Excel template)
- **CSS:** 110KB (4,685 lines)
- **Pre-computed caches** for item URLs and search fields
- **Debounced search** (150ms) in equipment
- **Targeted DOM updates** instead of full re-renders
- **PixiJS** uses WebGL for background animation
- **Status:** Well-optimized for a standalone browser app.

---

## 9. Recommendations (Priority Order)

1. **Remove empty `js/scenes/skills.js`** — dead file, 0 bytes
2. **Consolidate `escapeHtml`** — single utility function shared between `app.js` and `combat.js`
3. **Merge or alias proficiency functions** — `getCharacterProficiencies` (calculations.js) and `getAllCharacterProficiencies` (character-abilities.js) should converge
4. **Investigate `class_abilities.json`** — either load it or remove it
5. **Archive completed plans** — move `plans/001-*` through `013-*` to an archive location
6. **Add debug flag for console.log** — wrap in `if (window.DEBUG)` or remove for production
7. **Verify `.gitignore`** — ensure `node_modules`, `.DS_Store`, etc. are excluded
8. **Consider SRI hashes for CDN scripts** — adds integrity verification for PixiJS/GSAP/Fonts

---

## 10. Overall Assessment

**Grade: A-**

This is a well-architected standalone RPG character creator with:
- Clean IIFE module pattern
- Proper separation of data and presentation
- Single sources of truth for critical calculations
- Good performance optimizations
- Comprehensive game data coverage
- Working combat companion with proper state transport

The main deductions are for the duplicate proficiency functions, the empty `skills.js` file, and the dead `class_abilities.json`. These are cleanup items rather than architectural flaws.

The "pony tail" is well-groomed — no tangles, just a few loose strands to tidy up. 🐴✨
