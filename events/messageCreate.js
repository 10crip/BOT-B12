const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType
} = require('discord.js');

const PREFIX = process.env.PREFIX || '!';

const { getSession, updateSession, deleteSession } = require('../utils/transferSessions');
const { getPendingAdv, deletePendingAdv } = require('../utils/pendingAdv');
const { getPendingRank, deletePendingRank } = require('../utils/pendingRank');
const { getGuildConfig } = require('../guildConfig');
const { getUserWarnings, addWarning } = require('../utils/advertencias');
const {
    addAllowedChannel,
    removeAllowedChannel,
    addAllowedCategory,
    removeAllowedCategory,
    getGuildPointConfig
} = require('../utils/batePonto');

const REVISAO_TRANSFERENCIA_CHANNEL_ID = '1491244658448273550';
const ADV_LOG_CHANNEL_ID = '1474852514359803994';
const PROMO_LOG_CHANNEL_ID = '1474852514581975245';
const REBAIXA_LOG_CHANNEL_ID = '1474852514581975246';

const ADV_ROLE_1 = '1474972984841339074';
const ADV_ROLE_2 = '1474973087199006863';
const ADV_ROLE_3 = '1474973148179992576';

const QUESTIONS = [
    '1 - QUAL SEU NOME NA CIDADE?',
    '2 - QUAL SEU ID NA CIDADE?',
    '3 - QUAL CORP/FAC VOCE FAZIA PARTE?',
    '4 - PROVAS: FOTO/PRINT'
];

function formatDateTime(date) {
    const data = date.toLocaleDateString('pt-BR');
    const hora = date.toLocaleTimeString('pt-BR');
    return { data, hora };
}

function isAdministrator(member) {
    return member.permissions.has('Administrator');
}

function formatPointConfig(config) {
    const canais = config.allowedChannelIds?.length
        ? config.allowedChannelIds.map(id => `• <#${id}> (\`${id}\`)`).join('\n')
        : '• Nenhum canal liberado';

    const categorias = config.allowedCategoryIds?.length
        ? config.allowedCategoryIds.map(id => `• \`${id}\``).join('\n')
        : '• Nenhuma categoria liberada';

    return { canais, categorias };
}

