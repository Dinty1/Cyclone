import ModLogAction from "./abstract/ModLogAction.js";

export default class BanAction extends ModLogAction {
    internalId = "BAN";
    actioned = "User Banned";
    color = "#dd0000";
    auditLogEntryType = 22;

    extractInfo(entry, guild) {
        return {};
    }
}