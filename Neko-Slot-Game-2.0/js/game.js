// Основная игровая логика
import { FRUITS, STAR, EXP_FOR_LEVEL, THEME_MULTIPLIERS, THEME_UNLOCK, themeOrder } from './config.js';
import { 
    player, spinCount, legendCount, jobCount, gameCompleted, isInJail, isSpinning, isWorking, canSave, bailAmount, activeModifiers,
    getCurrentBet, getCurrentMultiplier, getLocationPenalty, getExpPenalty, getLegendChance,
    setCanSave, setGameCompleted, setIsInJail, setIsSpinning, setIsWorking, setCurrentJob, setCurrentTask,
    incrementSpinCount, incrementLegendCount, incrementJobCount, setPlayer, setActiveModifiers,
    getExpNeededForNextLevel, getTotalExpForNextLevel
} from './utils.js';
import { playSFX, playLevelUpSound, playMusicForLocation } from './audio.js';
import { applyThemeBackground, showLevelUpNotification, showLocationUnlockNotification, hideJobBackground } from './effects.js';
import { checkAchievements } from './achievements.js';
import { applyModifiersToPlayer, updateModifiersUI } from './modifiers.js';
import { sendToJail } from './jail.js';
import { startBossFight, inBossFight } from './boss.js';
import { levelEvents, pendingLevelUpEvent, checkAndShowPendingEvent, showLevelUpEvent, isModalOpen } from './events.js';

// Глобальные переменные для этого модуля
let pendingEventLevel = null;

export function saveGame() { 
    if (!canSave) return; 
    localStorage.setItem("nekoSlotSave", JSON.stringify({ 
        player, spinCount, legendCount, jobCount, activeModifiers, gameCompleted, isInJail, bailAmount 
    })); 
}

export function loadGame() {
    const saved = localStorage.getItem("nekoSlotSave");
    if (saved) {
        try {
            const data = JSON.parse(saved);
            Object.assign(player, data.player);
            spinCount = data.spinCount || 0;
            legendCount = data.legendCount || 0;
            jobCount = data.jobCount || 0;
            activeModifiers.length = 0;
            if (data.activeModifiers) activeModifiers.push(...data.activeModifiers);
            setGameCompleted(data.gameCompleted || false);
            setIsInJail(data.isInJail || false);
            bailAmount = data.bailAmount || 120;
            
            if (isInJail) { 
                const jailPanel = document.getElementById("jailPanel");
                const spinBtn = document.getElementById("spinBtn");
                const jobBtn = document.getElementById("jobBtn");
                if (jailPanel) jailPanel.style.display = "block"; 
                if (spinBtn) spinBtn.disabled = true; 
                if (jobBtn) jobBtn.disabled = false; 
            }
            applyModifiersToPlayer(player);
            updateModifiersUI();
            updateUI();
        } catch(e) {
            console.error("Load game error:", e);
        }
    }
}

export function resetGameState() {
    // Сброс состояния игрока
    player.level = 1;
    player.money = 200;
    player.exp = 0;
    player.hasAmulet = false;
    player.hasCursedCoin = false;
    player.defeatedBoss = false;
    player.currentTheme = "forest";
    player.legendDisabled = false;
    player.badReputation = false;
    player.smallWins = false;
    player.highRisk = false;
    
    // Сброс глобальных переменных
    spinCount = 0;
    legendCount = 0;
    jobCount = 0;
    setGameCompleted(false);
    setIsInJail(false);
    bailAmount = 120;
    setIsSpinning(false);
    setIsWorking(false);
    setCanSave(true);
    
    // Сброс модификаторов
    activeModifiers.length = 0;
}

