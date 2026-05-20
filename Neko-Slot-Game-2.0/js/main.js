// Главный файл - точка входа
import { FRUITS, THEME_UNLOCK, themeOrder } from './config.js';
import { 
    player, canSave, isWorking, isInJail, isSpinning, gameCompleted, spinCount, legendCount, jobCount, activeModifiers, bailAmount,
    setCanSave, setGameCompleted, setIsInJail, setIsSpinning, setIsWorking, setCurrentJob, setCurrentTask,
    incrementSpinCount, incrementLegendCount, incrementJobCount, setPlayer, setActiveModifiers
} from './utils.js';
import { initAudio, updateMusicVolume, updateSFXVolume, getMusicVolume, getSfxVolume, playMusicForLocation } from './audio.js';
import { applyThemeBackground, effects } from './effects.js';
import { 
    loadPlaythroughCount, updateModifiersSelectorUI, updateModifiersUI, applySelectedModifiers, 
    getCurrentModifierLimit, globalPlaythroughCount, applyModifiersToPlayer 
} from './modifiers.js';
import { loadAchievements, updateAchievementsUI, saveAchievements, achievements } from './achievements.js';
import { payBail } from './jail.js';
import { startBossFight, inBossFight, bossAction, healInBattle, closeBossModalAndRetry, closeBossModal } from './boss.js';
import { startRandomJob } from './jobs.js';
import { checkAndShowPendingEvent, levelEvents, isModalOpen, pendingLevelUpEvent } from './events.js';
import { saveGame, loadGame, updateUI, applyTheme, updateThemeButtonsWithLock, spin, endWork, addExp, resetGameState } from './game.js';

// Глобальные переменные для доступа из HTML
window.isModalOpen = false;
window.pendingLevelUpEvent = null;

// Глобальные функции для доступа из HTML onclick
window.closeModal = function() { 
    document.getElementById("storyModal").style.display = "none";
    window.isModalOpen = false;
    if (window.pendingLevelUpEvent) {
        import('./events.js').then(module => {
            const event = module.levelEvents[window.pendingLevelUpEvent];
            if (event) {
                module.showLevelUpEvent(window.pendingLevelUpEvent);
                window.pendingLevelUpEvent = null;
            }
        });
    }
    if (player.level >= 20 && !player.defeatedBoss && !inBossFight) startBossFight();
};

window.closeBossModalAndRetry = closeBossModalAndRetry;
window.closeBossModal = closeBossModal;
window.healInBattle = healInBattle;
window.bossAction = bossAction;

// Функция для отображения событий уровня
window.showLevelUpEvent = function(level) {
    import('./events.js').then(module => {
        module.showLevelUpEvent(level);
    });
};

// Функции меню
function startGame() {
    document.getElementById("mainMenu").style.display = "none";
    document.getElementById("gameContainer").style.display = "block";
    
    // Запускаем музыку для текущей локации при первом входе
    import('./audio.js').then(module => {
        module.initAudio();
        setTimeout(() => {
            module.playMusicForLocation(player.currentTheme || "forest");
        }, 100);
    });
    
    init();
}

function toggleAchievements() { 
    const panel = document.getElementById("achievementsPanel"); 
    panel.style.display = panel.style.display === "block" ? "none" : "block"; 
    updateAchievementsUI(); 
}

function toggleSettings() { 
    const panel = document.getElementById("settingsPanel"); 
    panel.style.display = panel.style.display === "block" ? "none" : "block"; 
}

function exitToMenu() {
    if (confirm("Выйти в главное меню? Прогресс сохранится.")) {
        saveGame();
        
        // Останавливаем музыку через audio модуль
        import('./audio.js').then(module => {
            module.stopCurrentMusic();
        });
        
        document.getElementById("gameContainer").style.display = "none";
        document.getElementById("mainMenu").style.display = "flex";
        if (gameCompleted) { 
            updateModifiersSelectorUI(); 
            document.getElementById("modifiersSelector").style.display = "block"; 
        }
    }
}

