// Конфигурация игры - глобальные константы

const WORLDS_LIST = ["forest", "steampunk", "cyber", "space"];

const WORLDS = {
    forest: { name: "ЛЕСНОЙ", icon: "🌲", emojis: ["🍄", "🐺", "🍃", "🌲"], theme: "#4caf50", property: "✨ Прорастание + Рост", extraInfo: "🌸 Цветок +50% | Каждые 3 матча +1 ход", hasUlt: false, bgClass: "world-forest", music: "sounds/forest.mp3" },
    steampunk: { name: "СТИМПАНК", icon: "⚙️", emojis: ["⚙️", "🔧", "🚂", "🕰️"], theme: "#cd7f32", property: "🦾 Ржавчина | 💨 Паровой удар", extraInfo: "⚙️ 40 шестерёнок → ульта!", hasUlt: true, bgClass: "world-steampunk", music: "sounds/steampunk.mp3" },
    cyber: { name: "КИБЕРПАНК", icon: "🤖", emojis: ["🤖", "👾", "🛸", "💻"], theme: "#00f0ff", property: "⚠️ Перегрузка | 💻 Хакер x3+", extraInfo: "⚡ 2 хода без комбо = штраф!", hasUlt: false, bgClass: "world-cyber", music: "sounds/cyberpunk.mp3" },
    space: { name: "КОСМОС", icon: "🪐", emojis: ["🪐", "☄️", "🚀", "🌌"], theme: "#9c27b0", property: "🌀 Инверсия | ⚫ Черная дыра", extraInfo: "🌌 Гравитация меняется!", hasUlt: false, bgClass: "world-space", music: "sounds/cosmos.mp3" }
};

const WORLD_QUESTS = {
    forest: [
        { icon: "🍄", target: 20, desc: "Собери 20 🍄" },
        { icon: "🐺", target: 20, desc: "Собери 20 🐺" },
        { icon: "🍃", target: 20, desc: "Собери 20 🍃" },
        { icon: "🌲", target: 20, desc: "Собери 20 🌲" },
        { icon: "🍄", target: 25, desc: "Собери 25 🍄" },
        { icon: "🐺", target: 25, desc: "Собери 25 🐺" },
        { icon: "🍃", target: 25, desc: "Собери 25 🍃" },
        { icon: "🌲", target: 40, desc: "Собери 40 🌲 (БОСС)" }
    ],
    steampunk: [
        { icon: "⚙️", target: 30, desc: "Собери 30 ⚙️" },
        { icon: "🔧", target: 30, desc: "Собери 30 🔧" },
        { icon: "🚂", target: 30, desc: "Собери 30 🚂" },
        { icon: "🕰️", target: 30, desc: "Собери 30 🕰️" },
        { icon: "⚙️", target: 35, desc: "Собери 35 ⚙️" },
        { icon: "🔧", target: 35, desc: "Собери 35 🔧" },
        { icon: "🚂", target: 35, desc: "Собери 35 🚂" },
        { icon: "🕰️", target: 45, desc: "Собери 45 🕰️ (БОСС)" }
    ],
    cyber: [
        { icon: "🤖", target: 40, desc: "Собери 40 🤖" },
        { icon: "👾", target: 40, desc: "Собери 40 👾" },
        { icon: "🛸", target: 40, desc: "Собери 40 🛸" },
        { icon: "💻", target: 40, desc: "Собери 40 💻" },
        { icon: "🤖", target: 45, desc: "Собери 45 🤖" },
        { icon: "👾", target: 45, desc: "Собери 45 👾" },
        { icon: "🛸", target: 45, desc: "Собери 45 🛸" },
        { icon: "💻", target: 50, desc: "Собери 50 💻 (БОСС)" }
    ],
    space: [
        { icon: "🪐", target: 45, desc: "Собери 45 🪐" },
        { icon: "☄️", target: 45, desc: "Собери 45 ☄️" },
        { icon: "🚀", target: 45, desc: "Собери 45 🚀" },
        { icon: "🌌", target: 45, desc: "Собери 45 🌌" },
        { icon: "🪐", target: 50, desc: "Собери 50 🪐" },
        { icon: "☄️", target: 50, desc: "Собери 50 ☄️" },
        { icon: "🚀", target: 50, desc: "Собери 50 🚀" },
        { icon: "🌌", target: 55, desc: "Собери 55 🌌 (ФИНАЛ)" }
    ]
};

const LEVEL_REWARDS = [
    { coins: 80, crystals: 4 }, { coins: 100, crystals: 5 }, { coins: 120, crystals: 6 },
    { coins: 150, crystals: 8 }, { coins: 180, crystals: 10 }, { coins: 220, crystals: 12 },
    { coins: 280, crystals: 15 }, { coins: 400, crystals: 25 }
];

const SKINS = [
    { id: "neon", name: "НЕОНОВЫЙ", icon: "💠", priceCoins: 0, priceCrystals: 0, default: true },
    { id: "gold", name: "ЗОЛОТОЙ", icon: "⭐", priceCoins: 500, priceCrystals: 0 },
    { id: "ice", name: "ЛЕДЯНОЙ", icon: "❄️", priceCoins: 0, priceCrystals: 30 },
    { id: "fire", name: "ОГНЕННЫЙ", icon: "🔥", priceCoins: 0, priceCrystals: 30 }
];

const SHOP_ITEMS = [
    { id: "extra_moves", name: "➕ ДОП. ХОДЫ", desc: "+5 ходов к уровню", priceCoins: 100, priceCrystals: 0, effect: { extraMoves: 5 } },
    { id: "double_score", name: "✨ ДВОЙНОЙ СЧЁТ", desc: "Удвоение очков на уровень", priceCoins: 200, priceCrystals: 0 },
    { id: "combo_boost", name: "⚡ УСИЛИТЕЛЬ", desc: "Старт комбо с x2", priceCoins: 250, priceCrystals: 5 },
    { id: "crystal_pack", name: "💎 КРИСТАЛЛЫ", desc: "+15 кристаллов", priceCoins: 600, priceCrystals: 0, effect: { crystalsGain: 15 } },
    { id: "coin_pack", name: "💰 МОНЕТЫ", desc: "+300 монет", priceCoins: 0, priceCrystals: 5, effect: { coinsGain: 300 } }
];

const SCORE_PER_ELEMENT = 10;
const BONUS_4_IN_ROW = 60;
const BONUS_5_IN_ROW = 120;
const BLACKHOLE_POS = { r: 4, c: 4 };

function getLevelMoves(level) {
    let baseMoves = [22, 20, 18, 18, 16, 15, 15, 12];
    return baseMoves[level - 1] || 18;
}
