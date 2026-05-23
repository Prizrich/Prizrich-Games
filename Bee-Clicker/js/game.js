// ===================================================================
// ОСНОВНАЯ ЛОГИКА КЛИКЕРА "МЕДОВЫЙ УЛЕЙ"
// ===================================================================

let state = null;
let lilyActive = false;
let lilyTimeLeft = 0;
let lilyTimerInterval = null;

let beeRadioPlayer = null;
let currentTrackIndex = -1;
let currentMusicMode = "random";

const tracksPool = [
    "sounds/1.mp3", "sounds/2.mp3", "sounds/3.mp3", "sounds/4.mp3", 
    "sounds/5.mp3", "sounds/6.mp3", "sounds/7.mp3"
];

// ========== ИНИЦИАЛИЗАЦИЯ И ЗАГРУЗКА ==========
function initClickerGame() {
    loadGameProgress();
    
    if (!state || !state.buildings) {
        state = JSON.parse(JSON.stringify(CLICKER_CONFIG.startingState));
        if (!state.unlockedAchievements) state.unlockedAchievements = [];
        if (!state.totalClicks) state.totalClicks = 0;
        if (!state.totalHoneyEarned) state.totalHoneyEarned = 0;
    }
    
    recalculateStats();
    updateClickerUI();
    renderBuildingsList();
    renderUpgradesList();
    
    setInterval(() => {
        runGameTick();
    }, 1000);
    
    setInterval(() => {
        trySpawnGoldenLily();
    }, 30000);
    
    const clickCore = document.getElementById("clicker-core");
    if (clickCore) {
        clickCore.addEventListener("click", handleHoneyClick);
    }
}

// ========== СОХРАНЕНИЕ И ЗАГРУЗКА ==========
function saveGameProgress() { 
    if (state) localStorage.setItem("bee_clicker_state_v3", JSON.stringify(state)); 
}

function loadGameProgress() {
    const saved = localStorage.getItem("bee_clicker_state_v3");
    if (saved) {
        try {
            state = JSON.parse(saved);
            if (!state.unlockedAchievements) state.unlockedAchievements = [];
            if (!state.totalClicks) state.totalClicks = 0;
            if (!state.totalHoneyEarned) state.totalHoneyEarned = 0;
        } catch(e) {
            state = JSON.parse(JSON.stringify(CLICKER_CONFIG.startingState));
        }
    } else {
        state = JSON.parse(JSON.stringify(CLICKER_CONFIG.startingState));
    }
}

// ========== ПОЛНЫЙ СБРОС ПРОГРЕССА ==========
window.resetClickerGame = function() {
    const doubleCheck = confirm("🚨 ВНИМАНИЕ! Вы уверены, что хотите СБРОСИТЬ весь прогресс?\n\nВы потеряете:\n- Весь накопленный мёд\n- Всех купленных пчёл\n- Все улучшения\n- Уровень Королевы\n- Все достижения\n\nЭто действие нельзя отменить!");
    
    if (doubleCheck) {
        // Полностью очищаем localStorage
        localStorage.removeItem("bee_clicker_state_v3");
        localStorage.removeItem("bee_clicker_achievements");
        
        // Создаём новый чистый state
        state = JSON.parse(JSON.stringify(CLICKER_CONFIG.startingState));
        if (!state.unlockedAchievements) state.unlockedAchievements = [];
        if (!state.totalClicks) state.totalClicks = 0;
        if (!state.totalHoneyEarned) state.totalHoneyEarned = 0;
        
        // Сбрасываем активные эффекты
        if (lilyTimerInterval) {
            clearInterval(lilyTimerInterval);
            lilyTimerInterval = null;
        }
        lilyActive = false;
        lilyTimeLeft = 0;
        
        // Пересчитываем статистику
        recalculateStats();
        
        // Обновляем весь UI
        updateClickerUI();
        renderBuildingsList();
        renderUpgradesList();
        
        // Показываем уведомление
        if (typeof showNotification === 'function') {
            showNotification("🔄 Прогресс сброшен", "Игра началась заново!");
        } else {
            alert("✅ Прогресс успешно сброшен! Игра началась заново.");
        }
        
        // Сохраняем пустой сейв
        saveGameProgress();
    }
};

