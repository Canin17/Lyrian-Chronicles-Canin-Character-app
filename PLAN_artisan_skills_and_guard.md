# Implementation Plan: Artisan Skills + Guard Fix

## Context

Two rulebook gaps identified:
1. **Artisan Skills** — 6 crafting skills defined in the rulebook that are completely absent from the skill allocation UI. Characters with crafting classes (Blacksmith, Alchemist, Farmer, Carpenter, Armorsmith, Artificer, etc.) cannot allocate artisan skill points.
2. **Guard Calculation** — Rulebook formula is `Guard = Equipment Value + Toughness`, but `calculations.js` only returns `guard: tou` (Toughness). Equipment contribution is missing.

---

## Part 1: Artisan Skills

### 1.1 Current State

| What exists | Where |
|---|---|
| `ARTISAN_SKILLS = ['Blacksmith', 'Alchemist', 'Farmer']` | `js/data/skills.js:71` |
| `isArtisanSkill()`, `getEffectiveSkillCap()` (returns 10) | `js/data/skills.js:509-526` |
| `classToCraftingSkill` map (13 classes → 7 skills) | `js/scenes/summary.js:589-594` |
| Artisan skills are **NOT** in `SKILL_GROUPS` | `js/data/skills.js:7-59` |
| Skills step only renders `SKILL_GROUPS` | `js/scenes/skills-step.js:211-383` |

### 1.2 Rulebook Requirements (from official rulebook)

**6 Artisan Skills** (cap = 10 pts, stricter expertise):
- **Blacksmith** — Expertise: weapon groups (applies to 1H/2H), Tool, Artisan Weapon
- **Alchemist** — Expertise: Flasks, Elixirs, Potions, Poisons, Salves
- **Farmer** — Expertise: Food, Alchemy units, Herbs
- **Carpenter** — Expertise: Bows, Crossbows, Staves, Wands, Slings, Whips, Buildings
- **Armorsmithing** — Expertise: Clothing, Light Armor, Medium Armor, Heavy Armor, Shields
- **Artificer** — Expertise: Pistol, Shotgun, Musket, Sniper Rifle, Airships, Weapon Artifice, Assist Artifice, Basic Artifice

**Gathering Skills** (cap = 15 pts, NO expertise):
- Rulebook mentions gathering separately from crafting with no expertise allowed.
- In current code, `CRAFTING_GATHERING_SKILLS = ['Artifice', 'Appraise']` — these are the "gathering" skills excluded from "any non-crafting" grants. They are already in `SKILL_GROUPS` as normal skills.

### 1.3 Design Decisions

**Q: Where do artisan skills live?**
- Add a new `ARTISAN_SKILL_GROUPS` structure parallel to `SKILL_GROUPS`, with the 6 artisan skills.
- Each artisan skill has predefined expertise options (from rulebook) as `suggestions`.

**Q: How are artisan skill points granted?**
- Classes grant artisan skill points. The `classToCraftingSkill` map tells us which class grants which artisan skill.
- At character creation, a character with a crafting class gets artisan skill points that can ONLY be spent on their granted artisan skill(s).
- We need a new source: `'artisan'` in the per-source spending tracker.

**Q: How does the UI work?**
- Add an "Artisan Skills" section below the normal skills in the skills step.
- Only shows if the character has a crafting class.
- Same +/- and expertise UI, but with rulebook-defined expertise suggestions.
- Artisan expertise suggestions are pre-populated chips (like normal skill suggestions).

**Q: Expertise for artisan skills?**
- Artisan skills have stricter expertise — only the rulebook-defined options are valid.
- We should show the predefined expertise options as chips AND allow freeform entry (for homebrew/edge cases), but highlight the rulebook options.

### 1.4 Implementation Steps

#### Step 1.1: Extend `ARTISAN_SKILLS` and add `ARTISAN_SKILL_GROUPS` (`js/data/skills.js`)

