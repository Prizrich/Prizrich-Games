// ===================================================================
// ОСНОВНАЯ ЛОГИКА ИГРЫ PIXEL FARM
// ===================================================================

let state = null;
let wateringToolActive = false;
let activeSeedToPlant = null;
let marketMultipliers = { carrot: 1.0, cabbage: 1.0, strawberry: 1.0, golden_apple: 1.0 };

const FIREBASE_DB_URL = "https://games-farm-default-rtdb.firebaseio.com/";
let onlineMarketOrders = [];
let playerName = "Фермер";

// ========== СИСТЕМА ОГРАНИЧЕНИЯ СМЕНЫ НИКА (РАЗ В МЕСЯЦ) ==========
function canChangeNickname() {
    const lastChange = localStorage.getItem("pixel_farm_last_nick_change");
    if (!lastChange) return true;
    
    const lastChangeDate = new Date(parseInt(lastChange));
    const now = new Date();
    
    const monthLater = new Date(lastChangeDate);
    monthLater.setMonth(monthLater.getMonth() + 1);
    
    return now >= monthLater;
}

function getDaysUntilNicknameChange() {
    const lastChange = localStorage.getItem("pixel_farm_last_nick_change");
    if (!lastChange) return 0;
    
    const lastChangeDate = new Date(parseInt(lastChange));
    const nextChangeDate = new Date(lastChangeDate);
    nextChangeDate.setMonth(nextChangeDate.getMonth() + 1);
    
    const now = new Date();
    const diffMs = nextChangeDate - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
}

function getFormattedTimeUntilNicknameChange() {
    const lastChange = localStorage.getItem("pixel_farm_last_nick_change");
    if (!lastChange) return null;
    
    const lastChangeDate = new Date(parseInt(lastChange));
    const nextChangeDate = new Date(lastChangeDate);
    nextChangeDate.setMonth(nextChangeDate.getMonth() + 1);
    
    const now = new Date();
    const diffMs = nextChangeDate - now;
    
    if (diffMs <= 0) return null;
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
        return `${diffDays} ${getDeclension(diffDays, ['день', 'дня', 'дней'])}`;
    } else if (diffHours > 0) {
        return `${diffHours} ${getDeclension(diffHours, ['час', 'часа', 'часов'])}`;
    } else {
        return `${diffMinutes} ${getDeclension(diffMinutes, ['минуту', 'минуты', 'минут'])}`;
    }
}

function getDeclension(number, titles) {
    const cases = [2, 0, 1, 1, 1, 2];
    return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
}

function setNicknameChangeDate() {
    localStorage.setItem("pixel_farm_last_nick_change", Date.now().toString());
}

// ========== ЧИСТЫЙ СТАРТ ДЛЯ НОВОГО ИГРОКА ==========
function setupCleanState() {
    console.log("🧺 Создаём чистый профиль для нового фермера...");
    
    state = {
        coins: 500,
        farmLevel: 1,
        autoWaterOwned: false,
        autoHarvestOwned: false,
        autoPlantOwned: false,
        autoSeedsCount: 0,
        fertilizerLevel: 1,
        inventory: {
            seeds: { carrot: 3, cabbage: 2, strawberry: 1, golden_apple: 0 },
            barn: { carrot: 0, cabbage: 0, strawberry: 0, golden_apple: 0 }
        },
        plots: []
    };
    
    for (let i = 0; i < 36; i++) {
        state.plots.push({ 
            id: i, 
            opened: i < 3, 
            planted: null, 
            stage: 0, 
            watered: false, 
            growTimeLeft: 0 
        });
    }
    
    localStorage.setItem("pixel_farm_state_v11", JSON.stringify(state));
    
    if (typeof generateFarmGridUI === 'function') {
        generateFarmGridUI();
    }
    if (typeof updateFarmUI === 'function') {
        updateFarmUI();
    }
    
    console.log("✅ Чистый профиль создан, грядок:", state.plots.length);
}

// Загрузка ника из localStorage при старте
function loadPlayerName() {
    const savedName = localStorage.getItem("pixel_farm_player_name");
    if (savedName) {
        playerName = savedName;
    } else {
        playerName = "Фермер_" + Math.floor(Math.random() * 1000);
        localStorage.setItem("pixel_farm_player_name", playerName);
        setNicknameChangeDate();
    }
    
    const nameInput = document.getElementById("ui-player-name");
    if (nameInput) {
        nameInput.value = playerName;
        if (!canChangeNickname()) {
            nameInput.readOnly = true;
        } else {
            nameInput.readOnly = false;
        }
    }
    
    updateNicknameStatus();
}

