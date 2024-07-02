import ModLogAction from "./abstract/ModLogAction.js";

export default class KickAction extends ModLogAction {
    internalId = "KICK";
    actioned = "User Kicked";
    color = "#dddd00";
    auditLogEntryType = 20;

    extractInfo(entry, guild) {
        return {
            target: entry.targetId,
            executor: entry.executorId,
            reason: entry.reason
        }
    }
}