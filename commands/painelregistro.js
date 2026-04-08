const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const REGISTRO_PANEL_CHANNEL_ID = '1491264478224973865';

module.exports = {
    name: 'painelregistro',

    async execute(message) {
        if (!message.guild) return;

        if (!message.member.permissions.has('Administrator')) {
            return message.reply('❌ Você precisa ser administrador para usar este comando.')
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
                .catch(() => {});
        }

        const canal = message.guild.channels.cache.get(REGISTRO_PANEL_CHANNEL_ID);

        if (!canal) {
            return message.reply('❌ Não encontrei o canal do painel de registro.')
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
                .catch(() => {});
        }

        const embed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setTitle('REGISTRO B12')
            .setDescription('FACA SEU REGISTRO PARA TER ACESSO AO SERVIDOR DA B12 MEU CRIA!!');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('abrir_registro')
                .setLabel('REGISTRO')
                .setStyle(ButtonStyle.Primary)
        );

        await canal.send({
            embeds: [embed],
            components: [row]
        });

        await message.reply(`✅ Painel de registro enviado em ${canal}.`)
            .then(msg => setTimeout(() => msg.delete().catch(() => {}), 8000))
            .catch(() => {});

        await message.delete().catch(() => {});
    }
};
