// Основная игровая логика с конечным автоматом

// Состояния игры
const GAME_STATE = {
    WAIT_FOR_INPUT: "WAIT_FOR_INPUT",      // Ждём действия игрока
    ANIMATING_FALL: "ANIMATING_FALL",      // Фишки падают
    CHECK_MATCHES: "CHECK_MATCHES"         // Проверяем комбинации
};

let gameState = GAME_STATE.WAIT_FOR_INPUT;
let uiElements = {};

function setUIElements(elements) {
    uiElements = elements;
}

function updateUI() {
    if (uiElements.score) uiElements.score.innerText = score;
    if (uiElements.moves) uiElements.moves.innerText = movesLeft;
    if (uiElements.comboDisplay) {
        uiElements.comboDisplay.innerHTML = combo > 1 ? `⚡ КОМБО x${combo}` : `⚡ x1`;
    }
    if (uiElements.questProgressDisplay && currentQuest) {
        uiElements.questProgressDisplay.innerText = `${questProgress} / ${currentQuest.target}`;
    }
    if (uiElements.questFill && currentQuest) {
        let percent = (questProgress / currentQuest.target) * 100;
        uiElements.questFill.style.width = `${percent}%`;
    }
    if (uiElements.questTargetDisplay && currentQuest) {
        uiElements.questTargetDisplay.innerHTML = `🎯 ${currentQuest.desc}`;
    }
}

function getCurrentQuest() {
    let quests = WORLD_QUESTS[currentWorld];
    if (!quests) return { icon: "⭐", target: 20, desc: "Собери 20 элементов" };
    return quests[currentLevel - 1] || { icon: "⭐", target: 20, desc: "Собери 20 элементов" };
}

function setWorldBackground(worldId) {
    document.body.className = WORLDS[worldId].bgClass;
    document.documentElement.style.setProperty("--world-primary", WORLDS[worldId].theme);
    playMusicForWorld(worldId);
}

function addWorldMessage(msg) {
    let div = document.getElementById("worldExtraInfo");
    if (div) {
        div.innerHTML = `✨ ${msg} ✨`;
        setTimeout(() => { if (div.innerHTML === `✨ ${msg} ✨`) div.innerHTML = WORLDS[currentWorld].extraInfo; }, 2500);
    }
}

function hasMatches() {
    let matches = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 6; c++) {
            if (boardState[r][c] && boardState[r][c+1] === boardState[r][c] && boardState[r][c+2] === boardState[r][c]) {
                let len = 3;
                while (c+len < 8 && boardState[r][c+len] === boardState[r][c]) len++;
                for (let i = 0; i < len; i++) matches.push({r, c: c+i});
                c += len-1;
            }
        }
    }
    for (let c = 0; c < 8; c++) {
        for (let r = 0; r < 6; r++) {
            if (boardState[r][c] && boardState[r+1][c] === boardState[r][c] && boardState[r+2][c] === boardState[r][c]) {
                let len = 3;
                while (r+len < 8 && boardState[r+len][c] === boardState[r][c]) len++;
                for (let i = 0; i < len; i++) matches.push({r: r+i, c});
                r += len-1;
            }
        }
    }
    let unique = [];
    matches.forEach(m => { if (!unique.some(u => u.r === m.r && u.c === m.c)) unique.push(m); });
    return unique;
}

function getMatchBonus(matchesArray) {
    let counts = {};
    for (let m of matchesArray) { let e = boardState[m.r][m.c]; if (e) counts[e] = (counts[e] || 0) + 1; }
    let max = Math.max(...Object.values(counts), 0);
    if (max >= 5) return { points: BONUS_5_IN_ROW, comboIncrease: 2 };
    if (max >= 4) return { points: BONUS_4_IN_ROW, comboIncrease: 1 };
    return { points: 0, comboIncrease: 1 };
}

