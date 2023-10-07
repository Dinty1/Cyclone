import { EmbedBuilder } from "discord.js";
import Command from "../commands/abstract/Command.js";
import ModerationUtil from "../util/ModerationUtil.js";
import { DiscordResolve } from "@discord-util/resolve";
import StringUtil from "../util/StringUtil.js"

export default class UserInfoCommand extends Command {
    name = "userinfo";
    description = "Returns information on users";
    usage = "[user IDs / mentions to get info on]";
    aliases = ["ui", "info"];
    botPermissions = ["EmbedLinks"];
    additionalInformation = "Due to Discord limitations, only 10 users can be queried at one time";

    async execute(message, args) {
        const { targets: targets } = ModerationUtil.extractComponents(args);
        if (targets.length == 0) targets.push(message.author.id)
        const resolver = new DiscordResolve(this.client);
        let outputEmbeds = [];
        for (const target of targets) {
            if (outputEmbeds.length >= 10) break; // Can't have more than 10 embeds
            const user = await resolver.resolveUser(target);
            if (!user) {
                outputEmbeds.push(new EmbedBuilder()
                    .setColor("#ff0000")
                    .setTitle(`Failed to resolve user ${target}`))
                continue;
            }

            let output = new EmbedBuilder()
                .setTitle(StringUtil.escapeMarkdown(`${user.username} (${user.displayName})`))
                .setThumbnail(user.avatarURL())
                .setColor(this.client.config.embedColor)
                .addFields({
                    name: "User ID",
                    value: user.id,
                    inline: true
                }, {
                    name: "Account Created",
                    value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
                    inline: true
                });

            let member = await resolver.resolveMember(message.guild, target).catch(() => { })
            if (member) {
                output.addFields(
                    {
                        name: "Joined server",
                        value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`,
                        inline: true
                    },
                    {
                        name: "Roles",
                        value: member.roles.cache.filter(r => r.id != message.guild.id).toJSON().join(" ")
                    }
                )
            }

            outputEmbeds.push(output);
        }

        message.channel.send({ embeds: outputEmbeds });
    }
}
