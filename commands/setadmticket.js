const { updateGuildConfig } = require('../guildConfig');

module.exports = {
    name: 'setadmticket',

    async execute(message) {
        if (!message.guild) return;

        if (!message.member.permissions.has('Administrator')) {
            return message.reply('❌ Você precisa ser administrador para usar este comando.')
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
                .catch(() => {});
        }

        const cargo = message.mentions.roles.first();

        if (!cargo) {
            return message.reply(`❌ Use assim: \`${process.env.PREFIX || '!'}setadmticket @cargo\``)
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
                .catch(() => {});
        }

        updateGuildConfig(message.guild.id, {
            ticketStaffRoleId: cargo.id
        });

        await message.reply(`✅ Cargo de atendimento do ticket definido como ${cargo}.`)
            .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
            .catch(() => {});

        await message.delete().catch(() => {});
    }
};
