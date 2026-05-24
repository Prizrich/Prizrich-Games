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

// ЗАЩИТА ОТ АВТОКЛИКЕРА
let lastClickTime = 0;
let clickCounter = 0;
let clickSpamWarning = false;
let animationFramePending = false;
let pendingUIUpdate = false;
let notificationQueue = [];
let isShowingNotification = false;

// КЭШ ДЛЯ DOM ЭЛЕМЕНТОВ
let cachedElements = {};

const tracksPool = [
    "sounds/1.mp3", "sounds/2.mp3", "sounds/3.mp3", "sounds/4.mp3", 
    "sounds/5.mp3", "sounds/6.mp3", "sounds/7.mp3"
];

// ========== КРАСИВЫЕ УВЕДОМЛЕНИЯ ==========
function showFloatingNotification(title, message, icon = "👑", duration = 3000) {
    // Создаём контейнер если его нет
    let container = document.getElementById("floating-notification-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "floating-notification-container";
        container.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 999999;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }
    
    const notification = document.createElement("div");
    notification.style.cssText = `
        background: linear-gradient(135deg, #2b2b2b 0%, #1a1a1a 100%);
        border: 3px solid #ffcc44;
        border-radius: 16px;
        padding: 12px 24px;
        min-width: 280px;
        max-width: 400px;
        text-align: center;
        box-shadow: 0 8px 25px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,200,0.2);
        animation: notificationSlideIn 0.4s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
        pointer-events: auto;
        backdrop-filter: blur(8px);
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 2rem; animation: notificationIconPulse 0.5s ease;">${icon}</div>
            <div style="text-align: left;">
                <div style="color: #ffcc44; font-weight: bold; font-size: 0.8rem; letter-spacing: 1px;">${title}</div>
                <div style="color: #ffffff; font-weight: bold; font-size: 1rem; margin-top: 4px;">${message}</div>
            </div>
        </div>
    `;
    
    container.appendChild(notification);
    
    // Анимация появления
    setTimeout(() => {
        notification.style.animation = "notificationSlideOut 0.3s ease forwards";
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

function showQueenLevelUpNotification(newLevel) {
    showFloatingNotification(
        "👑 КОРОЛЕВА ПОВЫШЕНА! 👑",
        `Текущий уровень: ${newLevel}/500`,
        "🐝✨",
        2500
    );
}

function showLilyEndNotification() {
    showFloatingNotification(
        "🌸 ЗОЛОТАЯ ЛИЛИЯ ЗАКОНЧИЛАСЬ 🌸",
        "Бонус x3 отключён",
        "⏰",
        2500
    );
}

function showLilyStartNotification() {
    showFloatingNotification(
        "✨ ЗОЛОТАЯ ЛИЛИЯ АКТИВНА! ✨",
        "Бонус x3 на 5 минут!",
        "🌸🔥",
        3000
    );
}

function showAutoClickerWarning() {
    showFloatingNotification(
        "⚠️ ПОДОЗРИТЕЛЬНАЯ АКТИВНОСТЬ ⚠️",
        "Пожалуйста, кликайте в нормальном темпе",
        "🤖❌",
        3000
    );
}

function showAchievementNotification(title, reward) {
    const container = document.getElementById("achievement-toast-container");
    if (!container) return;
    
    const toast = document.createElement("div");
    toast.className = "achievement-toast";
    toast.innerHTML = `
        <div class="achievement-toast-icon">🏆</div>
        <div class="achievement-toast-content">
            <div class="achievement-toast-title">✨ ДОСТИЖЕНИЕ ОТКРЫТО! ✨</div>
            <div class="achievement-toast-name">${title}</div>
            <div class="achievement-toast-reward">+${reward} мёда</div>
        </div>
    `;
    
    container.appendChild(toast);
    toast.offsetHeight;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// Добавляем CSS анимации в head
function addNotificationStyles() {
    if (document.getElementById("notification-styles")) return;
    
    const style = document.createElement("style");
    style.id = "notification-styles";
    style.textContent = `
        @keyframes notificationSlideIn {
            0% {
                transform: translateY(-100px) scale(0.8);
                opacity: 0;
            }
            60% {
                transform: translateY(10px) scale(1.02);
                opacity: 1;
            }
            100% {
                transform: translateY(0) scale(1);
                opacity: 1;
            }
        }
        
        @keyframes notificationSlideOut {
            0% {
                transform: translateY(0) scale(1);
                opacity: 1;
            }
            100% {
                transform: translateY(-100px) scale(0.8);
                opacity: 0;
            }
        }
        
        @keyframes notificationIconPulse {
            0% { transform: scale(0.5); opacity: 0; }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); opacity: 1; }
        }
        
        .achievement-toast {
            background: linear-gradient(135deg, #2b2b2b 0%, #1a1a1a 100%);
            color: #fff;
            border: 3px solid #ffcc44;
            border-radius: 12px;
            padding: 14px 24px;
            min-width: 320px;
            max-width: 450px;
            text-align: center;
            box-shadow: 0 8px 25px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,200,0.2);
            pointer-events: auto;
            backdrop-filter: blur(4px);
            opacity: 0;
            transform: translateY(-100px) scale(0.8);
            transition: all 0.4s cubic-bezier(0.34, 1.2, 0.64, 1);
            margin-bottom: 10px;
        }
        
        .achievement-toast.show {
            opacity: 1;
            transform: translateY(20px) scale(1);
        }
        
        .achievement-toast.hide {
            opacity: 0;
            transform: translateY(-100px) scale(0.8);
        }
        
        .achievement-toast-icon {
            font-size: 1.8rem;
            display: inline-block;
            margin-right: 12px;
            vertical-align: middle;
            animation: notificationIconPulse 0.5s ease;
        }
        
        .achievement-toast-content {
            display: inline-block;
            vertical-align: middle;
            text-align: left;
        }
        
        .achievement-toast-title {
            color: #ffcc44;
            font-weight: bold;
            font-size: 0.85rem;
            letter-spacing: 1px;
            margin-bottom: 4px;
        }
        
        .achievement-toast-name {
            font-weight: bold;
            font-size: 1rem;
            margin-bottom: 2px;
            color: #ffffff;
        }
        
        .achievement-toast-reward {
            margin-top: 6px;
            font-size: 0.7rem;
            color: #55ff55;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }
        
        .achievement-toast-reward::before {
            content: "🍯";
            font-size: 0.9rem;
        }
    `;
    document.head.appendChild(style);
}

// ========== ОПТИМИЗИРОВАННЫЙ UI ==========
function throttleUpdateUI() {
    if (pendingUIUpdate) return;
    pendingUIUpdate = true;
    requestAnimationFrame(() => {
        updateClickerUI();
        pendingUIUpdate = false;
    });
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
function initClickerGame() {
    addNotificationStyles();
    loadGameProgress();
    
    if (!state || !state.buildings) {
        state = JSON.parse(JSON.stringify(CLICKER_CONFIG.startingState));
        if (!state.unlockedAchievements) state.unlockedAchievements = [];
        if (!state.totalClicks) state.totalClicks = 0;
        if (!state.totalHoneyEarned) state.totalHoneyEarned = 0;
    }
    
    cacheElements();
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

function cacheElements() {
    cachedElements = {
        honey: document.getElementById("ui-honey"),
        hps: document.getElementById("ui-hps"),
        click: document.getElementById("ui-click"),
        queenLvl: document.getElementById("ui-queen-lvl"),
        achCount: document.getElementById("ui-ach-count"),
        currentExp: document.getElementById("ui-current-exp"),
        neededExp: document.getElementById("ui-needed-exp"),
        progressBar: document.getElementById("ui-queen-progress"),
        upgradesBox: document.getElementById("clicker-upgrades-box"),
        shopBox: document.getElementById("clicker-shop-box")
    };
}

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

// ========== ЗАЩИТА ОТ АВТОКЛИКЕРА ==========
function isAutoClickerDetected() {
    const now = Date.now();
    const timeDiff = now - lastClickTime;
    
    if (timeDiff < 5) {
        clickCounter++;
    } else {
        clickCounter = Math.max(0, clickCounter - 1);
    }
    
    lastClickTime = now;
    
    if (clickCounter > 20 && !clickSpamWarning) {
        clickSpamWarning = true;
        setTimeout(() => { clickSpamWarning = false; clickCounter = 0; }, 2000);
        return true;
    }
    
    return false;
}

// ========== ПОЛНЫЙ СБРОС ==========
window.resetClickerGame = function() {
    showFloatingNotification(
        "⚠️ ПОДТВЕРЖДЕНИЕ ⚠️",
        "Вы уверены, что хотите сбросить прогресс?",
        "🔄",
        2000
    );
    
    setTimeout(() => {
        const doubleCheck = confirm("🚨 ВНИМАНИЕ! Вы уверены, что хотите СБРОСИТЬ весь прогресс?\n\nВы потеряете:\n- Весь накопленный мёд\n- Всех купленных пчёл\n- Все улучшения\n- Уровень Королевы\n- Все достижения\n\nЭто действие нельзя отменить!");
        
        if (doubleCheck) {
            localStorage.removeItem("bee_clicker_state_v3");
            localStorage.removeItem("bee_clicker_achievements");
            
            state = JSON.parse(JSON.stringify(CLICKER_CONFIG.startingState));
            if (!state.unlockedAchievements) state.unlockedAchievements = [];
            if (!state.totalClicks) state.totalClicks = 0;
            if (!state.totalHoneyEarned) state.totalHoneyEarned = 0;
            
            if (lilyTimerInterval) {
                clearInterval(lilyTimerInterval);
                lilyTimerInterval = null;
            }
            lilyActive = false;
            lilyTimeLeft = 0;
            clickCounter = 0;
            clickSpamWarning = false;
            
            recalculateStats();
            updateClickerUI();
            renderBuildingsList();
            renderUpgradesList();
            
            showFloatingNotification(
                "✅ ПРОГРЕСС СБРОШЕН ✅",
                "Игра началась заново!",
                "🔄✨",
                3000
            );
            saveGameProgress();
        }
    }, 500);
};

// ========== ЕЖЕСЕКУНДНЫЙ ТИК ==========
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
    throttleUpdateUI();
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
    
    if (isAutoClickerDetected()) {
        if (!clickSpamWarning) {
            showAutoClickerWarning();
            clickSpamWarning = true;
            setTimeout(() => { clickSpamWarning = false; }, 3000);
        }
        return;
    }
    
    let power = state.clickPower;
    if (lilyActive) power *= 3; 

    state.honey += power;
    state.totalHoneyEarned += power;
    state.totalClicks = (state.totalClicks || 0) + 1;

    let expGained = power * 0.5;
    if (state.purchasedUpgrades && state.purchasedUpgrades.includes("upgrade_queen_1")) expGained *= 1.3;
    addQueenExp(expGained);

    if (typeof ClickerAudio !== "undefined") ClickerAudio.playClick();
    
    if (state.totalClicks % 5 === 0 && typeof CLICKER_ACHIEVEMENTS !== "undefined") {
        CLICKER_ACHIEVEMENTS.checkAll(state);
    }
    
    throttleUpdateUI();
    triggerClickAnimation();

    if (e && typeof e.clientX !== 'undefined' && document.querySelectorAll('.honey-drop-particle').length < 30) {
        createHoneyParticles(e.clientX, e.clientY);
    }
}

function createHoneyParticles(x, y) {
    const particleCount = 3;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement("div");
        particle.className = "honey-drop-particle";
        particle.innerText = "✦";
        particle.style.position = "fixed";
        particle.style.left = (x + (Math.random() - 0.5) * 30) + "px";
        particle.style.top = (y + (Math.random() - 0.5) * 30) + "px";
        particle.style.fontSize = "1.3rem";
        particle.style.pointerEvents = "none";
        particle.style.zIndex = "99999";
        particle.style.opacity = "0.8";
        particle.style.animation = "flyOutParticle 0.4s ease-out forwards";
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 400);
    }
}

function triggerClickAnimation() {
    const core = document.getElementById("clicker-core");
    if (core) { 
        core.style.transform = "scale(0.95)"; 
        setTimeout(() => core.style.transform = "scale(1)", 80);
    }
}

// ========== ЗОЛОТАЯ ЛИЛИЯ ==========
function trySpawnGoldenLily() {
    if (lilyActive || document.getElementById("golden-lily-element")) return;
    if (Math.random() > 0.5) return;
    
    const lily = document.createElement("div");
    lily.id = "golden-lily-element"; 
    lily.className = "golden-lily-spawn"; 
    lily.innerText = "🌸✨";
    lily.style.position = "fixed";
    lily.style.left = Math.random() * (window.innerWidth - 100) + "px";
    lily.style.top = Math.random() * (window.innerHeight - 100) + "px";
    lily.style.cursor = "pointer";
    lily.style.zIndex = "99999";
    lily.style.fontSize = "2.5rem";
    lily.onclick = () => { 
        lily.remove(); 
        activateGoldenLilyBoost(); 
    };
    document.body.appendChild(lily);
    setTimeout(() => { 
        if (lily && lily.remove) lily.remove(); 
    }, 10000);
}

function activateGoldenLilyBoost() {
    if (lilyTimerInterval) clearInterval(lilyTimerInterval);
    lilyActive = true; 
    lilyTimeLeft = 300;
    
    const timerZone = document.getElementById("lily-timer-zone");
    if (timerZone) timerZone.style.display = "block";
    
    if (typeof ClickerAudio !== "undefined") ClickerAudio.playLevelUp();
    showLilyStartNotification();
    
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
            showLilyEndNotification();
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
        showFloatingNotification(
            "✨ УЛУЧШЕНИЕ КУПЛЕНО! ✨",
            upg.name,
            "🛒",
            2000
        );
    } else { 
        showFloatingNotification(
            "❌ НЕ ХВАТАЕТ МЁДА ❌",
            `Нужно ещё ${ClickerUtils.formatNumber(upg.price - state.honey)} л`,
            "🍯",
            2000
        );
    }
};

function renderUpgradesList() {
    const box = cachedElements.upgradesBox || document.getElementById("clicker-upgrades-box");
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
    
    if (state.queenExp >= requiredExp && state.queenLevel < 500) {
        state.queenExp -= requiredExp;
        state.queenLevel++;
        if (typeof ClickerAudio !== "undefined") ClickerAudio.playLevelUp();
        recalculateStats();
        renderBuildingsList();
        renderUpgradesList();
        throttleUpdateUI();
        showQueenLevelUpNotification(state.queenLevel);
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
        const data = CLICKER_CONFIG.buildingsData[bId];
        showFloatingNotification(
            "🐝 НОВАЯ ПЧЕЛА! 🐝",
            `${data.name} нанят! +${data.hps} л/сек`,
            "✨",
            1500
        );
    } else { 
        showFloatingNotification(
            "❌ НЕ ХВАТАЕТ МЁДА ❌",
            `Нужно ещё ${ClickerUtils.formatNumber(cost - state.honey)} л`,
            "🍯",
            2000
        );
    }
};

function getBuildingCost(bId) {
    const count = state.buildings[bId] || 0;
    return Math.floor(CLICKER_CONFIG.buildingsData[bId].basePrice * Math.pow(CLICKER_CONFIG.buildingsData[bId].multiplier, count));
}

function renderBuildingsList() {
    const box = cachedElements.shopBox || document.getElementById("clicker-shop-box");
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
    
    if (cachedElements.honey) cachedElements.honey.innerText = ClickerUtils.formatNumber(state.honey);
    if (cachedElements.hps) cachedElements.hps.innerText = ClickerUtils.formatNumber(state.honeyPerSecond * mult);
    if (cachedElements.click) cachedElements.click.innerText = ClickerUtils.formatNumber(state.clickPower * mult);
    if (cachedElements.queenLvl) cachedElements.queenLvl.innerText = state.queenLevel;
    if (cachedElements.achCount) cachedElements.achCount.innerText = state.unlockedAchievements ? state.unlockedAchievements.length : 0;
    
    const reqExp = CLICKER_CONFIG.getRequiredExpForLevel(state.queenLevel);
    if (cachedElements.currentExp) cachedElements.currentExp.innerText = ClickerUtils.formatNumber(state.queenExp || 0);
    if (cachedElements.neededExp) cachedElements.neededExp.innerText = ClickerUtils.formatNumber(reqExp);
    
    if (cachedElements.progressBar) {
        cachedElements.progressBar.style.width = `${state.queenLevel >= 500 ? 100 : ((state.queenExp || 0) / reqExp) * 100}%`;
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
