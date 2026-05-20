// Система достижений
import { player, spinCount, legendCount, jobCount, gameCompleted, activeModifiers } from './utils.js';
import { updateUI } from './game.js';

export let achievements = {
    firstJob: { name: "💼 ПЕРВАЯ ПОДРАБОТКА", desc: "Выполнить любую подработку", unlocked: false },
    millionaire: { name: "💰 МИЛЛИОНЕР", desc: "Накопить 10000$", unlocked: false },
    churchVisitor: { name: "⛪ ПАЛОМНИК", desc: "Посетить Церковь (16+ уровень)", unlocked: false },
    legendHunter: { name: "⭐ ОХОТНИК ЗА ЛЕГЕНДАМИ", desc: "Поймать 5 легендарок", unlocked: false },
    bossDefeated: { name: "👑 ПОБЕДИТЕЛЬ", desc: "Победить Бога Слотов", unlocked: false },
    hardcorePlayer: { name: "💀 ХАРДКОРЩИК", desc: "Победить босса с активными модификаторами", unlocked: false }
};

export function saveAchievements() { 
    localStorage.setItem("nekoAchievements", JSON.stringify(achievements)); 
}

export function loadAchievements() {
    const saved = localStorage.getItem("nekoAchievements");
    if (saved) { 
        try { 
            const data = JSON.parse(saved); 
            for (let key in data) {
                if (achievements[key]) achievements[key].unlocked = data[key].unlocked;
            }
        } catch(e) {} 
    }
    updateAchievementsUI();
}

export function updateAchievementsUI() {
    const panel = document.getElementById("achievementsPanel");
    if (!panel) return;
    panel.innerHTML = "<h3>🏆 ДОСТИЖЕНИЯ 🏆</h3>";
    for (let key in achievements) {
        const ach = achievements[key];
        const div = document.createElement("div");
        div.className = "achievement-item" + (ach.unlocked ? " unlocked" : "");
        div.innerHTML = `<div class="ach-name">${ach.name}</div><div>${ach.unlocked ? "✅" : "🔒"}</div><div class="ach-desc">${ach.desc}</div>`;
        panel.appendChild(div);
    }
}

export function unlockAchievement(achKey) {
    if (!achievements[achKey].unlocked) {
        achievements[achKey].unlocked = true;
        const msg = document.getElementById("msg");
        const originalMsg = msg.innerHTML;
        msg.innerHTML = `🏆 ДОСТИЖЕНИЕ: ${achievements[achKey].name} 🏆`;
        setTimeout(() => {
            if (msg && !msg.classList.contains("result-win")) {
                msg.innerHTML = originalMsg;
            }
        }, 3000);
        saveAchievements();
        updateAchievementsUI();
    }
}

export function checkAchievements() {
    if (jobCount >= 1 && !achievements.firstJob.unlocked) unlockAchievement("firstJob");
    if (player.money >= 10000 && !achievements.millionaire.unlocked) unlockAchievement("millionaire");
    if (player.level >= 16 && !achievements.churchVisitor.unlocked) unlockAchievement("churchVisitor");
    if (legendCount >= 5 && !achievements.legendHunter.unlocked) unlockAchievement("legendHunter");
    if (player.defeatedBoss && !achievements.bossDefeated.unlocked) unlockAchievement("bossDefeated");
    if (player.defeatedBoss && activeModifiers.length > 0 && !achievements.hardcorePlayer.unlocked) unlockAchievement("hardcorePlayer");
}