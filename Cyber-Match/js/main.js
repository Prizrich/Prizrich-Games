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
    const unlockModalOkBtn = document.getElementById("unlockModalOkBtn");
    const worldUnlockModal = document.getElementById("worldUnlockModal");
    const notificationOkBtn = document.getElementById("notificationOkBtn");
    const notificationModal = document.getElementById("notificationModal");
    
    if (resetBtn) resetBtn.onclick = () => resetLevel();
    if (nextLevelBtn) nextLevelBtn.onclick = () => nextLevel();
    if (modalRestartBtn) modalRestartBtn.onclick = () => resetLevel();
    if (ultimaBtn) ultimaBtn.onclick = () => steampunkUltimate();
    if (openShopBtn) openShopBtn.onclick = () => openShop();
    if (closeShopBtn) closeShopBtn.onclick = () => closeShop();
    if (helpBtn) helpBtn.onclick = () => showTutorial();
    if (closeTutorialBtn) closeTutorialBtn.onclick = () => closeTutorial();
    if (resetProgressBtn) resetProgressBtn.onclick = () => {
        showNotification("⚠️", "ПОДТВЕРЖДЕНИЕ", 
            "Вы уверены, что хотите <b>удалить весь прогресс</b>?<br>Это действие нельзя отменить!");
    };
    if (victoryRestartBtn) victoryRestartBtn.onclick = () => victoryRestart();
    if (exitToMenuBtn) exitToMenuBtn.onclick = () => exitToMainMenu();
    if (shuffleBtn) shuffleBtn.onclick = () => {
        showNotification("🃏", "ПЕРЕТАСОВКА", "Вы уверены, что хотите перетасовать поле?<br>Ход не потратится.");
    };
    
    if (unlockModalOkBtn && worldUnlockModal) {
        unlockModalOkBtn.onclick = () => {
            worldUnlockModal.classList.remove("active");
        };
    }
    
    // Закрытие уведомления
    if (notificationOkBtn && notificationModal) {
        notificationOkBtn.onclick = () => {
            notificationModal.classList.remove("active");
        };
    }
    
    // Закрытие по клику на фон
    notificationModal.addEventListener("click", (e) => {
        if (e.target === notificationModal) {
            notificationModal.classList.remove("active");
        }
    });
    
    worldUnlockModal.addEventListener("click", (e) => {
        if (e.target === worldUnlockModal) {
            worldUnlockModal.classList.remove("active");
        }
    });
}

// Переопределяем showNotification для использования в main.js
function showNotification(icon, title, message) {
    const modal = document.getElementById("notificationModal");
    const iconEl = document.getElementById("notificationIcon");
    const titleEl = document.getElementById("notificationTitle");
    const msgEl = document.getElementById("notificationMessage");
    
    if (iconEl) iconEl.textContent = icon || "✅";
    if (titleEl) titleEl.textContent = title || "УВЕДОМЛЕНИЕ";
    if (msgEl) msgEl.innerHTML = message || "";
    if (modal) modal.classList.add("active");
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

// Обработка подтверждения сброса прогресса через уведомление
document.addEventListener("DOMContentLoaded", () => {
    initUIElements();
    setupEventListeners();
    initStartScreen();
    
    // Переопределяем обработчик для кнопки сброса с подтверждением
    const resetProgressBtn = document.getElementById("resetProgressBtn");
    if (resetProgressBtn) {
        resetProgressBtn.onclick = () => {
            showNotification("⚠️", "ПОДТВЕРЖДЕНИЕ", 
                "Вы уверены, что хотите <b>удалить весь прогресс</b>?<br>Это действие нельзя отменить!");
            // Переопределяем кнопку OK для подтверждения
            const okBtn = document.getElementById("notificationOkBtn");
            const modal = document.getElementById("notificationModal");
            const oldClick = okBtn.onclick;
            okBtn.onclick = () => {
                localStorage.removeItem("cyberMatchFixed");
                localStorage.removeItem("cyberMatchAudio");
                location.reload();
            };
            // Восстанавливаем после закрытия
            const observer = new MutationObserver(() => {
                if (!modal.classList.contains("active")) {
                    okBtn.onclick = oldClick;
                    observer.disconnect();
                }
            });
            observer.observe(modal, { attributes: true, attributeFilter: ["class"] });
        };
    }
    
    // Переопределяем обработчик для перетасовки с подтверждением
    const shuffleBtn = document.getElementById("shuffleBtn");
    if (shuffleBtn) {
        shuffleBtn.onclick = () => {
            showNotification("🃏", "ПЕРЕТАСОВКА", "Вы уверены, что хотите перетасовать поле?<br>Ход не потратится.");
            const okBtn = document.getElementById("notificationOkBtn");
            const modal = document.getElementById("notificationModal");
            const oldClick = okBtn.onclick;
            okBtn.onclick = () => {
                shuffleBoard();
                modal.classList.remove("active");
                okBtn.onclick = oldClick;
            };
            const observer = new MutationObserver(() => {
                if (!modal.classList.contains("active")) {
                    okBtn.onclick = oldClick;
                    observer.disconnect();
                }
            });
            observer.observe(modal, { attributes: true, attributeFilter: ["class"] });
        };
    }
});
