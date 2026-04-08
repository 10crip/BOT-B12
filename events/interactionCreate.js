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

        // ================================
        // MENU DE TICKET
        // ================================
        if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {

            const categoryId = process.env.TICKET_CATEGORY_ID;
            const staffRoleId = process.env.STAFF_ROLE_ID;

            if (!categoryId || !staffRoleId) {
                return interaction.reply({
                    content: '❌ Configure as variáveis no Railway (CATEGORY e STAFF).',
                    ephemeral: true
                });
            }

            // Evita ticket duplicado
            const existing = interaction.guild.channels.cache.find(c =>
                c.topic === `ticket-${interaction.user.id}`
            );

            if (existing) {
                return interaction.reply({
                    content: `❌ Você já tem um ticket aberto: ${existing}`,
                    ephemeral: true
                });
            }

            const channel = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                parent: categoryId,
                topic: `ticket-${interaction.user.id}`,
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
                            PermissionsBitField.Flags.ReadMessageHistory
                        ]
                    },
                    {
                        id: staffRoleId,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.ReadMessageHistory
                        ]
                    }
                ]
            });

            const embed = new EmbedBuilder()
                .setColor('#2B2D31')
                .setTitle('🎫 Atendimento B12')
                .setDescription(`Olá ${interaction.user}, sua solicitação foi criada.\nAguarde um membro da equipe.`);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('fechar_ticket')
                    .setLabel('Fechar Ticket')
                    .setStyle(ButtonStyle.Danger)
            );

            await channel.send({
                content: `<@${interaction.user.id}> <@&${staffRoleId}>`,
                embeds: [embed],
                components: [row]
            });

            return interaction.reply({
                content: `✅ Ticket criado: ${channel}`,
                ephemeral: true
            });
        }

        // ================================
        // BOTÃO FECHAR
        // ================================
        if (interaction.isButton() && interaction.customId === 'fechar_ticket') {
            await interaction.reply({
                content: '🔒 Fechando em 5 segundos...',
                ephemeral: true
            });

            setTimeout(() => {
                interaction.channel.delete().catch(() => {});
            }, 5000);
        }
    }
};
