require('dotenv').config();

const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
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
                console.log(`⚠️ Comando ignorado: ${file}`);
                continue;
            }

            client.commands.set(command.name, command);
            console.log(`✅ Comando carregado: ${command.name}`);
        } catch (error) {
            console.error(`❌ Erro ao carregar comando ${file}:`, error);
        }
    }
}

const eventsPath = path.join(__dirname, 'events');

if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        try {
            const event = require(path.join(eventsPath, file));

            if (!event || !event.name || typeof event.execute !== 'function') {
                console.log(`⚠️ Evento ignorado: ${file}`);
                continue;
            }

            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args, client));
            } else {
                client.on(event.name, (...args) => event.execute(...args, client));
            }

            console.log(`📡 Evento carregado: ${file} -> ${event.name}`);
        } catch (error) {
            console.error(`❌ Erro ao carregar evento ${file}:`, error);
        }
    }
}

process.on('unhandledRejection', error => {
    console.error('❌ Unhandled Rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('❌ Uncaught Exception:', error);
});

client.login(process.env.TOKEN).catch(error => {
    console.error('❌ Erro ao conectar o bot:', error);
});
