export default class CommandUtil {
    static findCommand(commandName, client) {
        var foundCommand = false;
        client.commands.forEach(c => {
            if (c.name == commandName || c.aliases.includes(commandName)) foundCommand = c;
        })
        return foundCommand;
    }
}