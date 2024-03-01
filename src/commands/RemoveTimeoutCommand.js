import PunishmentCommand from "./abstract/PunishmentCommand.js";

export default class RemoveTimeoutCommand extends PunishmentCommand {
    name = "removetimeout";
    aliases = ["unmute", "untimeout", "ut", "um", "removemute"];
    description = "Removes timeout from members.";
    userPermissions = ["ModerateMembers"];
    botPermissions = ["ModerateMembers"];
    action = "unmute";
    actioned = "unmuted";
    actionedPreposition = "in";
    resolveMember = true;

    doAction(user, member, reason) {
        if (!member.communicationDisabledUntil) return new Promise((res, rej) => {
            rej("Member is not timed out");
        });
        return member.disableCommunicationUntil(null, reason);
    }
}
