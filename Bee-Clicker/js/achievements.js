const CLICKER_ACHIEVEMENTS = {
    db: [],
    initialized: false,

    init() {
        if (this.initialized) return;
        this.db = [];
        
        const clickMilestones = [1, 10, 50, 100, 250, 500, 750, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 15000, 20000, 30000, 40000, 50000, 100000];
        clickMilestones.forEach((m, idx) => {
            this.db.push({
                id: `click_${m}`,
                title: `🎯 Клик-мастер ${idx + 1}`,
                desc: `Кликнуть ${ClickerUtils.formatNumber(m)} раз`,
                check: (st) => st.totalClicks >= m,
                reward: 5 * (idx + 1)
            });
        });

        const honeyMilestones = [10, 100, 500, 1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 750000, 1000000, 2500000, 5000000, 10000000, 25000000, 50000000, 100000000, 250000000, 500000000, 1000000000, 5000000000, 10000000000, 50000000000];
        honeyMilestones.forEach((m, idx) => {
            this.db.push({
                id: `honey_${idx}`,
                title: `🍯 Медовый магнат ${idx + 1}`,
                desc: `Накопить ${ClickerUtils.formatNumber(m)} л мёда`,
                check: (st) => st.totalHoneyEarned >= m,
                reward: 10 * (idx + 1)
            });
        });

        const queenLevels = [];
        for (let l = 5; l <= 500; l += 20) {
            queenLevels.push(l);
        }
        while (queenLevels.length < 25) {
            const last = queenLevels[queenLevels.length - 1] || 5;
            queenLevels.push(last + 5);
        }
        queenLevels.slice(0, 25).forEach((lvl, idx) => {
            this.db.push({
                id: `queen_${lvl}`,
                title: `👑 Эволюция Монархии ${idx + 1}`,
                desc: `Королева ${lvl} уровня`,
                check: (st) => st.queenLevel >= lvl,
                reward: 20 * (idx + 1)
            });
        });

        const beeMilestones = [1, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140, 160, 180, 200, 250, 300, 400, 500, 750, 1000];
        beeMilestones.forEach((m, idx) => {
            this.db.push({
                id: `bees_${m}`,
                title: `🐝 Пчелиный Рой ${idx + 1}`,
                desc: `Нанять ${m} пчёл`,
                check: (st) => {
                    let total = 0;
                    for (let key in st.buildings) {
                        total += st.buildings[key] || 0;
                    }
                    return total >= m;
                },
                reward: 15 * (idx + 1)
            });
        });

        this.initialized = true;
    },

    checkAll(st) {
        if (!st) return;
        if (!st.unlockedAchievements) st.unlockedAchievements = [];
        
        const unlockedCount = st.unlockedAchievements.length;
        
        this.db.forEach(ach => {
            if (!st.unlockedAchievements.includes(ach.id) && ach.check(st)) {
                st.unlockedAchievements.push(ach.id);
                st.honey = (st.honey || 0) + ach.reward;
                this.showNotification(ach.title, ach.desc, ach.reward);
                
                if (typeof ClickerAudio !== "undefined" && ClickerAudio.playLevelUp) {
                    ClickerAudio.playLevelUp();
                }
            }
        });
        
        if (st.unlockedAchievements.length > unlockedCount) {
            this.updateUI();
        }
    },

    showNotification(title, desc, reward) {
        const container = document.getElementById("achievement-toast-container");
        if (!container) {
            console.warn("Контейнер для уведомлений не найден");
            return;
        }

        const maxToasts = 5;
        while (container.children.length >= maxToasts) {
            container.firstChild.remove();
        }

        const toast = document.createElement("div");
        toast.className = "achievement-toast";
        toast.style.cssText = `
            background: #2b2b2b;
            color: #fff;
            border: 3px solid #ffff55;
            padding: 12px 18px;
            border-radius: 4px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.4);
            min-width: 260px;
            max-width: 100%;
            box-sizing: border-box;
            animation: slideInAch 0.4s ease-out forwards;
            pointer-events: auto;
        `;
        
        toast.innerHTML = `
            <div style="color: #ffff55; font-weight: bold; font-size: 0.9rem;">🏆 ДОСТИЖЕНИЕ ОТКРЫТО!</div>
            <div style="font-weight: bold; margin: 3px 0; font-size: 1rem;">${title}</div>
            <div style="font-size: 0.75rem; color: #aaa;">${desc}</div>
            <div style="font-size: 0.8rem; color: #55ff55; margin-top: 4px;">+${reward} мёда</div>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.transition = "all 0.5s ease";
            toast.style.opacity = "0";
            toast.style.transform = "translateX(50px)";
            setTimeout(() => {
                if (toast.parentNode) toast.remove();
            }, 500);
        }, 4500);
    },

    updateUI() {
        const game = window.clickerGame;
        if (game && typeof game.updateUI === "function") {
            game.updateUI();
        }
    },

    getUnlockedCount(st) {
        if (!st || !st.unlockedAchievements) return 0;
        return st.unlockedAchievements.length;
    },

    getTotalCount() {
        return this.db.length;
    }
};

if (typeof CLICKER_ACHIEVEMENTS.init === "function") {
    CLICKER_ACHIEVEMENTS.init();
}