function applyWorldMechanicsOnMatch(matchedCells) {
    matchCounter++;
    if (currentWorld === "forest" && matchCounter % 3 === 0) { 
        movesLeft++; 
        updateUI();
        addWorldMessage("🌿 Рост! +1 ход!"); 
    }
    if (currentWorld === "forest" && Math.random() < 0.05) {
        let empty = []; 
        for (let r=0;r<8;r++) for (let c=0;c<8;c++) if (!boardState[r][c]) empty.push({r,c});
        if (empty.length) { 
            let s = empty[Math.floor(Math.random()*empty.length)]; 
            boardState[s.r][s.c] = "🌸"; 
            addWorldMessage("🌸 Вырос цветок! +50% очков!"); 
            renderBoard();
        }
    }
    if (currentWorld === "steampunk") {
        let gears = matchedCells.filter(c => boardState[c.r]?.[c.c] === "⚙️").length;
        steamGears += gears;
        let extraInfo = document.getElementById("worldExtraInfo");
        if (extraInfo) extraInfo.innerHTML = `⚙️ Шестерёнок: ${steamGears}/40 | ${WORLDS.steampunk.extraInfo}`;
        if (steamGears >= 40) { 
            let ultBtn = document.getElementById("ultimaBtn");
            if (ultBtn) { ultBtn.style.display = "block"; ultBtn.disabled = false; }
            addWorldMessage("💨 УЛЬТА ГОТОВА!"); 
        }
    }
    if (currentWorld === "cyber" && combo >= 3) { 
        movesLeft++; 
        updateUI();
        addWorldMessage("⚡ Хакерский множитель +1 ход!"); 
    }
}

function applyCyberOverload() {
    if (currentWorld !== "cyber") return;
    if (combo === 1) {
        noComboCounter++;
        if (noComboCounter >= 2) {
            noComboCounter = 0;
            let visible = [];
            for (let r=0;r<8;r++) for (let c=0;c<8;c++) if (boardState[r][c] && !worldSpecificData.invisibleCells?.some(cell=>cell.r===r&&cell.c===c)) visible.push({r,c});
            if (visible.length) {
                let cell = visible[Math.floor(Math.random()*visible.length)];
                if (!worldSpecificData.invisibleCells) worldSpecificData.invisibleCells = [];
                worldSpecificData.invisibleCells.push(cell);
                addWorldMessage(`⚠️ Перегрузка! Клетка замкнула!`);
                renderBoard();
            }
        }
    } else noComboCounter = 0;
}

function applySpaceGravity() {
    if (currentWorld !== "space") return;
    moveCounter++;
    if (moveCounter >= 4) {
        moveCounter = 0;
        gravityInverted = !gravityInverted;
        addWorldMessage(gravityInverted ? "🌀 ГРАВИТАЦИЯ ИНВЕРТИРОВАНА! Блоки летят ВВЕРХ!" : "🌀 ГРАВИТАЦИЯ ВОССТАНОВЛЕНА!");
        startFallSequence();
    }
}

function applyBlackhole() {
    if (currentWorld !== "space") return;
    for (let dr=-1;dr<=1;dr++) for (let dc=-1;dc<=1;dc++) { 
        let nr=BLACKHOLE_POS.r+dr, nc=BLACKHOLE_POS.c+dc; 
        if (nr>=0 && nr<8 && nc>=0 && nc<8 && boardState[nr][nc]) boardState[nr][nc]=null; 
    }
    renderBoard();
}

function applyRust() {
    if (currentWorld !== "steampunk") return;
    
    if (Math.random() < 0.3) {
        let attempts = 0;
        let maxAttempts = 10;
        
        while (attempts < maxAttempts) {
            let r = Math.floor(Math.random() * 8);
            let c = Math.floor(Math.random() * 8);
            
            if (boardState[r][c] && 
                !worldSpecificData.rustedCells?.some(rust => rust.r === r && rust.c === c) &&
                boardState[r][c] !== "🌸") {
                
                if (!worldSpecificData.rustedCells) worldSpecificData.rustedCells = [];
                worldSpecificData.rustedCells.push({ r, c, hits: 1 });
                addWorldMessage("⚙️ Появилась ржавчина! Нужно два матча!");
                renderBoard();
                break;
            }
            attempts++;
        }
    }
}

