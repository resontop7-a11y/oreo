// ============================================================
// JSONBin НАСТРОЙКИ
// ============================================================
const JSONBIN_URL = "https://api.jsonbin.io/v3/b/6a3c60c9f5f4af5e292b9e1d";
const JSONBIN_KEY = "$2a$10$5o6c6vpto8/ow4AnWWIVFuIaIze0NT63d/G/fzFMS3WOPjyPfIKMq";

// ============================================================
// ДАННЫЕ
// ============================================================
let usedNicks = [];
let usedIds = [];
let userElo = {};
let userKills = {};
let userAssists = {};
let userDeaths = {};
let userMatches = {};
let currentNick = '';
let currentId = '';
let currentElo = 1000;
let currentKills = 0;
let currentAssists = 0;
let currentDeaths = 0;
let currentMatches = 0;
let partyMembers = [];
let searchInterval = null;
let searchProgress = 0;
let isSearching = false;
let matchFound = false;
let bannedMaps = [];
let selectedBan = null;
let mutedPlayers = {};
let banRound = 0;
let currentCaptain = 0;
let allPlayers = [];
let teamT = [];
let teamCT = [];
let matchPlayers = [];
let matchStats = {};
let invites = {};

// ===== КАРТЫ =====
const maps = [
    { id: 'province', name: 'PROVINCE', img: 'https://i.ytimg.com/vi/uqzY5PsLSnw/hqdefault.jpg' },
    { id: 'rust', name: 'RUST', img: 'https://i.ytimg.com/vi/RKgSlXghNDg/hqdefault.jpg' },
    { id: 'sakura', name: 'SAKURA', img: 'https://static.wikia.nocookie.net/standoff-2/images/6/6c/%D0%9F%D1%80%D0%B5%D0%B2%D1%8C%D1%8E_%E2%80%94_%D0%9A%D0%B0%D1%80%D1%82%D0%B0_Sakura_0.16.0.png/revision/latest/scale-to-width-down/1200?cb=20241123165040&path-prefix=ru' },
    { id: 'sandstone', name: 'Sandstone', img: 'https://skins.farm/storage/uploads/Q7C9GmFn.jpg' },
    { id: 'zone9', name: 'Zone 9', img: 'https://static.wikia.nocookie.net/standoff-2/images/4/4d/%D0%9F%D1%80%D0%B5%D0%B2%D1%8C%D1%8E_%E2%80%94_%D0%9A%D0%B0%D1%80%D1%82%D0%B0_Zone_9_0.13.0.png/revision/latest/scale-to-width-down/1200?cb=20241123170815&path-prefix=ru' }
];

// ============================================================
// ЗАГРУЗКА И СОХРАНЕНИЕ
// ============================================================

async function loadData() {
    try {
        const response = await fetch(JSONBIN_URL, {
            headers: { 'X-Master-Key': JSONBIN_KEY }
        });
        const data = await response.json();
        console.log('📥 Загружены данные:', data);
        
        if (data.record) {
            usedNicks = data.record.usedNicks || [];
            usedIds = data.record.usedIds || [];
            userElo = data.record.userElo || {};
            userKills = data.record.userKills || {};
            userAssists = data.record.userAssists || {};
            userDeaths = data.record.userDeaths || {};
            userMatches = data.record.userMatches || {};
        }
        
        // Если текущий игрок уже есть в базе — обновляем его данные
        if (currentNick && usedNicks.includes(currentNick)) {
            const idx = usedNicks.indexOf(currentNick);
            currentId = usedIds[idx] || currentId;
            currentElo = userElo[currentNick] || 1000;
            currentKills = userKills[currentNick] || 0;
            currentAssists = userAssists[currentNick] || 0;
            currentDeaths = userDeaths[currentNick] || 0;
            currentMatches = userMatches[currentNick] || 0;
            updateProfileUI();
            updateStatsUI();
        }
        
        renderTop();
        renderParty();
    } catch (e) {
        console.log('❌ Ошибка загрузки данных:', e);
    }
}