export function updateUI() {
    const moneySpan = document.getElementById("money");
    if (moneySpan) moneySpan.innerText = Math.floor(player.money);
    
    const levelSpan = document.getElementById("level");
    if (levelSpan) levelSpan.innerText = player.level;
    
    updateBetUI();
    
    if (player.level >= 20) {
        const tooltip = document.getElementById("tooltipText");
        if (tooltip) tooltip.innerHTML = "🏆 МАКСИМАЛЬНЫЙ УРОВЕНЬ! 🏆";
    } else { 
        const current = getExpNeededForNextLevel();
        const need = getTotalExpForNextLevel();
        const tooltip = document.getElementById("tooltipText");
        if (tooltip) tooltip.innerHTML = `📊 ${current} / ${need} XP до ${player.level+1} уровня`; 
    }
    
    const spinBtn = document.getElementById("spinBtn");
    if (spinBtn) {
        if (!isWorking && !isInJail && !isSpinning) {
            spinBtn.disabled = player.money < getCurrentBet();
        }
    }
    
    const jobBtn = document.getElementById("jobBtn");
    if (jobBtn && isInJail) jobBtn.disabled = false;
    
    updateThemeButtonsWithLock();
    
    if (player.level >= 20 && !player.defeatedBoss && !inBossFight) {
        startBossFight();
    }
}

export function updateBetUI() { 
    const bet = getCurrentBet(); 
    const betAmountSpan = document.getElementById("betAmount");
    const spinBetSpan = document.getElementById("spinBet");
    if (betAmountSpan) betAmountSpan.innerText = bet; 
    if (spinBetSpan) spinBetSpan.innerText = bet; 
}

export function updateThemeButtonsWithLock() {
    const currentIndex = themeOrder.indexOf(player.currentTheme);
    const themeBtns = document.querySelectorAll(".theme-btn");
    
    const names = { 
        forest: "🌲 Лес (x1)", 
        cyberpunk: "💜 Киберпанк (x1.5)", 
        space: "🚀 Космос (x2)", 
        church: "⛪ Церковь (x2.5)" 
    };
    
    themeBtns.forEach(btn => {
        const theme = btn.dataset.theme;
        const requiredLevel = THEME_UNLOCK[theme];
        const isUnlocked = player.level >= requiredLevel;
        const themeIndex = themeOrder.indexOf(theme);
        const isPastTheme = themeIndex < currentIndex && theme !== player.currentTheme;
        
        if (isPastTheme) {
            btn.classList.add("permanently-locked");
            btn.classList.remove("locked", "active");
            btn.innerHTML = names[theme] + " ❌";
        } else if (isUnlocked && theme === player.currentTheme) {
            btn.classList.remove("locked", "permanently-locked");
            btn.classList.add("active");
            btn.innerHTML = names[theme];
        } else if (isUnlocked && themeIndex > currentIndex) {
            btn.classList.remove("locked", "permanently-locked");
            btn.classList.remove("active");
            btn.innerHTML = names[theme] + " 🔓";
        } else {
            btn.classList.add("locked");
            btn.classList.remove("permanently-locked", "active");
            btn.innerHTML = names[theme] + " 🔒";
        }
    });
}

export function applyTheme(theme) {
    if (!canSave) return;
    if (player.level < THEME_UNLOCK[theme]) return;
    document.body.className = `theme-${theme}`;
    applyThemeBackground(theme);
    player.currentTheme = theme;
    playMusicForLocation(theme);
    saveGame();
    checkAchievements();
    updateThemeButtonsWithLock();
    
    const themeNames = { forest: "Лес", cyberpunk: "Киберпанк", space: "Космос", church: "Церковь" };
    const msg = document.getElementById("msg");
    if (msg) {
        msg.innerHTML = `✨ Переход в ${themeNames[theme]}! Множитель x${THEME_MULTIPLIERS[theme]} ✨`;
        setTimeout(() => { 
            if (!msg.classList.contains("result-win")) { 
                msg.innerHTML = `${theme === "forest" ? "🌲 Лес" : theme === "cyberpunk" ? "💜 Киберпанк" : theme === "space" ? "🚀 Космос" : "⛪ Церковь"} • Множитель x${THEME_MULTIPLIERS[theme]}`; 
            } 
        }, 3000);
    }
    updateUI();
}

