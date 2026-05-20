// ===================================================================
// МЕЙН-МОДУЛЬ: ГЛОБАЛЬНЫЙ ЗАПУСК И КОНТРОЛЬ ИНТЕРФЕЙСА PASSPORT BBM
// ===================================================================

document.addEventListener("DOMContentLoaded", () => {
    console.log("🐝 BBM ENGINE: Инициализация ядра...");
    
    // Проверяем, запустился ли основной игровой движок
    if (typeof startGameEngine === "function") {
        console.log("✅ Главный движок game.js успешно обнаружен.");
    } else {
        console.error("❌ Критическая ошибка: Файл game.js не загружен или поврежден!");
    }

    // Автоматически вешаем звуки кликов на все кнопки в игре при их появлении
    document.body.addEventListener("click", (event) => {
        if (event.target.tagName === "BUTTON" || event.target.classList.contains("window-tab") || event.target.classList.contains("mail-contact")) {
            if (typeof AudioEngine !== "undefined") {
                AudioEngine.playClickSound();
            }
        }
    });
});


window.debugBBM = {
    showStats() {
        if (typeof gameState !== "undefined") {
            console.table({
                "💎 Кристаллы": Math.floor(gameState.money),
                "📈 Уровень улья": gameState.level,
                "✨ Опыт": `${gameState.exp} / 1000`,
                "⭐️ Репутация": `${gameState.reputation} / 100`,
                "🔍 Компромат на Старлика": `${gameState.compromat}%`
            });
        } else {
            console.error("gameState не найден.");
        }
    },
    addMoney(amount) {
        if (typeof updateMoney === "function") {
            updateMoney(amount);
            if (typeof updateUI === "function") updateUI();
            console.log(`🎁 Чит-код: Начислено +${amount} 💎!`);
        }
    }
};