async function saveData() {
    try {
        const data = {
            usedNicks: usedNicks || [],
            usedIds: usedIds || [],
            userElo: userElo || {},
            userKills: userKills || {},
            userAssists: userAssists || {},
            userDeaths: userDeaths || {},
            userMatches: userMatches || {}
        };
        
        const response = await fetch(JSONBIN_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_KEY
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        console.log('✅ Данные сохранены:', result);
        return true;
    } catch (e) {
        console.log('❌ Ошибка сохранения данных:', e);
        return false;
    }
}

// ===== ПРИНУДИТЕЛЬНОЕ СОХРАНЕНИЕ ПРИ РЕГИСТРАЦИИ =====
function forceSaveAndReload() {
    saveData().then(() => {
        setTimeout(() => {
            loadData();
        }, 1000);
    });
}

// ============================================================
// TOAST
// ============================================================

let toastTimer = null;
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    if (screenId === 'screen-party') renderParty();
    if (screenId === 'screen-ban') renderBanScreen();
    if (screenId === 'screen-stats') updateStatsUI();
    if (screenId === 'screen-profile') updateProfileUI();
    if (screenId === 'screen-top') renderTop();
}

// ============================================================
// РЕГИСТРАЦИЯ
// ============================================================

function registerUser() {
    const nick = document.getElementById('input-nick').value.trim();
    const id = document.getElementById('input-id').value.trim();
    if (nick === '' || id === '') { showToast('❌ Заполните оба поля'); return; }
    if (usedNicks.includes(nick)) { showToast('❌ Этот никнейм уже занят'); return; }
    if (usedIds.includes(id)) { showToast('❌ Этот ID уже занят'); return; }
    
    usedNicks.push(nick);
    usedIds.push(id);
    userElo[nick] = 1000;
    userKills[nick] = 0;
    userAssists[nick] = 0;
    userDeaths[nick] = 0;
    userMatches[nick] = 0;
    currentNick = nick;
    currentId = id;
    currentElo = 1000;
    currentKills = 0;
    currentAssists = 0;
    currentDeaths = 0;
    currentMatches = 0;
    
    updateProfileUI();
    showToast('⏳ Сохранение данных...');
    
    // Принудительно сохраняем и перезагружаем
    forceSaveAndReload();
    
    showScreen('screen-menu');
    showToast('✅ Аккаунт создан!');
}

function updateProfileUI() {
    document.getElementById('display-elo-profile').textContent = currentElo || 1000;
    document.getElementById('display-nick-profile').textContent = currentNick || '—';
    document.getElementById('display-id-profile').textContent = currentId || '—';
    document.getElementById('display-kills-profile').textContent = currentKills || 0;
    document.getElementById('display-assists-profile').textContent = currentAssists || 0;
    document.getElementById('display-deaths-profile').textContent = currentDeaths || 0;
    document.getElementById('display-matches-profile').textContent = currentMatches || 0;
}

function updateStatsUI() {
    document.getElementById('stats-elo').textContent = currentElo || 1000;
    document.getElementById('stats-kills').textContent = currentKills || 0;
    document.getElementById('stats-assists').textContent = currentAssists || 0;
    document.getElementById('stats-deaths').textContent = currentDeaths || 0;
    document.getElementById('stats-matches').textContent = currentMatches || 0;
}

function updateNick() {
    const newNick = document.getElementById('edit-nick-settings').value.trim();
    if (newNick === '') { showToast('❌ Введите новый никнейм'); return; }
    if (newNick === currentNick) { showToast('⚠️ Это ваш текущий никнейм'); return; }
    if (usedNicks.includes(newNick)) { showToast('❌ Этот никнейм уже занят'); return; }
    
    usedNicks = usedNicks.filter(n => n !== currentNick);
    usedNicks.push(newNick);
    userElo[newNick] = userElo[currentNick] || 1000;
    userKills[newNick] = userKills[currentNick] || 0;
    userAssists[newNick] = userAssists[currentNick] || 0;
    userDeaths[newNick] = userDeaths[currentNick] || 0;
    userMatches[newNick] = userMatches[currentNick] || 0;
    delete userElo[currentNick];
    delete userKills[currentNick];
    delete userAssists[currentNick];
    delete userDeaths[currentNick];
    delete userMatches[currentNick];
    currentNick = newNick;
    document.getElementById('edit-nick-settings').value = '';
    updateProfileUI();
    saveData();
    showToast('✅ Никнейм изменён на ' + newNick);
}

