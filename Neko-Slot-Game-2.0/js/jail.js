// Тюремная система
import { player, isInJail, bailAmount, setIsInJail } from './utils.js';
import { updateUI, saveGame } from './game.js';

export function sendToJail(reason) {
    if (isInJail) return;
    setIsInJail(true);
    
    const jailPanel = document.getElementById("jailPanel");
    const bailAmountSpan = document.getElementById("bailAmount");
    const spinBtn = document.getElementById("spinBtn");
    const jobBtn = document.getElementById("jobBtn");
    const msg = document.getElementById("msg");
    
    if (jailPanel) jailPanel.style.display = "block";
    if (bailAmountSpan) bailAmountSpan.innerText = bailAmount;
    if (spinBtn) spinBtn.disabled = true;
    if (jobBtn) jobBtn.disabled = false;
    if (msg) msg.innerHTML = `🔒 ${reason} ТЕБЯ ПОСАДИЛИ! Нужно ${bailAmount}$ для выхода. Работай в тюрьме! 🔒`;
    
    saveGame();
}

export function payBail() {
    if (!isInJail) return;
    
    if (player.money >= bailAmount) {
        player.money -= bailAmount;
        setIsInJail(false);
        
        const jailPanel = document.getElementById("jailPanel");
        const spinBtn = document.getElementById("spinBtn");
        const jobBtn = document.getElementById("jobBtn");
        const msg = document.getElementById("msg");
        
        if (jailPanel) jailPanel.style.display = "none";
        if (spinBtn) spinBtn.disabled = false;
        if (jobBtn) jobBtn.disabled = false;
        if (msg) msg.innerHTML = `✅ Ты вышел на свободу! Осталось ${player.money}$ ✅`;
        
        updateUI();
        saveGame();
    } else {
        const msg = document.getElementById("msg");
        if (msg) msg.innerHTML = `❌ Не хватает денег! Нужно ${bailAmount}$, есть ${player.money}$. Работай в тюрьме! ❌`;
    }
}