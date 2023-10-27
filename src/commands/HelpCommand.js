import { EmbedBuilder } from "discord.js";
import Command from "../commands/abstract/Command.js";
import CommandUtil from "../util/CommandUtil.js";
import StringUtil from "../util/StringUtil.js";

export default class HelpCommand extends Command {
    name = "help";
    aliases = ["h"];
    description = "Returns a list of commands and their uses / returns information on a command.";
    usage = "[command to get info on]";
    botPermissions = ["EmbedLinks"];

    execute(message, args) {
        if (args.length < 1) { // Not looking for help on a specific command
            const helpEmbed = new EmbedBuilder()
                .setTitle("Cyclone Help Menu")
                .setColor(this.client.config.embedColor)
                .setDescription(`Prefix: \`${this.client.config.prefix}\`\nFor help on a specific command and to see shorthand aliases, do \`${this.client.config.prefix}help <command>\`\nGot an issue? Join my [Support Server](${this.client.config.supportServerInviteLink}) or open an issue on the [GitHub page](${this.client.config.sourceCode}).`);

            // Go through each of the bot's commands and display fields for each category
            const commandsSorted = {};
            message.client.commands.forEach(c => {
                if (!commandsSorted[c.category]) commandsSorted[c.category] = [];
                commandsSorted[c.category].push(c);
            });

            for (let category in commandsSorted) {
                if (category === "Owner") continue; // Ignore owner commands
                let fieldValue = "";
                commandsSorted[category].forEach(c => {
                    fieldValue += (`\`${c.name} ${c.usage}`).trim() + `\` - ${c.description}\n`;
                });
                helpEmbed.addFields({ name: category, value: fieldValue });
            }

            message.channel.send({ embeds: [helpEmbed] });
        } else { // User wants help on a specific command
            const command = CommandUtil.findCommand(args[0], this.client);
            if (!command) {
                message.channel.send(this.client.config.xmark + "Couldn't find that command.");
            } else {
                const helpEmbed = new EmbedBuilder()
                    .setTitle(StringUtil.capitaliseFirstLetter(command.name) + " Command")
                    .setColor(this.client.config.embedColor)
                    .setDescription(command.description + command.additionalInformation ? "\n\n" + command.additionalInformation : "")
                    .addFields(
                        { name: "Aliases", value: command.aliases.length > 0 ? command.aliases.join(", ") : "None", inline: true },
                        { name: "Category", value: command.category, inline: true},
                        { name: "Required Bot Permissions", value: command.botPermissions.length > 0 ? command.botPermissions.toString() : "None", inline: true },
                        { name: "User Permissions (one of these required)", value: command.userPermissions.length > 0 ? command.userPermissions.toString() : "None", inline: true },
                        { name: "Usage", value: "`" + this.client.config.prefix + command.name + " " + command.usage + "`" }
                    );
                message.channel.send({ embeds: [helpEmbed] });
            }
        }
    }
}
