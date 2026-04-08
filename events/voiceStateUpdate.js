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
    const horas = Math.floor(totalSeconds / 3600);
    const minutos = Math.floor((totalSeconds % 3600) / 60);
    const segundos = totalSeconds % 60;

    return `${horas}h ${minutos}m ${segundos}s`;
}

function formatDateTime(date) {
    return {
        data: date.toLocaleDateString('pt-BR'),
        hora: date.toLocaleTimeString('pt-BR')
    };
}

async function sendLog(guild, embed) {
    const canal = guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!canal) return;
    await canal.send({ embeds: [embed] }).catch(() => {});
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
                    .setTitle('⏱️ PONTO FECHADO AUTOMATICAMENTE')
                    .addFields(
                        {
                            name: 'MEMBRO',
                            value: `${member}\n\`${member.user.tag}\``,
                            inline: false
                        },
                        {
                            name: 'MOTIVO',
                            value: 'Ficou 1 minuto e 30 segundos fora de um canal permitido.',
                            inline: false
                        },
                        {
                            name: 'TEMPO FEITO',
                            value: msToReadable(sessionMs),
                            inline: false
                        },
                        {
                            name: 'DATA',
                            value: data,
                            inline: true
                        },
                        {
                            name: 'HORA',
                            value: hora,
                            inline: true
                        }
                    )
                    .setFooter({
                        text: 'Sistema de bate-ponto B12'
                    });

                await sendLog(guild, embed);

                awayTimers.delete(timerKey);

                await member.send(
                    `⏱️ Seu bate-ponto foi fechado automaticamente em **${guild.name}**.\n` +
                    `Motivo: você ficou mais de 1 minuto e 30 segundos fora de um canal permitido.\n` +
                    `Tempo registrado: **${msToReadable(sessionMs)}**`
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
