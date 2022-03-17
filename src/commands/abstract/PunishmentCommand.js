import Command from "./Command.js";
import { DiscordResolve } from "@discord-util/resolve";
import ModerationUtil from "../../util/ModerationUtil.js";
import PermissionUtil from "../../util/PermissionUtil.js";

export default class PunishmentCommand extends Command {
    category = "Moderation";
    requiredArguments = 1;
    checkHierarchy = true; // Whether to check if the bot/the moderator can modify the target before proceeding
    action = ""; // kick
    actioned = ""; // kicked
    actionedPreposition = "from";
    resolveMember = false; // Whether a member is needed to go through with the command, otherwise just a user
    additionalInformation = `To try and combat rate limits, only 20 users may be targeted at a time.`;

    async execute(message, args) {
        const components = ModerationUtil.extractComponents(args);
        const check = message.client.config.checkmark;
        const xmark = message.client.config.xmark;
        const resolver = new DiscordResolve(this.client);

        if (components.targets.length < 1) this.sendUsage(message);
        else if (components.targets.length > 20) message.channel.send(xmark + `Only 20 users may be ${this.actioned} at any one time.`);
        else if (components.leftovers.length > 400) message.channel.send(xmark + `The ${this.action}} reason must not exceed 400 characters. Currently, it is ${components.leftovers.length}.`);
        else {
            var outputMessage = "";
            for (const t of components.targets) {
                let member = null;
                let user = await resolver.resolveUser(t).catch(err => {
                    outputMessage += xmark + `<@${t}> cannot be resolved to a user (is the ID/mention correct?).\n`;
                });
                if (!user) continue;

                if (this.resolveMember) {
                    member = message.guild.members.resolve(t);
                    if (!member) {
                        outputMessage += xmark + `<@${t}> cannot be resolved to a member (are they in this guild?).\n`;
                        continue;
                    } else if (!PermissionUtil.canModify(message.guild.members.resolve(this.client.user), member)) {
                        outputMessage += xmark + `I do not have permission to ${this.action} **${member.user.tag}**.\n`;
                        continue;
                    } else if (!PermissionUtil.canModify(message.member, member)) {
                        outputMessage += xmark + `You do not have permission to ${this.action} **${member.user.tag}**.\n`;
                        continue;
                    }
                }

                var directMessageSuccess = true;
                if (member) {
                    await member.user.send(`You have been ${this.actioned} ${this.actionedPreposition} **${member.guild.name}** by **${message.member.user.tag}**.\n${components.leftovers.trim() != "" ? `**Reason:** ${components.leftovers}` : ""}`)
                        .catch(e => directMessageSuccess = false);
                } else directMessageSuccess = false;

                await this.doAction(user, member, components.leftovers, message.author)
                    .then(t => {
                        outputMessage += check + `Successfully ${this.actioned} **${member.user.tag}**${directMessageSuccess ? "" : " but couldn't message them"}.\n`;
                    })
                    .catch(e => {
                        outputMessage += xmark += `Failed to ${this.action} **${member.user.tag}** due to an unknown error.\n`;
                    })

            }
            message.channel.send(outputMessage); // TODO support >2000 character messages
        }
    }

    doAction(user, member, reason, moderator) { }
}