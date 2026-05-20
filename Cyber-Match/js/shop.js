// Магазин и скины

function updateCurrency() {
    const coinsSpan = document.getElementById("coinsAmount");
    const crystalsSpan = document.getElementById("crystalsAmount");
    const shopCoins = document.getElementById("shopCoins");
    const shopCrystals = document.getElementById("shopCrystals");
    
    if (coinsSpan) coinsSpan.innerText = playerStats.coins;
    if (crystalsSpan) crystalsSpan.innerText = playerStats.crystals;
    if (shopCoins) shopCoins.innerText = playerStats.coins;
    if (shopCrystals) shopCrystals.innerText = playerStats.crystals;
}

function addCoins(amount) {
    playerStats.coins += amount;
    updateCurrency();
    saveGameProgress();
}

function addCrystals(amount) {
    playerStats.crystals += amount;
    updateCurrency();
    saveGameProgress();
}

function applySkinToCell(cell) {
    if (!cell) return;
    cell.classList.remove("skin-neon", "skin-gold", "skin-ice", "skin-fire");
    cell.classList.add(`skin-${playerStats.activeSkin}`);
}

function updateAllSkins() {
    document.querySelectorAll(".cell").forEach(cell => applySkinToCell(cell));
}

function buySkin(skinId) {
    let skin = SKINS.find(s => s.id === skinId);
    if (!skin || playerStats.ownedSkins.includes(skinId)) {
        alert("❌ У вас уже есть этот скин!");
        return false;
    }
    if ((skin.priceCoins > 0 && playerStats.coins < skin.priceCoins) || 
        (skin.priceCrystals > 0 && playerStats.crystals < skin.priceCrystals)) {
        alert("❌ Не хватает ресурсов!");
        return false;
    }
    if (skin.priceCoins > 0) playerStats.coins -= skin.priceCoins;
    if (skin.priceCrystals > 0) playerStats.crystals -= skin.priceCrystals;
    playerStats.ownedSkins.push(skinId);
    updateCurrency();
    saveGameProgress();
    alert(`✅ Скин "${skin.name}" куплен!`);
    openShop(); // Обновляем магазин
    return true;
}

function setActiveSkin(skinId) {
    if (!playerStats.ownedSkins.includes(skinId)) {
        alert("❌ Скин не куплен!");
        return false;
    }
    playerStats.activeSkin = skinId;
    updateAllSkins();
    saveGameProgress();
    alert(`✅ Скин "${SKINS.find(s => s.id === skinId).name}" надет!`);
    openShop(); // Обновляем магазин
    return true;
}

function buyItem(itemId) {
    let item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return false;
    
    // Проверка ресурсов
    if ((item.priceCoins > 0 && playerStats.coins < item.priceCoins) || 
        (item.priceCrystals > 0 && playerStats.crystals < item.priceCrystals)) {
        alert("❌ Не хватает ресурсов!");
        return false;
    }
    
    // Списываем цену
    if (item.priceCoins > 0) playerStats.coins -= item.priceCoins;
    if (item.priceCrystals > 0) playerStats.crystals -= item.priceCrystals;
    
    // Обработка эффектов
    if (item.effect?.crystalsGain) {
        addCrystals(item.effect.crystalsGain);
    } else if (item.effect?.coinsGain) {
        addCoins(item.effect.coinsGain);
    } else {
        // Увеличиваем счётчик купленных предметов
        playerStats.ownedItems[itemId] = (playerStats.ownedItems[itemId] || 0) + 1;
        
        // ПРИМЕНЯЕМ ЭФФЕКТ СРАЗУ
        if (itemId === "extra_moves") {
            // Добавляем ходы прямо сейчас (5 ходов за штуку)
            let gainedMoves = 5;
            movesLeft += gainedMoves;
            updateUI();
            addWorldMessage(`✨ +${gainedMoves} ходов к уровню! ✨`);
        }
        
        if (itemId === "double_score") {
            if (!playerStats.consumablesUsed.double_score) {
                playerStats.consumablesUsed.double_score = true;
                window.activeDoubleScore = true;
                addWorldMessage(`✨ ДВОЙНОЙ СЧЁТ АКТИВИРОВАН! ✨`);
            } else {
                addWorldMessage(`⚠️ Двойной счёт уже активен! ⚠️`);
            }
        }
        
        if (itemId === "combo_boost") {
            if (!playerStats.consumablesUsed.combo_boost) {
                playerStats.consumablesUsed.combo_boost = true;
                window.activeStartCombo = 2;
                combo = 2;
                updateUI();
                addWorldMessage(`✨ КОМБО УСИЛЕНИЕ АКТИВИРОВАНО! ✨`);
            } else {
                addWorldMessage(`⚠️ Усиление комбо уже активно! ⚠️`);
            }
        }
    }
    
    updateCurrency();
    saveGameProgress();
    alert(`✅ Куплено: ${item.name}!`);
    openShop(); 
    return true;
}

