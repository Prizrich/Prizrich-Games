// События уровней
import { player } from './utils.js';
import { updateUI, saveGame } from './game.js';
import { checkAchievements } from './achievements.js';
import { playLevelUpSound } from './audio.js';

export let pendingLevelUpEvent = null;
export let isModalOpen = false;

export const levelEvents = {
    2: { title: "🌲 ВСТРЕЧА В ЛЕСУ", text: "Бобёр в смокинге предлагает сделку", choices: [
        { txt: "🃏 Сыграть", eff: (p) => { p.money += 30; return "+30$"; } },
        { txt: "🍺 Угостить", eff: (p) => { p.money -= 15; p.exp += 15; return "+15 exp"; } },
        { txt: "🏃 Убежать", eff: (p) => { p.exp += 5; return "+5 exp"; } }
    ] },
    3: { title: "💀 ПРОКЛЯТЫЙ АВТОМАТ", text: "Старый слот манит...", choices: [
        { txt: "🎰 Крутануть", eff: (p) => { if(Math.random()<0.5){ p.money+=80; return "+80$"; } else { p.money-=40; p.hasCursedCoin=true; return "Проклятие!"; } } },
        { txt: "🔨 Разбить", eff: (p) => { p.money+=20; p.exp+=10; return "+20$, +10 exp"; } },
        { txt: "🙏 Помолиться", eff: (p) => { p.exp+=20; return "+20 exp"; } }
    ] },
    4: { title: "🔮 ОРАКУЛ-КОШКА", text: "Кошка предсказывает...", choices: [
        { txt: "✨ Амулет за 30$", eff: (p) => { p.money-=30; p.hasAmulet=true; return "Амулет!"; } },
        { txt: "🐟 Рыба", eff: (p) => { p.exp+=25; return "+25 exp"; } },
        { txt: "🤨 Игнор", eff: (p) => { p.money-=10; return "-10$"; } }
    ] },
    5: { title: "🏛️ ПОДЗЕМНОЕ КАЗИНО", text: "Гоблины зовут...", choices: [
        { txt: "🕳️ Спуститься", eff: (p) => { p.money+=50; p.exp+=15; return "+50$, +15 exp"; } },
        { txt: "💣 Граната", eff: (p) => { p.money+=100; p.exp+=5; return "+100$, +5 exp"; } },
        { txt: "📞 Полиция", eff: (p) => { p.exp+=30; return "+30 exp"; } }
    ] },
    6: { title: "🎭 ТЕАТР АБСУРДА", text: "Три Поросёнка играют в слоты", choices: [
        { txt: "🎭 Стать актёром", eff: (p) => { p.money+=40; p.exp+=20; return "+40$, +20 exp"; } },
        { txt: "🍿 Смотреть", eff: (p) => { p.exp+=25; return "+25 exp"; } },
        { txt: "🔥 Поджечь", eff: (p) => { p.money-=30; p.exp+=10; return "-30$, +10 exp"; } }
    ] },
    7: { title: "🃏 НАПЁРСТКИ", text: "Мошенник ждёт", choices: [
        { txt: "🎲 Играть", eff: (p) => { if(Math.random()<0.4){ p.money+=150; return "+150$"; } else { p.money-=50; return "-50$"; } } },
        { txt: "🥊 Удар", eff: (p) => { p.money+=70; p.exp+=10; return "+70$, +10 exp"; } },
        { txt: "📸 Фото", eff: (p) => { p.exp+=35; return "+35 exp"; } }
    ] },
    8: { title: "🍄 ГРИБНАЯ ПОЛЯНА", text: "Поющие грибы танцуют", choices: [
        { txt: "🍄 Съесть", eff: (p) => { p.money+=100; p.exp+=30; return "+100$, +30 exp"; } },
        { txt: "📝 Рисовать", eff: (p) => { p.exp+=45; return "+45 exp"; } },
        { txt: "🔥 Сжечь", eff: (p) => { p.money-=20; return "-20$"; } }
    ] },
    9: { title: "👑 АНГЕЛ И ДЕМОН", text: "Небесные силы спорят о тебе", choices: [
        { txt: "😇 Ангел", eff: (p) => { p.money+=200; p.hasAmulet=true; return "+200$, амулет!"; } },
        { txt: "😈 Демон", eff: (p) => { p.money+=300; p.hasCursedCoin=true; return "+300$, проклятие!"; } },
        { txt: "🍕 Пицца", eff: (p) => { p.money+=50; p.exp+=50; return "+50$, +50 exp"; } }
    ] },
    10: { title: "🌟 СТАТУС: ОПЫТНЫЙ АВАНТЮРИСТ", text: "Ты достиг 10 уровня! Мир уважает тебя...", choices: [
        { txt: "🎉 Отпраздновать", eff: (p) => { p.money+=100; p.exp+=50; return "+100$, +50 exp"; } },
        { txt: "🙏 Продолжить путь", eff: (p) => { p.exp+=80; return "+80 exp"; } },
        { txt: "🍺 Выпить за это", eff: (p) => { p.money+=50; return "+50$"; } }
    ] },
    11: { title: "🚀 ПОРТАЛ В КОСМОС", text: "Ты открыл доступ к космическим мирам!", choices: [
        { txt: "✨ Исследовать", eff: (p) => { p.money+=150; p.exp+=40; return "+150$, +40 exp"; } },
        { txt: "👽 Встретить пришельцев", eff: (p) => { p.money+=100; p.exp+=30; return "+100$, +30 exp"; } },
        { txt: "🚀 Вернуться", eff: (p) => { p.exp+=20; return "+20 exp"; } }
    ] },
    12: { title: "💜 КИБЕР-ПАНКОВАЯ ВЕЧЕРИНКА", text: "Неоновые огни слепят глаза...", choices: [
        { txt: "🎧 Танцевать", eff: (p) => { p.money+=120; p.exp+=35; return "+120$, +35 exp"; } },
        { txt: "💻 Взломать банкомат", eff: (p) => { if(Math.random()<0.5){ p.money+=300; return "+300$"; } else { p.money-=150; return "-150$"; } } },
        { txt: "🍺 Пить кибер-пиво", eff: (p) => { p.exp+=25; return "+25 exp"; } }
    ] },
    13: { title: "⛪ ТАЙНЫ ЦЕРКВИ", text: "Древние секреты открываются...", choices: [
        { txt: "🕯️ Помолиться", eff: (p) => { p.exp+=50; return "+50 exp"; } },
        { txt: "💰 Пожертвовать 200$", eff: (p) => { p.money-=200; p.exp+=100; return "-200$, +100 exp"; } },
        { txt: "🔥 Сжечь икону", eff: (p) => { p.money+=150; p.exp+=20; return "+150$, +20 exp (грех!)"; } }
    ] },
    14: { title: "🎰 ДЖЕКПОТ НА ГОРИЗОНТЕ", text: "Удача улыбается тебе!", choices: [
        { txt: "🍀 Поверить в удачу", eff: (p) => { p.money+=200; p.exp+=60; return "+200$, +60 exp"; } },
        { txt: "🎲 Сыграть ва-банк", eff: (p) => { if(Math.random()<0.6){ p.money+=500; return "+500$"; } else { p.money-=200; return "-200$"; } } },
        { txt: "🙏 Попросить богов", eff: (p) => { p.exp+=40; return "+40 exp"; } }
    ] },
    15: { title: "👑 СТАТУС: ЛЕГЕНДА КАЗИНО", text: "Твоё имя знают все!", choices: [
        { txt: "🎉 Устроить праздник", eff: (p) => { p.money+=300; p.exp+=80; return "+300$, +80 exp"; } },
        { txt: "🍀 Раздать автографы", eff: (p) => { p.money+=100; p.exp+=50; return "+100$, +50 exp"; } },
        { txt: "🎰 Продолжать играть", eff: (p) => { p.exp+=100; return "+100 exp"; } }
    ] },
    16: { title: "🌸 ЦВЕТУЩАЯ ЦЕРКОВЬ", text: "Ты достиг святых земель!", choices: [
        { txt: "🙏 Благословение", eff: (p) => { p.money+=250; p.exp+=70; return "+250$, +70 exp"; } },
        { txt: "💰 Строить храм", eff: (p) => { p.money-=500; p.exp+=200; return "-500$, +200 exp"; } },
        { txt: "🍷 Испить святой воды", eff: (p) => { p.exp+=60; return "+60 exp"; } }
    ] },
    17: { title: "🐉 ДРАКОН УДАЧИ", text: "Мифическое существо предлагает сделку", choices: [
        { txt: "🔥 Принять вызов", eff: (p) => { if(Math.random()<0.5){ p.money+=800; return "+800$"; } else { p.money-=300; return "-300$"; } } },
        { txt: "🐟 Дать рыбу", eff: (p) => { p.money+=200; p.exp+=60; return "+200$, +60 exp"; } },
        { txt: "🏃 Убежать", eff: (p) => { p.exp+=30; return "+30 exp"; } }
    ] },
    18: { title: "⭐ ЗВЕЗДА СЛОТОВ", text: "Ты почти у цели!", choices: [
        { txt: "✨ Принять судьбу", eff: (p) => { p.money+=400; p.exp+=100; return "+400$, +100 exp"; } },
        { txt: "🎰 Последний спин", eff: (p) => { p.money+=200; p.exp+=80; return "+200$, +80 exp"; } },
        { txt: "🍺 Отдохнуть", eff: (p) => { p.exp+=50; return "+50 exp"; } }
    ] }
};

