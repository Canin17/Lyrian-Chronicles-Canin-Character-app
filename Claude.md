# Lyrian Chronicles - Standalone Character Creator

Standalone web app for creating Lyrian Chronicles (Angel's Sword RPG) characters. HTML + CSS + vanilla JS, works with `file://` — no server required.

## Tech Stack

- **HTML5** — Single-page wizard, ARIA accessibility
- **CSS3** — Custom properties, dark theme, gold accents
- **Vanilla JavaScript** — IIFE modules, no frameworks
- **PixiJS 8.8.0** (CDN) — Animated canvas background (particles, floating runes)
- **GSAP 3.12.7** (CDN) — Page transitions, UI animations
- **ExcelJS 4.4.0** (CDN) — Excel export to Mirane CCS template
- **jsPDF 2.5.1** (CDN) — PDF export
- **Google Fonts** — IM Fell English / IM Fell English SC
- **ESLint** — Flat config (`eslint.config.js`)

## Architecture

```
StandAlone/
├── index.html                    # Entry point (CDN libs, script load order)
├── css/
│   └── styles.css                # All styles
├── js/
│   ├── app.js                    # Main controller: wizard flow, nav, save/load, import
│   ├── data/
│   │   ├── races.js              # 5 primary races + 42 ancestries (CDN images)
│   │   ├── classes.js            # 174 classes: tier/role/difficulty/requirements/images
│   │   ├── class_abilities.json  # Class abilities L1–L8 (API v0.13.0)
│   │   ├── abilities.js          # 1064 abilities + 85 keywords (API v0.13.0)
│   │   ├── breakthroughs.js      # 87+ breakthroughs: cost/prereqs/categories
│   │   ├── skills.js             # 5 groups, 21 skills, multi-source allocation, expertise
│   │   ├── calculations.js       # Stat arrays, derived stats, BURDEN_LIMIT
│   │   ├── items.js              # 206 items: cost/burden/type/subType (CDN images)
│   │   ├── character-abilities.js # Aggregates race/class/breakthrough abilities
│   │   └── excel-template.js     # Base64 Mirane CCS v10.3.1.xlsx
│   └── scenes/
│       ├── intro.js              # PixiJS background + WebGL recovery
│       ├── race-select.js        # Race + ancestry selection, trait display
│       ├── class-select.js       # Multi-class grid, filters, preview, IP/EXP budget
│       ├── breakthroughs.js      # Breakthrough browser, eligibility checker, dual EXP pool
│       ├── stats.js              # Array-based stat assignment + race/class/BT bonus dropdowns
│       ├── skills-step.js        # Multi-source skill allocation, expertise
│       ├── equipment.js          # Item purchase, inventory, burden (flat 10), toast notifications
│       └── summary.js            # Character overview + JSON/Excel/PDF export + Excel import
├── eslint.config.js
├── .gitignore
└── Claude.md
```

## Character Creation Flow (8 Steps)

1. **Intro** — Animated title card, "Begin Creation", "Import" (JSON/Excel)
2. **Identity** — Name, background, gender, age, height, weight, worships (gods), starting Clim/EXP/IP (steppers)
3. **Race** — 5 primary races + 42 ancestries. Human: Pure Human, Slow Starter, Starter IP
4. **Class** — 174 classes, multi-class. L1–L8 per class. IP + EXP budget. Preview panel with portrait, abilities, requirements
5. **Breakthroughs** — 87+ breakthroughs, dual EXP pool: 300 starting EXP (doesn't add to Spirit Core) + main class EXP (does). Clause-based prerequisite parser
6. **Stats** — Array assignment `(5,4,4,3)` main + `(5,4,3,2,1)` sub. Race bonuses auto-applied. Human: +1 main +1 sub of choice. Class stat bonuses (L6 Heart/L7 Soul) dropdowns. Breakthrough stat training dropdowns
7. **Skills** — 21 skills, 5 groups. Multi-source points (base: 10, race, class, breakthrough). Per-source eligible skill enforcement. Cap 15. Expertise (2 pts/investment)
8. **Equipment** — 206 items, category/subtype filters, search, sort. Clim budget. Burden: flat 10 limit (over = Rooted). Inventory shelf with item inspection
9. **Summary** — Full character overview. Export: JSON, Excel (Mirane CCS), PDF. New Character button

## Game Rules

### Stats (Array-Based)
- **Main** (4): POW, FOC, AGI, TOU — assign `(5,4,4,3)`
- **Sub** (5): Fitness, Cunning, Reason, Awareness, Presence — assign `(5,4,3,2,1)`
- Every value used exactly once — rearranging, not choosing

### Race Stat Bonuses (Auto-Applied)
| Race | Main | Sub |
|------|------|-----|
| Chimera | +1 TOU | +1 Awareness |
| Demon | +1 POW | +1 Reason |
| Fae | +1 AGI | +1 Cunning |
| Youkai | +1 FOC | +1 Presence |
| Human | +1 (choice) | +1 (choice) |

### Derived Stats
HP = 20 + (TOU × 10), Mana = 6 + POW, RP = 2 + AGI, Evasion = 7 + AGI, Dodge Eva = 20 + AGI, Potency = 11 + FOC, Damage = 5 + POW, Accuracy = FOC, Initiative = AGI, Save Bonus = TOU, Guard = TOU, Speed = 20

### Classes
- 174 classes, tiers 1–3, multi-class (IP to unlock, EXP to level 1–8)
- L5 = Skills, L6 = Heart (+1 sub stat), L7 = Soul (+1 main stat), L8 = capstone
- Spirit Core tracks unspent EXP from class leveling

### Breakthroughs
- Dual EXP: 300 starting pool (no Spirit Core) + main class EXP pool (adds to Spirit Core)
- Categories: General, Racial, Class. Costs: 0–300+
- Clause-based eligibility parser (race/class/mastered checks)
- Can grant stat bonuses (stat training dropdowns in stats step) and proficiencies

### Skills
- 21 skills across 5 groups (Fitness: 2, Cunning: 3, Reason: 9, Awareness: 4, Presence: 3)
- Base: 10 pts. Additional from race/class/breakthrough (per-source eligible lists)
- Cap: 15 per skill. Expertise: 2 pts per investment

### Equipment
- 206 items: Artifice, Adventuring Essentials, Alchemy, Astra Relic, Crafting, Divine Arms, Equipment, Mount, Talisman
- Burden: flat limit 10, over = Rooted. Items with burdenCost = 0 are free (backpacks, mounts, artifice limbs)
- Clim budget: starting Clim (default 3000), "Rich Parents" breakthrough adds +3000

### Resources
- **Clim** — Starting currency (default 3000)
- **EXP** — Class experience (default 1000)
- **IP** — Interlude Points (default 3)

## Character Data Store

`character` object in `app.js` — all state:

```js
{
  name, background, gender, age, height, weight, worships,
  clim, exp, ip,
  race, ancestry,
  cls,                    // { all: [{ class, level }], primary, spiritCore }
  breakthroughs,          // [{ id, name, cost, ... }]
  breakthroughStatBonuses, // stat bonuses from breakthroughs
  breakthroughProficiencies, // proficiencies from breakthroughs
  classStatBonusChoices,  // L6 Heart / L7 Soul choices
  stats, baseStats, raceBonuses, humanChoices,
  skills,                 // skill groups with pts + expertise
  mirane, oldArmorCalc, spiritCore, speed
}
```

Runtime fields (not in skeleton, restored on import): `inventory`, `climSpent`, `remainingClim`, `statBonusChoices`

## Data Sources

All game data embedded in `js/data/` from Angel's Sword API v0.13.0. CDN images from `cdn.angelssword.com`. Excel template: base64-encoded `Blank Mirane CCS v10.3.1.xlsx`.

## Features

### Save/Load
- Auto-save to `localStorage` after every step
- "Load Saved Character" on intro screen
- "New Character" clears everything

### Import
- **JSON**: Unwraps `{ character: { ... } }` envelope, merges known + extra keys
- **Excel**: Parses Mirane CCS format via `SummaryScene.importExcel()`

### Export
- **JSON**: Full character data with derived stats
- **Excel**: Populates Mirane CCS v10.3.1 template (Core, Breakthrough, Backstory sheets)
- **PDF**: jsPDF export

### Security
- `escapeHtml()` — Full HTML escaping for user input
- `renderHtml()` — Escapes dangerous chars, preserves safe named entities from game data
- `decodeHtmlEntities()` — Pure regex + entity map, no innerHTML

### Accessibility
- ARIA roles (`navigation`, `progressbar`, `tabpanel`, `list`)
- `aria-label`, `aria-current`, `aria-valuemin/max/now`
- Semantic HTML (`<main>`, `<h2>`, `<h3>`)

### Navigation
- Slide-out sidebar (hamburger toggle + backdrop close)
- Clickable step items for direct navigation
- GSAP transitions with `isTransitioning` guard

## Running

Open `index.html` directly. No server needed.

```bash
cd "F:/Games/PnP RPG/I-am-stuipid-containment/StandAlone"
python3 -m http.server 8080
```

## CDN Dependencies

| Library | Version | Purpose |
|---------|---------|---------|
| PixiJS | 8.8.0 | Animated canvas background |
| GSAP | 3.12.7 | UI transitions |
| ExcelJS | 4.4.0 | Excel export |
| jsPDF | 2.5.1 | PDF export |
| Google Fonts | — | IM Fell English (serif) |

## Known Limitations

- Class requirements not fully validated (warnings, no blocking)
- Breakthrough prerequisite parser handles common patterns, edge cases may slip
- No ability builder / spell selection yet
- No printable PDF character sheet yet
