import Module from "./abstract/Module.js";
import * as fs from "fs";

export default class DataManager extends Module {
    name = "DataManager";
    dataFile = "data.json";
    oldData;

    preEnable() {
        this.client.data = {};
        if (fs.existsSync(this.dataFile)) {
            this.client.data = JSON.parse(fs.readFileSync(this.dataFile));
            this.oldData = { ...this.client.data };
        }

        setInterval(async () => {
            this.saveData();
        }, 15000)

        process.on("SIGTERM", () => {
            this.logger.info("Received SIGTERM, Saving data...");
            this.saveData();
            process.exit();
        })
    }

    saveData() {
        if (JSON.stringify(this.oldData) == JSON.stringify(this.client.data)) return;

        this.logger.info("Writing data...");
        fs.writeFileSync(this.dataFile, JSON.stringify(this.client.data));
        this.oldData = { ...this.client.data }; // Spread to dereference
    }
}