class MarketEngine {
    constructor(state) {
        this.state = state;
    }

    applyMarketing() {
        if (this.state.money < 500) {
            showAlert("❌ Не хватает 500 💎 на рекламную кампанию!");
            return false;
        }
        this.state.money -= 500;
        this.state.marketingBonus = 1.4;
        addMailMessage("system", "📢 Реклама успешно запущена на всем Спавне! Покупатели повалят завтра!", true);
        return true;
    }

    simulateSales() {
        let report = { revenue: 0, exp: 0, itemsSold: 0 };

        this.state.products.forEach(prod => {
            if (prod.quantity <= 0) return;

            const markup = prod.userPrice / prod.basePrice;
            let priceFactor = 1.0;
            
            if (markup > 1.4) priceFactor = 0.3;
            else if (markup < 0.8) priceFactor = 1.6;
            else if (markup < 1.1) priceFactor = 1.1;

            const repFactor = 0.4 + (this.state.reputation / 100);
            let potentialSales = Math.floor(Math.random() * 3) + 1;
            
            let finalSales = Math.floor(potentialSales * priceFactor * repFactor * this.state.marketingBonus);
            finalSales = Math.max(0, Math.min(finalSales, prod.quantity));

            if (finalSales > 0) {
                let itemRevenue = finalSales * prod.userPrice;
                report.revenue += itemRevenue;
                report.itemsSold += finalSales;
                report.exp += finalSales * prod.expReward;
                prod.quantity -= finalSales;

                if (markup > 1.4) updateReputation(-3);
                else if (markup <= 1.1) updateReputation(2);
            }
        });

        updateMoney(Math.floor(report.revenue));
        addExp(report.exp);
        this.state.marketingBonus = 1.0;

        const reviewCount = Math.min(3, report.itemsSold);
        for (let i = 0; i < reviewCount; i++) {
            generateRandomReview();
        }

        return report;
    }

    rivalSabotage() {
        if (this.state.defeatedRival) return;

        if (Math.random() < 0.40) {
            let loss = Math.floor(Math.random() * 250) + 50;
            this.state.money = Math.max(0, this.state.money - loss);
            updateReputation(-4);
            
            addMailMessage("starlik", `😈 Ха-ха! Мои кибер-боты обрушили тебе рейтинг! Убытки: -${loss} 💎!`, true);
            
            if (Math.random() < 0.50) {
                addCompromat(15);
                addMailMessage("system", "🔍 Перехвачены логи бот-атаки Карася! Компромат +15%!", true);
            }
        }
    }

    sueRival() {
        if (this.state.defeatedRival) return false;
        if (this.state.compromat < GAME_CONFIG.compromatNeeded) {
            showAlert("⚖️ Недостаточно улик! Накопи 100% компромата, перехватывая набеги Карася!");
            return false;
        }

        this.state.defeatedRival = true;
        this.state.rivalPower = 0;
        this.state.compromat = 100;
        
        updateMoney(8000);
        updateReputation(40);
        
        const courtWindow = document.getElementById("court-window");
        if (courtWindow) {
            courtWindow.innerHTML = `
                <div style="text-align:center; padding:20px;">
                    <h2 style="color:#d62828;">⚖️ СУД СВЕРШИЛСЯ! ⚖️</h2>
                    <p><b>Старлик официально отправлен в бан за коррупцию, кумовство и набеги ботов!</b></p>
                    <p style="font-size:3rem;">⛓️👨‍💼⛓️</p>
                    <p style="color:#2e7d32; font-weight:bold;">Усатый Пчёл утер нос киберпанк-диктатуре! Вы победили!</p>
                </div>
            `;
        }
        
        showAlert("🎉 ФИНАЛЬНАЯ МИССИЯ ВЫПОЛНЕНА! Папка с компроматом передана. Старлик забанен!");
        return true;
    }
}

let gameState = {
    money: GAME_CONFIG.startMoney,
    level: 1,
    exp: 0,
    reputation: GAME_CONFIG.startReputation,
    compromat: 0,
    rivalPower: 50,
    marketingBonus: 1.0,
    activeContact: "system",
    defeatedRival: false,
    products: [],
    chats: {
        system: [{ text: "📢 Добро пожаловать в мессенджер BBM! Управляй ульем, закупай товары и развивай свой медовый бизнес без чужой диктатуры! 🛠️🐝", time: "Система", incoming: true }],
        nahida: [{ text: "👋 Здарова! Я тут чекаю рынок Спавна. Если скучно — пиши 'анекдот' или 'что по рынку'!", time: "Нахида", incoming: true }],
        pepto: [{ text: "👀 Эй, хозяин! Цены кусаются... Скинь кристаллы за спутник Пепто!", time: "Пепто", incoming: true }],
        mushroom: [{ text: "🍄 Привет-привет! Как там пчёлы? Почкуются у алтаря?", time: "Гриб", incoming: true }],
        karas: [{ text: "🐟 Чё по чем? Дороговато у тебя... Мой клан Антегрия следит за витриной.", time: "Карась", incoming: true }],
        starlik: [{ text: "😈 Ха-ха! Твой магазин скоро закроется, мой киберпанк-спавн сожрет этот улей!", time: "Старлик", incoming: true }]
    }
};

