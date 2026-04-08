const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const PANEL_CHANNEL_ID = '1474852514359803993';

module.exports = {
    name: 'painelponto',

    async execute(message) {
        if (!message.guild) return;

        if (!message.member.permissions.has('Administrator')) {
            return message.reply('❌ Você precisa ser administrador para usar este comando.')
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
                .catch(() => {});
        }

        const canal = message.guild.channels.cache.get(PANEL_CHANNEL_ID);

        if (!canal) {
            return message.reply('❌ Não encontrei o canal do painel de bate-ponto.')
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
                .catch(() => {});
        }

        const embed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setTitle('BATE-PONTO B12')
            .setDescription('CLIQUE NO BOTAO ABAIXO PARA INICIAR SEU BATE-PONTO');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('iniciar_ponto')
                .setLabel('INICIAR PONTO')
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId('fechar_ponto')
                .setLabel('FECHAR PONTO')
                .setStyle(ButtonStyle.Danger),

            new ButtonBuilder()
                .setCustomId('rank_ponto')
                .setLabel('RANK')
                .setStyle(ButtonStyle.Primary)
        );

        await canal.send({
            embeds: [embed],
            components: [row]
        });

        await message.reply(`✅ Painel de bate-ponto enviado em ${canal}.`)
            .then(msg => setTimeout(() => msg.delete().catch(() => {}), 8000))
            .catch(() => {});

        await message.delete().catch(() => {});
    }
};
