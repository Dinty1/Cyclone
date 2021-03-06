import { MessageEmbed } from "discord.js";
import Command from "../commands/abstract/Command.js";
import CommandUtil from "../util/CommandUtil.js";
import StringUtil from "../util/StringUtil.js";

export default class HelpCommand extends Command {
    name = "help";
    aliases = ["h"];
    description = "Returns a list of commands and their uses / returns information on a command.";
    usage = "[command to get info on]";
    botPermissions = ["EMBED_LINKS"];

    execute(message, args) {
        if (args.length < 1) { // Not looking for help on a specific command
            const helpEmbed = new MessageEmbed()
                .setTitle("Cyclone Help Menu")
                .setColor(this.client.config.embedColor)
                .setDescription(`Prefix: \`${this.client.config.prefix}\`\nFor help on a specific command, do \`${this.client.config.prefix}help <command>\`\nGot an issue? Join my [Support Server](${this.client.config.supportServerInviteLink})`);

            // Go through each of the bot's commands and display fields for each category
            const commandsSorted = {};
            message.client.commands.forEach(c => {
                if (!commandsSorted[c.category]) commandsSorted[c.category] = [];
                commandsSorted[c.category].push(c);
            })

            for (let category in commandsSorted) {
                if (category == "Owner") continue; // Ignore owner commands
                let fieldValue = "";
                commandsSorted[category].forEach(c => {
                    fieldValue += (`\`${c.name} ${c.usage}`).trim() + `\` - ${c.description}\n`;
                })
                helpEmbed.addField(category, fieldValue);
            }

            message.channel.send({ embeds: [helpEmbed] });
        } else { // User wants help on a specific command
            const command = CommandUtil.findCommand(args[0], this.client);
            if (!command) {
                message.channel.send(this.client.config.xmark + "Couldn't find that command.")
            } else {
                const helpEmbed = new MessageEmbed()
                    .setTitle(StringUtil.capitaliseFirstLetter(command.name) + " Command")
                    .setColor(this.client.config.embedColor)
                    .setDescription(command.description)
                    .addField("Aliases", command.aliases.length > 0 ? command.aliases.join(", ") : "None", true)
                    .addField("Category", command.category, true)
                    .addField("Required Bot Permissions", command.botPermissions.length > 0 ? command.botPermissions.toString() : "None", true)
                    .addField("User Permissions (one of these required)", command.userPermissions.length > 0 ? command.userPermissions.toString() : "None", true)
                    .addField("Usage", "`" + this.client.config.prefix + command.name + " " + command.usage + "`")
                    .addField("Additional Information", command.additionalInformation);
                    message.channel.send({ embeds: [helpEmbed] });
            }
        }
    }
}