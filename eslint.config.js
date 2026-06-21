// ESLint flat config for Lyrian Chronicles character creator
// Multi-file globals: data files define globals consumed by scene files via <script> tags

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    files: ["js/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        // Browser built-ins
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        console: "readonly",
        Blob: "readonly",
        URL: "readonly",
        atob: "readonly",
        performance: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        structuredClone: "readonly",

        // Third-party libs (loaded via <script> tags in index.html)
        gsap: "readonly",
        jQuery: "readonly",
        $: "readonly",
        ExcelJS: "readonly",
        PIXI: "readonly",

        // Cross-file globals: defined in data files, consumed by scene files
        // Data → Scenes
        RACE_DATA: "readonly",
        ANCESTRY_MAP: "readonly",
        TRAIT_DESCRIPTIONS: "readonly",
        CLASS_DATA: "readonly",
        CLASS_INDEX: "readonly",
        CLASS_ABILITIES_DATA: "readonly",
        ABILITIES_DB: "readonly",
        KEYWORDS_DB: "readonly",
        BREAKTHROUGH_DATA: "readonly",
        MIRANE_TEMPLATE_B64: "readonly",
        SKILL_GROUPS: "readonly",
        SKILL_GRANTING_BREAKTHROUGHS: "readonly",
        EXPERTISE_MULTIPLIER: "readonly",
        BASE_SKILL_POINTS: "readonly",
        MAIN_STATS: "readonly",
        SUB_STATS: "readonly",
        MAIN_STATS_ARRAY: "readonly",
        SUB_STATS_ARRAY: "readonly",
        getAbilityData: "readonly",
        getKeywordData: "readonly",
        abilityLink: "readonly",
        keywordLinks: "readonly",
        abilityCosts: "readonly",
        calculateDerivedStats: "readonly",
        getTotalStatPoints: "readonly",
        isAssignmentComplete: "readonly",
        getAvailableValues: "readonly",
        calculateAvailableSkillPoints: "readonly",
        getRemainingPoints: "readonly",
        deepCloneSkillGroups: "readonly",
        canAddExpertise: "readonly",
        isCraftingGatheringSkill: "readonly",
        getEffectiveSkillCap: "readonly",
        getRaceSkillPoints: "readonly",

        // Scene modules (IIFE modules, consumed by app.js)
        BackgroundScene: "readonly",
        RaceSelectScene: "readonly",
        ClassSelectScene: "readonly",
        BreakthroughScene: "readonly",
        StatsScene: "readonly",
        SkillsStepScene: "readonly",
        SummaryScene: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-undef": "error",
      "no-console": "off",
    },
  },
];
