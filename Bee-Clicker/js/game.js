// ===================================================================
// ИГРОВОЙ ДВИЖОК (GAME-МОДУЛЬ): РАСЧЕТЫ И СИНХРОНИЗАЦИЯ С МИКШЕРОМ ГРОМКОСТИ
// ===================================================================

let state = JSON.parse(JSON.stringify(CLICKER_CONFIG.startingState));

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

// ЕЖЕСЕКУНДНЫЙ ТИК ИГРЫ
function runGameTick() {
    let earned = state.honeyPerSecond;
    if (lilyActive) earned *= 3; 

    state.honey += earned;
    state.totalHoneyEarned += earned;

    if (earned > 0) {
        let expGained = earned * 0.1;
        if (state.purchasedUpgrades.includes("upgrade_queen_1")) expGained *= 1.3;
        addQueenExp(expGained);
    }

    if (typeof CLICKER_ACHIEVEMENTS !== "undefined") {
        CLICKER_ACHIEVEMENTS.checkAll(state);
    }
    saveGameProgress();
    updateClickerUI();
}

// НАСТРОЙКА ИЗМЕНЕНИЯ ГРОМКОСТИ НА ЛЕТУ С ПОЛЗУНКА
window.updateMusicVolume = function() {
    const slider = document.getElementById("music-volume-slider");
    const volumeText = document.getElementById("ui-volume-val");
    if (!slider) return;

    const volVal = parseInt(slider.value);
    
    // Обновляем текст процентов в меню настройки
    if (volumeText) volumeText.innerText = volVal + "%";

    // Если плеер активен — налету меняем громкость
    if (beeRadioPlayer) {
        beeRadioPlayer.volume = volVal / 100;
    }
};

// СТАРТ ИГРЫ И ИНИЦИАЛИЗАЦИЯ ПЛЕЕРА
window.startGameplayLayout = function() {
    const modeSelect = document.getElementById("music-mode-select");
    if (modeSelect) currentMusicMode = modeSelect.value;

    document.getElementById("app-main-menu").style.display = "none";
    document.getElementById("app-game-layout").style.display = "grid";

    launchBeeRadio();
};

window.exitToMainMenu = function() {
    saveGameProgress();
    if (beeRadioPlayer) beeRadioPlayer.pause();
    document.getElementById("app-game-layout").style.display = "none";
    document.getElementById("app-main-menu").style.display = "flex";
};

// РАДИОСТАНЦИЯ УЛЬЯ С УЧЁТОМ ЗНАЧЕНИЯ ПОЛЗУНКА
function launchBeeRadio() {
    if (currentMusicMode === "off") return;

    if (!beeRadioPlayer) {
        beeRadioPlayer = new Audio();

        beeRadioPlayer.addEventListener("ended", () => {
            if (currentMusicMode === "random") playNextRandomTrack();
            else beeRadioPlayer.play().catch(e => console.log(e));
        });
    }

    // Принудительно считываем значение ползунка при старте
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
        console.log("Браузер ждёт первого клика по горшку для старта звуков...");
        document.getElementById("clicker-core").addEventListener("click", function startOnFirstClick() {
            if (beeRadioPlayer) beeRadioPlayer.play().catch(err => console.log(err));
            document.getElementById("clicker-core").removeEventListener("click", startOnFirstClick);
        });
    });
}

function playNextRandomTrack() {
    if (!beeRadioPlayer || currentMusicMode !== "random") return;
    let nextIndex = currentTrackIndex;
    while (nextIndex === currentTrackIndex) {
        nextIndex = Math.floor(Math.random() * tracksPool.length);
    }
    currentTrackIndex = nextIndex;
    beeRadioPlayer.src = tracksPool[currentTrackIndex];
    
    const slider = document.getElementById("music-volume-slider");
    beeRadioPlayer.volume = slider ? (parseInt(slider.value) / 100) : 0.20;
    
    beeRadioPlayer.play().catch(e => console.log(e));
}

