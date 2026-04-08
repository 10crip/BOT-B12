const { EmbedBuilder } = require('discord.js');
const {
    getUserPoint,
    updateUserPoint,
    closeUserPoint,
    isTrackedVoiceChannel
} = require('../utils/batePonto');

const LOG_CHANNEL_ID = '1479264100503523522';

const awayTimers = new Map();

function msToReadable(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours}h ${minutes}m ${seconds}s`;
}

function formatDateTime(date) {
    return {
        data: date.toLocaleDateString('pt-BR'),
        hora: date.toLocaleTimeString('pt-BR')
    };
}

async function sendLog(guild, embed) {
    const channel = guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!channel) return;
    await channel.send({ embeds: [embed] }).catch(() => {});
}

module.exports = {
    name: 'voiceStateUpdate',

    async execute(oldState, newState) {
        const member = newState.member || oldState.member;
        if (!member || member.user.bot) return;

        const guild = member.guild;
        const userId = member.id;
        const point = getUserPoint(guild.id, userId);

        if (!point.active) return;

        const oldValid = isTrackedVoiceChannel(guild.id, oldState.channel);
        const newValid = isTrackedVoiceChannel(guild.id, newState.channel);

        const timerKey = `${guild.id}:${userId}`;

        if (oldValid && newValid) {
            updateUserPoint(guild.id, userId, {
                voiceChannelId: newState.channel.id,
                awaySince: null
            });

            if (awayTimers.has(timerKey)) {
                clearTimeout(awayTimers.get(timerKey));
                awayTimers.delete(timerKey);
            }

            return;
        }

        if (oldValid && !newValid) {
            let accumulated = point.accumulatedMsCurrent || 0;

            if (point.voiceJoinedAt) {
                accumulated += Date.now() - point.voiceJoinedAt;
            }

            updateUserPoint(guild.id, userId, {
                accumulatedMsCurrent: accumulated,
                voiceJoinedAt: null,
                awaySince: Date.now(),
                voiceChannelId: null
            });

            if (awayTimers.has(timerKey)) {
                clearTimeout(awayTimers.get(timerKey));
                awayTimers.delete(timerKey);
            }

            const timeout = setTimeout(async () => {
                const currentPoint = getUserPoint(guild.id, userId);

                if (!currentPoint.active) return;
                if (!currentPoint.awaySince) return;

                const sessionMs = currentPoint.accumulatedMsCurrent || 0;
                closeUserPoint(guild.id, userId, sessionMs);

                const { data, hora } = formatDateTime(new Date());

                const embed = new EmbedBuilder()
                    .setColor('#2B2D31')
                    .setTitle('⏱️ TIME TRACKING CLOSED AUTOMATICALLY')
                    .addFields(
                        {
                            name: 'MEMBER',
                            value: `${member}\n\`${member.user.tag}\``,
                            inline: false
                        },
                        {
                            name: 'REASON',
                            value: 'User stayed 1 minute and 30 seconds outside an allowed voice channel.',
                            inline: false
                        },
                        {
                            name: 'TRACKED TIME',
                            value: msToReadable(sessionMs),
                            inline: false
                        },
                        {
                            name: 'DATE',
                            value: data,
                            inline: true
                        },
                        {
                            name: 'TIME',
                            value: hora,
                            inline: true
                        }
                    )
                    .setFooter({ text: 'B12 time tracking system' });

                await sendLog(guild, embed);

                awayTimers.delete(timerKey);

                await member.send(
                    `⏱️ Your time tracking was closed automatically in **${guild.name}**.\n` +
                    `Reason: you stayed more than 1 minute and 30 seconds outside an allowed voice channel.\n` +
                    `Tracked time: **${msToReadable(sessionMs)}**`
                ).catch(() => {});
            }, 90000);

            awayTimers.set(timerKey, timeout);
            return;
        }

        if (!oldValid && newValid) {
            updateUserPoint(guild.id, userId, {
                voiceJoinedAt: Date.now(),
                awaySince: null,
                voiceChannelId: newState.channel.id,
                memberTag: member.user.tag
            });

            if (awayTimers.has(timerKey)) {
                clearTimeout(awayTimers.get(timerKey));
                awayTimers.delete(timerKey);
            }
        }
    }
};
