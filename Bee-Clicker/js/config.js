const CLICKER_CONFIG = {
    startingState: {
        honey: 0,
        honeyPerSecond: 0,
        clickPower: 1,
        queenLevel: 1,
        queenExp: 0,
        totalClicks: 0,
        totalHoneyEarned: 0,
        buildings: { worker: 0, forager: 0, guard: 0, alchemist: 0, royal: 0 },
        purchasedUpgrades: [],
        unlockedAchievements: []
    },

    buildingsData: {
        worker: { 
            id: "worker",
            name: "🐝 Пчела-новичок", 
            basePrice: 15, 
            hps: 0.2, 
            multiplier: 1.15,
            maxCount: Infinity
        },
        forager: { 
            id: "forager",
            name: "🌸 Пчела-сборщик", 
            basePrice: 100, 
            hps: 1, 
            multiplier: 1.15,
            maxCount: Infinity
        },
        guard: { 
            id: "guard",
            name: "🛡️ Пчела-защитник", 
            basePrice: 1100, 
            hps: 8, 
            multiplier: 1.15,
            maxCount: Infinity
        },
        alchemist: { 
            id: "alchemist",
            name: "🧪 Пчела-знахарь", 
            basePrice: 12000, 
            hps: 47, 
            multiplier: 1.15,
            maxCount: Infinity
        },
        royal: { 
            id: "royal",
            name: "👑 Королевская пчела", 
            basePrice: 130000, 
            hps: 260, 
            multiplier: 1.15,
            maxCount: Infinity
        }
    },

    upgradesData: {
        upgrade_click_1: { 
            id: "upgrade_click_1",
            name: "🍀 Крепкий клевер", 
            price: 250, 
            desc: "Сила клика +3 литра",
            category: "click",
            effect: (state) => { state.clickPower += 3; }
        },
        upgrade_click_2: { 
            id: "upgrade_click_2",
            name: "🏺 Гладкая глина", 
            price: 2500, 
            desc: "Сила клика +15 литров",
            category: "click",
            effect: (state) => { state.clickPower += 15; }
        },
        upgrade_worker_1: { 
            id: "upgrade_worker_1",
            name: "🪵 Дубовые вёдра", 
            price: 600, 
            desc: "Пчёлы-новички x2 эффективнее",
            category: "building",
            effect: (state) => {}
        },
        upgrade_forager_1: { 
            id: "upgrade_forager_1",
            name: "🗺️ Карта полей", 
            price: 4000, 
            desc: "Пчёлы-сборщики x2 эффективнее",
            category: "building",
            effect: (state) => {}
        },
        upgrade_queen_1: { 
            id: "upgrade_queen_1",
            name: "🧬 Маточное молочко", 
            price: 15000, 
            desc: "+30% опыта королеве",
            category: "queen",
            effect: (state) => {}
        }
    },

    getRequiredExpForLevel(level) {
        if (level >= 500) return Infinity;
        if (level < 1) return 1000;
        return Math.floor(1000 * Math.pow(1.14, level - 1));
    },

    getQueenBonus(level) {
        if (level < 1) level = 1;
        return {
            productionMultiplier: 1 + (level * 0.02),
            clickBonus: Math.floor(level / 2)
        };
    },

    getBuildingPrice(key, count) {
        const data = this.buildingsData[key];
        if (!data) return Infinity;
        return Math.floor(data.basePrice * Math.pow(data.multiplier, count));
    },

    getTotalBuildings(state) {
        let total = 0;
        for (let key in state.buildings) {
            total += state.buildings[key] || 0;
        }
        return total;
    }
};
