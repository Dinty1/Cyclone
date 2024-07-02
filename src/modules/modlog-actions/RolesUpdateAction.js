import ModLogAction from "./abstract/ModLogAction.js";

export default class RolesUpdateAction extends ModLogAction {
    internalId = "ROLES_UPDATE";
    actioned = "Member Roles Updated";
    color = "#64acd7";
    auditLogEntryType = 25;

    extractInfo(entry, guild) {
        const trackedRoles = guild.client.data.settings[guild.id].mod_log.tracked_roles;
        if (!trackedRoles) return false;

        let removed = [];
        let added = [];

        for (const change of entry.changes) {
            if (change.key == "$remove") removed.push(...change.new);
            if (change.key == "$add") added.push(...change.new);
        }

        let removedAndTracked = removed.filter(r => trackedRoles.includes(r.id));
        let addedAndTracked = added.filter(r => trackedRoles.includes(r.id));

        if (addedAndTracked + removedAndTracked == 0) return;

        return {
            target: entry.targetId,
            executor: entry.executorId,
            reason: entry.reason,
            extraFields: [{
                name: "Tracked Roles Added",
                value: this.formatRoleList(addedAndTracked),
            }, {
                name: "Tracked Roles Removed",
                value: this.formatRoleList(removedAndTracked),
            }
        ]}
    }

    formatRoleList(roles) {
        return roles.length > 0 ? roles.map(r => `${r.name} (<@&${r.id}>)`).join(", ") : "*None*";
    }
}