// ОБНОВЛЕНИЕ UI
function updateFarmUI() {
    if (!state) return;
    
    const coinElem = document.getElementById("ui-coins");
    const lvlElem = document.getElementById("ui-farm-lvl");
    const autoStatusElem = document.getElementById("ui-auto-status");
    const harvesterStatusElem = document.getElementById("ui-harvester-status");
    const fertStatusElem = document.getElementById("ui-fert-status");
    
    if (coinElem) coinElem.innerText = state.coins;
    if (lvlElem) lvlElem.innerText = state.farmLevel;
    if (autoStatusElem) autoStatusElem.innerText = state.autoWaterOwned ? "💧 Автополив: Вкл" : "💧 Автополив: Выкл";
    if (harvesterStatusElem) harvesterStatusElem.innerText = state.autoHarvestOwned ? "🤖 Автосбор: Вкл" : "🤖 Автосбор: Выкл";
    
    // ОТОБРАЖЕНИЕ АВТОПОСАДКИ
    const planterStatus = document.getElementById("ui-planter-status");
    const autoSeedsCount = document.getElementById("ui-auto-seeds-count");
    
    if (planterStatus) {
        planterStatus.innerText = state.autoPlantOwned ? "🤖 Автопосадка: Вкл" : "🤖 Автопосадка: Выкл";
        planterStatus.style.color = state.autoPlantOwned ? "#9333ea" : "#5c5c5c";
    }
    if (autoSeedsCount) {
        autoSeedsCount.innerText = state.autoSeedsCount || 0;
    }
    
    const fertNames = ["", "х1 (Обычное)", "х2 (Азотное) 🧪", "х3 (Био-гумус) ✨"];
    if (fertStatusElem) fertStatusElem.innerText = `⚡ Удобрение: ${fertNames[state.fertilizerLevel] || "х1"}`;
    
    updateShopUI();
    updateSeedsUI();
    updateBarnUI();
}

function updateNicknameStatus() {
    const nameInput = document.getElementById("ui-player-name");
    const saveBtn = document.querySelector("button[onclick='window.savePlayerName()']");
    
    if (!nameInput || !saveBtn) return;
    
    if (!canChangeNickname()) {
        const timeLeft = getFormattedTimeUntilNicknameChange();
        nameInput.readOnly = true;
        nameInput.style.backgroundColor = "#e0d4c0";
        nameInput.style.color = "#888";
        saveBtn.disabled = true;
        saveBtn.style.opacity = "0.5";
        saveBtn.style.cursor = "not-allowed";
        saveBtn.title = `Сменить ник можно будет через ${timeLeft}`;
        
        let hint = document.getElementById("nickname-hint");
        if (!hint) {
            hint = document.createElement("div");
            hint.id = "nickname-hint";
            hint.style.fontSize = "11px";
            hint.style.color = "#ffaa66";
            hint.style.marginTop = "6px";
            hint.style.padding = "4px 8px";
            hint.style.background = "rgba(0,0,0,0.5)";
            hint.style.borderRadius = "8px";
            hint.style.display = "inline-block";
            nameInput.parentNode.appendChild(hint);
        }
        hint.innerHTML = `⏰ Сменить ник можно будет через ${timeLeft}`;
    } else {
        nameInput.readOnly = false;
        nameInput.style.backgroundColor = "#fff";
        nameInput.style.color = "#4a2f15";
        saveBtn.disabled = false;
        saveBtn.style.opacity = "1";
        saveBtn.style.cursor = "pointer";
        saveBtn.title = "Сохранить новое имя";
        
        const hint = document.getElementById("nickname-hint");
        if (hint) hint.remove();
    }
}