function addQuestProgress(matchedCells) {
    let added = 0;
    for (let cell of matchedCells) {
        let emoji = boardState[cell.r]?.[cell.c];
        if (emoji && emoji === currentQuest.icon) added++;
    }
    if (added > 0) {
        questProgress = Math.min(questProgress + added, currentQuest.target);
        updateUI();
    }
}

// ========== УМНАЯ ГЕНЕРАЦИЯ НОВЫХ ФИШЕК (LOOK-AHEAD) ==========
function getSafeNewEmoji(emojis, boardCol, colIndex, rowPos, inverted) {
    let available = [...emojis];
    let r = !inverted ? 7 - rowPos : rowPos;
    
    // Проверка вертикали (смотрим вниз на 2 клетки)
    if (rowPos >= 2 && boardCol[rowPos-1] === boardCol[rowPos-2]) {
        available = available.filter(e => e !== boardCol[rowPos-1]);
    }
    
    // Проверка горизонтали слева
    if (colIndex >= 2 && boardState[r] && boardState[r][colIndex-1] === boardState[r][colIndex-2]) {
        available = available.filter(e => e !== boardState[r][colIndex-1]);
    }
    
    // Проверка горизонтали справа (смотрим будущие соседей)
    if (colIndex <= 5 && boardState[r] && boardState[r][colIndex+1] === boardState[r][colIndex+2]) {
        available = available.filter(e => e !== boardState[r][colIndex+1]);
    }
    
    // Проверка креста (сосед сверху и снизу)
    if (rowPos >= 1 && rowPos + 1 < 8 && boardCol[rowPos-1] === boardCol[rowPos+1]) {
        available = available.filter(e => e !== boardCol[rowPos-1]);
    }
    
    if (available.length === 0) {
        available = [...emojis];
    }
    
    return available[Math.floor(Math.random() * available.length)];
}

// ========== ФАЗА 1: ПАДЕНИЕ ФИШЕК ==========
function applyGravityAndRefill() {
    let emojis = WORLDS[currentWorld].emojis;
    let inverted = gravityInverted && currentWorld === "space";
    
    for (let c = 0; c < 8; c++) {
        let col = [];
        
        // Собираем существующие фишки
        if (!inverted) {
            for (let r = 7; r >= 0; r--) {
                if (boardState[r][c]) col.push(boardState[r][c]);
            }
        } else {
            for (let r = 0; r < 8; r++) {
                if (boardState[r][c]) col.push(boardState[r][c]);
            }
        }
        
        // Заполняем пустоты новыми фишками с умной проверкой
        while (col.length < 8) {
            let rowPos = col.length;
            let newEmoji = getSafeNewEmoji(emojis, col, c, rowPos, inverted);
            col.push(newEmoji);
        }
        
        if (!inverted) {
            col.reverse();
            for (let r = 0; r < 8; r++) {
                boardState[r][c] = col[r];
            }
        } else {
            for (let r = 0; r < 8; r++) {
                boardState[r][c] = col[r];
            }
        }
    }
    
    renderBoard();
    playSound("match");
}

