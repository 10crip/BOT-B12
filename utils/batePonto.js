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
        console.error('❌ Error reading batePonto.json:', error);
        return {};
    }
}

function saveData(data) {
    ensureFile();

    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
    } catch (error) {
        console.error('❌ Error saving batePonto.json:', error);
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
        const possibleUsers = { ...guildData };
        delete possibleUsers.config;
        guildData.users = possibleUsers;
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

function addAllowedChannel(guildId, channelId) {
    const data = readData();
    ensureGuildStructure(data, guildId);

    const id = String(channelId);

    if (!data[guildId].config.allowedChannelIds.includes(id)) {
        data[guildId].config.allowedChannelIds.push(id);
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

    if (!data[guildId].config.allowedCategoryIds.includes(id)) {
        data[guildId].config.allowedCategoryIds.push(id);
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

    return Object.entries(data[guildId].users || {})
        .map(([userId, info]) => ({
            userId,
            totalMs: info.totalMs || 0,
            memberTag: info.memberTag || 'Unknown'
        }))
        .sort((a, b) => b.totalMs - a.totalMs)
        .slice(0, 10);
}

module.exports = {
    getGuildPointConfig,
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