// ========== МАГАЗИН ==========
function updateShopUI() {
    const shopBox = document.getElementById("ui-shop-list");
    if (!shopBox) return; shopBox.innerHTML = "";

    for (let itemId in FARM_CONFIG.shopItems) {
        const item = FARM_CONFIG.shopItems[itemId];
        
        if (itemId === "auto_water" && state.autoWaterOwned) continue;
        if (itemId === "auto_harvest" && state.autoHarvestOwned) continue;
        if (itemId === "auto_plant" && state.autoPlantOwned) continue;
        if (itemId === "fertilizer_2" && state.fertilizerLevel >= 2) continue;
        if (itemId === "fertilizer_3" && state.fertilizerLevel >= 3) continue;
        if (itemId === "upgrade_plots" && state.farmLevel >= 12) continue;

        let price = item.type === "expand" ? state.farmLevel * 450 : item.price;
        const card = document.createElement("div"); 
        card.className = "inventory-item"; 
        card.style.fontSize = "0.75rem"; 
        card.style.padding = "5px";
        
        card.innerHTML = `
            <div style="display:flex; flex-direction:column; text-align:left; max-width:65%;">
                <span style="font-weight:bold; color:#4a2f15;">${item.name}</span>
                <span style="font-size:0.65rem; color:#666;">${item.desc}</span>
            </div>
            <button class="mini-plant-btn" style="padding:4px 6px;" onclick="window.buyShopItem('${itemId}')">🛒 ${price}</button>
        `;
        shopBox.appendChild(card);
    }
}

function updateSeedsUI() {
    const box = document.getElementById("ui-seeds-list");
    if (!box) return;
    box.innerHTML = "";
    
    for (let key in state.inventory.seeds) {
        const count = state.inventory.seeds[key];
        const div = document.createElement("div");
        div.className = "seed-item";
        div.innerHTML = `
            <span><b>${FARM_CONFIG.cropsData[key].name}</b> x${count}</span>
            <button class="mini-plant-btn" ${count <= 0 ? 'disabled' : ''} onclick="window.selectSeedForPlanting('${key}')">🌱 Взять</button>
        `;
        box.appendChild(div);
    }
}

function updateBarnUI() {
    const box = document.getElementById("ui-barn-list");
    if (!box) return; box.innerHTML = "";

    for (let key in state.inventory.barn) {
        const count = state.inventory.barn[key];
        if (count > 0) {
            const div = document.createElement("div");
            div.className = "barn-item";
            div.innerHTML = `<span>${FARM_CONFIG.cropsData[key].name}</span><b>${count} шт</b>`;
            box.appendChild(div);
        }
    }
}

// ========== ГЕНЕРАЦИЯ СЕТКИ ПОЛЯ ==========
function generateFarmGridUI() {
    if (!state || !state.plots) return;
    
    const grid = document.getElementById("farm-plots-grid");
    if (!grid) return;
    
    grid.innerHTML = "";
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(6, 1fr)";
    grid.style.gap = "8px";

    state.plots.forEach(plot => {
        const block = document.createElement("div");
        block.className = "plot-block";
        block.id = `plot-${plot.id}`;
        block.onclick = () => window.handlePlotClick(plot.id);
        grid.appendChild(block);
    });
    
    updateFarmGridValues();
}

function updateFarmGridValues() {
    if (!state || !state.plots) return;
    
    state.plots.forEach(plot => {
        const block = document.getElementById(`plot-${plot.id}`);
        if (!block) return;
        
        block.classList.remove("watered");
        block.style.opacity = "1";
        block.style.cursor = "pointer";
        
        if (!plot.opened) {
            block.innerHTML = "<div class='crop-stage' style='opacity:0.35;'>🌿</div>";
            block.style.backgroundColor = "#466d1d";
            block.style.boxShadow = "inset -2px -2px 0px #2a4410, inset 2px 2px 0px #639b2a";
            block.style.borderColor = "#1e3307";
            block.style.cursor = "not-allowed";
            return;
        }
        
        block.style.backgroundColor = "#704722";
        block.style.boxShadow = "inset -4px -4px 0px #4a2f15, inset 4px 4px 0px #946132";
        block.style.borderColor = "#301e0e";
        
        if (!plot.planted) {
            block.innerHTML = "<div class='soil-empty'>Посадить</div>";
        } else {
            if (plot.watered) block.classList.add("watered");
            let stageIcon = FARM_CONFIG.cropsData[plot.planted]?.stagesVisual[plot.stage] || "🌱";
            
            let timerText = plot.stage === 2 ? "<span class='ready-tag'>СБОР!</span>" : (plot.watered ? `⏱ ${plot.growTimeLeft}с` : `<span style='color: #00aaff;'>💧 ПОЛИВ</span>`);
            block.innerHTML = `<div class="crop-stage">${stageIcon}</div><div class="crop-timer">${timerText}</div>`;
        }
    });
}

