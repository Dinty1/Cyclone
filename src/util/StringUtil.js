import timestring from "timestring";

export default class StringUtil {
    static capitaliseFirstLetter(string) {
        return string[0].toUpperCase() + string.slice(1);
    }

    static escapeMarkdown(string) {
        return string.replace("_", "\\_").replace("*", "\\*").replace("~", "\\~");
    }

    static parseTime(string) {
        try {
            return timestring(string, "ms");
        } catch (err) {
            return null;
        }
    }
}