export function showLevelUpEvent(newLevel) {
    const event = levelEvents[newLevel];
    if (!event) return;
    const modal = document.getElementById("storyModal");
    const modalText = document.getElementById("modalText");
    const modalChoices = document.getElementById("modalChoices");
    isModalOpen = true;
    modalText.innerHTML = `<h3>${event.title}</h3><p>${event.text}</p>`;
    modalChoices.innerHTML = "";
    event.choices.forEach((choice) => {
        const btn = document.createElement("button");
        btn.className = "choice-btn";
        btn.innerText = choice.txt;
        btn.onclick = () => {
            const result = choice.eff(player);
            modalText.innerHTML = `<h3>📜 РЕЗУЛЬТАТ</h3><p>${result}</p><button class="choice-btn" id="closeEventModalBtn">✨ ПРОДОЛЖИТЬ ✨</button>`;
            modalChoices.innerHTML = "";
            document.getElementById("closeEventModalBtn").onclick = () => {
                modal.style.display = "none";
                isModalOpen = false;
                updateUI();
                saveGame();
                checkAchievements();
                checkAndShowPendingEvent();
            };
        };
        modalChoices.appendChild(btn);
    });
    modal.style.display = "flex";
    updateUI();
}

export function checkAndShowPendingEvent() {
    if (pendingLevelUpEvent && !isModalOpen) { 
        showLevelUpEvent(pendingLevelUpEvent); 
        pendingLevelUpEvent = null; 
    }
}