const engine = new MarketEngine(gameState);

function loadLevelProducts() {
    gameState.products = [];
    for (let l = 1; l <= gameState.level; l++) {
        if (GAME_CONFIG.shopItemsByLevel[l]) {
            GAME_CONFIG.shopItemsByLevel[l].forEach(item => {
                gameState.products.push({
                    ...item,
                    quantity: 10,
                    userPrice: item.basePrice
                });
            });
        }
    }
}

function updateUI() {
    document.getElementById("stat-money").innerText = Math.floor(gameState.money);
    document.getElementById("stat-level").innerText = gameState.level;
    document.getElementById("stat-exp").innerText = gameState.exp;
    document.getElementById("stat-reputation").innerText = gameState.reputation;
    
    document.getElementById("rival-progress").value = gameState.rivalPower;
    document.getElementById("compromat-progress").value = gameState.compromat;
}

function renderShowcaseProducts() {
    const box = document.getElementById("products-container");
    if (!box) return;
    box.innerHTML = "";

    gameState.products.forEach(p => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `
            <h4>${p.name}</h4>
            <p style="font-size:0.75rem; margin:2px 0;">Склад: <b id="stock-${p.id}">${p.quantity} шт.</b></p>
            <p style="font-size:0.7rem; color:#666;">Закупка: ${p.cost} 💎</p>
            <input type="number" class="price-input" id="price-of-${p.id}" value="${p.userPrice}" onchange="changeProductPrice('${p.id}', this.value)">
            <button class="small-btn" style="width:100%; margin-top:5px;" onclick="openRestockModal('${p.id}')">📦 Закупка</button>
        `;
        box.appendChild(card);
    });
}

function changeProductPrice(id, newPrice) {
    const item = gameState.products.find(p => p.id === id);
    if (item && newPrice > 0) item.userPrice = parseInt(newPrice);
}

function addMailMessage(contact, text, incoming) {
    if (!gameState.chats[contact]) {
        gameState.chats[contact] = [];
    }
    gameState.chats[contact].push({ text: text, time: "Только что", incoming: incoming });
    if (gameState.activeContact === contact) {
        renderChatMessages();
    }
}

function sendMailMessage() {
    const input = document.getElementById("mail-input-field");
    if (!input || input.value.trim() === "") return;

    const userText = input.value.trim();
    const contact = gameState.activeContact;

    gameState.chats[contact].push({ text: userText, time: "Вы", incoming: false });
    input.value = "";
    renderChatMessages();

    setTimeout(() => {
        const response = AIDirector.getMailResponse(contact, userText);
        gameState.chats[contact].push({ text: response.reply, time: "Только что", incoming: true });
        renderChatMessages();
    }, 800);
}

function clearCurrentChat() {
    const contact = gameState.activeContact;
    showConfirm(`Вы уверены, что хотите стереть логи переписки с [${contact.toUpperCase()}]?`, () => {
        gameState.chats[contact] = [];
        gameState.chats[contact].push({ 
            text: "🧹 Логи BBM успешно стерты. Хакерская защита активна, Старлик ничего не узнает!", 
            time: "BBM Безопасность", 
            incoming: true 
        });
        renderChatMessages();
    });
}

function renderChatMessages() {
    const box = document.getElementById("chat-messages-box");
    if (!box) return;
    box.innerHTML = "";

    const activeList = gameState.chats[gameState.activeContact] || [];
    activeList.forEach(m => {
        const msgNode = document.createElement("div");
        msgNode.className = `mail-message ${m.incoming ? "incoming" : "outgoing"}`;
        msgNode.innerHTML = `<div class="message-text">${m.text}</div><div class="message-time">${m.time}</div>`;
        box.appendChild(msgNode);
    });
    box.scrollTop = box.scrollHeight;
}

function selectContact(slug, element) {
    gameState.activeContact = slug;
    document.getElementById("current-contact-title").innerText = slug.toUpperCase();
    
    const nodes = document.querySelectorAll(".mail-contact");
    nodes.forEach(n => n.classList.remove("active"));
    
    if (element) {
        element.classList.add("active");
    }
    renderChatMessages();
}

