const CLICKER_CONFIG = {
    startingState: {
        honey: 0,
        honeyPerSecond: 0,
        clickPower: 1,
        queenLevel: 1,
        queenExp: 0,
        totalClicks: 0,       // Для ачивок
        totalHoneyEarned: 0,  // Для ачивок
        buildings: { worker: 0, forager: 0, guard: 0, alchemist: 0, royal: 0 },
        purchasedUpgrades: [], // Хранилище купленных апгрейдов
        unlockedAchievements: []
    },

    buildingsData: {
        worker: { name: "🐝 Пчела-новичок", basePrice: 15, hps: 0.2, multiplier: 1.15 },
        forager: { name: "🌸 Пчела-сборщик", basePrice: 100, hps: 1, multiplier: 1.15 },
        guard: { name: "🛡️ Пчела-защитник", basePrice: 1100, hps: 8, multiplier: 1.15 },
        alchemist: { name: "🧪 Пчела-знахарь", basePrice: 12000, hps: 47, multiplier: 1.15 },
        royal: { name: "👑 Королевская пчела", basePrice: 130000, hps: 260, multiplier: 1.15 }
    },

    // НАШИ НОВЫЕ ЛОРНЫЕ УЛУЧШЕНИЯ (АПГРЕЙДЫ)
    upgradesData: {
        upgrade_click_1: { name: "🍀 Крепкий клевер", price: 250, desc: "Сила твоего клика навсегда увеличивается на +3 литра.", effect: (st) => {} },
        upgrade_click_2: { name: "🏺 Гладкая глина", price: 2500, desc: "Сила твоего клика навсегда увеличивается на +15 литров.", effect: (st) => {} },
        upgrade_worker_1: { name: "🪵 Дубовые вёдра", price: 600, desc: "Пчёлы-новички работают в 2 раза эффективнее!", effect: (st) => {} },
        upgrade_forager_1: { name: "🗺️ Карта полей", price: 4000, desc: "Пчёлы-сборщики работают в 2 раза эффективнее!", effect: (st) => {} },
        upgrade_queen_1: { name: "🧬 Маточное молочко", price: 15000, desc: "Королева улья получает на 30% больше опыта со всех источников.", effect: (st) => {} }
    },

    getRequiredExpForLevel(level) {
        if (level >= 500) return Infinity;
        return Math.floor(1000 * Math.pow(1.14, level - 1));
    },

    getQueenBonus(level) {
        return {
            productionMultiplier: 1 + (level * 0.02),
            clickBonus: Math.floor(level / 2)
        };
    }
};