// ========== МАССОВАЯ ПОСАДКА ==========
window.triggerMassPlanting = function() {
    if (!state) return;
    
    // Получаем выбранную культуру из дропдауна
    const cropSelect = document.getElementById("mass-plant-crop-select");
    if (!cropSelect) {
        alert("Элемент mass-plant-crop-select не найден!");
        return;
    }
    
    const cropId = cropSelect.value;
    const cropInfo = FARM_CONFIG.cropsData[cropId];
    
    if (!cropInfo) {
        alert("Культура не найдена!");
        return;
    }
    
    const availableSeeds = state.inventory.seeds[cropId] || 0;
    
    if (availableSeeds <= 0) {
        alert(`У вас нет семян ${cropInfo.name} для посадки!`);
        return;
    }
    
    // Находим все пустые открытые грядки
    const emptyPlots = state.plots.filter(plot => plot.opened && !plot.planted);
    
    if (emptyPlots.length === 0) {
        alert("Нет свободных открытых грядок для посадки!");
        return;
    }
    
    let plantedCount = 0;
    
    // Сажаем, пока есть семена и пустые грядки
    for (let plot of emptyPlots) {
        if (availableSeeds <= plantedCount) break;
        
        plot.planted = cropId;
        plot.growTimeLeft = cropInfo.growTime;
        plot.stage = 0;
        plot.watered = false;
        plantedCount++;
    }
    
    // Списываем использованные семена
    state.inventory.seeds[cropId] -= plantedCount;
    
    saveGame();
    updateFarmUI();
    updateFarmGridValues();
    
    showNotification("🌱 Массовая посадка", `Посажено ${plantedCount} шт ${cropInfo.name}! Осталось семян: ${state.inventory.seeds[cropId]}`);
};

// ========== ИНИЦИАЛИЗАЦИЯ ==========
function initFarmGame() {
    console.log("🚀 Инициализация игры...");
    
    const saved = localStorage.getItem("pixel_farm_state_v11");
    
    if (saved) {
        try {
            state = JSON.parse(saved);
            if (!state.plots || state.plots.length === 0) {
                console.log("⚠️ Сейв без грядок, создаём новые");
                setupCleanState();
            }
            if (state.autoSeedsCount === undefined) state.autoSeedsCount = 0;
            if (state.autoPlantOwned === undefined) state.autoPlantOwned = false;
        } catch(e) {
            console.log("⚠️ Ошибка чтения сейва, создаём новый");
            setupCleanState();
        }
    } else {
        console.log("🆕 Новый игрок, создаём профиль");
        setupCleanState();
    }
    
    loadPlayerName();
    
    generateFarmGridUI();
    updateFarmUI();
    simulateMarketTrends();
    fetchOnlineMarketOrders();
    
    setInterval(() => {
        if (!state) return;
        
        state.plots.forEach(plot => {
            // АВТОПОЛИВ
            if (state.autoWaterOwned && plot.opened && plot.planted && plot.growTimeLeft > 0) {
                plot.watered = true;
            }
            
            // РОСТ
            if (plot.opened && plot.planted && plot.growTimeLeft > 0 && plot.watered) {
                const boost = state.fertilizerLevel || 1;
                plot.growTimeLeft = Math.max(0, plot.growTimeLeft - boost);
                if (plot.growTimeLeft === 0) plot.stage = 2;
            }
            
            // АВТОСБОР
            if (state.autoHarvestOwned && plot.opened && plot.planted && plot.stage === 2) {
                triggerAutoHarvest(plot);
            }
            
            // АВТОПОСАДКА
            if (state.autoPlantOwned && state.autoSeedsCount > 0 && plot.opened && !plot.planted) {
                state.autoSeedsCount--;
                plot.planted = "carrot";
                plot.growTimeLeft = FARM_CONFIG.cropsData["carrot"].growTime;
                plot.stage = 0;
                plot.watered = false;
                showNotification("🤖 Робот-Сеятель", "Зарядил морковь на грядку!");
                saveGame();
                updateFarmUI();
            }
        });
        
        updateFarmGridValues();
    }, 1000);
    
    setInterval(simulateMarketTrends, 15000);
    setInterval(fetchOnlineMarketOrders, 5000);
    
    console.log("✅ Игра готова! Ник игрока:", playerName);
    showNotification("", "Добро пожаловать на ферму! 🌾");
}

