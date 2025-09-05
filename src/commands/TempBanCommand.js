import { Events } from "discord.js";
import PunishmentCommand from "./abstract/PunishmentCommand.js";

export default class TempBanCommand extends PunishmentCommand {
    name = "tempban";
    aliases = ["tb"];
    description = "Temporarily bans users from the server.";
    userPermissions = ["BanMembers"];
    botPermissions = ["BanMembers"];
    action = "tempban";
    actioned = "temporarily banned";
    resolveMember = false;
    requiredBanState = false;
    timed = true;
    requiredArguments = 1;

    tempbanData;

    initialise() {
        if (!this.client.data.timedPunishments) this.client.data.timedPunishments = { bans: {} };
        this.tempbanData = this.client.data.timedPunishments.bans;

        setInterval(async () => {
            for (let guild in this.tempbanData) {
                for (let user in this.tempbanData[guild]) {
                    if (this.tempbanData[guild][user].until < Date.now()) {
                        await this.client.guilds.cache.get(guild).members.unban(user, "Temporary Ban Expired")
                            .catch(err => {
                                if (err.code == 10026) return; // Unknown ban
                                throw err;
                            });
                        delete this.tempbanData[guild][user];
                    }
                }
            }
        }, 200000);

        this.client.on(Events.GuildBanRemove, ban => {
            if (this.tempbanData[ban.guild.id]?.[ban.user.id]) delete this.tempbanData[ban.guild.id][ban.user.id];
        })

        super.initialise();
    }

    async doAction(user, member, reason, guild, time) {
        let until = Date.now() + time;
        return guild.members.ban(user, { deleteMessageSeconds: 0, reason: reason + ` [Expires ${new Date(until).toUTCString()}]` })
            .then(() => {
                if (!this.tempbanData[guild.id]) this.tempbanData[guild.id] = {};
                this.tempbanData[guild.id][user.id] = {
                    name: user.tag, // Might add a feature later to list timed punishments w/ username
                    until: until,
                    reason: reason
                }
            })
    }
}
