import PunishmentCommand from "./abstract/PunishmentCommand.js";

export default class BanCommand extends PunishmentCommand {
    name = "ban";
    aliases = ["b"];
    description = "Bans users from the server.";
    usage = "<user IDs / mentions to ban> [reason]";
    userPermissions = ["BanMembers"]
    botPermissions = ["BanMembers"];
    action = "ban";
    actioned = "banned";
    resolveMember = false;

    async doAction(user, member, reason, guild) {
        let ban = await guild.bans.fetch({user: user.id, force: true}).catch(ignored => {});
        if (ban) {
            return new Promise((res, rej) => {
                rej("User is already banned");
            })
        }
        return guild.members.ban(user, { deleteMessageSeconds: 0, reason: reason});
    }
}