// Босс-файт система
import { ALL_MODIFIERS } from './config.js';
import { player, gameCompleted, activeModifiers, setGameCompleted } from './utils.js';
import { updateUI, saveGame } from './game.js';
import { checkAchievements } from './achievements.js';
import { globalPlaythroughCount, savePlaythroughCount, updateModifiersSelectorUI, updateModifiersUI, getCurrentModifierLimit, getNextLimitMessage } from './modifiers.js';

export let bossHP = 500;
export let playerHP = 100;
export let inBossFight = false;

export function startBossFight() {
    if (inBossFight || player.defeatedBoss) return;
    bossHP = 500;
    playerHP = 100;
    inBossFight = true;
    const modal = document.getElementById("storyModal");
    const modalText = document.getElementById("modalText");
    const modalChoices = document.getElementById("modalChoices");
    updateBossModalUI(modal, modalText, modalChoices);
    modal.style.display = "flex";
}

export function updateBossModalUI(modal, modalText, modalChoices) {
    const bossAction = getRandomBossAction();
    let actionMessage = bossAction === "attack" ? "🔥 БОГ СЛОТОВ АТАКУЕТ! 🔥" : "✨ БОГ СЛОТОВ ОТВЛЁКСЯ! ✨";
    modalText.innerHTML = `<h2>👑 БИТВА С БОГОМ СЛОТОВ 👑</h2>
        <div style="margin: 15px 0;">
            <div class="health-bar"><div class="health-fill" style="width: ${(playerHP/100)*100}%">❤️ ${playerHP}/100</div></div>
            <div class="health-bar"><div class="health-fill boss-health-fill" style="width: ${(bossHP/500)*100}%">👑 ${bossHP}/500</div></div>
        </div>
        <div style="background:#aa3333aa; padding:10px; border-radius:20px; margin:10px 0;">📢 ${actionMessage}</div>
        <p>🗡️ Выбери действие:</p>`;
    modalChoices.innerHTML = `
        <button class="choice-btn" onclick="window.bossAction('attack', '${bossAction}')">⚔️ НАПАДЕНИЕ</button>
        <button class="choice-btn" onclick="window.bossAction('defend', '${bossAction}')">🛡️ ЗАЩИТА</button>
        <button class="choice-btn" onclick="window.bossAction('bribe', '${bossAction}')">💰 ОТКУП (2500$)</button>
        <button class="choice-btn" onclick="window.healInBattle()" style="background:#44aa44;">💚 ЛЕЧЕНИЕ (25 HP - 60$)</button>
    `;
}

export function getRandomBossAction() { 
    return Math.random() < 0.6 ? "attack" : "distract"; 
}

export function bossAction(action, bossActionStr) {
    const modal = document.getElementById("storyModal");
    const modalText = document.getElementById("modalText");
    const modalChoices = document.getElementById("modalChoices");
    if (!inBossFight) return;
    
    let resultMessage = "";
    
    if (action === 'bribe') {
        if (player.money >= 2500) {
            player.money -= 2500;
            bossHP = 0;
            resultMessage = "💎 Ты откупился 2500$! Бог Слотов удовлетворён и уходит в закат!";
            updateUI();
            endBossVictory(modal, modalText);
            return;
        } else {
            resultMessage = "❌ Не хватает денег на откуп! ❌";
            modalChoices.innerHTML = `<button class="choice-btn" onclick="window.closeBossModal()">😞 ПРОДОЛЖИТЬ БОЙ</button>`;
            modalText.innerHTML += `<p>${resultMessage}</p>`;
            return;
        }
    }
    
    if (action === 'attack') {
        let damage = player.hasAmulet ? Math.floor(Math.random() * 11) + 20 : Math.floor(Math.random() * 6) + 10;
        bossHP -= damage;
        resultMessage = `⚔️ Ты нанёс ${damage} урона!`;
    }
    if (action === 'defend') { 
        resultMessage = `🛡️ Ты встал в защитную стойку!`; 
    }
    
    if (bossActionStr === 'attack') {
        let damage = 10;
        if (action === 'defend') damage = Math.floor(damage / 2);
        playerHP -= damage;
        resultMessage += `\n🔥 Бог Слотов атакует и наносит ${damage} урона!`;
    } else if (bossActionStr === 'distract') { 
        resultMessage += `\n✨ Бог Слотов отвлёкся и не атакует!`; 
    }
    
    if (playerHP <= 0) { 
        playerHP = 0; 
        endBossDefeat(modal, modalText); 
        return; 
    }
    if (bossHP <= 0) { 
        bossHP = 0; 
        endBossVictory(modal, modalText); 
        return; 
    }
    
    updateUI();
    const newBossAction = getRandomBossAction();
    let newActionMessage = newBossAction === "attack" ? "🔥 БОГ СЛОТОВ АТАКУЕТ! 🔥" : "✨ БОГ СЛОТОВ ОТВЛЁКСЯ! ✨";
    
    modalText.innerHTML = `<h2>👑 БИТВА С БОГОМ СЛОТОВ 👑</h2>
        <div style="margin: 15px 0;">
            <div class="health-bar"><div class="health-fill" style="width: ${Math.max(0, (playerHP/100)*100)}%">❤️ ${Math.max(0, playerHP)}/100</div></div>
            <div class="health-bar"><div class="health-fill boss-health-fill" style="width: ${Math.max(0, (bossHP/500)*100)}%">👑 ${Math.max(0, bossHP)}/500</div></div>
        </div>
        <div style="background:#444; padding:10px; border-radius:20px; margin:10px 0;">📖 ${resultMessage}</div>
        <div style="background:#aa3333aa; padding:10px; border-radius:20px; margin:10px 0;">📢 ${newActionMessage}</div>
        <p>🗡️ Выбери действие:</p>`;
    modalChoices.innerHTML = `
        <button class="choice-btn" onclick="window.bossAction('attack', '${newBossAction}')">⚔️ НАПАДЕНИЕ</button>
        <button class="choice-btn" onclick="window.bossAction('defend', '${newBossAction}')">🛡️ ЗАЩИТА</button>
        <button class="choice-btn" onclick="window.bossAction('bribe', '${newBossAction}')">💰 ОТКУП (2500$)</button>
        <button class="choice-btn" onclick="window.healInBattle()" style="background:#44aa44;">💚 ЛЕЧЕНИЕ (25 HP - 60$)</button>
    `;
}

