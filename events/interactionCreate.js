const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    PermissionFlagsBits
} = require('discord.js');

const { updateSession, deleteSession } = require('../utils/transferSessions');

const REVISAO_TRANSFERENCIA_CHANNEL_ID = '1491244658448273550';

const QUESTIONS = [
    '1 - QUAL SEU NOME NA CIDADE?',
    '2 - QUAL SEU ID NA CIDADE?',
    '3 - QUAL CORP/FAC VOCE FAZIA PARTE?',
    '4 - PROVAS: FOTO/PRINT'
];

function buildCloseRow() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('fechar_ticket')
            .setLabel('FECHAR TICKET')
            .setStyle(ButtonStyle.Danger)
    );
}

module.exports = {
    name: 'interactionCreate',

    async execute(interaction) {
        if (!interaction.guild) return;

        try {
            // =========================
            // BOTÕES
            // =========================
            if (interaction.isButton()) {
                // -------- ABRIR TRANSFERÊNCIA --------
                if (interaction.customId === 'abrir_transferencia') {
                    const existingChannel = interaction.guild.channels.cache.find(
                        channel =>
                            channel.type === ChannelType.GuildText &&
                            channel.name === `transferencia-${interaction.user.id}`
                    );

                    if (existingChannel) {
                        return interaction.reply({
                            content: `❌ Você já possui uma transferência aberta em ${existingChannel}.`,
                            ephemeral: true
                        });
                    }

                    const channel = await interaction.guild.channels.create({
                        name: `transferencia-${interaction.user.id}`,
                        type: ChannelType.GuildText,
                        permissionOverwrites: [
                            {
                                id: interaction.guild.id,
                                deny: [PermissionFlagsBits.ViewChannel]
                            },
                            {
                                id: interaction.user.id,
                                allow: [
                                    PermissionFlagsBits.ViewChannel,
                                    PermissionFlagsBits.SendMessages,
                                    PermissionFlagsBits.ReadMessageHistory,
                                    PermissionFlagsBits.AttachFiles
                                ]
                            }
                        ]
                    });

                    // Inicializa a sessão para o messageCreate continuar o fluxo
                    updateSession(channel.id, {
                        type: 'transferencia',
                        userId: interaction.user.id,
                        answers: {},
                        currentQuestionIndex: 0,
                        status: 'collecting',
                        createdAt: Date.now()
                    });

                    await channel.send(
                        `Olá ${interaction.user}, responda às perguntas abaixo.\n\n**${QUESTIONS[0]}**`
                    );

                    return interaction.reply({
                        content: `✅ Sua transferência foi aberta em ${channel}.`,
                        ephemeral: true
                    });
                }

                // -------- APROVAR TRANSFERÊNCIA --------
                if (interaction.customId === 'aprovar_transferencia') {
                    const embed = interaction.message.embeds?.[0];
                    const footerText = embed?.footer?.text || '';
                    const match = footerText.match(/Canal:\s*(\d+)/i);
                    const channelId = match?.[1];

                    const disabledRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('aprovar_transferencia_done')
                            .setLabel('APROVADA')
                            .setStyle(ButtonStyle.Success)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('recusar_transferencia_done')
                            .setLabel('RECUSAR')
                            .setStyle(ButtonStyle.Danger)
                            .setDisabled(true)
                    );

                    await interaction.update({
                        components: [disabledRow]
                    });

                    if (channelId) {
                        const transferChannel = interaction.guild.channels.cache.get(channelId);

                        if (transferChannel) {
                            await transferChannel.send(
                                `✅ ${interaction.user} aprovou sua transferência.\n\n🗑️ Este canal será apagado em 10 segundos.`
                            ).catch(() => {});

                            setTimeout(async () => {
                                deleteSession(channelId);
                                await transferChannel.delete().catch(() => {});
                            }, 10000);
                        }
                    }

                    return;
                }

                // -------- RECUSAR TRANSFERÊNCIA --------
                if (interaction.customId === 'recusar_transferencia') {
                    const embed = interaction.message.embeds?.[0];
                    const footerText = embed?.footer?.text || '';
                    const match = footerText.match(/Canal:\s*(\d+)/i);
                    const channelId = match?.[1];

                    const disabledRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('aprovar_transferencia_done')
                            .setLabel('APROVAR')
                            .setStyle(ButtonStyle.Success)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('recusar_transferencia_done')
                            .setLabel('RECUSADA')
                            .setStyle(ButtonStyle.Danger)
                            .setDisabled(true)
                    );

                    await interaction.update({
                        components: [disabledRow]
                    });

                    if (channelId) {
                        const transferChannel = interaction.guild.channels.cache.get(channelId);

                        if (transferChannel) {
                            await transferChannel.send(
                                `❌ ${interaction.user} recusou sua transferência.\n\n🗑️ Este canal será apagado em 10 segundos.`
                            ).catch(() => {});

                            setTimeout(async () => {
                                deleteSession(channelId);
                                await transferChannel.delete().catch(() => {});
                            }, 10000);
                        }
                    }

                    return;
                }

                // -------- FECHAR TICKET --------
                if (interaction.customId === 'fechar_ticket') {
                    await interaction.reply({
                        content: '🗑️ Este ticket será apagado em 5 segundos.',
                        ephemeral: true
                    }).catch(() => {});

                    setTimeout(async () => {
                        await interaction.channel.delete().catch(() => {});
                    }, 5000);

                    return;
                }
            }

            // =========================
            // SELECT MENU
            // =========================
            if (interaction.isStringSelectMenu()) {
                if (interaction.customId === 'ticket_select') {
                    const tipo = interaction.values[0];

                    const existingChannel = interaction.guild.channels.cache.find(
                        channel =>
                            channel.type === ChannelType.GuildText &&
                            channel.name === `ticket-${tipo}-${interaction.user.id}`
                    );

                    if (existingChannel) {
                        return interaction.reply({
                            content: `❌ Você já possui um ticket desse tipo aberto em ${existingChannel}.`,
                            ephemeral: true
                        });
                    }

                    const channel = await interaction.guild.channels.create({
                        name: `ticket-${tipo}-${interaction.user.id}`,
                        type: ChannelType.GuildText,
                        permissionOverwrites: [
                            {
                                id: interaction.guild.id,
                                deny: [PermissionFlagsBits.ViewChannel]
                            },
                            {
                                id: interaction.user.id,
                                allow: [
                                    PermissionFlagsBits.ViewChannel,
                                    PermissionFlagsBits.SendMessages,
                                    PermissionFlagsBits.ReadMessageHistory,
                                    PermissionFlagsBits.AttachFiles
                                ]
                            }
                        ]
                    });

                    const embed = new EmbedBuilder()
                        .setColor('#2B2D31')
                        .setTitle('🎟️ TICKET ABERTO')
                        .setDescription(
                            `Olá ${interaction.user}, seu ticket foi aberto com sucesso.\n\n` +
                            `**Categoria:** ${tipo}\n\n` +
                            `Descreva seu problema e aguarde o atendimento da equipe.`
                        );

                    await channel.send({
                        embeds: [embed],
                        components: [buildCloseRow()]
                    });

                    return interaction.reply({
                        content: `✅ Seu ticket foi criado em ${channel}.`,
                        ephemeral: true
                    });
                }
            }
        } catch (error) {
            console.error('❌ Erro no interactionCreate:', error);

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: '❌ Ocorreu um erro ao processar esta interação.',
                    ephemeral: true
                }).catch(() => {});
            } else {
                await interaction.reply({
                    content: '❌ Ocorreu um erro ao processar esta interação.',
                    ephemeral: true
                }).catch(() => {});
            }
        }
    }
};
