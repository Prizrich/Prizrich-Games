// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let state = null;
let wateringToolActive = false;
let activeSeedToPlant = null;
let marketMultipliers = {};
let gameInterval = null;
let marketInterval = null;
let firebaseInterval = null;

const FIREBASE_DB_URL = "https://games-farm-default-rtdb.firebaseio.com/";
let onlineMarketOrders = [];
let playerName = "Фермер";

// ========== ИНИЦИАЛИЗАЦИЯ РЫНОЧНЫХ МНОЖИТЕЛЕЙ ==========
function initMarketMultipliers() {
    const crops = Object.keys(FARM_CONFIG.cropsData);
    crops.forEach(crop => {
        marketMultipliers[crop] = 1.0;
    });
}

// ========== СИСТЕМА СМЕНЫ НИКА ==========
function canChangeNickname() {
    const lastChange = localStorage.getItem("pixel_farm_last_nick_change");
    if (!lastChange) return true;
    const lastChangeDate = new Date(parseInt(lastChange));
    const now = new Date();
    const monthLater = new Date(lastChangeDate);
    monthLater.setMonth(monthLater.getMonth() + 1);
    return now >= monthLater;
}

function getTimeUntilNicknameChange() {
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
    if (diffDays > 0) return `${diffDays} дн.`;
    if (diffHours > 0) return `${diffHours} ч.`;
    return `${diffMinutes} мин.`;
}

function setNicknameChangeDate() {
    localStorage.setItem("pixel_farm_last_nick_change", Date.now().toString());
}

// ========== СОЗДАНИЕ НОВОГО ПРОФИЛЯ ==========
function createCleanState() {
    console.log("🌱 Создаём новый профиль...");
    
    const allCrops = Object.keys(FARM_CONFIG.cropsData);
    const seeds = {};
    const barn = {};
    allCrops.forEach(crop => {
        seeds[crop] = 0;
        barn[crop] = 0;
    });
    seeds.carrot = 3;
    seeds.cabbage = 2;
    seeds.corn = 1;
    seeds.grapes = 1;
    
    state = {
        coins: 500,
        farmLevel: 1,
        autoWaterOwned: false,
        autoHarvestOwned: false,
        autoPlantOwned: false,
        autoSeedsCount: 0,
        fertilizerLevel: 1,
        inventory: { seeds, barn },
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
    
    saveGame();
    console.log("✅ Профиль создан, грядок:", state.plots.length);
}

// ========== ЗАГРУЗКА ИГРОКА ==========
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
        nameInput.readOnly = !canChangeNickname();
    }
    updateNicknameStatus();
}

// ========== СОХРАНЕНИЕ ==========
function saveGame() {
    if (state) {
        try {
            localStorage.setItem("pixel_farm_state_v11", JSON.stringify(state));
        } catch (e) {
            console.error("Ошибка сохранения:", e);
        }
    }
}

// ========== ЗАГРУЗКА СОХРАНЕНИЯ ==========
function loadGame() {
    const saved = localStorage.getItem("pixel_farm_state_v11");
    if (saved) {
        try {
            state = JSON.parse(saved);
            
            const allCrops = Object.keys(FARM_CONFIG.cropsData);
            let needsFix = false;
            allCrops.forEach(crop => {
                if (!state.inventory.seeds[crop]) {
                    state.inventory.seeds[crop] = 0;
                    needsFix = true;
                }
                if (!state.inventory.barn[crop]) {
                    state.inventory.barn[crop] = 0;
                    needsFix = true;
                }
            });
            
            if (needsFix) {
                console.log("🔧 Исправлен инвентарь");
                saveGame();
            }
            
            if (!state.plots || state.plots.length === 0) {
                console.log("⚠️ Нет грядок, создаём новые");
                createCleanState();
                return false;
            }
            
            if (state.autoSeedsCount === undefined) state.autoSeedsCount = 0;
            if (state.autoPlantOwned === undefined) state.autoPlantOwned = false;
            
            console.log("✅ Игра загружена, грядок:", state.plots.length);
            return true;
        } catch (e) {
            console.error("Ошибка загрузки:", e);
            createCleanState();
            return false;
        }
    }
    return false;
}

// ========== ОБНОВЛЕНИЕ UI ==========
function updateFarmUI() {
    if (!state) return;
    
    const elements = {
        'ui-coins': state.coins,
        'ui-farm-lvl': state.farmLevel,
        'ui-auto-status': state.autoWaterOwned ? "💧 Автополив: Вкл" : "💧 Автополив: Выкл",
        'ui-harvester-status': state.autoHarvestOwned ? "🤖 Автосбор: Вкл" : "🤖 Автосбор: Выкл",
        'ui-planter-status': state.autoPlantOwned ? "🤖 Автопосадка: Вкл" : "🤖 Автопосадка: Выкл",
        'ui-auto-seeds-count': `📦 Семян для сеятеля: ${state.autoSeedsCount || 0}`
    };
    
    for (let [id, value] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) el.innerText = value;
    }
    
    const fertNames = ["", "х1 (Обычное)", "х2 (Азотное) 🧪", "х3 (Био-гумус) ✨"];
    const fertEl = document.getElementById("ui-fert-status");
    if (fertEl) fertEl.innerText = `⚡ Удобрение: ${fertNames[state.fertilizerLevel] || "х1"}`;
    
    updateNicknameStatus();
    updateShopUI();
    updateSeedsUI();
    updateBarnUI();
    updateMassPlantButton();
}

