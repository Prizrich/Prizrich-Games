// Данные игрока и чистые функции-геттеры
import { EXP_FOR_LEVEL, THEME_MULTIPLIERS, THEME_RISK, themeOrder, THEME_UNLOCK, tasksData } from './config.js';

// === СОСТОЯНИЕ ИГРОКА ===
export let player = {
    level: 1, money: 200, exp: 0, hasAmulet: false, hasCursedCoin: false, 
    defeatedBoss: false, currentTheme: "forest",
    legendDisabled: false, badReputation: false, smallWins: false, highRisk: false
};

// === ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ===
export let spinCount = 0;
export let legendCount = 0;
export let jobCount = 0;
export let gameCompleted = false;
export let isInJail = false;
export let bailAmount = 120;
export let isSpinning = false;
export let isWorking = false;
export let currentJob = null;
export let currentTask = null;
export let canSave = false;
export let activeModifiers = [];

// === ФУНКЦИИ ДЛЯ ИЗМЕНЕНИЯ СОСТОЯНИЯ (используются только внутри системы) ===
export function setCanSave(value) { canSave = value; }
export function setGameCompleted(value) { gameCompleted = value; }
export function setIsInJail(value) { isInJail = value; }
export function setIsSpinning(value) { isSpinning = value; }
export function setIsWorking(value) { isWorking = value; }
export function setCurrentJob(value) { currentJob = value; }
export function setCurrentTask(value) { currentTask = value; }
export function incrementSpinCount() { spinCount++; }
export function incrementLegendCount() { legendCount++; }
export function incrementJobCount() { jobCount++; }
export function setPlayer(newPlayer) { Object.assign(player, newPlayer); }
export function setActiveModifiers(mods) { activeModifiers.length = 0; mods.forEach(m => activeModifiers.push(m)); }

// === ГЕТТЕРЫ ===
export function getCurrentBet() {
    if (player.currentTheme === "forest") return 20;
    if (player.level >= 16) return 120;
    if (player.level >= 11) return 90;
    if (player.level >= 6) return 60;
    return 40;
}

export function getCurrentMultiplier() { 
    return THEME_MULTIPLIERS[player.currentTheme] || 1; 
}

export function getCurrentRisk() { 
    let baseRisk = THEME_RISK[player.currentTheme] || 0; 
    if (player.badReputation) baseRisk += 0.15; 
    if (player.highRisk) baseRisk += 0.1; 
    return Math.min(0.7, baseRisk); 
}

export function getLocationPenalty() {
    if (player.currentTheme === "cyberpunk") return 0.80;
    if (player.currentTheme === "space") return 0.65;
    if (player.currentTheme === "church") return 0.50;
    return 1.0;
}

export function getExpPenalty() {
    if (player.currentTheme === "cyberpunk") return 0.80;
    if (player.currentTheme === "space") return 0.65;
    if (player.currentTheme === "church") return 0.50;
    return 1.0;
}

export function getLegendChance() {
    let chance = player.hasAmulet ? 0.025 : 0.015;
    if (player.currentTheme === "cyberpunk") chance *= 0.9;
    if (player.currentTheme === "space") chance *= 0.8;
    if (player.currentTheme === "church") chance *= 0.7;
    if (player.legendDisabled) chance = 0;
    return chance;
}

export function getTasksForCurrentTheme() {
    if (!player.currentTheme || !tasksData[player.currentTheme]) return tasksData.forest;
    return tasksData[player.currentTheme];
}

export function isLocationUnlocked(theme) {
    return player.level >= THEME_UNLOCK[theme];
}

export function canAccessTheme(theme) {
    const currentIndex = themeOrder.indexOf(player.currentTheme);
    const clickedIndex = themeOrder.indexOf(theme);
    return clickedIndex >= currentIndex && isLocationUnlocked(theme);
}

export function getExpNeededForNextLevel() {
    if (player.level >= 20) return 0;
    const need = EXP_FOR_LEVEL[player.level+1] - EXP_FOR_LEVEL[player.level];
    const current = player.exp - EXP_FOR_LEVEL[player.level];
    return Math.min(current, need);
}

export function getTotalExpForNextLevel() {
    if (player.level >= 20) return 0;
    return EXP_FOR_LEVEL[player.level+1] - EXP_FOR_LEVEL[player.level];
}