const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'help',

    async execute(message) {
        if (!message.guild) return;

        const prefix = process.env.PREFIX || '!';

        const embed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setTitle('📘 PAINEL DE AJUDA - B12')
            .setDescription(
                'Aqui estão todos os comandos disponíveis no bot da **B12**.\n\n' +
                `**Prefixo atual:** \`${prefix}\`\n` +
                'Use os comandos exatamente como mostrado abaixo.'
            )
            .addFields(
                {
                    name: '🎫 SISTEMA DE TICKET',
                    value:
                        `\`${prefix}painelticket\`\n` +
                        `Envia o painel de ticket no canal atual.\n` +
                        `**Como usar:** \`${prefix}painelticket\`\n\n` +
                        `\`${prefix}setadmticket @cargo1 @cargo2\`\n` +
                        `Define os cargos responsáveis por atender os tickets.\n` +
                        `**Como usar:** \`${prefix}setadmticket @cargo1 @cargo2\``,
                    inline: false
                },
                {
                    name: '📨 SISTEMA DE TRANSFERÊNCIA',
                    value:
                        `\`${prefix}paineltransferencia\`\n` +
                        `Envia o painel de transferência no canal configurado.\n` +
                        `**Como usar:** \`${prefix}paineltransferencia\`\n\n` +
                        `\`${prefix}setadmrec @cargo1 @cargo2\`\n` +
                        `Define os cargos que podem aprovar ou recusar transferências.\n` +
                        `**Como usar:** \`${prefix}setadmrec @cargo1 @cargo2\``,
                    inline: false
                },
                {
                    name: '📝 SISTEMA DE REGISTRO',
                    value:
                        `\`${prefix}painelregistro\`\n` +
                        `Envia o painel de registro no canal configurado.\n` +
                        `**Como usar:** \`${prefix}painelregistro\``,
                    inline: false
                },
                {
                    name: '🚨 SISTEMA DE ADVERTÊNCIA',
                    value:
                        `\`${prefix}setadmadv @cargo1 @cargo2\`\n` +
                        `Define os cargos que podem aplicar e remover advertências.\n` +
                        `**Como usar:** \`${prefix}setadmadv @cargo1 @cargo2\`\n\n` +
                        `\`${prefix}adv @membro motivo\`\n` +
                        `Inicia uma advertência em um membro. Depois disso, o staff precisa escrever \`confirmar\` no chat para concluir.\n` +
                        `**Como usar:** \`${prefix}adv @membro flood no chat\`\n\n` +
                        `\`${prefix}removeradv @membro\`\n` +
                        `Remove 1 advertência do membro por vez.\n` +
                        `**Como usar:** \`${prefix}removeradv @membro\``,
                    inline: false
                },
                {
                    name: '📈 SISTEMA DE PROMOÇÃO / REBAIXAMENTO',
                    value:
                        `\`${prefix}setadmup @cargo1 @cargo2\`\n` +
                        `Define os cargos que podem promover e rebaixar membros.\n` +
                        `**Como usar:** \`${prefix}setadmup @cargo1 @cargo2\`\n\n` +
                        `\`${prefix}promover @membro\`\n` +
                        `Inicia uma promoção. Depois disso, o staff deve mencionar no chat primeiro o cargo novo e depois o cargo antigo.\n` +
                        `**Como usar:** \`${prefix}promover @membro\`\n` +
                        `**Depois responder no chat:** \`@CargoNovo @CargoAntigo\`\n\n` +
                        `\`${prefix}rebaixar @membro\`\n` +
                        `Inicia um rebaixamento. Depois disso, o staff deve mencionar no chat primeiro o cargo novo e depois o cargo antigo.\n` +
                        `**Como usar:** \`${prefix}rebaixar @membro\`\n` +
                        `**Depois responder no chat:** \`@CargoNovo @CargoAntigo\``,
                    inline: false
                },
                {
                    name: '⏱️ SISTEMA DE BATE-PONTO',
                    value:
                        `\`${prefix}painelponto\`\n` +
                        `Envia o painel do bate-ponto no canal configurado.\n` +
                        `**Como usar:** \`${prefix}painelponto\`\n\n` +
                        `\`${prefix}setadmponto @cargo1 @cargo2\`\n` +
                        `Define os cargos que podem usar o botão de rank do bate-ponto.\n` +
                        `**Como usar:** \`${prefix}setadmponto @cargo1 @cargo2\`\n\n` +
                        `\`${prefix}addcanal <id>\`\n` +
                        `Adiciona um canal de voz permitido para o bate-ponto.\n` +
                        `**Como usar:** \`${prefix}addcanal 123456789012345678\`\n\n` +
                        `\`${prefix}removecanal <id>\`\n` +
                        `Remove um canal de voz da lista permitida do bate-ponto.\n` +
                        `**Como usar:** \`${prefix}removecanal 123456789012345678\`\n\n` +
                        `\`${prefix}addcategoria <id>\`\n` +
                        `Adiciona uma categoria permitida para o bate-ponto.\n` +
                        `**Como usar:** \`${prefix}addcategoria 123456789012345678\`\n\n` +
                        `\`${prefix}removecategoria <id>\`\n` +
                        `Remove uma categoria da lista permitida do bate-ponto.\n` +
                        `**Como usar:** \`${prefix}removecategoria 123456789012345678\`\n\n` +
                        `\`${prefix}listabp\`\n` +
                        `Mostra todos os canais e categorias liberados no bate-ponto.\n` +
                        `**Como usar:** \`${prefix}listabp\``,
                    inline: false
                },
                {
                    name: 'ℹ️ COMANDO DE AJUDA',
                    value:
                        `\`${prefix}help\`\n` +
                        `Mostra esta central de ajuda com todos os comandos do bot.\n` +
                        `**Como usar:** \`${prefix}help\``,
                    inline: false
                }
            )
            .setFooter({
                text: 'Sistema de ajuda oficial da B12'
            });

        await message.channel.send({
            embeds: [embed]
        });

        await message.delete().catch(() => {});
    }
};
