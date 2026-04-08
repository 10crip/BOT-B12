const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data', 'transferSessions.json');

function ensureFile() {
    const dataDir = path.join(__dirname, '..', 'data');

    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify({}, null, 4));
    }
}

function readSessions() {
    ensureFile();

    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw || '{}');
    } catch (error) {
        console.error('❌ Erro ao ler transferSessions.json:', error);
        return {};
    }
}

function saveSessions(sessions) {
    ensureFile();

    try {
        fs.writeFileSync(filePath, JSON.stringify(sessions, null, 4));
    } catch (error) {
        console.error('❌ Erro ao salvar transferSessions.json:', error);
    }
}

function getSession(channelId) {
    const sessions = readSessions();
    return sessions[channelId] || null;
}

function setSession(channelId, data) {
    const sessions = readSessions();
    sessions[channelId] = data;
    saveSessions(sessions);
    return sessions[channelId];
}

function updateSession(channelId, newData) {
    const sessions = readSessions();

    if (!sessions[channelId]) {
        sessions[channelId] = {};
    }

    sessions[channelId] = {
        ...sessions[channelId],
        ...newData
    };

    saveSessions(sessions);
    return sessions[channelId];
}

function deleteSession(channelId) {
    const sessions = readSessions();

    if (sessions[channelId]) {
        delete sessions[channelId];
        saveSessions(sessions);
    }
}

module.exports = {
    getSession,
    setSession,
    updateSession,
    deleteSession
};