export function addExp(amount) {
    if (player.level >= 20) return;
    let multiplier = getCurrentMultiplier();
    if (player.smallWins) multiplier = Math.max(0.5, multiplier - 0.3);
    multiplier = multiplier * getExpPenalty();
    let finalAmount = Math.floor(amount * multiplier);
    player.exp += finalAmount;
    let leveled = false;
    
    while (player.level < 20 && player.exp >= EXP_FOR_LEVEL[player.level+1]) {
        player.level++;
        player.money += 100 * multiplier;
        leveled = true;
        updateUI();
        playLevelUpSound();
        showLevelUpNotification(player.level);
        
        // Проверяем открытие новых локаций
        if (player.level === 6 && player.currentTheme !== "cyberpunk") {
            showLocationUnlockNotification("cyberpunk", THEME_MULTIPLIERS.cyberpunk, () => {
                applyTheme("cyberpunk");
                updateThemeButtonsWithLock();
            });
        }
        if (player.level === 11 && player.currentTheme !== "space") {
            showLocationUnlockNotification("space", THEME_MULTIPLIERS.space, () => {
                applyTheme("space");
                updateThemeButtonsWithLock();
            });
        }
        if (player.level === 16 && player.currentTheme !== "church") {
            showLocationUnlockNotification("church", THEME_MULTIPLIERS.church, () => {
                applyTheme("church");
                updateThemeButtonsWithLock();
            });
        }
        
        // События уровней
        if (player.level >= 2 && player.level <= 18 && levelEvents && levelEvents[player.level]) {
            pendingEventLevel = player.level;
        }
    }
    updateUI();
    if (leveled) { 
        saveGame(); 
        checkAchievements(); 
    }
    
    // Проверяем отложенные события
    if (pendingEventLevel && !isModalOpen) {
        setTimeout(() => {
            if (typeof showLevelUpEvent === 'function' && !isModalOpen) {
                showLevelUpEvent(pendingEventLevel);
                pendingEventLevel = null;
            }
        }, 100);
    }
}