// ========== ФАЗА 2: ПРОВЕРКА И УДАЛЕНИЕ МАТЧЕЙ ==========
function processMatchesAndAward() {
    let matches = hasMatches();
    
    if (matches.length === 0) {
        // Нет больше комбинаций - возвращаем контроль игроку
        gameState = GAME_STATE.WAIT_FOR_INPUT;
        combo = activeStartCombo;
        updateUI();
        applyCyberOverload();
        applySpaceGravity();
        isLocking = false;
        selectedCell = null;
        checkGameEnd();
        return;
    }
    
    // Есть комбинации - начисляем очки
    let bonus = getMatchBonus(matches);
    if (bonus.comboIncrease > 0) { 
        combo += bonus.comboIncrease; 
        updateUI();
    }
    
    let points = 0;
    for (let m of matches) {
        let add = SCORE_PER_ELEMENT * combo;
        if (boardState[m.r][m.c] === "🌸") add = Math.floor(add * 1.5);
        if (activeDoubleScore) add *= 2;
        points += add;
    }
    score += points;
    updateUI();
    
    addQuestProgress(matches);
    applyWorldMechanicsOnMatch(matches);
    
    // Удаляем совпавшие клетки (с учётом ржавчины)
    for (let m of matches) {
        if (currentWorld === "steampunk" && worldSpecificData.rustedCells) {
            let rustIndex = worldSpecificData.rustedCells.findIndex(rust => rust.r === m.r && rust.c === m.c);
            
            if (rustIndex !== -1) {
                worldSpecificData.rustedCells[rustIndex].hits++;
                if (worldSpecificData.rustedCells[rustIndex].hits >= 2) {
                    worldSpecificData.rustedCells.splice(rustIndex, 1);
                    boardState[m.r][m.c] = null;
                    addWorldMessage("⚙️ Ржавчина уничтожена!");
                } else {
                    addWorldMessage("⚙️ Ржавчина ослабла! Нужен ещё удар!");
                }
                continue;
            }
        }
        boardState[m.r][m.c] = null;
    }
    
    // Анимация исчезновения
    matches.forEach(m => { 
        let el = document.querySelector(`[data-row='${m.r}'][data-col='${m.c}']`); 
        if (el) el.classList.add("match-fade"); 
    });
    
    playSound("win");
    
    // Запускаем падение новых фишек
    setTimeout(() => {
        startFallSequence();
    }, 200);
}

// ========== ОСНОВНОЙ ЦИКЛ: ПАДЕНИЕ → ПРОВЕРКА → ПАДЕНИЕ → ... ==========
function startFallSequence() {
    gameState = GAME_STATE.ANIMATING_FALL;
    
    // Применяем гравитацию и заполняем пустоты
    applyGravityAndRefill();
    
    // Ждём окончания анимации падения
    setTimeout(() => {
        gameState = GAME_STATE.CHECK_MATCHES;
        
        // Применяем спецэффекты миров
        if (currentWorld === "space") applyBlackhole();
        if (currentWorld === "steampunk") applyRust();
        
        // Проверяем и обрабатываем комбинации
        processMatchesAndAward();
    }, 200);
}

// ========== ОБМЕН ФИШЕК ОТ ИГРОКА ==========
function trySwap(r1, c1, r2, c2) {
    if (gameState !== GAME_STATE.WAIT_FOR_INPUT) {
        addWorldMessage("⏳ Подождите, идёт обработка...");
        return false;
    }
    
    // Пробуем обмен
    let temp = boardState[r1][c1];
    boardState[r1][c1] = boardState[r2][c2];
    boardState[r2][c2] = temp;
    
    let matches = hasMatches();
    
    if (matches.length > 0) {
        // Успешный ход
        if (movesLeft > 0) movesLeft--;
        updateUI();
        renderBoard();
        
        playSound("click");
        
        // Запускаем цепочку: удаление комбинаций → падение → проверка
        gameState = GAME_STATE.CHECK_MATCHES;
        
        // Начисляем очки за комбинацию и запускаем падение
        let bonus = getMatchBonus(matches);
        if (bonus.comboIncrease > 0) { 
            combo += bonus.comboIncrease; 
            updateUI();
        }
        
        let points = 0;
        for (let m of matches) {
            let add = SCORE_PER_ELEMENT * combo;
            if (boardState[m.r][m.c] === "🌸") add = Math.floor(add * 1.5);
            if (activeDoubleScore) add *= 2;
            points += add;
        }
        score += points;
        updateUI();
        
        addQuestProgress(matches);
        applyWorldMechanicsOnMatch(matches);
        
        // Удаляем совпавшие клетки
        for (let m of matches) {
            boardState[m.r][m.c] = null;
        }
        
        matches.forEach(m => { 
            let el = document.querySelector(`[data-row='${m.r}'][data-col='${m.c}']`); 
            if (el) el.classList.add("match-fade"); 
        });
        
        playSound("win");
        
        // Запускаем падение и дальнейшую проверку
        setTimeout(() => {
            startFallSequence();
        }, 200);
        
        return true;
    } else {
        // Откат обмена
        temp = boardState[r1][c1];
        boardState[r1][c1] = boardState[r2][c2];
        boardState[r2][c2] = temp;
        renderBoard();
        addWorldMessage("❌ Нет комбинации!");
        return false;
    }
}

