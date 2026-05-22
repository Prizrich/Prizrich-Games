// ===================================================================
// ИГРОВОЙ ДВИЖОК ФЕРМЫ: ОНЛАЙН-РЫНОК FIREBASE, ПОЛИВ И АВТОМАТИЗАЦИЯ
// ===================================================================

let state = null;
let wateringToolActive = false; 
let activeSeedToPlant = null;
let marketMultipliers = { carrot: 1.0, cabbage: 1.0, corn: 1.0, grapes: 1.0, strawberry: 1.0, pineapple: 1.0, golden_apple: 1.0, ancient_fruit: 1.0 };

const FIREBASE_DB_URL = "https://games-farm-default-rtdb.firebaseio.com/";
let onlineMarketOrders = []; 
let playerName = "";

// --- ЗАПУСК ИГРЫ ЧЕРЕЗ МЕНЮ ---
window.startFarmGameFromMenu = function() {
    const menu = document.getElementById("ui-main-menu-overlay");
    const gameContainer = document.getElementById("game-container");
    if (menu) menu.style.display = "none";
    if (gameContainer) gameContainer.style.display = "flex";
    initFarmGame();
};

// --- 1. ФУНКЦИИ ОБНОВЛЕНИЯ ИНТЕРФЕЙСА (UI) ---
function updateFarmUI() {
    if (!state || !state.inventory || !state.inventory.seeds || !state.inventory.barn) return;

    const coinElem = document.getElementById("ui-coins");
    const lvlElem = document.getElementById("ui-farm-lvl");
    const autoStatusElem = document.getElementById("ui-auto-status");
    const harvesterStatusElem = document.getElementById("ui-harvester-status");
    const fertStatusElem = document.getElementById("ui-fert-status");
    const planterStatus = document.getElementById("ui-planter-status");
    const autoSeedsCount = document.getElementById("ui-auto-seeds-count");
    
    if (coinElem) coinElem.innerText = state.coins;
    if (lvlElem) lvlElem.innerText = state.farmLevel;
    if (autoStatusElem) {
        autoStatusElem.innerText = state.autoWaterOwned ? "💧 Автополив: Вкл" : "💧 Автополив: Выкл";
        autoStatusElem.style.color = state.autoWaterOwned ? "#0088cc" : "#5c5c5c";
    }
    if (harvesterStatusElem) {
        harvesterStatusElem.innerText = state.autoHarvestOwned ? "🤖 Автосбор: Вкл" : "🤖 Автосбор: Выкл";
        harvesterStatusElem.style.color = state.autoHarvestOwned ? "#5c8a36" : "#ba2929";
    }
    if (planterStatus) {
        planterStatus.innerText = state.autoPlantOwned ? "🤖 Автопосадка: Вкл" : "🤖 Автопосадка: Выкл";
        planterStatus.style.color = state.autoPlantOwned ? "#9333ea" : "#5c5c5c";
    }
    if (autoSeedsCount) {
        autoSeedsCount.innerText = `📦 Семян для сеятеля: ${state.autoSeedsCount || 0}`;
    }
    
    let fertNames = ["", "х1 (Обычное)", "х2 (Азотное) 🧪", "х3 (Био-гумус) ✨"];
    if (fertStatusElem) fertStatusElem.innerText = `⚡ Удобрение: ${fertNames[state.fertilizerLevel] || "х1"}`;

    updateShopUI(); 
    updateSeedsUI(); 
    updateBarnUI();
}

function updateShopUI() {
    const shopBox = document.getElementById("ui-shop-list"); 
    if (!shopBox) return; 
    shopBox.innerHTML = "";
    
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
    const seedsBox = document.getElementById("ui-seeds-list"); 
    if (!seedsBox) return; 
    seedsBox.innerHTML = "";
    
    for (let key in state.inventory.seeds) {
        const count = state.inventory.seeds[key]; 
        const item = document.createElement("div"); 
        item.className = "inventory-item";
        item.innerHTML = `<span>${FARM_CONFIG.cropsData[key].name} (x${count})</span><button class="mini-plant-btn" ${count <= 0 ? 'disabled' : ''} onclick="window.selectSeedForPlanting('${key}')">Взять</button>`;
        seedsBox.appendChild(item);
    }
}

function updateBarnUI() {
    const barnBox = document.getElementById("ui-barn-list"); 
    if (!barnBox) return; 
    barnBox.innerHTML = "";
    
    for (let key in state.inventory.barn) {
        const count = state.inventory.barn[key]; 
        if (count <= 0) continue;
        const item = document.createElement("div"); 
        item.className = "inventory-item";
        item.innerHTML = `<span>${FARM_CONFIG.cropsData[key].name}</span> <b>${count} шт</b>`;
        barnBox.appendChild(item);
    }
}

