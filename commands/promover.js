const { EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../guildConfig');

const PROMO_LOG_CHANNEL_ID = '1474852514581975245';
const promoteCooldown = new Map();

function formatDateTime(date) {
    return {
        data: date.toLocaleDateString('pt-BR'),
        hora: date.toLocaleTimeString('pt-BR')
    };
}

function buildCooldownKey(guildId, authorId, targetId) {
    return `${guildId}:${authorId}:${targetId}`;
}

module.exports = {
    name: 'promover',

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
            return message.reply('❌ Você não tem permissão para promover membros.')
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
                .catch(() => {});
        }

        const membro = message.mentions.members.first();

        if (!membro) {
            return message.reply(`❌ Use assim: \`${process.env.PREFIX || '!'}promover @usuario\``)
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
                .catch(() => {});
        }

        const cooldownKey = buildCooldownKey(message.guild.id, message.author.id, membro.id);
        const now = Date.now();
        const lastExecution = promoteCooldown.get(cooldownKey);

        if (lastExecution && now - lastExecution < 5000) {
            return message.reply('⚠️ Aguarde alguns segundos antes de repetir esta promoção.')
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 8000))
                .catch(() => {});
        }

        promoteCooldown.set(cooldownKey, now);

        setTimeout(() => {
            promoteCooldown.delete(cooldownKey);
        }, 5000);

        const canalLog = message.guild.channels.cache.get(PROMO_LOG_CHANNEL_ID);

        if (!canalLog) {
            return message.reply('❌ Não encontrei o canal de log de promoções.')
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
                .catch(() => {});
        }

        const { data, hora } = formatDateTime(new Date());

        const embed = new EmbedBuilder()
            .setColor('#57F287')
            .setTitle('📈 REGISTRO DE PROMOÇÃO')
            .setDescription('Um membro foi promovido com sucesso.')
            .addFields(
                {
                    name: 'MEMBRO PROMOVIDO',
                    value: `${membro}\n\`${membro.user.tag}\``,
                    inline: false
                },
                {
                    name: 'RESPONSÁVEL',
                    value: `${message.member}\n\`${message.author.tag}\``,
                    inline: false
                },
                {
                    name: 'DATA',
                    value: data,
                    inline: true
                },
                {
                    name: 'HORA',
                    value: hora,
                    inline: true
                }
            )
            .setFooter({
                text: `Sistema de promoções YKZ • PID ${process.pid}`
            })
            .setTimestamp();

        await canalLog.send({ embeds: [embed] }).catch(() => {});

        await message.reply(`✅ Promoção registrada com sucesso para ${membro}.`)
            .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
            .catch(() => {});

        await message.delete().catch(() => {});
    }
};