// ========== ОСНОВНЫЕ ДЕЙСТВИЯ ==========
window.savePlayerName = function() {
    if (!canChangeNickname()) {
        const timeLeft = getFormattedTimeUntilNicknameChange();
        alert(`🔒 Сменить имя можно только 1 раз в месяц!\n\n⏰ Следующая смена доступна через: ${timeLeft}\n\nТвой текущий ник: "${playerName}"`);
        const nameInput = document.getElementById("ui-player-name");
        if (nameInput) nameInput.value = playerName;
        return;
    }
    
    const input = document.getElementById("ui-player-name");
    if (input) {
        const newName = input.value.trim();
        
        if (!newName) {
            alert("❌ Имя не может быть пустым!");
            input.value = playerName;
            return;
        }
        
        if (newName.length < 2) {
            alert("❌ Имя должно содержать минимум 2 символа!");
            input.value = playerName;
            return;
        }
        
        if (newName.length > 20) {
            alert("❌ Имя не должно превышать 20 символов!");
            input.value = playerName;
            return;
        }
        
        const invalidChars = /[<>{}[\]\\|]/;
        if (invalidChars.test(newName)) {
            alert("❌ Имя содержит недопустимые символы!");
            input.value = playerName;
            return;
        }
        
        if (newName === playerName) {
            alert("ℹ️ Имя не изменилось");
            return;
        }
        
        const oldName = playerName;
        playerName = newName;
        localStorage.setItem("pixel_farm_player_name", playerName);
        setNicknameChangeDate();
        
        alert(`✅ Имя успешно изменено!\n\nБыл: "${oldName}"\nСтал: "${playerName}"\n\n📅 Следующая смена будет доступна через 30 дней.`);
        
        showNotification("", `Имя изменено на: ${playerName}`);
        updateNicknameStatus();
        fetchOnlineMarketOrders();
    }
};

window.toggleWateringTool = function() {
    wateringToolActive = !wateringToolActive;
    activeSeedToPlant = null;
    const btn = document.getElementById("tool-watering-can");
    if (btn) {
        btn.innerText = wateringToolActive ? "💧 Лейка (Вкл)" : "💧 Взять лейку";
        btn.style.background = wateringToolActive ? "#4a8c5c" : "";
    }
};

window.selectSeedForPlanting = function(cropId) {
    if (!state || state.inventory.seeds[cropId] <= 0) return;
    wateringToolActive = false;
    activeSeedToPlant = cropId;
    
    const btn = document.getElementById("tool-watering-can");
    if (btn) {
        btn.innerText = "💧 Взять лейку";
        btn.style.background = "";
    }
    
    showNotification("", `Выбрано: ${FARM_CONFIG.cropsData[cropId].name}`);
};

window.handlePlotClick = function(plotId) {
    if (!state) return;
    const plot = state.plots.find(p => p.id === plotId);
    if (!plot || !plot.opened) return;
    
    if (wateringToolActive) {
        if (plot.planted && !plot.watered && plot.growTimeLeft > 0) {
            plot.watered = true;
            updateFarmGridValues();
            showNotification(FARM_CONFIG.cropsData[plot.planted].name, "полито! 💧");
        }
        return;
    }
    
    if (!plot.planted) {
        if (activeSeedToPlant && state.inventory.seeds[activeSeedToPlant] > 0) {
            state.inventory.seeds[activeSeedToPlant]--;
            plot.planted = activeSeedToPlant;
            plot.growTimeLeft = FARM_CONFIG.cropsData[activeSeedToPlant].growTime;
            plot.stage = 0;
            plot.watered = false;
            
            if (state.inventory.seeds[activeSeedToPlant] <= 0) activeSeedToPlant = null;
            
            saveGame();
            updateFarmUI();
            updateFarmGridValues();
            showNotification(FARM_CONFIG.cropsData[plot.planted]?.name, "посажены! 🌱");
        }
        return;
    }
    
    if (plot.stage === 2) {
        const cropId = plot.planted;
        const info = FARM_CONFIG.cropsData[cropId];
        
        state.inventory.barn[cropId] = (state.inventory.barn[cropId] || 0) + 1;
        
        const minDrop = info.minSeedsDrop || 1;
        const maxDrop = info.maxSeedsDrop || 2;
        const seedsDropped = Math.floor(Math.random() * (maxDrop - minDrop + 1)) + minDrop;
        state.inventory.seeds[cropId] = (state.inventory.seeds[cropId] || 0) + seedsDropped;
        
        showNotification(info.name, `собран! +${seedsDropped} семян 🌾`);
        
        plot.planted = null;
        plot.stage = 0;
        plot.growTimeLeft = 0;
        plot.watered = false;
        
        saveGame();
        updateFarmUI();
        updateFarmGridValues();
    }
};