export function healInBattle() {
    if (!inBossFight) return;
    if (player.money >= 60 && playerHP < 100) {
        player.money -= 60;
        playerHP = Math.min(100, playerHP + 25);
        updateUI();
        saveGame();
        const modal = document.getElementById("storyModal");
        const modalText = document.getElementById("modalText");
        const modalChoices = document.getElementById("modalChoices");
        const newBossAction = getRandomBossAction();
        let newActionMessage = newBossAction === "attack" ? "🔥 БОГ СЛОТОВ АТАКУЕТ! 🔥" : "✨ БОГ СЛОТОВ ОТВЛЁКСЯ! ✨";
        modalText.innerHTML = `<h2>👑 БИТВА С БОГОМ СЛОТОВ 👑</h2>
            <div style="margin: 15px 0;">
                <div class="health-bar"><div class="health-fill" style="width: ${Math.max(0, (playerHP/100)*100)}%">❤️ ${Math.max(0, playerHP)}/100</div></div>
                <div class="health-bar"><div class="health-fill boss-health-fill" style="width: ${Math.max(0, (bossHP/500)*100)}%">👑 ${Math.max(0, bossHP)}/500</div></div>
            </div>
            <div style="background:#44aa44aa; padding:10px; border-radius:20px; margin:10px 0;">💚 Ты восстановил 25 HP! -60$</div>
            <div style="background:#aa3333aa; padding:10px; border-radius:20px; margin:10px 0;">📢 ${newActionMessage}</div>
            <p>🗡️ Выбери действие:</p>`;
        modalChoices.innerHTML = `
            <button class="choice-btn" onclick="window.bossAction('attack', '${newBossAction}')">⚔️ НАПАДЕНИЕ</button>
            <button class="choice-btn" onclick="window.bossAction('defend', '${newBossAction}')">🛡️ ЗАЩИТА</button>
            <button class="choice-btn" onclick="window.bossAction('bribe', '${newBossAction}')">💰 ОТКУП (2500$)</button>
            <button class="choice-btn" onclick="window.healInBattle()" style="background:#44aa44;">💚 ЛЕЧЕНИЕ (25 HP - 60$)</button>
        `;
    } else if (playerHP >= 100) {
        const modalText = document.getElementById("modalText");
        modalText.innerHTML += `<p>❌ У тебя уже полное здоровье! ❌</p>`;
        setTimeout(() => {
            const newBossAction = getRandomBossAction();
            let newActionMessage = newBossAction === "attack" ? "🔥 БОГ СЛОТОВ АТАКУЕТ! 🔥" : "✨ БОГ СЛОТОВ ОТВЛЁКСЯ! ✨";
            modalText.innerHTML = `<h2>👑 БИТВА С БОГОМ СЛОТОВ 👑</h2>
                <div style="margin: 15px 0;">
                    <div class="health-bar"><div class="health-fill" style="width: ${Math.max(0, (playerHP/100)*100)}%">❤️ ${Math.max(0, playerHP)}/100</div></div>
                    <div class="health-bar"><div class="health-fill boss-health-fill" style="width: ${Math.max(0, (bossHP/500)*100)}%">👑 ${Math.max(0, bossHP)}/500</div></div>
                </div>
                <div style="background:#aa3333aa; padding:10px; border-radius:20px; margin:10px 0;">📢 ${newActionMessage}</div>
                <p>🗡️ Выбери действие:</p>`;
            const modalChoices = document.getElementById("modalChoices");
            modalChoices.innerHTML = `
                <button class="choice-btn" onclick="window.bossAction('attack', '${newBossAction}')">⚔️ НАПАДЕНИЕ</button>
                <button class="choice-btn" onclick="window.bossAction('defend', '${newBossAction}')">🛡️ ЗАЩИТА</button>
                <button class="choice-btn" onclick="window.bossAction('bribe', '${newBossAction}')">💰 ОТКУП (2500$)</button>
                <button class="choice-btn" onclick="window.healInBattle()" style="background:#44aa44;">💚 ЛЕЧЕНИЕ (25 HP - 60$)</button>
            `;
        }, 1000);
    } else {
        const modalText = document.getElementById("modalText");
        modalText.innerHTML += `<p>❌ Не хватает денег на лечение! Нужно 60$ ❌</p>`;
        setTimeout(() => {
            const newBossAction = getRandomBossAction();
            let newActionMessage = newBossAction === "attack" ? "🔥 БОГ СЛОТОВ АТАКУЕТ! 🔥" : "✨ БОГ СЛОТОВ ОТВЛЁКСЯ! ✨";
            modalText.innerHTML = `<h2>👑 БИТВА С БОГОМ СЛОТОВ 👑</h2>
                <div style="margin: 15px 0;">
                    <div class="health-bar"><div class="health-fill" style="width: ${Math.max(0, (playerHP/100)*100)}%">❤️ ${Math.max(0, playerHP)}/100</div></div>
                    <div class="health-bar"><div class="health-fill boss-health-fill" style="width: ${Math.max(0, (bossHP/500)*100)}%">👑 ${Math.max(0, bossHP)}/500</div></div>
                </div>
                <div style="background:#aa3333aa; padding:10px; border-radius:20px; margin:10px 0;">📢 ${newActionMessage}</div>
                <p>🗡️ Выбери действие:</p>`;
            const modalChoices = document.getElementById("modalChoices");
            modalChoices.innerHTML = `
                <button class="choice-btn" onclick="window.bossAction('attack', '${newBossAction}')">⚔️ НАПАДЕНИЕ</button>
                <button class="choice-btn" onclick="window.bossAction('defend', '${newBossAction}')">🛡️ ЗАЩИТА</button>
                <button class="choice-btn" onclick="window.bossAction('bribe', '${newBossAction}')">💰 ОТКУП (2500$)</button>
                <button class="choice-btn" onclick="window.healInBattle()" style="background:#44aa44;">💚 ЛЕЧЕНИЕ (25 HP - 60$)</button>
            `;
        }, 1000);
    }
}

