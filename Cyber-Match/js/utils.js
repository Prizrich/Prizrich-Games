// Глобальное состояние игры

let playerStats = {
    coins: 300,
    crystals: 15,
    permanentBonusMoves: 0,
    ownedItems: {},
    ownedSkins: ["neon"],
    activeSkin: "neon",
    consumablesUsed: { double_score: false, combo_boost: false }
};

let playerProgress = {
    currentWorld: "forest",
    availableWorlds: ["forest"],
    forest: { unlockedLevel: 1, completed: [], isUnlocked: true, isCompleted: false },
    steampunk: { unlockedLevel: 1, completed: [], isUnlocked: false, isCompleted: false },
    cyber: { unlockedLevel: 1, completed: [], isUnlocked: false, isCompleted: false },
    space: { unlockedLevel: 1, completed: [], isUnlocked: false, isCompleted: false }
};

// Текущее состояние игры
let currentWorld = "forest";
let currentLevel = 1;
let boardState = [];
let score = 0;
let movesLeft = 0;
let selectedCell = null;
let isLocking = false;
let gameActive = true;
let questProgress = 0;
let currentQuest = null;
let combo = 1;
let noComboCounter = 0;
let moveCounter = 0;
let matchCounter = 0;
let gravityInverted = false;
let steamGears = 0;
let worldSpecificData = { invisibleCells: [], rustedCells: [] };
let activeDoubleScore = false;
let activeStartCombo = 1;
let totalScoreAllWorlds = 0;