const { EmbedBuilder } = require('discord.js');

const pendingConfirmations = new Map();
const CONFIRM_TIMEOUT = 2 * 60 * 1000;
const SEND_DELAY = 800;

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function buildEmbed(guildName, text, requestedByTag, targetLabel) {
    return new EmbedBuilder()
        .setColor('#2B2D31')
        .setTitle('📢 AVISO IMPORTANTE')
        .setDescription(text)
        .addFields({
            name: 'DESTINATÁRIOS',
            value: targetLabel,
            inline: false
        })
        .setFooter({
            text: `Servidor: ${guildName} • Enviado por ${requestedByTag}`
        });
}

function buildPendingKey(guildId, userId) {
    return `${guildId}:${userId}`;
}

async function sendNotice(message, members, text, targetLabel) {
    let sent = 0;
    let failed = 0;

    const statusMessage = await message.reply(
        `📢 Sending notice to ${targetLabel.toLowerCase()}... This may take a while.`
    ).catch(() => null);

    const embed = buildEmbed(
        message.guild.name,
        text,
        message.author.tag,
        targetLabel
    );

    for (const member of members) {
        if (!member || member.user.bot) continue;

        try {
            await member.send({ embeds: [embed] });
            sent++;
        } catch {
            failed++;
        }

        await wait(SEND_DELAY);
    }

    if (statusMessage) {
        await statusMessage.edit(
            `✅ Notice finished.\n` +
            `👥 Target: **${targetLabel}**\n` +
            `📨 Sent: **${sent}**\n` +
            `❌ Failed: **${failed}**`
        ).catch(() => {});
    } else {
        await message.channel.send(
            `✅ Notice finished.\n` +
            `👥 Target: **${targetLabel}**\n` +
            `📨 Sent: **${sent}**\n` +
            `❌ Failed: **${failed}**`
        ).catch(() => {});
    }
}

module.exports = {
    name: 'aviso',

    async execute(message, args) {
        if (!message.guild) return;

        if (!message.member.permissions.has('Administrator')) {
            return message.reply('❌ You need administrator permission to use this command.')
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
                .catch(() => {});
        }

        const prefix = process.env.PREFIX || '!';
        const pendingKey = buildPendingKey(message.guild.id, message.author.id);

        if (!args.length) {
            return message.reply(
                `❌ Use like this:\n` +
                `\`${prefix}aviso sua mensagem aqui\`\n` +
                `\`${prefix}aviso confirmar sua mensagem aqui\`\n` +
                `\`${prefix}aviso cargo @cargo sua mensagem aqui\`\n` +
                `\`${prefix}aviso confirmar cargo @cargo sua mensagem aqui\``
            ).then(msg => setTimeout(() => msg.delete().catch(() => {}), 15000)).catch(() => {});
        }

        let requiresConfirmation = false;
        let mode = 'all';
        let targetRole = null;
        let textArgs = [...args];

        if (textArgs[0]?.toLowerCase() === 'confirmar') {
            requiresConfirmation = true;
            textArgs.shift();
        }

        if (textArgs[0]?.toLowerCase() === 'cargo') {
            mode = 'role';
            textArgs.shift();

            targetRole = message.mentions.roles.first();

            if (!targetRole) {
                return message.reply(
                    `❌ Use like this:\n\`${prefix}aviso cargo @cargo sua mensagem aqui\``
                ).then(msg => setTimeout(() => msg.delete().catch(() => {}), 12000)).catch(() => {});
            }

            textArgs = textArgs.filter(arg => !arg.includes(targetRole.id));
        }

        const text = textArgs.join(' ').trim();

        if (!text) {
            return message.reply('❌ You need to provide the notice message.')
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 12000))
                .catch(() => {});
        }

        let targetMembers = [];
        let targetLabel = 'All server members';

        if (mode === 'role') {
            const membersWithRole = await message.guild.members.fetch();
            targetMembers = membersWithRole.filter(member =>
                !member.user.bot && member.roles.cache.has(targetRole.id)
            ).map(member => member);

            targetLabel = `Role ${targetRole.name}`;
        } else {
            const allMembers = await message.guild.members.fetch();
            targetMembers = allMembers.filter(member => !member.user.bot).map(member => member);
        }

        if (!targetMembers.length) {
            return message.reply('❌ No members found for this notice.')
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 12000))
                .catch(() => {});
        }

        if (requiresConfirmation) {
            pendingConfirmations.set(pendingKey, {
                authorId: message.author.id,
                guildId: message.guild.id,
                createdAt: Date.now(),
                expiresAt: Date.now() + CONFIRM_TIMEOUT,
                mode,
                roleId: targetRole?.id || null,
                text
            });

            return message.reply(
                `⚠️ Notice prepared successfully.\n` +
                `👥 Target: **${targetLabel}**\n` +
                `📝 Message: ${text}\n\n` +
                `Type \`confirmar aviso\` in this channel within 2 minutes to send it.`
            ).then(msg => setTimeout(() => msg.delete().catch(() => {}), 30000)).catch(() => {});
        }

        await sendNotice(message, targetMembers, text, targetLabel);
    }
};

module.exports.handlePendingAvisoConfirmation = async function(message) {
    if (!message.guild || message.author.bot) return false;

    const content = message.content.toLowerCase().trim();
    if (content !== 'confirmar aviso') return false;

    const pendingKey = `${message.guild.id}:${message.author.id}`;
    const pending = pendingConfirmations.get(pendingKey);

    if (!pending) return false;

    if (Date.now() > pending.expiresAt) {
        pendingConfirmations.delete(pendingKey);

        await message.reply('❌ The notice confirmation time has expired.')
            .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
            .catch(() => {});
        await message.delete().catch(() => {});
        return true;
    }

    const avisoCommand = module.exports;

    let targetMembers = [];
    let targetLabel = 'All server members';

    if (pending.mode === 'role') {
        const role = message.guild.roles.cache.get(pending.roleId);

        if (!role) {
            pendingConfirmations.delete(pendingKey);

            await message.reply('❌ The selected role was not found anymore.')
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
                .catch(() => {});
            await message.delete().catch(() => {});
            return true;
        }

        const members = await message.guild.members.fetch();
        targetMembers = members.filter(member =>
            !member.user.bot && member.roles.cache.has(role.id)
        ).map(member => member);

        targetLabel = `Role ${role.name}`;
    } else {
        const members = await message.guild.members.fetch();
        targetMembers = members.filter(member => !member.user.bot).map(member => member);
    }

    pendingConfirmations.delete(pendingKey);

    if (!targetMembers.length) {
        await message.reply('❌ No members found for this notice.')
            .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
            .catch(() => {});
        await message.delete().catch(() => {});
        return true;
    }

    await sendNotice(message, targetMembers, pending.text, targetLabel);
    await message.delete().catch(() => {});
    return true;
};
