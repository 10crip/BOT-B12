const { EmbedBuilder } = require('discord.js');
const {
    getUserPoint,
    updateUserPoint,
    closeUserPoint,
    getTrackedVoiceInfo
} = require('../utils/batePonto');

const LOG_CHANNEL_ID = '1479264100503523522';
const AUTO_CLOSE_DELAY = 90 * 1000;

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

function clearAwayTimer(timerKey) {
    if (awayTimers.has(timerKey)) {
        clearTimeout(awayTimers.get(timerKey));
        awayTimers.delete(timerKey);
    }
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

        const oldInfo = getTrackedVoiceInfo(guild.id, oldState.channel);
        const newInfo = getTrackedVoiceInfo(guild.id, newState.channel);

        const oldValid = oldInfo.valid;
        const newValid = newInfo.valid;

        const timerKey = `${guild.id}:${userId}`;

        // Continua em canal permitido ou moveu entre canais permitidos
        if (oldValid && newValid) {
            updateUserPoint(guild.id, userId, {
                voiceChannelId: newState.channel?.id || null,
                awaySince: null
            });

            clearAwayTimer(timerKey);
            return;
        }

        // Saiu de um canal permitido para canal inválido ou desconectou
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

            clearAwayTimer(timerKey);

            const timeout = setTimeout(async () => {
                const currentPoint = getUserPoint(guild.id, userId);

                if (!currentPoint.active) {
                    awayTimers.delete(timerKey);
                    return;
                }

                if (!currentPoint.awaySince) {
                    awayTimers.delete(timerKey);
                    return;
                }

                const memberNow = guild.members.cache.get(userId) || await guild.members.fetch(userId).catch(() => null);
                const currentVoiceChannel = memberNow?.voice?.channel || null;
                const currentVoiceInfo = getTrackedVoiceInfo(guild.id, currentVoiceChannel);

                // Se voltou para uma call válida antes do tempo acabar, cancela o fechamento
                if (currentVoiceInfo.valid) {
                    updateUserPoint(guild.id, userId, {
                        voiceJoinedAt: Date.now(),
                        awaySince: null,
                        voiceChannelId: currentVoiceChannel.id,
                        memberTag: member.user.tag
                    });

                    awayTimers.delete(timerKey);
                    return;
                }

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
            }, AUTO_CLOSE_DELAY);

            awayTimers.set(timerKey, timeout);
            return;
        }

        // Voltou para um canal permitido
        if (!oldValid && newValid) {
            updateUserPoint(guild.id, userId, {
                voiceJoinedAt: Date.now(),
                awaySince: null,
                voiceChannelId: newState.channel.id,
                memberTag: member.user.tag
            });

            clearAwayTimer(timerKey);
        }
    }
};