```javascript
// Replace line 71:
const ARTISAN_SKILLS = [
  'Blacksmith', 'Alchemist', 'Farmer',
  'Carpenter', 'Armorsmithing', 'Artificer'
];

// Add after ARTISAN_SKILLS:
const ARTISAN_SKILL_CAP = 10;

const ARTISAN_SKILL_EXPERTISE_OPTIONS = {
  'Blacksmith': ['Swords', 'Axes', 'Maces', 'Daggers', 'Spears', 'Flails', 'Tools', 'Artisan Weapon'],
  'Alchemist': ['Flasks', 'Elixirs', 'Potions', 'Poisons', 'Salves'],
  'Farmer': ['Food', 'Alchemy Units', 'Herbs'],
  'Carpenter': ['Bows', 'Crossbows', 'Staves', 'Wands', 'Slings', 'Whips', 'Buildings'],
  'Armorsmithing': ['Clothing', 'Light Armor', 'Medium Armor', 'Heavy Armor', 'Shields'],
  'Artificer': ['Pistol', 'Shotgun', 'Musket', 'Sniper Rifle', 'Airships', 'Weapon Artifice', 'Assist Artifice', 'Basic Artifice']
};

// Build ARTISAN_SKILL_GROUPS parallel to SKILL_GROUPS
const ARTISAN_SKILL_GROUPS = [
  {
    name: 'Artisan Skills',
    skills: ARTISAN_SKILLS.map(name => ({
      name,
      pts: 0,
      expertise: '',
      suggestions: ARTISAN_SKILL_EXPERTISE_OPTIONS[name] || []
    }))
  }
];
```

Update `isArtisanSkill()` to use the extended list (already works since it checks `ARTISAN_SKILLS.includes()`).

Update `getEffectiveSkillCap()` — already returns 10 for artisan skills. ✓

Update `getAllSkillNames()` to include artisan skills:
```javascript
function getAllSkillNames() {
  return [
    ...SKILL_GROUPS.flatMap(g => g.skills.map(s => s.name)),
    ...ARTISAN_SKILLS
  ];
}
```

#### Step 1.2: Add `getClassArtisanSkillPoints()` (`js/data/skills.js`)

New function that maps equipped classes to artisan skill grants:

```javascript
/**
 * Calculate artisan skill points from equipped classes.
 * Returns { points: number, eligibleSkills: string[], perClass: [...] }
 * Each crafting class grants artisan skill points spendable ONLY on their artisan skill.
 */
function getClassArtisanSkillPoints(cls) {
  // Use classToCraftingSkill map (same as summary.js)
  const classToCraftingSkill = { ... }; // duplicate or import

  // For each equipped class at L3+, check if it grants an artisan skill
  // Return aggregated points and which artisan skills are eligible
}
```

**Key question: How many artisan skill points does a class grant?**
- Looking at the rulebook and existing `classToCraftingSkill` map, crafting classes grant their artisan skill at Level 3 (same as normal class skill grant).
- The class L3 ability description says "any non crafting skill" for normal skills, but the artisan skill is implicitly granted.
- **Decision:** Each crafting class grants 5 artisan skill points at L3 (same as normal class skill points), spendable only on their specific artisan skill. This mirrors the normal class skill grant pattern.

#### Step 1.3: Extend `calculateAvailableSkillPoints()` (`js/data/skills.js`)

Add `artisan` source:
```javascript
return {
  // ... existing fields ...
  artisan: artisanResult.points,  // NEW
  total: BASE_SKILL_POINTS + raceResult.points + classResult.points + btResult.points + artisanResult.points,
  eligibleSkills: {
    // ... existing ...
    artisan: artisanResult.eligibleSkills  // NEW
  },
  perClassArtisan: artisanResult.perClass  // NEW
};
```

#### Step 1.4: Extend `SkillsStepScene` (`js/scenes/skills-step.js`)

