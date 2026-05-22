// ===================================================================
// ГЛАВНЫЙ СУПЕРВИЗОР ИГРЫ (MAIN): СВЯЗУЮЩАЯ ИНИЦИАЛИЗАЦИЯ
// ===================================================================

document.addEventListener("DOMContentLoaded", () => {
    console.log("🎮 Запуск ядра Pixel Farm...");
    
    // Вызываем запуск движка напрямую, минуя дублирующиеся цепочки
    if (typeof initFarmGame === "function") {
        initFarmGame();
    }
});

// ===================================================================
// СУПЕРВИЗОР ИГРЫ (MAIN): УПРАВЛЕНИЕ ГЛАВНЫМ МЕНЮ И СТАРТОМ АУДИО
// ===================================================================

console.log("Запуск главного супервизора main.js...");

// Функция, которая срабатывает при нажатии на огромную кнопку «ПОЕХАЛИ!»
window.startFarmGameFromMenu = function() {
    const menuOverlay = document.getElementById("ui-main-menu-overlay");
    
    if (menuOverlay) {
        console.log("🚜 Игрок нажал СТАРТ! Открываем ворота фермы...");
        
        // Скрываем экран заставки меню
        menuOverlay.style.display = "none";
        
        // Проверяем модуль аудио и издаём приветственный клик
        if (typeof FarmAudio !== "undefined" && typeof FarmAudio.playGacha === "function") {
            try {
                FarmAudio.playGacha(); 
                console.log("🎵 Звуковое сопровождение успешно запущено!");
            } catch (e) {
                console.log("🔊 Браузер ожидает ручного клика по холсту.");
            }
        }
        
        // Выбрасываем приветственный тост на экран
        if (typeof showFarmNotification === "function") {
            showFarmNotification("Pixel Farm", "Удачного урожая, фермер! 🌾🚜");
        }
    }
};

// Проверяем статус готовности разметки страницы
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        console.log("🌱 Разметка загружена, главное меню готово к фиксации.");
    });
} else {
    console.log("🌱 Разметка готова, главное меню ожидает клика.");
}