function updateNicknameStatus() {
    const nameInput = document.getElementById("ui-player-name");
    const hint = document.getElementById("nickname-hint");
    if (!nameInput) return;
    
    if (!canChangeNickname()) {
        const timeLeft = getTimeUntilNicknameChange();
        nameInput.readOnly = true;
        nameInput.style.backgroundColor = "#e0d4c0";
        nameInput.style.color = "#888";
        nameInput.title = `Сменить ник можно через ${timeLeft || '30 дней'}`;
        
        if (hint) {
            hint.style.display = "block";
            hint.innerHTML = `⏰ Сменить ник можно через ${timeLeft || '30 дней'}`;
        }
    } else {
        nameInput.readOnly = false;
        nameInput.style.backgroundColor = "#fffdf5";
        nameInput.style.color = "#4a2f15";
        nameInput.title = "";
        if (hint) {
            hint.style.display = "none";
            hint.innerHTML = "";
        }
    }
}

// ========== ОБНОВЛЕНИЕ МАГАЗИНА ==========
function updateShopUI() {
    const shopBox = document.getElementById("ui-shop-list");
    if (!shopBox) return;
    shopBox.innerHTML = "";
    
    const items = FARM_CONFIG.shopItems;
    for (let itemId in items) {
        const item = items[itemId];
        
        if (itemId === "auto_water" && state.autoWaterOwned) continue;
        if (itemId === "auto_harvest" && state.autoHarvestOwned) continue;
        if (itemId === "auto_plant" && state.autoPlantOwned) continue;
        if (itemId === "fertilizer_2" && state.fertilizerLevel >= 2) continue;
        if (itemId === "fertilizer_3" && state.fertilizerLevel >= 3) continue;
        if (itemId === "upgrade_plots" && state.farmLevel >= 12) continue;
        
        const price = item.type === "expand" ? state.farmLevel * 450 : item.price;
        const canAfford = state.coins >= price;
        
        const card = document.createElement("div");
        card.className = "inventory-item";
        card.style.cssText = "font-size:0.75rem;padding:5px;";
        card.innerHTML = `
            <div style="display:flex;flex-direction:column;text-align:left;max-width:65%;">
                <span style="font-weight:bold;color:#4a2f15;">${item.name}</span>
                <span style="font-size:0.65rem;color:#666;">${item.desc}</span>
            </div>
            <button class="mini-plant-btn" style="padding:4px 6px;${canAfford ? '' : 'opacity:0.5;'}" 
                onclick="window.buyShopItem('${itemId}')" ${canAfford ? '' : 'disabled'}>
                🛒 ${price}
            </button>
        `;
        shopBox.appendChild(card);
    }
}

// ========== ОБНОВЛЕНИЕ СЕМЯН ==========
function updateSeedsUI() {
    const box = document.getElementById("ui-seeds-list");
    if (!box) return;
    box.innerHTML = "";
    
    const seeds = state.inventory.seeds;
    for (let key in seeds) {
        const count = seeds[key];
        const crop = FARM_CONFIG.cropsData[key];
        if (!crop) continue;
        
        const div = document.createElement("div");
        div.className = "seed-item";
        const isActive = activeSeedToPlant === key;
        const hasSeeds = count > 0;
        
        div.innerHTML = `
            <span><b>${crop.name}</b> x${count}</span>
            <button class="mini-plant-btn" ${hasSeeds ? '' : 'disabled'} 
                style="${isActive ? 'background-color:#5c8a36;' : ''}"
                onclick="window.selectSeedForPlanting('${key}')">
                ${isActive ? '✅' : '🌱'} Взять
            </button>
        `;
        box.appendChild(div);
    }
}

// ========== ОБНОВЛЕНИЕ АМБАРА ==========
function updateBarnUI() {
    const box = document.getElementById("ui-barn-list");
    if (!box) return;
    box.innerHTML = "";
    
    let hasItems = false;
    const barn = state.inventory.barn;
    for (let key in barn) {
        const count = barn[key];
        if (count > 0) {
            hasItems = true;
            const crop = FARM_CONFIG.cropsData[key];
            if (!crop) continue;
            const div = document.createElement("div");
            div.className = "barn-item";
            div.innerHTML = `<span>${crop.name}</span><b>${count} шт</b>`;
            box.appendChild(div);
        }
    }
    
    if (!hasItems) {
        const div = document.createElement("div");
        div.style.cssText = "text-align:center;color:#888;padding:10px;font-size:0.85rem;";
        div.innerHTML = "🌾 Амбар пуст";
        box.appendChild(div);
    }
}