**Add artisan state:**
```javascript
let artisanSkillGroups = [];
// Add 'artisan' to sourceSpent and sourceExpertiseSpent
let sourceSpent = { base: {}, race: {}, class: {}, breakthrough: {}, artisan: {} };
let sourceExpertiseSpent = { base: {}, race: {}, class: {}, breakthrough: {}, artisan: {} };
```

**In `init()`:**
```javascript
artisanSkillGroups = deepCloneArtisanSkillGroups(); // new helper
```

**In `renderPointsBreakdown()`:**
- Add artisan source row if `availablePoints.artisan > 0`.

**In `renderSkills()`:**
- After rendering normal skill groups, render artisan skills section.
- Only show if `availablePoints.artisan > 0` OR the user has artisan skills allocated.
- Use the same skill row template, but with artisan-specific expertise suggestions.
- Artisan expertise: show predefined chips from `ARTISAN_SKILL_EXPERTISE_OPTIONS`.

**In `changeSkillPoints()`:**
- Handle `artisan` source spending.
- Artisan points can only be spent on artisan skills.

**In `getSkills()`:**
- Return both normal and artisan skill groups.

**In `restoreState()`:**
- Handle artisan skill restoration.

#### Step 1.5: Update `deepCloneSkillGroups()` and add `deepCloneArtisanSkillGroups()` (`js/data/skills.js`)

```javascript
function deepCloneArtisanSkillGroups() {
  return structuredClone(ARTISAN_SKILL_GROUPS);
}
```

#### Step 1.6: Update Summary (`js/scenes/summary.js`)

- In the Skills section, also render artisan skills if they have points.
- In export (JSON/Excel), include artisan skills.

#### Step 1.7: Update CSS (`css/styles.css`)

- Add styling for artisan skill section (distinct visual treatment — maybe a different accent color or border to distinguish from normal skills).
- Artisan skill rows should look slightly different (e.g., gold-tinted border).

---

## Part 2: Guard Calculation Fix

### 2.1 Current State

**Rulebook:** `Guard = Equipment Value + Toughness`

**Current code (`js/data/calculations.js:45`):**
```javascript
guard: tou  // Only Toughness — WRONG
```

**Summary display (`js/scenes/summary.js:150-153`):**
- Does NOT display Guard at all in the derived stats grid.

**Excel export (`js/scenes/summary.js:897-901`):**
- Parses Guard from armor description for the Excel sheet, but this is export-only.

### 2.2 Design Decisions

**Q: Where does Equipment Value come from?**
- Armor/shield items have Guard values in their descriptions (e.g., "Guard by 3 and Block by 6").
- The Excel export already parses this: `desc.match(/Guard\s+by\s+(\d+)/i)`.
- We need to extract this at runtime for the derived stat.

**Q: Should `calculateDerivedStats()` take equipment data?**
- Currently it only takes `stats`. We need to extend it to optionally accept equipment data.
- **Decision:** Add an optional second parameter `equipmentData` to `calculateDerivedStats()`.

**Q: How to get equipment Guard?**
- Sum Guard from all equipped armor/shield items in the inventory.
- Parse from item description using the existing regex pattern.
- Only count items that are actually equipped (type = 'Armor' or 'Shield', in inventory).

### 2.3 Implementation Steps

#### Step 2.1: Add `calculateEquipmentGuard()` (`js/data/calculations.js`)

```javascript
/**
 * Calculate total Guard bonus from equipped armor/shield items.
 * Parses "Guard by N" from item descriptions.
 * @param {Array} inventory - Array of { item, quantity } from character data
 * @returns {number} Total equipment Guard
 */
function calculateEquipmentGuard(inventory) {
  if (!inventory || !Array.isArray(inventory)) return 0;
  let total = 0;
  inventory.forEach(entry => {
    const item = entry.item;
    if (item.type === 'Armor' || item.type === 'Shield') {
      const desc = item.description || '';
      const match = desc.match(/Guard\s+by\s+(\d+)/i);
      if (match) {
        total += parseInt(match[1], 10) * (entry.quantity || 1);
      }
    }
  });
  return total;
}
```

