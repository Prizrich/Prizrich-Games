// Главный файл - точка входа

function initUIElements() {
    window.uiElements = {
        score: document.getElementById("score"),
        moves: document.getElementById("moves"),
        comboDisplay: document.getElementById("comboDisplay"),
        questProgressDisplay: document.getElementById("questProgressDisplay"),
        questFill: document.getElementById("questFill"),
        questTargetDisplay: document.getElementById("questTargetDisplay")
    };
    setUIElements(window.uiElements);
}

function initStartScreen() {
    loadAudioSettingsUI();
    
    // Табы
    const tabBtns = document.querySelectorAll(".tab-btn");
    const playTab = document.getElementById("playTab");
    const settingsTab = document.getElementById("settingsTab");
    
    tabBtns.forEach(btn => {
        btn.onclick = () => {
            tabBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            if (btn.dataset.tab === "play") {
                playTab.classList.add("active");
                settingsTab.classList.remove("active");
            } else {
                settingsTab.classList.add("active");
                playTab.classList.remove("active");
            }
        };
    });
    
    // Настройки звука
    const musicSlider = document.getElementById("musicVolumeSlider");
    const soundsSlider = document.getElementById("soundsVolumeSlider");
    const musicValue = document.getElementById("musicVolumeValue");
    const soundsValue = document.getElementById("soundsVolumeValue");
    
    if (musicSlider) {
        musicSlider.value = getMusicVolume();
        musicValue.innerText = getMusicVolume() + "%";
        musicSlider.oninput = (e) => {
            let val = parseInt(e.target.value);
            updateMusicVolume(val);
            musicValue.innerText = val + "%";
        };
    }
    
    if (soundsSlider) {
        soundsSlider.value = getSoundsVolume();
        soundsValue.innerText = getSoundsVolume() + "%";
        soundsSlider.oninput = (e) => {
            let val = parseInt(e.target.value);
            updateSoundsVolume(val);
            soundsValue.innerText = val + "%";
        };
    }
    
    // Кнопка Play
    const playBtn = document.getElementById("playBtn");
    const startScreen = document.getElementById("startScreen");
    const gameWrapper = document.getElementById("gameWrapper");
    
    if (playBtn) {
        playBtn.onclick = () => {
            startScreen.classList.add("hide");
            gameWrapper.classList.add("visible");
            setTimeout(() => {
                initAudio();
                initGameAfterStart();
            }, 100);
        };
    }
}

function loadAudioSettingsUI() {
    const saved = localStorage.getItem("cyberMatchAudio");
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.musicVolume !== undefined) updateMusicVolume(data.musicVolume);
            if (data.soundsVolume !== undefined) updateSoundsVolume(data.soundsVolume);
        } catch(e) {}
    }
}

function setupEventListeners() {
    // Кнопки навигации по мирам
    const prevBtn = document.getElementById("prevWorldBtn");
    const nextBtn = document.getElementById("nextWorldBtn");
    
    if (prevBtn) {
        prevBtn.onclick = () => {
            let idx = WORLDS_LIST.indexOf(currentWorld);
            for (let i = idx - 1; i >= 0; i--) {
                if (playerProgress[WORLDS_LIST[i]]?.isUnlocked) {
                    goToWorld(WORLDS_LIST[i]);
                    break;
                }
            }
        };
    }
    
    if (nextBtn) {
        nextBtn.onclick = () => {
            let idx = WORLDS_LIST.indexOf(currentWorld);
            for (let i = idx + 1; i < WORLDS_LIST.length; i++) {
                if (playerProgress[WORLDS_LIST[i]]?.isUnlocked) {
                    goToWorld(WORLDS_LIST[i]);
                    break;
                }
            }
        };
    }
    
    // Кнопки игры
    const resetBtn = document.getElementById("resetBtn");
    const nextLevelBtn = document.getElementById("nextLevelBtn");
    const modalRestartBtn = document.getElementById("modalRestartBtn");
    const ultimaBtn = document.getElementById("ultimaBtn");
    const openShopBtn = document.getElementById("openShopBtn");
    const closeShopBtn = document.getElementById("closeShopBtn");
    const helpBtn = document.getElementById("helpBtn");
    const closeTutorialBtn = document.getElementById("closeTutorialBtn");
    const resetProgressBtn = document.getElementById("resetProgressBtn");
    const victoryRestartBtn = document.getElementById("victoryRestartBtn");
    const exitToMenuBtn = document.getElementById("exitToMenuBtn");
    const shuffleBtn = document.getElementById("shuffleBtn");
    
    if (resetBtn) resetBtn.onclick = () => resetLevel();
    if (nextLevelBtn) nextLevelBtn.onclick = () => nextLevel();
    if (modalRestartBtn) modalRestartBtn.onclick = () => resetLevel();
    if (ultimaBtn) ultimaBtn.onclick = () => steampunkUltimate();
    if (openShopBtn) openShopBtn.onclick = () => openShop();
    if (closeShopBtn) closeShopBtn.onclick = () => closeShop();
    if (helpBtn) helpBtn.onclick = () => showTutorial();
    if (closeTutorialBtn) closeTutorialBtn.onclick = () => closeTutorial();
    if (resetProgressBtn) resetProgressBtn.onclick = () => {
        if (confirm("⚠️ УДАЛИТЬ ВЕСЬ ПРОГРЕСС?")) {
            localStorage.removeItem("cyberMatchFixed");
            localStorage.removeItem("cyberMatchAudio");
            location.reload();
        }
    };
    if (victoryRestartBtn) victoryRestartBtn.onclick = () => victoryRestart();
    if (exitToMenuBtn) exitToMenuBtn.onclick = () => exitToMainMenu();
    if (shuffleBtn) shuffleBtn.onclick = () => {
        if (confirm("🃏 Перетасовать поле? Ход не потратится.")) {
            shuffleBoard();
        }
    };
}

function showTutorial() {
    let modal = document.getElementById("tutorialModal");
    let list = document.getElementById("tutorialItemsList");
    if (!list) return;
    
    list.innerHTML = "";
    const worlds = [
        { name: "🌲 ЛЕСНОЙ МИР", color: "#4caf50", desc: "🌸 Цветок +50% очков при сборе | Каждые 3 матча дают +1 ход" },
        { name: "⚙️ СТИМПАНК", color: "#cd7f32", desc: "⚙️ Ржавчина: нужно составить ряд ДВАЖДЫ | 💨 40 шестерёнок → Паровой удар" },
        { name: "🤖 КИБЕРПАНК", color: "#00f0ff", desc: "⚠️ 2 хода без комбо → случайная клетка глохнет | 💻 Комбо x3+ → +1 ход" },
        { name: "🪐 КОСМОС", color: "#9c27b0", desc: "🔄 Инверсия гравитации каждые 4 хода | ⚫ Черная дыра в центре засасывает соседей" }
    ];
    
    worlds.forEach(w => {
        let div = document.createElement("div");
        div.className = "world-tutorial";
        div.style.borderLeftColor = w.color;
        div.innerHTML = `<h3>${w.name}</h3><p>${w.desc}</p>`;
        list.appendChild(div);
    });
    
    if (modal) modal.classList.add("active");
}

function closeTutorial() {
    const modal = document.getElementById("tutorialModal");
    if (modal) modal.classList.remove("active");
}

// Запуск
document.addEventListener("DOMContentLoaded", () => {
    initUIElements();
    setupEventListeners();
    initStartScreen();
});
