const ShopManager = {
    getMarkup(productId) {
        if (typeof gameState === "undefined") return 1.0;
        const prod = gameState.products.find(p => p.id === productId);
        if (!prod) return 1.0;
        return prod.userPrice / prod.basePrice;
    },

    getPriceStatus(productId) {
        const markup = this.getMarkup(productId);
        if (markup > 1.4) return "SCAM";
        if (markup < 0.8) return "CHEAP";
        if (markup <= 1.1) return "GOOD";
        return "NORMAL";
    },

    isStockLow(productId) {
        if (typeof gameState === "undefined") return false;
        const prod = gameState.products.find(p => p.id === productId);
        return prod ? prod.quantity <= 2 : false;
    }
};

console.log("🛒 Анализатор витрины shop.js успешно интегрирован в экономику.");