// --- 2. ГЕНЕРАЦИЯ СЕТКИ ПОЛЯ ---
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

// --- 3. ИНИЦИАЛИЗАЦИЯ И СТАРТ ---
function setupCleanState() {
    state = JSON.parse(JSON.stringify(FARM_CONFIG.startingState));
    state.plots = [];
    for (let i = 0; i < 36; i++) {
        state.plots.push({ id: i, opened: i < 3, planted: null, stage: 0, watered: false, growTimeLeft: 0 });
    }
    state.autoSeedsCount = 0;
    localStorage.setItem("pixel_farm_state_v11", JSON.stringify(state));
}

function initFarmGame() {
    const saved = localStorage.getItem("pixel_farm_state_v11");
    if (saved) {
        try { 
            state = JSON.parse(saved); 
            if (!state.plots || state.plots.length !== 36) throw new Error(); 
        } catch(e) { 
            setupCleanState(); 
        }
    } else { 
        setupCleanState(); 
    }

    // ТАМОЖНЯ: Проверяем, есть ли имя в памяти
    const nameInput = document.getElementById("ui-player-name");
    const savedName = localStorage.getItem("pixel_farm_player_name");

    if (savedName && savedName.trim() !== "" && savedName !== "Фермер" && !savedName.startsWith("Фермер_")) {
        playerName = savedName;
        if (nameInput) {
            nameInput.value = playerName;
            
            // Проверяем 30-дневную блокировку
            const lastChangeTime = parseInt(localStorage.getItem("pixel_farm_name_changed_at") || "0");
            const currentTime = Date.now();
            const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
            
            if (currentTime - lastChangeTime < thirtyDaysInMs) {
                const msLeft = thirtyDaysInMs - (currentTime - lastChangeTime);
                const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
                nameInput.disabled = true;
                nameInput.style.backgroundColor = "#e6d3af";
                nameInput.style.cursor = "not-allowed";
                nameInput.title = `Ник заблокирован! Смена станет доступна через ${daysLeft} дн.`;
            }
        }
    } else {
        // ПУСТОЕ ПОЛЕ ДЛЯ НОВЫХ ИГРОКОВ
        playerName = "";
        localStorage.removeItem("pixel_farm_player_name");
        if (nameInput) {
            nameInput.value = "";
            nameInput.disabled = false;
            nameInput.style.backgroundColor = "#fff";
            nameInput.style.cursor = "text";
            nameInput.placeholder = "ПАСПОРТ ОБЯЗАТЕЛЕН! ⚠️";
        }
    }

    generateFarmGridUI(); 
    updateFarmUI(); 
    simulateMarketTrends(); 
    fetchOnlineMarketOrders();
    
    setInterval(() => {
        if (!state || !state.plots) return;
        state.plots.forEach(plot => {
            if (state.autoWaterOwned && plot.opened && plot.planted && plot.growTimeLeft > 0) plot.watered = true;
            if (plot.opened && plot.planted && plot.growTimeLeft > 0 && plot.watered) {
                let fertBoost = state.fertilizerLevel || 1; 
                plot.growTimeLeft = Math.max(0, plot.growTimeLeft - fertBoost);
                let totalTime = FARM_CONFIG.cropsData[plot.planted].growTime; 
                let elapsed = totalTime - plot.growTimeLeft;
                if (!state.autoWaterOwned && plot.stage === 0 && elapsed >= totalTime * 0.45 && plot.growTimeLeft > 0) {
                    plot.stage = 1; 
                    plot.watered = false; 
                    showFarmNotification(FARM_CONFIG.cropsData[plot.planted].name, "хочет пить! 💧");
                }
                if (plot.growTimeLeft === 0) plot.stage = 2;
            }
            if (state.autoHarvestOwned && plot.opened && plot.planted && plot.stage === 2) triggerAutoHarvestForPlot(plot);
            
            // АВТОПОСАДКА
            if (state.autoPlantOwned && state.autoSeedsCount > 0 && plot.opened && !plot.planted) {
                state.autoSeedsCount--;
                plot.planted = "carrot";
                plot.growTimeLeft = FARM_CONFIG.cropsData["carrot"].growTime;
                plot.stage = 0;
                plot.watered = false;
                showFarmNotification("🤖 Робот-Сеятель", "Зарядил морковь на грядку!");
                saveGameProgress();
                updateFarmUI();
            }
        });
        updateFarmGridValues();
    }, 1000);
    
    setInterval(simulateMarketTrends, 15000); 
    setInterval(fetchOnlineMarketOrders, 5000);
}