export function spin() {
    if (isInJail) { 
        const msg = document.getElementById("msg");
        if (msg) msg.innerHTML = "🔒 Ты в тюрьме! Заплати залог или работай! 🔒"; 
        return; 
    }
    if (isSpinning) { return; }
    
    const CURRENT_BET = getCurrentBet();
    if (player.money < CURRENT_BET) { 
        const msg = document.getElementById("msg");
        if (msg) {
            msg.classList.add("result-lose"); 
            msg.innerText = "❌ Нет денег! Жми ПОДРАБОТАТЬ!"; 
            setTimeout(() => msg.classList.remove("result-lose"), 2000); 
        }
        return; 
    }
    
    setIsSpinning(true);
    const spinBtn = document.getElementById("spinBtn");
    if (spinBtn) spinBtn.disabled = true;
    playSFX('win_slot');
    player.money -= CURRENT_BET;
    updateUI();
    
    const r = Math.random();
    let legChance = getLegendChance();
    let row;
    
    if (r < legChance && !player.legendDisabled) {
        row = [STAR, STAR, STAR];
    } else if (r < 0.17 + (player.hasCursedCoin ? 0.03 : 0)) { 
        let f = FRUITS[Math.floor(Math.random()*FRUITS.length)]; 
        row = [f, f, f]; 
    } else { 
        do { 
            row = [
                FRUITS[Math.floor(Math.random()*FRUITS.length)], 
                FRUITS[Math.floor(Math.random()*FRUITS.length)], 
                FRUITS[Math.floor(Math.random()*FRUITS.length)]
            ]; 
        } while(row[0]===row[1] && row[1]===row[2]); 
    }
    
    const sCells = [document.getElementById("s0"), document.getElementById("s1"), document.getElementById("s2")];
    const slotAnimationCheckbox = document.getElementById("slotAnimation");
    const slotAnimation = slotAnimationCheckbox ? slotAnimationCheckbox.checked !== false : true;
    
    if (slotAnimation) {
        sCells.forEach(s => {
            if (s) s.classList.add("spinning");
        });
    }
    
    setTimeout(() => { 
        sCells.forEach((s, i) => {
            if (s) s.innerText = row[i];
        });
        if (slotAnimation) {
            sCells.forEach(s => {
                if (s) s.classList.remove("spinning");
            });
        }
    }, 120);
    
    let multiplier = getCurrentMultiplier();
    if (player.smallWins) multiplier = Math.max(0.5, multiplier - 0.3);
    multiplier = multiplier * getLocationPenalty();
    
    const isWin = row[0]===row[1] && row[1]===row[2];
    let win = 0, expG = 0;
    incrementSpinCount();
    const msg = document.getElementById("msg");
    
    if (isWin) {
        if (row[0] === STAR) { 
            win = Math.floor((CURRENT_BET * 4 + 50) * multiplier); 
            expG = Math.floor(50 * multiplier);
            incrementLegendCount();
            if (msg) {
                msg.classList.add("result-legend"); 
                msg.innerHTML = `🌟🌟🌟 ЛЕГЕНДАРКА! +${win}$, +${expG} XP 🌟🌟🌟`; 
                setTimeout(() => msg.classList.remove("result-legend"), 2800);
            }
        } else { 
            const multi = { "🍒":1.5, "🍋":1.5, "🍊":1.5, "🍉":1.8, "🍎":2.0, "🍓":1.8, "🍑":1.6 }[row[0]] || 1.5; 
            win = Math.floor(CURRENT_BET * multi * multiplier); 
            expG = Math.floor(25 * multiplier);
            if (msg) {
                msg.classList.add("result-win"); 
                msg.innerHTML = `🎉 ПОБЕДА! +${win}$, +${expG} XP 🎉`; 
                setTimeout(() => msg.classList.remove("result-win"), 2000);
            }
        }
        player.money += win;
    } else { 
        expG = Math.floor(8 * multiplier);
        if (msg) {
            msg.classList.add("result-lose"); 
            msg.innerHTML = `💔 ПРОИГРЫШ! -${CURRENT_BET}$, +${expG} XP 💔`; 
            setTimeout(() => msg.classList.remove("result-lose"), 1500);
        }
    }
    
    addExp(expG);
    updateUI();
    saveGame();
    checkAchievements();
    
    setTimeout(() => { 
        setIsSpinning(false); 
        if (!isWorking && !isInJail) {
            const spinBtnAfter = document.getElementById("spinBtn");
            if (spinBtnAfter) spinBtnAfter.disabled = false;
        }
    }, 500);
}

export function endWork() {
    setIsWorking(false);
    hideJobBackground();
    
    const jobHeader = document.getElementById("jobHeader");
    const jobQuestion = document.getElementById("jobQuestion");
    const jobChoices = document.getElementById("jobChoices");
    const jobExitBtn = document.getElementById("jobExitBtn");
    const jobBtn = document.getElementById("jobBtn");
    
    if (jobHeader) jobHeader.innerHTML = "🍺 ЖМИ ПОДРАБОТАТЬ";
    if (jobQuestion) jobQuestion.innerHTML = "Нет денег? Иди работай!";
    if (jobChoices) jobChoices.innerHTML = "";
    if (jobExitBtn) jobExitBtn.style.display = "none";
    if (jobBtn) jobBtn.style.display = "inline-block";
    
    if (isInJail) {
        const spinBtn = document.getElementById("spinBtn");
        if (spinBtn) spinBtn.disabled = true;
        if (jobBtn) jobBtn.disabled = false;
    } else {
        if (!isInJail && !isSpinning) {
            const spinBtn = document.getElementById("spinBtn");
            if (spinBtn) spinBtn.disabled = false;
        }
        if (jobBtn) jobBtn.disabled = false;
    }
    updateUI();
}
