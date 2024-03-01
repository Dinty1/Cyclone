import { MessageType } from "discord.js";

export default class ModerationUtil {
    static async extractComponents(args, message) {
        const targets = []; //targets fetched from arguments
        let targetsUntil; //so that the bot knows where the reason starts
        for (let i = 0; i < args.length; i++) {
            const id = args[i].match(/^<@!?(\d{12,29})>$/)?.[1] ?? args[i].match(/^\d{12,29}$/)?.[0];
            if (!id) break;
            if (!targets.includes(id)) targets.push(id);
            targetsUntil = i + 1;
        }

        if (message && message.reference && targets.length == 0) {
            let messageReference = await message.fetchReference();
            if (messageReference.type == MessageType.AutoModerationAction) targets.push(messageReference.author.id);
            targetsUntil = 0;
            
        }

        let leftovers = args.slice(targetsUntil).join(" ");

        return { targets: targets, leftovers: leftovers };
    }
}
