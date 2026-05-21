// ===================================================================
// УЛЬТИМАТИВНЫЙ НЕУБИВАЕМЫЙ МЕДОВЫЙ ПЛЕЕР (ЖЕСТКАЯ ГРОМКОСТЬ + РАНДОМ)
// ===================================================================

const ClickerAudio = {
    enabled: true,
    musicActive: false,
    audioElement: null,
    currentTrackIndex: -1,

    // Ссылки на твои 7 треков с учётом маленькой буквы папки sounds!
    playlist: [
        "sounds/1.mp3",
        "sounds/2.mp3",
        "sounds/3.mp3",
        "sounds/4.mp3",
        "sounds/5.mp3",
        "sounds/6.mp3",
        "sounds/7.mp3"
    ],

    // МЕТОД 1: СТАРТ МУЗЫКИ (ЖЁСТКАЯ ГРОМКОСТЬ БЕЗ ТАЙМЕРОВ)
    startMusicLoop() {
        if (!this.audioElement) {
            this.audioElement = new Audio();
            
            // Как только песня кончилась — сразу включаем следующую случайную!
            this.audioElement.addEventListener("ended", () => {
                this.playNextRandomTrack();
            });
        }

        // Если это самый первый запуск — выбираем случайный трек
        if (this.currentTrackIndex === -1) {
            this.currentTrackIndex = Math.floor(Math.random() * this.playlist.length);
        }

        this.musicActive = true;
        
        // ПРИНУДИТЕЛЬНО И НАМЕРТВО выставляем громкость на 15% (без плавного нарастания)
        this.audioElement.volume = 0.15; 
        this.audioElement.src = this.playlist[this.currentTrackIndex];
        
        // Запускаем воспроизведение
        this.audioElement.play().catch(e => {
            console.log("Браузер ждёт клика по экрану, чтобы разрешить звук!");
        });
    },

    // МЕТОД 2: СЛУЧАЙНЫЙ ПЕРЕХОД БЕЗ ПОВТОРОВ ПОДРЯД
    playNextRandomTrack() {
        if (!this.musicActive || !this.audioElement) return;

        let nextIndex = this.currentTrackIndex;
        
        // Цикл крутится, пока новый индекс не станет отличаться от старого
        while (nextIndex === this.currentTrackIndex) {
            nextIndex = Math.floor(Math.random() * this.playlist.length);
        }

        this.currentTrackIndex = nextIndex;
        
        this.audioElement.volume = 0.15;
        this.audioElement.src = this.playlist[this.currentTrackIndex];
        this.audioElement.play().catch(e => console.log(e));
    },

    // МЕТОД 3: МОМЕНТАЛЬНАЯ ПАУЗА ПРИ ВЫКЛЮЧЕНИИ
    stopMusicLoop() {
        this.musicActive = false;
        if (this.audioElement) {
            this.audioElement.pause();
        }
    },

    // СИНТЕЗИРОВАННЫЕ КЛИКИ ПО ГОРШОЧКУ (РАБОТАЮТ НАПРЯМУЮ ЧЕРЕЗ ЗВУКОВУЮ КАРТУ)
    playTone(freq, duration, type = "sine", volume = 0.03) {
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
        } catch (e) {}
    },
    playClick() { this.playTone(550, 0.04, "sine"); },
    playBuy() { this.playTone(600, 0.08, "triangle"); },
    playLevelUp() { this.playTone(440, 0.1, "sine"); }
};