function recalculateStats() {
    let workerMult = state.purchasedUpgrades.includes("upgrade_worker_1") ? 2 : 1;
    let foragerMult = state.purchasedUpgrades.includes("upgrade_forager_1") ? 2 : 1;

    let rawHps = 0;
    rawHps += state.buildings.worker * CLICKER_CONFIG.buildingsData.worker.hps * workerMult;
    rawHps += state.buildings.forager * CLICKER_CONFIG.buildingsData.forager.hps * foragerMult;
    rawHps += state.buildings.guard * CLICKER_CONFIG.buildingsData.guard.hps;
    rawHps += state.buildings.alchemist * CLICKER_CONFIG.buildingsData.alchemist.hps;
    rawHps += state.buildings.royal * CLICKER_CONFIG.buildingsData.royal.hps;

    const bonus = CLICKER_CONFIG.getQueenBonus(state.queenLevel);
    
    let extraClick = 0;
    if (state.purchasedUpgrades.includes("upgrade_click_1")) extraClick += 3;
    if (state.purchasedUpgrades.includes("upgrade_click_2")) extraClick += 15;

    state.honeyPerSecond = rawHps * bonus.productionMultiplier;
    state.clickPower = 1 + bonus.clickBonus + extraClick;
}

function handleHoneyClick(e) {
    let power = state.clickPower;
    if (lilyActive) power *= 3; 

    state.honey += power;
    state.totalHoneyEarned += power;
    state.totalClicks++;

    let expGained = power * 0.5;
    if (state.purchasedUpgrades.includes("upgrade_queen_1")) expGained *= 1.3;
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
        particle.style.left = x + "px";
        particle.style.top = y + "px";
        const targetX = (Math.random() - 0.5) * 160;
        const targetY = (Math.random() - 0.7) * 160;
        particle.style.setProperty("--tx", `${targetX}px`);
        particle.style.setProperty("--ty", `${targetY}px`);
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 600);
    }
}

function trySpawnGoldenLily() {
    if (lilyActive || document.getElementById("golden-lily-element")) return;
    if (Math.random() > 0.4) return;
    const lily = document.createElement("div");
    lily.id = "golden-lily-element"; lily.className = "golden-lily-spawn"; lily.innerText = "🌸✨";
    lily.style.left = Math.random() * (window.innerWidth - 100) + "px";
    lily.style.top = Math.random() * (window.innerHeight - 100) + "px";
    lily.onclick = () => { lily.remove(); activateGoldenLilyBoost(); };
    document.body.appendChild(lily);
    setTimeout(() => { if (lily) lily.remove(); }, 12000);
}

function activateGoldenLilyBoost() {
    if (lilyTimerInterval) clearInterval(lilyTimerInterval);
    lilyActive = true; lilyTimeLeft = 600;
    document.getElementById("lily-timer-zone").style.display = "block";
    if (typeof ClickerAudio !== "undefined") ClickerAudio.playLevelUp();
    lilyTimerInterval = setInterval(() => {
        lilyTimeLeft--;
        let mins = Math.floor(lilyTimeLeft / 60); let secs = lilyTimeLeft % 60;
        document.getElementById("lily-countdown").innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        if (lilyTimeLeft <= 0) {
            clearInterval(lilyTimerInterval); lilyActive = false;
            document.getElementById("lily-timer-zone").style.display = "none";
            alert("⏰ Действие Нектара Золотой Лилии подошло к концу!");
        }
    }, 1000);
}

window.buyUpgrade = function(upgId) {
    const upg = CLICKER_CONFIG.upgradesData[upgId];
    if (state.honey >= upg.price) {
        state.honey -= upg.price;
        state.purchasedUpgrades.push(upgId);
        if (typeof ClickerAudio !== "undefined") ClickerAudio.playBuy();
        recalculateStats();
        updateClickerUI();
        renderUpgradesList();
    } else { alert("Не хватает мёда!"); }
};

