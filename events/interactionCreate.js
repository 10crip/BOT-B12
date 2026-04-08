const {
    ChannelType,
    PermissionsBitField,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

const { getGuildConfig } = require('../guildConfig');
const { setSession, getSession, updateSession } = require('../utils/transferSessions');

const PAINEL_TRANSFERENCIA_CHANNEL_ID = '1491220519494619227';
const CARGO_APROVADO_TRANSFERENCIA_ID = '1491257490594332712';
const REGISTRO_PANEL_CHANNEL_ID = '1491264478224973865';

const REGISTRO_REMOVE_ROLE_IDS = [
    '1491257490594332712',
    '1474852513466421504'
];

const REGISTRO_ADD_ROLE_IDS = [
    '1474852513436930182',
    '1474852513466421510'
];

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

module.exports = {
    name: 'interactionCreate',

    async execute(interaction) {
        // ==================================================
        // BOTÃO DO PAINEL DE REGISTRO
        // ==================================================
        if (interaction.isButton() && interaction.customId === 'abrir_registro') {
            if (interaction.channelId !== REGISTRO_PANEL_CHANNEL_ID) {
                return interaction.reply({
                    content: '❌ Este botão só pode ser usado no painel oficial de registro.',
                    ephemeral: true
                });
            }

            const modal = new ModalBuilder()
                .setCustomId('submit_registro')
                .setTitle('Criar seu registro');

            const nomeInput = new TextInputBuilder()
                .setCustomId('registro_nome_city')
                .setLabel('QUAL SEU NOME NA CITY?')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setPlaceholder('Ex: Kauã, Barbosa, Duozin');

            const idInput = new TextInputBuilder()
                .setCustomId('registro_id_city')
                .setLabel('QUAL O SEU ID?')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setPlaceholder('Ex: 123, 456, 999');

            const row1 = new ActionRowBuilder().addComponents(nomeInput);
            const row2 = new ActionRowBuilder().addComponents(idInput);

            modal.addComponents(row1, row2);

            return interaction.showModal(modal);
        }

        // ==================================================
        // ENVIO DO FORMULÁRIO DE REGISTRO
        // ==================================================
        if (interaction.isModalSubmit() && interaction.customId === 'submit_registro') {
            const nomeCity = interaction.fields.getTextInputValue('registro_nome_city').trim();
            const idCity = interaction.fields.getTextInputValue('registro_id_city').trim();

            const membro = interaction.member;

            try {
                for (const roleId of REGISTRO_REMOVE_ROLE_IDS) {
                    if (membro.roles.cache.has(roleId)) {
                        await membro.roles.remove(roleId).catch(() => {});
                    }
                }

                for (const roleId of REGISTRO_ADD_ROLE_IDS) {
                    if (!membro.roles.cache.has(roleId)) {
                        await membro.roles.add(roleId).catch(() => {});
                    }
                }

                const novoApelido = `B12 | ${nomeCity} #${idCity}`;
                await membro.setNickname(novoApelido).catch(() => {});

                return interaction.reply({
                    content:
                        `✅ Seu registro foi concluído com sucesso.\n\n` +
                        `**Nome na city:** ${nomeCity}\n` +
                        `**ID:** ${idCity}\n` +
                        `**Apelido definido para:** \`${novoApelido}\``,
                    ephemeral: true
                });
            } catch (error) {
                console.error('❌ Erro ao concluir registro:', error);

                return interaction.reply({
                    content: '❌ Ocorreu um erro ao concluir seu registro.',
                    ephemeral: true
                });
            }
        }

        // ==================================================
        // BOTÃO DE ABRIR TRANSFERÊNCIA
        // ==================================================
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

        // ==================================================
        // APROVAR TRANSFERÊNCIA
        // ==================================================
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

            let userId = null;
            const userField = embedAtual.fields?.find(field => field.name === 'USUÁRIO');
            if (userField?.value) {
                const userMatch = userField.value.match(/<@!?(\d+)>/);
                if (userMatch) {
                    userId = userMatch[1];
                }
            }

            const novosCampos = (embedAtual.fields || []).filter(
                field => field.name !== 'STATUS' && field.name !== 'RESPONSÁVEL'
            );

            novosCampos.push(
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

            const embedNovo = EmbedBuilder.from(embedAtual)
                .setColor('#2B2D31')
                .setFields(novosCampos);

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

            if (userId) {
                const membro = await interaction.guild.members.fetch(userId).catch(() => null);

                if (membro) {
                    await membro.roles.add(CARGO_APROVADO_TRANSFERENCIA_ID).catch(() => {});

                    await membro.send(
                        `✅ Sua transferência foi **ACEITA** em **${interaction.guild.name}**.\n` +
                        `👤 Responsável: **${interaction.user.tag}**`
                    ).catch(() => {});
                }
            }

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

            return;
        }

        // ==================================================
        // RECUSAR TRANSFERÊNCIA
        // ==================================================
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

            let userId = null;
            const userField = embedAtual.fields?.find(field => field.name === 'USUÁRIO');
            if (userField?.value) {
                const userMatch = userField.value.match(/<@!?(\d+)>/);
                if (userMatch) {
                    userId = userMatch[1];
                }
            }

            const novosCampos = (embedAtual.fields || []).filter(
                field => field.name !== 'STATUS' && field.name !== 'RESPONSÁVEL'
            );

            novosCampos.push(
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

            const embedNovo = EmbedBuilder.from(embedAtual)
                .setColor('#2B2D31')
                .setFields(novosCampos);

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

            if (userId) {
                const membro = await interaction.guild.members.fetch(userId).catch(() => null);

                if (membro) {
                    await membro.send(
                        `❌ Sua transferência foi **RECUSADA** em **${interaction.guild.name}**.\n` +
                        `👤 Responsável: **${interaction.user.tag}**`
                    ).catch(() => {});
                }
            }

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

            return;
        }
    }
};
