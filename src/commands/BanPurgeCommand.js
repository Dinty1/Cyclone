import timestring from "timestring";
import PunishmentCommand from "./abstract/PunishmentCommand.js";

export default class BanPurgeCommand extends PunishmentCommand {
    name = "banpurge";
    aliases = ["purgeban", "bp", "pb"];
    description = "Bans users from the server and deletes all of their messages from the last day.";
    usage = "<user IDs / mentions to ban> [reason]";
    userPermissions = ["BanMembers"];
    botPermissions = ["BanMembers"];
    action = "ban";
    actioned = "banned";
    resolveMember = false;

    async doAction(user, member, reason, guild) {
        let ban = await guild.bans.fetch({user: user.id, force: true}).catch(() => {});
        if (ban) {
            return new Promise((res, rej) => {
                rej("User is already banned");
            });
        }
        return guild.members.ban(user, { deleteMessageSeconds: timestring("1d", "seconds"), reason: reason});
    }
}