async function handleBpCommand(message, args) {
    if (!message.guild) return false;
    if (!args.length) return false;
    if (args[0].toLowerCase() !== 'bp') return false;

    if (!isAdministrator(message.member)) {
        await message.reply('❌ Você precisa ser administrador para usar os comandos de bate-ponto.')
            .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
            .catch(() => {});
        await message.delete().catch(() => {});
        return true;
    }

    const action = (args[1] || '').toLowerCase();
    const value = args[2];

    const usage =
        `❌ Use assim:\n` +
        `\`${PREFIX}bp addcanal <id>\`\n` +
        `\`${PREFIX}bp removecanal <id>\`\n` +
        `\`${PREFIX}bp addcategoria <id>\`\n` +
        `\`${PREFIX}bp removecategoria <id>\`\n` +
        `\`${PREFIX}bp lista\``;

    if (!action) {
        await message.reply(usage)
            .then(msg => setTimeout(() => msg.delete().catch(() => {}), 15000))
            .catch(() => {});
        await message.delete().catch(() => {});
        return true;
    }

    if (action === 'lista') {
        const config = getGuildPointConfig(message.guild.id);
        const { canais, categorias } = formatPointConfig(config);

        const embed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setTitle('📋 CONFIGURAÇÃO DO BATE-PONTO')
            .addFields(
                {
                    name: 'CANAIS LIBERADOS',
                    value: canais,
                    inline: false
                },
                {
                    name: 'CATEGORIAS LIBERADAS',
                    value: categorias,
                    inline: false
                }
            )
            .setFooter({
                text: `Solicitado por ${message.author.tag}`
            });

        await message.reply({ embeds: [embed] })
            .then(msg => setTimeout(() => msg.delete().catch(() => {}), 20000))
            .catch(() => {});
        await message.delete().catch(() => {});
        return true;
    }

    if (!value) {
        await message.reply(usage)
            .then(msg => setTimeout(() => msg.delete().catch(() => {}), 15000))
            .catch(() => {});
        await message.delete().catch(() => {});
        return true;
    }

    if (!/^\d+$/.test(value)) {
        await message.reply('❌ O ID informado é inválido. Envie apenas números.')
            .then(msg => setTimeout(() => msg.delete().catch(() => {}), 12000))
            .catch(() => {});
        await message.delete().catch(() => {});
        return true;
    }

    if (action === 'addcanal') {
        const channel = message.guild.channels.cache.get(value);

        if (!channel) {
            await message.reply('❌ Não encontrei um canal com esse ID neste servidor.')
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 12000))
                .catch(() => {});
            await message.delete().catch(() => {});
            return true;
        }

        if (channel.type !== ChannelType.GuildVoice) {
            await message.reply('❌ Esse ID não pertence a um canal de voz.')
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 12000))
                .catch(() => {});
            await message.delete().catch(() => {});
            return true;
        }

        addAllowedChannel(message.guild.id, value);

        await message.reply(`✅ Canal liberado para o bate-ponto: ${channel} (\`${channel.id}\`)`)
            .then(msg => setTimeout(() => msg.delete().catch(() => {}), 15000))
            .catch(() => {});
        await message.delete().catch(() => {});
        return true;
    }

    if (action === 'removecanal') {
        removeAllowedChannel(message.guild.id, value);

        await message.reply(`✅ Canal removido da lista do bate-ponto: \`${value}\``)
            .then(msg => setTimeout(() => msg.delete().catch(() => {}), 15000))
            .catch(() => {});
        await message.delete().catch(() => {});
        return true;
    }

    if (action === 'addcategoria') {
        const channel = message.guild.channels.cache.get(value);

        if (!channel) {
            await message.reply('❌ Não encontrei uma categoria com esse ID neste servidor.')
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 12000))
                .catch(() => {});
            await message.delete().catch(() => {});
            return true;
        }

        if (channel.type !== ChannelType.GuildCategory) {
            await message.reply('❌ Esse ID não pertence a uma categoria.')
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 12000))
                .catch(() => {});
            await message.delete().catch(() => {});
            return true;
        }

        addAllowedCategory(message.guild.id, value);

        await message.reply(`✅ Categoria liberada para o bate-ponto: **${channel.name}** (\`${channel.id}\`)`)
            .then(msg => setTimeout(() => msg.delete().catch(() => {}), 15000))
            .catch(() => {});
        await message.delete().catch(() => {});
        return true;
    }

    if (action === 'removecategoria') {
        removeAllowedCategory(message.guild.id, value);

        await message.reply(`✅ Categoria removida da lista do bate-ponto: \`${value}\``)
            .then(msg => setTimeout(() => msg.delete().catch(() => {}), 15000))
            .catch(() => {});
        await message.delete().catch(() => {});
        return true;
    }

    await message.reply(usage)
        .then(msg => setTimeout(() => msg.delete().catch(() => {}), 15000))
        .catch(() => {});
    await message.delete().catch(() => {});
    return true;
}

