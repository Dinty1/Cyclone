import PunishmentCommand from "./abstract/PunishmentCommand.js";

export default class TimeoutCommand extends PunishmentCommand {
    name = "timeout";
    aliases = ["mute", "m", "t"];
    description = "Times members out using the inbuilt timeout feature.";
    usage = "<user IDs / mentions to timeout> <time> [reason]";
    userPermissions = ["ModerateMembers"]
    botPermissions = ["ModerateMembers"];
    action = "time out";
    actioned = "timed out";
    actionedPreposition = "in";
    resolveMember = true;
    timed = true;
    maxTime = "28d";
    requiredArguments = 2;

    doAction(user, member, reason, guild, time) {
        return member.timeout(time, reason);
    }
}