function resetProgress() {
    if (confirm("⚠️ СБРОСИТЬ ВЕСЬ ПРОГРЕСС? Всё начнётся заново!")) {
        localStorage.removeItem("nekoSlotSave");
        localStorage.removeItem("nekoAchievements");
        localStorage.removeItem("nekoPlaythroughCount");
        location.reload();
    }
}
function showPrologue() {
    const modal = document.getElementById("storyModal");
    const modalText = document.getElementById("modalText");
    const modalChoices = document.getElementById("modalChoices");
    modalText.innerHTML = `<p>🐱 <strong>НЕКО-СЛОТ</strong> 🎰</p>
        <p>💰 Старт: 200$ | В лесу ставка 20$, на высоких локациях ставки растут</p>
        <p>⚠️ <strong>НОВОВВЕДЕНИЯ:</strong></p>
        <p>• Работать можно БЕЗ ОГРАНИЧЕНИЙ</p>
        <p>• После победы над боссом откроются МОДИФИКАТОРЫ</p>
        <p>• За РИСКОВЫЕ действия можно попасть в ТЮРЬМУ (залог 120$)</p>
        <p>• В тюрьме можно работать, чтобы накопить на залог!</p>
        <p>• НОВЫЕ ЛОКАЦИИ открываются на 6, 11 и 16 уровне — АВТОМАТИЧЕСКИЙ ПЕРЕХОД!</p>
        <p>• ⚠️ ВЕРНУТЬСЯ НА СТАРУЮ ЛОКАЦИЮ НЕЛЬЗЯ!</p>
        <p>• 🏆 Каждая победа над боссом увеличивает лимит модификаторов (2→3→4)</p>
        <p>🎭 На уровнях <strong>2-18</strong> — сюжетные события!</p>
        <p>🔥 Удачи, авантюрист!</p>`;
    modalChoices.innerHTML = `<button class="choice-btn" id="prologStartBtn">🎰 ИГРАТЬ!</button>`;
    modal.style.display = "flex";
    
    const startBtn = document.getElementById("prologStartBtn");
    if (startBtn) {
        startBtn.onclick = () => {
            modal.style.display = "none";
            setCanSave(true);
            initAudio();
            saveGame();
            saveAchievements();
        };
    }
}

