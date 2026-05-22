// ===================================================================
// КОНФИГ ИГРЫ (CONFIG): 8 КУЛЬТУР И МАГАЗИН АВТОМАТИЗАЦИИ
// ===================================================================

const FARM_CONFIG = {
    startingState: {
        coins: 500, 
        farmLevel: 1,
        autoWaterOwned: false,
        autoHarvestOwned: false,
        autoPlantOwned: false,
        autoSeedsCount: 0,
        fertilizerLevel: 1,
        plots: [],
        inventory: {
            seeds: { carrot: 3, cabbage: 2, corn: 1, grapes: 1, strawberry: 0, pineapple: 0, golden_apple: 0, ancient_fruit: 0 },
            barn: { carrot: 0, cabbage: 0, corn: 0, grapes: 0, strawberry: 0, pineapple: 0, golden_apple: 0, ancient_fruit: 0 }
        }
    },

    gachaPrice: 100,
    gachaChances: { mythic: 0.01, legendary: 0.05, rare: 0.14, uncommon: 0.25, common: 0.55 },

    shopItems: {
        upgrade_plots: { name: "🏠 Расширение фермы", desc: "+3 грядки за уровень", price: 0, type: "expand" },
        auto_water: { name: "💧 Автополив", desc: "Автоматический спринклер", price: 500, type: "autowater" },
        auto_harvest: { name: "🤖 Автосбор", desc: "Робот-крот для сбора", price: 800, type: "autoharvest" },
        auto_plant: { name: "🤖 Робот-Сеятель", desc: "Автоматическая посадка", price: 1200, type: "autoplant" },
        buy_auto_seeds: { name: "🌱 Пакет семян (5 шт)", desc: "Для робота-сеятеля", price: 60, type: "buy_auto_seeds" },
        fertilizer_2: { name: "🧪 Азотное удобрение", desc: "Ускоряет рост в 2 раза", price: 300, type: "fert2" },
        fertilizer_3: { name: "✨ Био-гумус предков", desc: "Ускоряет рост в 3 раза", price: 700, type: "fert3" }
    },

    cropsData: {
        carrot: { name: "🥕 Морковь", rarity: "Обычный", rarityColor: "#b0b0b0", growTime: 10, sellPrice: 15, minSeedsDrop: 1, maxSeedsDrop: 2, stagesVisual: ["🌱", "🌿", "🥕"] },
        cabbage: { name: "🥬 Капуста", rarity: "Обычный", rarityColor: "#b0b0b0", growTime: 15, sellPrice: 25, minSeedsDrop: 1, maxSeedsDrop: 2, stagesVisual: ["🌱", "🥗", "🥬"] },
        corn: { name: "🌽 Кукуруза", rarity: "Обычный", rarityColor: "#b0b0b0", growTime: 20, sellPrice: 35, minSeedsDrop: 1, maxSeedsDrop: 2, stagesVisual: ["🌱", "🌾", "🌽"] },
        grapes: { name: "🍇 Виноград", rarity: "Необычный", rarityColor: "#1e90ff", growTime: 30, sellPrice: 55, minSeedsDrop: 1, maxSeedsDrop: 3, stagesVisual: ["🌱", "🍇", "✨"] },
        strawberry: { name: "🍓 Клубника", rarity: "Необычный", rarityColor: "#1e90ff", growTime: 40, sellPrice: 75, minSeedsDrop: 1, maxSeedsDrop: 3, stagesVisual: ["🌱", "☘️", "🍓✨"] },
        pineapple: { name: "🍍 Ананас", rarity: "Редкий", rarityColor: "#a335ee", growTime: 60, sellPrice: 120, minSeedsDrop: 1, maxSeedsDrop: 2, stagesVisual: ["🌱", "🌵", "🍍👑"] },
        golden_apple: { name: "🍎 Золотое яблоко", rarity: "Легендарный", rarityColor: "#ff8000", growTime: 120, sellPrice: 350, minSeedsDrop: 0, maxSeedsDrop: 2, stagesVisual: ["🌱", "🌳", "🍎👑"] },
        ancient_fruit: { name: "🔮 Древний плод", rarity: "Мифический", rarityColor: "#ff0077", growTime: 240, sellPrice: 999, minSeedsDrop: 0, maxSeedsDrop: 1, stagesVisual: ["🌱", "✨", "🔮💎"] }
    },

    rollGacha: function() {
        const rand = Math.random();
        if (rand < this.gachaChances.mythic) return "ancient_fruit";
        if (rand < this.gachaChances.mythic + this.gachaChances.legendary) return "golden_apple";
        if (rand < this.gachaChances.mythic + this.gachaChances.legendary + this.gachaChances.rare) return "pineapple";
        if (rand < this.gachaChances.mythic + this.gachaChances.legendary + this.gachaChances.rare + this.gachaChances.uncommon) {
            return Math.random() > 0.5 ? "grapes" : "strawberry";
        }
        const commons = ["carrot", "cabbage", "corn"];
        return commons[Math.floor(Math.random() * commons.length)];
    }
};
