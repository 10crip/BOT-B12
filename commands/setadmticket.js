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

        const cargos = [...message.mentions.roles.values()];

        if (!cargos.length) {
            return message.reply(`❌ Use assim: \`${process.env.PREFIX || '!'}setadmticket @cargo1 @cargo2 @cargo3\``)
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 12000))
                .catch(() => {});
        }

        updateGuildConfig(message.guild.id, {
            ticketStaffRoleIds: cargos.map(cargo => cargo.id)
        });

        await message.reply(`✅ Cargos do ticket definidos como: ${cargos.join(', ')}`)
            .then(msg => setTimeout(() => msg.delete().catch(() => {}), 12000))
            .catch(() => {});

        await message.delete().catch(() => {});
    }
};
