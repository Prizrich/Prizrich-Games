// ===================================================================
// МОДУЛЬ УТИЛИТ: ЗАЩИТА ВВОДА, ФИЛЬТРЫ И МАТЕМАТИКА БЕЗОПАСНОСТИ
// ===================================================================

const Utils = {
    // Защищает инпуты цен и закупки от ввода букв, минусов, NaN и пустых строк
    sanitizeNumber(value, defaultValue = 1) {
        let parsed = parseInt(value);
        if (isNaN(parsed) || parsed < 1) {
            return defaultValue;
        }
        return parsed;
    },

    // Ограничивает число в жестких рамках (например, репутацию строго от 0 до 100)
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    // Проверяет текст сообщения в BBM на пустоту или спам пробелами
    isValidMessage(text) {
        if (!text) return false;
        return text.trim().length > 0;
    },

    // Форматирует время для отправки сообщений в чат BBM
    getCurrentTimestamp() {
        const now = new Date();
        const hrs = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        return `${hrs}:${mins}`;
    }
};

console.log("⚙️ Система фильтрации и защиты utils.js запущена.");
