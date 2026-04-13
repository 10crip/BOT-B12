require('dotenv').config();

const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');

console.log(`🚀 Starting bot process at ${new Date().toLocaleString('pt-BR')}`);
console.log(`🆔 PID: ${process.pid}`);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel]
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');

if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        try {
            const command = require(path.join(commandsPath, file));

            if (!command || !command.name || typeof command.execute !== 'function') {
                console.log(`⚠️ Command ignored: ${file}`);
                continue;
            }

            client.commands.set(command.name, command);
            console.log(`✅ Command loaded: ${command.name}`);
        } catch (error) {
            console.error(`❌ Error loading command ${file}:`, error);
        }
    }
} else {
    console.log('⚠️ Commands folder not found.');
}

const eventsPath = path.join(__dirname, 'events');

if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        try {
            const event = require(path.join(eventsPath, file));

            if (!event || !event.name || typeof event.execute !== 'function') {
                console.log(`⚠️ Event ignored: ${file}`);
                continue;
            }

            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args, client));
            } else {
                client.on(event.name, (...args) => event.execute(...args, client));
            }

            console.log(`📡 Event loaded: ${file} -> ${event.name}`);
        } catch (error) {
            console.error(`❌ Error loading event ${file}:`, error);
        }
    }
} else {
    console.log('⚠️ Events folder not found.');
}

process.on('unhandledRejection', error => {
    console.error('❌ Unhandled Rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('❌ Uncaught Exception:', error);
});

client.login(process.env.TOKEN).catch(error => {
    console.error('❌ Error connecting the bot:', error);
});
