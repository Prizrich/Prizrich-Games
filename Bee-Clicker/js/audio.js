const ClickerAudio = {
    enabled: true,
    musicActive: false,
    audioElement: null,
    currentTrackIndex: -1,
    volume: 0.20,
    isPlaying: false,

    playlist: [
        "sounds/1.mp3",
        "sounds/2.mp3",
        "sounds/3.mp3",
        "sounds/4.mp3",
        "sounds/5.mp3",
        "sounds/6.mp3",
        "sounds/7.mp3"
    ],

    init() {
        if (!this.audioElement) {
            this.audioElement = new Audio();
            this.audioElement.volume = this.volume;
            this.audioElement.addEventListener("ended", () => {
                this.isPlaying = false;
                if (this.musicActive) {
                    this.playNextRandomTrack();
                }
            });
            this.audioElement.addEventListener("error", (e) => {
                console.warn("Audio error:", e);
                this.isPlaying = false;
                if (this.musicActive) {
                    setTimeout(() => this.playNextRandomTrack(), 2000);
                }
            });
        }
        return this.audioElement;
    },

    startMusicLoop() {
        if (this.musicActive) return;
        this.init();
        this.musicActive = true;
        
        if (this.currentTrackIndex === -1) {
            this.currentTrackIndex = Math.floor(Math.random() * this.playlist.length);
        }
        
        this.playTrack(this.currentTrackIndex);
    },

    playTrack(index) {
        if (!this.musicActive || index < 0 || index >= this.playlist.length) return;
        
        try {
            this.isPlaying = true;
            this.audioElement.volume = this.volume;
            this.audioElement.src = this.playlist[index];
            this.audioElement.currentTime = 0;
            
            const playPromise = this.audioElement.play();
            if (playPromise) {
                playPromise.catch(e => {
                    console.warn("Playback prevented:", e);
                    this.isPlaying = false;
                });
            }
        } catch (e) {
            console.warn("Audio play error:", e);
            this.isPlaying = false;
        }
    },

    playNextRandomTrack() {
        if (!this.musicActive || !this.audioElement) return;

        let nextIndex = this.currentTrackIndex;
        let attempts = 0;
        while (nextIndex === this.currentTrackIndex && attempts < 10) {
            nextIndex = Math.floor(Math.random() * this.playlist.length);
            attempts++;
        }
        this.currentTrackIndex = nextIndex;
        this.playTrack(this.currentTrackIndex);
    },

    nextTrack() {
        if (!this.audioElement) {
            this.init();
        }
        if (!this.musicActive) {
            this.startMusicLoop();
        } else {
            this.playNextRandomTrack();
        }
    },

    stopMusicLoop() {
        this.musicActive = false;
        this.isPlaying = false;
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.src = "";
        }
    },

    setVolume(value) {
        this.volume = Math.min(1, Math.max(0, value / 100));
        if (this.audioElement) {
            this.audioElement.volume = this.volume;
        }
        const volumeText = document.getElementById("ui-volume-val");
        if (volumeText) {
            volumeText.innerText = Math.round(value) + "%";
        }
    },

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
            
            setTimeout(() => {
                try { ctx.close(); } catch (e) {}
            }, duration * 1000 + 100);
        } catch (e) {}
    },
    
    playClick() { this.playTone(550, 0.04, "sine", 0.03); },
    playBuy() { this.playTone(600, 0.08, "triangle", 0.04); },
    playLevelUp() { 
        this.playTone(440, 0.1, "sine", 0.03);
        setTimeout(() => this.playTone(550, 0.1, "sine", 0.03), 100);
    }
};

window.nextMusicTrack = function() {
    ClickerAudio.nextTrack();
};

window.updateMusicVolume = function() {
    const slider = document.getElementById("music-volume-slider");
    if (!slider) return;
    ClickerAudio.setVolume(parseInt(slider.value));
};