function switchTab(tab) {
    const contents = document.querySelectorAll(".window-content");
    const tabs = document.querySelectorAll(".window-tab");
    
    contents.forEach(c => c.classList.remove("active"));
    tabs.forEach(t => t.classList.remove("active"));

    const target = document.getElementById(`${tab}-window`);
    if (target) target.classList.add("active");
    
    if (window.event && window.event.currentTarget) {
        window.event.currentTarget.classList.add("active");
    }
}

function triggerNextDay() {
    document.getElementById("day-loading-screen").style.display = "flex";

    setTimeout(() => {
        const report = engine.simulateSales();
        engine.rivalSabotage();
        
        updateUI();
        renderShowcaseProducts();
        
        document.getElementById("day-loading-screen").style.display = "none";
        showAlert(`Новый день настал!\nВыручка: +${Math.floor(report.revenue)} 💎\nОпыт: +${report.exp}`);
    }, 600);
}

function triggerMarketing() { 
    if (engine.applyMarketing()) updateUI(); 
}

function triggerLawsuit() { 
    engine.sueRival(); 
    updateUI(); 
}

function updateMoney(amount) { 
    gameState.money += amount; 
}

function updateReputation(amount) { 
    gameState.reputation = Math.max(0, Math.min(100, gameState.reputation + amount)); 
}

function addExp(amount) {
    gameState.exp += amount;
    const required = 1000 * gameState.level;
    if (gameState.exp >= required && gameState.level < 4) {
        gameState.exp = 0;
        gameState.level++;
        loadLevelProducts();
        showAlert(`Поздравляем! Уровень улья повышен до ${gameState.level}! Открыты новые товары!`);
    }
    if (gameState.exp >= 1000 * gameState.level) gameState.exp = 1000 * gameState.level;
}

function addCompromat(amount) { 
    gameState.compromat = Math.min(100, gameState.compromat + amount); 
}

function generateRandomReview() {
    const authorMap = {
        "Пепто": "pepto",
        "Гриб": "mushroom",
        "Карась": "karas"
    };
    const authorNames = Object.keys(authorMap);
    const authorName = authorNames[Math.floor(Math.random() * authorNames.length)];
    const slug = authorMap[authorName];
    const prod = gameState.products[Math.floor(Math.random() * gameState.products.length)];
    
    if (!prod) return;
    const isPositive = (prod.userPrice / prod.basePrice) <= 1.35;
    const txt = AIDirector.generateReviewText(slug, prod.name, isPositive, prod.userPrice);

    const box = document.getElementById("reviews-container-box");
    if (!box) return;
    
    const card = document.createElement("div");
    card.className = "review-item";
    card.style.borderLeft = isPositive ? "5px solid #4caf50" : "5px solid #f44336";
    card.innerHTML = `
        <div class="review-author">👤 ${authorName} <span class="review-rating">${isPositive?'⭐⭐⭐⭐⭐':'⭐'}</span></div>
        <p class="review-text"><b>[${prod.name}]:</b> ${txt}</p>
        <div class="review-time">Только что на Спавне</div>
    `;
    box.insertBefore(card, box.firstChild);
}

function openRestockModal(id) {
    const p = gameState.products.find(item => item.id === id);
    const box = document.getElementById("supplier-items-list");
    
    box.innerHTML = `
        <div class="purchase-item">
            <div class="purchase-info">
                <span>${p.name}</span>
                <small style="display:block; color:#7a5f33; margin-top:4px;">На складе: ${p.quantity} шт.</small>
            </div>
            <div class="purchase-item-controls">
                <div class="amount-picker">
                    <label>Купить (шт):</label>
                    <input type="number" id="restock-items-count" value="1" min="1" max="100" oninput="recalculateRestockCost('${p.id}')">
                </div>
                <div class="cost-tag">Итого к оплате: <b id="restock-total-cost">${p.cost}</b> 💎</div>
                <button class="small-btn buy-confirm-btn" onclick="buyCustomItems('${p.id}')">📦 Подтвердить закупку</button>
            </div>
        </div>
    `;
    document.getElementById("supplier-modal").classList.add("active");
}

function recalculateRestockCost(id) {
    const p = gameState.products.find(item => item.id === id);
    const input = document.getElementById("restock-items-count");
    let count = parseInt(input.value);
    
    if (isNaN(count) || count < 1) count = 1;
    
    const totalCost = p.cost * count;
    document.getElementById("restock-total-cost").innerText = totalCost;
}

