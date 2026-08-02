const AudioEngine = {
    enabled: true,

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
            
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            console.log("Аудио-контекст заблокирован до первого клика пользователя.");
        }
    },

    playClickSound() {
        this.createTone(587.33, 0.08, "triangle");
    },

    playDeliverySound() {
        this.createTone(523.25, 0.1, "sine");
        setTimeout(() => {
            this.createTone(659.25, 0.15, "sine");
        }, 100);
    },

    playAlertSound() {
        this.createTone(220.00, 0.3, "sawtooth");
    }
};

console.log("🔊 Ретро-синтезатор звуков audio.js готов к работе.");