// --- 4. СОХРАНЕНИЕ НИКНЕЙМА ---
window.savePlayerName = function() {
    const input = document.getElementById("ui-player-name"); 
    if (!input) return;
    let finalName = input.value.trim();
    
    if (!finalName || finalName === "Фермер" || finalName.startsWith("Фермер_") || finalName.length < 2) {
        alert("Ошибка! Никнейм не может быть пустым, коротким или содержать слово 'Фермер'!");
        input.value = playerName || ""; 
        return;
    }
    
    if (finalName === localStorage.getItem("pixel_farm_player_name")) return;
    
    const confirmChange = confirm(`Вы уверены? Ник [${finalName}] нельзя будет изменить следующие 30 дней!`);
    if (confirmChange) {
        playerName = finalName;
        localStorage.setItem("pixel_farm_player_name", playerName);
        localStorage.setItem("pixel_farm_name_changed_at", Date.now().toString());
        input.disabled = true; 
        input.style.backgroundColor = "#e6d3af"; 
        input.style.cursor = "not-allowed";
        input.title = "Ник заблокирован! Смена станет доступна через 30 дн.";
        showFarmNotification("", `Никнейм [${playerName}] успешно зафиксирован на 30 дней! 🔒`);
        fetchOnlineMarketOrders();
    } else { 
        input.value = playerName || ""; 
    }
};

// --- 5. ДЕЙСТВИЯ ---
window.toggleWateringTool = function() {
    wateringToolActive = !wateringToolActive; 
    activeSeedToPlant = null; 
    const btn = document.getElementById("tool-watering-can");
    if (btn) { 
        btn.innerText = wateringToolActive ? "💧 Лейка (Вкл)" : "💧 Взять лейку"; 
        btn.style.backgroundColor = wateringToolActive ? "#5c8a36" : "#5c5c5c"; 
    }
};

window.selectSeedForPlanting = function(cropId) {
    if (!playerName || playerName === "") {
        alert("⚠️ СТОП! Сначала введите ваш уникальный никнейм в левой панели!");
        return;
    }
    if (!state || state.inventory.seeds[cropId] <= 0) return;
    wateringToolActive = false; 
    activeSeedToPlant = cropId;
    const wateringBtn = document.getElementById("tool-watering-can"); 
    if (wateringBtn) { 
        wateringBtn.innerText = "💧 Взять лейку"; 
        wateringBtn.style.backgroundColor = "#5c5c5c"; 
    }
    showFarmNotification(FARM_CONFIG.cropsData[cropId].name, "выбрана для посадки! 🌱");
};

window.triggerMassPlanting = function() {
    if (!playerName || playerName === "") {
        alert("⚠️ СТОП! Сначала введите ваш уникальный никнейм в левой панели!");
        return;
    }
    if (!state) return;
    
    const cropSelect = document.getElementById("mass-plant-crop-select");
    if (!cropSelect) return;
    
    const cropId = cropSelect.value;
    const cropInfo = FARM_CONFIG.cropsData[cropId];
    const availableSeeds = state.inventory.seeds[cropId] || 0;
    
    if (availableSeeds <= 0) {
        alert(`У вас нет семян ${cropInfo.name} для посадки!`);
        return;
    }
    
    const emptyPlots = state.plots.filter(plot => plot.opened && !plot.planted);
    if (emptyPlots.length === 0) {
        alert("Нет свободных открытых грядок для посадки!");
        return;
    }
    
    let plantedCount = 0;
    for (let plot of emptyPlots) {
        if (availableSeeds <= plantedCount) break;
        plot.planted = cropId;
        plot.growTimeLeft = cropInfo.growTime;
        plot.stage = 0;
        plot.watered = false;
        plantedCount++;
    }
    
    state.inventory.seeds[cropId] -= plantedCount;
    saveGameProgress();
    updateFarmUI();
    updateFarmGridValues();
    showFarmNotification("🌱 Массовая посадка", `Посажено ${plantedCount} шт ${cropInfo.name}!`);
};

