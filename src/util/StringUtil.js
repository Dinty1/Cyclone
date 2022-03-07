export default class StringUtil {

    static capitaliseFirstLetter(string) {
        const split = string.split("");
        split[0] = split[0].toUpperCase();
        return split.join("");
    }
}