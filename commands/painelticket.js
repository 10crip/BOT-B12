const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} = require('discord.js');

module.exports = {
    name: 'painelticket',

    async execute(message) {
        if (!message.guild) return;

        const embed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setTitle('ATENDIMENTO B12')
            .setDescription(
                'Está com alguma dúvida, problema ou precisa falar com a equipe? Selecione uma das opções abaixo para abrir um ticket e receber um atendimento personalizado de acordo com a sua necessidade.\n\n' +
                '• **Esclarecimento de dúvidas gerais;**\n' +
                '• **Envio de denúncias ou reclamações;**\n' +
                '• **Revisão de advertências/punições;**\n' +
                '• **Proposta de parcerias.**'
            )
            .setThumbnail('https://via.placeholder.com/128x128.png?text=B12')
            .setImage('https://via.placeholder.com/700x200.png?text=ATENDIMENTO+B12');

        const menu = new StringSelectMenuBuilder()
            .setCustomId('ticket_select')
            .setPlaceholder('Selecione o motivo do ticket.')
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Suporte')
                    .setDescription('Suporte geral.')
                    .setValue('suporte')
                    .setEmoji('🛠️'),

                new StringSelectMenuOptionBuilder()
                    .setLabel('Denúncias')
                    .setDescription('Realizar uma denúncia a um membro, com provas.')
                    .setValue('denuncias')
                    .setEmoji('🎟️'),

                new StringSelectMenuOptionBuilder()
                    .setLabel('Revisão de Advertências')
                    .setDescription('Revisão de advertência/punições com um superior.')
                    .setValue('revisao')
                    .setEmoji('🔍'),

                new StringSelectMenuOptionBuilder()
                    .setLabel('Parceria')
                    .setDescription('Solicite a parceria.')
                    .setValue('parceria')
                    .setEmoji('🤝'),

                new StringSelectMenuOptionBuilder()
                    .setLabel('Compras')
                    .setDescription('Converse com nosso suporte de compras.')
                    .setValue('compras')
                    .setEmoji('🛒')
            );

        const row = new ActionRowBuilder().addComponents(menu);

        await message.channel.send({
            embeds: [embed],
            components: [row]
        });

        await message.delete().catch(() => {});
    }
};