// ========== ОБНОВЛЕНИЕ КНОПКИ МАССОВОЙ ПОСАДКИ ==========
function updateMassPlantButton() {
    const select = document.getElementById("mass-plant-crop-select");
    const btn = document.getElementById("tool-auto-plant-btn");
    if (!select || !btn) return;
    
    const cropId = select.value;
    const available = state.inventory.seeds[cropId] || 0;
    const hasEmptyPlots = state.plots.some(p => p.opened && !p.planted);
    
    if (available <= 0 || !hasEmptyPlots) {
        btn.style.opacity = "0.5";
        btn.style.cursor = "not-allowed";
        btn.title = available <= 0 ? "Нет семян для посадки" : "Нет свободных грядок";
    } else {
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
        btn.title = `Посадить ${available} семян`;
    }
}

// ========== ГЕНЕРАЦИЯ СЕТКИ ==========
function generateFarmGridUI() {
    if (!state || !state.plots) return;
    
    const grid = document.getElementById("farm-plots-grid");
    if (!grid) return;
    
    grid.innerHTML = "";
    grid.style.cssText = "display:grid;grid-template-columns:repeat(6,1fr);gap:8px;";
    
    state.plots.forEach(plot => {
        const block = document.createElement("div");
        block.className = "plot-block";
        block.id = `plot-${plot.id}`;
        block.onclick = () => window.handlePlotClick(plot.id);
        grid.appendChild(block);
    });
    
    updateFarmGridValues();
}

// ========== ОБНОВЛЕНИЕ ГРЯДОК (С ОТОБРАЖЕНИЕМ ВЫБРАННОГО СЕМЕНИ) ==========
function updateFarmGridValues() {
    if (!state || !state.plots) return;
    
    state.plots.forEach(plot => {
        const block = document.getElementById(`plot-${plot.id}`);
        if (!block) return;
        
        block.className = "plot-block";
        block.style.opacity = "1";
        block.style.cursor = "pointer";
        
        // Закрытая грядка
        if (!plot.opened) {
            block.innerHTML = "<div class='crop-stage' style='opacity:0.35;'>🌿</div>";
            block.style.cssText = "background-color:#466d1d;box-shadow:inset -2px -2px 0px #2a4410, inset 2px 2px 0px #639b2a;border-color:#1e3307;cursor:not-allowed;";
            return;
        }
        
        // Открытая грядка
        block.style.cssText = "background-color:#704722;box-shadow:inset -4px -4px 0px #4a2f15, inset 4px 4px 0px #946132;border-color:#301e0e;";
        
        // ============================================================
        // ПУСТАЯ ГРЯДКА - ПОКАЗЫВАЕМ ВЫБРАННОЕ СЕМЯ
        // ============================================================
        if (!plot.planted) {
            // Проверяем, выбрано ли семя и есть ли оно в наличии
            if (activeSeedToPlant && state.inventory.seeds[activeSeedToPlant] > 0) {
                const cropData = FARM_CONFIG.cropsData[activeSeedToPlant];
                // Показываем иконку семени и название
                block.innerHTML = `
                    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;height:100%;">
                        <div style="font-size:2.8rem;line-height:1;filter:drop-shadow(0 0 10px rgba(255,215,0,0.3));">
                            ${cropData?.stagesVisual?.[0] || '🌱'}
                        </div>
                        <div style="font-size:0.65rem;color:rgba(255,255,255,0.9);background:rgba(0,0,0,0.7);padding:2px 10px;border-radius:12px;border:1px solid rgba(255,215,0,0.3);font-weight:bold;">
                            ${cropData?.name || 'Семя'} 🌱
                        </div>
                    </div>
                `;
                // Подсветка грядки золотым свечением
                block.style.boxShadow = "inset -4px -4px 0px #4a2f15, inset 4px 4px 0px #946132, 0 0 20px rgba(255,215,0,0.15)";
                block.style.borderColor = "#d4af37";
            } else {
                // Пустая грядка без выбранного семени
                block.innerHTML = `<div class='soil-empty'>🌱 Посадить</div>`;
            }
            return;
        }
        
        // ============================================================
        // ЗАНЯТАЯ ГРЯДКА
        // ============================================================
        
        // Политая грядка
        if (plot.watered) {
            block.classList.add("watered");
        }
        
        const cropData = FARM_CONFIG.cropsData[plot.planted];
        const stageIcon = cropData?.stagesVisual[plot.stage] || "🌱";
        
        let timerText;
        if (plot.stage === 2) {
            timerText = "<span class='ready-tag'>✅ СБОР!</span>";
        } else if (plot.watered) {
            timerText = `⏱ ${plot.growTimeLeft}с`;
        } else {
            timerText = "<span style='color:#00aaff;'>💧 ПОЛИВ</span>";
        }
        
        block.innerHTML = `
            <div class="crop-stage">${stageIcon}</div>
            <div class="crop-timer">${timerText}</div>
        `;
    });
}

