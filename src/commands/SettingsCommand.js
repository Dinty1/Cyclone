import Command from "./abstract/Command.js";
import * as yaml from "js-yaml";
import * as fs from "fs";
import { ActionRowBuilder, ButtonBuilder, ChannelSelectMenuBuilder, MessageFlags, MessagePayload, RoleSelectMenuBuilder, StringSelectMenuBuilder, TextDisplayBuilder } from "discord.js";
import PermissionUtil from "../util/PermissionUtil.js";

export default class SettingsCommand extends Command {
    name = "settings";
    category = "Management";
    aliases = ["config"];
    description = "Edit settings for this server";
    usage = "";
    botPermissions = ["EmbedLinks"];
    userPermissions = ["Administrator"]

    settingsSchema = {};
    editorSessions = {};

    initialise() {
        if (!this.client.data.settings) this.client.data.settings = {};
        this.logger.info("Loading guild settings schema...")
        this.settingsSchema = yaml.load(fs.readFileSync("config/guild-settings.yml"));

        this.client.on("interactionCreate", i => this.handleInteraction(i));
    }

    async execute(message, args) {
        // TODO pagination if/when needed
        // TODO keep checking permissions throughout
        const guild = message.guild;
        let settings = this.client.data.settings;
        if (!settings[guild.id]) settings[guild.id] = {};

        const editingMessage = await message.channel.send(this.getMainMenu());
        this.editorSessions[editingMessage.id] = {
            user: message.author.id,
            currentMenu: null
        }
    }


    getMainMenu() {
        const buttons = [];
        for (const key of Object.keys(this.settingsSchema)) {
            buttons.push(
                new ButtonBuilder()
                    .setCustomId(key)
                    .setLabel(this.settingsSchema[key].title)
                    .setStyle("Secondary")
            )
        }

        const actionRows = [
            new TextDisplayBuilder({ content: "# Settings Menu\nClick the button that corresponds with the settings you would like to edit:" }),
            new ActionRowBuilder()
        ];

        for (const button of buttons) {
            if (actionRows[actionRows.length - 1].components.length > 4) actionRows.push(new ActionRowBuilder());
            actionRows[actionRows.length - 1].addComponents(button);
        }

        return {
            components: actionRows,
            flags: [MessageFlags.IsComponentsV2]
        };
    }

    async handleInteraction(i) {
        let session = this.editorSessions[i.message.id];
        if (!session) return;

        if (!PermissionUtil.hasPermission(i.member, ["Administrator"])) return i.reply({ content: "You must be an administrator to edit settings.", ephemeral: true });
        if (session.user != i.user.id) return i.reply({ content: "You did not initiate this editor session!", ephemeral: true });

        if (i.customId == "main-menu") {
            i.update(this.getMainMenu());
            session.currentMenu = null;
            return;
        }

        if (i.isButton()) {
            i.update(this.generateMenu(i.customId, i.guild.id));
            session.currentMenu = i.customId;
        }
        if (i.isAnySelectMenu()) this.handleSettingChange(i);
    }

    generateMenu(id, guild) {
        const actionRows = [];

        const menuSchema = this.settingsSchema[id];
        const inputs = Object.keys(menuSchema).filter(k => k != "title" && k != "description");

        actionRows.push(new TextDisplayBuilder({ content: `# ${menuSchema.title}\n${menuSchema.description}\n` }));


        if (!this.client.data.settings[guild][id]) this.client.data.settings[guild][id] = {};
        let menuData = this.client.data.settings[guild][id];
        for (const input of inputs) {
            let inputData = menuSchema[input];

            let component;
            switch (inputData.type) {
                case "select-string":
                    let optionsFormatted = [];
                    for (const option of inputData.options) {
                        optionsFormatted.push({
                            label: option.label,
                            value: option.id,
                            default: menuData[input]?.includes(option.id)
                        })
                    }
                    component = new StringSelectMenuBuilder().addOptions(optionsFormatted);
                    break;
                case "select-channel":
                    let channelSelectBuilder = new ChannelSelectMenuBuilder()
                        .addChannelTypes("GuildText")
                    if (menuData[input] && menuData[input].length > 0) channelSelectBuilder.addDefaultChannels(menuData[input]);
                    component = channelSelectBuilder;
                    break;
                case "select-role":
                    let roleSelectBuilder = new RoleSelectMenuBuilder()
                    if (menuData[input] && menuData[input].length > 0) roleSelectBuilder.addDefaultRoles(menuData[input]);
                    component = roleSelectBuilder;
                    break;
                case "boolean":
                    let startValue = null;
                    if (menuData[input]?.includes("true")) startValue = true;
                    else if (menuData[input]?.includes("false")) startValue = false;
                    else if (inputData.default != undefined) startValue = inputData.default;

                    component = new StringSelectMenuBuilder().addOptions([
                        {
                            label: "Yes",
                            value: "true",
                            default: startValue == true
                        },
                        {
                            label: "No",
                            value: "false",
                            default: startValue == false
                        }
                    ])
            }

            component.setCustomId(input);
            if (inputData.type.startsWith("select-")) {
                if (inputData.required == false) component.setMinValues(0);
                if (inputData.multiple == true) component.setMaxValues(component.options ? component.options.length : 25);
            }

            let labelText = `__**${inputData.title}**__`;
            if (inputData.description) labelText += `\n${inputData.description}`;

            const label = new TextDisplayBuilder({ content: labelText });

            actionRows.push(label);
            actionRows.push(new ActionRowBuilder().addComponents(component));
        }

        actionRows.push(
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setStyle("Secondary")
                        .setLabel("Back to Main Page")
                        .setCustomId("main-menu")

                )
        )

        return { components: actionRows };
    }

    handleSettingChange(i) {
        let newValue;

        if (i.isChannelSelectMenu()) newValue = i.channels.toJSON().map(x => x.id);
        else if (i.isRoleSelectMenu()) newValue = i.roles.toJSON().map(x => x.id);
        else if (i.isStringSelectMenu()) newValue = i.values;

        let session = this.editorSessions[i.message.id];
        this.client.data.settings[i.guild.id][session.currentMenu][i.customId] = newValue;
        i.update(this.generateMenu(session.currentMenu, i.guild.id))
    }
}