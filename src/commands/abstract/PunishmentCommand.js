import Command from "./Command.js";
import { DiscordResolve } from "@discord-util/resolve";
import ModerationUtil from "../../util/ModerationUtil.js";
import PermissionUtil from "../../util/PermissionUtil.js";
import StringUtil from "../../util/StringUtil.js";
import timestring from "timestring";
import prettyMilliseconds from "pretty-ms";

// TODO add modrole stuff
// TIMED ACTIONS, "in" not "from" when member remains
export default class PunishmentCommand extends Command {
    category = "Moderation";
    requiredArguments = 1;
    checkHierarchy = true; // Whether to check if the bot/the moderator can modify the target before proceeding
    action = ""; // kick
    actioned = ""; // kicked
    actionedPreposition = "from";
    resolveMember = false; // Whether a member is needed to go through with the command, otherwise just a user
    timed = false;
    maxTime = "100y";
    additionalInformation = `To try and combat rate limits, only 20 users may be targeted at a time.`;

    async execute(message, args) {
        const components = ModerationUtil.extractComponents(args);
        const check = this.client.config.checkmark;
        const xmark = this.client.config.xmark;
        const resolver = new DiscordResolve(this.client);

        let time;
        if (this.timed) {
            let leftoversSplit = components.leftovers.split(" ");
            time = leftoversSplit.shift();
            components.leftovers = leftoversSplit.join(" ");
            if (!time) return this.sendUsage();
            try {
                time = timestring(time, "ms");
            } catch (e) {
                return message.channel.send(xmark + "Please specify a valid time.");
            }
        }

        if (components.targets.length < 1) this.sendUsage(message);
        else if (components.targets.length > 20) message.channel.send(xmark + `Only 20 users may be ${this.actioned} at any one time.`);
        else if (components.leftovers.length > 400) message.channel.send(xmark + `The ${this.action} reason must not exceed 400 characters. Currently, it is ${components.leftovers.length}.`);
        else if (this.timed && time < 5000) message.channel.send(xmark + "Time cannot be near zero.");
        else if (this.timed && time > timestring(this.maxTime, "ms")) message.channel.send(xmark + `The maximum time allowed is ${prettyMilliseconds(timestring(this.maxTime, "ms"), { verbose: true })}.`);
        else {
            var outputMessage = "";
            for (const t of components.targets) {
                let member = null;
                let user = await resolver.resolveUser(t).catch(err => {
                    outputMessage += xmark + `<@${t}> cannot be resolved to a user (is the ID/mention correct?).\n`;
                });
                if (!user) continue;

                member = await resolver.resolveMember(message.guild, t);
                if (!member) {
                    if (this.resolveMember) {
                        outputMessage += xmark + `<@${t}> cannot be resolved to a member (are they in this guild?).\n`;
                        continue;
                    }
                } else if (!PermissionUtil.canModify(message.guild.members.resolve(this.client.user), member)) {
                    outputMessage += xmark + `I do not have permission to ${this.action} **${member.user.tag}**.\n`;
                    continue;
                } else if (!PermissionUtil.canModify(message.member, member)) {
                    outputMessage += xmark + `You do not have permission to ${this.action} **${member.user.tag}**.\n`;
                    continue;
                }


                var directMessageSuccess = true;
                if (member) {
                    await member.user.send(`You have been ${this.actioned} ${this.actionedPreposition} **${member.guild.name}**${this.timed ? ` for **${prettyMilliseconds(time, { verbose: true })}**` : ""} by **${message.member.user.tag}**.\n${components.leftovers.trim() != "" ? `**Reason:** ${components.leftovers}` : ""}`)
                        .catch(e => directMessageSuccess = false);
                } else directMessageSuccess = false;

                await this.doAction(user, member, `[${message.author.tag}] ${components.leftovers}`, message.guild, time - 3000 /* to make limits a bit more bearable */)
                    .then(t => {
                        outputMessage += check + `${StringUtil.capitaliseFirstLetter(this.actioned)} **${user.tag}**${directMessageSuccess ? "" : " but couldn't message them"}.\n`;
                    })
                    .catch(e => {
                        outputMessage += xmark + `Failed to ${this.action} **${user.tag}**: ${e}.\n`;
                    })

            }
            if (this.timed) outputMessage += ":timer: **Time:** " + prettyMilliseconds(time, { verbose: true }) + "\n";
            if (components.leftovers.trim() != "") outputMessage += ":speech_balloon: **Reason:** " + components.leftovers;
            message.channel.send(outputMessage); // TODO support >2000 character messages
        }
    }

    doAction(user, member, reason, moderator, guild) { }
}