// ========== МАССОВАЯ ПОСАДКА ==========
window.triggerMassPlanting = function() {
    if (!state) return;
    
    const cropSelect = document.getElementById("mass-plant-crop-select");
    if (!cropSelect) {
        showNotification("❌ Ошибка", "Элемент выбора не найден");
        return;
    }
    
    const cropId = cropSelect.value;
    const cropInfo = FARM_CONFIG.cropsData[cropId];
    if (!cropInfo) {
        showNotification("❌ Ошибка", "Культура не найдена");
        return;
    }
    
    const availableSeeds = state.inventory.seeds[cropId] || 0;
    if (availableSeeds <= 0) {
        showNotification("❌ Нет семян", `Нет семян ${cropInfo.name}`);
        return;
    }
    
    const emptyPlots = state.plots.filter(p => p.opened && !p.planted);
    if (emptyPlots.length === 0) {
        showNotification("❌ Нет места", "Нет свободных грядок");
        return;
    }
    
    const toPlant = Math.min(availableSeeds, emptyPlots.length);
    let planted = 0;
    
    for (let i = 0; i < emptyPlots.length && planted < toPlant; i++) {
        const plot = emptyPlots[i];
        plot.planted = cropId;
        plot.growTimeLeft = cropInfo.growTime;
        plot.stage = 0;
        plot.watered = false;
        planted++;
    }
    
    state.inventory.seeds[cropId] -= planted;
    saveGame();
    updateFarmUI();
    updateFarmGridValues();
    
    showNotification("🌱 Посадка", `Посажено ${planted} шт ${cropInfo.name}`);
    FarmAudio.playPlant();
};

// ========== ОБРАБОТЧИК КЛИКА ПО ГРЯДКЕ ==========
window.handlePlotClick = function(plotId) {
    if (!state) return;
    const plot = state.plots.find(p => p.id === plotId);
    if (!plot || !plot.opened) return;
    
    // Режим лейки
    if (wateringToolActive) {
        if (plot.planted && !plot.watered && plot.growTimeLeft > 0) {
            plot.watered = true;
            updateFarmGridValues();
            showNotification("💧 Полив", `${FARM_CONFIG.cropsData[plot.planted]?.name || 'Растение'} полито!`);
            FarmAudio.playWater();
            saveGame();
        } else if (!plot.planted) {
            showNotification("💧 Полив", "Грядка пуста!");
        } else if (plot.watered) {
            showNotification("💧 Полив", "Уже полито!");
        }
        return;
    }
    
    // Посадка
    if (!plot.planted) {
        if (activeSeedToPlant && state.inventory.seeds[activeSeedToPlant] > 0) {
            const cropId = activeSeedToPlant;
            const cropInfo = FARM_CONFIG.cropsData[cropId];
            
            state.inventory.seeds[cropId]--;
            plot.planted = cropId;
            plot.growTimeLeft = cropInfo.growTime;
            plot.stage = 0;
            plot.watered = false;
            
            if (state.inventory.seeds[cropId] <= 0) {
                activeSeedToPlant = null;
                const clearBtn = document.getElementById("tool-clear-seed");
                if (clearBtn) clearBtn.style.display = "none";
                updateSeedsUI();
            }
            
            saveGame();
            updateFarmUI();
            updateFarmGridValues();
            showNotification("🌱 Посадка", `${cropInfo.name} посажена!`);
            FarmAudio.playPlant();
        } else if (activeSeedToPlant) {
            showNotification("❌ Нет семян", "Семена закончились!");
            activeSeedToPlant = null;
            const clearBtn = document.getElementById("tool-clear-seed");
            if (clearBtn) clearBtn.style.display = "none";
            updateSeedsUI();
            updateFarmGridValues();
        }
        return;
    }
    
    // Сбор урожая
    if (plot.stage === 2) {
        const cropId = plot.planted;
        const info = FARM_CONFIG.cropsData[cropId];
        
        state.inventory.barn[cropId] = (state.inventory.barn[cropId] || 0) + 1;
        
        const minDrop = info.minSeedsDrop || 1;
        const maxDrop = info.maxSeedsDrop || 2;
        const seedsDropped = Math.floor(Math.random() * (maxDrop - minDrop + 1)) + minDrop;
        state.inventory.seeds[cropId] = (state.inventory.seeds[cropId] || 0) + seedsDropped;
        
        showNotification("🌾 Сбор", `${info.name} собран! +${seedsDropped} семян`);
        FarmAudio.playHarvest();
        
        plot.planted = null;
        plot.stage = 0;
        plot.growTimeLeft = 0;
        plot.watered = false;
        
        saveGame();
        updateFarmUI();
        updateFarmGridValues();
    } else if (plot.stage < 2) {
        showNotification("⏳ Растёт", `${FARM_CONFIG.cropsData[plot.planted]?.name || 'Растение'} ещё не созрело!`);
    }
};

