// Визуальные эффекты
export const effects = {
    forest: () => {
        let h = ''; 
        for(let i=0;i<8;i++) h += `<div class="tree" style="left:${Math.random()*100}%; bottom:${Math.random()*40}%; font-size:${Math.random()*3+2}rem">${['🌲','🌳','🎄'][i%3]}</div>`; 
        for(let i=0;i<20;i++) h += `<div class="leaf" style="left:${Math.random()*100}%; animation-delay:${Math.random()*8}s">${['🍃','🌿','🍂'][i%3]}</div>`; 
        return h;
    },
    cyberpunk: () => {
        let h = ''; 
        for(let i=0;i<5;i++) h += `<div class="neon-line" style="top:${i*15+10}%"></div>`; 
        for(let i=0;i<12;i++) h += `<div class="glitch" style="left:${Math.random()*100}%; top:${Math.random()*100}%; font-size:${Math.random()*2+1}rem; color:${['#0ff','#f0f','#ff0'][i%3]}">${['#','%','&','@','$'][i%5]}</div>`; 
        return h;
    },
    space: () => {
        let h = ''; 
        for(let i=0;i<100;i++) h += `<div class="star" style="left:${Math.random()*100}%; top:${Math.random()*100}%; width:${Math.random()*2+1}px; height:${Math.random()*2+1}px;"></div>`; 
        for(let i=0;i<4;i++) h += `<div class="shooting" style="top:${Math.random()*50}%; left:100%"></div>`; 
        return h;
    },
    church: () => {
        let h = ''; 
        for(let i=0;i<5;i++) h += `<div class="stained" style="left:${Math.random()*100}%; top:${Math.random()*100}%; width:${Math.random()*150+80}px; height:${Math.random()*150+80}px"></div>`; 
        for(let i=0;i<4;i++) h += `<div class="cross" style="left:${Math.random()*80+10}%; top:${Math.random()*60+20}%; font-size:${Math.random()*3+2}rem">✝</div>`; 
        return h;
    }
};

export function applyThemeBackground(theme) {
    const container = document.getElementById("bgEffects");
    if (container) { 
        container.innerHTML = ""; 
        if (effects[theme]) container.innerHTML = effects[theme](); 
    }
}

export function showJobBackground(jobType) {
    const jobBg = document.getElementById("jobBg");
    jobBg.className = "job-background";
    if (jobType === "forest") jobBg.classList.add("bar");
    else if (jobType === "cyberpunk") jobBg.classList.add("repair");
    else if (jobType === "space") jobBg.classList.add("standup");
    else if (jobType === "church") jobBg.classList.add("bar");
    else if (jobType === "jail") jobBg.classList.add("bar");
    setTimeout(() => jobBg.classList.add("active"), 50);
}

export function hideJobBackground() { 
    const jobBg = document.getElementById("jobBg");
    jobBg.classList.remove("active"); 
    setTimeout(() => { jobBg.className = "job-background bar"; }, 500); 
}

export function showLevelUpNotification(level) {
    const notification = document.createElement("div");
    notification.className = "levelup-notification";
    notification.innerHTML = `🎉 УРОВЕНЬ ${level}! 🎉`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
}

export function showLocationUnlockNotification(theme, multiplier, onComplete) {
    const names = { forest: "🌲 ЛЕС", cyberpunk: "💜 КИБЕРПАНК", space: "🚀 КОСМОС", church: "⛪ ЦЕРКОВЬ" };
    const notification = document.createElement("div");
    notification.className = "location-unlock-notification";
    notification.innerHTML = `<div>✨ НОВАЯ ЛОКАЦИЯ ОТКРЫТА! ✨</div>
        <div class="loc-name">${names[theme]}</div>
        <div class="loc-multiplier">Множитель x${multiplier}</div>
        <div style="font-size:0.8rem; margin-top:8px;">🚫 СТАРЫЕ ЛОКАЦИИ НАВСЕГДА ЗАБЛОКИРОВАНЫ 🚫</div>
        <div style="font-size:0.8rem; margin-top:4px;">🔄 Автоматический переход...</div>`;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
        if (onComplete) onComplete();
    }, 2500);
}