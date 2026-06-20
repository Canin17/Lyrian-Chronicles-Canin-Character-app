# Lyrian Chronicles - Standalone Character Creator

A standalone web application for creating Lyrian Chronicles TTRPG characters. Built with HTML, CSS, vanilla JavaScript, PixiJS (animated background), and GSAP (UI animations).

## Tech Stack

- **HTML5** - Single-page wizard application
- **CSS3** - Custom properties, dark theme with gold accents
- **Vanilla JavaScript** - No frameworks, global classes (works with file:// protocol)
- **PixiJS 8.8.0** (CDN) - Animated canvas background with particles and floating runes
- **GSAP 3.12.7** (CDN) - Page transitions, UI animations, stagger effects

## Architecture

```
StandAlone/
├── index.html              # Main entry point
├── css/
│   └── styles.css          # All styles (dark theme, gold accents)
└── js/
    ├── app.js              # Main application controller + wizard flow
    ├── data/
    │   ├── races.js        # 5 primary races + 42 ancestries (embedded JSON)
    │   ├── classes.js      # 174 classes with tier/role/difficulty
    │   ├── skills.js        # 5 skill groups, 21 skills, validation functions
    │   └── calculations.js  # Derived stat formulas (HP/Mana/RP/Evasion/etc.)
    └── scenes/
        ├── intro.js        # PixiJS animated background (particles, runes)
        ├── race-select.js  # Primary race + ancestry selection
        ├── class-select.js # Class grid with filters (tier/role/search)
        ├── stats.js        # Point-buy stat allocation (20 pts, 4 main + 5 sub stats)
        ├── skills-step.js  # Skill point allocation (10 pts across 21 skills)
        └── summary.js      # Character summary + JSON export
```

## Character Creation Flow

1. **Intro Screen** - Animated title card with PixiJS particle background
2. **Step 1: Identity** - Character name + background story
3. **Step 2: Race** - 5 primary races (Chimera/Demon/Fae/Human/Youkai) + 42 ancestries
4. **Step 3: Class** - 174 classes with tier/role filtering and search
5. **Step 4: Stats** - Point buy (20 pts) for 4 main stats + 5 sub-stats, live derived stat preview
6. **Step 5: Skills** - 10 skill points across 21 skills in 5 groups, expertise system
7. **Step 6: Summary** - Full character overview + JSON export

## Data Sources

All game data is embedded as JSON constants in `js/data/`:

- **Races**: From `~/.hermes/cache/angelssword/primary_races.json` + `ancestries.json`
- **Classes**: From `~/.hermes/cache/angelssword/class_details.json` (174 classes)
- **Skills**: Based on Angel's Sword rulebook skill groups
- **Calculations**: HP = 20 + TOU×10, Mana = 6 + POW, RP = 2 + AGI, etc.

## Game Rules (Angel's Sword RPG)

### Stats
- **Main Stats** (4): Power (POW), Focus (FOC), Agility (AGI), Toughness (TOU)
- **Sub-Stats** (5): Fitness, Cunning, Reason, Awareness, Presence
- **Point Buy**: 20 total points across all 9 stats, each 1-10

### Derived Stats
- HP = 20 + (Toughness × 10)
- Mana = 6 + Power
- RP = 2 + Agility
- Evasion = 7 + Agility
- Potency = 11 + Focus
- Initiative = Agility
- Save Bonus = Toughness

### Skills
- 5 groups: Fitness (2), Cunning (3), Reason (9), Awareness (4), Presence (3)
- 10 skill points to allocate at creation
- Cap: 15 per skill
- Expertise system: specialization within a skill (2 pts per investment)

## Running

Open `index.html` directly in a browser. No server required.

For local development with hot reload:
```bash
cd "F:/Games/PnP RPG/I-am-stuipid-containment/StandAlone"
python3 -m http.server 8080
# Open http://localhost:8080
```

## Known Limitations

- Phase 1: Steps 1-5 complete (Identity, Race, Class, Stats, Skills)
- Phase 2 (TODO): Equipment selection, Breakthroughs, more detailed character sheet
- Class requirements not validated (e.g., "Human only" classes)
- Race stat bonuses not auto-applied to stats
