import Module from "./abstract/Module.js";
import { readdirSync } from "fs";
import CommandUtil from "../util/CommandUtil.js";

export default class CommandHandler extends Module {
    name = "Command Handler";

    onEnable() {
        // Register commands
        this.logger.info("Registering commands");
        this.client.commands = [];
        const commandFiles = readdirSync("src/commands");
        for (const f of commandFiles) {
            if (!f.endsWith(".js")) continue; // Ignore non-js files
            import(`../commands/${f}`).then(command => {
                let constructedCommand = new command.default(this.client);
                this.client.commands.push(constructedCommand);
                constructedCommand.initialise();
            });
        }
    }

    onMessage(message) {
        if (!message.guild) return message.channel.send("Please run me in a server!");
        if (message.author.bot) return;
        if (message.content.toLowerCase().startsWith(this.client.config.prefix)) {
            let args = message.content.slice(this.client.config.prefix.length).trimStart().split(/\s+/);
            const commandName = args.shift().toLowerCase();
            const command = CommandUtil.findCommand(commandName, this.client);
            if (command) {
                this.logger.info(`Dispatching command ${command.name}`);
                command.process(message, args);
            }
        }
    }
}
