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
        // ==================================================
        // SELECT MENU DO TICKET
        // ==================================================
        if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
            const staffRoleId = process.env.STAFF_ROLE_ID;
            const guildName = process.env.TICKET_GUILD_NAME || 'B12';
            const ticketImage = process.env.TICKET_IMAGE_URL || 'https://via.placeholder.com/256x256.png?text=B12';

            if (!staffRoleId) {
                return interaction.reply({
                    content: '❌ Configure STAFF_ROLE_ID nas variáveis do Railway.',
                    ephemeral: true
                });
            }

            const categoriaDoPainel = interaction.channel.parentId;

            if (!categoriaDoPainel) {
                return interaction.reply({
                    content: '❌ O canal do painel precisa estar dentro de uma categoria para o ticket ser criado nela.',
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

            const categoriaTexto = {
                suporte: 'Suporte',
                denuncias: 'Denúncias',
                revisao: 'Revisão de Advertências',
                parceria: 'Parceria',
                compras: 'Compras'
            };

            const nomeCanal = `ticket-${nomes[motivoEscolhido] || 'suporte'}-${interaction.user.username}`
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9-]/g, '')
                .slice(0, 90);

            const channel = await interaction.guild.channels.create({
                name: nomeCanal,
                type: ChannelType.GuildText,
                parent: categoriaDoPainel,
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
                            PermissionsBitField.Flags.EmbedLinks,
                            PermissionsBitField.Flags.ManageChannels
                        ]
                    }
                ]
            });

            const embed = new EmbedBuilder()
                .setColor('#2B2D31')
                .setTitle(`🎫 | TICKET ABERTO - ${guildName.toUpperCase()}`)
                .setDescription(
                    `@ [${guildName.toLowerCase()}] ${interaction.user.username}, seja bem-vindo!\n\n` +
                    `*Nós, superiores, estamos cientes da abertura deste ticket.*\n` +
                    `*Por favor, aguarde o atendimento de um staff.*\n\n` +
                    `*Tudo que for falado neste canal é privado.*\n\n` +
                    `📁 **CATEGORIA:**\n` +
                    `🛠️ **${categoriaTexto[motivoEscolhido] || 'Suporte'}**\n\n` +
                    `👤 **RESPONSÁVEL:**\n` +
                    `\`Aguardando Staff...\`\n\n` +
                    `👥 **USUÁRIO:**\n` +
                    `${interaction.user}`
                )
                .setThumbnail(ticketImage);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('assumir_ticket')
                    .setLabel('ATENDER')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('👑'),

                new ButtonBuilder()
                    .setCustomId('fechar_ticket')
                    .setLabel('FECHAR')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🟥'),

                new ButtonBuilder()
                    .setCustomId('ticket_config')
                    .setLabel(' ')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⚙️')
            );

            await channel.send({
                content: `${interaction.user} <@&${staffRoleId}>`,
                embeds: [embed],
                components: [row]
            });

            return interaction.reply({
                content: `✅ Seu ticket foi criado em ${channel}.`,
                ephemeral: true
            });
        }

        // ==================================================
        // BOTÃO ATENDER
        // ==================================================
        if (interaction.isButton() && interaction.customId === 'assumir_ticket') {
            const staffRoleId = process.env.STAFF_ROLE_ID;

            if (staffRoleId && !interaction.member.roles.cache.has(staffRoleId)) {
                return interaction.reply({
                    content: '❌ Apenas a equipe pode assumir tickets.',
                    ephemeral: true
                });
            }

            const embedAtual = interaction.message.embeds[0];

            if (!embedAtual) {
                return interaction.reply({
                    content: '❌ Não foi possível atualizar este ticket.',
                    ephemeral: true
                });
            }

            const descricaoAtual = embedAtual.description || '';
            const novaDescricao = descricaoAtual.replace(
                /`Aguardando Staff\.\.\.`/,
                `\`${interaction.user.username}\``
            );

            const embedNovo = EmbedBuilder.from(embedAtual).setDescription(novaDescricao);

            return interaction.update({
                embeds: [embedNovo],
                components: interaction.message.components
            });
        }

        // ==================================================
        // BOTÃO FECHAR
        // ==================================================
        if (interaction.isButton() && interaction.customId === 'fechar_ticket') {
            const rowConfirm = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('confirmar_fechar_ticket')
                    .setLabel('CONFIRMAR FECHAMENTO')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔒'),

                new ButtonBuilder()
                    .setCustomId('cancelar_fechar_ticket')
                    .setLabel('CANCELAR')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('❌')
            );

            return interaction.reply({
                content: 'Tem certeza que deseja fechar este ticket?',
                components: [rowConfirm],
                ephemeral: true
            });
        }

        // ==================================================
        // CONFIRMAR FECHAMENTO
        // ==================================================
        if (interaction.isButton() && interaction.customId === 'confirmar_fechar_ticket') {
            await interaction.update({
                content: '🔒 Fechando ticket em 5 segundos...',
                components: []
            });

            setTimeout(async () => {
                await interaction.channel.delete().catch(() => {});
            }, 5000);

            return;
        }

        // ==================================================
        // CANCELAR FECHAMENTO
        // ==================================================
        if (interaction.isButton() && interaction.customId === 'cancelar_fechar_ticket') {
            return interaction.update({
                content: '✅ Fechamento cancelado.',
                components: []
            });
        }

        // ==================================================
        // BOTÃO CONFIG
        // ==================================================
        if (interaction.isButton() && interaction.customId === 'ticket_config') {
            return interaction.reply({
                content: '⚙️ Este botão pode ser usado depois para adicionar mais funções do ticket.',
                ephemeral: true
            });
        }
    }
};
