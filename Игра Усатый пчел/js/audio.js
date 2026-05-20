// ===================================================================
// АУДИО-МОДУЛЬ: 8-БИТНЫЙ СИНТЕЗАТОР ЗВУКОВЫХ ЭФФЕКТОВ CLIKS & BEB
// ===================================================================

const AudioEngine = {
    enabled: true, // Включаем звук по умолчанию!

    // Внутренний генератор ретро-частот звуковой карты браузера
    createTone(frequency, duration, type = "sine") {
        if (!this.enabled) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = type;
            osc.frequency.value = frequency;
            
            gain.gain.setValueAtTime(0.1, ctx.currentTime); // Делаем звук приятным и негромким
            gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            console.log("Аудио-контекст заблокирован до первого клика пользователя.");
        }
    },

    // Короткий ламповый писк при переключении контактов или вкладок
    playClickSound() {
        this.createTone(587.33, 0.08, "triangle"); // Нота Ре второй октавы
    },

    // Медовый праздничный двойной писк при закупке товара у Вали 🚚
    playDeliverySound() {
        this.createTone(523.25, 0.1, "sine"); // До
        setTimeout(() => {
            this.createTone(659.25, 0.15, "sine"); // Ми
        }, 100);
    },

    // Тревожный низкий писк при бот-атаке Старлика или KAPACb
    playAlertSound() {
        this.createTone(220.00, 0.3, "sawtooth"); // Низкий гул Ля малой октавы
    }
};

console.log("🔊 Ретро-синтезатор звуков audio.js готов к работе.");