async function aplicarMudancaDeCargo(message, pendingRank) {
    const guild = message.guild;
    const staffMember = await guild.members.fetch(pendingRank.staffId).catch(() => null);
    const alvoMember = await guild.members.fetch(pendingRank.alvoId).catch(() => null);

    if (!staffMember || !alvoMember) {
        await message.reply('❌ Não foi possível concluir a operação.')
            .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
            .catch(() => {});
        return;
    }

    const cargos = [...message.mentions.roles.values()];

    if (cargos.length < 2) {
        await message.reply(
            '❌ Você precisa mencionar **2 cargos**: primeiro o cargo novo e depois o cargo antigo.\n\nExemplo:\n@CargoNovo @CargoAntigo'
        ).then(msg => setTimeout(() => msg.delete().catch(() => {}), 12000)).catch(() => {});
        return;
    }

    const cargoNovo = cargos[0];
    const cargoAntigo = cargos[1];

    await alvoMember.roles.add(cargoNovo).catch(() => {});
    await alvoMember.roles.remove(cargoAntigo).catch(() => {});

    const agora = new Date();
    const { data, hora } = formatDateTime(agora);

    const isPromocao = pendingRank.type === 'promocao';
    const titulo = isPromocao ? '📈 REGISTRO DE PROMOÇÃO' : '📉 REGISTRO DE REBAIXAMENTO';
    const acaoTexto = isPromocao ? 'PROMOÇÃO' : 'REBAIXAMENTO';
    const canalLogId = isPromocao ? PROMO_LOG_CHANNEL_ID : REBAIXA_LOG_CHANNEL_ID;

    const embedLog = new EmbedBuilder()
        .setColor('#2B2D31')
        .setTitle(titulo)
        .addFields(
            {
                name: 'MEMBRO',
                value: `${alvoMember}\n\`${alvoMember.user.tag}\``,
                inline: false
            },
            {
                name: 'STAFF RESPONSÁVEL',
                value: `${staffMember}\n\`${staffMember.user.tag}\``,
                inline: false
            },
            {
                name: 'CARGO NOVO',
                value: `${cargoNovo}`,
                inline: true
            },
            {
                name: 'CARGO REMOVIDO',
                value: `${cargoAntigo}`,
                inline: true
            },
            {
                name: 'AÇÃO',
                value: acaoTexto,
                inline: true
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
            text: 'Sistema profissional de promoções e rebaixamentos B12'
        });

    const canalLog = guild.channels.cache.get(canalLogId);
    if (canalLog) {
        await canalLog.send({
            embeds: [embedLog]
        }).catch(() => {});
    }

    await alvoMember.send({
        embeds: [
            new EmbedBuilder()
                .setColor('#2B2D31')
                .setTitle(isPromocao ? '📈 VOCÊ FOI PROMOVIDO' : '📉 VOCÊ FOI REBAIXADO')
                .addFields(
                    {
                        name: 'SERVIDOR',
                        value: guild.name,
                        inline: false
                    },
                    {
                        name: 'STAFF RESPONSÁVEL',
                        value: staffMember.user.tag,
                        inline: false
                    },
                    {
                        name: 'CARGO NOVO',
                        value: `${cargoNovo}`,
                        inline: true
                    },
                    {
                        name: 'CARGO REMOVIDO',
                        value: `${cargoAntigo}`,
                        inline: true
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
                    text: 'Em caso de dúvidas, procure a administração.'
                })
        ]
    }).catch(() => {});

    await message.reply(
        `✅ ${isPromocao ? 'Promoção' : 'Rebaixamento'} aplicada com sucesso em ${alvoMember}.\n` +
        `➕ Cargo novo: ${cargoNovo}\n` +
        `➖ Cargo removido: ${cargoAntigo}`
    ).then(msg => setTimeout(() => msg.delete().catch(() => {}), 15000)).catch(() => {});
}