// ========== ИНСТРУМЕНТЫ ==========
window.toggleWateringTool = function() {
    wateringToolActive = !wateringToolActive;
    if (wateringToolActive) {
        activeSeedToPlant = null;
        const clearBtn = document.getElementById("tool-clear-seed");
        if (clearBtn) clearBtn.style.display = "none";
        updateSeedsUI();
    }
    const btn = document.getElementById("tool-watering-can");
    if (btn) {
        btn.innerText = wateringToolActive ? "💧 Лейка (Вкл)" : "💧 Взять лейку";
        btn.style.background = wateringToolActive ? "#4a8c5c" : "";
    }
    updateFarmGridValues();
};

window.selectSeedForPlanting = function(cropId) {
    if (!state || state.inventory.seeds[cropId] <= 0) return;
    
    const clearBtn = document.getElementById("tool-clear-seed");
    
    if (activeSeedToPlant === cropId) {
        activeSeedToPlant = null;
        if (clearBtn) clearBtn.style.display = "none";
    } else {
        wateringToolActive = false;
        activeSeedToPlant = cropId;
        
        const btn = document.getElementById("tool-watering-can");
        if (btn) {
            btn.innerText = "💧 Взять лейку";
            btn.style.background = "";
        }
        if (clearBtn) clearBtn.style.display = "inline-block";
    }
    
    updateSeedsUI();
    updateFarmGridValues();
    if (activeSeedToPlant) {
        showNotification("🌱 Выбрано", FARM_CONFIG.cropsData[activeSeedToPlant].name);
    } else {
        showNotification("❌ Отмена", "Выбор семени отменён");
    }
};

window.clearSelectedSeed = function() {
    activeSeedToPlant = null;
    const clearBtn = document.getElementById("tool-clear-seed");
    if (clearBtn) clearBtn.style.display = "none";
    updateSeedsUI();
    updateFarmGridValues();
    showNotification("❌ Отмена", "Выбор семени отменён");
};

// ========== ПОКУПКА В МАГАЗИНЕ ==========
window.buyShopItem = function(itemId) {
    if (!state) return;
    const item = FARM_CONFIG.shopItems[itemId];
    if (!item) return;
    
    const price = item.type === "expand" ? state.farmLevel * 450 : item.price;
    
    if (state.coins < price) {
        showNotification("❌ Не хватает", `Нужно ${price} золота!`);
        return;
    }
    
    state.coins -= price;
    
    switch (item.type) {
        case "expand":
            state.farmLevel++;
            const startIndex = (state.farmLevel - 1) * 3;
            for (let i = startIndex; i < startIndex + 3 && i < state.plots.length; i++) {
                if (state.plots[i]) state.plots[i].opened = true;
            }
            generateFarmGridUI();
            showNotification("🏠 Расширение", `Открыто ${state.farmLevel * 3} грядок!`);
            break;
        case "autowater":
            state.autoWaterOwned = true;
            showNotification("💧 Автополив", "Спринклер установлен!");
            break;
        case "autoharvest":
            state.autoHarvestOwned = true;
            showNotification("🤖 Автосбор", "Робот-крот активирован!");
            break;
        case "autoplant":
            state.autoPlantOwned = true;
            showNotification("🤖 Робот-Сеятель", "Активирован!");
            break;
        case "buy_auto_seeds":
            state.autoSeedsCount = (state.autoSeedsCount || 0) + 5;
            showNotification("🌱 Семена", "+5 семян для сеятеля!");
            break;
        case "fert2":
            state.fertilizerLevel = 2;
            showNotification("🧪 Удобрение", "Азотное удобрение активировано! (x2)");
            break;
        case "fert3":
            state.fertilizerLevel = 3;
            showNotification("✨ Удобрение", "Био-гумус активирован! (x3)");
            break;
        default:
            showNotification("❌ Ошибка", "Неизвестный товар");
            return;
    }
    
    saveGame();
    updateFarmUI();
    updateFarmGridValues();
};

