const { EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../guildConfig');

const REBAIXA_LOG_CHANNEL_ID = '1474852514581975246';

function formatDateTime(date) {
    return {
        data: date.toLocaleDateString('pt-BR'),
        hora: date.toLocaleTimeString('pt-BR')
    };
}

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

        const canalLog = message.guild.channels.cache.get(REBAIXA_LOG_CHANNEL_ID);

        if (!canalLog) {
            return message.reply('❌ Não encontrei o canal de log de rebaixamentos.')
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
                .catch(() => {});
        }

        const { data, hora } = formatDateTime(new Date());

        const embed = new EmbedBuilder()
            .setColor('#ED4245')
            .setTitle('📉 REGISTRO DE REBAIXAMENTO')
            .setDescription('Um membro foi rebaixado com sucesso.')
            .addFields(
                {
                    name: 'MEMBRO REBAIXADO',
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
                text: 'Sistema de rebaixamentos YKZ'
            })
            .setTimestamp();

        await canalLog.send({ embeds: [embed] }).catch(() => {});

        await message.reply(`✅ Rebaixamento registrado com sucesso para ${membro}.`)
            .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
            .catch(() => {});

        await message.delete().catch(() => {});
    }
};
