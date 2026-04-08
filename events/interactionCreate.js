const {
    ChannelType,
    PermissionsBitField,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const { getGuildConfig } = require('../guildConfig');
const { setSession, getSession, updateSession } = require('../utils/transferSessions');

const PAINEL_TRANSFERENCIA_CHANNEL_ID = '1491220519494619227';
const REVISAO_TRANSFERENCIA_CHANNEL_ID = '1491244658448273550';

const QUESTIONS = [
    '1 - QUAL SEU NOME NA CIDADE?',
    '2 - QUAL SEU ID NA CIDADE?',
    '3 - QUAL CORP/FAC VOCE FAZIA PARTE?',
    '4 - PROVAS: FOTO/PRINT'
];

function hasAnyConfiguredRole(member, roleIds) {
    if (!Array.isArray(roleIds) || !roleIds.length) return false;
    return roleIds.some(roleId => member.roles.cache.has(roleId));
}

function buildRoleMentions(roleIds) {
    if (!Array.isArray(roleIds) || !roleIds.length) return '';
    return roleIds.map(roleId => `<@&${roleId}>`).join(' ');
}

module.exports = {
    name: 'interactionCreate',

    async execute(interaction) {
        if (interaction.isButton() && interaction.customId === 'abrir_transferencia') {
            if (interaction.channelId !== PAINEL_TRANSFERENCIA_CHANNEL_ID) {
                return interaction.reply({
                    content: '❌ Este botão só pode ser usado no painel oficial de transferência.',
                    ephemeral: true
                });
            }

            const guildConfig = getGuildConfig(interaction.guild.id);
            const admRecRoleIds = guildConfig.admRecRoleIds || [];

            if (!admRecRoleIds.length) {
                return interaction.reply({
                    content: '❌ Nenhum cargo foi configurado em `!setadmrec`.',
                    ephemeral: true
                });
            }

            const categoriaDoPainel = interaction.channel.parentId;

            if (!categoriaDoPainel) {
                return interaction.reply({
                    content: '❌ O canal do painel precisa estar dentro de uma categoria.',
                    ephemeral: true
                });
            }

            const existente = interaction.guild.channels.cache.find(channel =>
                channel.topic === `transfer-owner:${interaction.user.id}`
            );

            if (existente) {
                return interaction.reply({
                    content: `❌ Você já possui uma transferência aberta em ${existente}.`,
                    ephemeral: true
                });
            }

            const nomeCanal = `transferencia-${interaction.user.username}`
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9-]/g, '')
                .slice(0, 90);

            const permissionOverwrites = [
                {
                    id: interaction.guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel]
                },
                {
                    id: interaction.user.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ReadMessageHistory,
                        PermissionsBitField.Flags.AttachFiles,
                        PermissionsBitField.Flags.EmbedLinks
                    ]
                }
            ];

            for (const roleId of admRecRoleIds) {
                permissionOverwrites.push({
                    id: roleId,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ReadMessageHistory,
                        PermissionsBitField.Flags.AttachFiles,
                        PermissionsBitField.Flags.EmbedLinks,
                        PermissionsBitField.Flags.ManageChannels
                    ]
                });
            }

            const canal = await interaction.guild.channels.create({
                name: nomeCanal,
                type: ChannelType.GuildText,
                parent: categoriaDoPainel,
                topic: `transfer-owner:${interaction.user.id}`,
                permissionOverwrites
            });

            setSession(canal.id, {
                type: 'transferencia',
                guildId: interaction.guild.id,
                userId: interaction.user.id,
                currentQuestionIndex: 0,
                answers: {},
                status: 'collecting'
            });

            await canal.send({
                content:
                    `${interaction.user}\n\n` +
                    `Sua solicitação de transferência foi iniciada.\n` +
                    `Responda as perguntas abaixo uma por vez.\n\n` +
                    `**${QUESTIONS[0]}**`
            });

            return interaction.reply({
                content: `✅ Sua transferência foi aberta em ${canal}.`,
                ephemeral: true
            });
        }

        if (interaction.isButton() && interaction.customId === 'aprovar_transferencia') {
            const guildConfig = getGuildConfig(interaction.guild.id);
            const admRecRoleIds = guildConfig.admRecRoleIds || [];

            if (!hasAnyConfiguredRole(interaction.member, admRecRoleIds)) {
                return interaction.reply({
                    content: '❌ Apenas os cargos configurados em `!setadmrec` podem aprovar.',
                    ephemeral: true
                });
            }

            const message = interaction.message;
            const embedAtual = message.embeds[0];

            if (!embedAtual) {
                return interaction.reply({
                    content: '❌ Não foi possível aprovar esta transferência.',
                    ephemeral: true
                });
            }

            const footerText = embedAtual.footer?.text || '';
            const match = footerText.match(/Canal: (\d+)/);
            const transferChannelId = match ? match[1] : null;

            const embedNovo = EmbedBuilder.from(embedAtual)
                .setColor('#2B2D31')
                .addFields(
                    {
                        name: 'STATUS',
                        value: 'APROVADA',
                        inline: true
                    },
                    {
                        name: 'RESPONSÁVEL',
                        value: `${interaction.user}`,
                        inline: true
                    }
                );

            const disabledRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('aprovar_transferencia_disabled')
                    .setLabel('APROVADA')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('recusar_transferencia_disabled')
                    .setLabel('RECUSAR')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(true)
            );

            await interaction.update({
                embeds: [embedNovo],
                components: [disabledRow]
            });

            if (transferChannelId) {
                const canal = interaction.guild.channels.cache.get(transferChannelId);
                if (canal) {
                    await canal.send(`✅ ${interaction.user} aprovou esta transferência.`);
                }

                const session = getSession(transferChannelId);
                if (session) {
                    updateSession(transferChannelId, {
                        status: 'approved',
                        handledBy: interaction.user.id
                    });
                }
            }
        }

        if (interaction.isButton() && interaction.customId === 'recusar_transferencia') {
            const guildConfig = getGuildConfig(interaction.guild.id);
            const admRecRoleIds = guildConfig.admRecRoleIds || [];

            if (!hasAnyConfiguredRole(interaction.member, admRecRoleIds)) {
                return interaction.reply({
                    content: '❌ Apenas os cargos configurados em `!setadmrec` podem recusar.',
                    ephemeral: true
                });
            }

            const message = interaction.message;
            const embedAtual = message.embeds[0];

            if (!embedAtual) {
                return interaction.reply({
                    content: '❌ Não foi possível recusar esta transferência.',
                    ephemeral: true
                });
            }

            const footerText = embedAtual.footer?.text || '';
            const match = footerText.match(/Canal: (\d+)/);
            const transferChannelId = match ? match[1] : null;

            const embedNovo = EmbedBuilder.from(embedAtual)
                .setColor('#2B2D31')
                .addFields(
                    {
                        name: 'STATUS',
                        value: 'RECUSADA',
                        inline: true
                    },
                    {
                        name: 'RESPONSÁVEL',
                        value: `${interaction.user}`,
                        inline: true
                    }
                );

            const disabledRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('aprovar_transferencia_disabled')
                    .setLabel('APROVAR')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('recusar_transferencia_disabled')
                    .setLabel('RECUSADA')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(true)
            );

            await interaction.update({
                embeds: [embedNovo],
                components: [disabledRow]
            });

            if (transferChannelId) {
                const canal = interaction.guild.channels.cache.get(transferChannelId);
                if (canal) {
                    await canal.send(`❌ ${interaction.user} recusou esta transferência.`);
                }

                const session = getSession(transferChannelId);
                if (session) {
                    updateSession(transferChannelId, {
                        status: 'rejected',
                        handledBy: interaction.user.id
                    });
                }
            }
        }
    }
};
