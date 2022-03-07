import Module from "./abstract/Module.js";
import { readdirSync } from "fs";
import CommandUtil from "../util/CommandUtil.js";

export default class CommandHandler extends Module {
    name = "Command Handler";

    onEnable() {
        // Register commands
        this.logger.info("Registering commands");
        this.client.commands = [];
        const commandFiles = readdirSync("src/commands")
        commandFiles.forEach(f => {
            if (f == "abstract") return; // Ignore the abstract directory
            import(`../commands/${f}`).then(command => {
                this.client.commands.push(new command.default(this.client));
            })
        })
    }

    onMessage(message) {
        if (message.author.bot) return;
        if (message.content.toLowerCase().startsWith(this.client.config.prefix)) {
            const args = message.content.toLowerCase().substring(this.client.config.prefix.length).trim().split(" ");
            const command = CommandUtil.findCommand(args[0], this.client);
            if (command) {
                this.logger.info(`Dispatching command ${command.name}`);
                command.process(message, args.splice(1, 999999999999999));
            }
        }
    }
}