function applyActiveBonuses() {
    window.activeDoubleScore = playerStats.consumablesUsed?.double_score || false;
    window.activeStartCombo = playerStats.consumablesUsed?.combo_boost ? 2 : 1;
}

function openShop() {
    let modal = document.getElementById("shopModal");
    let list = document.getElementById("shopItemsList");
    if (!list) return;
    
    list.innerHTML = "";
    
    // Заголовок скинов
    let title = document.createElement("div");
    title.style.cssText = "font-size:0.7rem;margin:10px 0;color:gold;text-align:center";
    title.innerHTML = "🎨 СКИНЫ ДЛЯ КЛЕТОК";
    list.appendChild(title);
    
    // Скины
    SKINS.forEach(skin => {
        let owned = playerStats.ownedSkins.includes(skin.id);
        let active = playerStats.activeSkin === skin.id;
        let div = document.createElement("div");
        div.className = "shop-item";
        
        let priceText = "";
        if (skin.default) {
            priceText = "БЕСПЛАТНО";
        } else if (skin.priceCoins > 0) {
            priceText = `💰 ${skin.priceCoins}`;
        } else {
            priceText = `💎 ${skin.priceCrystals}`;
        }
        
        let btnHtml = "";
        if (!owned && !skin.default) {
            btnHtml = `<button class="shop-buy-btn skin-buy" data-skin="${skin.id}">КУПИТЬ</button>`;
        } else if (owned && !active) {
            btnHtml = `<button class="shop-buy-btn skin-set" data-skin="${skin.id}">НАДЕТЬ</button>`;
        } else if (active) {
            btnHtml = `<div class="skin-current">✅ НАДЕТО</div>`;
        } else if (skin.default && !active) {
            btnHtml = `<button class="shop-buy-btn skin-set" data-skin="${skin.id}">НАДЕТЬ</button>`;
        }
        
        div.innerHTML = `
            <div style="display:flex;gap:10px;align-items:center">
                <div class="skin-preview ${skin.id}" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:1.2rem">${skin.icon}</div>
                <div><b style="font-size:0.65rem">${skin.name}</b></div>
            </div>
            <div style="display:flex;gap:8px;align-items:center">
                <span style="color:gold;font-size:0.55rem">${priceText}</span>
                ${btnHtml}
            </div>
        `;
        list.appendChild(div);
    });
    
    // Заголовок улучшений
    let title2 = document.createElement("div");
    title2.style.cssText = "font-size:0.7rem;margin:20px 0 10px;color:gold;text-align:center";
    title2.innerHTML = "🛍️ УЛУЧШЕНИЯ";
    list.appendChild(title2);
    
    // Предметы магазина
    SHOP_ITEMS.forEach(item => {
        let count = playerStats.ownedItems[item.id] || 0;
        let div = document.createElement("div");
        div.className = "shop-item";
        
        let priceText = "";
        if (item.priceCoins > 0 && item.priceCrystals > 0) {
            priceText = `💰 ${item.priceCoins} + 💎 ${item.priceCrystals}`;
        } else if (item.priceCoins > 0) {
            priceText = `💰 ${item.priceCoins}`;
        } else {
            priceText = `💎 ${item.priceCrystals}`;
        }
        
        let stackHtml = count > 0 ? `<span style="background:#ff6600;padding:2px 6px;margin-left:5px;font-size:0.45rem">x${count}</span>` : "";
        
        div.innerHTML = `
            <div>
                <b style="font-size:0.6rem">${item.name} ${stackHtml}</b>
                <div style="font-size:0.45rem;color:#aaa">${item.desc}</div>
            </div>
            <div style="display:flex;gap:8px;align-items:center">
                <span style="color:gold;font-size:0.55rem">${priceText}</span>
                <button class="shop-buy-btn item-buy" data-item="${item.id}">КУПИТЬ</button>
            </div>
        `;
        list.appendChild(div);
    });
    
    // Добавляем обработчики
    document.querySelectorAll(".skin-buy").forEach(btn => {
        btn.onclick = () => buySkin(btn.dataset.skin);
    });
    document.querySelectorAll(".skin-set").forEach(btn => {
        btn.onclick = () => setActiveSkin(btn.dataset.skin);
    });
    document.querySelectorAll(".item-buy").forEach(btn => {
        btn.onclick = () => buyItem(btn.dataset.item);
    });
    
    updateCurrency();
    if (modal) modal.classList.add("active");
}

function closeShop() {
    const modal = document.getElementById("shopModal");
    if (modal) modal.classList.remove("active");
}
