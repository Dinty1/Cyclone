import { EmbedBuilder } from "discord.js";
import Command from "../commands/abstract/Command.js";
import ModerationUtil from "../util/ModerationUtil.js";
import { DiscordResolve } from "@discord-util/resolve";
import StringUtil from "../util/StringUtil.js";
import PermissionUtil from "../util/PermissionUtil.js";

export default class UserInfoCommand extends Command {
    name = "userinfo";
    description = "Returns information on users";
    usage = "[user IDs / mentions to get info on]";
    aliases = ["ui", "info"];
    botPermissions = ["EmbedLinks"];
    additionalInformation = "Due to Discord limitations, only 10 users can be queried at one time";

    // TODO max character check
    async execute(message, args) {
        const { targets: targets } = ModerationUtil.extractComponents(args);
        if (targets.length == 0) targets.push(message.author.id);
        const resolver = new DiscordResolve(this.client);
        let outputEmbeds = [];

        let warnings = [];

        let selfMember = message.guild.members.cache.get(this.client.user.id);
        let banList;
        if (PermissionUtil.hasPermission(selfMember, ["BanMembers"])) banList = await message.guild.bans.fetch({ cache: false });
        else warnings.push("Could not check ban status because I don't have the `BanMembers` permission.");

        for (const target of targets) {
            if (outputEmbeds.length >= 10) break; // Can't have more than 10 embeds
            const user = await resolver.resolveUser(target);
            if (!user) {
                outputEmbeds.push(new EmbedBuilder()
                    .setColor("#ff0000")
                    .setTitle(`Failed to resolve user ${target}`));
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

            let member = await resolver.resolveMember(message.guild, target).catch(() => { });
            if (member) {
                output.addFields(
                    {
                        name: "Joined server",
                        value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`,
                        inline: true
                    },
                    {
                        name: "Roles",
                        value: member.roles.cache.filter(r => r.id != message.guild.id).toJSON().sort((a, b) => b.position - a.position).join(" ")
                    }
                );
            }

            if (banList) {
                let banInfo = "";
                if (banList.has(user.id)) {
                    banInfo += "Yes. ";
                    if (!PermissionUtil.hasPermission(message.member, ["BanMembers"])) banInfo += "You do not have permission to view the reason.";
                    else {
                        let reason = banList.get(user.id).reason;
                        if (reason) banInfo += "Reason:\n```" + reason + "```";
                        else banInfo += "No ban reason specified.";
                    }
                } else banInfo += "No";
                output.addFields({
                    name: "Banned?",
                    value: banInfo
                });
            }

            outputEmbeds.push(output);
        }

        let outputMessageOptions = { embeds: outputEmbeds };
        if (warnings.length > 0) outputMessageOptions.content = warnings.map(w => ":warning: " + w).join("\n");
        message.channel.send(outputMessageOptions);
    }
}