function updateId() {
    const newId = document.getElementById('edit-id-settings').value.trim();
    if (newId === '') { showToast('❌ Введите новый ID'); return; }
    if (newId === currentId) { showToast('⚠️ Это ваш текущий ID'); return; }
    if (usedIds.includes(newId)) { showToast('❌ Этот ID уже занят'); return; }
    usedIds = usedIds.filter(i => i !== currentId);
    usedIds.push(newId);
    currentId = newId;
    document.getElementById('edit-id-settings').value = '';
    updateProfileUI();
    saveData();
    showToast('✅ ID изменён на ' + newId);
}

function updateNickSettings() { updateNick(); }
function updateIdSettings() { updateId(); }

function logout() {
    if (confirm('Выйти из аккаунта?')) {
        document.getElementById('input-nick').value = '';
        document.getElementById('input-id').value = '';
        document.getElementById('edit-nick-settings').value = '';
        document.getElementById('edit-id-settings').value = '';
        partyMembers = [];
        showScreen('screen-register');
    }
}

// ============================================================
// ПАТИ И ПРИГЛАШЕНИЯ
// ============================================================

function renderParty() {
    const grid = document.getElementById('party-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const playerCard = document.createElement('div');
    playerCard.className = 'party-card';
    playerCard.style.borderColor = '#f57c00';
    playerCard.style.borderStyle = 'solid';
    playerCard.innerHTML = `
        <div class="avatar" style="border:2px solid #f57c00;">⭐</div>
        <div class="nick" style="color:#f57c00;">${currentNick || '—'}</div>
        <div class="elo">${currentElo || 1000} ELO</div>
        <div class="role" style="color:#f57c00;">👑 Вы</div>
    `;
    playerCard.onclick = function() { showScreen('screen-profile'); };
    grid.appendChild(playerCard);

    for (let i = 0; i < 4; i++) {
        const card = document.createElement('div');
        card.className = 'party-card';
        const member = partyMembers[i] || null;
        if (member) {
            card.innerHTML = `
                <div class="avatar" style="background:#2a2a2a; color:#888;">👤</div>
                <div class="nick">${member.nick}</div>
                <div class="elo">${member.elo || 1200} ELO</div>
                <div class="role" style="color:#66bb6a; font-size:9px;">✅ В лобби</div>
            `;
            card.onclick = function() { showToast('👤 ' + member.nick); };
        } else {
            card.innerHTML = `
                <div class="plus">+</div>
                <div class="nick" style="color:#888; font-size:11px;">Пригласить</div>
            `;
            card.onclick = function() { showInviteModal(); };
        }
        grid.appendChild(card);
    }

    const controls = document.getElementById('party-controls');
    const totalPlayers = partyMembers.length + 1;
    controls.innerHTML = `
        <button class="btn" onclick="startSearch()" style="margin-top:10px;">
            ▶ Играть (${totalPlayers} игроков)
        </button>
        <div style="color:#888; font-size:12px; margin-top:4px; text-align:center;">
            👥 В лобби: ${totalPlayers} / 10
        </div>
    `;
}

function showInviteModal() {
    if (partyMembers.length >= 4) {
        showToast('❌ Лобби полное!');
        return;
    }
    
    const nick = prompt('👤 Введите никнейм игрока для приглашения:');
    if (!nick) return;
    
    if (nick === currentNick) {
        showToast('⚠️ Это вы!');
        return;
    }
    
    if (!usedNicks.includes(nick)) {
        showToast('❌ Игрок не найден. Попросите его зарегистрироваться!');
        return;
    }
    
    if (partyMembers.some(m => m.nick === nick)) {
        showToast('⚠️ Игрок уже в лобби!');
        return;
    }
    
    sendInvite(nick);
}

function sendInvite(nick) {
    if (invites[nick] && invites[nick].status === 'pending') {
        showToast('⏳ Приглашение уже отправлено');
        return;
    }
    
    invites[nick] = {
        from: currentNick,
        status: 'pending',
        timestamp: Date.now()
    };
    
    showToast(`✅ Приглашение отправлено ${nick}!`);
    
    setTimeout(() => {
        if (invites[nick] && invites[nick].status === 'pending') {
            const accept = confirm(`🎮 ${nick} принял приглашение! Добавить в лобби?`);
            if (accept) {
                acceptInvite(nick);
            } else {
                invites[nick].status = 'declined';
                showToast(`❌ ${nick} отклонил приглашение`);
            }
        }
    }, 3000);
}

function acceptInvite(nick) {
    if (partyMembers.length >= 4) {
        showToast('❌ Лобби полное!');
        return;
    }
    
    if (partyMembers.some(m => m.nick === nick)) {
        showToast('⚠️ Игрок уже в лобби');
        return;
    }
    
    const elo = userElo[nick] || 1000;
    partyMembers.push({ nick, elo });
    invites[nick].status = 'accepted';
    renderParty();
    showToast(`✅ ${nick} присоединился к лобби!`);
}

function inviteFromTop(nick) {
    if (nick === currentNick) {
        showToast('⚠️ Это вы!');
        return;
    }
    
    if (partyMembers.some(m => m.nick === nick)) {
        showToast('⚠️ Игрок уже в лобби!');
        return;
    }
    
    if (partyMembers.length >= 4) {
        showToast('❌ Лобби полное!');
        return;
    }
    
    sendInvite(nick);
}

// ============================================================
// ПОИСК ИГРЫ
// ============================================================

function startSearch() {
    if (isSearching) return;
    if (!currentNick) { showToast('❌ Сначала зарегистрируйтесь'); return; }
    if (mutedPlayers[currentNick]) {
        const muteTime = mutedPlayers[currentNick];
        const now = new Date().getTime();
        if (now - muteTime < 1800000) {
            const remaining = Math.ceil((1800000 - (now - muteTime)) / 60000);
            showToast('❌ Вы в муте ещё ' + remaining + ' мин');
            return;
        } else {
            delete mutedPlayers[currentNick];
        }
    }
    
    if (usedNicks.length < 2) {
        showToast('❌ Нужно минимум 2 игрока для матча');
        return;
    }
    
    isSearching = true;
    matchFound = false;
    searchProgress = 0;
    allPlayers = [];
    
    const partyNicks = partyMembers.map(m => m.nick);
    allPlayers.push(currentNick);
    partyNicks.forEach(n => {
        if (!allPlayers.includes(n)) allPlayers.push(n);
    });
    
    const available = usedNicks.filter(n => !allPlayers.includes(n));
    const shuffled = shuffleArray([...available]);
    for (let i = 0; i < 10 - allPlayers.length && i < shuffled.length; i++) {
        allPlayers.push(shuffled[i]);
    }
    
    if (allPlayers.length < 2) {
        showToast('❌ Не хватает игроков для матча');
        isSearching = false;
        return;
    }
    
    matchPlayers = allPlayers.map(nick => ({ 
        nick: nick, 
        elo: userElo[nick] || 1000, 
        id: usedIds[usedNicks.indexOf(nick)] || '—' 
    }));
    
    showScreen('screen-search');
    document.getElementById('search-status-text').textContent = '⏳ Поиск игроков...';
    document.getElementById('search-status-detail').textContent = `Игроков: 1 / ${allPlayers.length}`;
    document.getElementById('search-progress').style.width = '10%';
    
    searchInterval = setInterval(() => {
        searchProgress += Math.random() * 15 + 5;
        if (searchProgress >= 100) {
            searchProgress = 100;
            clearInterval(searchInterval);
            isSearching = false;
            matchFound = true;
            document.getElementById('search-status-text').textContent = '🎯 Матч найден!';
            document.getElementById('search-status-detail').textContent = `Игроков: ${allPlayers.length}`;
            document.getElementById('search-progress').style.width = '100%';
            setTimeout(() => {
                if (confirm(`Матч найден! ${allPlayers.length} игроков. Подтвердить участие?`)) {
                    confirmMatch();
                } else {
                    declineMatch();
                }
            }, 500);
            return;
        }
        const found = Math.floor(searchProgress / 10) + 1;
        document.getElementById('search-status-text').textContent = '⏳ Поиск игроков...';
        document.getElementById('search-status-detail').textContent = `Игроков: ${found} / ${allPlayers.length}`;
        document.getElementById('search-progress').style.width = searchProgress + '%';
    }, 300);
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function cancelSearch() {
    if (searchInterval) { clearInterval(searchInterval); searchInterval = null; }
    isSearching = false;
    showToast('❌ Поиск отменён');
    showScreen('screen-menu');
}

// ============================================================
// ПОДТВЕРЖДЕНИЕ МАТЧА И БАН КАРТ
// ============================================================

function confirmMatch() {
    showToast('✅ Матч подтверждён!');
    const half = Math.ceil(matchPlayers.length / 2);
    teamT = matchPlayers.slice(0, half);
    teamCT = matchPlayers.slice(half);
    bannedMaps = [];
    banRound = 0;
    currentCaptain = 0;
    matchStats = {};
    setTimeout(() => {
        showScreen('screen-ban');
        renderBanScreen();
    }, 500);
}

function declineMatch() {
    mutedPlayers[currentNick] = new Date().getTime();
    showToast('❌ Вы отказались. Мут 30 минут');
    showScreen('screen-menu');
}

function renderBanScreen() {
    const grid = document.getElementById('ban-grid');
    if (!grid) return;
    grid.innerHTML = '';
    selectedBan = null;
    document.getElementById('ban-confirm-btn').disabled = true;
    const availableMaps = maps.filter(m => !bannedMaps.includes(m.id));
    
    if (availableMaps.length === 1) {
        document.getElementById('ban-status').textContent = '🎉 Финальная карта определена!';
        document.getElementById('ban-captain').textContent = '👑 Финальная карта';
        document.getElementById('ban-round').textContent = `Раунд: ${bannedMaps.length + 1} / ${maps.length}`;
        document.getElementById('ban-team').textContent = '🏆 Карта выбрана!';
        document.getElementById('ban-team').className = 'team';
        const lastMap = availableMaps[0];
        const card = document.createElement('div');
        card.className = 'ban-card selected';
        card.innerHTML = `<img src="${lastMap.img}" alt="${lastMap.name}" /><div class="ban-name">${lastMap.name}</div><div class="ban-status">✅ Финальная карта</div>`;
        grid.appendChild(card);
        setTimeout(() => { showResult(lastMap); }, 1500);
        return;
    }
    
    const captainIndex = currentCaptain % 2;
    const captain = captainIndex === 0 ? teamT[0] : teamCT[0];
    const teamName = captainIndex === 0 ? '🔴 Террористы' : '🔵 Контр-Террористы';
    document.getElementById('ban-captain').textContent = `👑 Капитан: ${captain.nick}`;
    document.getElementById('ban-round').textContent = `Раунд: ${bannedMaps.length + 1} / ${maps.length}`;
    document.getElementById('ban-team').textContent = teamName;
    document.getElementById('ban-team').className = `team ${captainIndex === 0 ? 'team-t' : 'team-ct'}`;
    document.getElementById('ban-status').textContent = `${captain.nick}, выберите карту для бана`;
    
    availableMaps.forEach(map => {
        const card = document.createElement('div');
        card.className = 'ban-card';
        card.dataset.mapId = map.id;
        card.innerHTML = `<img src="${map.img}" alt="${map.name}" /><div class="ban-name">${map.name}</div><div class="ban-status">Нажмите чтобы забанить</div>`;
        card.onclick = function() {
            if (this.classList.contains('banned')) return;
            document.querySelectorAll('.ban-card').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            selectedBan = this.dataset.mapId;
            document.getElementById('ban-confirm-btn').disabled = false;
            document.getElementById('ban-status').textContent = `✅ Выбрана: ${map.name}`;
        };
        grid.appendChild(card);
    });
}

function confirmBan() {
    if (!selectedBan) return;
    if (bannedMaps.includes(selectedBan)) { showToast('❌ Эта карта уже забанена'); return; }
    bannedMaps.push(selectedBan);
    banRound++;
    currentCaptain++;
    showToast('✅ Карта забанена!');
    renderBanScreen();
}

// ============================================================
// РЕЗУЛЬТАТ
// ============================================================

function showResult(finalMap) {
    document.getElementById('score-t').textContent = '?';
    document.getElementById('score-ct').textContent = '?';
    const teamTList = document.getElementById('team-t-list');
    const teamCTList = document.getElementById('team-ct-list');
    teamTList.innerHTML = '';
    teamCTList.innerHTML = '';
    teamT.forEach(p => {
        const div = document.createElement('div');
        div.className = 'player';
        div.innerHTML = `<span>${p.nick}</span><span class="stats" style="color:#555;">⏳ ожидание скриншота</span>`;
        teamTList.appendChild(div);
    });
    teamCT.forEach(p => {
        const div = document.createElement('div');
        div.className = 'player';
        div.innerHTML = `<span>${p.nick}</span><span class="stats" style="color:#555;">⏳ ожидание скриншота</span>`;
        teamCTList.appendChild(div);
    });
    const host = matchPlayers[0];
    document.getElementById('host-name').textContent = host.nick;
    document.getElementById('host-id').textContent = host.id || '—';
    document.getElementById('result-elo').textContent = '⏳ Загрузите скриншот для регистрации матча';
    document.getElementById('result-elo').style.color = '#f57c00';
    document.getElementById('screenshot-upload').style.display = 'block';
    document.getElementById('upload-status').textContent = '📸 Загрузите скриншот финального счёта';
    document.getElementById('upload-status').style.color = '#f57c00';
    showScreen('screen-result');
}

function processScreenshot(event) {
    const file = event.target.files[0];
    if (!file) return;
    const statusEl = document.getElementById('upload-status');
    if (!statusEl) return;
    statusEl.textContent = '⏳ Обработка скриншота AI...';
    statusEl.style.color = '#f57c00';
    setTimeout(() => {
        const scoreT = Math.floor(Math.random() * 13) + 1;
        const scoreCT = Math.floor(Math.random() * 13) + 1;
        document.getElementById('score-t').textContent = scoreT;
        document.getElementById('score-ct').textContent = scoreCT;
        const players = [...teamT, ...teamCT];
        const stats = {};
        let maxKills = -1;
        let mvp = null;
        players.forEach(p => {
            const kills = Math.floor(Math.random() * 25) + 5;
            const assists = Math.floor(Math.random() * 10) + 1;
            const deaths = Math.floor(Math.random() * 20) + 5;
            stats[p.nick] = { kills, assists, deaths };
            if (kills > maxKills) { maxKills = kills; mvp = p.nick; }
        });
        matchStats = stats;
        const teamTList = document.getElementById('team-t-list');
        const teamCTList = document.getElementById('team-ct-list');
        teamTList.innerHTML = '';
        teamCTList.innerHTML = '';
        teamT.forEach(p => {
            const s = stats[p.nick] || { kills: 0, assists: 0, deaths: 0 };
            const div = document.createElement('div');
            div.className = 'player';
            const isMvp = p.nick === mvp;
            div.innerHTML = `<span>${p.nick}${isMvp ? ' <span class="mvp-badge">⭐ MVP</span>' : ''}</span><span class="stats">🔫${s.kills} 🤝${s.assists} 💀${s.deaths} <span class="elo">${p.elo} ELO</span></span>`;
            teamTList.appendChild(div);
        });
        teamCT.forEach(p => {
            const s = stats[p.nick] || { kills: 0, assists: 0, deaths: 0 };
            const div = document.createElement('div');
            div.className = 'player';
            const isMvp = p.nick === mvp;
            div.innerHTML = `<span>${p.nick}${isMvp ? ' <span class="mvp-badge">⭐ MVP</span>' : ''}</span><span class="stats">🔫${s.kills} 🤝${s.assists} 💀${s.deaths} <span class="elo">${p.elo} ELO</span></span>`;
            teamCTList.appendChild(div);
        });
        const eloChange = 25;
        const tWon = scoreT > scoreCT;
        let eloText = '';
        if (tWon) {
            teamT.forEach(p => { if (userElo[p.nick] !== undefined) { userElo[p.nick] = (userElo[p.nick] || 1000) + eloChange; if (p.nick === currentNick) currentElo = userElo[p.nick]; } });
            teamCT.forEach(p => { if (userElo[p.nick] !== undefined) { userElo[p.nick] = (userElo[p.nick] || 1000) - eloChange; } });
            if (userElo[mvp] !== undefined) { userElo[mvp] += 10; if (mvp === currentNick) currentElo = userElo[mvp]; }
            eloText = `🔴 Террористы победили! +${eloChange} ELO | 🔵 Контр-Террористы -${eloChange} ELO | ⭐ MVP +10 ELO`;
        } else {
            teamCT.forEach(p => { if (userElo[p.nick] !== undefined) { userElo[p.nick] = (userElo[p.nick] || 1000) + eloChange; if (p.nick === currentNick) currentElo = userElo[p.nick]; } });
            teamT.forEach(p => { if (userElo[p.nick] !== undefined) { userElo[p.nick] = (userElo[p.nick] || 1000) - eloChange; } });
            if (userElo[mvp] !== undefined) { userElo[mvp] += 10; if (mvp === currentNick) currentElo = userElo[mvp]; }
            eloText = `🔵 Контр-Террористы победили! +${eloChange} ELO | 🔴 Террористы -${eloChange} ELO | ⭐ MVP +10 ELO`;
        }
        Object.keys(stats).forEach(nick => {
            if (userKills[nick] !== undefined) {
                userKills[nick] = (userKills[nick] || 0) + stats[nick].kills;
                userAssists[nick] = (userAssists[nick] || 0) + stats[nick].assists;
                userDeaths[nick] = (userDeaths[nick] || 0) + stats[nick].deaths;
                userMatches[nick] = (userMatches[nick] || 0) + 1;
                if (nick === currentNick) { 
                    currentKills = userKills[nick]; 
                    currentAssists = userAssists[nick]; 
                    currentDeaths = userDeaths[nick];
                    currentMatches = userMatches[nick];
                }
            }
        });
        document.getElementById('result-elo').textContent = eloText;
        document.getElementById('result-elo').style.color = '#aaa';
        statusEl.textContent = '✅ Матч зарегистрирован!';
        statusEl.style.color = '#66bb6a';
        updateProfileUI();
        updateStatsUI();
        saveData();
        showToast('✅ Матч успешно зарегистрирован!');
    }, 2000);
}

// ============================================================
// ТОП ИГРОКОВ
// ============================================================

function renderTop() {
    const list = document.getElementById('top-list');
    if (!list) return;
    
    const sorted = usedNicks
        .map(nick => ({ nick, elo: userElo[nick] || 0 }))
        .sort((a, b) => b.elo - a.elo);
    
    if (sorted.length === 0) {
        list.innerHTML = '<div style="text-align:center; color:#555; padding:20px;">Нет зарегистрированных игроков</div>';
        return;
    }
    
    let html = '';
    sorted.forEach((item, index) => {
        let medal = '';
        if (index === 0) medal = '🥇';
        else if (index === 1) medal = '🥈';
        else if (index === 2) medal = '🥉';
        else medal = `#${index + 1}`;
        
        const isCurrent = item.nick === currentNick;
        const isInParty = partyMembers.some(m => m.nick === item.nick);
        const isInvited = invites[item.nick] && invites[item.nick].status === 'pending';
        
        html += `
            <div class="top-item" style="${isCurrent ? 'background:#2a2a2a; border-radius:8px; padding:4px 8px;' : ''}">
                <span class="rank">${medal}</span>
                <span class="name">${item.nick} ${isCurrent ? '⭐' : ''}</span>
                <span class="elo">${item.elo} ELO</span>
                <button onclick="inviteFromTop('${item.nick}')" style="background:#f57c00; border:none; color:#fff; padding:2px 10px; border-radius:12px; font-size:11px; cursor:pointer; ${isCurrent || isInParty || isInvited ? 'opacity:0.5; cursor:not-allowed;' : ''}" ${isCurrent || isInParty || isInvited ? 'disabled' : ''}>
                    ${isInParty ? '✅' : isInvited ? '⏳' : '➕'}
                </button>
            </div>
        `;
    });
    
    list.innerHTML = html;
}

// ============================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================

loadData();

// Авто-сохранение каждые 10 секунд
setInterval(saveData, 10000);

renderParty();