function renderUpgradesList() {
    const box = document.getElementById("clicker-upgrades-box");
    if (!box) return; box.innerHTML = "";
    for (let upgId in CLICKER_CONFIG.upgradesData) {
        if (state.purchasedUpgrades.includes(upgId)) continue;
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

function addQueenExp(amount) {
    if (state.queenLevel >= 500) return;
    state.queenExp += amount;
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

window.buyBeeBuilding = function(bId) {
    const cost = getBuildingCost(bId);
    if (state.honey >= cost) {
        state.honey -= cost;
        state.buildings[bId]++;
        if (typeof ClickerAudio !== "undefined") ClickerAudio.playBuy();
        recalculateStats();
        updateClickerUI();
        renderBuildingsList();
    } else { alert("Не хватает мёда!"); }
};

function getBuildingCost(bId) {
    return Math.floor(CLICKER_CONFIG.buildingsData[bId].basePrice * Math.pow(CLICKER_CONFIG.buildingsData[bId].multiplier, state.buildings[bId]));
}

function renderBuildingsList() {
    const box = document.getElementById("clicker-shop-box");
    if (!box) return; box.innerHTML = "";
    for (let bId in CLICKER_CONFIG.buildingsData) {
        const data = CLICKER_CONFIG.buildingsData[bId];
        const cost = getBuildingCost(bId);
        const card = document.createElement("div");
        card.className = "shop-item-card";
        card.innerHTML = `
            <div class="shop-item-info">
                <span class="shop-item-name">${data.name} (x${state.buildings[bId]})</span>
                <span class="shop-item-desc">+${ClickerUtils.formatNumber(data.hps)} л/сек</span>
            </div>
            <button class="buy-bee-btn" onclick="window.buyBeeBuilding('${bId}')">🍯 ${ClickerUtils.formatNumber(cost)} л</button>
        `;
        box.appendChild(card);
    }
}

function updateClickerUI() {
    let mult = lilyActive ? 3 : 1;
    document.getElementById("ui-honey").innerText = ClickerUtils.formatNumber(state.honey);
    document.getElementById("ui-hps").innerText = ClickerUtils.formatNumber(state.honeyPerSecond * mult);
    document.getElementById("ui-click").innerText = ClickerUtils.formatNumber(state.clickPower * mult);
    document.getElementById("ui-queen-lvl").innerText = state.queenLevel;
    document.getElementById("ui-ach-count").innerText = state.unlockedAchievements ? state.unlockedAchievements.length : 0;
    
    const reqExp = CLICKER_CONFIG.getRequiredExpForLevel(state.queenLevel);
    document.getElementById("ui-current-exp").innerText = ClickerUtils.formatNumber(state.queenExp);
    document.getElementById("ui-needed-exp").innerText = ClickerUtils.formatNumber(reqExp);
    
    const progressBar = document.getElementById("ui-queen-progress");
    if (progressBar) {
        progressBar.style.width = `${state.queenLevel >= 500 ? 100 : (state.queenExp / reqExp) * 100}%`;
    }
}

window.openAchievementsModal = function() {
    const modal = document.getElementById("achievements-modal");
    const listContainer = document.getElementById("modal-achievements-list");
    if (!modal || !listContainer) return;
    document.getElementById("ui-modal-ach-count").innerText = state.unlockedAchievements ? state.unlockedAchievements.length : 0;
    listContainer.innerHTML = "";
    if (typeof CLICKER_ACHIEVEMENTS !== "undefined" && CLICKER_ACHIEVEMENTS.db) {
        CLICKER_ACHIEVEMENTS.db.forEach(ach => {
            const isUnlocked = state.unlockedAchievements.includes(ach.id);
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
window.closeAchievementsModal = function() { document.getElementById("achievements-modal").style.display = "none"; };

function triggerClickAnimation() {
    const core = document.getElementById("clicker-core");
    if (core) { core.style.transform = "scale(0.93)"; setTimeout(() => core.style.transform = "scale(1)", 50); }
}

function saveGameProgress() { localStorage.setItem("bee_clicker_state_v3", JSON.stringify(state)); }
function loadGameProgress() {
    const saved = localStorage.getItem("bee_clicker_state_v3");
    if (saved) state = JSON.parse(saved);
}

window.resetClickerGame = function() {
    if (confirm("Обнулить прогресс и вернуться в Главное меню?")) {
        localStorage.removeItem("bee_clicker_state_v3"); location.reload();
    }
};
