const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'resetbp',

    async execute(message) {
        if (!message.guild) return;

        // Permissão
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('❌ You need administrator permission to reset the time tracking.')
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
                .catch(() => {});
        }

        const filePath = path.join(__dirname, '..', 'data', 'batePonto.json');

        try {
            if (!fs.existsSync(filePath)) {
                return message.reply('❌ No time tracking data found.')
                    .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
                    .catch(() => {});
            }

            const raw = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(raw || '{}');

            const guildId = message.guild.id;

            if (!data[guildId] || !data[guildId].users) {
                return message.reply('❌ No data found for this server.')
                    .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
                    .catch(() => {});
            }

            // RESETA APENAS OS USUÁRIOS
            for (const userId of Object.keys(data[guildId].users)) {
                data[guildId].users[userId] = {
                    totalMs: 0,
                    active: false,
                    openedAt: null,
                    voiceJoinedAt: null,
                    accumulatedMsCurrent: 0,
                    awaySince: null,
                    voiceChannelId: null,
                    memberTag: data[guildId].users[userId].memberTag || null
                };
            }

            fs.writeFileSync(filePath, JSON.stringify(data, null, 4));

            await message.reply('✅ Time tracking rank has been reset successfully.')
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
                .catch(() => {});

            await message.delete().catch(() => {});

        } catch (error) {
            console.error('❌ Error resetting bate-ponto:', error);

            await message.reply('❌ An error occurred while resetting the data.')
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
                .catch(() => {});
        }
    }
};