// ========== ЕЖЕСЕКУНДНЫЙ ТИК ИГРЫ ==========
function runGameTick() {
    if (!state) return;
    
    let earned = state.honeyPerSecond;
    if (lilyActive) earned *= 3; 

    state.honey += earned;
    state.totalHoneyEarned += earned;

    if (earned > 0) {
        let expGained = earned * 0.1;
        if (state.purchasedUpgrades && state.purchasedUpgrades.includes("upgrade_queen_1")) expGained *= 1.3;
        addQueenExp(expGained);
    }

    if (typeof CLICKER_ACHIEVEMENTS !== "undefined") {
        CLICKER_ACHIEVEMENTS.checkAll(state);
    }
    saveGameProgress();
    updateClickerUI();
}

// ========== НАСТРОЙКА МУЗЫКИ ==========
window.updateMusicVolume = function() {
    const slider = document.getElementById("music-volume-slider");
    const volumeText = document.getElementById("ui-volume-val");
    if (!slider) return;

    const volVal = parseInt(slider.value);
    if (volumeText) volumeText.innerText = volVal + "%";
    if (beeRadioPlayer) beeRadioPlayer.volume = volVal / 100;
};

window.nextMusicTrack = function() {
    if (currentMusicMode === "random") {
        playNextRandomTrack();
    } else {
        currentTrackIndex = (currentTrackIndex + 1) % tracksPool.length;
        if (beeRadioPlayer) {
            beeRadioPlayer.src = tracksPool[currentTrackIndex];
            const slider = document.getElementById("music-volume-slider");
            beeRadioPlayer.volume = slider ? (parseInt(slider.value) / 100) : 0.20;
            beeRadioPlayer.play().catch(e => console.log(e));
        }
    }
};

window.startGameplayLayout = function() {
    const modeSelect = document.getElementById("music-mode-select");
    if (modeSelect) currentMusicMode = modeSelect.value;

    document.getElementById("app-main-menu").style.display = "none";
    document.getElementById("app-game-layout").style.display = "grid";

    launchBeeRadio();
    initClickerGame();
};

window.exitToMainMenu = function() {
    saveGameProgress();
    if (beeRadioPlayer) beeRadioPlayer.pause();
    document.getElementById("app-game-layout").style.display = "none";
    document.getElementById("app-main-menu").style.display = "flex";
};

function launchBeeRadio() {
    if (currentMusicMode === "off") return;

    if (!beeRadioPlayer) {
        beeRadioPlayer = new Audio();
        beeRadioPlayer.addEventListener("ended", () => {
            if (currentMusicMode === "random") playNextRandomTrack();
            else beeRadioPlayer.play().catch(e => console.log(e));
        });
    }

    const slider = document.getElementById("music-volume-slider");
    beeRadioPlayer.volume = slider ? (parseInt(slider.value) / 100) : 0.20;

    if (currentMusicMode === "random") {
        currentTrackIndex = Math.floor(Math.random() * tracksPool.length);
        beeRadioPlayer.src = tracksPool[currentTrackIndex];
    } else {
        currentTrackIndex = parseInt(currentMusicMode) - 1;
        beeRadioPlayer.src = tracksPool[currentTrackIndex];
    }

    beeRadioPlayer.play().catch(e => {
        console.log("Браузер ждёт первого клика для старта звуков...");
        const clickCore = document.getElementById("clicker-core");
        if (clickCore) {
            clickCore.addEventListener("click", function startOnFirstClick() {
                if (beeRadioPlayer) beeRadioPlayer.play().catch(err => console.log(err));
                clickCore.removeEventListener("click", startOnFirstClick);
            }, { once: true });
        }
    });
}

function playNextRandomTrack() {
    if (!beeRadioPlayer || currentMusicMode !== "random") return;
    let nextIndex = currentTrackIndex;
    while (nextIndex === currentTrackIndex && tracksPool.length > 1) {
        nextIndex = Math.floor(Math.random() * tracksPool.length);
    }
    currentTrackIndex = nextIndex;
    beeRadioPlayer.src = tracksPool[currentTrackIndex];
    
    const slider = document.getElementById("music-volume-slider");
    beeRadioPlayer.volume = slider ? (parseInt(slider.value) / 100) : 0.20;
    beeRadioPlayer.play().catch(e => console.log(e));
}

