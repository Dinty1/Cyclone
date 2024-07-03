import prettyMilliseconds from "pretty-ms";
import ModLogAction from "./abstract/ModLogAction.js";

export default class TimeoutAction extends ModLogAction {
    internalId = "TIMEOUT";
    actioned = "User Timed Out";
    color = "#dddd00";
    auditLogEntryType = 24;

    extractInfo(entry, guild) {
        for (const change of entry.changes) {
            if (change.key == "communication_disabled_until") {
                if (!change.new) continue;
                let until = Date.parse(change.new);
                let timestamp = `<t:${Math.floor(until / 1000)}:R>`;
                let duration = until - entry.createdAt;
                let durationFormatted = `${prettyMilliseconds(duration)} (To expire ${timestamp})`;
                return {
                    extraFields: [{
                        name: "Duration",
                        value: durationFormatted
                    }]
                }
            }
        }

        return false;
    }
}