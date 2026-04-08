const {
    ChannelType,
    PermissionsBitField,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

module.exports = {
    name: 'interactionCreate',

    async execute(interaction) {
        if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
            const categoryId = process.env.TICKET_CATEGORY_ID;
            const staffRoleId = process.env.STAFF_ROLE_ID;

            if (!categoryId || !staffRoleId) {
                return interaction.reply({
                    content: '❌ Configure TICKET_CATEGORY_ID e STAFF_ROLE_ID nas variáveis do Railway.',
                    ephemeral: true
                });
            }

            const existingChannel = interaction.guild.channels.cache.find(channel =>
                channel.topic === `ticket-owner:${interaction.user.id}`
            );

            if (existingChannel) {
                return interaction.reply({
                    content: `❌ Você já possui um ticket aberto em ${existingChannel}.`,
                    ephemeral: true
                });
            }

            const motivoEscolhido = interaction.values[0];

            const nomes = {
                suporte: 'suporte',
                denuncias: 'denuncias',
                revisao: 'revisao',
                parceria: 'parceria',
                compras: 'compras'
            };

            const motivoTexto = {
                suporte: 'Suporte',
                denuncias: 'Denúncias',
                revisao: 'Revisão de Advertências',
                parceria: 'Parceria',
                compras: 'Compras'
            };

            const nomeCanal = `ticket-${nomes[motivoEscolhido] || 'suporte'}-${interaction.user.username}`
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, '')
                .slice(0, 90);

            const channel = await interaction.guild.channels.create({
                name: nomeCanal,
                type: ChannelType.GuildText,
                parent: categoryId,
                topic: `ticket-owner:${interaction.user.id}`,
                permissionOverwrites: [
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
                    },
                    {
                        id: staffRoleId,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.ReadMessageHistory,
                            PermissionsBitField.Flags.AttachFiles,
                            PermissionsBitField.Flags.EmbedLinks
                        ]
                    }
                ]
            });

            const embed = new EmbedBuilder()
                .setColor('#2B2D31')
                .setTitle('🎫 Atendimento B12')
                .setDescription(
                    `Olá ${interaction.user}, seu ticket foi criado com sucesso.\n\n` +
                    `**Motivo:** ${motivoTexto[motivoEscolhido] || 'Suporte'}\n` +
                    `Aguarde um membro da equipe responder.`
                );

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('fechar_ticket')
                    .setLabel('Fechar Ticket')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔒')
            );

            await channel.send({
                content: `<@${interaction.user.id}> <@&${staffRoleId}>`,
                embeds: [embed],
                components: [row]
            });

            return interaction.reply({
                content: `✅ Seu ticket foi criado em ${channel}.`,
                ephemeral: true
            });
        }

        if (interaction.isButton() && interaction.customId === 'fechar_ticket') {
            await interaction.reply({
                content: '🔒 Fechando ticket em 5 segundos...',
                ephemeral: true
            });

            setTimeout(async () => {
                await interaction.channel.delete().catch(() => {});
            }, 5000);
        }
    }
};
