// ===================================================================
// МОДУЛЬ ДОСТИЖЕНИЙ: 100 УНИКАЛЬНЫХ АЧИВОК УЛЬЯ
// ===================================================================

const CLICKER_ACHIEVEMENTS = {
    // Список из 100 ачивок, разбитых по категориям для удобства
    db: [],

    init() {
        this.db = [];
        
        // 1. ВЕТКА КЛИКОВ (25 ачивок)
        const clickMilestones = [1, 10, 50, 100, 250, 500, 750, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 15000, 20000, 30000, 40000, 50000, 100000];
        clickMilestones.forEach((m, idx) => {
            this.db.push({
                id: `click_${m}`,
                title: `🎯 Клик-мастер ступени ${idx + 1}`,
                desc: `Кликнуть по заветному горшку руками ${m} раз.`,
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
                desc: `Накопить за всё время больше ${ClickerUtils.formatNumber(m)} литров мёда.`,
                check: (st) => st.totalHoneyEarned >= m,
                reward: 10 * (idx + 1)
            });
        });

        // 3. ВЕТКА КОРОЛЕВЫ (25 ачивок)
        // Идём по уровням Королевы от 2 до 500 лвла
        const queenLevels = [];
        for(let l=5; l<=500; l+=20) queenLevels.push(l); // Генерируем 25 шагов до 500 уровня
        if(queenLevels.length < 25) { while(queenLevels.length < 25) { queenLevels.push(queenLevels[queenLevels.length-1] + 5); } }
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
        // Проверяем общее количество нанятых пчелиных сил
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

    // Функция проверки ачивок в реальном времени
    checkAll(st) {
        if (!st.unlockedAchievements) st.unlockedAchievements = [];
        
        this.db.forEach(ach => {
            // Если ачивка еще не открыта, но условия выполнены
            if (!st.unlockedAchievements.includes(ach.id) && ach.check(st)) {
                st.unlockedAchievements.push(ach.id);
                st.honey += ach.reward; // Выдаем бонусный мед за ачивку
                
                // Выводим красивую лесную плашку уведомления
                this.showNotification(ach.title, ach.desc);
                ClickerAudio.playLevelUp();
            }
        });
    },

    showNotification(title, desc) {
        const container = document.getElementById("achievement-toast-container");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = "achievement-toast";
        toast.innerHTML = `
            <div style="color: #ffff55; font-weight: bold; font-size: 0.9rem;">🏆 ДОСТИЖЕНИЕ ОТКРЫТО!</div>
            <div style="font-weight: bold; margin: 3px 0;">${title}</div>
            <div style="font-size: 0.75rem; color: #aaa;">${desc}</div>
        `;
        container.appendChild(toast);

        // Мягко удаляем плашку через 4 секунды
        setTimeout(() => {
            toast.style.opacity = "0";
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    }
};

// Инициализируем базу данных при подключении скрипта
CLICKER_ACHIEVEMENTS.init();
