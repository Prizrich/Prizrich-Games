const clickerGame = {
    state: null,
    saveInterval: null,
    tickInterval: null,

    init() {
        this.state = this.loadGameProgress() || JSON.parse(JSON.stringify(CLICKER_CONFIG.startingState));
        this.recalculateStats();
        this.renderBuildingsList();
        this.renderUpgradesList();
        this.updateUI();
        
        if (this.tickInterval) clearInterval(this.tickInterval);
        this.tickInterval = setInterval(() => this.runGameTick(), 1000);
        
        if (this.saveInterval) clearInterval(this.saveInterval);
        this.saveInterval = setInterval(() => this.saveGameProgress(), 5000);
        
        this.setupClickHandler();
    },

    setupClickHandler() {
        const pot = document.getElementById("clicker-core");
        if (pot) {
            pot.removeEventListener("click", this.clickHandler);
            this.clickHandler = (e) => this.handleHoneyClick(e);
            pot.addEventListener("click", this.clickHandler);
        }
    },

    loadGameProgress() {
        try {
            const saved = localStorage.getItem("beeClickerSave");
            if (saved) {
                const data = JSON.parse(saved);
                data.unlockedAchievements = data.unlockedAchievements || [];
                return data;
            }
        } catch (e) {}
        return null;
    },

    saveGameProgress() {
        try {
            localStorage.setItem("beeClickerSave", JSON.stringify(this.state));
        } catch (e) {}
    },

    resetGame() {
        if (!confirm("Точно сбросить весь прогресс улья?")) return;
        this.state = JSON.parse(JSON.stringify(CLICKER_CONFIG.startingState));
        this.state.unlockedAchievements = [];
        this.recalculateStats();
        this.renderBuildingsList();
        this.renderUpgradesList();
        this.updateUI();
        this.saveGameProgress();
    },

    recalculateStats() {
        let hps = 0;
        for (let key in this.state.buildings) {
            const data = CLICKER_CONFIG.buildingsData[key];
            const count = this.state.buildings[key] || 0;
            let production = data.hps * count;
            if (this.state.purchasedUpgrades.includes("upgrade_worker_1") && key === "worker") {
                production *= 2;
            }
            if (this.state.purchasedUpgrades.includes("upgrade_forager_1") && key === "forager") {
                production *= 2;
            }
            hps += production;
        }
        
        const queenBonus = CLICKER_CONFIG.getQueenBonus(this.state.queenLevel);
        this.state.honeyPerSecond = hps * queenBonus.productionMultiplier;
        this.state.clickPower = 1 + queenBonus.clickBonus;
        
        if (this.state.purchasedUpgrades.includes("upgrade_click_1")) {
            this.state.clickPower += 3;
        }
        if (this.state.purchasedUpgrades.includes("upgrade_click_2")) {
            this.state.clickPower += 15;
        }
    },

    getExpMultiplier() {
        return this.state.purchasedUpgrades.includes("upgrade_queen_1") ? 1.3 : 1;
    },

    gainQueenExp(amount) {
        const multi = this.getExpMultiplier();
        this.state.queenExp += amount * multi;
        const needed = CLICKER_CONFIG.getRequiredExpForLevel(this.state.queenLevel);
        while (this.state.queenExp >= needed && this.state.queenLevel < 500) {
            this.state.queenExp -= needed;
            this.state.queenLevel++;
            this.recalculateStats();
            ClickerAudio.playLevelUp();
            this.updateUI();
        }
        if (this.state.queenLevel >= 500) {
            this.state.queenExp = 0;
        }
    },

    handleHoneyClick(e) {
        const honey = this.state.clickPower;
        this.state.honey += honey;
        this.state.totalHoneyEarned += honey;
        this.state.totalClicks++;
        
        this.gainQueenExp(honey * 0.1);
        
        ClickerAudio.playClick();
        this.spawnHoneyParticles(e);
        this.updateUI();
        CLICKER_ACHIEVEMENTS.checkAll(this.state);
    },

    spawnHoneyParticles(e) {
        const count = Math.min(8, 3 + Math.floor(this.state.clickPower / 2));
        const container = document.body;
        for (let i = 0; i < count; i++) {
            const particle = document.createElement("div");
            particle.className = "honey-drop-particle";
            particle.textContent = "✦";
            
            const rect = e.target.getBoundingClientRect();
            const x = e.clientX || rect.left + rect.width / 2;
            const y = e.clientY || rect.top + rect.height / 2;
            
            const angle = Math.random() * 2 * Math.PI;
            const distance = 40 + Math.random() * 100;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance - 50;
            
            particle.style.left = (x - 15) + "px";
            particle.style.top = (y - 15) + "px";
            particle.style.setProperty("--dx", dx + "px");
            particle.style.setProperty("--dy", dy + "px");
            
            container.appendChild(particle);
            setTimeout(() => {
                if (particle.parentNode) particle.remove();
            }, 700);
        }
    },

    runGameTick() {
        this.state.honey += this.state.honeyPerSecond;
        this.state.totalHoneyEarned += this.state.honeyPerSecond;
        this.gainQueenExp(this.state.honeyPerSecond * 0.02);
        this.updateUI();
        CLICKER_ACHIEVEMENTS.checkAll(this.state);
    },

    buyBuilding(key) {
        const data = CLICKER_CONFIG.buildingsData[key];
        if (!data) return false;
        
        const count = this.state.buildings[key] || 0;
        const price = Math.floor(data.basePrice * Math.pow(data.multiplier, count));
        
        if (this.state.honey < price) return false;
        
        this.state.honey -= price;
        this.state.buildings[key] = count + 1;
        this.recalculateStats();
        this.renderBuildingsList();
        this.updateUI();
        ClickerAudio.playBuy();
        return true;
    },

    buyUpgrade(key) {
        const data = CLICKER_CONFIG.upgradesData[key];
        if (!data) return false;
        if (this.state.purchasedUpgrades.includes(key)) return false;
        if (this.state.honey < data.price) return false;
        
        this.state.honey -= data.price;
        this.state.purchasedUpgrades.push(key);
        this.recalculateStats();
        this.renderUpgradesList();
        this.updateUI();
        ClickerAudio.playBuy();
        return true;
    },

    renderBuildingsList() {
        const container = document.getElementById("clicker-shop-box");
        if (!container) return;
        container.innerHTML = "";
        
        for (let key in CLICKER_CONFIG.buildingsData) {
            const data = CLICKER_CONFIG.buildingsData[key];
            const count = this.state.buildings[key] || 0;
            const price = Math.floor(data.basePrice * Math.pow(data.multiplier, count));
            
            const card = document.createElement("div");
            card.className = "shop-item-card";
            card.innerHTML = `
                <div class="shop-item-info">
                    <div class="shop-item-name">${data.name} (${count})</div>
                    <div class="shop-item-desc">💰 ${ClickerUtils.formatNumber(price)} л</div>
                </div>
                <button class="buy-bee-btn" data-building="${key}">🐝 Нанять</button>
            `;
            
            const btn = card.querySelector("button");
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                this.buyBuilding(key);
            });
            
            container.appendChild(card);
        }
    },

    renderUpgradesList() {
        const container = document.getElementById("clicker-upgrades-box");
        if (!container) return;
        container.innerHTML = "";
        
        for (let key in CLICKER_CONFIG.upgradesData) {
            const data = CLICKER_CONFIG.upgradesData[key];
            const owned = this.state.purchasedUpgrades.includes(key);
            
            const card = document.createElement("div");
            card.className = "shop-item-card";
            card.style.opacity = owned ? "0.6" : "1";
            card.innerHTML = `
                <div class="shop-item-info">
                    <div class="shop-item-name">${data.name} ${owned ? "✅" : ""}</div>
                    <div class="shop-item-desc">${data.desc}</div>
                    <div class="shop-item-desc">💰 ${ClickerUtils.formatNumber(data.price)} л</div>
                </div>
                <button class="buy-bee-btn" data-upgrade="${key}" ${owned ? "disabled" : ""}>
                    ${owned ? "Куплено" : "🔧 Улучшить"}
                </button>
            `;
            
            const btn = card.querySelector("button");
            if (!owned) {
                btn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    this.buyUpgrade(key);
                });
            }
            
            container.appendChild(card);
        }
    },

    updateUI() {
        const state = this.state;
        document.getElementById("ui-queen-lvl").textContent = state.queenLevel;
        document.getElementById("ui-honey").textContent = ClickerUtils.formatNumber(Math.floor(state.honey));
        document.getElementById("ui-hps").textContent = ClickerUtils.formatNumber(state.honeyPerSecond);
        document.getElementById("ui-click").textContent = ClickerUtils.formatNumber(state.clickPower);
        
        const needed = CLICKER_CONFIG.getRequiredExpForLevel(state.queenLevel);
        document.getElementById("ui-current-exp").textContent = ClickerUtils.formatNumber(state.queenExp);
        document.getElementById("ui-needed-exp").textContent = needed === Infinity ? "∞" : ClickerUtils.formatNumber(needed);
        
        const progress = needed === Infinity ? 100 : Math.min(100, (state.queenExp / needed) * 100);
        document.getElementById("ui-queen-progress").style.width = progress + "%";
        
        const achCount = state.unlockedAchievements ? state.unlockedAchievements.length : 0;
        document.getElementById("ui-ach-count").textContent = achCount;
        document.getElementById("ui-modal-ach-count").textContent = achCount;
    },

    openAchievementsModal() {
        const modal = document.getElementById("achievements-modal");
        if (!modal) return;
        modal.style.display = "flex";
        this.renderAchievementsList();
    },

    closeAchievementsModal() {
        document.getElementById("achievements-modal").style.display = "none";
    },

    renderAchievementsList() {
        const container = document.getElementById("modal-achievements-list");
        if (!container) return;
        container.innerHTML = "";
        
        const unlocked = this.state.unlockedAchievements || [];
        CLICKER_ACHIEVEMENTS.db.forEach(ach => {
            const isUnlocked = unlocked.includes(ach.id);
            const card = document.createElement("div");
            card.className = "ach-list-card" + (isUnlocked ? " unlocked" : "");
            card.innerHTML = `
                <div class="ach-list-title">${isUnlocked ? "✅ " : "🔒 "} ${ach.title}</div>
                <div class="ach-list-desc">${ach.desc}</div>
                <div class="ach-list-reward">+${ach.reward} мёда</div>
            `;
            container.appendChild(card);
        });
    },

    startGameplayLayout() {
        document.getElementById("app-main-menu").style.display = "none";
        document.getElementById("app-game-layout").style.display = "grid";
        
        const slider = document.getElementById("music-volume-slider");
        if (slider) {
            ClickerAudio.setVolume(parseInt(slider.value));
        }
        ClickerAudio.startMusicLoop();
        
        this.renderBuildingsList();
        this.renderUpgradesList();
        this.updateUI();
    },

    exitToMainMenu() {
        this.saveGameProgress();
        ClickerAudio.stopMusicLoop();
        document.getElementById("app-game-layout").style.display = "none";
        document.getElementById("app-main-menu").style.display = "flex";
    }
};

window.startGameplayLayout = () => clickerGame.startGameplayLayout();
window.exitToMainMenu = () => clickerGame.exitToMainMenu();
window.resetClickerGame = () => clickerGame.resetGame();
window.openAchievementsModal = () => clickerGame.openAchievementsModal();
window.closeAchievementsModal = () => clickerGame.closeAchievementsModal();
window.nextMusicTrack = () => ClickerAudio.nextTrack();
window.updateMusicVolume = () => {
    const slider = document.getElementById("music-volume-slider");
    if (slider) ClickerAudio.setVolume(parseInt(slider.value));
};

document.addEventListener("DOMContentLoaded", () => {
    clickerGame.init();
});
