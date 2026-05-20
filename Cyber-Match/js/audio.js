// Аудио система

let currentMusic = null;
let audioEnabled = false;
let musicVolume = 70;
let soundsVolume = 70;
let currentWorldId = null;

function initAudio() {
    if (audioEnabled) return;
    audioEnabled = true;
    
    loadAudioSettings();
    
    const unlockAudio = () => {
        if (currentMusic) {
            currentMusic.volume = musicVolume / 100;
            currentMusic.play().catch(e => console.log("Audio play blocked"));
        }
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
}

function loadAudioSettings() {
    const saved = localStorage.getItem("cyberMatchAudio");
    if (saved) {
        try {
            const data = JSON.parse(saved);
            musicVolume = data.musicVolume ?? 70;
            soundsVolume = data.soundsVolume ?? 70;
        } catch(e) {}
    }
}

function saveAudioSettings() {
    localStorage.setItem("cyberMatchAudio", JSON.stringify({
        musicVolume: musicVolume,
        soundsVolume: soundsVolume
    }));
}

function updateMusicVolume(value) {
    musicVolume = value;
    if (currentMusic) {
        currentMusic.volume = musicVolume / 100;
        if (musicVolume === 0) currentMusic.pause();
        else if (currentMusic.paused && audioEnabled) currentMusic.play().catch(e => {});
    }
    saveAudioSettings();
}

function updateSoundsVolume(value) {
    soundsVolume = value;
    saveAudioSettings();
}

function playMusicForWorld(worldId) {
    if (!audioEnabled) return;
    
    if (currentWorldId === worldId && currentMusic && !currentMusic.paused) return;
    
    stopMusic();
    currentWorldId = worldId;
    
    const worldMusic = {
        forest: "sounds/forest.mp3",
        steampunk: "sounds/steampunk.mp3",
        cyber: "sounds/cyberpunk.mp3",
        space: "sounds/cosmos.mp3"
    };
    
    const musicFile = worldMusic[worldId];
    if (!musicFile) return;
    
    try {
        currentMusic = new Audio(musicFile);
        currentMusic.loop = true;
        currentMusic.volume = musicVolume / 100;
        if (musicVolume > 0) {
            currentMusic.play().catch(e => console.log("Music play error:", e));
        }
    } catch(e) {
        console.log("Error loading music for", worldId, e);
    }
}

function stopMusic() {
    if (currentMusic) {
        currentMusic.pause();
        currentMusic.currentTime = 0;
        currentMusic = null;
    }
    currentWorldId = null;
}

function playSound(soundName) {
    if (!audioEnabled || soundsVolume === 0) return;
    
    const sounds = {
        match: "sounds/match.wav",
        win: "sounds/win.wav",
        click: "sounds/click.wav"
    };
    
    const soundFile = sounds[soundName];
    if (!soundFile) return;
    
    try {
        const audio = new Audio(soundFile);
        audio.volume = soundsVolume / 100;
        audio.play().catch(e => console.log("Sound play error:", e));
    } catch(e) {}
}

function getMusicVolume() { return musicVolume; }
function getSoundsVolume() { return soundsVolume; }