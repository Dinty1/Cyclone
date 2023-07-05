export default class CommandUtil {
    static findCommand(commandName, client) {
        for (const c of client.commands) {
            if (c.name === commandName || c.aliases.includes(commandName)) return c;
        }
        return null;
    }
}