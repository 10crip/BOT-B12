module.exports = {
    name: 'clientReady',
    once: true,

    async execute(client) {
        console.log(`✅ Bot online as ${client.user.tag}`);
        console.log(`🕒 Ready at: ${new Date().toLocaleString('pt-BR')}`);
        console.log(`🆔 PID online: ${process.pid}`);
    }
};
