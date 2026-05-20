// ===================================================================
// МОДУЛЬ ВИТРИНЫ: АНАЛИЗАТОР ЦЕН И КОЭФФИЦИЕНТОВ ЖАДНОСТИ
// ===================================================================

const ShopManager = {
    // Рассчитывает точный процент наценки от базовой стоимости товара
    getMarkup(productId) {
        if (typeof gameState === "undefined") return 1.0;
        const prod = gameState.products.find(p => p.id === productId);
        if (!prod) return 1.0;
        return prod.userPrice / prod.basePrice;
    },

    // Возвращает текстовый вердикт по цене для ИИ-директора
    getPriceStatus(productId) {
        const markup = this.getMarkup(productId);
        if (markup > 1.4) return "SCAM";       // Грабеж, клиенты будут в ярости
        if (markup < 0.8) return "CHEAP";      // Отличная скидка, раскупят мигом
        if (markup <= 1.1) return "GOOD";      // Хорошая, честная цена
        return "NORMAL";                       // Обычный ценник Спавна
    },

    // Проверяет складской запас товара на критический уровень
    isStockLow(productId) {
        if (typeof gameState === "undefined") return false;
        const prod = gameState.products.find(p => p.id === productId);
        return prod ? prod.quantity <= 2 : false;
    }
};

// Логгируем подключение модуля торговли
console.log("🛒 Анализатор витрины shop.js успешно интегрирован в экономику.");
