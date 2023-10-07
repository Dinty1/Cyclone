export default class ModerationUtil {
    static extractComponents(args) {
        const targets = []; //targets fetched from arguments
        let targetsUntil; //so that the bot knows where the reason starts
        for (let i = 0; i < args.length; i++) {
            const id = args[i].match(/^<@!?(\d{12,29})>$/)?.[1] ?? args[i].match(/^\d{12,29}$/)?.[0];
            if (!id) break;
            if (!targets.includes(id)) targets.push(id);
            targetsUntil = i + 1;
        }

        let leftovers = args.slice(targetsUntil).join(" ");

        return { targets: targets, leftovers: leftovers };
    }
}