function handleCellClick(r, c) {
    if (gameState !== GAME_STATE.WAIT_FOR_INPUT) return;
    if (!gameActive || isLocking || movesLeft <= 0) return;
    if (worldSpecificData.invisibleCells?.some(cell => cell.r === r && cell.c === c)) return;
    playSound("click");
    
    if (selectedCell === null) {
        document.querySelectorAll(".cell.selected").forEach(el => el.classList.remove("selected"));
        selectedCell = { r, c };
        let el = document.querySelector(`[data-row='${r}'][data-col='${c}']`);
        if (el) el.classList.add("selected");
    } else {
        let prev = document.querySelector(`[data-row='${selectedCell.r}'][data-col='${selectedCell.c}']`);
        if (prev) prev.classList.remove("selected");
        let dr = Math.abs(r - selectedCell.r), dc = Math.abs(c - selectedCell.c);
        
        if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
            trySwap(selectedCell.r, selectedCell.c, r, c);
            selectedCell = null;
        } else {
            selectedCell = { r, c };
            let newEl = document.querySelector(`[data-row='${r}'][data-col='${c}']`);
            if (newEl) newEl.classList.add("selected");
        }
    }
}

function renderBoard() {
    let boardEl = document.getElementById("board");
    if (!boardEl) return;
    boardEl.innerHTML = "";
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            let cell = document.createElement("div");
            cell.className = "cell";
            cell.dataset.row = r;
            cell.dataset.col = c;
            let val = boardState[r][c] || "?";
            cell.innerText = val;
            if (worldSpecificData.invisibleCells?.some(cell => cell.r === r && cell.c === c)) { 
                cell.classList.add("invisible"); 
                cell.innerText = "???"; 
            }
            if (worldSpecificData.rustedCells?.some(rust => rust.r === r && rust.c === c)) {
                cell.classList.add("rusted");
            }
            if (currentWorld === "space" && r === BLACKHOLE_POS.r && c === BLACKHOLE_POS.c) { 
                cell.classList.add("blackhole"); 
                cell.innerText = "🌀"; 
            }
            if (val === "🌸") cell.classList.add("flower-bonus");
            applySkinToCell(cell);
            cell.onclick = () => handleCellClick(r, c);
            boardEl.appendChild(cell);
        }
    }
}

function generateValidBoard() {
    let emojis = WORLDS[currentWorld].emojis;
    
    for (let r = 0; r < 8; r++) {
        boardState[r] = [];
        for (let c = 0; c < 8; c++) {
            boardState[r][c] = null;
        }
    }
    
    do {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                let available = [...emojis];
                if (c >= 2 && boardState[r][c-1] === boardState[r][c-2]) {
                    available = available.filter(e => e !== boardState[r][c-1]);
                }
                if (r >= 2 && boardState[r-1][c] === boardState[r-2][c]) {
                    available = available.filter(e => e !== boardState[r-1][c]);
                }
                if (available.length === 0) {
                    available = [...emojis];
                }
                boardState[r][c] = available[Math.floor(Math.random() * available.length)];
            }
        }
    } while (hasMatches().length > 0);
}

