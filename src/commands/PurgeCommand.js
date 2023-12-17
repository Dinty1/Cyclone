import Command from "./abstract/Command.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageType } from "discord.js";
import StringUtil from "../util/StringUtil.js";
import { DiscordResolve } from "@discord-util/resolve";
import timestring from "timestring";

export default class PurgeCommand extends Command {
    name = "purge";
    aliases = ["clean", "c"];
    description = `Deletes messages in a channel according to certain criteria. Do \`${this.client.config.prefix}help ${this.name}\` for information on these criteria.`;
    category = "Management";
    botPermissions = ["ManageMessages"];
    userPermissions = ["Administrator"];
    usage = "<Parameters separated by spaces AND/OR reply to a message>";
    additionalInformation = [
        "**How it Works**",
        "- You must specify the set of messages to scan for deletion (either by number, time or replying to one).",
        "- Other parameters can be added to only delete messages that meet one of certain criteria (order is unimportant).",
        "- Use the `and` parameter to only delete messages that meet **all** criteria (users passed as parameters count as one criterion in total) and `not` to delete everything that doesn't satisfy the criteria.",
        "- Add the `silent` parameter to delete the command and confirmation message after executing.",
        "\n**Examples**",
        "`-purge 10m bots \"keep me\" not` = Delete all messages in the last 10 minutes which weren't sent by bots and don't have \"keep me\" in their content.",
        "`-purge 50` = Delete the last 50 messages.",
        "`-purge @user1 <user2id> and mentions [when replying to a message]` = Delete messages from user1 and user2 which mention someone, up to **and including** the replied message.",
        "\n**All Conditional Flags**",
        "**[Text wrapped in quotes]** - Messages containing this text",
        "**[User mentions/ids]** - Whether the message was sent by one of the identified users",
        "**bots** - Messages sent by bots",
        "**left** - Messages sent by people who are no longer in the server",
        "**embeds** - Messages with embeds",
        "**attachments** - Messages with attachments",
        "**components** - Messages with componenets (ie buttons, select menus)",
        "**mentions** - Messages which mention a user, everyone/here or a role",
        "**pinned** - Pinned messages",
        "\n**Other Notes**",
        "- Only 500 messages can be scanned at a time.",
        "- Only messages newer than 14 days can be purged."
    ].join("\n");

