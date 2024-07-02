import ModLogAction from "./abstract/ModLogAction.js";

export default class TimeoutRemoveAction extends ModLogAction {
    internalId = "TIMEOUT_REMOVE";
    actioned = "User Timeout Removed";
    color = "#00dd00";
    auditLogEntryType = 24;

    extractInfo(entry, guild) {
        for (const change of entry.changes) {
            if (change.key == "communication_disabled_until") {
                if (change.new) continue;
                return {
                    target: entry.targetId,
                    executor: entry.executorId,
                    reason: entry.reason,
                }
            }
        }

        return false;
    }
}