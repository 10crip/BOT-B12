const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'data', 'guildConfigs.json');

function ensureFile() {
    const dataDir = path.join(__dirname, 'data');

    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify({}, null, 4));
    }
}

function readConfigs() {
    ensureFile();

    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw || '{}');
    } catch (error) {
        console.error('❌ Erro ao ler guildConfigs.json:', error);
        return {};
    }
}

function saveConfigs(configs) {
    ensureFile();

    try {
        fs.writeFileSync(filePath, JSON.stringify(configs, null, 4));
    } catch (error) {
        console.error('❌ Erro ao salvar guildConfigs.json:', error);
    }
}

function getGuildConfig(guildId) {
    const configs = readConfigs();
    return configs[guildId] || {};
}

function updateGuildConfig(guildId, newData) {
    const configs = readConfigs();

    if (!configs[guildId]) {
        configs[guildId] = {};
    }

    configs[guildId] = {
        ...configs[guildId],
        ...newData
    };

    saveConfigs(configs);
    return configs[guildId];
}

module.exports = {
    getGuildConfig,
    updateGuildConfig
};