// ========== ПРОДАЖА УРОЖАЯ ==========
window.sellAllCrops = function() {
    if (!state) return;
    
    let total = 0;
    let soldItems = [];
    
    for (let crop in state.inventory.barn) {
        const count = state.inventory.barn[crop];
        if (count > 0) {
            const price = Math.floor(FARM_CONFIG.cropsData[crop].sellPrice * (marketMultipliers[crop] || 1));
            const amount = count * price;
            total += amount;
            soldItems.push(`${FARM_CONFIG.cropsData[crop].name} x${count} = ${amount}💰`);
            state.inventory.barn[crop] = 0;
        }
    }
    
    if (total > 0) {
        state.coins += total;
        saveGame();
        updateFarmUI();
        updateBarnUI();
        showNotification("💰 Продажа", `Продано за ${total} золота!`);
        FarmAudio.playHarvest();
    } else {
        showNotification("📦 Пусто", "Амбар пуст!");
    }
};

// ========== ГАЧА ==========
window.triggerGachaRoll = function() {
    if (!state) return;
    
    if (state.coins < FARM_CONFIG.gachaPrice) {
        showNotification("❌ Не хватает", `Нужно ${FARM_CONFIG.gachaPrice} золота!`);
        return;
    }
    
    state.coins -= FARM_CONFIG.gachaPrice;
    const rolledCrop = FARM_CONFIG.rollGacha();
    state.inventory.seeds[rolledCrop] = (state.inventory.seeds[rolledCrop] || 0) + 1;
    
    const info = FARM_CONFIG.cropsData[rolledCrop];
    const resultEl = document.getElementById("ui-gacha-result");
    if (resultEl) {
        resultEl.style.display = "block";
        resultEl.style.background = info.rarityColor || "#d4af37";
        resultEl.innerHTML = `✨ Получено: ${info.name} (${info.rarity}★)! ✨`;
        setTimeout(() => { resultEl.style.display = "none"; }, 3000);
    }
    
    saveGame();
    updateFarmUI();
    updateSeedsUI();
    showNotification("🎰 Гача", `Выпало: ${info.name}!`);
    FarmAudio.playGacha();
};

// ========== РЫНОК ==========
function simulateMarketTrends() {
    const pricesBox = document.getElementById("ui-market-prices");
    if (!pricesBox) return;
    pricesBox.innerHTML = "";
    
    for (let cropId in FARM_CONFIG.cropsData) {
        const changePercent = Math.floor(Math.random() * 71) - 30;
        marketMultipliers[cropId] = 1 + (changePercent / 100);
        
        const crop = FARM_CONFIG.cropsData[cropId];
        const currentPrice = Math.floor(crop.sellPrice * marketMultipliers[cropId]);
        const arrow = changePercent >= 0 ? "📈" : "📉";
        const color = changePercent >= 0 ? "#2d6a4f" : "#a83232";
        
        const line = document.createElement("div");
        line.className = "market-price-line";
        line.style.cssText = "display:flex;justify-content:space-between;padding:4px 0;font-size:0.8rem;border-bottom:1px solid #d4be9a;";
        line.innerHTML = `
            <span>${crop.name}</span>
            <span style="color:${color};">${currentPrice}💰 (${arrow} ${Math.abs(changePercent)}%)</span>
        `;
        pricesBox.appendChild(line);
    }
}

// ========== FIREBASE ==========
function fetchOnlineMarketOrders() {
    fetch(`${FIREBASE_DB_URL}/market.json`)
        .then(res => res.json())
        .then(data => {
            onlineMarketOrders = [];
            if (data) {
                for (let key in data) {
                    onlineMarketOrders.push({
                        id: key,
                        seller: data[key].seller || "Аноним",
                        crop: data[key].crop,
                        amount: data[key].amount || 1,
                        price: data[key].price || 10
                    });
                }
            }
            renderMarketBoardUI();
        })
        .catch(err => {
            console.error("Firebase ошибка:", err);
            const board = document.getElementById("ui-market-board");
            if (board) {
                board.innerHTML = '<div style="padding:20px;text-align:center;color:#666;">🌐 Нет подключения к рынку</div>';
            }
        });
}

function renderMarketBoardUI() {
    const board = document.getElementById("ui-market-board");
    if (!board) return;
    board.innerHTML = "";
    
    if (onlineMarketOrders.length === 0) {
        board.innerHTML = `
            <div style="font-size:0.75rem;color:#8a6529;text-align:center;padding-top:15px;">
                На рынке пока нет товаров.<br>Будь первым, выстави урожай!
            </div>
        `;
        return;
    }
    
    onlineMarketOrders.forEach(order => {
        const cropInfo = FARM_CONFIG.cropsData[order.crop];
        if (!cropInfo) return;
        
        const isMyOrder = order.seller === playerName;
        const line = document.createElement("div");
        line.className = "market-price-line";
        line.style.cssText = "display:flex;justify-content:space-between;align-items:center;padding:6px 8px;font-size:0.75rem;border-bottom:1px solid #d4be9a;background:#fffdf5;border-radius:4px;margin-bottom:4px;";
        
        line.innerHTML = `
            <div style="display:flex;flex-direction:column;text-align:left;max-width:60%;">
                <span style="font-weight:bold;color:${isMyOrder ? '#ba2929' : '#4a2f15'};">[${order.seller}]</span>
                <span>${cropInfo.name} (x${order.amount})</span>
            </div>
            <button class="mini-plant-btn" style="background-color:${isMyOrder ? '#ba2929' : '#a3723b'};padding:3px 8px;" 
                onclick="window.handleMarketOrderClick('${order.id}')">
                ${isMyOrder ? 'Снять' : 'Купить'} (${order.price}💰)
            </button>
        `;
        board.appendChild(line);
    });
}

