import PunishmentCommand from "./abstract/PunishmentCommand.js";

export default class BanCommand extends PunishmentCommand {
    name = "unban";
    aliases = ["ub"];
    description = "Unbans users from the server.";
    userPermissions = ["BanMembers"];
    botPermissions = ["BanMembers"];
    action = "unban";
    actioned = "unbanned";
    resolveMember = false;
    sendMessage = false;
    requiredBanState = true;

    async doAction(user, member, reason, guild) {
        return guild.members.unban(user, reason);
    }
}