export function endBossVictory(modal, modalText) {
    if (!player.defeatedBoss) {
        globalPlaythroughCount++;
        savePlaythroughCount();
    }
    player.defeatedBoss = true;
    setGameCompleted(true);
    player.money += 5000;
    inBossFight = false;
    updateUI();
    saveGame();
    checkAchievements();
    updateModifiersSelectorUI();
    const modifiersSelector = document.getElementById("modifiersSelector");
    if (modifiersSelector) modifiersSelector.style.display = "block";
    updateModifiersUI();
    const limit = getCurrentModifierLimit();
    modalText.innerHTML = `<p>✨✨✨ ПОБЕДА! +5000$ ✨✨✨</p>
        <p>🏆 ВСЕГО ПОБЕД НАД БОССОМ: ${globalPlaythroughCount} 🏆</p>
        <p>⭐ ТЕПЕРЬ ДОСТУПНО МОДИФИКАТОРОВ: ${limit} из ${ALL_MODIFIERS.length} ⭐</p>
        <p>${getNextLimitMessage()}</p>
        <button class="choice-btn" onclick="window.closeModal()">🏆 ПРОДОЛЖИТЬ ИГРУ 🏆</button>`;
}

export function endBossDefeat(modal, modalText) {
    player.money = Math.max(0, player.money - 300);
    player.exp = Math.max(0, player.exp - 100);
    inBossFight = false;
    updateUI();
    saveGame();
    modalText.innerHTML = `<p>💀 ПОРАЖЕНИЕ! БОГ СЛОТОВ забирает твои силы... 💀</p>
        <p>Ты теряешь 300$ и 100 опыта!</p>
        <button class="choice-btn" onclick="window.closeBossModalAndRetry()">⚔️ ПОПРОБОВАТЬ ЕЩЁ РАЗ ⚔️</button>
        <button class="choice-btn" onclick="window.closeModal()">🏠 ВЕРНУТЬСЯ В ИГРУ</button>`;
}

export function closeBossModalAndRetry() {
    const modal = document.getElementById("storyModal");
    modal.style.display = "none";
    startBossFight();
}

export function closeBossModal() {
    const modal = document.getElementById("storyModal");
    modal.style.display = "none";
    if (!player.defeatedBoss && player.level >= 20) startBossFight();
}