function triggerAutoHarvest(plot) {
    const cropId = plot.planted;
    const info = FARM_CONFIG.cropsData[cropId];
    
    state.inventory.barn[cropId] = (state.inventory.barn[cropId] || 0) + 1;
    
    const minDrop = info.minSeedsDrop || 1;
    const maxDrop = info.maxSeedsDrop || 2;
    const seedsDropped = Math.floor(Math.random() * (maxDrop - minDrop + 1)) + minDrop;
    state.inventory.seeds[cropId] = (state.inventory.seeds[cropId] || 0) + seedsDropped;
    
    plot.planted = null;
    plot.stage = 0;
    plot.growTimeLeft = 0;
    plot.watered = false;
    
    saveGame();
    updateFarmUI();
}

// ========== ПОКУПКА ==========
window.buyShopItem = function(itemId) {
    if (!state) return; 
    const item = FARM_CONFIG.shopItems[itemId]; 
    let currentPrice = item.type === "expand" ? state.farmLevel * 450 : item.price;
    
    if (state.coins >= currentPrice) {
        state.coins -= currentPrice;
        
        if (item.type === "expand") {
            state.farmLevel++; 
            let startIndex = (state.farmLevel - 1) * 3;
            for (let i = startIndex; i < startIndex + 3 && i < state.plots.length; i++) { 
                if (state.plots[i]) state.plots[i].opened = true; 
            }
            generateFarmGridUI();
        } 
        else if (item.type === "autowater") { state.autoWaterOwned = true; } 
        else if (item.type === "autoharvest") { state.autoHarvestOwned = true; } 
        else if (item.type === "autoplant") { state.autoPlantOwned = true; } 
        else if (item.type === "buy_auto_seeds") { state.autoSeedsCount = (state.autoSeedsCount || 0) + 5; }
        else if (item.type === "fert2") { state.fertilizerLevel = 2; } 
        else if (item.type === "fert3") { state.fertilizerLevel = 3; }
        
        showNotification("", `Куплено: ${item.name}!`);
        saveGame(); 
        updateFarmUI(); 
        updateFarmGridValues();
    } else { 
        alert("Не хватает золота!"); 
    }
};

window.sellAllCrops = function() {
    if (!state) return;
    let total = 0;
    
    for (let crop in state.inventory.barn) {
        const count = state.inventory.barn[crop];
        if (count > 0) {
            total += count * Math.floor(FARM_CONFIG.cropsData[crop].sellPrice * (marketMultipliers[crop] || 1));
            state.inventory.barn[crop] = 0;
        }
    }
    
    if (total > 0) {
        state.coins += total;
        showNotification("", `Продано за ${total} монет! 💰`);
        saveGame();
        updateFarmUI();
        updateBarnUI();
    } else {
        alert("Амбар пуст!");
    }
};

