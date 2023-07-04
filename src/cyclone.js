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
    client.user.setPresence({ activities: [{ name: `${client.config.prefix}help`, type: ActivityType.Listening }] })

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