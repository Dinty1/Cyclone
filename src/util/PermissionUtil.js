export default class PermissionUtil {

    static hasPermission(member, permissionList, channel) {
        if (permissionList.length < 1) return true;
        for (const p of permissionList) {
            switch (p) {
                case "MODROLE":
                    break;
                default:
                    if (!channel && member.hasPermission(p)) return true;
                    if (channel.permissionsFor(member).has(p)) return true;
            }
        }
        return false;
    }

    static canModify(subject, target) {
        if (subject.guild.ownerId === subject.user.id) return true; // Owner can modify everyone
        if (target.guild.ownerId === target.user.id) return false; // No one can modify owner

        if (subject.roles.highest.position > target.roles.highest.position) return true; // Has higher role
        return false; // Doesn't have a higher role
    }
}
