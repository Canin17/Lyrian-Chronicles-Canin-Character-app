# Lyrian Chronicles - Standalone Character Creator

A standalone web application for creating Lyrian Chronicles (Angel's Sword RPG) characters. Built with HTML, CSS, vanilla JavaScript, PixiJS (animated background), GSAP (UI animations), and ExcelJS (Excel export). Works with `file://` protocol — no server required.

## Tech Stack

- **HTML5** — Single-page wizard application with ARIA accessibility
- **CSS3** — Custom properties, dark theme with gold accents
- **Vanilla JavaScript** — No frameworks, global IIFE modules (works with `file://`)
- **PixiJS 8.8.0** (CDN) — Animated canvas background with particles and floating runes
- **GSAP 3.12.7** (CDN) — Page transitions, UI animations, stagger effects
- **ExcelJS** (CDN) — Excel export to Mirane CCS template format
- **Google Fonts** — IM Fell English / IM Fell English SC (serif, cross-origin)
- **ESLint** — Flat config for code quality (`eslint.config.js`)

## Architecture

```
StandAlone/
├── index.html                    # Main entry point (loads all scripts, CDN libs)
├── css/
│   └── styles.css                # All styles (dark theme, gold accents, responsive)
├── js/
│   ├── app.js                    # Main application controller + wizard flow
│   ├── data/
│   │   ├── races.js              # 5 primary races + 42 ancestries (embedded JSON, CDN images)
│   │   ├── classes.js            # 174 classes with tier/role/difficulty/requirements/images
│   │   ├── class_abilities.json  # Class abilities L1–L8 for all classes (from API v0.13.0)
│   │   ├── abilities.js          # 1064 abilities + 85 keywords (from API v0.13.0)
│   │   ├── breakthroughs.js      # 87+ breakthroughs with cost/prerequisites/categories
│   │   ├── skills.js             # 5 skill groups, 17 skills, multi-source allocation, expertise
│   │   ├── calculations.js       # Stat arrays, derived stat formulas, assignment helpers
│   │   └── excel-template.js     # Base64-encoded Mirane CCS v10.3.1.xlsx template
│   └── scenes/
│       ├── intro.js              # PixiJS animated background (particles, runes, WebGL recovery)
│       ├── race-select.js        # Primary race + ancestry selection with trait display
│       ├── class-select.js       # Multi-class grid with filters, preview panel, IP/EXP budget
│       ├── breakthroughs.js      # Breakthrough browsing, filtering, eligibility checker
│       ├── stats.js              # Array-based stat assignment + race bonus auto-apply
│       ├── skills-step.js        # Multi-source skill allocation (base/race/class/breakthrough)
│       └── summary.js            # Character overview + JSON/Excel export
├── eslint.config.js              # ESLint flat config (browser globals, CDN libs)
├── .gitignore                    # Git ignore rules
└── Claude.md                     # This file
```

## Character Creation Flow (7 Steps)

1. **Intro Screen** — Animated title card with PixiJS particle background, "Load Saved Character" button
2. **Step 1: Identity** — Name, background, gender, age, height, weight, worships (gods), starting Clim/EXP/IP (stepper controls)
3. **Step 2: Race** — 5 primary races (Chimera/Demon/Fae/Human/Youkai) + 42 ancestries. Human-specific: Pure Human, Slow Starter, Starter IP
4. **Step 3: Class** — Multi-class system. 174 classes with tier/role/difficulty/eligibility filters. Level 1–8 per class. IP + EXP budget management. Preview panel with portrait, abilities grid, requirements
5. **Step 4: Breakthroughs** — 87+ breakthroughs, 300 EXP budget. Filter by cost/category/eligibility. Clause-based prerequisite parser (race/class/mastered checks)
6. **Step 5: Stats** — Array-based assignment (NOT point-buy): Main `(5,4,4,3)` → POW/FOC/AGI/TOU, Sub `(5,4,3,2,1)` → Fitness/Cunning/Reason/Awareness/Presence. Race bonuses auto-applied. Human gets +1 main of choice +1 sub of choice
7. **Step 6: Skills** — 17 skills across 5 groups. Multi-source skill points (base: 10, race, class, breakthrough). Per-source eligible skill enforcement. Expertise system (2 pts per investment)
8. **Summary** — Full character overview with JSON export + Mirane Excel export

## Game Rules (Angel's Sword / Lyrian Chronicles RPG)

### Stats (Array-Based Assignment)
- **Main Stats** (4): Power (POW), Focus (FOC), Agility (AGI), Toughness (TOU)
- **Sub-Stats** (5): Fitness, Cunning, Reason, Awareness, Presence
- **Main array**: Assign `(5, 4, 4, 3)` to the 4 main stats in any order
- **Sub array**: Assign `(5, 4, 3, 2, 1)` to the 5 sub stats in any order
- Every value must be used exactly once — you're rearranging, not choosing

### Race Stat Bonuses (Auto-Applied)
| Race | Main Bonus | Sub Bonus |
|------|-----------|-----------|
| Chimera | +1 TOU | +1 Awareness |
| Demon | +1 POW | +1 Reason |
| Fae | +1 AGI | +1 Cunning |
| Youkai | +1 FOC | +1 Presence |
| Human | +1 (player choice) | +1 (player choice) |

### Derived Stats
- HP = 20 + (TOU × 10)
- Mana = 6 + POW
- RP = 2 + AGI
- Evasion = 7 + AGI
- Dodge Eva = 20 + AGI
- Potency = 11 + FOC
- Damage = 5 + POW
- Accuracy = FOC
- Initiative = AGI
- Save Bonus = TOU
- Guard = TOU
- Speed = 20

### Skills
- 5 groups tied to sub-stats: Fitness (2 skills), Cunning (3), Reason (9), Awareness (4), Presence (3)
- 17 total skills: Athletics, Riding, Deception, Roguecraft, Stealth, Artifice, Appraise, Common Knowledge, Flight, History, Linguistics, Magic, Medicine, Religion, Acrobatics, Intimidation, Performance, Persuasion
- Base: 10 skill points at creation
- Additional points from race, class, and breakthroughs (tracked per-source)
- Per-source eligible skill lists — each source can only spend on its eligible skills
- Cap: 15 per skill
- Expertise: specialization within a skill (2 pts per investment)

### Classes
- 174 classes, tiers 1–3, roles (Striker, Defender, Healer, Support, Utility, Controller, etc.)
- Difficulty: 1–5 stars
- Multi-class: spend IP to unlock classes, spend EXP to level (1–8)
- Each level grants 1 ability (L1–L8). L5 = Skills, L6 = Heart (+1 sub), L7 = Soul (+1 main), L8 = class capstone
- Spirit Core tracks unspent EXP from class leveling

### Breakthroughs
- 300 EXP budget (separate from class EXP, unspent is lost)
- Categories: General, Racial, Class
- Costs: 0–300+ EXP
- Clause-based eligibility: parses prerequisites (race checks, class mastery, GM approval)

### Resources
- **Clim** — Starting currency (default 3000)
- **EXP** — Class experience (default 1000)
- **IP** — Interlude Points (default 3)

## Data Sources

All game data is embedded as JSON/constants in `js/data/`:

- **Races**: From Angel's Sword API v0.13.0 cached data, CDN images from `cdn.angelssword.com`
- **Classes**: 174 classes with tier/role/difficulty/requirements, CDN images
- **Class Abilities**: L1–L8 per class from API v0.13.0 (`class_abilities.json`)
- **Abilities DB**: 1064 abilities + 85 keywords from API v0.13.0 (`abilities.js`)
- **Breakthroughs**: 87+ with cost/prerequisites/categories (`breakthroughs.js`)
- **Skills**: Based on Angel's Sword rulebook skill groups
- **Excel Template**: Base64-encoded `Blank Mirane CCS v10.3.1.xlsx` for Excel export

## Character Data Store

The `character` object in `app.js` holds all state:

```js
{
  name, background, gender, age, height, weight, worships,
  clim, exp, ip,
  race, ancestry, pureHuman, slowStarter, starterIp,
  cls,                    // { all: [{ class, level }], primary, spiritCore }
  breakthroughs,          // [{ id, name, cost, ... }]
  stats,                  // { pow, foc, agi, tou, fitness, cunning, reason, awareness, presence }
  baseStats,              // base values before race bonuses
  raceBonuses,            // race stat bonuses applied
  humanChoices,           // { main, sub } for Humans
  skills,                 // skill groups with pts + expertise
  mirane,                 // boolean — use Mirane CCS format
  oldArmorCalc,           // boolean — legacy armor calculation
  spiritCore              // unspent EXP from class leveling
}
```

## Features

### Save/Load
- Auto-save to `localStorage` after every step
- "Load Saved Character" button on intro screen
- Step position saved and restored
- "New Character" button clears everything

### Export
- **JSON**: Full character data export with derived stats, formatted filename
- **Excel**: Populates Mirane CCS v10.3.1 template (Core, Breakthrough, Backstory sheets) preserving formulas and styling. Uses embedded base64 template to avoid CORS on `file://`

### Security
- `escapeHtml()` — Full HTML escaping for user input
- `renderHtml()` — Escapes dangerous chars but preserves safe named entities (`&nbsp;`, `&mdash;`, etc.) from game data

### Accessibility
- ARIA roles (`navigation`, `progressbar`, `tabpanel`, `list`)
- `aria-label`, `aria-current`, `aria-valuemin/max/now` on progress bar
- Semantic HTML structure with `<main>`, `<h2>`, `<h3>` headings

## Running

Open `index.html` directly in a browser. No server required.

For local development with hot reload:
```bash
cd "F:/Games/PnP RPG/I-am-stuipid-containment/StandAlone"
python3 -m http.server 8080
# Open http://localhost:8080
```

## CDN Dependencies (loaded in index.html)

| Library | Version | Purpose |
|---------|---------|---------|
| PixiJS | 8.8.0 | Animated canvas background |
| GSAP | 3.12.7 | UI transitions and animations |
| ExcelJS | latest | Excel export to Mirane template |
| Google Fonts | — | IM Fell English (serif) |

## Known Limitations

- Class requirements not fully validated (e.g., "Human only" classes show eligibility warnings but don't block)
- Breakthrough prerequisite parser handles common patterns but edge cases may slip through
- No equipment selection yet (Phase 2)
- No detailed character sheet / printable PDF yet
- No ability builder / spell selection yet