function buyCustomItems(id) {
    const p = gameState.products.find(item => item.id === id);
    const input = document.getElementById("restock-items-count");
    let count = parseInt(input.value);
    
    if (isNaN(count) || count < 1) count = 1;
    
    const totalCost = p.cost * count;

    if (gameState.money >= totalCost) {
        gameState.money -= totalCost;
        p.quantity += count;
        
        updateUI();
        renderShowcaseProducts();
        closeSupplierModal();
        
        showAlert(`Успешно доставлено ${count} шт. товара со склада Вали! 🚚`);
    } else {
        showAlert("Не хватает кристаллов на закупку такого количества товара!");
    }
}

function closeSupplierModal() { 
    document.getElementById("supplier-modal").classList.remove("active"); 
}

function showAlert(message) {
    const modal = document.getElementById("alert-modal");
    const title = document.getElementById("alert-title");
    const msg = document.getElementById("alert-message");
    const btn = document.querySelector("#alert-modal .action-btn");
    
    title.innerHTML = "🐝 Внимание!";
    msg.innerText = message;
    btn.innerText = "✅ Понятно";
    btn.onclick = function() {
        closeAlertModal();
    };
    modal.style.display = "flex";
}

function closeAlertModal() {
    document.getElementById("alert-modal").style.display = "none";
}

let confirmCallback = null;

function showConfirm(message, callback) {
    const modal = document.getElementById("alert-modal");
    const title = document.getElementById("alert-title");
    const msg = document.getElementById("alert-message");
    const btn = document.querySelector("#alert-modal .action-btn");
    
    title.innerHTML = "❓ Подтверждение";
    msg.innerText = message;
    btn.innerText = "✅ Да, уверен";
    confirmCallback = callback;
    
    btn.onclick = function() {
        closeAlertModal();
        if (confirmCallback) {
            confirmCallback();
            confirmCallback = null;
        }
        btn.innerText = "✅ Понятно";
    };
    modal.style.display = "flex";
}

function startGameEngine() {
    console.log("Движок Mustache Bee успешно запущен!");
    loadLevelProducts();
    updateUI();
    renderShowcaseProducts();
    renderChatMessages();
}

function triggerResetGame() {
    showConfirm("Вы уверены, что хотите сбросить игру? Всё прогресс будет потерян!", () => {
        gameState.money = GAME_CONFIG.startMoney;
        gameState.level = 1;
        gameState.exp = 0;
        gameState.reputation = GAME_CONFIG.startReputation;
        gameState.compromat = 0;
        gameState.rivalPower = 50;
        gameState.defeatedRival = false;
        gameState.marketingBonus = 1.0;
        
        gameState.chats = {
            system: [{ text: "📢 Добро пожаловать в мессенджер BBM! Управляй ульем, закупай товары и развивай свой медовый бизнес без чужой диктатуры! 🛠️🐝", time: "Система", incoming: true }],
            nahida: [{ text: "👋 Здарова! Я тут чекаю рынок Спавна. Если скучно — пиши 'анекдот' или 'что по рынку'!", time: "Нахида", incoming: true }],
            pepto: [{ text: "👀 Эй, хозяин! Цены кусаются... Скинь кристаллы за спутник Пепто!", time: "Пепто", incoming: true }],
            mushroom: [{ text: "🍄 Привет-привет! Как там пчёлы? Почкуются у алтаря?", time: "Гриб", incoming: true }],
            karas: [{ text: "🐟 Чё по чем? Дороговато у тебя... Мой клан Антегрия следит за витриной.", time: "Карась", incoming: true }],
            starlik: [{ text: "😈 Ха-ха! Твой магазин скоро закроется, мой киберпанк-спавн сожрет этот улей!", time: "Старлик", incoming: true }]
        };
        
        const courtWindow = document.getElementById("court-window");
        if (courtWindow) {
            courtWindow.innerHTML = `
                <div class="rival-header">
                    <div class="rival-avatar">⛓️👨‍💼</div>
                    <div class="rival-info">
                        <h3>Старлик (Киберпанк-Диктатор)</h3>
                        <p>Статус: пытается удалить твой бизнес со Спавна</p>
                    </div>
                </div>
                <div class="rival-stats">
                    <div class="rival-power-bar"><span>Наглость:</span><progress id="rival-progress" value="30" max="100"></progress></div>
                    <div class="compromat-bar"><span>Компромат:</span><progress id="compromat-progress" value="0" max="100"></progress></div>
                </div>
                <div class="rival-actions">
                    <button class="action-btn reset-btn" onclick="triggerLawsuit()">⚖️ ПЕРЕДАТЬ ДЕЛО В СУД</button>
                </div>
            `;
        }
        
        loadLevelProducts();
        updateUI();
        renderShowcaseProducts();
        renderChatMessages();
        showAlert("🔄 Игра успешно сброшена! Начинай заново!");
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startGameEngine);
} else {
    startGameEngine();
}