function shuffleBoard() {
    if (gameState !== GAME_STATE.WAIT_FOR_INPUT) {
        addWorldMessage("⏳ Подождите, сейчас нельзя тасовать!");
        return;
    }
    generateValidBoard();
    renderBoard();
    addWorldMessage("🃏 Поле перетасовано!");
}

function checkGameEnd() {
    if (questProgress >= currentQuest.target) {
        gameActive = false;
        if (!playerProgress[currentWorld].completed.includes(currentLevel)) {
            playerProgress[currentWorld].completed.push(currentLevel);
            let reward = LEVEL_REWARDS[currentLevel-1];
            addCoins(reward.coins);
            addCrystals(reward.crystals);
            totalScoreAllWorlds += score;
            if (currentLevel < 8 && !playerProgress[currentWorld].completed.includes(currentLevel+1)) {
                playerProgress[currentWorld].unlockedLevel = Math.max(playerProgress[currentWorld].unlockedLevel, currentLevel+1);
            }
        }
        saveGameProgress();
        showModal(true);
    } else if (movesLeft <= 0) {
        gameActive = false;
        showModal(false);
    }
}

function saveGameProgress() {
    localStorage.setItem("cyberMatchFixed", JSON.stringify({ 
        progress: playerProgress, 
        stats: playerStats, 
        totalScore: totalScoreAllWorlds 
    }));
}

function loadGameProgress() {
    let saved = localStorage.getItem("cyberMatchFixed");
    if (saved) {
        try {
            let data = JSON.parse(saved);
            if (data.progress) Object.assign(playerProgress, data.progress);
            if (data.stats) {
                Object.assign(playerStats, data.stats);
                if (!playerStats.ownedItems) playerStats.ownedItems = {};
                if (!playerStats.ownedSkins) playerStats.ownedSkins = ["neon"];
                if (!playerStats.activeSkin) playerStats.activeSkin = "neon";
                if (!playerStats.consumablesUsed) playerStats.consumablesUsed = { double_score: false, combo_boost: false };
            }
            if (data.totalScore) totalScoreAllWorlds = data.totalScore;
        } catch(e) {}
    }
    if (!playerProgress.forest.isUnlocked) { 
        playerProgress.forest.isUnlocked = true; 
        playerProgress.availableWorlds = ["forest"]; 
    }
    updateCurrency();
}

function showModal(isWin) {
    let modal = document.getElementById("resultModal");
    let modalStats = document.getElementById("modalStats");
    let modalTitle = document.getElementById("modalTitle");
    let modalIcon = document.getElementById("modalIcon");
    
    if (modalStats) modalStats.innerHTML = isWin ? `🎉 Победа! Счёт: ${score}<br>Задание: ${currentQuest.desc} выполнено!` : `💀 Поражение! Выполнено: ${questProgress}/${currentQuest.target}`;
    if (modalTitle) modalTitle.innerHTML = isWin ? "✨ УРОВЕНЬ ПРОЙДЕН! ✨" : "❌ ПОРАЖЕНИЕ ❌";
    if (modalIcon) modalIcon.innerHTML = isWin ? "🏆🎉" : "💀😭";
    if (modal) modal.classList.add("active");
    if (isWin) playSound("win");
    updateLevelSelector();
}

function updateLevelSelector() {
    let container = document.getElementById("levelSelector");
    if (!container) return;
    container.innerHTML = "";
    for (let i = 1; i <= 8; i++) {
        let badge = document.createElement("div");
        badge.className = "level-badge";
        badge.innerText = i;
        let completed = playerProgress[currentWorld].completed?.includes(i) || false;
        let unlocked = i <= (playerProgress[currentWorld].unlockedLevel || 1);
        if (completed) badge.classList.add("completed");
        if (!unlocked) badge.classList.add("locked");
        if (i === currentLevel) badge.classList.add("current");
        if (unlocked) badge.onclick = () => { 
            if (gameState === GAME_STATE.WAIT_FOR_INPUT) {
                currentLevel = i; 
                startLevel(); 
                updateLevelSelector();
            }
        };
        container.appendChild(badge);
    }
}

