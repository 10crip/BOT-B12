const { getGuildConfig } = require('../guildConfig');
const { createPendingAdv, deletePendingAdv } = require('../utils/pendingAdv');

module.exports = {
    name: 'adv',

    async execute(message, args) {
        if (!message.guild) return;

        const guildConfig = getGuildConfig(message.guild.id);
        const admAdvRoleIds = guildConfig.admAdvRoleIds || [];

        if (!admAdvRoleIds.length) {
            return message.reply('❌ Nenhum cargo foi configurado em `!setadmadv`.')
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 12000))
                .catch(() => {});
        }

        const podeAdvertir = admAdvRoleIds.some(roleId => message.member.roles.cache.has(roleId));
        if (!podeAdvertir) {
            return message.reply('❌ Você não tem permissão para aplicar advertências.')
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
                .catch(() => {});
        }

        const membro = message.mentions.members.first();

        if (!membro) {
            return message.reply(`❌ Use assim: \`${process.env.PREFIX || '!'}adv @membro motivo da advertência\``)
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 12000))
                .catch(() => {});
        }

        if (membro.id === message.author.id) {
            return message.reply('❌ Você não pode se advertir.')
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
                .catch(() => {});
        }

        if (membro.user.bot) {
            return message.reply('❌ Você não pode advertir bots.')
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
                .catch(() => {});
        }

        const motivo = args.slice(1).join(' ').trim();

        if (!motivo) {
            return message.reply(`❌ Informe o motivo. Exemplo: \`${process.env.PREFIX || '!'}adv @membro flood no chat\``)
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 12000))
                .catch(() => {});
        }

        const pendingKey = `${message.guild.id}:${message.channel.id}:${message.author.id}`;

        createPendingAdv(pendingKey, {
            guildId: message.guild.id,
            channelId: message.channel.id,
            staffId: message.author.id,
            alvoId: membro.id,
            motivo,
            createdAt: Date.now(),
            expiresAt: Date.now() + 15000
        });

        await message.reply(
            `⚠️ Escreva **confirmar** no chat para que eu possa setar a advertência no infrator.\n` +
            `👤 Alvo: ${membro}\n` +
            `📝 Motivo: ${motivo}\n\n` +
            `⏳ Você tem 15 segundos para confirmar.`
        ).then(msg => {
            setTimeout(() => msg.delete().catch(() => {}), 15000);
        }).catch(() => {});

        setTimeout(() => {
            deletePendingAdv(pendingKey);
        }, 15000);

        await message.delete().catch(() => {});
    }
};
