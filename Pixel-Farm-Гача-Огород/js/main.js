// ===================================================================
// СУПЕРВИЗОР ИГРЫ (MAIN): УПРАВЛЕНИЕ ГЛАВНЫМ МЕНЮ И СТАРТОМ АУДИО
// ===================================================================

console.log("🎮 Запуск главного супервизора main.js...");

// Функция работы кнопки главного меню «ПОЕХАЛИ!»
window.startFarmGameFromMenu = function() {
    const menuOverlay = document.getElementById("ui-main-menu-overlay");
    const nameInput = document.getElementById("ui-player-name");
    
    if (menuOverlay) {
        console.log("🚜 Открываем ворота фермы...");
        menuOverlay.style.display = "none";
        
        // ПЕРВИЧНЫЙ РАЗБЛОК: Если игрок зашёл впервые — намертво снимаем любые блокировки с инпута!
        if (!localStorage.getItem("pixel_farm_player_name") && nameInput) {
            nameInput.disabled = false;
            nameInput.value = "";
            nameInput.style.backgroundColor = "#fff";
            nameInput.style.cursor = "text";
            nameInput.placeholder = "Введи ник и жми Enter...";
            console.log("🔓 Таможня: Обнаружен первый заход! Поле ввода ника открыто.");
        }
        
        // Запуск приветственного звука
        if (typeof FarmAudio !== "undefined" && typeof FarmAudio.playGacha === "function") {
            try {
                FarmAudio.playGacha();
                console.log("🎵 Звуковое сопровождение запущено!");
            } catch (e) {
                console.log("🔊 Автозвук заблокирован браузером до клика по полю.");
            }
        }
        
        if (typeof showFarmNotification === "function") {
            showFarmNotification("Pixel Farm", "Удачного урожая, фермер! 🌾🚜");
        }
    }
};

// Контроль загрузки страницы
document.addEventListener("DOMContentLoaded", () => {
    console.log("🌱 Главное меню зафиксировано и ожидает клика.");
    // Дублирующий страховочный фикс: если ника нет — открываем поле сразу
    const nameInput = document.getElementById("ui-player-name");
    if (!localStorage.getItem("pixel_farm_player_name") && nameInput) {
        nameInput.disabled = false;
        nameInput.style.backgroundColor = "#fff";
        nameInput.style.cursor = "text";
    }
});
