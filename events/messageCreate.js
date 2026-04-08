const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const PREFIX = process.env.PREFIX || '!';

const { getSession, updateSession } = require('../utils/transferSessions');

const REVISAO_TRANSFERENCIA_CHANNEL_ID = '1491244658448273550';

const QUESTIONS = [
    '1 - QUAL SEU NOME NA CIDADE?',
    '2 - QUAL SEU ID NA CIDADE?',
    '3 - QUAL CORP/FAC VOCE FAZIA PARTE?',
    '4 - PROVAS: FOTO/PRINT'
];

module.exports = {
    name: 'messageCreate',

    async execute(message, client) {
        if (!message.guild) return;
        if (message.author.bot) return;

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

            await message.channel.send('✅ Suas respostas foram enviadas para análise.');
            return;
        }

        if (!message.content.startsWith(PREFIX)) return;

        const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
        const commandName = args.shift()?.toLowerCase();

        if (!commandName) return;

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
