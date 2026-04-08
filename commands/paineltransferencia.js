const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const PAINEL_TRANSFERENCIA_CHANNEL_ID = '1491220519494619227';

module.exports = {
    name: 'paineltransferencia',

    async execute(message) {
        if (!message.guild) return;

        if (!message.member.permissions.has('Administrator')) {
            return message.reply('❌ Você precisa ser administrador para usar este comando.')
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
                .catch(() => {});
        }

        const canal = message.guild.channels.cache.get(PAINEL_TRANSFERENCIA_CHANNEL_ID);

        if (!canal) {
            return message.reply('❌ Não encontrei o canal do painel de transferência.')
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
                .catch(() => {});
        }

        const embed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setTitle('TRANSFERENCIA B12')
            .setDescription(
                'Clique no botão abaixo para abrir sua solicitação de transferência.\n\n' +
                'Após abrir, você responderá algumas perguntas obrigatórias.'
            );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('abrir_transferencia')
                .setLabel('TRANSFERENCIA')
                .setStyle(ButtonStyle.Primary)
        );

        await canal.send({
            embeds: [embed],
            components: [row]
        });

        await message.reply(`✅ Painel de transferência enviado em ${canal}.`)
            .then(msg => setTimeout(() => msg.delete().catch(() => {}), 8000))
            .catch(() => {});

        await message.delete().catch(() => {});
    }
};
