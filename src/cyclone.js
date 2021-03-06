import { Client, Intents } from "discord.js";
import dotenv from "dotenv";
import { readdirSync } from "fs";
import Module from "./modules/abstract/Module.js";
import config from "../config/config.js";

// Setup Discord bot
dotenv.config();
console.log("Setting up Discord stuff");
const client = new Client({ intents: [Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS] });
client.login(process.env.BOT_TOKEN);
client.config = config;
client.on("ready", () => {
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