function updateWorldUI() {
    let w = WORLDS[currentWorld];
    let iconEl = document.getElementById("currentWorldIcon");
    let nameEl = document.getElementById("currentWorldName");
    let propEl = document.getElementById("worldProperty");
    let extraEl = document.getElementById("worldExtraInfo");
    
    if (iconEl) iconEl.innerHTML = w.icon;
    if (nameEl) nameEl.innerHTML = w.name;
    if (propEl) propEl.innerHTML = w.property;
    if (extraEl) extraEl.innerHTML = w.extraInfo;
    
    setWorldBackground(currentWorld);
    
    let prevBtn = document.getElementById("prevWorldBtn");
    let nextBtn = document.getElementById("nextWorldBtn");
    let idx = WORLDS_LIST.indexOf(currentWorld);
    let hasPrev = false, hasNext = false;
    for (let i = idx-1; i >= 0; i--) if (playerProgress[WORLDS_LIST[i]]?.isUnlocked) hasPrev = true;
    for (let i = idx+1; i < WORLDS_LIST.length; i++) if (playerProgress[WORLDS_LIST[i]]?.isUnlocked) hasNext = true;
    if (prevBtn) prevBtn.disabled = !hasPrev;
    if (nextBtn) nextBtn.disabled = !hasNext;
}

function startLevel() {
    gameState = GAME_STATE.WAIT_FOR_INPUT;
    gameActive = true;
    isLocking = false;
    selectedCell = null;
    matchCounter = 0;
    noComboCounter = 0;
    moveCounter = 0;
    gravityInverted = false;
    steamGears = 0;
    worldSpecificData = { invisibleCells: [], rustedCells: [] };
    score = 0;
    
    for (let i = 0; i < 8; i++) {
        boardState[i] = [];
        for (let j = 0; j < 8; j++) {
            boardState[i][j] = null;
        }
    }
    
    let extraMoves = (playerStats.ownedItems["extra_moves"] || 0) * 5;
    let baseMoves = getLevelMoves(currentLevel);
    movesLeft = baseMoves + extraMoves + (playerStats.permanentBonusMoves || 0);
    
    currentQuest = getCurrentQuest();
    questProgress = 0;
    combo = activeStartCombo;
    
    generateValidBoard();
    renderBoard();
    updateUI();
    updateWorldUI();
    
    let ultBtn = document.getElementById("ultimaBtn");
    if (ultBtn) {
        ultBtn.style.display = WORLDS[currentWorld].hasUlt ? "block" : "none";
    }
}

function nextLevel() {
    if (currentLevel < 8) {
        currentLevel++;
        startLevel();
        let modal = document.getElementById("resultModal");
        if (modal) modal.classList.remove("active");
    } else {
        let idx = WORLDS_LIST.indexOf(currentWorld);
        let nextWorldId = WORLDS_LIST[idx + 1];
        if (nextWorldId && !playerProgress[nextWorldId].isUnlocked) {
            playerProgress[nextWorldId].isUnlocked = true;
            playerProgress.availableWorlds.push(nextWorldId);
            playerProgress[currentWorld].isCompleted = true;
            saveGameProgress();
            alert(`🌟 ПОЗДРАВЛЯЮ! 🌟\nМир "${WORLDS[currentWorld].name}" полностью пройден!\n\n🔥 ОТКРЫТ НОВЫЙ МИР: ${WORLDS[nextWorldId].name}!`);
            currentWorld = nextWorldId;
            currentLevel = 1;
            startLevel();
        } else if (!nextWorldId) {
            showFullVictory();
        }
        let modal = document.getElementById("resultModal");
        if (modal) modal.classList.remove("active");
    }
    updateLevelSelector();
    updateWorldUI();
}

