// Конфигурация игры
export const FRUITS = ["🍒","🍋","🍊","🍉","🍎","🍓","🍑"];
export const STAR = "⭐";

export const EXP_FOR_LEVEL = {
    1: 0, 2: 100, 3: 220, 4: 360, 5: 520, 6: 700, 7: 900, 8: 1120, 9: 1360, 10: 1620,
    11: 1900, 12: 2200, 13: 2520, 14: 2860, 15: 3220, 16: 3600, 17: 4000, 18: 4420, 19: 4860, 20: 5320
};

export const THEME_UNLOCK = { forest: 1, cyberpunk: 6, space: 11, church: 16 };
export const THEME_MULTIPLIERS = { forest: 1, cyberpunk: 1.5, space: 2, church: 2.5 };
export const THEME_RISK = { forest: 0, cyberpunk: 0.05, space: 0.1, church: 0.15 };
export const themeOrder = ["forest", "cyberpunk", "space", "church"];

export const locationMusic = {
    forest: 'sounds/bg_forest.mp3',
    cyberpunk: 'sounds/Cyberpunk_location.mp3',
    space: 'sounds/Space_location.mp3',
    church: 'sounds/Church_location.mp3'
};

export const ALL_MODIFIERS = [
    { id: "noLegend", name: "⭐ Без легендарок", desc: "Легендарные слоты не выпадают", effect: (p) => { p.legendDisabled = true; } },
    { id: "badRep", name: "👺 Плохая репутация", desc: "Шанс успеха на подработках -15%", effect: (p) => { p.badReputation = true; } },
    { id: "smallWin", name: "💰 Жадное казино", desc: "Выигрыши уменьшены на 20%", effect: (p) => { p.smallWins = true; } },
    { id: "highRisk", name: "🎲 Высокий риск", desc: "Рисковые действия опаснее на 25%", effect: (p) => { p.highRisk = true; } }
];

export const characters = {
    beaver: { name: "Бобёр", emoji: "🐿️" }, oracle: { name: "Оракул", emoji: "🐱🔮" },
    goblin: { name: "Гоблин", emoji: "👹" }, bartender: { name: "Бармен", emoji: "🍺" },
    mechanic: { name: "Механик", emoji: "🔧" }, comedian: { name: "Комик", emoji: "🎤" },
    angel: { name: "Ангел", emoji: "😇" }, demon: { name: "Демон", emoji: "😈" }
};