async function aplicarAdvertencia(message, pendingData) {
    const guild = message.guild;
    const staffMember = await guild.members.fetch(pendingData.staffId).catch(() => null);
    const alvoMember = await guild.members.fetch(pendingData.alvoId).catch(() => null);

    if (!staffMember || !alvoMember) {
        await message.reply('❌ Não foi possível concluir a advertência.')
            .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
            .catch(() => {});
        return;
    }

    const agora = new Date();
    const { data, hora } = formatDateTime(agora);

    const warningData = {
        motivo: pendingData.motivo,
        staffId: staffMember.id,
        staffTag: staffMember.user.tag,
        data,
        hora,
        timestamp: agora.getTime()
    };

    const warningState = addWarning(guild.id, alvoMember.id, warningData);
    const totalWarnings = warningState.total;

    const rolesToClear = [ADV_ROLE_1, ADV_ROLE_2, ADV_ROLE_3];

    for (const roleId of rolesToClear) {
        if (alvoMember.roles.cache.has(roleId)) {
            await alvoMember.roles.remove(roleId).catch(() => {});
        }
    }

    let actionText = 'Advertência aplicada';
    let appliedRole = null;
    let banido = false;

    if (totalWarnings === 1) {
        appliedRole = ADV_ROLE_1;
    } else if (totalWarnings === 2) {
        appliedRole = ADV_ROLE_2;
    } else if (totalWarnings === 3) {
        appliedRole = ADV_ROLE_3;
    } else if (totalWarnings >= 4) {
        banido = true;
        actionText = 'Banimento automático por exceder o limite de advertências';
    }

    if (appliedRole) {
        await alvoMember.roles.add(appliedRole).catch(() => {});
    }

    const historicoTexto = warningState.historico
        .map((item, index) => {
            return `**${index + 1}ª advertência**\nMotivo: ${item.motivo}\nStaff: ${item.staffTag}\nData: ${item.data} às ${item.hora}`;
        })
        .join('\n\n')
        .slice(0, 3900) || 'Nenhum histórico disponível.';

    const logChannel = guild.channels.cache.get(ADV_LOG_CHANNEL_ID);

    const embedLog = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('🚨 REGISTRO DE ADVERTÊNCIA')
        .addFields(
            {
                name: 'MEMBRO',
                value: `${alvoMember} \n\`${alvoMember.user.tag}\``,
                inline: false
            },
            {
                name: 'STAFF RESPONSÁVEL',
                value: `${staffMember} \n\`${staffMember.user.tag}\``,
                inline: false
            },
            {
                name: 'MOTIVO',
                value: pendingData.motivo,
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
                name: 'TOTAL DE ADVERTÊNCIAS',
                value: `${totalWarnings}`,
                inline: true
            },
            {
                name: 'AÇÃO',
                value: actionText,
                inline: false
            },
            {
                name: 'HISTÓRICO COMPLETO',
                value: historicoTexto,
                inline: false
            }
        )
        .setFooter({
            text: 'Sistema profissional de advertências B12'
        });

    if (logChannel) {
        await logChannel.send({
            embeds: [embedLog]
        }).catch(() => {});
    }

    const embedDM = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('🚨 VOCÊ RECEBEU UMA ADVERTÊNCIA')
        .addFields(
            {
                name: 'SERVIDOR',
                value: guild.name,
                inline: false
            },
            {
                name: 'MOTIVO',
                value: pendingData.motivo,
                inline: false
            },
            {
                name: 'STAFF RESPONSÁVEL',
                value: staffMember.user.tag,
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
                name: 'TOTAL DE ADVERTÊNCIAS',
                value: `${totalWarnings}`,
                inline: true
            },
            {
                name: 'AÇÃO APLICADA',
                value: actionText,
                inline: false
            }
        )
        .setFooter({
            text: 'Caso tenha dúvidas, contate a administração.'
        });

    await alvoMember.send({
        embeds: [embedDM]
    }).catch(() => {});

    if (banido) {
        await alvoMember.ban({
            reason: `4ª advertência recebida. Motivo atual: ${pendingData.motivo}`
        }).catch(() => {});
    }

    await message.reply(
        `✅ Advertência aplicada com sucesso em ${alvoMember}.\n` +
        `📌 Total atual: **${totalWarnings}**`
    ).then(msg => setTimeout(() => msg.delete().catch(() => {}), 15000)).catch(() => {});
}

