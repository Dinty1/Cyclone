import Command from "../commands/abstract/Command.js";

export default class PingCommand extends Command {
    name = "ping";
    description = "Really very obvious what this does.";
    aliases = ["p"];

    async execute(message, args) {
        const firstMessage = message;
        const secondMessage = await message.channel.send("Pong!");
        const interval = secondMessage.createdTimestamp - firstMessage.createdTimestamp;
        secondMessage.edit(`Pong! \`${interval}ms\``)
    }
}