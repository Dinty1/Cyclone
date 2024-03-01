import timestring from "timestring";
import PunishmentCommand from "./abstract/PunishmentCommand.js";

export default class BanPurgeCommand extends PunishmentCommand {
    name = "purgeban";
    aliases = ["banpurge", "bp", "pb"];
    description = "Bans users from the server and deletes all of their messages from the last day.";
    userPermissions = ["BanMembers"];
    botPermissions = ["BanMembers"];
    action = "ban";
    actioned = "banned";
    resolveMember = false;
    requiredBanState = false;

    async doAction(user, member, reason, guild) {
        return guild.members.ban(user, { deleteMessageSeconds: timestring("1d", "seconds"), reason: reason});
    }
}