window.handleMarketOrderClick = function(orderId) {
    const order = onlineMarketOrders.find(o => o.id === orderId);
    if (!order) return;
    
    if (order.seller === playerName) {
        if (!confirm(`Снять с продажи ${order.crop} (x${order.amount})?`)) return;
        
        fetch(`${FIREBASE_DB_URL}/market/${orderId}.json`, { method: "DELETE" })
            .then(() => {
                state.inventory.barn[order.crop] = (state.inventory.barn[order.crop] || 0) + (order.amount || 1);
                saveGame();
                updateFarmUI();
                fetchOnlineMarketOrders();
                showNotification("📦 Снято", "Товар снят с рынка");
            })
            .catch(() => showNotification("❌ Ошибка", "Не удалось снять товар"));
    } else if (state.coins >= order.price) {
        if (!confirm(`Купить ${order.crop} (x${order.amount}) за ${order.price} золота?`)) return;
        
        fetch(`${FIREBASE_DB_URL}/market/${orderId}.json`, { method: "DELETE" })
            .then(() => {
                state.coins -= order.price;
                state.inventory.barn[order.crop] = (state.inventory.barn[order.crop] || 0) + (order.amount || 1);
                saveGame();
                updateFarmUI();
                fetchOnlineMarketOrders();
                showNotification("🛒 Покупка", `Куплено за ${order.price} золота!`);
            })
            .catch(() => showNotification("❌ Ошибка", "Товар уже купили!"));
    } else {
        showNotification("❌ Не хватает", `Нужно ${order.price} золота!`);
    }
};

