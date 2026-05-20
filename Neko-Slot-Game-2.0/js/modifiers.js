// Система модификаторов
import { ALL_MODIFIERS } from './config.js';
import { player, gameCompleted, canSave, activeModifiers, setActiveModifiers, setGameCompleted } from './utils.js';
import { saveGame, resetGameState, updateUI } from './game.js';
import { saveAchievements, achievements } from './achievements.js';

export let globalPlaythroughCount = 0;

export function loadPlaythroughCount() {
    const saved = localStorage.getItem("nekoPlaythroughCount");
    if (saved) globalPlaythroughCount = parseInt(saved);
    else globalPlaythroughCount = 0;
}

export function savePlaythroughCount() {
    localStorage.setItem("nekoPlaythroughCount", globalPlaythroughCount);
}

export function getCurrentModifierLimit() {
    if (globalPlaythroughCount >= 3) return 4;
    if (globalPlaythroughCount >= 1) return 3;
    return 2;
}

export function getNextLimitMessage() {
    if (globalPlaythroughCount >= 3) return "🏆 МАКСИМАЛЬНЫЙ УРОВЕНЬ! Можно брать до 4 модификаторов! 🏆";
    if (globalPlaythroughCount >= 1) return "⭐ УРОВЕНЬ 2! После следующей победы можно будет брать до 4 модификаторов! ⭐";
    return "🌟 ПЕРВОЕ ПРОХОЖДЕНИЕ! После победы можно будет брать до 3 модификаторов! 🌟";
}

export function updateModifiersLimitUI() {
    const infoDiv = document.getElementById("modifiersLimitInfo");
    if (!infoDiv) return;
    const limit = getCurrentModifierLimit();
    infoDiv.innerHTML = `📊 ДОСТУПНО МОДИФИКАТОРОВ: ${limit} из ${ALL_MODIFIERS.length}<br>${getNextLimitMessage()}`;
}

export function updateModifiersSelectorUI() {
    const container = document.getElementById("modifiersList");
    if (!container) return;
    container.innerHTML = "";
    const limit = getCurrentModifierLimit();
    ALL_MODIFIERS.forEach(mod => {
        const div = document.createElement("div");
        div.className = "modifier-check";
        const isChecked = activeModifiers.some(m => m.id === mod.id);
        div.innerHTML = `<input type="checkbox" id="mod_${mod.id}" ${isChecked ? "checked" : ""}>
            <label for="mod_${mod.id}"><strong>${mod.name}</strong><br><small>${mod.desc}</small></label>`;
        container.appendChild(div);
    });
    updateModifiersLimitUI();
}

export function updateModifiersUI() {
    const panel = document.getElementById("modifiersPanel");
    if (!panel) return;
    if (!gameCompleted || activeModifiers.length === 0) {
        panel.innerHTML = '⚙️ МОДИФИКАТОРЫ НЕ АКТИВНЫ<br>Победите босса, чтобы открыть';
        return;
    }
    let html = '⚠️ АКТИВНЫЕ МОДИФИКАТОРЫ ⚠️<br>';
    activeModifiers.forEach(m => { 
        html += `<span class="modifier-badge">${m.name}</span>`; 
    });
    panel.innerHTML = html;
}

export function applyModifiersToPlayer(p) {
    p.legendDisabled = false; 
    p.badReputation = false; 
    p.smallWins = false; 
    p.highRisk = false;
    activeModifiers.forEach(m => {
        if (m.id === "noLegend") p.legendDisabled = true;
        if (m.id === "badRep") p.badReputation = true;
        if (m.id === "smallWin") p.smallWins = true;
        if (m.id === "highRisk") p.highRisk = true;
    });
}

export function applySelectedModifiers() {
    const selected = [];
    ALL_MODIFIERS.forEach(mod => {
        const cb = document.getElementById(`mod_${mod.id}`);
        if (cb && cb.checked) selected.push(mod);
    });
    const limit = getCurrentModifierLimit();
    if (selected.length > limit) { 
        alert(`Можно выбрать не более ${limit} модификаторов! Текущий уровень позволяет брать только ${limit}. Побеждайте босса больше раз, чтобы увеличить лимит!`); 
        return; 
    }
    
    const modal = document.getElementById("storyModal");
    const modalText = document.getElementById("modalText");
    const modalChoices = document.getElementById("modalChoices");
    let modifiersText = "";
    selected.forEach(m => { modifiersText += `\n• ${m.name} — ${m.desc}`; });
    if (selected.length === 0) modifiersText = "\n• Модификаторы не выбраны";
    
    modalText.innerHTML = `<p>⚠️ <strong>ВНИМАНИЕ!</strong> ⚠️</p>
        <p>После применения модификаторов игра начнётся <strong>ЗАНОВО</strong>!</p>
        <p>Весь текущий прогресс будет <strong>УТЕРЯН</strong>.</p>
        <p>Выбранные модификаторы:${modifiersText}</p>
        <p style="color:#ffaa44;">Вы уверены, что хотите начать новую игру с этими усложнениями?</p>`;
    modalChoices.innerHTML = `<button class="choice-btn" id="confirmResetBtn" style="background:#44aa44;">✅ ДА, НАЧАТЬ ЗАНОВО</button>
        <button class="choice-btn" id="cancelResetBtn" style="background:#aa4444;">❌ ОТМЕНА</button>`;
    modal.style.display = "flex";
    
    document.getElementById("confirmResetBtn").onclick = () => {
        modal.style.display = "none";
        setActiveModifiers(selected);
        resetGameWithModifiers();
    };
    document.getElementById("cancelResetBtn").onclick = () => { modal.style.display = "none"; };
}

export function resetGameWithModifiers() {
    // Очищаем сохранения
    localStorage.removeItem("nekoSlotSave");
    
    // Сброс состояния игрока через resetGameState
    resetGameState();
    
    // Применяем модификаторы к игроку
    applyModifiersToPlayer(player);
    
    // Сброс достижений
    for (let key in achievements) {
        achievements[key].unlocked = false;
    }
    saveAchievements();
    
    // Сброс визуального оформления
    document.body.className = "theme-forest";
    const bgContainer = document.getElementById("bgEffects");
    if (bgContainer) bgContainer.innerHTML = "";
    player.currentTheme = "forest";
    
    // Обновляем UI
    updateUI();
    
    // Скрываем тюремную панель
    const jailPanel = document.getElementById("jailPanel");
    if (jailPanel) jailPanel.style.display = "none";
    
    // Активируем кнопки
    const spinBtn = document.getElementById("spinBtn");
    const jobBtn = document.getElementById("jobBtn");
    if (spinBtn) spinBtn.disabled = false;
    if (jobBtn) jobBtn.disabled = false;
    
    // Сообщение
    const msg = document.getElementById("msg");
    if (msg) msg.innerHTML = "⚙️ НОВАЯ ИГРА С МОДИФИКАТОРАМИ! ⚙️";
    
    // Сохраняем игру
    saveGame();
    
    // Скрываем селектор модификаторов
    const modifiersSelector = document.getElementById("modifiersSelector");
    if (modifiersSelector) modifiersSelector.style.display = "none";
    
    // Обновляем UI достижений
    const achievementsPanel = document.getElementById("achievementsPanel");
    if (achievementsPanel) {
        import('./achievements.js').then(module => {
            module.updateAchievementsUI();
        });
    }
}