import { Client, GatewayIntentBits, Events, ActivityType, AllowedMentionsTypes } from "discord.js";
import dotenv from "dotenv";
dotenv.config();
import { readdirSync } from "fs";
import Module from "./modules/abstract/Module.js";
import { devConfig, prodConfig } from "../config/config.js";

// Setup Discord bot
console.log("Setting up Discord stuff");
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildModeration],
    allowedMentions: { parse: [AllowedMentionsTypes.User] }
});
client.login(process.env.BOT_TOKEN);
client.config = process.env.DEV ? devConfig : prodConfig;
client.once(Events.ClientReady, async () => {
    console.log(`Logged in as ${client.user.tag}`);

    client.guilds.cache.forEach(g => {
        console.log(`Found guild "${g.name}"`);
    })

    setInterval(updateStatus, 1000000);
    updateStatus();

    // Start up modules
    client.modules = [];
    console.log("Enabling modules");
    const moduleFiles = readdirSync("src/modules");
    for (const f of moduleFiles) {
        if (!f.endsWith(".js")) continue; // Ignore non-js files
        const M = await import(`./modules/${f}`)
        const module = new M.default();
        if (!(module instanceof Module)) throw new Error(`Module ${f} does not extend "Module"`);
        module.initialise(client);
        client.modules.push(module);
    }

    for (const module of client.modules) {
        module.onEnable(); // Needs to be after everything else to allow pre enable tasks to do their thing first
    }

    client.channels.cache.get(client.config.logChannel).send("Started!");
});

client.on(Events.InteractionCreate, i => {
    console.log(`Interaction received with id ${i.customId}`);
})

function updateStatus() {
    client.user.setPresence({ activities: [{ name: `${client.config.prefix}help and ${client.config.prefix}settings in ${client.guilds.cache.size} servers`, type: ActivityType.Listening }] });
}

process.on("uncaughtException", (error) => {
    reportError(error);
});

process.on("unhandledRejection", (error) => {
    reportError(error);
});

function reportError(error) {
    try {
        console.error(error.stack);
        client.channels.cache.get(client.config.logChannel).send(`\`\`\`${error.stack}\`\`\``);
    } catch (ignored) {
        // i give up
    }
}
