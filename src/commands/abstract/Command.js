import PermissionUtil from "../../util/PermissionUtil.js";

export default class Command {
    name = ""; // Command name
    category = "General"; // What category the command falls under
    aliases = []; // Command aliases
    description = "A useful command!"; // Command description
    additionalInformation = "None" // Additional information about args usage etc
    usage = ""; // How the command should be used
    requiredArguments = 0; // Required number of arguments
    userPermissions = []; // User needs one of these permissions to execute command
    botPermissions = []; // Bot needs all of these permissions to execute command
    ownerOnly = false; // Only the owner can execute this command
    client;

    constructor(client) {
        this.client = client;
    }

    process(message, args) {
        if (args.length < this.requiredArguments) this.sendUsage(message)
        else if (!PermissionUtil.hasPermission(message.guild.me, this.botPermissions, message.channel)) message.channel.send(this.client.config.xmark + `I need the following permissions to execute this command: \`${this.botPermissions.toString()}\``)
        else if (!PermissionUtil.hasPermission(message.member, this.userPermissions, message.channel)) message.channel.send(this.client.config.xmark + `You need one of the following permissions to execute this command: \`${this.userPermissions.toString()}\``)
        else this.execute(message, args)
    }

    sendUsage(message) {
        message.channel.send(`Command usage: \`${this.client.config.prefix}${this.name} ${this.usage}\`\nFor more information, do \`${this.client.config.prefix}help ${this.name}\``);
    }

    execute(message, args) { }
}