// ========== РАСЧЁТ СТАТИСТИКИ ==========
function recalculateStats() {
    if (!state) return;
    
    let workerMult = state.purchasedUpgrades && state.purchasedUpgrades.includes("upgrade_worker_1") ? 2 : 1;
    let foragerMult = state.purchasedUpgrades && state.purchasedUpgrades.includes("upgrade_forager_1") ? 2 : 1;

    let rawHps = 0;
    rawHps += (state.buildings.worker || 0) * CLICKER_CONFIG.buildingsData.worker.hps * workerMult;
    rawHps += (state.buildings.forager || 0) * CLICKER_CONFIG.buildingsData.forager.hps * foragerMult;
    rawHps += (state.buildings.guard || 0) * CLICKER_CONFIG.buildingsData.guard.hps;
    rawHps += (state.buildings.alchemist || 0) * CLICKER_CONFIG.buildingsData.alchemist.hps;
    rawHps += (state.buildings.royal || 0) * CLICKER_CONFIG.buildingsData.royal.hps;

    const bonus = CLICKER_CONFIG.getQueenBonus(state.queenLevel || 1);
    
    let extraClick = 0;
    if (state.purchasedUpgrades && state.purchasedUpgrades.includes("upgrade_click_1")) extraClick += 3;
    if (state.purchasedUpgrades && state.purchasedUpgrades.includes("upgrade_click_2")) extraClick += 15;

    state.honeyPerSecond = rawHps * bonus.productionMultiplier;
    state.clickPower = 1 + bonus.clickBonus + extraClick;
}

// ========== КЛИК ПО ГОРШКУ ==========
function handleHoneyClick(e) {
    if (!state) return;
    
    let power = state.clickPower;
    if (lilyActive) power *= 3; 

    state.honey += power;
    state.totalHoneyEarned += power;
    state.totalClicks = (state.totalClicks || 0) + 1;

    let expGained = power * 0.5;
    if (state.purchasedUpgrades && state.purchasedUpgrades.includes("upgrade_queen_1")) expGained *= 1.3;
    addQueenExp(expGained);

    if (typeof ClickerAudio !== "undefined") ClickerAudio.playClick();
    if (typeof CLICKER_ACHIEVEMENTS !== "undefined") CLICKER_ACHIEVEMENTS.checkAll(state); 
    updateClickerUI();
    triggerClickAnimation();

    if (e && typeof e.clientX !== 'undefined') {
        createHoneyParticles(e.clientX, e.clientY);
    }
}

function createHoneyParticles(x, y) {
    for (let i = 0; i < 5; i++) {
        const particle = document.createElement("div");
        particle.className = "honey-drop-particle";
        particle.innerText = "✦";
        particle.style.position = "fixed";
        particle.style.left = (x + (Math.random() - 0.5) * 30) + "px";
        particle.style.top = (y + (Math.random() - 0.5) * 30) + "px";
        particle.style.fontSize = "1.5rem";
        particle.style.pointerEvents = "none";
        particle.style.zIndex = "99999";
        particle.style.animation = "flyOutParticle 0.6s ease-out forwards";
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 600);
    }
}

function triggerClickAnimation() {
    const core = document.getElementById("clicker-core");
    if (core) { 
        core.style.transform = "scale(0.93)"; 
        setTimeout(() => core.style.transform = "scale(1)", 50);
    }
}

// ========== ЗОЛОТАЯ ЛИЛИЯ ==========
function trySpawnGoldenLily() {
    if (lilyActive || document.getElementById("golden-lily-element")) return;
    if (Math.random() > 0.4) return;
    
    const lily = document.createElement("div");
    lily.id = "golden-lily-element"; 
    lily.className = "golden-lily-spawn"; 
    lily.innerText = "🌸✨";
    lily.style.position = "fixed";
    lily.style.left = Math.random() * (window.innerWidth - 100) + "px";
    lily.style.top = Math.random() * (window.innerHeight - 100) + "px";
    lily.style.cursor = "pointer";
    lily.style.zIndex = "99999";
    lily.onclick = () => { 
        lily.remove(); 
        activateGoldenLilyBoost(); 
    };
    document.body.appendChild(lily);
    setTimeout(() => { 
        if (lily && lily.remove) lily.remove(); 
    }, 12000);
}

