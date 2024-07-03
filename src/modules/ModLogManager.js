import Module from "./abstract/Module.js";
import { readdirSync } from "fs";
import { EmbedBuilder, Events } from "discord.js";
import { DiscordResolve } from "@discord-util/resolve";

export default class ModLogManager extends Module {
    name = "ModLog Manager";
    actions = {};

    onEnable() {
        this.logger.info("Registering modlog actions");
        const actionFiles = readdirSync("src/modules/modlog-actions/");
        for (const f of actionFiles) {
            if (!f.endsWith(".js")) continue; // Ignore non-js files
            import(`./modlog-actions/${f}`).then(action => {
                let constructedAction = new action.default();
                if (!this.actions[constructedAction.auditLogEntryType]) this.actions[constructedAction.auditLogEntryType] = []
                this.actions[constructedAction.auditLogEntryType].push(constructedAction);
            });
        }

        this.client.on(Events.GuildAuditLogEntryCreate, (entry, guild) => this.handleNewAuditLogEntry(entry, guild));
    }

    async handleNewAuditLogEntry(entry, guild) {
        const actionList = this.actions[entry.action];
        if (!actionList) return; // Not tracked

        for (const action of actionList) {
            const guildSettings = this.client.data.settings[guild.id];
            if (!guildSettings || !guildSettings.mod_log || !guildSettings.mod_log.actions) continue;
            if (!guildSettings.mod_log.actions.includes(action.internalId) && action.internalId != "ROLES_UPDATE") continue;
            if (!guildSettings.mod_log.channel || guildSettings.mod_log.channel.length == 0) continue;

            const info = await action.extractInfo(entry, guild);

            if (!info) continue; // If the log shouldn't be triggered for whatever reason

            const resolver = new DiscordResolve(this.client);
            const target = await resolver.resolveUser(info.target);
            const executor = await resolver.resolveUser(info.executor);
            let embed = new EmbedBuilder()
                .setTitle(`${action.actioned}: ${target.tag}`)
                .setAuthor({
                    name: executor.tag,
                    iconURL: `https://cdn.discordapp.com/avatars/${executor.id}/${executor.avatar}.png`
                })
                .setColor(action.color)
                .setThumbnail(`https://cdn.discordapp.com/avatars/${target.id}/${target.avatar}.png`)
                .addFields({
                    name: "User",
                    value: `<@${info.target}>`,
                    inline: true
                }, {
                    name: "Moderator",
                    value: `<@${info.executor}>`,
                    inline: true
                });

            if (info.extraFields) embed.addFields(...info.extraFields)

            embed.addFields({
                name: "Reason",
                value: info.reason ?? "*None specified*",
                inline: false
            }).setTimestamp(entry.createdTimestamp);
            this.client.channels.cache.get(guildSettings.mod_log.channel[0]).send({ embeds: [embed] });
        }
    }
}