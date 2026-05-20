// Аудио система
import { locationMusic } from './config.js';

let currentMusic = null;
let audioReady = false;
let currentMusicVol = 30;
let sfxVolume = 70;
let spinSound = null;
let levelUpSound = null;

export function initAudio() {
    if (audioReady) return;
    try {
        spinSound = new Audio('sounds/win_slot.wav');
        levelUpSound = new Audio('sounds/level_up.ogg');
        
        const savedMusic = localStorage.getItem("nekoMusicVol");
        if (savedMusic) currentMusicVol = parseInt(savedMusic);
        const savedSfx = localStorage.getItem("nekoSfxVol");
        if (savedSfx) sfxVolume = parseInt(savedSfx);
        
        if (spinSound) spinSound.volume = Math.max(0, Math.min(1, sfxVolume / 100));
        if (levelUpSound) levelUpSound.volume = Math.max(0, Math.min(1, sfxVolume / 100)) * 0.4;
        
        const unlock = () => {
            audioReady = true;
            document.removeEventListener('click', unlock);
            document.removeEventListener('touchstart', unlock);
        };
        document.addEventListener('click', unlock);
        document.addEventListener('touchstart', unlock);
    } catch(e) { 
        console.log("Audio not supported"); 
        audioReady = true; 
    }
}

export function stopCurrentMusic() {
    if (currentMusic) {
        currentMusic.pause();
        currentMusic.currentTime = 0;
        currentMusic = null;
    }
}

export function playMusicForLocation(location) {
    if (!audioReady) return;
    const musicFile = locationMusic[location];
    if (!musicFile) return;
    if (currentMusic && currentMusic.src.includes(musicFile) && !currentMusic.paused) return;
    stopCurrentMusic();
    try {
        currentMusic = new Audio(musicFile);
        currentMusic.loop = true;
        currentMusic.volume = Math.max(0, Math.min(1, currentMusicVol / 100));
        if (currentMusicVol > 0) currentMusic.play().catch(e => console.log("Music play error:", e));
    } catch(e) { console.log("Error loading music for", location, e); }
}

export function updateMusicVolume(value) {
    currentMusicVol = value;
    if (currentMusic) {
        if (value <= 1) currentMusic.muted = true;
        else { 
            currentMusic.muted = false; 
            currentMusic.volume = Math.max(0, Math.min(1, value / 100)); 
            if (currentMusic.paused && audioReady) currentMusic.play().catch(e => {}); 
        }
    }
    localStorage.setItem("nekoMusicVol", value);
}

export function updateSFXVolume(value) { 
    sfxVolume = value; 
    if (spinSound) spinSound.volume = Math.max(0, Math.min(1, value / 100)); 
    if (levelUpSound) levelUpSound.volume = Math.max(0, Math.min(1, value / 100)) * 0.4;
    localStorage.setItem("nekoSfxVol", value); 
}

export function playSFX(soundName) {
    if (!audioReady) return;
    if (soundName === 'win_slot' && spinSound && sfxVolume > 0) {
        try { 
            const clone = spinSound.cloneNode(); 
            clone.volume = Math.max(0, Math.min(1, sfxVolume / 100)); 
            clone.play().catch(e => {}); 
        } catch(e) {}
    }
}

export function playLevelUpSound() {
    if (levelUpSound && sfxVolume > 0) {
        try {
            const soundClone = levelUpSound.cloneNode();
            soundClone.volume = Math.max(0, Math.min(1, sfxVolume / 100)) * 0.4;
            soundClone.play().catch(e => console.log("Level up sound error:", e));
        } catch(e) { console.log("Level up sound error"); }
    }
}

export function getMusicVolume() { return currentMusicVol; }
export function getSfxVolume() { return sfxVolume; }
export function isAudioReady() { return audioReady; }