module.exports = {
    name: 'messageCreate',

    async execute(message, client) {
        if (!message.guild) return;
        if (message.author.bot) return;

        // ==================================================
        // RESPOSTA DE PROMOÇÃO / REBAIXAMENTO
        // ==================================================
        {
            const pendingKey = `${message.guild.id}:${message.channel.id}:${message.author.id}`;
            const pendingRank = getPendingRank(pendingKey);

            if (pendingRank) {
                if (Date.now() > pendingRank.expiresAt) {
                    deletePendingRank(pendingKey);

                    await message.reply('❌ O tempo para informar os cargos expirou.')
                        .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
                        .catch(() => {});
                    return;
                }

                const guildConfig = getGuildConfig(message.guild.id);
                const admUpRoleIds = guildConfig.admUpRoleIds || [];
                const podeUsar = admUpRoleIds.some(roleId => message.member.roles.cache.has(roleId));

                if (!podeUsar) {
                    deletePendingRank(pendingKey);

                    await message.reply('❌ Você não tem mais permissão para concluir essa ação.')
                        .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
                        .catch(() => {});
                    return;
                }

                deletePendingRank(pendingKey);
                await aplicarMudancaDeCargo(message, pendingRank);
                await message.delete().catch(() => {});
                return;
            }
        }

        // ==================================================
        // CONFIRMAÇÃO DE ADVERTÊNCIA
        // ==================================================
        if (message.content.toLowerCase().trim() === 'confirmar') {
            const pendingKey = `${message.guild.id}:${message.channel.id}:${message.author.id}`;
            const pendingAdv = getPendingAdv(pendingKey);

            if (pendingAdv) {
                if (Date.now() > pendingAdv.expiresAt) {
                    deletePendingAdv(pendingKey);

                    await message.reply('❌ O tempo para confirmar a advertência expirou.')
                        .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
                        .catch(() => {});
                    return;
                }

                const guildConfig = getGuildConfig(message.guild.id);
                const admAdvRoleIds = guildConfig.admAdvRoleIds || [];
                const podeAdvertir = admAdvRoleIds.some(roleId => message.member.roles.cache.has(roleId));

                if (!podeAdvertir) {
                    await message.reply('❌ Você não tem mais permissão para confirmar advertências.')
                        .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
                        .catch(() => {});
                    deletePendingAdv(pendingKey);
                    return;
                }

                deletePendingAdv(pendingKey);
                await aplicarAdvertencia(message, pendingAdv);
                await message.delete().catch(() => {});
                return;
            }
        }

        // ==================================================
        // SISTEMA DE TRANSFERÊNCIA
        // ==================================================
        const session = getSession(message.channel.id);

        if (session && session.type === 'transferencia' && session.status === 'collecting') {
            if (message.author.id !== session.userId) return;

            const currentIndex = session.currentQuestionIndex || 0;
            const answers = session.answers || {};

            const answerValue =
                message.attachments.size > 0
                    ? message.attachments.map(att => att.url).join('\n')
                    : message.content.trim();

            if (!answerValue) {
                await message.reply('❌ Responda a pergunta para continuar.')
                    .then(msg => setTimeout(() => msg.delete().catch(() => {}), 6000))
                    .catch(() => {});
                return;
            }

            answers[`q${currentIndex + 1}`] = answerValue;

            const nextIndex = currentIndex + 1;

            if (nextIndex < QUESTIONS.length) {
                updateSession(message.channel.id, {
                    answers,
                    currentQuestionIndex: nextIndex
                });

                await message.channel.send(`**${QUESTIONS[nextIndex]}**`);
                return;
            }

            updateSession(message.channel.id, {
                answers,
                currentQuestionIndex: nextIndex,
                status: 'completed'
            });

            const canalRevisao = message.guild.channels.cache.get(REVISAO_TRANSFERENCIA_CHANNEL_ID);

            if (!canalRevisao) {
                await message.channel.send('❌ Não encontrei o canal de revisão da transferência.');
                return;
            }

            const embed = new EmbedBuilder()
                .setColor('#2B2D31')
                .setTitle('PAINEL DE TRANSFERENCIA')
                .addFields(
                    {
                        name: 'USUÁRIO',
                        value: `<@${session.userId}>`,
                        inline: false
                    },
                    {
                        name: '1 - QUAL SEU NOME NA CIDADE?',
                        value: answers.q1 || 'Não informado',
                        inline: false
                    },
                    {
                        name: '2 - QUAL SEU ID NA CIDADE?',
                        value: answers.q2 || 'Não informado',
                        inline: false
                    },
                    {
                        name: '3 - QUAL CORP/FAC VOCE FAZIA PARTE?',
                        value: answers.q3 || 'Não informado',
                        inline: false
                    },
                    {
                        name: '4 - PROVAS: FOTO/PRINT',
                        value: answers.q4 || 'Não informado',
                        inline: false
                    }
                )
                .setFooter({
                    text: `Canal: ${message.channel.id}`
                });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('aprovar_transferencia')
                    .setLabel('APROVAR')
                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                    .setCustomId('recusar_transferencia')
                    .setLabel('RECUSAR')
                    .setStyle(ButtonStyle.Danger)
            );

            await canalRevisao.send({
                embeds: [embed],
                components: [row]
            });

            await message.channel.send(
                '✅ Suas respostas foram enviadas para análise. Agora é só aguardar um recrutador aceitar sua transferência.\n\n' +
                '🗑️ Este canal será apagado em 10 segundos.'
            );

            setTimeout(async () => {
                deleteSession(message.channel.id);
                await message.channel.delete().catch(() => {});
            }, 10000);

            return;
        }

        // ==================================================
        // COMANDOS
        // ==================================================
        if (!message.content.startsWith(PREFIX)) return;

        const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
        const commandName = args.shift()?.toLowerCase();

        if (!commandName) return;

        if (commandName === 'bp') {
            const handled = await handleBpCommand(message, ['bp', ...args]);
            if (handled) return;
        }

        const command = client.commands.get(commandName);
        if (!command) return;

        try {
            await command.execute(message, args, client);
        } catch (error) {
            console.error(`❌ Erro ao executar o comando ${commandName}:`, error);

            await message.reply({
                content: '❌ Ocorreu um erro ao executar esse comando.'
            }).catch(() => {});
        }
    }
};