// Инициализация игры
function init() {
    loadPlaythroughCount();
    loadAchievements();
    updateModifiersSelectorUI();
    
    const musicSlider = document.getElementById("musicVol");
    if (musicSlider) {
        musicSlider.oninput = (e) => updateMusicVolume(parseInt(e.target.value));
        musicSlider.value = getMusicVolume();
    }
    
    const sfxSlider = document.getElementById("sfxVol");
    if (sfxSlider) {
        sfxSlider.oninput = (e) => updateSFXVolume(parseInt(e.target.value));
        sfxSlider.value = getSfxVolume();
    }
    
    const hasSave = localStorage.getItem("nekoSlotSave");
    if (hasSave) {
        setCanSave(true);
        loadGame();
        if (!player.currentTheme || player.currentTheme === "") player.currentTheme = "forest";
        applyTheme(player.currentTheme);
        updateThemeButtonsWithLock();
        
        const themeBtns = document.querySelectorAll(".theme-btn");
        themeBtns.forEach(btn => { 
            if (btn.dataset.theme === player.currentTheme) btn.classList.add("active"); 
            else btn.classList.remove("active"); 
        });
        
        if (isInJail) { 
            const jailPanel = document.getElementById("jailPanel");
            if (jailPanel) jailPanel.style.display = "block";
            const spinBtn = document.getElementById("spinBtn");
            const jobBtn = document.getElementById("jobBtn");
            if (spinBtn) spinBtn.disabled = true;
            if (jobBtn) jobBtn.disabled = false;
        }
        
        if (gameCompleted) { 
            updateModifiersSelectorUI(); 
            const modifiersSelector = document.getElementById("modifiersSelector");
            if (modifiersSelector) modifiersSelector.style.display = "block"; 
        }
    } else {
        setCanSave(false);
        document.body.className = "theme-forest";
        player.currentTheme = "forest";
        applyThemeBackground("forest");
        
        const slotCells = [document.getElementById("s0"), document.getElementById("s1"), document.getElementById("s2")];
        for(let i=0;i<3;i++) {
            if (slotCells[i]) slotCells[i].innerText = FRUITS[Math.floor(Math.random()*FRUITS.length)];
        }
        
        const themeBtns = document.querySelectorAll(".theme-btn");
        themeBtns.forEach(btn => { 
            if (btn.dataset.theme === "forest") btn.classList.add("active"); 
            else btn.classList.remove("active"); 
        });
        
        showPrologue();
    }
    
    // Инициализация аудио
    initAudio();
    
    // Запуск музыки при первом клике (обходит автозапрет браузера)
    const startMusicOnFirstClick = () => {
        if (player.currentTheme) {
            playMusicForLocation(player.currentTheme);
        } else {
            playMusicForLocation("forest");
        }
        document.removeEventListener('click', startMusicOnFirstClick);
        document.removeEventListener('touchstart', startMusicOnFirstClick);
    };
    document.addEventListener('click', startMusicOnFirstClick);
    document.addEventListener('touchstart', startMusicOnFirstClick);
    
    // Привязка обработчиков событий
    const payBailBtn = document.getElementById("payBailBtn");
    if (payBailBtn) payBailBtn.onclick = payBail;
    
    const applyModifiersBtn = document.getElementById("applyModifiersBtn");
    if (applyModifiersBtn) applyModifiersBtn.onclick = applySelectedModifiers;
    
    const themeBtns = document.querySelectorAll(".theme-btn");
    themeBtns.forEach(btn => {
        btn.onclick = () => {
            const theme = btn.dataset.theme;
            const currentIndex = themeOrder.indexOf(player.currentTheme);
            const clickedIndex = themeOrder.indexOf(theme);
            if (clickedIndex < currentIndex) { 
                const msg = document.getElementById("msg");
                if (msg) {
                    msg.innerHTML = `🚫 НЕЛЬЗЯ ВЕРНУТЬСЯ В ПРОШЛОЕ!`;
                    setTimeout(() => { 
                        if (!msg.classList.contains("result-win")) { 
                            msg.innerHTML = `🌍 Ты сейчас в ${player.currentTheme === "forest" ? "Лесу" : player.currentTheme === "cyberpunk" ? "Киберпанке" : player.currentTheme === "space" ? "Космосе" : "Церкви"}. Обратной дороги нет!`;
                        } 
                    }, 3000);
                }
                return; 
            }
            if (player.level >= THEME_UNLOCK[theme]) { 
                themeBtns.forEach(b => b.classList.remove("active")); 
                btn.classList.add("active"); 
                applyTheme(theme); 
            } else { 
                const msg = document.getElementById("msg");
                if (msg) {
                    msg.innerHTML = `🔒 Локация откроется на ${THEME_UNLOCK[theme]} уровне! 🔒`;
                    setTimeout(() => { 
                        if (!msg.classList.contains("result-win")) { 
                            msg.innerHTML = `🌍 Доступно: Лес (x1) | Киберпанк (x2, lvl6) | Космос (x3, lvl11) | Церковь (x5, lvl16)`;
                        } 
                    }, 3000);
                }
            }
        };
    });
    
    const resetBtn = document.getElementById("resetBtn");
    if (resetBtn) resetBtn.onclick = resetProgress;
    
    const exitBtn = document.getElementById("exitBtn");
    if (exitBtn) exitBtn.onclick = exitToMenu;
    
    const spinBtn = document.getElementById("spinBtn");
    if (spinBtn) spinBtn.onclick = spin;
    
    const jobBtn = document.getElementById("jobBtn");
    if (jobBtn) jobBtn.onclick = startRandomJob;
    
    const jobExitBtn = document.getElementById("jobExitBtn");
    if (jobExitBtn) jobExitBtn.onclick = () => { if (isWorking) endWork(); };
    
    updateUI();
}

// Привязка кнопок меню после загрузки страницы
document.addEventListener("DOMContentLoaded", () => {
    const playBtn = document.getElementById("playBtn");
    if (playBtn) playBtn.onclick = startGame;
    
    const achievementsBtn = document.getElementById("achievementsBtn");
    if (achievementsBtn) achievementsBtn.onclick = toggleAchievements;
    
    const settingsBtn = document.getElementById("settingsBtn");
    if (settingsBtn) settingsBtn.onclick = toggleSettings;
});