export const tasksData = {
    forest: [
        { text: "🍄 Бобёр-алкоголик просит добавки.", choices: [
            { txt: "🍺 Налить ещё", suc:12, fail:-5, chance:0.7, char:"beaver", danger:false, jailChance:0 },
            { txt: "🍵 Заменить на чай", suc:8, fail:-3, chance:0.8, char:"oracle", danger:false, jailChance:0 },
            { txt: "🚫 Послать лесом", suc:20, fail:-15, chance:0.4, char:"goblin", danger:true, jailChance:0.15 }
        ] },
        { text: "🦉 Сова-психолог жалуется на жизнь.", choices: [
            { txt: "🎧 Сделать вид, что слушаешь", suc:8, fail:-3, chance:0.85, char:"angel", danger:false, jailChance:0 },
            { txt: "🍺 Напоить сову", suc:14, fail:-8, chance:0.6, char:"beaver", danger:false, jailChance:0 },
            { txt: "🦉 Отправить к психотерапевту", suc:6, fail:-10, chance:0.5, char:"comedian", danger:true, jailChance:0.1 }
        ] }
    ],
    cyberpunk: [
        { text: "🤖 Кибер-собака грызет провода.", choices: [
            { txt: "🔧 Перепрограммировать", suc:20, fail:-15, chance:0.55, char:"mechanic", danger:false, jailChance:0 },
            { txt: "🍖 Кинуть мясо", suc:14, fail:-8, chance:0.7, char:"comedian", danger:false, jailChance:0 },
            { txt: "💥 Ударить током", suc:25, fail:-22, chance:0.4, char:"demon", danger:true, jailChance:0.2 }
        ] },
        { text: "👾 Хакер взломал слоты.", choices: [
            { txt: "💻 Устроить кибервойну", suc:22, fail:-18, chance:0.5, char:"goblin", danger:true, jailChance:0.25 },
            { txt: "🍺 Отключить всё и выпить", suc:12, fail:-8, chance:0.65, char:"bartender", danger:false, jailChance:0 },
            { txt: "🤝 Предложить работу", suc:18, fail:-10, chance:0.6, char:"oracle", danger:false, jailChance:0 }
        ] }
    ],
    space: [
        { text: "🚀 Пришелец не понимает земных денег.", choices: [
            { txt: "🛸 Договориться жестами", suc:16, fail:-10, chance:0.65, char:"oracle", danger:false, jailChance:0 },
            { txt: "📦 Дать коробку 'сюрприз'", suc:22, fail:-18, chance:0.45, char:"demon", danger:true, jailChance:0.25 },
            { txt: "🍕 Угостить пиццей", suc:12, fail:-6, chance:0.7, char:"comedian", danger:false, jailChance:0 }
        ] },
        { text: "🧑‍🚀 Космонавт потерял скафандр.", choices: [
            { txt: "🎯 Надеть мусорный пакет", suc:18, fail:-12, chance:0.55, char:"goblin", danger:true, jailChance:0.2 },
            { txt: "🛠 Починить из подручных средств", suc:15, fail:-8, chance:0.7, char:"mechanic", danger:false, jailChance:0 },
            { txt: "👽 Сдать его пришельцам", suc:25, fail:-20, chance:0.4, char:"demon", danger:true, jailChance:0.35 }
        ] }
    ],
    church: [
        { text: "⛪ Священник тайно играет в слоты.", choices: [
            { txt: "🙏 Сделать вид, что не заметил", suc:10, fail:-5, chance:0.8, char:"angel", danger:false, jailChance:0 },
            { txt: "🍷 Шантажировать", suc:18, fail:-12, chance:0.55, char:"bartender", danger:false, jailChance:0.3 },
            { txt: "🕯️ Устроить экзорцизм", suc:25, fail:-20, chance:0.45, char:"demon", danger:true, jailChance:0.35 }
        ] },
        { text: "🕯️ В церкви закончились свечи.", choices: [
            { txt: "🔦 Включить фонарики", suc:14, fail:-8, chance:0.7, char:"mechanic", danger:false, jailChance:0 },
            { txt: "🔥 Развести костёр из икон", suc:20, fail:-15, chance:0.5, char:"goblin", danger:true, jailChance:0.25 },
            { txt: "🙏 Молиться в темноте", suc:8, fail:-4, chance:0.8, char:"oracle", danger:false, jailChance:0 }
        ] }
    ]
};

export const jailTasks = [
    { text: "🧹 Убирать камеры", choices: [
        { txt: "🧹 Работать честно", suc:5, fail:-3, chance:0.6, char:"beaver", danger:false, jailChance:0 },
        { txt: "🏃 Попытаться сбежать", suc:0, fail:-20, chance:0.2, char:"goblin", danger:true, jailChance:0.8 }
    ] },
    { text: "🍲 Раздавать еду заключённым", choices: [
        { txt: "🍲 Раздавать честно", suc:6, fail:-2, chance:0.7, char:"angel", danger:false, jailChance:0 },
        { txt: "🍴 Украсть еду", suc:10, fail:-15, chance:0.35, char:"demon", danger:true, jailChance:0.5 }
    ] },
    { text: "📚 Помогать в тюремной библиотеке", choices: [
        { txt: "📖 Складывать книги", suc:7, fail:-1, chance:0.8, char:"oracle", danger:false, jailChance:0 },
        { txt: "🔨 Сломать стеллаж", suc:0, fail:-25, chance:0.15, char:"goblin", danger:true, jailChance:0.9 }
    ] }
];
