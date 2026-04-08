module.exports = {
    name: 'ready',
    once: true,

    async execute(client) {
        console.log(`✅ Bot online como ${client.user.tag}`);
    }
};