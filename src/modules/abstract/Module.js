import { Events } from "discord.js";

export default class Module {
    logger = {
        info: message => console.log(`[${this.name} - INFO] ${message}`),
        warn: message => console.warn(`[${this.name} - WARN] ${message}`),
        error: message => console.error(`[${this.name} - ERROR] ${message}`),
        debug: message => console.log(`[${this.name} - DEBUG] ${message}`)
    };

    initialise(client) {
        this.client = client;
        this.client.on(Events.MessageCreate, (msg) => this.onMessage(msg));
        this.preEnable(client);
    }

    preEnable() {
        // Logic for stuff that needs to be done before enabling of other modules
    }

    onEnable() { }

    onMessage(message) { }
}
