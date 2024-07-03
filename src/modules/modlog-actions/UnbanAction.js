import ModLogAction from "./abstract/ModLogAction.js";

export default class UnbanAction extends ModLogAction {
    internalId = "UNBAN";
    actioned = "User Unbanned";
    color = "#00dd00";
    auditLogEntryType = 23;

    extractInfo(entry, guild) {
        return {};
    }
}