window.handlePlotClick = function(plotId) {
    // АНТИ-АНОНИМ: Пока ник пустой — грядки ЗАБЛОКИРОВАНЫ
    if (!playerName || playerName === "") {
        alert("⚠️ СТОП! Сначала введите ваш уникальный никнейм в левой панели и нажмите Enter!");
        const nameInput = document.getElementById("ui-player-name"); 
        if (nameInput) nameInput.focus();
        return;
    }
    if (!state) return; 
    const plot = state.plots.find(p => p.id === plotId); 
    if (!plot || !plot.opened) return;
    
    if (wateringToolActive) {
        if (plot.planted && !plot.watered && plot.growTimeLeft > 0) { 
            plot.watered = true; 
            updateFarmGridValues(); 
            showFarmNotification(FARM_CONFIG.cropsData[plot.planted].name, "полито! 💧"); 
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
            saveGameProgress(); 
            updateFarmUI(); 
            updateFarmGridValues();
            showFarmNotification(FARM_CONFIG.cropsData[plot.planted]?.name, "посажен! 🌱");
        }
        return;
    }
    
    if (plot.stage === 2) {
        const cropId = plot.planted; 
        const cropInfo = FARM_CONFIG.cropsData[cropId]; 
        state.inventory.barn[cropId] = (state.inventory.barn[cropId] || 0) + 1;
        let minDrop = cropInfo.minSeedsDrop || 1; 
        let maxDrop = cropInfo.maxSeedsDrop || 2;
        let seedsDropped = Math.floor(Math.random() * (maxDrop - minDrop + 1)) + minDrop;
        state.inventory.seeds[cropId] = (state.inventory.seeds[cropId] || 0) + seedsDropped;
        showFarmNotification(cropInfo.name, `собран! Семена: +${seedsDropped} 🌾`);
        plot.planted = null; 
        plot.stage = 0; 
        plot.growTimeLeft = 0; 
        plot.watered = false;
        saveGameProgress(); 
        updateFarmUI(); 
        updateFarmGridValues();
    }
};

function triggerAutoHarvestForPlot(plot) {
    const cropId = plot.planted; 
    const cropInfo = FARM_CONFIG.cropsData[cropId]; 
    state.inventory.barn[cropId] = (state.inventory.barn[cropId] || 0) + 1;
    let minDrop = cropInfo.minSeedsDrop || 1; 
    let maxDrop = cropInfo.maxSeedsDrop || 2;
    let seedsDropped = Math.floor(Math.random() * (maxDrop - minDrop + 1)) + minDrop;
    state.inventory.seeds[cropId] = (state.inventory.seeds[cropId] || 0) + seedsDropped;
    plot.planted = null; 
    plot.stage = 0; 
    plot.growTimeLeft = 0; 
    plot.watered = false;
    saveGameProgress(); 
    updateFarmUI();
}

// --- 6. МАГАЗИН И ПРОДАЖА ---
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
        
        alert(`Куплено: ${item.name}!`);
        saveGameProgress(); 
        updateFarmUI(); 
        updateFarmGridValues();
    } else { 
        alert("Не хватает золота!"); 
    }
};

window.sellAllCrops = function() {
    if (!state) return;
    let earnedTotal = 0;
    for (let cropId in state.inventory.barn) {
        const count = state.inventory.barn[cropId];
        if (count > 0) {
            earnedTotal += count * Math.floor(FARM_CONFIG.cropsData[cropId].sellPrice * (marketMultipliers[cropId] || 1));
            state.inventory.barn[cropId] = 0;
        }
    }
    if (earnedTotal > 0) {
        state.coins += earnedTotal;
        alert(`Урожай продан за ${earnedTotal} монет!`);
        saveGameProgress();
        updateFarmUI();
    } else {
        alert("Амбар пуст!");
    }
};

// --- 7. ГАЧА ---
window.triggerGachaRoll = function() {
    if (!state) return;
    if (state.coins >= FARM_CONFIG.gachaPrice) {
        state.coins -= FARM_CONFIG.gachaPrice;
        const rolledCrop = FARM_CONFIG.rollGacha();
        state.inventory.seeds[rolledCrop] = (state.inventory.seeds[rolledCrop] || 0) + 1;
        const cropInfo = FARM_CONFIG.cropsData[rolledCrop];
        const resultEl = document.getElementById("ui-gacha-result");
        if (resultEl) {
            resultEl.style.display = "block";
            resultEl.style.background = "#d4af37";
            resultEl.style.padding = "8px";
            resultEl.style.borderRadius = "10px";
            resultEl.style.marginTop = "10px";
            resultEl.style.textAlign = "center";
            resultEl.innerHTML = `✨ Получено: ${cropInfo.name} (${cropInfo.rarity}★)! ✨`;
            setTimeout(() => { resultEl.style.display = "none"; }, 3000);
        }
        saveGameProgress();
        updateFarmUI();
        updateSeedsUI();
    } else {
        alert("Не хватает монет!");
    }
};

