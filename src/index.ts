import axios from "axios";
import chalk from "chalk";
import dotenv from "dotenv";
import RamBot from "./struct/BotClass";

dotenv.config({ path: "../.env" });

const client = new RamBot({
    database: {
        host: process.env.DB_HOSTNAME,
        port: Number(process.env.DB_PORT),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
    },
    clientSecret: String(process.env.DISCORD_CLIENT_SECRET),
});

client
    .login(process.env.DISCORD_API_KEY)
    .then(() => client.info("Logged in..."))
    .catch((err) => client.fatal("Login failed:", err.message));

client.on("ready", () => {
    if (!client.user) return;
    client.info(`Client ready as ${client.user.tag}`);
    try {
        client.web.app.listen(
            Number(process.env.PORT) || 8080,
            process.env.HOSTNAME || "0.0.0.0",
            () =>
                client.web.info(
                    `Web server listening on port ${process.env.PORT}`
                )
        );
    } catch (err) {
        if (err.code === "EADDRINUSE") {
            client.web.error(`Address ${err.address}:${err.port} is in use`);
        } else {
            client.web.error(err);
        }
    }
});

if (process.argv.includes("--heroku")) {
    setInterval(() => {
        axios
            .get(`http://${process.env.HOSTNAME}:${process.env.PORT}`)
            .then(() => {
                console.log(chalk`{green [Heroku]} Pinged self...`);
            })
            .catch((err) =>
                console.log(
                    chalk`{green [Heroku]} Error thrown while pinging self!`,
                    err
                )
            );
    }, 1200);
}

process.on("SIGUSR2", processShutdown).on("SIGTERM", processShutdown);

function processShutdown() {
    client.log("Graceful shutdown...");
    client.destroy();
    process.exit(0);
}
