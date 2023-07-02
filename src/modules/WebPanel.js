import Module from "./abstract/Module.js";
import express from "express";
import cors from "cors";
import fs from "fs";
import { Server } from "socket.io";
import { createServer } from "http";
import fetch from "node-fetch";
import { v4 as uuid } from "uuid";

export default class WebPanel extends Module {
    name = "Web Panel";

    sessions = {};

    sendBody(socket, body) {
        socket.emit("page-update", fs.readFileSync(`src/web/${body}-body.html`).toString().replace("AUTHURL", this.client.config.oauth2URL));
    }

    onEnable() {
        const app = express();
        const server = createServer(app);
        app.use(cors());
        server.listen(this.client.config.websitePort, () => {
            this.logger.info("Server listening!");
        });
        const io = new Server(server);

        app.get("/", (req, res) => {
            if (req.query.code) {
                res.sendFile("index.html", { root: "./src/web" })
            } else {
                res.send(fs.readFileSync("src/web/login-redirect.html").toString().replace("AUTHURL", this.client.config.oauth2URL))
            }

        });

        io.on("connection", socket => {
            let accessToken;
            let tokenType;
            let sessionId;
            let user;

            socket.emit("get-auth");

            // Wait for the socket to send us the code
            socket.on("auth-code", async code => {
                try {
                    const oauthResult = await fetch("https://discord.com/api/oauth2/token", {
                        method: "POST",
                        body: new URLSearchParams({
                            client_id: this.client.user.id,
                            client_secret: process.env.DISCORD_CLIENT_SECRET,
                            code,
                            grant_type: "authorization_code",
                            redirect_uri: this.client.config.oauth2Redirect,
                            scope: "identify guilds",
                        }),
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                        },
                    });

                    const oauthData = await oauthResult.json();
                    // Not going to bother doing anything with the refresh token because 168 hours is more than could ever be needed
                    [accessToken, tokenType] = [oauthData.access_token, oauthData.token_type];

                    if (accessToken == undefined) return this.sendBody(socket, "auth-failed") // Probably got 401'ed or something

                    sessionId = uuid();
                    this.sessions[sessionId] = {accessToken: accessToken, tokenType: tokenType};

                    socket.emit("session-id", sessionId);
                    runWeb();
                } catch (error) {
                    console.error(error);
                }
            })

            // Or maybe they'll send us a session id
            socket.on("session-id", async id => {
                if (this.sessions[id] == undefined) return socket.emit("get-auth-code");
                ({ accessToken, tokenType } = this.sessions[id]);
                sessionId = id;

                runWeb();
            })

            async function runWeb() {
                const userResult = await fetch('https://discord.com/api/users/@me', {
                    headers: {
                        authorization: `${tokenType} ${accessToken}`,
                    },
                });


                user = await userResult.json();
                if (user.username == undefined) return this.sendBody(socket, "auth-failed") // Probably got 401'ed or something
            }
        })

    }
}