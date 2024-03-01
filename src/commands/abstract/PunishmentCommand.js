import Command from "./Command.js";
import { DiscordResolve } from "@discord-util/resolve";
import ModerationUtil from "../../util/ModerationUtil.js";
import PermissionUtil from "../../util/PermissionUtil.js";
import StringUtil from "../../util/StringUtil.js";
import timestring from "timestring";
import prettyMilliseconds from "pretty-ms";

export default class PunishmentCommand extends Command {
    category = "Moderation";
    requiredArguments = 0;
    checkHierarchy = true; // Whether to check if the bot/the moderator can modify the target before proceeding
    action = ""; // kick
    actioned = ""; // kicked
    actionedPreposition = "from";
    resolveMember = false; // Whether a member is needed to go through with the command, otherwise just a user
    timed = false;
    maxTime = "100y";
    additionalInformation = "To try and combat rate limits, only 10 users may be targeted at a time.";
    sendMessage = true;
    requiredBanState = null; // Whether user needs to be banned (true) or not banned (false) to proceed
    usage = `placeholder`;

    initialise() {
        this.usage = `<user IDs / mentions to ${this.action} OR reply to an AutoMod message>${this.timed ? " <time>" : ""} [reason]`;
    }

    async execute(message, args) {
        const components = await ModerationUtil.extractComponents(args, message);
        const check = this.client.config.checkmark;
        const xmark = this.client.config.xmark;
        const resolver = new DiscordResolve(this.client);

        let time;
        if (this.timed) {
            let leftoversSplit = components.leftovers.split(" ");
            time = leftoversSplit.shift();
            components.leftovers = leftoversSplit.join(" ");
            if (!time) return this.sendUsage(message);
            try {
                time = timestring(time, "ms");
            } catch (e) {
                return message.channel.send(xmark + "Please specify a valid time.");
            }
        }

        let banList;

        if (components.targets.length < 1) return this.sendUsage(message);
        if (components.targets.length > 10) return message.channel.send(xmark + `Only 10 users may be ${this.actioned} at any one time.`);
        if (components.leftovers.length > 400) return message.channel.send(xmark + `The ${this.action} reason must not exceed 400 characters. Currently, it is ${components.leftovers.length}.`);
        if (this.timed && time < 5000) return message.channel.send(xmark + "Time cannot be near zero.");
        if (this.timed && time > timestring(this.maxTime, "ms")) return message.channel.send(xmark + `The maximum time allowed is ${prettyMilliseconds(timestring(this.maxTime, "ms"), { verbose: true })}.`);
        if (this.requiredBanState != null) banList = await message.guild.bans.fetch({ cache: false });

        let outputMessage = "";
        for (const t of components.targets) {
            let member = null;
            let user = await resolver.resolveUser(t);
            if (!user) {
                outputMessage += xmark + `<@${t}> cannot be resolved to a user (is the ID/mention correct?).\n`;
                continue;
            }

            member = await resolver.resolveMember(message.guild, t);
            if (!member) {
                if (this.resolveMember) {
                    outputMessage += xmark + `<@${t}> cannot be resolved to a member (are they in this guild?).\n`;
                    continue;
                }
            } else if (!PermissionUtil.canModify(message.guild.members.resolve(this.client.user), member)) {
                outputMessage += xmark + `I do not have permission to ${this.action} **${StringUtil.escapeMarkdown(member.user.tag)}**.\n`;
                continue;
            } else if (!PermissionUtil.canModify(message.member, member)) {
                outputMessage += xmark + `You do not have permission to ${this.action} **${StringUtil.escapeMarkdown(member.user.tag)}**.\n`;
                continue;
            }

            if (banList) {
                if (this.requiredBanState && !banList.has(user.id) || !this.requiredBanState && banList.has(user.id)) { // Ban required
                    outputMessage += xmark + `**${StringUtil.escapeMarkdown(user.tag)}** is ${this.requiredBanState ? "not" : "already"} banned.\n`;
                    continue;
                }
            }


            let directMessageSuccess = true;
            if (this.sendMessage) {
                if (member) {
                    await member.user.send(`You have been ${this.actioned} ${this.actionedPreposition} **${member.guild.name}**${this.timed ? ` for **${prettyMilliseconds(time, { verbose: true })}**` : ""}.\n${components.leftovers.trim() != "" ? `**Reason:** ${components.leftovers}` : ""}`)
                        .catch(() => directMessageSuccess = false);
                } else directMessageSuccess = false;
            }

            await this.doAction(user, member, `[${message.author.tag}] ${components.leftovers}`, message.guild, time - 3000 /* to make limits a bit more bearable */)
                .then(() => {
                    outputMessage += check + `${StringUtil.capitaliseFirstLetter(this.actioned)} **${StringUtil.escapeMarkdown(user.tag)}**${directMessageSuccess ? "" : " but couldn't message them"}.\n`;
                })
                .catch(e => {
                    outputMessage += xmark + `Failed to ${this.action} **${StringUtil.escapeMarkdown(user.tag)}**: ${e}.\n`;
                });

        }
        if (this.timed) outputMessage += `:timer: **Time:** ${prettyMilliseconds(time, { verbose: true })}\n`;
        if (components.leftovers.trim() != "") outputMessage += `:speech_balloon: **Reason:** ${components.leftovers}`;
        message.channel.send({ content: outputMessage, allowedMentions: { parse: [] }}); // TODO support >2000 character messages
    }

    doAction(user, member, reason, moderator, guild) { }
}
