const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data', 'advertencias.json');

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
        console.error('❌ Erro ao ler advertencias.json:', error);
        return {};
    }
}

function saveData(data) {
    ensureFile();

    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
    } catch (error) {
        console.error('❌ Erro ao salvar advertencias.json:', error);
    }
}

function getUserWarnings(guildId, userId) {
    const data = readData();

    if (!data[guildId]) data[guildId] = {};
    if (!data[guildId][userId]) {
        data[guildId][userId] = {
            total: 0,
            historico: []
        };
        saveData(data);
    }

    return data[guildId][userId];
}

function addWarning(guildId, userId, warningData) {
    const data = readData();

    if (!data[guildId]) data[guildId] = {};
    if (!data[guildId][userId]) {
        data[guildId][userId] = {
            total: 0,
            historico: []
        };
    }

    data[guildId][userId].total += 1;
    data[guildId][userId].historico.push(warningData);

    saveData(data);
    return data[guildId][userId];
}

function removeWarning(guildId, userId) {
    const data = readData();

    if (!data[guildId]) data[guildId] = {};
    if (!data[guildId][userId]) {
        data[guildId][userId] = {
            total: 0,
            historico: []
        };
    }

    if (data[guildId][userId].total <= 0) {
        return {
            total: 0,
            historico: [],
            removedWarning: null
        };
    }

    const removedWarning = data[guildId][userId].historico.pop() || null;
    data[guildId][userId].total = Math.max(0, data[guildId][userId].total - 1);

    saveData(data);

    return {
        ...data[guildId][userId],
        removedWarning
    };
}

module.exports = {
    getUserWarnings,
    addWarning,
    removeWarning
};
