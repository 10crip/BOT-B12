const { EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../guildConfig');
const { getUserWarnings, removeWarning } = require('../utils/advertencias');

const ADV_LOG_CHANNEL_ID = '1474852514359803994';

const ADV_ROLE_1 = '1474972984841339074';
const ADV_ROLE_2 = '1474973087199006863';
const ADV_ROLE_3 = '1474973148179992576';

function formatDateTime(date) {
    const data = date.toLocaleDateString('pt-BR');
    const hora = date.toLocaleTimeString('pt-BR');
    return { data, hora };
}

module.exports = {
    name: 'removeradv',

    async execute(message) {
        if (!message.guild) return;

        const guildConfig = getGuildConfig(message.guild.id);
        const admAdvRoleIds = guildConfig.admAdvRoleIds || [];

        if (!admAdvRoleIds.length) {
            return message.reply('❌ Nenhum cargo foi configurado em `!setadmadv`.')
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 12000))
                .catch(() => {});
        }

        const podeRemover = admAdvRoleIds.some(roleId => message.member.roles.cache.has(roleId));

        if (!podeRemover) {
            return message.reply('❌ Você não tem permissão para remover advertências.')
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
                .catch(() => {});
        }

        const membro = message.mentions.members.first();

        if (!membro) {
            return message.reply(`❌ Use assim: \`${process.env.PREFIX || '!'}removeradv @membro\``)
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 12000))
                .catch(() => {});
        }

        const warningState = getUserWarnings(message.guild.id, membro.id);

        if (!warningState.total || warningState.total <= 0) {
            return message.reply('❌ Este membro não possui advertências para remover.')
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
                .catch(() => {});
        }

        const removedState = removeWarning(message.guild.id, membro.id);
        const totalWarnings = removedState.total;
        const removedWarning = removedState.removedWarning;

        const rolesToClear = [ADV_ROLE_1, ADV_ROLE_2, ADV_ROLE_3];

        for (const roleId of rolesToClear) {
            if (membro.roles.cache.has(roleId)) {
                await membro.roles.remove(roleId).catch(() => {});
            }
        }

        if (totalWarnings === 1) {
            await membro.roles.add(ADV_ROLE_1).catch(() => {});
        } else if (totalWarnings === 2) {
            await membro.roles.add(ADV_ROLE_2).catch(() => {});
        } else if (totalWarnings === 3) {
            await membro.roles.add(ADV_ROLE_3).catch(() => {});
        }

        const agora = new Date();
        const { data, hora } = formatDateTime(agora);

        const historicoAtualizado = removedState.historico
            .map((item, index) => {
                return `**${index + 1}ª advertência**\nMotivo: ${item.motivo}\nStaff: ${item.staffTag}\nData: ${item.data} às ${item.hora}`;
            })
            .join('\n\n')
            .slice(0, 3900) || 'Nenhuma advertência restante.';

        const embedLog = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('🧹 REMOÇÃO DE ADVERTÊNCIA')
            .addFields(
                {
                    name: 'MEMBRO',
                    value: `${membro} \n\`${membro.user.tag}\``,
                    inline: false
                },
                {
                    name: 'STAFF RESPONSÁVEL',
                    value: `${message.member} \n\`${message.author.tag}\``,
                    inline: false
                },
                {
                    name: 'MOTIVO DA ADVERTÊNCIA REMOVIDA',
                    value: removedWarning?.motivo || 'Não disponível',
                    inline: false
                },
                {
                    name: 'DATA DA REMOÇÃO',
                    value: data,
                    inline: true
                },
                {
                    name: 'HORA DA REMOÇÃO',
                    value: hora,
                    inline: true
                },
                {
                    name: 'TOTAL DE ADVERTÊNCIAS RESTANTES',
                    value: `${totalWarnings}`,
                    inline: true
                },
                {
                    name: 'HISTÓRICO ATUAL',
                    value: historicoAtualizado,
                    inline: false
                }
            )
            .setFooter({
                text: 'Sistema profissional de advertências B12'
            });

        const logChannel = message.guild.channels.cache.get(ADV_LOG_CHANNEL_ID);

        if (logChannel) {
            await logChannel.send({
                embeds: [embedLog]
            }).catch(() => {});
        }

        const embedDM = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('🧹 UMA ADVERTÊNCIA SUA FOI REMOVIDA')
            .addFields(
                {
                    name: 'SERVIDOR',
                    value: message.guild.name,
                    inline: false
                },
                {
                    name: 'STAFF RESPONSÁVEL',
                    value: message.author.tag,
                    inline: false
                },
                {
                    name: 'MOTIVO DA ADVERTÊNCIA REMOVIDA',
                    value: removedWarning?.motivo || 'Não disponível',
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
                },
                {
                    name: 'TOTAL DE ADVERTÊNCIAS RESTANTES',
                    value: `${totalWarnings}`,
                    inline: true
                }
            )
            .setFooter({
                text: 'Caso tenha dúvidas, contate a administração.'
            });

        await membro.send({
            embeds: [embedDM]
        }).catch(() => {});

        await message.reply(
            `✅ Uma advertência foi removida de ${membro}.\n` +
            `📌 Total restante: **${totalWarnings}**`
        ).then(msg => setTimeout(() => msg.delete().catch(() => {}), 15000)).catch(() => {});

        await message.delete().catch(() => {});
    }
};
