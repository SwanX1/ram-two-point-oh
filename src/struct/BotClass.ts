import chalk from "chalk";
import {
    AkairoClient,
    CommandHandler,
    //InhibitorHandler,
    //ListenerHandler,
} from "discord-akairo";
import PostgreSQLProvider from "../providers/PostgreSQLProvider";
import WebApp from "./web/WebApp";

import { Sql as SQLFunction, Options as PostgresOptions } from "../providers/PostgresTyped";

export interface RamOptions {
    database: PostgresOptions<Record<string, unknown>>;
    clientSecret: string;
}

export default class RamClient extends AkairoClient {
    public commandHandler: CommandHandler;
    //public listenerHandler: ListenerHandler;
    //public inhibitorHandler: InhibitorHandler;

    public web: WebApp;

    public SQLProvider: PostgreSQLProvider;
    public sql: SQLFunction<Record<string, unknown>>;

    public log: typeof console.log;
    public info: typeof console.info;
    public warn: typeof console.warn;
    public error: typeof console.error;
    public fatal: typeof console.error;
    public debug: typeof console.debug;

    public version: string;
    public logPrefix: string;
    public clientSecret: string;

    constructor(options: RamOptions) {
        super(
            {
                ownerID: ["197664739763945472", "688848670833377314"],
            },
            {
                disableMentions: "everyone",
                ws: {
                    intents: [
                        "GUILDS",
                        "GUILD_MEMBERS",
                        "GUILD_BANS",
                        "GUILD_MESSAGES",
                        "GUILD_MESSAGE_REACTIONS",
                    ],
                },
                partials: ["REACTION"],
            }
        );

        this.clientSecret = options.clientSecret;
        this.version = require("../../package.json").version;

        // Logger functions
        this.logPrefix = chalk`{blue [Discord.JS]}`;

        //TODO: Replace these with custom coloring with chalk and writing to files
        this.log = console.log.bind(console, this.logPrefix);
        this.info = console.info.bind(console, this.logPrefix);
        this.warn = console.warn.bind(console, this.logPrefix);
        this.error = console.error.bind(console, this.logPrefix);
        this.fatal = console.error.bind(console, this.logPrefix);
        this.debug = console.debug.bind(console, this.logPrefix);

        this.SQLProvider = new PostgreSQLProvider(options.database);
        this.sql = this.SQLProvider.sql;

        this.commandHandler = new CommandHandler(this, {
            directory: "./commands/",
            prefix: process.env.prefix,
            commandUtil: true,
        });
        /* Disabled to prevent errors when no files in directory
        this.inhibitorHandler = new InhibitorHandler(this, {
        directory: './inhibitors/',
        });

        this.listenerHandler = new ListenerHandler(this, {
        directory: "./listeners/",
        });

        this.commandHandler.useInhibitorHandler(this.inhibitorHandler);
        this.commandHandler.useListenerHandler(this.listenerHandler);
    */
        this.commandHandler.loadAll();
        /* Disabled to prevent errors when no files in directory
        this.inhibitorHandler.loadAll();
        this.listenerHandler.loadAll();

        this.listenerHandler.setEmitters({
        commandHandler: this.commandHandler,
        inhibitorHandler: this.inhibitorHandler,
        listenerHandler: this.listenerHandler,
        });
    */

        this.web = new WebApp(this);
        this.web.app.listen(process.env.PORT);
    }
}
