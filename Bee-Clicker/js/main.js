document.addEventListener("DOMContentLoaded", () => {
    console.log("🐝 Запуск Bee-Clicker...");
    
    const game = window.clickerGame;
    
    if (!game) {
        console.error("❌ Игровой движок не найден!");
        return;
    }
    
    if (typeof game.init === "function") {
        game.init();
    } else {
        console.error("❌ Метод init не найден!");
    }
});
