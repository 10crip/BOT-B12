const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'aviso',

    async execute(message, args) {
        if (!message.guild) return;

        // Permissão
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('❌ You need administrator permission to use this command.')
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
                .catch(() => {});
        }

        const texto = args.join(' ');

        if (!texto) {
            return message.reply(`❌ Use like this:\n\`${process.env.PREFIX || '!'}aviso sua mensagem aqui\``)
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 12000))
                .catch(() => {});
        }

        const membros = await message.guild.members.fetch();

        let enviados = 0;
        let falharam = 0;

        await message.reply('📢 Enviando aviso para todos os membros... Isso pode demorar.');

        const embed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setTitle('📢 AVISO IMPORTANTE')
            .setDescription(texto)
            .setFooter({
                text: `Servidor: ${message.guild.name}`
            });

        for (const membro of membros.values()) {
            if (membro.user.bot) continue;

            try {
                await membro.send({ embeds: [embed] });
                enviados++;
            } catch {
                falharam++;
            }

            // delay pra não tomar rate limit
            await new Promise(resolve => setTimeout(resolve, 800));
        }

        await message.channel.send(
            `✅ Aviso finalizado.\n` +
            `📨 Enviados: **${enviados}**\n` +
            `❌ Falharam: **${falharam}**`
        );
    }
};
