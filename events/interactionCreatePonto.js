const {
    EmbedBuilder
} = require('discord.js');

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
    name: 'interactionCreate',

    async execute(interaction) {
        if (!interaction.isButton()) return;

        // ==================================================
        // INICIAR PONTO
        // ==================================================
        if (interaction.customId === 'iniciar_ponto') {
            if (interaction.channelId !== PANEL_CHANNEL_ID) {
                return interaction.reply({
                    content: '❌ Este botão só pode ser usado no painel oficial de bate-ponto.',
                    ephemeral: true
                });
            }

            const currentVoice = interaction.member.voice.channel;

            if (!currentVoice) {
                return interaction.reply({
                    content: '❌ Você precisa estar conectado em uma call para iniciar o bate-ponto.',
                    ephemeral: true
                });
            }

            const voiceInfo = getTrackedVoiceInfo(interaction.guild.id, currentVoice);

            if (!voiceInfo.valid) {
                const canaisPermitidosTexto = voiceInfo.allowedChannelIds.length
                    ? voiceInfo.allowedChannelIds.map(id => `\`${id}\``).join('\n')
                    : '`nenhum canal configurado`';

                const categoriasPermitidasTexto = voiceInfo.allowedCategoryIds.length
                    ? voiceInfo.allowedCategoryIds.map(id => `\`${id}\``).join('\n')
                    : '`nenhuma categoria configurada`';

                return interaction.reply({
                    content:
                        `❌ Para iniciar o bate-ponto, você precisa estar em uma call válida configurada no sistema.\n\n` +
                        `🔎 Canal detectado: \`${voiceInfo.channelId || 'nenhum'}\`\n` +
                        `📁 Categoria detectada: \`${voiceInfo.parentId || 'nenhuma'}\`\n\n` +
                        `✅ Canais permitidos:\n${canaisPermitidosTexto}\n\n` +
                        `✅ Categorias permitidas:\n${categoriasPermitidasTexto}`,
                    ephemeral: true
                });
            }

            const point = getUserPoint(interaction.guild.id, interaction.user.id);

            if (point.active) {
                return interaction.reply({
                    content: '❌ Você já está com um ponto aberto.',
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
                .setTitle('🟢 PONTO INICIADO')
                .addFields(
                    {
                        name: 'MEMBRO',
                        value: `${interaction.user}\n\`${interaction.user.tag}\``,
                        inline: false
                    },
                    {
                        name: 'CANAL DE VOZ',
                        value: `${currentVoice}`,
                        inline: false
                    },
                    {
                        name: 'CATEGORIA',
                        value: `\`${voiceInfo.parentId || 'sem categoria'}\``,
                        inline: false
                    },
                    {
                        name: 'VALIDADO POR',
                        value: voiceInfo.matchedBy === 'channel' ? 'Canal permitido' : 'Categoria permitida',
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

            await sendLog(interaction.guild, embed);

            return interaction.reply({
                content: '✅ Seu bate-ponto foi iniciado com sucesso.',
                ephemeral: true
            });
        }

        // ==================================================
        // FECHAR PONTO
        // ==================================================
        if (interaction.customId === 'fechar_ponto') {
            if (interaction.channelId !== PANEL_CHANNEL_ID) {
                return interaction.reply({
                    content: '❌ Este botão só pode ser usado no painel oficial de bate-ponto.',
                    ephemeral: true
                });
            }

            const point = getUserPoint(interaction.guild.id, interaction.user.id);

            if (!point.active) {
                return interaction.reply({
                    content: '❌ Você não possui um ponto aberto.',
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
                .setTitle('🔴 PONTO FECHADO')
                .addFields(
                    {
                        name: 'MEMBRO',
                        value: `${interaction.user}\n\`${interaction.user.tag}\``,
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

            await sendLog(interaction.guild, embed);

            return interaction.reply({
                content: `✅ Seu ponto foi fechado. Tempo registrado: **${msToReadable(sessionMs)}**`,
                ephemeral: true
            });
        }

        // ==================================================
        // RANK
        // ==================================================
        if (interaction.customId === 'rank_ponto') {
            if (interaction.channelId !== PANEL_CHANNEL_ID) {
                return interaction.reply({
                    content: '❌ Este botão só pode ser usado no painel oficial de bate-ponto.',
                    ephemeral: true
                });
            }

            const guildConfig = getGuildConfig(interaction.guild.id);
            const admPontoRoleIds = guildConfig.admPontoRoleIds || [];

            const podeUsar = admPontoRoleIds.some(roleId => interaction.member.roles.cache.has(roleId));

            if (!podeUsar) {
                return interaction.reply({
                    content: '❌ Você não tem permissão para usar o rank do bate-ponto.',
                    ephemeral: true
                });
            }

            const top10 = getTop10(interaction.guild.id);
            const canalRank = interaction.guild.channels.cache.get(RANK_CHANNEL_ID);

            if (!canalRank) {
                return interaction.reply({
                    content: '❌ Não encontrei o canal de rank do bate-ponto.',
                    ephemeral: true
                });
            }

            const descricao = top10.length
                ? top10.map((item, index) => {
                    return `**${index + 1}.** <@${item.userId}> — \`${msToReadable(item.totalMs)}\``;
                }).join('\n')
                : 'Nenhum registro encontrado.';

            const embed = new EmbedBuilder()
                .setColor('#2B2D31')
                .setTitle('🏆 TOP 10 - BATE-PONTO B12')
                .setDescription(descricao)
                .setFooter({
                    text: `Solicitado por ${interaction.user.tag}`
                });

            await canalRank.send({
                embeds: [embed]
            }).catch(() => {});

            return interaction.reply({
                content: `✅ O rank do bate-ponto foi enviado em <#${RANK_CHANNEL_ID}>.`,
                ephemeral: true
            });
        }
    }
};
