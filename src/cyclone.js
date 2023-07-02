import { Client, GatewayIntentBits, Events } from "discord.js";
import dotenv from "dotenv";
import { readdirSync } from "fs";
import Module from "./modules/abstract/Module.js";
import config from "../config/config.js";

// Setup Discord bot
dotenv.config();
console.log("Setting up Discord stuff");
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent] });
client.login(process.env.BOT_TOKEN);
client.config = config;
client.once(Events.ClientReady, () => {
    console.log(`Logged in as ${client.user.tag}`);

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