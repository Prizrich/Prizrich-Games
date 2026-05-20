// Система работ
import { characters, jailTasks, tasksData } from './config.js';
import { player, isInJail, isWorking, currentJob, currentTask, jobCount, getCurrentMultiplier, getCurrentRisk, getTasksForCurrentTheme, setIsWorking, setCurrentJob, setCurrentTask, incrementJobCount } from './utils.js';
import { updateUI, saveGame, endWork } from './game.js';
import { sendToJail } from './jail.js';
import { checkAchievements } from './achievements.js';
import { showJobBackground, hideJobBackground } from './effects.js';

export function startRandomJob() {
    // В тюрьме можно работать
    if (isInJail) {
        const randomIndex = Math.floor(Math.random() * jailTasks.length);
        setCurrentTask(jailTasks[randomIndex]);
        setCurrentJob("jail");
        setIsWorking(true);
        showJobBackground("jail");
        document.getElementById("jobHeader").innerHTML = "🔒 ТЮРЬМА 🔒";
        document.getElementById("jobQuestion").innerHTML = `📋 ${currentTask.text}`;
        const choicesDiv = document.getElementById("jobChoices");
        choicesDiv.innerHTML = "";
        currentTask.choices.forEach((choice) => {
            const btn = document.createElement("button");
            btn.className = `choice-work ${choice.danger ? "danger" : ""}`;
            btn.innerText = choice.txt;
            btn.onclick = () => handleWorkChoice(choice);
            choicesDiv.appendChild(btn);
        });
        document.getElementById("jobExitBtn").style.display = "inline-block";
        document.getElementById("jobBtn").style.display = "none";
        document.getElementById("spinBtn").disabled = true;
        return true;
    }
    
    // Обычная работа вне тюрьмы
    const tasksSet = getTasksForCurrentTheme();
    const randomIndex = Math.floor(Math.random() * tasksSet.length);
    setCurrentTask(tasksSet[randomIndex]);
    setCurrentJob(player.currentTheme);
    setIsWorking(true);
    showJobBackground(currentJob);
    
    const jobNames = { forest: "🌲 ЛЕС", cyberpunk: "💜 КИБЕРПАНК", space: "🚀 КОСМОС", church: "⛪ ЦЕРКОВЬ" };
    const jobEmojis = { forest: "🌲", cyberpunk: "💜", space: "🚀", church: "⛪" };
    document.getElementById("jobHeader").innerHTML = `${jobEmojis[currentJob]} ${jobNames[currentJob]} ${jobEmojis[currentJob]}`;
    document.getElementById("jobQuestion").innerHTML = `📋 ${currentTask.text}`;
    const choicesDiv = document.getElementById("jobChoices");
    choicesDiv.innerHTML = "";
    currentTask.choices.forEach((choice) => {
        const btn = document.createElement("button");
        btn.className = `choice-work ${choice.danger ? "danger" : ""}`;
        btn.innerText = choice.txt;
        btn.onclick = () => handleWorkChoice(choice);
        choicesDiv.appendChild(btn);
    });
    document.getElementById("jobExitBtn").style.display = "inline-block";
    document.getElementById("jobBtn").style.display = "none";
    document.getElementById("spinBtn").disabled = true;
    return true;
}

export function handleWorkChoice(choice) {
    let multiplier = getCurrentMultiplier();
    if (player.smallWins) multiplier = Math.max(0.5, multiplier - 0.3);
    let risk = getCurrentRisk();
    let extraRisk = 0;
    if (player.highRisk && choice.danger) extraRisk = 0.15;
    let actualChance = Math.max(0.1, Math.min(0.95, choice.chance - risk - extraRisk));
    const isSuccess = Math.random() < actualChance;
    let reward = isSuccess ? choice.suc : choice.fail;
    reward = Math.floor(reward * multiplier);
    const character = characters[choice.char];
    let jailChance = choice.jailChance || 0;
    if (player.highRisk && choice.danger) jailChance += 0.1;
    const goToJail = !isSuccess && Math.random() < jailChance;
    
    if (isSuccess) { 
        player.money += reward; 
        incrementJobCount(); 
        checkAchievements(); 
        const msg = document.getElementById("msg");
        msg.classList.add("result-win"); 
        msg.innerHTML = `${choice.txt} — УСПЕХ! +${reward}$ ${character ? character.emoji : ""}`; 
    } else { 
        player.money = Math.max(0, player.money + reward); 
        const msg = document.getElementById("msg");
        msg.classList.add("result-lose"); 
        msg.innerHTML = `${choice.txt} — ПРОВАЛ! ${Math.abs(reward)}$ ${character ? character.name : ""}`; 
    }
    
    if (goToJail && !isInJail) sendToJail("За свои \"творческие\" методы работы ");
    
    setTimeout(() => { 
        const msg = document.getElementById("msg");
        msg.classList.remove("result-win"); 
        msg.classList.remove("result-lose"); 
    }, 2500);
    
    updateUI();
    saveGame();
    endWork();
}