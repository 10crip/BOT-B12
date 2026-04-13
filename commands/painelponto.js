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
            .setTitle('⏱️ BATE-PONTO YKZ')
            .setDescription(
                '**Gerencie seu ponto de forma rápida e organizada usando os botões abaixo.**\n\n' +
                'Use este painel para iniciar sua sessão, encerrar seu ponto ao finalizar o expediente e consultar o rank quando tiver permissão.'
            )
            .addFields(
                {
                    name: '✅ COMO FUNCIONA',
                    value:
                        '• Entre em uma call permitida.\n' +
                        '• Clique em **INICIAR PONTO** para começar a contagem.\n' +
                        '• Ao finalizar, clique em **FECHAR PONTO** para registrar seu tempo.',
                    inline: false
                },
                {
                    name: '📌 REGRAS IMPORTANTES',
                    value:
                        '• O ponto só pode ser iniciado em **canais/categorias liberados**.\n' +
                        '• Se você sair da call permitida e ficar **1 minuto e 30 segundos fora**, o ponto será **fechado automaticamente**.\n' +
                        '• O tempo é contabilizado apenas enquanto sua sessão estiver válida.',
                    inline: false
                },
                {
                    name: '🏆 RANK',
                    value:
                        'O botão **RANK** mostra o ranking de tempo registrado no bate-ponto.\n' +
                        'Esse botão é restrito aos cargos com permissão configurada.',
                    inline: false
                },
                {
                    name: '⚠️ ATENÇÃO',
                    value:
                        'Antes de iniciar, confirme se você está na call correta.\n' +
                        'Caso o sistema informe erro ao abrir o ponto, verifique se o canal ou a categoria foi liberado pela administração.',
                    inline: false
                }
            )
            .setFooter({
                text: 'Sistema oficial de bate-ponto YKZ'
            })
            .setTimestamp();

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
