const { EmbedBuilder } = require('discord.js');

const { getGuildConfig } = require('../guildConfig');
const {
    getUserPoint,
    updateUserPoint,
    closeUserPoint,
    getTop10,
    getTrackedVoiceInfo
} = require('../utils/batePonto');

const PANEL_CHANNEL_ID = '1474852514359803993';
const LOG_CHANNEL_ID = '1479264100503523522';
const RANK_CHANNEL_ID = '1491293762180354159';

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
    name: 'interactionCreate',

    async execute(interaction) {
        if (!interaction.isButton()) return;

        if (interaction.customId === 'iniciar_ponto') {
            if (interaction.channelId !== PANEL_CHANNEL_ID) {
                return interaction.reply({
                    content: '❌ This button can only be used in the official time tracking panel.',
                    ephemeral: true
                });
            }

            const currentVoice = interaction.member.voice.channel;

            if (!currentVoice) {
                return interaction.reply({
                    content: '❌ You need to be connected to a voice channel to start the time tracking.',
                    ephemeral: true
                });
            }

            const voiceInfo = getTrackedVoiceInfo(interaction.guild.id, currentVoice);

            if (!voiceInfo.valid) {
                const allowedChannelsText = voiceInfo.allowedChannelIds.length
                    ? voiceInfo.allowedChannelIds.map(id => `\`${id}\``).join('\n')
                    : '`no channels configured`';

                const allowedCategoriesText = voiceInfo.allowedCategoryIds.length
                    ? voiceInfo.allowedCategoryIds.map(id => `\`${id}\``).join('\n')
                    : '`no categories configured`';

                return interaction.reply({
                    content:
                        `❌ To start time tracking, you must be in an allowed voice channel.\n\n` +
                        `🔎 Detected channel: \`${voiceInfo.channelId || 'none'}\`\n` +
                        `📁 Detected category: \`${voiceInfo.parentId || 'none'}\`\n\n` +
                        `✅ Allowed channels:\n${allowedChannelsText}\n\n` +
                        `✅ Allowed categories:\n${allowedCategoriesText}`,
                    ephemeral: true
                });
            }

            const point = getUserPoint(interaction.guild.id, interaction.user.id);

            if (point.active) {
                return interaction.reply({
                    content: '❌ You already have an active time tracking session.',
                    ephemeral: true
                });
            }

            const now = Date.now();

            updateUserPoint(interaction.guild.id, interaction.user.id, {
                active: true,
                openedAt: now,
                voiceJoinedAt: now,
                accumulatedMsCurrent: 0,
                awaySince: null,
                voiceChannelId: currentVoice.id,
                memberTag: interaction.user.tag
            });

            const { data, hora } = formatDateTime(new Date());

            const embed = new EmbedBuilder()
                .setColor('#2B2D31')
                .setTitle('🟢 TIME TRACKING STARTED')
                .addFields(
                    {
                        name: 'MEMBER',
                        value: `${interaction.user}\n\`${interaction.user.tag}\``,
                        inline: false
                    },
                    {
                        name: 'VOICE CHANNEL',
                        value: `${currentVoice}`,
                        inline: false
                    },
                    {
                        name: 'CATEGORY',
                        value: `\`${voiceInfo.parentId || 'no category'}\``,
                        inline: false
                    },
                    {
                        name: 'VALIDATED BY',
                        value: voiceInfo.matchedBy === 'channel' ? 'Allowed channel' : 'Allowed category',
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

            await sendLog(interaction.guild, embed);

            return interaction.reply({
                content: '✅ Your time tracking has started successfully.',
                ephemeral: true
            });
        }

        if (interaction.customId === 'fechar_ponto') {
            if (interaction.channelId !== PANEL_CHANNEL_ID) {
                return interaction.reply({
                    content: '❌ This button can only be used in the official time tracking panel.',
                    ephemeral: true
                });
            }

            const point = getUserPoint(interaction.guild.id, interaction.user.id);

            if (!point.active) {
                return interaction.reply({
                    content: '❌ You do not have an active time tracking session.',
                    ephemeral: true
                });
            }

            let sessionMs = point.accumulatedMsCurrent || 0;

            if (point.voiceJoinedAt) {
                sessionMs += Date.now() - point.voiceJoinedAt;
            }

            closeUserPoint(interaction.guild.id, interaction.user.id, sessionMs);

            const { data, hora } = formatDateTime(new Date());

            const embed = new EmbedBuilder()
                .setColor('#2B2D31')
                .setTitle('🔴 TIME TRACKING CLOSED')
                .addFields(
                    {
                        name: 'MEMBER',
                        value: `${interaction.user}\n\`${interaction.user.tag}\``,
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

            await sendLog(interaction.guild, embed);

            return interaction.reply({
                content: `✅ Your session has been closed. Tracked time: **${msToReadable(sessionMs)}**`,
                ephemeral: true
            });
        }

        if (interaction.customId === 'rank_ponto') {
            if (interaction.channelId !== PANEL_CHANNEL_ID) {
                return interaction.reply({
                    content: '❌ This button can only be used in the official time tracking panel.',
                    ephemeral: true
                });
            }

            const guildConfig = getGuildConfig(interaction.guild.id);
            const admPontoRoleIds = guildConfig.admPontoRoleIds || [];

            const canUse = admPontoRoleIds.some(roleId => interaction.member.roles.cache.has(roleId));

            if (!canUse) {
                return interaction.reply({
                    content: '❌ You do not have permission to use the time tracking rank.',
                    ephemeral: true
                });
            }

            const top10 = getTop10(interaction.guild.id);
            const rankChannel = interaction.guild.channels.cache.get(RANK_CHANNEL_ID);

            if (!rankChannel) {
                return interaction.reply({
                    content: '❌ Rank channel not found.',
                    ephemeral: true
                });
            }

            const description = top10.length
                ? top10.map((item, index) => `**${index + 1}.** <@${item.userId}> — \`${msToReadable(item.totalMs)}\``).join('\n')
                : 'No records found.';

            const embed = new EmbedBuilder()
                .setColor('#2B2D31')
                .setTitle('🏆 TOP 10 - B12 TIME TRACKING')
                .setDescription(description)
                .setFooter({ text: `Requested by ${interaction.user.tag}` });

            await rankChannel.send({ embeds: [embed] }).catch(() => {});

            return interaction.reply({
                content: `✅ The rank was sent to <#${RANK_CHANNEL_ID}>.`,
                ephemeral: true
            });
        }
    }
};
