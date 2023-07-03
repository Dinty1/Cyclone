import PunishmentCommand from "./abstract/PunishmentCommand.js";

export default class KickCommand extends PunishmentCommand {
    name = "kick";
    aliases = ["k"];
    description = "Kicks members from the server.";
    usage = "<user IDs / mentions to kick> [reason]";
    userPermissions = ["KickMembers", "MODROLE"]
    botPermissions = ["KickMembers"];
    action = "kick";
    actioned = "kicked";
    resolveMember = true;

    doAction(user, member, reason) {
        return member.kick(reason);
    }
}