window.triggerGachaRoll = function() {
    if (!state) return;
    
    if (state.coins >= FARM_CONFIG.gachaPrice) {
        state.coins -= FARM_CONFIG.gachaPrice;
        const rolledCrop = FARM_CONFIG.rollGacha();
        state.inventory.seeds[rolledCrop] = (state.inventory.seeds[rolledCrop] || 0) + 1;
        
        const info = FARM_CONFIG.cropsData[rolledCrop];
        const resultEl = document.getElementById("ui-gacha-result");
        
        if (resultEl) {
            resultEl.style.display = "block";
            resultEl.style.background = "#d4af37";
            resultEl.style.padding = "8px";
            resultEl.style.borderRadius = "10px";
            resultEl.style.marginTop = "10px";
            resultEl.style.textAlign = "center";
            resultEl.innerHTML = `✨ Получено: ${info.name} (${info.rarity}★)! ✨`;
            setTimeout(() => { resultEl.style.display = "none"; }, 3000);
        }
        
        saveGame();
        updateFarmUI();
        updateSeedsUI();
    } else {
        alert("Не хватает монет!");
    }
};

function simulateMarketTrends() {
    const pricesBox = document.getElementById("ui-market-prices"); 
    if (!pricesBox) return; pricesBox.innerHTML = "";
    
    for (let cropId in FARM_CONFIG.cropsData) {
        let changePercent = Math.floor(Math.random() * 71) - 30; 
        marketMultipliers[cropId] = 1 + (changePercent / 100);
        
        const crop = FARM_CONFIG.cropsData[cropId]; 
        const currentPrice = Math.floor(crop.sellPrice * marketMultipliers[cropId]);
        
        let arrow = changePercent >= 0 ? "📈" : "📉"; 
        let color = changePercent >= 0 ? "#2d6a4f" : "#a83232";
        
        const line = document.createElement("div"); 
        line.className = "market-price-line";
        line.innerHTML = `<span>${crop.name}</span><span style="color:${color};">${currentPrice} Золота (${arrow} ${Math.abs(changePercent)}%)</span>`;
        pricesBox.appendChild(line);
    }
}

