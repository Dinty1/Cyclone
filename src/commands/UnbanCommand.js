import PunishmentCommand from "./abstract/PunishmentCommand.js";

export default class BanCommand extends PunishmentCommand {
    name = "unban";
    aliases = ["ub"];
    description = "Unbans users from the server.";
    usage = "<user IDs / mentions to unban> [reason]";
    userPermissions = ["BanMembers"]
    botPermissions = ["BanMembers"];
    action = "unban";
    actioned = "unbanned";
    resolveMember = false;
    sendMessage = false;

    async doAction(user, member, reason, guild) {
        let ban = await guild.bans.fetch({user: user.id, force: true}).catch(ignored => {});
        if (!ban) {
            return new Promise((res, rej) => {
                rej("User is not banned");
            })
        }
        return guild.members.unban(user, reason);
    }
}