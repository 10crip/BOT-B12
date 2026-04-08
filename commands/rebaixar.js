const { getGuildConfig } = require('../guildConfig');
const { createPendingRank, deletePendingRank } = require('../utils/pendingRank');

module.exports = {
    name: 'rebaixar',

    async execute(message) {
        if (!message.guild) return;

        const guildConfig = getGuildConfig(message.guild.id);
        const admUpRoleIds = guildConfig.admUpRoleIds || [];

        if (!admUpRoleIds.length) {
            return message.reply('❌ Nenhum cargo foi configurado em `!setadmup`.')
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 12000))
                .catch(() => {});
        }

        const podeUsar = admUpRoleIds.some(roleId => message.member.roles.cache.has(roleId));

        if (!podeUsar) {
            return message.reply('❌ Você não tem permissão para rebaixar membros.')
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
                .catch(() => {});
        }

        const membro = message.mentions.members.first();

        if (!membro) {
            return message.reply(`❌ Use assim: \`${process.env.PREFIX || '!'}rebaixar @usuario\``)
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
                .catch(() => {});
        }

        const pendingKey = `${message.guild.id}:${message.channel.id}:${message.author.id}`;

        createPendingRank(pendingKey, {
            type: 'rebaixamento',
            guildId: message.guild.id,
            channelId: message.channel.id,
            staffId: message.author.id,
            alvoId: membro.id,
            createdAt: Date.now(),
            expiresAt: Date.now() + 60000
        });

        await message.reply(
            `📉 Rebaixamento iniciado para ${membro}.\n\n` +
            `Agora mencione **primeiro o cargo novo** e **depois o cargo antigo**.\n\n` +
            `Exemplo:\n` +
            `@CargoNovo @CargoAntigo\n\n` +
            `⏳ Você tem 60 segundos para responder.`
        ).then(msg => {
            setTimeout(() => msg.delete().catch(() => {}), 15000);
        }).catch(() => {});

        setTimeout(() => {
            deletePendingRank(pendingKey);
        }, 60000);

        await message.delete().catch(() => {});
    }
};