function resetLevel() { 
    startLevel(); 
    let modal = document.getElementById("resultModal");
    if (modal) modal.classList.remove("active");
}

function steampunkUltimate() {
    if (currentWorld !== "steampunk" || steamGears < 40) return;
    if (gameState !== GAME_STATE.WAIT_FOR_INPUT) {
        addWorldMessage("⏳ Сейчас нельзя использовать ульту!");
        return;
    }
    steamGears = 0;
    let row = Math.floor(Math.random() * 8);
    for (let c = 0; c < 8; c++) boardState[row][c] = null;
    addWorldMessage(`💨 ПАРОВОЙ УДАР! Ряд ${row+1} уничтожен!`);
    renderBoard();
    startFallSequence();
    let ultBtn = document.getElementById("ultimaBtn");
    if (ultBtn) ultBtn.style.display = "none";
}

function goToWorld(worldId) {
    if (!playerProgress[worldId].isUnlocked) return;
    if (gameState !== GAME_STATE.WAIT_FOR_INPUT) {
        addWorldMessage("⏳ Подождите, сейчас нельзя сменить мир!");
        return;
    }
    currentWorld = worldId;
    currentLevel = playerProgress[worldId].unlockedLevel || 1;
    startLevel();
    updateWorldUI();
    updateLevelSelector();
}

function showFullVictory() {
    let victoryCard = document.getElementById("victoryCelebration");
    let victoryScore = document.getElementById("victoryTotalScore");
    if (victoryScore) victoryScore.innerHTML = `💰 Итоговый счёт: ${totalScoreAllWorlds}`;
    if (victoryCard) victoryCard.classList.add("active");
    startConfetti();
}

function startConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    let ctx = canvas.getContext('2d');
    let particles = [];
    for (let i = 0; i < 200; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            size: Math.random() * 8 + 4,
            speedY: Math.random() * 5 + 3,
            speedX: (Math.random() - 0.5) * 3,
            color: `hsl(${Math.random() * 360}, 100%, 60%)`,
            rotation: Math.random() * 360,
            rotateSpeed: (Math.random() - 0.5) * 10
        });
    }
    let animating = true;
    function animate() {
        if (!animating) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let p of particles) {
            p.y += p.speedY;
            p.x += p.speedX;
            p.rotation += p.rotateSpeed;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation * Math.PI / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
            ctx.restore();
        }
        particles = particles.filter(p => p.y < canvas.height);
        if (particles.length > 0) requestAnimationFrame(animate);
        else animating = false;
    }
    animate();
    setTimeout(() => { animating = false; ctx.clearRect(0, 0, canvas.width, canvas.height); }, 4000);
}

function victoryRestart() {
    localStorage.removeItem("cyberMatchFixed");
    location.reload();
}

function exitToMainMenu() {
    if (confirm("Выйти в главное меню? Весь прогресс будет сохранён.")) {
        stopMusic();
        let startScreen = document.getElementById("startScreen");
        let gameWrapper = document.getElementById("gameWrapper");
        if (startScreen) startScreen.classList.remove("hide");
        if (gameWrapper) gameWrapper.classList.remove("visible");
    }
}

function initGameAfterStart() {
    loadGameProgress();
    currentWorld = playerProgress.currentWorld || "forest";
    currentLevel = playerProgress[currentWorld].unlockedLevel || 1;
    
    activeDoubleScore = playerStats.consumablesUsed.double_score;
    activeStartCombo = playerStats.consumablesUsed.combo_boost ? 2 : 1;
    
    updateCurrency();
    setWorldBackground(currentWorld);
    updateWorldUI();
    updateLevelSelector();
    startLevel();
}