// ========== МОДАЛЬНОЕ ОКНО РЫНКА ==========
window.updateModalStockCount = function() {
    if (!state) return;
    const cropSelect = document.getElementById("modal-sell-crop-select");
    const stockDisplay = document.getElementById("modal-stock-count");
    if (cropSelect && stockDisplay) {
        const cropId = cropSelect.value;
        const count = state.inventory.barn[cropId] || 0;
        stockDisplay.innerText = `📦 В амбаре: ${count} шт.`;
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
        showNotification("❌ Ошибка", "Не найдены поля формы");
        return;
    }
    
    const cropId = cropSelect.value;
    const amount = parseInt(amountInput.value);
    const price = parseInt(priceInput.value);
    
    if (isNaN(amount) || amount <= 0) {
        showNotification("❌ Ошибка", "Введите количество > 0");
        return;
    }
    if (isNaN(price) || price <= 0) {
        showNotification("❌ Ошибка", "Введите цену > 0");
        return;
    }
    
    const currentStock = state.inventory.barn[cropId] || 0;
    if (currentStock < amount) {
        showNotification("❌ Не хватает", `В амбаре только ${currentStock} шт.`);
        return;
    }
    
    state.inventory.barn[cropId] -= amount;
    
    fetch(`${FIREBASE_DB_URL}/market.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        showNotification("📦 Выставлено", `${amount} шт ${FARM_CONFIG.cropsData[cropId].name} за ${price}💰`);
    }).catch(err => {
        console.error("Ошибка:", err);
        state.inventory.barn[cropId] = (state.inventory.barn[cropId] || 0) + amount;
        saveGame();
        updateFarmUI();
        showNotification("❌ Ошибка", "Не удалось выставить товар");
    });
};

// ========== СОХРАНЕНИЕ НИКА ==========
window.savePlayerName = function() {
    if (!canChangeNickname()) {
        const timeLeft = getTimeUntilNicknameChange();
        showNotification("🔒 Заблокировано", `Сменить ник можно через ${timeLeft || '30 дней'}`);
        const input = document.getElementById("ui-player-name");
        if (input) input.value = playerName;
        return;
    }
    
    const input = document.getElementById("ui-player-name");
    if (!input) return;
    
    const newName = input.value.trim();
    if (!newName) {
        showNotification("❌ Ошибка", "Имя не может быть пустым!");
        input.value = playerName;
        return;
    }
    if (newName.length < 2) {
        showNotification("❌ Ошибка", "Минимум 2 символа!");
        input.value = playerName;
        return;
    }
    if (newName.length > 20) {
        showNotification("❌ Ошибка", "Максимум 20 символов!");
        input.value = playerName;
        return;
    }
    if (/[<>{}[\]\\|]/.test(newName)) {
        showNotification("❌ Ошибка", "Недопустимые символы!");
        input.value = playerName;
        return;
    }
    if (newName === playerName) {
        showNotification("ℹ️ Информация", "Имя не изменилось");
        return;
    }
    
    const oldName = playerName;
    playerName = newName;
    localStorage.setItem("pixel_farm_player_name", playerName);
    setNicknameChangeDate();
    
    showNotification("✅ Успешно", `Имя изменено: "${oldName}" → "${playerName}"`);
    updateNicknameStatus();
    fetchOnlineMarketOrders();
};

// ========== УВЕДОМЛЕНИЯ ==========
function showNotification(title, text) {
    const container = document.getElementById("farm-toast-container");
    if (!container) return;
    
    const toast = document.createElement("div");
    toast.className = "farm-toast";
    if (title && text) {
        toast.innerHTML = `<b>${title}</b> ${text}`;
    } else {
        toast.innerHTML = `🌾 ${text || title || ''}`;
    }
    container.appendChild(toast);
    setTimeout(() => {
        if (toast.parentNode) toast.remove();
    }, 3000);
}

// ========== АВТОМАТИЧЕСКИЕ ПРОЦЕССЫ ==========
function processAutoActions() {
    if (!state) return;
    
    state.plots.forEach(plot => {
        if (state.autoWaterOwned && plot.opened && plot.planted && plot.growTimeLeft > 0) {
            plot.watered = true;
        }
        
        if (plot.opened && plot.planted && plot.growTimeLeft > 0 && plot.watered) {
            const boost = state.fertilizerLevel || 1;
            plot.growTimeLeft = Math.max(0, plot.growTimeLeft - boost);
            if (plot.growTimeLeft === 0) plot.stage = 2;
        }
        
        if (state.autoHarvestOwned && plot.opened && plot.planted && plot.stage === 2) {
            autoHarvest(plot);
        }
        
        if (state.autoPlantOwned && state.autoSeedsCount > 0 && plot.opened && !plot.planted) {
            state.autoSeedsCount--;
            plot.planted = "carrot";
            plot.growTimeLeft = FARM_CONFIG.cropsData.carrot.growTime;
            plot.stage = 0;
            plot.watered = false;
            saveGame();
            updateFarmUI();
        }
    });
    
    updateFarmGridValues();
}

function autoHarvest(plot) {
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

// ========== СБРОС ПРОГРЕССА ==========
window.resetGameProgress = function() {
    const modal = document.getElementById("reset-confirm-modal");
    if (modal) {
        modal.style.display = "flex";
    }
};

window.closeResetModal = function() {
    const modal = document.getElementById("reset-confirm-modal");
    if (modal) {
        modal.style.display = "none";
    }
};

window.confirmResetGame = function() {
    window.closeResetModal();
    
    if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = null;
    }
    if (marketInterval) {
        clearInterval(marketInterval);
        marketInterval = null;
    }
    if (firebaseInterval) {
        clearInterval(firebaseInterval);
        firebaseInterval = null;
    }
    
    localStorage.removeItem("pixel_farm_state_v11");
    localStorage.removeItem("pixel_farm_player_name");
    localStorage.removeItem("pixel_farm_last_nick_change");
    
    state = null;
    activeSeedToPlant = null;
    wateringToolActive = false;
    onlineMarketOrders = [];
    
    showNotification("🔄 Сброс", "Прогресс сброшен! Перезагрузка...");
    
    setTimeout(() => {
        const grid = document.getElementById("farm-plots-grid");
        if (grid) grid.innerHTML = "";
        
        if (typeof initFarmGame === 'function') {
            initFarmGame();
        } else {
            location.reload();
        }
    }, 1000);
};

// ========== ЗАПУСК ИГРЫ ==========
function initFarmGame() {
    console.log("🚀 Запуск Pixel Farm...");
    
    initMarketMultipliers();
    
    const loaded = loadGame();
    if (!loaded) {
        createCleanState();
    }
    
    loadPlayerName();
    
    generateFarmGridUI();
    updateFarmUI();
    
    simulateMarketTrends();
    fetchOnlineMarketOrders();
    
    if (gameInterval) clearInterval(gameInterval);
    if (marketInterval) clearInterval(marketInterval);
    if (firebaseInterval) clearInterval(firebaseInterval);
    
    gameInterval = setInterval(processAutoActions, 1000);
    marketInterval = setInterval(simulateMarketTrends, 15000);
    firebaseInterval = setInterval(fetchOnlineMarketOrders, 5000);
    
    console.log("✅ Игра готова! Ник:", playerName);
    showNotification("🌾 Добро пожаловать", "Начинай собирать урожай!");
}

// ========== АВТОЗАПУСК ==========
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFarmGame);
} else {
    initFarmGame();
}
