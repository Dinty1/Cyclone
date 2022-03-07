import ModerationUtil from "../util/ModerationUtil.js";
import PermissionUtil from "../util/PermissionUtil.js";
import Command from "./abstract/Command.js";

export default class KickCommand extends Command {
    name = "kick";
    category = "Moderation";
    aliases = ["k"];
    description = "Kicks members from the server.";
    additionalInformation = "To try and combat rate limits, only 20 members may be kicked at a time.";
    usage = "<user IDs / mentions to kick> [reason]"
    requiredArguments = 1;
    userPermissions = ["KICK_MEMBERS", "MODROLE"];
    botPermissions = ["KICK_MEMBERS"];

    async execute(message, args) {
        const components = ModerationUtil.extractComponents(args);
        const check = message.client.config.checkmark;
        const xmark = message.client.config.xmark;

        if (components.targets.length < 1) this.sendUsage(message);
        else if (components.targets.length > 20) message.channel.send(xmark + "Only 20 users may be kicked at any one time.");
        else if (components.leftovers.length > 400) message.channel.send(xmark + `The kick reason must not exceed 400 characters. Currently, it is ${components.leftovers.length}.`);
        else {
            var outputMessage = "";
            for (const t of components.targets) {
                const member = message.guild.members.resolve(t);
                if (!member) outputMessage += xmark + `<@${t}> cannot be resolved to a member (are they in this guild?).\n`;
                else if (!member.kickable) outputMessage += xmark + `I do not have permission to kick **${member.user.tag}**.\n`;
                else if (!PermissionUtil.canModify(message.member, member)) outputMessage += xmark + `You do not have permission to kick **${member.user.tag}**.\n`;
                else {
                    var directMessageSuccess = true;
                    await member.user.send(`You have been kicked from **${member.guild.name}** by **${message.member.user.tag}**.\n${components.leftovers.trim() != "" ? `**Reason:** ${components.leftovers}` : ""}`)
                        .catch(e => directMessageSuccess = false);
                    await member.kick(`[${message.member.user.tag}] ${components.leftovers}`)
                        .then(kicked => {
                            outputMessage += check + `Successfully kicked **${member.user.tag}**${directMessageSuccess ? "" : " but couldn't message them"}.\n`;
                        })
                        .catch(e => {
                            outputMessage += xmark += `Failed to kick **${member.user.tag}** due to an unknown error.\n`;
                        })
                }
            }
            message.channel.send(outputMessage); // TODO support >2000 character messages
        }
    }
}