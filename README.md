# Lyrian Chronicles — Standalone Character Creator ⚔️

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Launch%20App-brightgreen?style=for-the-badge)](https://canin17.github.io/Lyrian-Chronicles-Canin-Character-app/)
[![Game System](https://img.shields.io/badge/TTRPG-Angel's%20Sword-blueviolet?style=for-the-badge)](https://rpg.angelssword.com/)

Welcome to the **Lyrian Chronicles Character Creator**, the ultimate digital companion web application built specifically for the **Angel's Sword TTRPG: The Lyrian Chronicles**. Whether you are rolling up a fierce warrior, tracking your Spirit Core, or managing your hard-earned Clim, this companion tool streamlines your tabletop experience.

🚀 **[Launch the Live Character Companion App Here!](https://canin17.github.io/Lyrian-Chronicles-Canin-Character-app/)**

> **⚠️ Work in Progress** — Class abilities, descriptions, derived-stat formulas, and skill calculations are still being refined and are not yet guaranteed to match the official ruleset. Use at your own discretion and verify against the [official Angel's Sword docs](https://rpg.angelssword.com/).

---

## 🌟 Features

- **Full Race Support** — All 5 primary races (Chimera, Demon, Fae, Human, Youkai) with 51 ancestries (subraces), each with descriptions, stat bonuses, and images from the official CDN.
- **180 Classes** — Browse, filter (by tier, role, eligibility), and search. Preview abilities, requirements, and EXP cost before equipping. 3 IP and 1000 EXP budget.
- **87 Breakthroughs** — Filter by cost, category (General / Racial), and eligibility. 300 EXP budget.
- **Array-Based Stat Assignment** — Assign the fixed arrays `(5, 4, 4, 3)` to main stats and `(5, 4, 3, 2, 1)` to sub-stats. Live derived-stat preview as you assign.
- **21 Skills in 5 Groups** — Fitness (2), Cunning (3), Reason (9), Awareness (4), Presence (3). 10 base skill points, cap of 15 per skill, expertise system.
- **Animated UI** — PixiJS particle/rune canvas background, GSAP page transitions.
- **Export** — JSON character sheet or Mirane CCS Excel (`.xlsx`) template fill.

---

## 📖 About Angel's Sword RPG: The Lyrian Chronicles

**The Lyrian Chronicles** is a high-fantasy, anime-inspired tabletop role-playing game developed by **Angel's Sword Studios**. Built from the ground up for online and digital audiences, it features a unique "Tabletop Games As A Service" approach with an open beta framework. Players explore the vast, dangerous world of Lyr—joining factions like the Red Halo or fighting off the Cult of Heira.

This unofficial character companion application ensures players can spend less time calculating rules and more time engaging in deep, tactical combat and narrative-driven storytelling.

---

## 📋 Character Creation Flow

| Step | Name | Description |
|------|------|-------------|
| — | Intro | Animated title screen |
| 1 | Identity | Name, background, gender, age, height, weight, worship, starting Clim (3000) |
| 2 | Race | Primary race → ancestry (subrace) selection |
| 3 | Class | Equip classes using 3 IP and 1000 EXP |
| 4 | Breakthroughs | Select breakthroughs using 300 EXP |
| 5 | Stats | Assign main + sub-stat arrays, view derived stats |
| 6 | Skills | Allocate skill points across 21 skills |
| 7 | Summary | Full character overview + export |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Markup | HTML5 (single-page wizard) |
| Styling | CSS3 (custom properties, dark theme with gold accents) |
| Logic | Vanilla JavaScript (ES6+, no frameworks, `file://` compatible) |
| Canvas BG | [PixiJS 8.8.0](https://pixijs.com/) (CDN) — particles, floating runes |
| Animations | [GSAP 3.12.7](https://gsap.com/) (CDN) — page transitions, stagger effects |
| Excel Export | [ExcelJS 4.4.0](https://exceljs.io/) (CDN) — Mirane CCS template |

---

## 📁 Project Structure

```
StandAlone/
├── index.html                  # Entry point — loads all scripts
├── css/
│   └── styles.css              # All styles (dark theme, gold accents)
├── js/
│   ├── app.js                  # Main controller + wizard navigation
│   ├── data/
│   │   ├── races.js            # 5 primary races + 51 ancestries
│   │   ├── classes.js          # 180 classes (tier, role, requirements, images)
│   │   ├── breakthroughs.js    # 87 breakthroughs (cost, category, prerequisites)
│   │   ├── skills.js           # 5 groups, 21 skills, expertise, validation
│   │   ├── calculations.js     # Derived stat formulas
│   │   └── excel-template.js   # Mirane CCS template (embedded base64)
│   └── scenes/
│       ├── intro.js            # PixiJS animated background
│       ├── race-select.js      # Race + ancestry selection
│       ├── class-select.js     # Class grid with filters
│       ├── breakthroughs.js    # Breakthrough grid with filters
│       ├── stats.js            # Array-based stat assignment
│       ├── skills-step.js      # Skill point allocation
│       └── summary.js          # Character summary + JSON/Excel export
└── plans/                      # Implementation plan tracking
```

---

## 📖 Game Data

All game data is embedded as JavaScript constants in `js/data/`, sourced from the [Angel's Sword TTRPG](https://rpg.angelssword.com/) API and rulebooks:

- **Races** — 5 primary races, 51 ancestries with stat bonuses, proficiencies, and CDN images
- **Classes** — 180 classes across tiers 1–3, with roles, requirements, and ability data
- **Breakthroughs** — 87 breakthroughs (General, Racial categories) with costs from 0–300+ EXP
- **Skills** — 21 skills across 5 groups tied to sub-stats
- **Derived Stats** — HP, Mana, RP, Evasion, Potency, Damage, Accuracy, Initiative, Save Bonus, Guard, Speed

---

## ▶️ Running

Open `index.html` directly in any modern browser — **no server required**.

For local development with a live server:

```bash
cd "F:/Games/PnP RPG/I-am-stuipid-containment/StandAlone"
python -m http.server 8080
# Open http://localhost:8080
```

---

## 📄 License & Disclaimer

This is an **independent fan-made tool** and is not officially affiliated with Angel's Sword Studios or Leaflit. All game systems, world lore, class/race data, and imagery belong to the creators of **Angel's Sword RPG: The Lyrian Chronicles**.

Code distributed under the [MIT License](LICENSE).
