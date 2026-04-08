const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data', 'batePonto.json');

function ensureFile() {
    const dataDir = path.join(__dirname, '..', 'data');

    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify({}, null, 4));
    }
}

function readData() {
    ensureFile();

    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw || '{}');
    } catch (error) {
        console.error('❌ Erro ao ler batePonto.json:', error);
        return {};
    }
}

function saveData(data) {
    ensureFile();

    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
    } catch (error) {
        console.error('❌ Erro ao salvar batePonto.json:', error);
    }
}

function ensureGuildUser(data, guildId, userId) {
    if (!data[guildId]) data[guildId] = {};
    if (!data[guildId][userId]) {
        data[guildId][userId] = {
            totalMs: 0,
            active: false,
            openedAt: null,
            voiceJoinedAt: null,
            accumulatedMsCurrent: 0,
            awaySince: null,
            voiceChannelId: null,
            memberTag: null
        };
    }
}

function getUserPoint(guildId, userId) {
    const data = readData();
    ensureGuildUser(data, guildId, userId);
    saveData(data);
    return data[guildId][userId];
}

function updateUserPoint(guildId, userId, newData) {
    const data = readData();
    ensureGuildUser(data, guildId, userId);

    data[guildId][userId] = {
        ...data[guildId][userId],
        ...newData
    };

    saveData(data);
    return data[guildId][userId];
}

function closeUserPoint(guildId, userId, finalSessionMs) {
    const data = readData();
    ensureGuildUser(data, guildId, userId);

    data[guildId][userId].totalMs += finalSessionMs;
    data[guildId][userId].active = false;
    data[guildId][userId].openedAt = null;
    data[guildId][userId].voiceJoinedAt = null;
    data[guildId][userId].accumulatedMsCurrent = 0;
    data[guildId][userId].awaySince = null;
    data[guildId][userId].voiceChannelId = null;

    saveData(data);
    return data[guildId][userId];
}

function getTop10(guildId) {
    const data = readData();
    const guildData = data[guildId] || {};

    return Object.entries(guildData)
        .map(([userId, info]) => ({
            userId,
            totalMs: info.totalMs || 0,
            memberTag: info.memberTag || 'Desconhecido'
        }))
        .sort((a, b) => b.totalMs - a.totalMs)
        .slice(0, 10);
}

module.exports = {
    getUserPoint,
    updateUserPoint,
    closeUserPoint,
    getTop10
};