function simulateMarketTrends() {
    const pricesBox = document.getElementById("ui-market-prices"); 
    if (!pricesBox) return;
    pricesBox.innerHTML = "";
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

function showFarmNotification(cropName, statusText) {
    const container = document.getElementById("farm-toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = "farm-toast";
    toast.innerHTML = cropName ? `🌾 <b>${cropName}</b> ${statusText}` : `🌾 ${statusText}`;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}

// --- 8. FIREBASE РЫНОК ---
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
        .catch(err => console.log("Firebase ошибка:", err));
}

function renderMarketBoardUI() {
    const board = document.getElementById("ui-market-board"); 
    if (!board) return;
    board.innerHTML = "";
    if (onlineMarketOrders.length === 0) { 
        board.innerHTML = `<div style="padding:20px; text-align:center;">📭 На рынке пока нет товаров</div>`; 
        return; 
    }
    onlineMarketOrders.forEach(order => {
        const cropInfo = FARM_CONFIG.cropsData[order.crop]; 
        if (!cropInfo) return;
        const line = document.createElement("div"); 
        line.className = "market-price-line";
        let isMyOrder = order.seller === playerName; 
        let btnText = isMyOrder ? "Снять" : "Купить"; 
        let btnColor = isMyOrder ? "#ba2929" : "#a3723b";
        line.innerHTML = `<span><b>${order.seller}</b>: ${cropInfo.name} x${order.amount}</span><button class="mini-plant-btn" style="background:${btnColor};" onclick="window.handleMarketOrderClick('${order.id}')">${btnText} (${order.price})</button>`;
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
                saveGameProgress();
                updateFarmUI();
                fetchOnlineMarketOrders();
                showFarmNotification("", "Объявление снято с рынка");
            });
    } else if (state.coins >= order.price) {
        fetch(`${FIREBASE_DB_URL}/market/${orderId}.json`, { method: "DELETE" })
            .then(() => {
                state.coins -= order.price;
                state.inventory.barn[order.crop] = (state.inventory.barn[order.crop] || 0) + (order.amount || 1);
                saveGameProgress();
                updateFarmUI();
                fetchOnlineMarketOrders();
                showFarmNotification("", `Куплено за ${order.price} монет!`);
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
    if (!cropSelect || !amountInput || !priceInput) return;
    const cropId = cropSelect.value;
    const amount = parseInt(amountInput.value);
    const price = parseInt(priceInput.value);
    if (isNaN(amount) || amount <= 0 || isNaN(price) || price <= 0) {
        alert("Введите корректные данные!"); return;
    }
    if ((state.inventory.barn[cropId] || 0) >= amount) {
        state.inventory.barn[cropId] -= amount;
        fetch(`${FIREBASE_DB_URL}/market.json`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ seller: playerName, crop: cropId, amount: amount, price: price, timestamp: Date.now() })
        }).then(() => {
            window.closeCreateOrderModal();
            saveGameProgress();
            updateFarmUI();
            fetchOnlineMarketOrders();
            showFarmNotification("", "Товар выставлен на рынок!");
        });
    } else {
        alert(`В амбаре нет столько плодов! У тебя всего: ${state.inventory.barn[cropId] || 0} шт.`);
    }
};

function saveGameProgress() {
    if (state) localStorage.setItem("pixel_farm_state_v11", JSON.stringify(state));
}

// --- 9. ПОЛНЫЙ СБРОС ПРОГРЕССА ---
window.resetEntireGameProgress = function() {
    const doubleCheck = confirm("🚨 ВНИМАНИЕ! Вы уверены, что хотите СБРОСИТЬ весь прогресс? Вы потеряете монеты, купленных роботов, инвентарь и замок на никнейм! Это действие нельзя отменить!");
    if (doubleCheck) {
        localStorage.removeItem("pixel_farm_state_v11");
        localStorage.removeItem("pixel_farm_player_name");
        localStorage.removeItem("pixel_farm_name_changed_at");
        alert("Прогресс стёрт! Паспортная база очищена. Игра перезапускается! 🔄");
        location.reload();
    }
};

// --- АВТОЗАПУСК (ждём загрузки DOM) ---
document.addEventListener("DOMContentLoaded", function() {
    // Показываем меню, игра не запущена
    const menu = document.getElementById("ui-main-menu-overlay");
    const gameContainer = document.getElementById("game-container");
    if (menu) menu.style.display = "flex";
    if (gameContainer) gameContainer.style.display = "none";
});
