import PunishmentCommand from "./abstract/PunishmentCommand.js";

export default class BanCommand extends PunishmentCommand {
    name = "ban";
    aliases = ["b"];
    description = "Bans users from the server.";
    userPermissions = ["BanMembers"];
    botPermissions = ["BanMembers"];
    action = "ban";
    actioned = "banned";
    resolveMember = false;
    requiredBanState = false;

    async doAction(user, member, reason, guild) {
        return guild.members.ban(user, { deleteMessageSeconds: 0, reason: reason});
    }
}
