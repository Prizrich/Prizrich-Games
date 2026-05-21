// ===================================================================
// ГЛАВНЫЙ СУПЕРВИЗОР ИГРЫ (MAIN-МОДУЛЬ): ТОЧКА СТАРТА И СЛУШАТЕЛИ КЛИКОВ
// ===================================================================

document.addEventListener("DOMContentLoaded", () => {
    console.log("🎮 Инициализация Bee-Clicker запущенна через main.js...");
    
    // 1. Подгружаем сохраненный прогресс из памяти Оперы
    if (typeof loadGameProgress === "function") {
        loadGameProgress();
    }
    
    // 2. Считаем текущую силу клика и доход в секунду
    if (typeof recalculateStats === "function") {
        recalculateStats();
    }
    
    // 3. Рисуем магазины пчёл и улучшений сот
    if (typeof renderBuildingsList === "function") renderBuildingsList();
    if (typeof renderUpgradesList === "function") renderUpgradesList();
    
    // 4. Обновляем все цифры на экране
    if (typeof updateClickerUI === "function") updateClickerUI();

    // 5. ОЖИВЛЯЕМ ГОРШОЧЕК: Намертво привязываем клик мыши к функции игры
    const corePot = document.getElementById("clicker-core");
    if (corePot && typeof handleHoneyClick === "function") {
        corePot.addEventListener("click", (e) => {
            handleHoneyClick(e);
        });
        console.log("🍯 Горшок с мёдом успешно подключен к системе частиц.");
    }

    // 6. Запускаем фоновый таймер пассивного дохода (раз в 1 секунду)
    setInterval(() => {
        if (typeof runGameTick === "function") {
            runGameTick();
        }
    }, 1000);
});
