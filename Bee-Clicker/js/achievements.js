// ===================================================================
// МОДУЛЬ ДОСТИЖЕНИЙ: 100 УНИКАЛЬНЫХ АЧИВОК УЛЬЯ
// ===================================================================

const CLICKER_ACHIEVEMENTS = {
    db: [],
    notificationQueue: [],
    isShowingNotification: false,

    init() {
        this.db = [];
        
        // 1. ВЕТКА КЛИКОВ (25 ачивок)
        const clickMilestones = [1, 10, 50, 100, 250, 500, 750, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 15000, 20000, 30000, 40000, 50000, 100000];
        clickMilestones.forEach((m, idx) => {
            this.db.push({
                id: `click_${m}`,
                title: `🎯 Клик-мастер ступени ${idx + 1}`,
                desc: `Кликнуть по заветному горшку руками ${m.toLocaleString()} раз.`,
                check: (st) => st.totalClicks >= m,
                reward: 5 * (idx + 1)
            });
        });

        // 2. ВЕТКА МЁДА (25 ачивок)
        const honeyMilestones = [10, 100, 500, 1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 750000, 1000000, 2500000, 5000000, 10000000, 25000000, 50000000, 100000000, 250000000, 500000000, 1000000000, 5000000000, 10000000000, 50000000000];
        honeyMilestones.forEach((m, idx) => {
            this.db.push({
                id: `honey_${idx}`,
                title: `🍯 Медовый магнат ступени ${idx + 1}`,
                desc: `Накопить за всё время больше ${this.formatNumber(m)} литров мёда.`,
                check: (st) => st.totalHoneyEarned >= m,
                reward: 10 * (idx + 1)
            });
        });

        // 3. ВЕТКА КОРОЛЕВЫ (25 ачивок)
        const queenLevels = [];
        for(let l=5; l<=500; l+=20) queenLevels.push(l);
        if(queenLevels.length < 25) {
            while(queenLevels.length < 25) {
                queenLevels.push(queenLevels[queenLevels.length-1] + 5);
            }
        }
        queenLevels.forEach((lvl, idx) => {
            this.db.push({
                id: `queen_${lvl}`,
                title: `👑 Эволюция Монархии ступени ${idx + 1}`,
                desc: `Прокачать Королеву улья до хардкорного ${lvl} уровня.`,
                check: (st) => st.queenLevel >= lvl,
                reward: 20 * (idx + 1)
            });
        });

        // 4. ВЕТКА ПОСТРОЕК / НАЙМА (25 ачивок)
        const beeMilestones = [1, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140, 160, 180, 200, 250, 300, 400, 500, 750, 1000];
        beeMilestones.forEach((m, idx) => {
            this.db.push({
                id: `bees_${m}`,
                title: `🐝 Пчелиный Рой ступени ${idx + 1}`,
                desc: `Нанять в сумме более ${m} рабочих пчёл в свой улей.`,
                check: (st) => {
                    let total = 0;
                    for(let key in st.buildings) { total += st.buildings[key]; }
                    return total >= m;
                },
                reward: 15 * (idx + 1)
            });
        });
    },

    formatNumber(num) {
        if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return num.toString();
    },

    // Проверка ачивок
    checkAll(st) {
        if (!st.unlockedAchievements) st.unlockedAchievements = [];
        
        this.db.forEach(ach => {
            if (!st.unlockedAchievements.includes(ach.id) && ach.check(st)) {
                st.unlockedAchievements.push(ach.id);
                st.honey += ach.reward;
                
                this.showNotification(ach.title, ach.desc, ach.reward);
                if (typeof ClickerAudio !== 'undefined' && ClickerAudio.playLevelUp) {
                    ClickerAudio.playLevelUp();
                }
            }
        });
    },

    // Показ уведомления по центру сверху
    showNotification(title, desc, reward) {
        this.notificationQueue.push({ title, desc, reward });
        this.processNotificationQueue();
    },

    processNotificationQueue() {
        if (this.isShowingNotification) return;
        if (this.notificationQueue.length === 0) return;
        
        this.isShowingNotification = true;
        const notif = this.notificationQueue.shift();
        
        const container = document.getElementById("achievement-toast-container");
        if (!container) {
            this.isShowingNotification = false;
            return;
        }

        const toast = document.createElement("div");
        toast.className = "achievement-toast";
        toast.innerHTML = `
            <div class="achievement-toast-icon">🏆</div>
            <div class="achievement-toast-content">
                <div class="achievement-toast-title">✨ ДОСТИЖЕНИЕ ОТКРЫТО! ✨</div>
                <div class="achievement-toast-name">${notif.title}</div>
                <div class="achievement-toast-desc">${notif.desc}</div>
                <div class="achievement-toast-reward">+${notif.reward} мёда</div>
            </div>
        `;
        
        container.appendChild(toast);
        
        // Удаляем уведомление после анимации
        setTimeout(() => {
            toast.remove();
            this.isShowingNotification = false;
            this.processNotificationQueue();
        }, 4500);
    }
};

// Инициализация
CLICKER_ACHIEVEMENTS.init();
