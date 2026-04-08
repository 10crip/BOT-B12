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

function ensureGuildStructure(data, guildId) {
    if (!data[guildId]) {
        data[guildId] = {
            config: {
                allowedChannelIds: [],
                allowedCategoryIds: []
            },
            users: {}
        };
        return;
    }

    const guildData = data[guildId];

    const hasOldUserStructure = Object.prototype.hasOwnProperty.call(guildData, 'totalMs')
        || Object.prototype.hasOwnProperty.call(guildData, 'active')
        || Object.prototype.hasOwnProperty.call(guildData, 'openedAt')
        || Object.prototype.hasOwnProperty.call(guildData, 'voiceJoinedAt')
        || Object.prototype.hasOwnProperty.call(guildData, 'accumulatedMsCurrent')
        || Object.prototype.hasOwnProperty.call(guildData, 'awaySince')
        || Object.prototype.hasOwnProperty.call(guildData, 'voiceChannelId')
        || Object.prototype.hasOwnProperty.call(guildData, 'memberTag');

    if (hasOldUserStructure) {
        data[guildId] = {
            config: {
                allowedChannelIds: [],
                allowedCategoryIds: []
            },
            users: {
                ...guildData
            }
        };
        return;
    }

    if (!guildData.config || typeof guildData.config !== 'object') {
        guildData.config = {
            allowedChannelIds: [],
            allowedCategoryIds: []
        };
    }

    if (!Array.isArray(guildData.config.allowedChannelIds)) {
        guildData.config.allowedChannelIds = [];
    }

    if (!Array.isArray(guildData.config.allowedCategoryIds)) {
        guildData.config.allowedCategoryIds = [];
    }

    if (!guildData.users || typeof guildData.users !== 'object') {
        const maybeUsers = { ...guildData };
        delete maybeUsers.config;
        guildData.users = maybeUsers;
    }
}

function ensureGuildUser(data, guildId, userId) {
    ensureGuildStructure(data, guildId);

    if (!data[guildId].users[userId]) {
        data[guildId].users[userId] = {
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

function getGuildPointConfig(guildId) {
    const data = readData();
    ensureGuildStructure(data, guildId);
    saveData(data);

    return data[guildId].config;
}

function setGuildPointConfig(guildId, newConfig = {}) {
    const data = readData();
    ensureGuildStructure(data, guildId);

    const currentConfig = data[guildId].config;

    data[guildId].config = {
        allowedChannelIds: Array.isArray(newConfig.allowedChannelIds)
            ? [...new Set(newConfig.allowedChannelIds.map(String))]
            : currentConfig.allowedChannelIds || [],
        allowedCategoryIds: Array.isArray(newConfig.allowedCategoryIds)
            ? [...new Set(newConfig.allowedCategoryIds.map(String))]
            : currentConfig.allowedCategoryIds || []
    };

    saveData(data);
    return data[guildId].config;
}

function addAllowedChannel(guildId, channelId) {
    const data = readData();
    ensureGuildStructure(data, guildId);

    const id = String(channelId);
    const list = data[guildId].config.allowedChannelIds;

    if (!list.includes(id)) {
        list.push(id);
        saveData(data);
    }

    return data[guildId].config;
}

function removeAllowedChannel(guildId, channelId) {
    const data = readData();
    ensureGuildStructure(data, guildId);

    const id = String(channelId);
    data[guildId].config.allowedChannelIds =
        data[guildId].config.allowedChannelIds.filter(item => item !== id);

    saveData(data);
    return data[guildId].config;
}

function addAllowedCategory(guildId, categoryId) {
    const data = readData();
    ensureGuildStructure(data, guildId);

    const id = String(categoryId);
    const list = data[guildId].config.allowedCategoryIds;

    if (!list.includes(id)) {
        list.push(id);
        saveData(data);
    }

    return data[guildId].config;
}

function removeAllowedCategory(guildId, categoryId) {
    const data = readData();
    ensureGuildStructure(data, guildId);

    const id = String(categoryId);
    data[guildId].config.allowedCategoryIds =
        data[guildId].config.allowedCategoryIds.filter(item => item !== id);

    saveData(data);
    return data[guildId].config;
}

function getUserPoint(guildId, userId) {
    const data = readData();
    ensureGuildUser(data, guildId, userId);
    saveData(data);
    return data[guildId].users[userId];
}

function updateUserPoint(guildId, userId, newData) {
    const data = readData();
    ensureGuildUser(data, guildId, userId);

    data[guildId].users[userId] = {
        ...data[guildId].users[userId],
        ...newData
    };

    saveData(data);
    return data[guildId].users[userId];
}

function closeUserPoint(guildId, userId, finalSessionMs) {
    const data = readData();
    ensureGuildUser(data, guildId, userId);

    data[guildId].users[userId].totalMs += finalSessionMs;
    data[guildId].users[userId].active = false;
    data[guildId].users[userId].openedAt = null;
    data[guildId].users[userId].voiceJoinedAt = null;
    data[guildId].users[userId].accumulatedMsCurrent = 0;
    data[guildId].users[userId].awaySince = null;
    data[guildId].users[userId].voiceChannelId = null;

    saveData(data);
    return data[guildId].users[userId];
}

function getTop10(guildId) {
    const data = readData();
    ensureGuildStructure(data, guildId);

    const guildUsers = data[guildId].users || {};

    return Object.entries(guildUsers)
        .map(([userId, info]) => ({
            userId,
            totalMs: info.totalMs || 0,
            memberTag: info.memberTag || 'Desconhecido'
        }))
        .sort((a, b) => b.totalMs - a.totalMs)
        .slice(0, 10);
}

function getTrackedVoiceInfo(guildId, channel) {
    const config = getGuildPointConfig(guildId);

    if (!channel) {
        return {
            valid: false,
            matchedBy: null,
            channelId: null,
            parentId: null,
            allowedChannelIds: config.allowedChannelIds || [],
            allowedCategoryIds: config.allowedCategoryIds || []
        };
    }

    const channelId = String(channel.id);
    const parentId = String(channel.parentId || channel.parent?.id || '');

    const allowedChannelIds = (config.allowedChannelIds || []).map(String);
    const allowedCategoryIds = (config.allowedCategoryIds || []).map(String);

    const byChannel = allowedChannelIds.includes(channelId);
    const byCategory = parentId ? allowedCategoryIds.includes(parentId) : false;

    return {
        valid: byChannel || byCategory,
        matchedBy: byChannel ? 'channel' : byCategory ? 'category' : null,
        channelId,
        parentId: parentId || null,
        allowedChannelIds,
        allowedCategoryIds
    };
}

function isTrackedVoiceChannel(guildId, channel) {
    return getTrackedVoiceInfo(guildId, channel).valid;
}

module.exports = {
    getGuildPointConfig,
    setGuildPointConfig,
    addAllowedChannel,
    removeAllowedChannel,
    addAllowedCategory,
    removeAllowedCategory,
    getTrackedVoiceInfo,
    isTrackedVoiceChannel,
    getUserPoint,
    updateUserPoint,
    closeUserPoint,
    getTop10
};
