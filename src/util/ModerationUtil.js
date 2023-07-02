export default class ModerationUtil {
    static extractComponents(args) {
        const targets = []; //targets fetched from arguments
        var targetsUntil; //so that the bot knows where the reason starts
        for (let i = 0; i < args.length; i++) {
            if ((args[i].startsWith('<@!') || args[i].startsWith("<@")) && args[i].endsWith('>') && !args[i].startsWith('<@&')) {
                let id = args[i]
                id = id.slice(2, -1);
                if (id.startsWith('!')) {
                    id = id.slice(1);
                }
                if (!targets.includes(id)) {
                    targets.push(id);
                }
                targetsUntil = i + 1;
            }
            else if (/^\d+$/.test(args[i]) && args[i].length > 11 && args[i].length < 30) {//ew regex
                let id = args[i];
                if (!targets.includes(id)) {
                    targets.push(id);
                }

                targetsUntil = i + 1;
            }
            else break;
        }

        var leftovers = args.slice(targetsUntil).join(" ");

        

        // Try to get count (if relevant)

        return { targets: targets, leftovers: leftovers }
    }
}