function activateGoldenLilyBoost() {
    if (lilyTimerInterval) clearInterval(lilyTimerInterval);
    lilyActive = true; 
    lilyTimeLeft = 600;
    
    const timerZone = document.getElementById("lily-timer-zone");
    if (timerZone) timerZone.style.display = "block";
    
    if (typeof ClickerAudio !== "undefined") ClickerAudio.playLevelUp();
    
    lilyTimerInterval = setInterval(() => {
        lilyTimeLeft--;
        let mins = Math.floor(lilyTimeLeft / 60); 
        let secs = lilyTimeLeft % 60;
        const countdownSpan = document.getElementById("lily-countdown");
        if (countdownSpan) countdownSpan.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        
        if (lilyTimeLeft <= 0) {
            clearInterval(lilyTimerInterval);
            lilyActive = false;
            if (timerZone) timerZone.style.display = "none";
            alert("⏰ Действие Нектара Золотой Лилии подошло к концу!");
        }
    }, 1000);
}

// ========== УЛУЧШЕНИЯ ==========
window.buyUpgrade = function(upgId) {
    if (!state) return;
    
    const upg = CLICKER_CONFIG.upgradesData[upgId];
    if (state.honey >= upg.price) {
        state.honey -= upg.price;
        if (!state.purchasedUpgrades) state.purchasedUpgrades = [];
        state.purchasedUpgrades.push(upgId);
        if (typeof ClickerAudio !== "undefined") ClickerAudio.playBuy();
        recalculateStats();
        updateClickerUI();
        renderUpgradesList();
        saveGameProgress();
    } else { 
        alert("Не хватает мёда!"); 
    }
};

function renderUpgradesList() {
    const box = document.getElementById("clicker-upgrades-box");
    if (!box) return; 
    box.innerHTML = "";
    
    if (!state || !CLICKER_CONFIG.upgradesData) return;
    
    for (let upgId in CLICKER_CONFIG.upgradesData) {
        if (state.purchasedUpgrades && state.purchasedUpgrades.includes(upgId)) continue;
        const data = CLICKER_CONFIG.upgradesData[upgId];
        const card = document.createElement("div");
        card.className = "shop-item-card";
        card.innerHTML = `
            <div class="shop-item-info">
                <span class="shop-item-name">${data.name}</span>
                <span class="shop-item-desc">${data.desc}</span>
            </div>
            <button class="buy-bee-btn" style="background-color:#55ff55;" onclick="window.buyUpgrade('${upgId}')">🍯 ${ClickerUtils.formatNumber(data.price)} л</button>
        `;
        box.appendChild(card);
    }
}

// ========== ОПЫТ КОРОЛЕВЫ ==========
function addQueenExp(amount) {
    if (!state) return;
    if (state.queenLevel >= 500) return;
    
    state.queenExp = (state.queenExp || 0) + amount;
    let requiredExp = CLICKER_CONFIG.getRequiredExpForLevel(state.queenLevel);
    
    while (state.queenExp >= requiredExp && state.queenLevel < 500) {
        state.queenExp -= requiredExp;
        state.queenLevel++;
        if (typeof ClickerAudio !== "undefined") ClickerAudio.playLevelUp();
        recalculateStats();
        renderBuildingsList();
        alert(`👑 Уровень Королевы повышен! Текущий уровень: ${state.queenLevel}/500`);
        requiredExp = CLICKER_CONFIG.getRequiredExpForLevel(state.queenLevel);
    }
}

// ========== ПОКУПКА ПЧЁЛ ==========
window.buyBeeBuilding = function(bId) {
    if (!state) return;
    
    const cost = getBuildingCost(bId);
    if (state.honey >= cost) {
        state.honey -= cost;
        state.buildings[bId] = (state.buildings[bId] || 0) + 1;
        if (typeof ClickerAudio !== "undefined") ClickerAudio.playBuy();
        recalculateStats();
        updateClickerUI();
        renderBuildingsList();
        saveGameProgress();
    } else { 
        alert("Не хватает мёда!"); 
    }
};

function getBuildingCost(bId) {
    const count = state.buildings[bId] || 0;
    return Math.floor(CLICKER_CONFIG.buildingsData[bId].basePrice * Math.pow(CLICKER_CONFIG.buildingsData[bId].multiplier, count));
}