#### Step 2.2: Extend `calculateDerivedStats()` (`js/data/calculations.js`)

```javascript
function calculateDerivedStats(stats, equipmentData) {
  // ... existing calculations ...
  const equipmentGuard = equipmentData ? calculateEquipmentGuard(equipmentData.inventory) : 0;
  return {
    // ... existing ...
    guard: tou + equipmentGuard  // FIX: include equipment
  };
}
```

Update the `/* exported */` comment to include `calculateEquipmentGuard`.

#### Step 2.3: Update Summary to pass equipment data (`js/scenes/summary.js`)

In `render()`, line 35:
```javascript
const derived = stats ? calculateDerivedStats(stats, characterData) : {};
```

#### Step 2.4: Add Guard to Summary Display (`js/scenes/summary.js`)

In the Derived Stats grid (around line 137-167), add Guard:
```javascript
// After Speed, add:
<div style="text-align: center; padding: 0.5rem; background: var(--bg-primary); border-radius: 4px;">
  <div style="font-size: 0.75rem; color: var(--accent-gold); text-transform: uppercase;">Guard</div>
  <div style="font-size: 1.3rem; font-weight: bold;">${derived.guard ?? '-'}</div>
  ${equipmentGuard > 0 ? `<div style="font-size: 0.6rem; color: var(--text-muted);">Base ${stats.tou} + ${equipmentGuard} Equip</div>` : ''}
</div>
```

#### Step 2.5: Update all callers of `calculateDerivedStats()` 

Search for all calls and ensure they either:
- Pass `characterData` as second param (preferred), OR
- Are aware that Guard will be Toughness-only (acceptable for contexts where equipment isn't available yet).

Expected callers:
- `js/scenes/summary.js` — main summary display ✓ (Step 2.3)
- `js/scenes/combat.js` — combat companion init (check if it uses Guard)
- Any export functions

---

## File Change Summary

| File | Changes |
|---|---|
| `js/data/skills.js` | Extend `ARTISAN_SKILLS`, add `ARTISAN_SKILL_GROUPS`, `ARTISAN_SKILL_EXPERTISE_OPTIONS`, `getClassArtisanSkillPoints()`, `deepCloneArtisanSkillGroups()`, update `calculateAvailableSkillPoints()`, update `getAllSkillNames()` |
| `js/data/calculations.js` | Add `calculateEquipmentGuard()`, extend `calculateDerivedStats()` to accept equipment data, fix Guard formula |
| `js/scenes/skills-step.js` | Add artisan skill state, render artisan section, handle artisan source spending, update `init()`/`getSkills()`/`restoreState()`/`reset()` |
| `js/scenes/summary.js` | Pass equipment to `calculateDerivedStats()`, add Guard to display, render artisan skills in summary, include artisan skills in exports |
| `css/styles.css` | Add artisan skill section styling |

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Artisan skill point count unclear in rulebook | Using 5 pts at L3 (same as normal class skills) — consistent with existing pattern |
| Guard parsing from description is fragile | Same regex already used in Excel export — proven pattern |
| Breaking existing save files | Artisan state is additive — old saves just have 0 artisan points |
| `calculateDerivedStats()` signature change | Second param is optional — backward compatible |

## Testing Plan

1. Create a Blacksmith character → verify artisan skill section appears with 5 points
2. Allocate artisan skill points → verify cap at 10
3. Add artisan expertise → verify only predefined options shown as chips
4. Save/load character → verify artisan skills persist
5. Export to Excel → verify artisan skills included
6. Equip armor → verify Guard = Toughness + Equipment in summary
7. Unequip armor → verify Guard = Toughness only
