import PunishmentCommand from "./abstract/PunishmentCommand.js";

export default class KickCommand extends PunishmentCommand {
    name = "kick";
    aliases = ["k"];
    description = "Kicks members from the server.";
    usage = "<user IDs / mentions to kick> [reason]";
    userPermissions = ["KICK_MEMBERS, MODROLE"]
    botPermissions = ["KICK_MEMBERS"];
    action = "kick";
    actioned = "kicked";
    resolveMember = true;

    doAction(user, member, reason, moderator) {
        return member.kick(`[${moderator.tag}] ${reason}`);
    }
}