    async execute(message, args) {
        // Special parameters modify something about the command's behaviour
        const specialParams = ["and", "not", "silent"];
        const resolver = new DiscordResolve(this.client);
        const maxMessagesToCheck = 500;
        const warnings = []; // Warnings about invalid params, shortened stuff, etc
        const quotesRegex = /['"“‘«'"”’„”»]/;

        // Arguments for message set to check. If more than one is specified the one which covers the smallest amount of messages will be used
        let messageFrom = null;
        let time = null;
        let numberOfMessages = null;

        let phrasesToMatch = []; // Leaving this separate from other args because it's dynamic
        let authors = []; // Same here
        let params = [];
        let resolvedUser;

        if (message.type === MessageType.Reply) {
            messageFrom = message.reference.messageId;
        }

        // Fill in all the params and stuff
        for (let i = 0; i < args.length; i++) {
            let arg = args[i];
            if (quotesRegex.test(arg[0])) {
                let phrase = arg.slice(1);
                while (!quotesRegex.test(arg[arg.length-1])) {
                    arg = args[++i];
                    if (!arg) return message.channel.send(this.client.config.xmark + "Unterminated phrase!");
                    phrase += " " + arg;
                }
                phrase = phrase.slice(0, -1).toLowerCase();
                phrasesToMatch.push(phrase);
            }
            else if (/^(<@!?\d{12,29}>|\d{12,29})$/.test(arg) && (resolvedUser = await resolver.resolveUser(arg))) authors.push(resolvedUser.id);
            else if (/^\d+$/g.test(arg)) numberOfMessages = parseInt(arg);
            else if (StringUtil.parseTime(arg) !== null) time = StringUtil.parseTime(arg) || null;
            else params.push(arg.toLowerCase());
        }

        if (!(messageFrom || numberOfMessages || time)) {
            return message.channel.send(this.client.config.xmark + `You need to specify a message set to check. See \`${this.client.config.prefix}help ${this.name}\` for more information.`);
        }

        let allMessages = [];
        await this.fetchMessages(message.channel, allMessages, message.id, maxMessagesToCheck, {
            messageFrom: messageFrom,
            time: time,
            numberOfMessages: numberOfMessages
        }, warnings);

        let unknownParams = []; // Will be converted to a warning later
        let toDelete = [];

        if (maxMessagesToCheck != numberOfMessages && allMessages.length === maxMessagesToCheck) warnings.push("Only checked 500 messages because this is the maximum that can be checked at one time (to prevent rate limits)");

        // Skip the looping if there are no conditions to check. This doesn't check param validity but that's useful i guess
        if (params.filter(p => !specialParams.includes(p)).length === 0 && phrasesToMatch.length === 0 && authors.length === 0) toDelete = allMessages.map(m => m.id);

        else for (const m of allMessages) {
            // TODO might be able to break off early if we know that a particular outcome is certain
            let satisfiesAnyCriteria = false;
            let satisfiesAllCriteria = true;

            if (authors.length > 0) {
                if (authors.includes(m.author.id)) satisfiesAnyCriteria = true;
                else satisfiesAllCriteria = false;
            }

            if (phrasesToMatch.length > 0) {
                let sanitisedContent = m.content.replaceAll(/\s+/g, " ").toLowerCase();
                for (const phrase of phrasesToMatch) {
                    if (sanitisedContent.includes(phrase.trim())) {
                        satisfiesAnyCriteria = true;
                    } else satisfiesAllCriteria = false;
                }
            }

            for (const param of params) {
                if (specialParams.includes(param)) continue;
                let result = this.checkParam(param, m);
                if (result == true) satisfiesAnyCriteria = true;
                else if (result == false) satisfiesAllCriteria = false;
                else if (!unknownParams.includes(param)) unknownParams.push(param);
            }

            // Should we delete?
            let shouldDelete = false;
            if (params.includes("and")) shouldDelete = satisfiesAllCriteria;
            else shouldDelete = satisfiesAnyCriteria;

            // Not means we invert the logic
            if (params.includes("not")) shouldDelete = !shouldDelete;

            if (shouldDelete) toDelete.push(m.id);
        }

        if (unknownParams.length > 0) warnings.push("Did not recognise the following parameters: " + unknownParams.join(", "));

        let confirmMessageBuilder = [];
        let confirmMessageOptions = {};

        if (toDelete.length > 0) {
            confirmMessageBuilder.push(`About to delete **${toDelete.length}** messages. Are you sure?`);

            let row = new ActionRowBuilder()
                .addComponents(new ButtonBuilder()
                    .setCustomId("confirmpurge")
                    .setStyle(ButtonStyle.Danger)
                    .setLabel("Confirm")
                    .setEmoji("✅")
                );

            confirmMessageOptions.components = [row];
        } else confirmMessageBuilder.push(this.client.config.xmark + "Could not find any messages that met those criteria.");

        for (const warning of warnings) {
            confirmMessageBuilder.push(`:warning: ${warning}`);
        }

        confirmMessageOptions.content = confirmMessageBuilder.join("\n");

        const confirmationMessage = await message.channel.send(confirmMessageOptions);
        
        if (toDelete.length > 0) confirmationMessage.awaitMessageComponent({
            time: 120000
        }).then(async i => {
            if (i.user.id !== message.author.id) return i.reply({ content: "You did not initiate this purge!", ephemeral: true});

            await i.deferReply({ ephemeral: true });
            // Stackoverflow my beloved
            for (let i = 0; i < toDelete.length; i += 100) {
                const chunk = toDelete.slice(i, i + 100);

                await message.channel.bulkDelete(chunk, true);
            }

            await i.editReply({ content: "Success!" });

            if (params.includes("silent")) {
                message.delete();
                confirmationMessage.delete();
            } else {
                confirmationMessage.edit({ content: `Successfully deleted **${toDelete.length}** messages.`, components: [] });
            }
        }).catch((e) => {
            confirmationMessage.edit({ content: "Confirmation failed (you probably took too long to confirm).", components: [] }).catch(() => {});
        });
    }

    async fetchMessages(channel, allMessages, before, maxMessagesToCheck, options, warnings) {
        const messagesRemaining = maxMessagesToCheck - allMessages.length;
        if (messagesRemaining == 0) return;

        const messages = await channel.messages.fetch({ before: before, limit: messagesRemaining < 100 ? messagesRemaining : 100 });
        if (messages.size == 0) return;
        for (const message of messages.toJSON()) {
            if ((options.time && message.createdAt.getTime() < Date.now() - options.time) || (options.numberOfMessages && allMessages.length == options.numberOfMessages)) return;
            if (message.createdAt.getTime() + timestring("13d23h50m", "ms") < Date.now()) {
                warnings.push("Did not scan some messages because they were older than 14 days (messages older than this cannot be bulk deleted)");
                return;
            }
            allMessages.push(message);
            if (message.id == options.messageFrom) return;
        }
        await this.fetchMessages(channel, allMessages, allMessages[allMessages.length - 1].id, maxMessagesToCheck, options, warnings);
    }

    checkParam(param, message) {
        let mentions = message.mentions;
        switch (param) {
            case "bots":
                return message.author.bot;
            case "left":
                return message.member == undefined;
            case "embeds":
                return message.embeds.length > 0;
            case "attachments":
                return message.attachments.size > 0;
            case "components":
                return message.components.length > 0;
            case "mentions":
                return mentions.users.size + mentions.roles.size > 0 || mentions.everyone;
            case "pinned":
                return message.pinned;
            default:
                return null;
        }
    }
}
