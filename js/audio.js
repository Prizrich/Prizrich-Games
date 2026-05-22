// ===================================================================
// АУДИО-МОДУЛЬ ФЕРМЫ: СИНТЕЗАТОР ПРИРОДНЫХ И ДЕРЕВЕНСКИХ ЗВУКОВ
// ===================================================================

const FarmAudio = {
    enabled: true,

    // Главная функция генерации частот звуковой картой
    playTone(freq, duration, type = "sine", volume = 0.04) {
        if (!this.enabled) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(volume, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            // Аудиоконтекст ждет клика пользователя по экрану
        }
    },

    // Мягкий глухой хруст вспаханной земли при посадке семечка
    playPlant() {
        this.playTone(180, 0.08, "triangle", 0.06);
    },

    // Журчащий всплеск воды при поливе грядки лейкой
    playWater() {
        this.playTone(600, 0.1, "sine", 0.04);
        setTimeout(() => this.playTone(750, 0.08, "sine", 0.03), 40);
        setTimeout(() => this.playTone(900, 0.06, "sine", 0.02), 80);
    },

    // Короткий сочный щелчок при успешном сборе спелого плода
    playHarvest() {
        this.playTone(480, 0.05, "sine", 0.05);
        setTimeout(() => this.playTone(600, 0.05, "sine", 0.04), 30);
    },

    // Магический восходящий перелив при крутке семян (Гаче)
    playGacha() {
        this.playTone(300, 0.1, "sine", 0.05);
        setTimeout(() => this.playTone(450, 0.1, "sine", 0.05), 60);
        setTimeout(() => this.playTone(600, 0.1, "sine", 0.05), 120);
        setTimeout(() => this.playTone(800, 0.2, "triangle", 0.04), 180);
    }
};