function showNotification(cropName, text) {
    const container = document.getElementById("farm-toast-container");
    if (!container) return;
    
    const toast = document.createElement("div");
    toast.className = "farm-toast";
    toast.innerHTML = cropName ? `🌾 ${cropName} ${text}` : `🌾 ${text}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

// ========== FIREBASE РЫНОК ==========
function fetchOnlineMarketOrders() {
    fetch(`${FIREBASE_DB_URL}/market.json`)
        .then(res => res.json())
        .then(data => {
            onlineMarketOrders = [];
            if (data) {
                for (let key in data) {
                    onlineMarketOrders.push({ id: key, seller: data[key].seller, crop: data[key].crop, amount: data[key].amount || 1, price: data[key].price });
                }
            }
            renderMarketBoardUI();
        })
        .catch(err => {
            console.log("Firebase ошибка:", err);
            const board = document.getElementById("ui-market-board");
            if (board) {
                board.innerHTML = '<div style="padding:20px; text-align:center;">🌐 Настройте Firebase</div>';
            }
        });
}

function renderMarketBoardUI() {
    const board = document.getElementById("ui-market-board"); 
    if (!board) return; board.innerHTML = "";
    
    if (onlineMarketOrders.length === 0) { 
        board.innerHTML = `<div style="font-size:0.75rem; color:#8a6529; text-align:center; padding-top:15px;">На рынке пока нет товаров.<br>Будь первым, выстави урожай!</div>`; 
        return; 
    }
    
    onlineMarketOrders.forEach(order => {
        const cropInfo = FARM_CONFIG.cropsData[order.crop]; 
        if (!cropInfo) return;
        
        const line = document.createElement("div"); 
        line.className = "market-price-line"; 
        line.style.fontSize = "0.75rem"; 
        line.style.alignItems = "center";
        
        let isMyOrder = order.seller === playerName; 
        let btnText = isMyOrder ? "Снять" : "Купить"; 
        let btnColor = isMyOrder ? "#ba2929" : "#a3723b";
        
        let orderAmount = order.amount || 1;
        
        line.innerHTML = `
            <div style="display:flex; flex-direction:column; text-align:left; max-width:60%;">
                <span style="font-weight:bold; color:${isMyOrder ? '#ba2929' : '#4a2f15'};">[${order.seller}]</span>
                <span>${cropInfo.name} (x${orderAmount})</span>
            </div>
            <button class="mini-plant-btn" style="background-color:${btnColor}; padding:3px 6px;" onclick="window.handleMarketOrderClick('${order.id}')">
                ${btnText} (${order.price})
            </button>
        `;
        board.appendChild(line);
    });
}

window.handleMarketOrderClick = function(orderId) {
    const order = onlineMarketOrders.find(o => o.id === orderId);
    if (!order) return;
    
    if (order.seller === playerName) {
        fetch(`${FIREBASE_DB_URL}/market/${orderId}.json`, { method: "DELETE" })
            .then(() => {
                state.inventory.barn[order.crop] = (state.inventory.barn[order.crop] || 0) + (order.amount || 1);
                saveGame();
                updateFarmUI();
                fetchOnlineMarketOrders();
                showNotification("", "Товар снят с рынка");
            });
    } else if (state.coins >= order.price) {
        fetch(`${FIREBASE_DB_URL}/market/${orderId}.json`, { method: "DELETE" })
            .then(() => {
                state.coins -= order.price;
                state.inventory.barn[order.crop] = (state.inventory.barn[order.crop] || 0) + (order.amount || 1);
                saveGame();
                updateFarmUI();
                fetchOnlineMarketOrders();
                showNotification("", `Куплено за ${order.price} монет!`);
            })
            .catch(() => alert("Товар уже купили!"));
    } else {
        alert("Не хватает золота!");
    }
};

window.updateModalStockCount = function() {
    if (!state || !state.inventory || !state.inventory.barn) return;
    const cropSelect = document.getElementById("modal-sell-crop-select");
    const stockDisplay = document.getElementById("modal-stock-count");
    
    if (cropSelect && stockDisplay) {
        const cropId = cropSelect.value;
        const count = state.inventory.barn[cropId] || 0;
        stockDisplay.innerText = `В амбаре: ${count} шт.`;
        stockDisplay.style.color = count > 0 ? "#5c8a36" : "#ba2929";
    }
};

window.openCreateOrderModal = function() {
    const modal = document.getElementById("farm-market-modal");
    if (modal) {
        modal.style.display = "flex";
        window.updateModalStockCount();
        
        const amountInput = document.getElementById("modal-sell-amount-input");
        const priceInput = document.getElementById("modal-sell-price-input");
        if (amountInput) amountInput.value = 1;
        if (priceInput) priceInput.value = 10;
    }
};

window.closeCreateOrderModal = function() {
    const modal = document.getElementById("farm-market-modal");
    if (modal) modal.style.display = "none";
};

window.submitPlayerMarketOrder = function() {
    if (!state) return;
    
    const cropSelect = document.getElementById("modal-sell-crop-select");
    const amountInput = document.getElementById("modal-sell-amount-input");
    const priceInput = document.getElementById("modal-sell-price-input");
    
    if (!cropSelect || !amountInput || !priceInput) {
        alert("Ошибка: не найдены поля формы!");
        return;
    }

    const cropId = cropSelect.value;
    const amount = parseInt(amountInput.value);
    const price = parseInt(priceInput.value);

    if (isNaN(amount) || amount <= 0) {
        alert("Введите корректное количество (целое число > 0)!");
        return;
    }
    
    if (isNaN(price) || price <= 0) {
        alert("Введите корректную цену (целое число > 0)!");
        return;
    }

    const currentStock = state.inventory.barn[cropId] || 0;
    if (currentStock >= amount) {
        state.inventory.barn[cropId] -= amount;
        
        fetch(`${FIREBASE_DB_URL}/market.json`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ 
                seller: playerName, 
                crop: cropId, 
                amount: amount,
                price: price,
                timestamp: Date.now()
            })
        }).then(() => {
            window.closeCreateOrderModal();
            saveGame();
            updateFarmUI();
            fetchOnlineMarketOrders();
            showNotification("", `Товар (${amount} шт) выставлен на рынок за ${price}💰!`);
        }).catch(err => {
            console.error("Ошибка при отправке:", err);
            alert("Ошибка подключения к рынку!");
            state.inventory.barn[cropId] = (state.inventory.barn[cropId] || 0) + amount;
            saveGame();
            updateFarmUI();
        });
    } else {
        alert(`В амбаре нет столько плодов!\n\n📦 У тебя всего: ${currentStock} шт.\n🌾 Запрошено: ${amount} шт.`);
    }
};

function saveGame() {
    if (state) {
        localStorage.setItem("pixel_farm_state_v11", JSON.stringify(state));
    }
}

// АВТОЗАПУСК
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFarmGame);
} else {
    initFarmGame();
}