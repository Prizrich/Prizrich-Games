const REVIEWS_DB = {
    pepto: {
        authorName: "PETPO",
        positive: [
            "Ого, {product} всего за {price} кристаллов! Да это же халява! 💰",
            "Наконец-то адекватная цена на {product}! PETPO доволен! 👍"
        ],
        negative: [
            "{product} за {price}? Да ты с ума сошёл! Дорого, как у Старлика! 😡",
            "Скидку давай на {product}! Я за такие деньги лучше металлолом куплю! 🛰️"
        ]
    },
    mushroom: {
        authorName: "Гриб",
        positive: [
            "Пчёлы жужжат одобрительно! {product} по цене {price} — успех! 🐝",
            "Берёзовое заражение отступает, видя {product} за {price}! 🌲"
        ],
        negative: [
            "{product} за {price}? По лору это слишком дорого... 🕦",
            "Пчёлы недовольно жужжат! {product} по цене {price} — провал! 🛑"
        ]
    },
    karas: {
        authorName: "KAPACb",
        positive: [
            "{product} по {price} — норм, но минус админу всё равно поставлю! ✍",
            "Контора временно не говна. {product} куплен, но я слежу за тобой... 👁️"
        ],
        negative: [
            "{product} за {price}? ДА ВЫ ОХРЕНЕЛИ! ВЗОРВУ МАГАЗИН! 💥💀",
            "Гриферы уже выехали по твою душу за такую цену на {product}! 🔥"
        ]
    }
};

const NAHIDA_RESPONSES = {
    jokes: [
        "🤖 Заходит Старлик в киберпанк-бар, а бармен ему говорит: 'Мы модераторов с синдромом вахтёра не обслуживаем!'. А Старлик отвечает: 'Я сам этот бар удалю!'",
        "🐟 Знаешь, почему KAPACb играет с Иксреем? Потому что без читов он не может найти даже собственную совесть!",
        "🐝 Купил Гриб пчелу, пытается её отпочковать, а она ему говорит: 'Березовый 5G не ловит, подсоби извне по-братски!'"
    ],
    market_good: "📈 Рынок стабилен! Цены оптимальные, репутация держится. Пчёлы работают отлично, доход идёт!",
    market_bad: "📉 Шухер! KAPACb вовсю спамит гневные отзывы, а Старлик душит налогами. Срочно снижай цены или запускай листовки!",
    default: "🤙 Я на связи! Пиши 'анекдот' — поржём, или 'что по рынку' — раскидаю за экономику.",
    easter: "Ахахаха! Хорош! Напиши это Старлику в ЛС, у него вся серверная консоль синим пламенем сгорит! 😂🔥"
};

const EASTER_RESPONSES = {
    pepto: "Сам иди нафиг! Я вообще-то VIP-покупатель и единственный, кто твои ржавые спутники за кристаллы оценивал! Ты ещё смеешь мне грубить?! 😡 У меня связи на орбите, я твой магазин с радаров сотру!",
    mushroom: "Ассимиляция березовым 5G завершена. Я ухожу в изолятор, с токсинами на коленях общаться не намерен. 🕦 Мои споры уже проникли в твой склад! Готовься к грибной революции! 🍄",
    karas: "ЧЁ СКАЗАЛ?! Всё, твоему улью хана! Мой клан Антегрия уже заходит на сервер со стаками динамита и X-Ray! 💥💀 Я тебя в анархию отправлю, там пчёлы летают задом наперёд!",
    starlik: "Удалить этот магазин со Спавна немедленно! Бан по айпи и железу за жесткое неуважение к администрации проекта! ⛓️❌ Я вызову кибер-отряд, они твой улей в пыль сотрут за 5 секунд! Ха-ха, прощай, неудачник!",
    nahida: "Ахахаха! Хорош! Напиши это Старлику в ЛС, у него вся серверная консоль синим пламенем сгорит! 😂🔥 Я таких рофлов давно не видела! Дай угадаю — он уже бьёт клаву в гневе?"
};

const DEFAULT_RESPONSES = {
    discount: "Ладно, твоя взяла! По старой дружбе оформляю накладные со скидкой 10% на сырье! 🚚",
    expensive: "Ценники ломают LOR Ваниллы! Сбавь кристаллы, или эти спутники улетят обратно на металлолом! 🛰️",
    threat: "Ты мне угрожаешь? Мои боты завалят твою витрину спамом единиц, а базы взорвем динамитом! 😈🔥",
    default: "Понял тебя. Ну, будет повод — спишемся на сервере. 👌"
};

class AIDirector {
    static generateReviewText(slug, productName, isPositive, currentPrice) {
        const character = REVIEWS_DB[slug];
        if (!character) return `${productName} за ${currentPrice} 💎? Норм!`;
        const pool = isPositive ? character.positive : character.negative;
        return pool[Math.floor(Math.random() * pool.length)].replace(/{product}/g, productName).replace(/{price}/g, currentPrice);
    }

    static getMailResponse(contact, message) {
        const lower = message.toLowerCase();
        const isEaster = lower.includes("пошел нахуй") || lower.includes("пошла нахуй") || lower.includes("пшел нахуй") || 
                         lower.includes("пошёл нахуй") || lower.includes("пошла нах") || lower.includes("иди нахуй");

        if (isEaster) {
            const reply = EASTER_RESPONSES[contact] || "Ну и разгружай свои мешки сам! Отменяю поставку! Прощай!";
            return { type: "easter", reply: reply };
        }

        if (contact === "nahida") {
            if (lower.includes("анекдот") || lower.includes("рофл") || lower.includes("шутк")) {
                const jokes = NAHIDA_RESPONSES.jokes;
                return { type: "joke", reply: jokes[Math.floor(Math.random() * jokes.length)] };
            }
            if (lower.includes("рынок") || lower.includes("экономик") || lower.includes("что по рынку")) {
                return { type: "market", reply: NAHIDA_RESPONSES.market_good };
            }
            return { type: "default", reply: NAHIDA_RESPONSES.default };
        }

        const triggers = {
            "скидк": { reply: DEFAULT_RESPONSES.discount },
            "дорог": { reply: DEFAULT_RESPONSES.expensive },
            "цена": { reply: DEFAULT_RESPONSES.expensive },
            "бан": { reply: DEFAULT_RESPONSES.threat },
            "взрыв": { reply: DEFAULT_RESPONSES.threat }
        };

        for (let key in triggers) {
            if (lower.includes(key)) {
                return { type: "trigger", reply: triggers[key].reply };
            }
        }

        return { type: "default", reply: DEFAULT_RESPONSES.default };
    }
}