function renderBuildingsList() {
    const box = document.getElementById("clicker-shop-box");
    if (!box) return; 
    box.innerHTML = "";
    
    if (!state || !CLICKER_CONFIG.buildingsData) return;
    
    for (let bId in CLICKER_CONFIG.buildingsData) {
        const data = CLICKER_CONFIG.buildingsData[bId];
        const cost = getBuildingCost(bId);
        const count = state.buildings[bId] || 0;
        const card = document.createElement("div");
        card.className = "shop-item-card";
        card.innerHTML = `
            <div class="shop-item-info">
                <span class="shop-item-name">${data.name} (x${count})</span>
                <span class="shop-item-desc">+${ClickerUtils.formatNumber(data.hps)} л/сек</span>
            </div>
            <button class="buy-bee-btn" onclick="window.buyBeeBuilding('${bId}')">🍯 ${ClickerUtils.formatNumber(cost)} л</button>
        `;
        box.appendChild(card);
    }
}

// ========== ОБНОВЛЕНИЕ UI ==========
function updateClickerUI() {
    if (!state) return;
    
    let mult = lilyActive ? 3 : 1;
    
    const honeyElem = document.getElementById("ui-honey");
    const hpsElem = document.getElementById("ui-hps");
    const clickElem = document.getElementById("ui-click");
    const queenLvlElem = document.getElementById("ui-queen-lvl");
    const achCountElem = document.getElementById("ui-ach-count");
    const currentExpElem = document.getElementById("ui-current-exp");
    const neededExpElem = document.getElementById("ui-needed-exp");
    const progressBar = document.getElementById("ui-queen-progress");
    
    if (honeyElem) honeyElem.innerText = ClickerUtils.formatNumber(state.honey);
    if (hpsElem) hpsElem.innerText = ClickerUtils.formatNumber(state.honeyPerSecond * mult);
    if (clickElem) clickElem.innerText = ClickerUtils.formatNumber(state.clickPower * mult);
    if (queenLvlElem) queenLvlElem.innerText = state.queenLevel;
    if (achCountElem) achCountElem.innerText = state.unlockedAchievements ? state.unlockedAchievements.length : 0;
    
    const reqExp = CLICKER_CONFIG.getRequiredExpForLevel(state.queenLevel);
    if (currentExpElem) currentExpElem.innerText = ClickerUtils.formatNumber(state.queenExp || 0);
    if (neededExpElem) neededExpElem.innerText = ClickerUtils.formatNumber(reqExp);
    
    if (progressBar) {
        progressBar.style.width = `${state.queenLevel >= 500 ? 100 : ((state.queenExp || 0) / reqExp) * 100}%`;
    }
}

// ========== ДОСТИЖЕНИЯ ==========
window.openAchievementsModal = function() {
    const modal = document.getElementById("achievements-modal");
    const listContainer = document.getElementById("modal-achievements-list");
    if (!modal || !listContainer) return;
    
    if (document.getElementById("ui-modal-ach-count")) {
        document.getElementById("ui-modal-ach-count").innerText = state.unlockedAchievements ? state.unlockedAchievements.length : 0;
    }
    
    listContainer.innerHTML = "";
    
    if (typeof CLICKER_ACHIEVEMENTS !== "undefined" && CLICKER_ACHIEVEMENTS.db) {
        CLICKER_ACHIEVEMENTS.db.forEach(ach => {
            const isUnlocked = state.unlockedAchievements && state.unlockedAchievements.includes(ach.id);
            const card = document.createElement("div");
            card.className = `ach-list-card ${isUnlocked ? 'unlocked' : ''}`;
            card.innerHTML = `
                <div class="ach-list-title">${isUnlocked ? '🏆' : '🔒'} ${ach.title}</div>
                <div class="ach-list-desc">${ach.desc}</div>
                <div class="ach-list-reward">Награда: +${ach.reward} л мёда ${isUnlocked ? '(Получено)' : ''}</div>
            `;
            listContainer.appendChild(card);
        });
    }
    modal.style.display = "flex";
};

window.closeAchievementsModal = function() { 
    document.getElementById("achievements-modal").style.display = "none"; 
};
