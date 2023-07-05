import { Client, GatewayIntentBits, Events, ActivityType } from "discord.js";
import dotenv from "dotenv";
dotenv.config();
import { readdirSync } from "fs";
import Module from "./modules/abstract/Module.js";
import { devConfig, prodConfig } from "../config/config.js";

// Setup Discord bot
console.log("Setting up Discord stuff");
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent] });
client.login(process.env.BOT_TOKEN);
client.config = process.env.DEV ? devConfig : prodConfig;
client.once(Events.ClientReady, () => {
    console.log(`Logged in as ${client.user.tag}`);

    setInterval(updateStatus, 1000000);
    updateStatus();

    // Start up modules
    console.log("Enabling modules");
    const moduleFiles = readdirSync("src/modules");
    moduleFiles.forEach(f => {
        if (!f.endsWith(".js")) return; // Ignore non-js files
        import(`./modules/${f}`).then(M => {
            const module = new M.default();
            if (!module instanceof Module) throw new Error(`Module ${f} does not extend "Module"`);
            module.initialise(client);
            module.onEnable();
        });
    });
});

function updateStatus() {
    client.user.setPresence({ activities: [{ name: `${client.config.prefix}help in ${client.guilds.cache.size} servers`, type: ActivityType.Listening }] });
}

process.on("uncaughtException", (error) => {
    reportError(error);
})

process.on("unhandledRejection", (error) => {
    reportError(error);
})

function reportError(error) {
    try {
        console.error(error.stack)
        client.channels.cache.get(client.config.errorLogChannel).send(`\`\`\`${error.stack ?? error}\`\`\``)
    } catch (ignored) {
        // i give up
    }
}